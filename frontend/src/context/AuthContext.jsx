// context/AuthContext.jsx
// --------------------------------------------------------------------
// Wraps the app and exposes:
//   - user: the currently logged-in user (or null)
//   - token: the JWT (or null)
//   - login(payload), register(payload), logout()
//   - refreshUser() — re-fetches /auth/me (used after profile update)
//   - isAdmin
//
// Persists token + user in localStorage so a refresh keeps the session.
// Listens for the `gigcredit:unauthorized` event from the API layer
// so that any 401 boots the user out cleanly.
// --------------------------------------------------------------------

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'gigcredit_token';
const USER_KEY = 'gigcredit_user';

const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser());
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [bootLoading, setBootLoading] = useState(true);

  // Persist helper.
  const persist = useCallback((nextToken, nextUser) => {
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken);
    else localStorage.removeItem(TOKEN_KEY);
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    else localStorage.removeItem(USER_KEY);
    setToken(nextToken || null);
    setUser(nextUser || null);
  }, []);

  // On boot, if we have a token, verify it with /auth/me
  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      if (!token) { setBootLoading(false); return; }
      try {
        const data = await api.auth.me();
        if (!cancelled) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      } catch {
        // 401 already handled by interceptor — make sure state syncs.
        if (!cancelled) persist(null, null);
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    };
    verify();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for unauthorized boot event from API layer
  useEffect(() => {
    const handler = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('gigcredit:unauthorized', handler);
    return () => window.removeEventListener('gigcredit:unauthorized', handler);
  }, []);

  // ---- Actions exposed to components -------------------------------
  const login = async (payload) => {
    const data = await api.auth.login(payload);
    persist(data.token, data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await api.auth.register(payload);
    persist(data.token, data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    persist(null, null);
  };

  const refreshUser = async () => {
    const data = await api.auth.me();
    setUser(data.user);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  };

  const value = {
    user,
    token,
    bootLoading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    login, register, logout, refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
