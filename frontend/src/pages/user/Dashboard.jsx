// pages/user/Dashboard.jsx — GigCredit User Dashboard
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Empty, ErrorBox, StatusBadge } from '../../components/ui/States.jsx';
import { AreaSeries } from '../../components/charts/Charts.jsx';
import { fmtMoney, fmtDateTime, monthLabel, truncate } from '../../utils/format.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.reports.userDashboard()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <Loader label="Loading your dashboard…" />;
  if (error)   return <ErrorBox message={error} />;

  const chartData = (data?.monthlyExpenses || []).map((m) => ({
    label: monthLabel(m._id.y, m._id.m),
    total: m.total,
  }));

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5)  return 'Late night';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div>
      <PageHeader
        eyebrow={greeting}
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}.`}
        subtitle="Your GigCredit dashboard — wallet, recent activity, and advance eligibility at a glance."
      />

      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        <KpiCard eyebrow="Wallet balance" value={fmtMoney(data.walletBalance, data.currency)} link="/wallet" accent />
        <KpiCard eyebrow="Transactions"   value={data.transactionCount} link="/transactions" />
        <KpiCard eyebrow="Currency"       value={data.currency || 'PKR'} />
        <KpiCard eyebrow="Account status" value={user?.status === 'active' ? 'Active ✓' : 'Blocked'} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 22, marginBottom: 28 }}>
        <div className="card">
          <div className="row between" style={{ marginBottom: 10 }}>
            <h3 className="card-title">Advance eligibility</h3>
            <span className="badge info">new</span>
          </div>
          <p className="muted" style={{ marginBottom: 14 }}>
            Enter your pending Upwork or Fiverr earnings to see your eligible advance amount (up to 75%) and fee breakdown.
          </p>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <Link to="/reports" className="btn btn-primary btn-sm">Check eligibility</Link>
            <Link to="/reports" className="btn btn-ghost btn-sm">View reports</Link>
          </div>
        </div>

        <div className="card">
          <div className="row between" style={{ marginBottom: 10 }}>
            <h3 className="card-title">Freelance profile</h3>
            <span className="badge muted">risk scoring</span>
          </div>
          <p className="muted" style={{ marginBottom: 14 }}>
            Keep your platform, income, and employment type updated so your credit analysis stays accurate.
          </p>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <Link to="/profile" className="btn btn-ghost btn-sm">Update profile</Link>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 22, marginBottom: 28 }}>
        <div className="card">
          <div className="row between" style={{ marginBottom: 8 }}>
            <h3 className="card-title">Monthly outflow</h3>
            <span className="tiny muted">last 6 months</span>
          </div>
          {chartData.length ? (
            <AreaSeries data={chartData} xKey="label" areaKey="total" color="#00c2a8" height={220} />
          ) : (
            <Empty title="No expense activity yet" hint="Record an expense to see your monthly trend." />
          )}
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 14 }}>Quick actions</h3>
          <div className="stack" style={{ gap: 10 }}>
            <Link to="/wallet/deposit"  className="btn btn-primary"  style={{ justifyContent: 'space-between' }}><span>Deposit funds</span><span>→</span></Link>
            <Link to="/wallet/withdraw" className="btn btn-ghost"    style={{ justifyContent: 'space-between' }}><span>Withdraw</span><span>→</span></Link>
            <Link to="/wallet/transfer" className="btn btn-ghost"    style={{ justifyContent: 'space-between' }}><span>Send to a user</span><span>→</span></Link>
            <Link to="/expenses"        className="btn btn-ghost"    style={{ justifyContent: 'space-between' }}><span>Log an expense</span><span>→</span></Link>
            <Link to="/budgets"         className="btn btn-ghost"    style={{ justifyContent: 'space-between' }}><span>Manage budgets</span><span>→</span></Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 12 }}>
          <h3 className="card-title">Recent activity</h3>
          <Link to="/transactions" className="tiny" style={{ color: 'var(--brass)', fontWeight: 600 }}>View all →</Link>
        </div>
        {data.recentTransactions?.length ? (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th><th>Description</th><th>Date</th><th>Status</th><th className="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((t) => (
                  <tr key={t._id}>
                    <td><span className="badge muted">{t.type}</span></td>
                    <td>{truncate(t.description || t.transactionId, 40)}</td>
                    <td className="tiny muted">{fmtDateTime(t.createdAt)}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="right num">{fmtMoney(t.amount, data.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No transactions yet" hint="Make your first deposit to get started." />
        )}
      </div>
    </div>
  );
}

function KpiCard({ eyebrow, value, link, accent }) {
  const inner = (
    <div className={'kpi-card' + (accent ? ' accent' : '')}>
      <div className="kpi-label">{eyebrow}</div>
      <div className="kpi" style={{ fontSize: '1.9rem' }}>{value}</div>
      {link && <span className="tiny" style={{ color: 'var(--brass)' }}>View →</span>}
      <style>{`
        .kpi-card { background: var(--surface); border: 1px solid var(--line); padding: 22px; border-radius: 18px; transition: all .15s var(--ease); }
        .kpi-card.accent { background: linear-gradient(160deg, #0a2a1a 0%, #061a10 100%); border-color: rgba(0,194,168,.25); box-shadow: 0 12px 30px rgba(0,0,0,.5); }
        .kpi-card.accent .kpi { color: var(--brass); }
        .kpi-card.accent .kpi-label { color: rgba(200,240,230,.6); }
        .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); }
      `}</style>
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}
