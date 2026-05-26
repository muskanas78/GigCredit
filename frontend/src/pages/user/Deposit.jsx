// pages/user/Deposit.jsx
// POST /api/wallet/deposit  { amount, description? }

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { ErrorBox } from '../../components/ui/States.jsx';
import { fmtMoney } from '../../utils/format';

export default function Deposit() {
  const toast = useToast();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const n = Number(amount);
    if (!n || n <= 0) return setError('Enter a positive amount.');

    setSubmitting(true);
    try {
      const data = await api.wallet.deposit({ amount: n, description: description || undefined });
      toast.ok(`Deposited ${fmtMoney(n)}. New balance: ${fmtMoney(data.balance)}`);
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
        eyebrow="Wallet · Deposit"
        title="Add demo funds"
        subtitle="Top up your wallet to test transfers and expenses. This is a sandbox — no real money is moved."
        actions={<Link className="btn btn-ghost" to="/wallet">← Back to wallet</Link>}
      />

      <div className="container-narrow" style={{ padding: 0 }}>
        <div className="card">
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
              <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
                {[1000, 5000, 10000, 25000].map((v) => (
                  <button type="button" key={v}
                    className="btn btn-ghost btn-sm"
                    onClick={() => setAmount(String(v))}>
                    {fmtMoney(v).replace('PKR', 'PKR ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Description (optional)</label>
              <input
                type="text" maxLength={200}
                className="input" placeholder="e.g. Monthly top-up"
                value={description} onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Confirm deposit'}
            </button>
          </form>
        </div>

        <p className="tiny muted" style={{ marginTop: 18 }}>
          Deposits above the configured large-amount threshold may be flagged for review.
          You'll be notified if that happens — the funds still credit immediately.
        </p>
      </div>
    </div>
  );
}
