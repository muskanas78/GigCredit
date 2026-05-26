// components/ui/ConfirmDialog.jsx
// Tiny confirm modal. Mount once per page; control with `open` prop.

export default function ConfirmDialog({
  open, title = 'Are you sure?', message, confirmText = 'Confirm',
  cancelText = 'Cancel', onConfirm, onCancel, danger = false,
}) {
  if (!open) return null;
  return (
    <div className="cd-back" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="cd-card" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'var(--display)', marginBottom: 8 }}>{title}</h3>
        {message && <p style={{ color: 'var(--ink-3)' }}>{message}</p>}
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onCancel}>{cancelText}</button>
          <button
            className={'btn ' + (danger ? 'btn-danger' : 'btn-primary')}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        .cd-back {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(11,22,32,.42);
          backdrop-filter: blur(4px);
          display: grid; place-items: center;
          padding: 20px;
          animation: fadeUp .15s var(--ease);
        }
        .cd-card {
          background: var(--surface);
          padding: 24px 26px;
          border: 1px solid var(--line);
          border-radius: 3px;
          width: 100%; max-width: 440px;
          box-shadow: var(--shadow-pop);
        }
      `}</style>
    </div>
  );
}
