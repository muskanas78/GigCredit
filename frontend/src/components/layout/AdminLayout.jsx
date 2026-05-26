// components/layout/AdminLayout.jsx — GigCredit Admin Shell
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Brand from '../ui/Brand.jsx';

const NAV = [
  { to: '/admin',              label: 'Dashboard',    end: true },
  { to: '/admin/users',        label: 'Users' },
  { to: '/admin/wallets',      label: 'Wallets' },
  { to: '/admin/transactions', label: 'Transactions' },
  { to: '/admin/flagged',      label: 'Flagged' },
  { to: '/admin/categories',   label: 'Categories' },
  { to: '/admin/reports',      label: 'Reports' },
  { to: '/admin/audit-logs',   label: 'Audit Logs' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand />
          <div className="eyebrow" style={{ marginTop: 6, fontSize: 10 }}>Admin Panel</div>
        </div>
        <nav className="side-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'side-link' + (isActive ? ' active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="tiny muted">GigCredit Admin</div>
          <div className="tiny muted">FAST Univ · Sem 6</div>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <div className="topbar-left">
            <span className="eyebrow">Admin</span>
            <span className="topbar-user">{user?.name}</span>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onLogout}>Sign out</button>
          </div>
        </header>
        <main className="page"><Outlet /></main>
      </div>
    </div>
  );
}
