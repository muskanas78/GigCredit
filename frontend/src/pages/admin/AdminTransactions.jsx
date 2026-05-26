// pages/admin/AdminTransactions.jsx — GET /api/admin/transactions

import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Empty, ErrorBox, StatusBadge } from '../../components/ui/States.jsx';
import { fmtMoney, fmtDateTime } from '../../utils/format';

export default function AdminTransactions() {
  const [filters, setFilters] = useState({ type: '', status: '', suspicious: '', search: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const params = useMemo(() => {
    const p = {}; Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; }); return p;
  }, [filters]);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    api.admin.listTransactions(params)
      .then((d) => { if (alive) setItems(d.transactions || []); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [params]);

  return (
    <div>
      <PageHeader eyebrow="Administrator" title="Transactions"
        subtitle="System-wide ledger. Filter by type, status, flagged status, or transaction ID." />

      <div className="card flat" style={{ marginBottom: 18 }}>
        <div className="form-grid">
          <div className="field"><label>Type</label>
            <select className="select" value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
              <option value="">All</option>
              {['deposit', 'withdrawal', 'transfer', 'refund', 'fee', 'billPayment'].map((t) => <option key={t}>{t}</option>)}
            </select></div>
          <div className="field"><label>Status</label>
            <select className="select" value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option>
              {['pending', 'successful', 'failed', 'flagged'].map((s) => <option key={s}>{s}</option>)}
            </select></div>
          <div className="field"><label>Suspicious only?</label>
            <select className="select" value={filters.suspicious}
              onChange={(e) => setFilters({ ...filters, suspicious: e.target.value })}>
              <option value="">All</option>
              <option value="true">Suspicious only</option>
            </select></div>
          <div className="field"><label>Search by ID</label>
            <input className="input" placeholder="TXN-…"
              value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div>
        </div>
      </div>

      {loading ? <Loader /> :
       error ? <ErrorBox message={error} /> :
       !items.length ? <Empty title="No transactions match" /> :
        <div className="table-wrap">
          <table className="table">
            <thead><tr>
              <th>Transaction ID</th><th>Type</th><th>Sender</th><th>Receiver</th>
              <th>Date</th><th>Status</th><th className="right">Amount</th>
            </tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t._id} style={t.suspiciousFlag ? { background: '#fff8e9' } : undefined}>
                  <td className="mono tiny">{t.transactionId}</td>
                  <td><span className="badge muted">{t.type}</span></td>
                  <td className="tiny">{t.senderId?.email || '—'}</td>
                  <td className="tiny">{t.receiverId?.email || '—'}</td>
                  <td className="tiny muted">{fmtDateTime(t.createdAt)}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="right num">{fmtMoney(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}
