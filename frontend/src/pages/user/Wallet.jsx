// pages/user/Wallet.jsx
// --------------------------------------------------------------------
// Wallet overview: balance, lifetime totals, recent activity, and
// shortcut buttons to deposit / withdraw / transfer.
// --------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Empty, ErrorBox, StatusBadge } from '../../components/ui/States.jsx';
import { fmtMoney, fmtDateTime } from '../../utils/format';

export default function Wallet() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.wallet.summary()
      .then((d) => { if (alive) setSummary(d); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <Loader label="Loading wallet…" />;
  if (error) return <ErrorBox message={error} />;
  if (!summary) return null;

  return (
    <div>
      <PageHeader
        eyebrow="Your wallet"
        title="Wallet"
        subtitle="Demo funds for testing transfers and expenses. No real money is processed."
        actions={
          <>
            <Link className="btn btn-ghost" to="/wallet/withdraw">Withdraw</Link>
            <Link className="btn btn-ghost" to="/wallet/transfer">Transfer</Link>
            <Link className="btn btn-primary" to="/wallet/deposit">Deposit</Link>
          </>
        }
      />

      <div className="grid grid-2" style={{ gap: 22, marginBottom: 28 }}>
        <div className="card dark" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 240, height: 240,
            background: 'radial-gradient(circle, rgba(212,165,116,.18), transparent 70%)',
          }} />
          <div className="kpi-label" style={{ color: 'rgba(255,255,255,.55)' }}>Available balance</div>
          <div className="kpi" style={{ color: 'var(--bg)', fontSize: '3rem' }}>
            {fmtMoney(summary.balance, summary.currency)}
          </div>
          <div className="row" style={{ marginTop: 18, gap: 10 }}>
            <span className="badge ok">{summary.status}</span>
            <span className="tiny" style={{ color: 'rgba(255,255,255,.55)' }}>Currency: {summary.currency}</span>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Lifetime totals</h3>
          <div className="grid grid-2" style={{ gap: 14 }}>
            <TotalCell label="Deposits"     value={summary.totals.deposits}     currency={summary.currency} />
            <TotalCell label="Withdrawals"  value={summary.totals.withdrawals}  currency={summary.currency} />
            <TotalCell label="Received"     value={summary.totals.transfersIn}  currency={summary.currency} />
            <TotalCell label="Sent"         value={summary.totals.transfersOut} currency={summary.currency} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 12 }}>
          <h3 className="card-title">Recent transactions</h3>
          <Link to="/transactions" className="tiny" style={{ color: 'var(--brass)', fontWeight: 600 }}>View all →</Link>
        </div>
        {summary.recentTransactions?.length ? (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th><th>Type</th><th>Date</th><th>Status</th><th className="right">Amount</th><th></th>
                </tr>
              </thead>
              <tbody>
                {summary.recentTransactions.map((t) => (
                  <tr key={t._id}>
                    <td className="mono tiny">{t.transactionId}</td>
                    <td><span className="badge muted">{t.type}</span></td>
                    <td className="tiny muted">{fmtDateTime(t.createdAt)}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="right num">{fmtMoney(t.amount, summary.currency)}</td>
                    <td className="right">
                      <Link to={`/transactions/${t._id}`} className="tiny" style={{ color: 'var(--brass)' }}>Open →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No activity yet" hint="Make your first deposit to start using your wallet." />
        )}
      </div>
    </div>
  );
}

function TotalCell({ label, value, currency }) {
  return (
    <div>
      <div className="kpi-label">{label}</div>
      <div className="num bold" style={{ fontSize: '1.05rem', marginTop: 6 }}>
        {fmtMoney(value || 0, currency)}
      </div>
    </div>
  );
}
