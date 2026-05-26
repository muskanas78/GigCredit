// pages/admin/AdminCategories.jsx
// Admin manages categories. Backend has create / update / disable. To LIST,
// we use the public /api/categories (active only); inactive categories
// won't appear there, which is intentional — they're hidden from users.

import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Empty, ErrorBox } from '../../components/ui/States.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { ErrorBox as Box } from '../../components/ui/States.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { fmtDateTime } from '../../utils/format';

const TYPES = ['transaction', 'expense', 'budget'];

export default function AdminCategories() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [disableTarget, setDisableTarget] = useState(null);

  const reload = () => {
    setLoading(true); setError('');
    api.categories.listActive()
      .then((d) => setItems(d.categories || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const onSave = async (form) => {
    try {
      if (editing && editing._id) {
        await api.admin.updateCategory(editing._id, form);
        toast.ok('Category updated');
      } else {
        await api.admin.createCategory(form);
        toast.ok('Category created');
      }
      setEditing(null);
      reload();
    } catch (e) { toast.bad(e.message); }
  };

  const onDisable = async () => {
    try {
      await api.admin.disableCategory(disableTarget._id);
      toast.ok('Category disabled');
      setDisableTarget(null);
      reload();
    } catch (e) { toast.bad(e.message); }
  };

  return (
    <div>
      <PageHeader eyebrow="Administrator" title="Categories"
        subtitle="Manage the taxonomy used by transactions, expenses, and budgets."
        actions={<button className="btn btn-primary" onClick={() => setEditing({ type: 'expense' })}>+ New category</button>}
      />

      {loading ? <Loader /> :
       error ? <ErrorBox message={error} /> :
       !items.length ? <Empty title="No active categories" hint="Create one to get started." /> :
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Type</th><th>Description</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id}>
                  <td className="bold">{c.name}</td>
                  <td><span className="badge muted">{c.type}</span></td>
                  <td className="tiny muted">{c.description || '—'}</td>
                  <td className="tiny muted">{fmtDateTime(c.createdAt)}</td>
                  <td className="right">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 6, color: 'var(--err)' }}
                      onClick={() => setDisableTarget(c)}>Disable</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }

      {editing && <CategoryModal initial={editing} onSave={onSave} onCancel={() => setEditing(null)} />}
      <ConfirmDialog open={!!disableTarget} title="Disable this category?"
        message={disableTarget ? `"${disableTarget.name}" will be hidden from users. Past references remain.` : ''}
        confirmText="Disable" danger
        onConfirm={onDisable} onCancel={() => setDisableTarget(null)} />
    </div>
  );
}

function CategoryModal({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    type: initial.type || 'expense',
    description: initial.description || '',
    isActive: initial.isActive !== false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required.');
    setSubmitting(true);
    try { await onSave(form); }
    catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="cd-back" onClick={onCancel}>
      <div className="cd-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h3 style={{ fontFamily: 'var(--display)', marginBottom: 14, fontSize: '1.3rem' }}>
          {initial._id ? 'Edit category' : 'New category'}
        </h3>
        <Box message={error} />
        <form onSubmit={submit}>
          <div className="field"><label>Name</label>
            <input className="input" required maxLength={50}
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Type</label>
            <select className="select" value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select></div>
          <div className="field"><label>Description</label>
            <textarea className="textarea" maxLength={200} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
          border: 1px solid var(--line); border-radius: 3px;
          width: 100%; max-width: 460px; box-shadow: var(--shadow-pop); }
      `}</style>
    </div>
  );
}
