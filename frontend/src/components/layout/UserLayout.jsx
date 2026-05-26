// components/layout/UserLayout.jsx — GigCredit User Shell
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import Brand from '../ui/Brand.jsx';

const NAV = [
  { to: '/dashboard',     label: 'Dashboard' },
  { to: '/wallet',        label: 'Wallet' },
  { to: '/transactions',  label: 'Transactions' },
  { to: '/expenses',      label: 'Expenses' },
  { to: '/budgets',       label: 'Budgets' },
  { to: '/reports',       label: 'Reports' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile',       label: 'Profile' },
];

export default function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    api.notifications.list()
      .then((data) => {
        if (!alive) return;
        setUnread((data.notifications || []).filter((n) => !n.readStatus).length);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><Brand /></div>
        <nav className="side-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) => 'side-link' + (isActive ? ' active' : '')}
            >
              <span>{item.label}</span>
              {item.to === '/notifications' && unread > 0 && (
                <span className="nav-pill">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="tiny muted">FAST University · Semester 6</div>
          <div className="tiny muted">GigCredit v1.0</div>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <div className="topbar-left">
            <span className="eyebrow">Freelancer</span>
            <span className="topbar-user">{user?.name}</span>
            <span className="muted tiny">· {user?.email}</span>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/profile')}>Profile</button>
            <button className="btn btn-primary btn-sm" onClick={onLogout}>Sign out</button>
          </div>
        </header>
        <main className="page"><Outlet /></main>
      </div>
    </div>
  );
}
