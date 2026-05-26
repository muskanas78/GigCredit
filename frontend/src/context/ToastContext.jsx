// context/ToastContext.jsx
// --------------------------------------------------------------------
// Lightweight toast system. Any component does:
//   const toast = useToast();
//   toast.ok('Saved'); toast.bad('Failed: ...'); toast.warn(...); toast.info(...)
// --------------------------------------------------------------------

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((kind, message, ms = 3500) => {
    const id = ++_id;
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, ms);
  }, []);

  const value = {
    ok:   (m, ms) => push('ok', m, ms),
    bad:  (m, ms) => push('bad', m, ms),
    warn: (m, ms) => push('warn', m, ms),
    info: (m, ms) => push('', m, ms),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-wrap">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
