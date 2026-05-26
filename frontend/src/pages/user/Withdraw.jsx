// pages/user/Withdraw.jsx
// POST /api/wallet/withdraw  { amount, description? }

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { ErrorBox } from '../../components/ui/States.jsx';
import { fmtMoney } from '../../utils/format';

export default function Withdraw() {
  const toast = useToast();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [balance, setBalance] = useState(null);
  const [currency, setCurrency] = useState('PKR');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.wallet.get().then((d) => {
      setBalance(d.wallet?.balance ?? 0);
      setCurrency(d.wallet?.currency || 'PKR');
    }).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const n = Number(amount);
    if (!n || n <= 0) return setError('Enter a positive amount.');
    if (balance !== null && n > balance) return setError(`Amount exceeds your available balance (${fmtMoney(balance, currency)}).`);

    setSubmitting(true);
    try {
      const data = await api.wallet.withdraw({ amount: n, description: description || undefined });
      toast.ok(`Withdrew ${fmtMoney(n, currency)}. New balance: ${fmtMoney(data.balance, currency)}`);
      navigate('/wallet', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Wallet · Withdraw"
        title="Withdraw funds"
        subtitle="Remove funds from your demo wallet. The backend rejects requests that exceed your available balance."
        actions={<Link className="btn btn-ghost" to="/wallet">← Back to wallet</Link>}
      />
      <div className="container-narrow" style={{ padding: 0 }}>
        <div className="card">
          {balance !== null && (
            <div className="row between" style={{
              padding: '10px 14px', background: 'var(--surface-2)',
              border: '1px solid var(--line)', borderRadius: 2, marginBottom: 16,
            }}>
              <span className="tiny muted">Available balance</span>
              <span className="num bold">{fmtMoney(balance, currency)}</span>
            </div>
          )}
          <ErrorBox message={error} />
          <form onSubmit={submit}>
            <div className="field">
              <label>Amount</label>
              <input
                type="number" inputMode="decimal" min="0.01" step="0.01"
                className="input" placeholder="0.00"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                required autoFocus
              />
            </div>
            <div className="field">
              <label>Description (optional)</label>
              <input
                type="text" maxLength={200}
                className="input" placeholder="e.g. ATM cash-out"
                value={description} onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Confirm withdrawal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
