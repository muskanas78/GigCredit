// pages/admin/AdminDashboard.jsx — GigCredit Admin Overview
// GET /api/admin/dashboard

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, ErrorBox } from '../../components/ui/States.jsx';
import { fmtMoney, fmtNumber } from '../../utils/format.js';

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    let alive = true;
    api.admin.dashboard()
      .then((d) => { if (alive) setStats(d); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <Loader label="Loading admin dashboard…" />;
  if (error)   return <ErrorBox message={error} />;

  const cards = [
    { label: 'Total users',          value: fmtNumber(stats.totalUsers),          link: '/admin/users' },
    { label: 'Active users',         value: fmtNumber(stats.activeUsers) },
    { label: 'Blocked users',        value: fmtNumber(stats.blockedUsers),         link: '/admin/users',        danger: stats.blockedUsers > 0 },
    { label: 'Total transactions',   value: fmtNumber(stats.totalTransactions),   link: '/admin/transactions' },
    { label: 'Flagged transactions', value: fmtNumber(stats.flaggedTransactions), link: '/admin/flagged',      danger: stats.flaggedTransactions > 0 },
    { label: 'Transaction volume',   value: fmtMoney(stats.transactionVolume) },
    { label: 'System balance',       value: fmtMoney(stats.systemBalance),         link: '/admin/wallets' },
    { label: 'Credit reviews',       value: 'View users',                          link: '/admin/users' },
  ];

  const quickLinks = [
    { to: '/admin/users',        title: 'Users',           desc: 'Search, view, block / unblock.' },
    { to: '/admin/transactions', title: 'Transactions',    desc: 'Browse the entire ledger.' },
    { to: '/admin/flagged',      title: 'Flagged',         desc: 'Review suspicious activity.' },
    { to: '/admin/categories',   title: 'Categories',      desc: 'Manage transaction taxonomy.' },
    { to: '/admin/reports',      title: 'Reports',         desc: 'Volume & balance over time.' },
    { to: '/admin/wallets',      title: 'Wallets',         desc: 'View all user wallets.' },
    { to: '/admin/audit-logs',   title: 'Audit logs',      desc: 'Privileged action history.' },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Administrator console"
        title="Overview"
        subtitle="System-wide health, user counts, and transaction signals."
      />

      {/* KPI cards */}
      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        {cards.map((c) => {
          const inner = (
            <div className="card" style={{
              borderLeft: `3px solid ${c.danger ? 'var(--err)' : 'var(--brass)'}`,
              transition: 'all .15s ease',
            }}>
              <div className="kpi-label">{c.label}</div>
              <div className="kpi" style={{ fontSize: '1.7rem' }}>{c.value}</div>
              {c.link && <span className="tiny" style={{ color: 'var(--brass)' }}>View →</span>}
            </div>
          );
          return c.link
            ? <Link key={c.label} to={c.link}>{inner}</Link>
            : <div key={c.label}>{inner}</div>;
        })}
      </div>

      {/* Quick navigation */}
      <div className="grid grid-3" style={{ gap: 16 }}>
        {quickLinks.map((l) => (
          <Link key={l.to} to={l.to} className="card flat">
            <h4>{l.title}</h4>
            <p className="muted" style={{ fontSize: 13 }}>{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
