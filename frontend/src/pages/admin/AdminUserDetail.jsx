// pages/admin/AdminUserDetail.jsx
// GET /api/admin/users/:id, PATCH block / unblock

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, ErrorBox, StatusBadge } from '../../components/ui/States.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { fmtMoney, fmtDateTime } from '../../utils/format';

export default function AdminUserDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [creditAnalysis, setCreditAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // 'block' | 'unblock'

  const reload = () => {
    setLoading(true); setError('');
    api.admin.getUser(id)
      .then((d) => { setUser(d.user); setWallet(d.wallet); setCreditAnalysis(d.creditAnalysis); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(reload, [id]);

  const doAction = async () => {
    try {
      if (confirmAction === 'block') {
        await api.admin.blockUser(id);
        toast.ok('User blocked');
      } else if (confirmAction === 'unblock') {
        await api.admin.unblockUser(id);
        toast.ok('User unblocked');
      }
      setConfirmAction(null);
      reload();
    } catch (e) { toast.bad(e.message); setConfirmAction(null); }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} />;
  if (!user) return null;

  return (
    <div>
      <PageHeader
        eyebrow="User detail"
        title={user.name}
        subtitle={user.email}
        actions={
          <>
            <Link className="btn btn-ghost" to="/admin/users">← Back</Link>
            {user.status === 'active'
              ? <button className="btn btn-danger" disabled={user.role === 'admin'}
                  onClick={() => setConfirmAction('block')}>Block user</button>
              : <button className="btn btn-primary" onClick={() => setConfirmAction('unblock')}>Unblock user</button>
            }
          </>
        }
      />

      <div className="grid grid-2" style={{ gap: 22 }}>
        <div className="card">
          <h3 className="card-title">Account</h3>
          <Detail label="Role"><span className="badge muted">{user.role}</span></Detail>
          <Detail label="Status"><StatusBadge status={user.status} /></Detail>
          <Detail label="Email">{user.email}</Detail>
          <Detail label="Phone">{user.phone || '—'}</Detail>
          <Detail label="Employer">{user.employerName || '—'}</Detail>
          <Detail label="Employment type">{user.employmentType || '—'}</Detail>
          <Detail label="Monthly income">{user.monthlyIncome ? `PKR ${Number(user.monthlyIncome).toLocaleString('en-PK')}` : '—'}</Detail>
          <Detail label="Created">{fmtDateTime(user.createdAt)}</Detail>
          <Detail label="Last login">{user.lastLogin ? fmtDateTime(user.lastLogin) : 'Never'}</Detail>
        </div>
        <div className="card">
          <h3 className="card-title">Wallet</h3>
          {wallet ? (
            <>
              <Detail label="Balance"><span className="num bold">{fmtMoney(wallet.balance, wallet.currency)}</span></Detail>
              <Detail label="Currency">{wallet.currency}</Detail>
              <Detail label="Status"><StatusBadge status={wallet.status} /></Detail>
              <Detail label="Total deposits"><span className="num">{fmtMoney(wallet.totalDeposits, wallet.currency)}</span></Detail>
              <Detail label="Total withdrawals"><span className="num">{fmtMoney(wallet.totalWithdrawals, wallet.currency)}</span></Detail>
              <Detail label="Transferred in"><span className="num">{fmtMoney(wallet.totalTransfersIn, wallet.currency)}</span></Detail>
              <Detail label="Transferred out"><span className="num">{fmtMoney(wallet.totalTransfersOut, wallet.currency)}</span></Detail>
            </>
          ) : <span className="muted">No wallet found.</span>}
        </div>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <h3 className="card-title">Credit analysis</h3>
        {creditAnalysis ? (
          <div className="grid grid-2" style={{ gap: 18 }}>
            <div>
              <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <span className={`badge ${creditAnalysis.band === 'excellent' ? 'ok' : creditAnalysis.band === 'good' ? 'info' : 'bad'}`}>
                  {creditAnalysis.band}
                </span>
                <span className={`badge ${creditAnalysis.eligible ? 'ok' : 'bad'}`}>
                  {creditAnalysis.eligible ? 'eligible' : 'not eligible'}
                </span>
              </div>
              <Detail label="Score"><span className="kpi" style={{ fontSize: '1.8rem' }}>{creditAnalysis.score}</span></Detail>
              <Detail label="Decision">{creditAnalysis.decision}</Detail>
              <Detail label="Monthly income">{creditAnalysis.metrics.monthlyIncome ? `PKR ${Number(creditAnalysis.metrics.monthlyIncome).toLocaleString('en-PK')}` : '—'}</Detail>
              <Detail label="Expense ratio">{Math.round((creditAnalysis.metrics.expenseRatio || 0) * 100)}%</Detail>
              <Detail label="Suspicious flags">{creditAnalysis.metrics.flaggedCount}</Detail>
            </div>
            <div>
              <div className="kpi-label" style={{ marginBottom: 10 }}>Why this score</div>
              <div className="stack" style={{ gap: 8 }}>
                {creditAnalysis.reasons.map((reason) => (
                  <div key={reason} className="card flat" style={{ padding: '10px 12px', borderRadius: 12 }}>
                    <div className="tiny muted">{reason}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : <span className="muted">No credit analysis available.</span>}
      </div>

      <ConfirmDialog open={!!confirmAction}
        title={confirmAction === 'block' ? 'Block this user?' : 'Unblock this user?'}
        message={confirmAction === 'block'
          ? `${user.name} will no longer be able to sign in or transact.`
          : `${user.name} will regain access immediately.`}
        confirmText={confirmAction === 'block' ? 'Block user' : 'Unblock user'}
        danger={confirmAction === 'block'}
        onConfirm={doAction}
        onCancel={() => setConfirmAction(null)} />

      <style>{`
        .dt-row { display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 10px 0; border-bottom: 1px dashed var(--line); }
        .dt-row:last-child { border-bottom: 0; }
      `}</style>
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div className="dt-row">
      <div className="kpi-label" style={{ marginBottom: 0 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}
