// pages/user/Expenses.jsx
// CRUD for personal expenses + category breakdown chart.

import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Empty, ErrorBox } from '../../components/ui/States.jsx';
import { CategoryPie } from '../../components/charts/Charts.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { fmtMoney, fmtDate } from '../../utils/format';

const PAYMENT_METHODS = ['Wallet', 'Cash', 'Card', 'Other'];

export default function Expenses() {
  const toast = useToast();
  const [filters, setFilters] = useState({ category: '', from: '', to: '', search: '' });
  const [items, setItems] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | expense object
  const [confirmDel, setConfirmDel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const params = useMemo(() => {
    const p = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; });
    return p;
  }, [filters]);

  const reload = async () => {
    setLoading(true); setError('');
    try {
      const [list, cat] = await Promise.all([
        api.expenses.list(params),
        api.expenses.categorySummary(),
      ]);
      setItems(list.expenses || []);
      setByCategory((cat.summary || []).map((c) => ({ name: c._id, value: c.total })));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, [params]); // eslint-disable-line

  const onSave = async (form) => {
    try {
      if (editing && editing._id) {
        await api.expenses.update(editing._id, form);
        toast.ok('Expense updated');
      } else {
        await api.expenses.create(form);
        toast.ok('Expense added');
      }
      setEditing(null);
      reload();
    } catch (e) { toast.bad(e.message); }
  };

  const onDelete = async () => {
    try {
      await api.expenses.remove(confirmDel._id);
      toast.ok('Expense deleted');
      setConfirmDel(null);
      reload();
    } catch (e) { toast.bad(e.message); }
  };

  const total = items.reduce((s, x) => s + Number(x.amount || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Personal finance"
        title="Expenses"
        subtitle="Log your spending. Categorized expenses feed into your budgets and monthly reports."
        actions={<button className="btn btn-primary" onClick={() => setEditing({ paymentMethod: 'Wallet' })}>+ Add expense</button>}
      />

      <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 22, marginBottom: 22 }}>
        <div className="card flat">
          <div className="form-grid">
            <div className="field"><label>Category</label>
              <input className="input" placeholder="any" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} /></div>
            <div className="field"><label>Search</label>
              <input className="input" placeholder="Title…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div>
            <div className="field"><label>From</label>
              <input className="input" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></div>
            <div className="field"><label>To</label>
              <input className="input" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></div>
          </div>
          <div className="row between" style={{ marginTop: 6 }}>
            <span className="tiny muted">{items.length} items shown · total {fmtMoney(total)}</span>
            <button className="btn btn-ghost btn-sm"
              onClick={() => setFilters({ category: '', from: '', to: '', search: '' })}>Reset</button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">By category</h3>
          {byCategory.length ? (
            <CategoryPie data={byCategory} height={220} />
          ) : (
            <Empty title="Nothing to chart" hint="Log expenses to see a breakdown." />
          )}
        </div>
      </div>

      {loading ? <Loader /> :
       error ? <ErrorBox message={error} /> :
       !items.length ? <Empty title="No expenses yet" hint="Add your first expense to start tracking." /> :
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Title</th><th>Category</th><th>Method</th><th>Date</th><th className="right">Amount</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x._id}>
                  <td>{x.title}</td>
                  <td><span className="badge muted">{x.category || 'general'}</span></td>
                  <td className="tiny">{x.paymentMethod}</td>
                  <td className="tiny muted">{fmtDate(x.date)}</td>
                  <td className="right num bold">{fmtMoney(x.amount)}</td>
                  <td className="right">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(x)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 6, color: 'var(--err)' }}
                      onClick={() => setConfirmDel(x)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }

      {editing && <ExpenseModal initial={editing} onCancel={() => setEditing(null)} onSave={onSave} />}
      <ConfirmDialog open={!!confirmDel} title="Delete this expense?"
        message={confirmDel ? `"${confirmDel.title}" — ${fmtMoney(confirmDel.amount)}` : ''}
        confirmText="Delete" danger
        onConfirm={onDelete} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}

function ExpenseModal({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({
    title: initial.title || '',
    amount: initial.amount || '',
    category: initial.category || 'general',
    paymentMethod: initial.paymentMethod || 'Wallet',
    date: initial.date ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    notes: initial.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Title is required.');
    const n = Number(form.amount);
    if (!n || n <= 0) return setError('Amount must be greater than zero.');
    setSubmitting(true);
    try {
      await onSave({ ...form, amount: n, date: new Date(form.date).toISOString() });
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  return (
    <div className="cd-back" onClick={onCancel}>
      <div className="cd-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <h3 style={{ fontFamily: 'var(--display)', marginBottom: 14, fontSize: '1.3rem' }}>
          {initial._id ? 'Edit expense' : 'Add expense'}
        </h3>
        <ErrorBox message={error} />
        <form onSubmit={submit}>
          <div className="field"><label>Title</label>
            <input className="input" required maxLength={120} value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="form-grid">
            <div className="field"><label>Amount</label>
              <input className="input" type="number" min="0.01" step="0.01" required
                value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="field"><label>Category</label>
              <input className="input" maxLength={50} value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div className="field"><label>Payment method</label>
              <select className="select" value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                {PAYMENT_METHODS.map((p) => <option key={p}>{p}</option>)}
              </select></div>
            <div className="field"><label>Date</label>
              <input className="input" type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <div className="field"><label>Notes (optional)</label>
            <textarea className="textarea" maxLength={500} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .cd-back {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(11,22,32,.42);
          backdrop-filter: blur(4px);
          display: grid; place-items: center;
          padding: 20px;
        }
        .cd-card {
          background: var(--surface); padding: 24px 26px;
          border: 1px solid var(--line); border-radius: 3px;
          width: 100%; max-width: 440px;
          box-shadow: var(--shadow-pop);
          max-height: 92vh; overflow-y: auto;
        }
      `}</style>
    </div>
  );
}
