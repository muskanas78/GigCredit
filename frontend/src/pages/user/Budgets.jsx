// pages/user/Budgets.jsx
// Monthly budgets — create, list, view current month progress.

import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Empty, ErrorBox, StatusBadge } from '../../components/ui/States.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { fmtMoney, fmtMonth, monthKey } from '../../utils/format';

export default function Budgets() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true); setError('');
    try {
      const [list, cur] = await Promise.all([api.budgets.list(), api.budgets.current()]);
      setItems(list.budgets || []);
      setCurrent(cur.budget);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const saveBudget = async (form) => {
    try {
      if (editing && editing._id) {
        await api.budgets.update(editing._id, {
          totalLimit: Number(form.totalLimit),
          warningThreshold: Number(form.warningThreshold) / 100,
        });
        toast.ok('Budget updated');
      } else {
        await api.budgets.create({
          month: form.month,
          totalLimit: Number(form.totalLimit),
          warningThreshold: Number(form.warningThreshold) / 100,
        });
        toast.ok('Budget created');
      }
      setEditing(null);
      reload();
    } catch (e) { toast.bad(e.message); }
  };

  const onDelete = async () => {
    try {
      await api.budgets.remove(delTarget._id);
      toast.ok('Budget deleted');
      setDelTarget(null);
      reload();
    } catch (e) { toast.bad(e.message); }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Plan ahead"
        title="Budgets"
        subtitle="Set a monthly spending cap and get an early warning before you cross it."
        actions={<button className="btn btn-primary" onClick={() => setEditing({ month: monthKey(), warningThreshold: 80 })}>+ New budget</button>}
      />

      {current && (
        <div className="card" style={{ marginBottom: 22 }}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <div>
              <div className="kpi-label">Current month</div>
              <div className="serif" style={{ fontSize: '1.4rem' }}>{fmtMonth(current.month)}</div>
            </div>
            <StatusBadge status={current.status} />
          </div>
          <ProgressBar spent={current.spentAmount} limit={current.totalLimit} />
          <div className="row between" style={{ marginTop: 8 }}>
            <span className="tiny muted">Spent {fmtMoney(current.spentAmount)} of {fmtMoney(current.totalLimit)}</span>
            <span className="tiny muted">Warning at {Math.round((current.warningThreshold || 0.8) * 100)}%</span>
          </div>
        </div>
      )}

      {loading ? <Loader /> :
       error ? <ErrorBox message={error} /> :
       !items.length ? <Empty title="No budgets yet" hint="Create one to start tracking your monthly spending." /> :
        <div className="grid grid-2" style={{ gap: 16 }}>
          {items.map((b) => (
            <div key={b._id} className="card">
              <div className="row between">
                <div className="serif" style={{ fontSize: '1.1rem' }}>{fmtMonth(b.month)}</div>
                <StatusBadge status={b.status} />
              </div>
              <ProgressBar spent={b.spentAmount} limit={b.totalLimit} />
              <div className="row between" style={{ marginTop: 8 }}>
                <span className="tiny muted">{fmtMoney(b.spentAmount)} / {fmtMoney(b.totalLimit)}</span>
                <div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(b)}>Edit</button>
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: 6, color: 'var(--err)' }}
                    onClick={() => setDelTarget(b)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      }

      {editing && <BudgetModal initial={editing} onCancel={() => setEditing(null)} onSave={saveBudget} />}
      <ConfirmDialog open={!!delTarget} title="Delete this budget?"
        message={delTarget ? fmtMonth(delTarget.month) : ''}
        confirmText="Delete" danger
        onConfirm={onDelete} onCancel={() => setDelTarget(null)} />
    </div>
  );
}

function ProgressBar({ spent, limit }) {
  const pct = Math.min(100, Math.max(0, ((spent || 0) / (limit || 1)) * 100));
  const color = pct >= 100 ? 'var(--err)' : pct >= 80 ? 'var(--warn)' : 'var(--ok)';
  return (
    <div style={{
      height: 8, background: 'rgba(255,255,255,.07)', borderRadius: 999,
      overflow: 'hidden', marginTop: 6,
    }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: color, transition: 'width .35s ease',
      }} />
    </div>
  );
}

function BudgetModal({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({
    month: initial.month || monthKey(),
    totalLimit: initial.totalLimit || '',
    warningThreshold: initial.warningThreshold ? Math.round(initial.warningThreshold * 100) : 80,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{4}-\d{2}$/.test(form.month)) return setError('Month must be in YYYY-MM format.');
    if (!Number(form.totalLimit) || Number(form.totalLimit) < 1) return setError('Enter a budget amount.');
    if (Number(form.warningThreshold) < 1 || Number(form.warningThreshold) > 99) return setError('Warning threshold must be 1–99%.');
    setSubmitting(true);
    try { await onSave(form); }
    catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="cd-back" onClick={onCancel}>
      <div className="cd-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <h3 style={{ fontFamily: 'var(--display)', marginBottom: 14, fontSize: '1.3rem' }}>
          {initial._id ? 'Edit budget' : 'New budget'}
        </h3>
        <ErrorBox message={error} />
        <form onSubmit={submit}>
          <div className="field"><label>Month (YYYY-MM)</label>
            <input className="input" type="month" required value={form.month}
              disabled={!!initial._id}
              onChange={(e) => setForm({ ...form, month: e.target.value })} /></div>
          <div className="field"><label>Total limit (PKR)</label>
            <input className="input" type="number" min="1" step="1" required
              value={form.totalLimit} onChange={(e) => setForm({ ...form, totalLimit: e.target.value })} /></div>
          <div className="field"><label>Warning threshold (% of limit)</label>
            <input className="input" type="number" min="1" max="99" step="1" required
              value={form.warningThreshold}
              onChange={(e) => setForm({ ...form, warningThreshold: e.target.value })} />
            <span className="tiny muted">You'll be marked as <em>nearLimit</em> at this percentage.</span>
          </div>
          <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .cd-back { position: fixed; inset: 0; z-index: 1000;
          background: rgba(11,22,32,.42); backdrop-filter: blur(4px);
          display: grid; place-items: center; padding: 20px; }
        .cd-card { background: var(--surface); padding: 24px 26px;
          border: 1px solid var(--line); border-radius: 3px; width: 100%; max-width: 440px;
          box-shadow: var(--shadow-pop); }
      `}</style>
    </div>
  );
}
