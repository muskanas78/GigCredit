// pages/user/Receipt.jsx
// GET /api/transactions/:id/receipt — print-friendly view.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { Loader, ErrorBox, StatusBadge } from '../../components/ui/States.jsx';
import { fmtMoney, fmtDateTime } from '../../utils/format';
import Brand from '../../components/ui/Brand.jsx';

export default function Receipt() {
  const { id } = useParams();
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.transactions.receipt(id)
      .then((d) => { if (alive) setTxn(d.transaction); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} />;
  if (!txn) return null;

  return (
    <div>
      <div className="row between no-print" style={{ marginBottom: 22 }}>
        <Link className="btn btn-ghost" to={`/transactions/${id}`}>← Back to transaction</Link>
        <button className="btn btn-primary" onClick={() => window.print()}>Print / save as PDF</button>
      </div>

      <div className="receipt card" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="row between" style={{ marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
          <div>
            <div className="serif" style={{ fontSize: '1.6rem', letterSpacing: '-.01em' }}>GigCredit</div>
            <div className="tiny muted">Official transaction receipt</div>
          </div>
          <div className="right">
            <div className="kpi-label">Receipt #</div>
            <div className="mono bold">{txn.transactionId}</div>
          </div>
        </div>

        <div className="grid grid-2" style={{ gap: 18, marginBottom: 22 }}>
          <Detail label="Date" value={fmtDateTime(txn.createdAt)} />
          <Detail label="Type" value={<span className="badge muted">{txn.type}</span>} />
          <Detail label="Status" value={<StatusBadge status={txn.status} />} />
          <Detail label="Category" value={txn.category || 'general'} />
        </div>

        <div className="card flat" style={{ textAlign: 'center', padding: '32px 22px', marginBottom: 22 }}>
          <div className="kpi-label">Amount</div>
          <div className="kpi" style={{ fontSize: '3.2rem' }}>{fmtMoney(txn.amount)}</div>
        </div>

        <div className="grid grid-2" style={{ gap: 18, marginBottom: 22 }}>
          <Detail label="Sender" value={
            txn.senderId
              ? <><div className="bold">{txn.senderId.name || '—'}</div><div className="tiny muted">{txn.senderId.email}</div></>
              : <span className="muted">— external / system —</span>
          } />
          <Detail label="Receiver" value={
            txn.receiverId
              ? <><div className="bold">{txn.receiverId.name || '—'}</div><div className="tiny muted">{txn.receiverId.email}</div></>
              : <span className="muted">— external / system —</span>
          } />
        </div>

        {txn.description && (
          <div style={{ marginBottom: 22 }}>
            <div className="kpi-label">Description</div>
            <div>{txn.description}</div>
          </div>
        )}

        {txn.suspiciousFlag && (
          <div className="card flat" style={{ background: '#fff8e9', borderColor: '#f4dba8', marginBottom: 22 }}>
            <div className="bold" style={{ color: 'var(--warn)' }}>Flagged for review</div>
            <ul style={{ margin: '6px 0 0 18px', color: 'var(--ink-2)' }}>
              {(txn.suspiciousReasons || []).map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        <div style={{
          paddingTop: 16, borderTop: '1px dashed var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Brand size="sm" />
          <div className="tiny muted">Issued electronically · Academic demo · No legal validity</div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="kpi-label">{label}</div>
      <div style={{ marginTop: 4 }}>{value}</div>
    </div>
  );
}
