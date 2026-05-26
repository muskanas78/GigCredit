// pages/user/Transactions.jsx
// GET /api/transactions  with type/status/from/to/search filters

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Empty, ErrorBox, StatusBadge } from '../../components/ui/States.jsx';
import { fmtMoney, fmtDateTime } from '../../utils/format';
import { useAuth } from '../../context/AuthContext.jsx';

const TYPES = ['', 'deposit', 'withdrawal', 'transfer', 'refund', 'fee', 'billPayment'];
const STATUSES = ['', 'pending', 'successful', 'failed', 'flagged'];

export default function Transactions() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ type: '', status: '', search: '', from: '', to: '' });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const params = useMemo(() => {
    const p = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; });
    return p;
  }, [filters]);

  const reload = () => {
    setLoading(true); setError('');
    api.transactions.list(params)
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(reload, [params]); // eslint-disable-line

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <div>
      <PageHeader
        eyebrow="Activity"
        title="Transactions"
        subtitle="Every deposit, withdrawal, and transfer on your account, with full filtering."
      />

      <div className="card flat" style={{ marginBottom: 22 }}>
        <div className="form-grid">
          <div className="field">
            <label>Type</label>
            <select className="select" value={filters.type} onChange={set('type')}>
              {TYPES.map((t) => <option key={t} value={t}>{t || 'All types'}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select className="select" value={filters.status} onChange={set('status')}>
              {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
            </select>
          </div>
          <div className="field">
            <label>From date</label>
            <input className="input" type="date" value={filters.from} onChange={set('from')} />
          </div>
          <div className="field">
            <label>To date</label>
            <input className="input" type="date" value={filters.to} onChange={set('to')} />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Search</label>
          <input className="input" placeholder="Transaction ID or description"
            value={filters.search} onChange={set('search')} />
        </div>
      </div>

      {loading ? <Loader /> :
       error ? <ErrorBox message={error} /> :
       !data?.transactions?.length ? <Empty title="No transactions match" hint="Try clearing the filters." /> :
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Counterparty</th>
                <th>Date</th>
                <th>Status</th>
                <th className="right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((t) => {
                const isOutgoing = t.senderId?._id === user?._id || t.senderId === user?._id;
                const counterparty = isOutgoing
                  ? (t.receiverId?.name || t.receiverId?.email || (t.type === 'withdrawal' ? '— external —' : '—'))
                  : (t.senderId?.name || t.senderId?.email || (t.type === 'deposit' ? '— external —' : '—'));
                return (
                  <tr key={t._id}>
                    <td className="mono tiny">{t.transactionId}</td>
                    <td><span className="badge muted">{t.type}</span></td>
                    <td className="tiny">{counterparty}</td>
                    <td className="tiny muted">{fmtDateTime(t.createdAt)}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="right num" style={{ color: isOutgoing ? 'var(--err)' : 'var(--ok)' }}>
                      {isOutgoing ? '−' : '+'} {fmtMoney(t.amount).replace('PKR', '').trim()}
                    </td>
                    <td className="right">
                      <Link to={`/transactions/${t._id}`} className="tiny" style={{ color: 'var(--brass)' }}>Open →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}
