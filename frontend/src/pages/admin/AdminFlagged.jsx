// pages/admin/AdminFlagged.jsx — GET /api/admin/transactions/flagged

import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Empty, ErrorBox, StatusBadge } from '../../components/ui/States.jsx';
import { fmtMoney, fmtDateTime } from '../../utils/format';

export default function AdminFlagged() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.admin.listFlagged()
      .then((d) => { if (alive) setItems(d.transactions || []); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Administrator · risk" title="Flagged transactions"
        subtitle="Transactions automatically flagged by the suspicious-rules engine. Review reasons and take action where needed." />
      {loading ? <Loader /> :
       error ? <ErrorBox message={error} /> :
       !items.length ? <Empty title="Nothing flagged" hint="The system hasn't seen any suspicious activity." /> :
        <div className="stack" style={{ gap: 12 }}>
          {items.map((t) => (
            <div key={t._id} className="card" style={{ borderLeft: '3px solid var(--warn)' }}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <div className="row" style={{ gap: 10 }}>
                  <span className="mono tiny">{t.transactionId}</span>
                  <span className="badge muted">{t.type}</span>
                  <StatusBadge status={t.status} />
                </div>
                <div className="num bold">{fmtMoney(t.amount)}</div>
              </div>
              <div className="grid grid-2" style={{ gap: 10, marginBottom: 8 }}>
                <div className="tiny">Sender: <span className="bold">{t.senderId?.email || '—'}</span></div>
                <div className="tiny">Receiver: <span className="bold">{t.receiverId?.email || '—'}</span></div>
              </div>
              <div className="tiny muted" style={{ marginBottom: 6 }}>{fmtDateTime(t.createdAt)}</div>
              {(t.suspiciousReasons || []).length > 0 && (
                <div className="card flat" style={{ background: '#fff8e9', padding: '10px 14px' }}>
                  <div className="kpi-label" style={{ marginBottom: 4 }}>Why it was flagged</div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-2)' }}>
                    {t.suspiciousReasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      }
    </div>
  );
}
