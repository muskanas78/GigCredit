// components/ui/States.jsx — Loader / Empty / ErrorBox helpers.

export function Loader({ label = 'Loading…', minHeight = 220 }) {
  return (
    <div style={{
      display: 'grid', placeItems: 'center', minHeight,
      color: 'var(--ink-3)', gap: 10,
    }}>
      <span className="spinner lg" />
      <div className="tiny">{label}</div>
    </div>
  );
}

export function Empty({ title = 'Nothing here yet', hint, action }) {
  return (
    <div className="empty">
      <div className="empty-mark">·</div>
      <div className="serif" style={{ fontSize: '1.3rem', color: 'var(--ink-2)', marginBottom: 6 }}>{title}</div>
      {hint && <div className="muted" style={{ marginBottom: 16 }}>{hint}</div>}
      {action}
    </div>
  );
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div style={{
      padding: '12px 14px', background: 'rgba(242,95,92,.1)',
      color: 'var(--err)', border: '1px solid rgba(242,95,92,.25)', borderRadius: 2,
      fontSize: 13.5, marginBottom: 14,
    }}>
      {message}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    successful: 'ok',
    pending:    'warn',
    failed:     'err',
    flagged:    'warn',
    active:     'ok',
    blocked:    'err',
    safe:       'ok',
    nearLimit:  'warn',
    exceeded:   'err',
    frozen:     'err',
  };
  const cls = map[status] || 'muted';
  return <span className={`badge ${cls}`}>{status || '—'}</span>;
}
