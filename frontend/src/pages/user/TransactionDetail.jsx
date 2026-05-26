// pages/user/TransactionDetail.jsx
// GET /api/transactions/:id

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, ErrorBox, StatusBadge } from '../../components/ui/States.jsx';
import { fmtMoney, fmtDateTime } from '../../utils/format';

export default function TransactionDetail() {
  const { id } = useParams();
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.transactions.getOne(id)
      .then((d) => { if (alive) setTxn(d.transaction); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} />;
  if (!txn) return null;

  const Row = ({ label, children, mono }) => (
    <div className="dt-row">
      <div className="kpi-label">{label}</div>
      <div className={mono ? 'mono' : ''}>{children}</div>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Transaction"
        title={txn.transactionId}
        subtitle="Full details for this transaction."
        actions={
          <>
            <Link className="btn btn-ghost" to="/transactions">← Back</Link>
            <Link className="btn btn-primary" to={`/transactions/${txn._id}/receipt`}>View receipt</Link>
          </>
        }
      />

      <div className="grid grid-2" style={{ gap: 22 }}>
        <div className="card">
          <h3 className="card-title">Summary</h3>
          <Row label="Type"><span className="badge muted">{txn.type}</span></Row>
          <Row label="Status"><StatusBadge status={txn.status} /></Row>
          <Row label="Amount" mono><span className="bold">{fmtMoney(txn.amount)}</span></Row>
          <Row label="Created"><span className="tiny muted">{fmtDateTime(txn.createdAt)}</span></Row>
          {txn.description && <Row label="Description">{txn.description}</Row>}
        </div>

        <div className="card">
          <h3 className="card-title">Parties</h3>
          <Row label="Sender">
            {txn.senderId
              ? <div><div className="bold">{txn.senderId.name || '—'}</div><div className="tiny muted">{txn.senderId.email}</div></div>
              : <span className="muted">— external / system —</span>}
          </Row>
          <Row label="Receiver">
            {txn.receiverId
              ? <div><div className="bold">{txn.receiverId.name || '—'}</div><div className="tiny muted">{txn.receiverId.email}</div></div>
              : <span className="muted">— external / system —</span>}
          </Row>
          <Row label="Category">{txn.category || 'general'}</Row>
        </div>
      </div>

      {(txn.suspiciousFlag || txn.failureReason) && (
        <div className="card" style={{ marginTop: 22, borderColor: 'var(--warn-soft)', background: '#fff8e9' }}>
          <h3 className="card-title">Flags & notes</h3>
          {txn.suspiciousFlag && (
            <div style={{ marginBottom: 10 }}>
              <span className="badge warn">flagged</span>
              <ul style={{ margin: '8px 0 0 18px', color: 'var(--ink-2)' }}>
                {(txn.suspiciousReasons || []).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
          {txn.failureReason && (
            <div className="tiny" style={{ color: 'var(--err)' }}>
              <span className="bold">Failure reason: </span>{txn.failureReason}
            </div>
          )}
        </div>
      )}

      <style>{`
        .dt-row {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; padding: 10px 0;
          border-bottom: 1px dashed var(--line);
        }
        .dt-row:last-child { border-bottom: 0; }
        .dt-row .kpi-label { margin-bottom: 0; flex-shrink: 0; }
      `}</style>
    </div>
  );
}
