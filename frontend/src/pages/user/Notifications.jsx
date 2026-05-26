// pages/user/Notifications.jsx
// List + mark read.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Empty, ErrorBox } from '../../components/ui/States.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { fmtDateTime } from '../../utils/format';

const TYPE_BADGE = {
  transaction: 'info',
  security:    'warn',
  account:     'muted',
  system:      'muted',
};

export default function Notifications() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = () => {
    setLoading(true); setError('');
    api.notifications.list()
      .then((d) => setItems(d.notifications || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(reload, []);

  const markOne = async (n) => {
    if (n.readStatus) return;
    try { await api.notifications.markRead(n._id); reload(); } catch (e) { toast.bad(e.message); }
  };
  const markAll = async () => {
    try { await api.notifications.markAllRead(); toast.ok('All marked as read'); reload(); }
    catch (e) { toast.bad(e.message); }
  };

  const unreadCount = items.filter((n) => !n.readStatus).length;

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        subtitle="Account-related events: deposits, transfers, security flags, and system messages."
        actions={unreadCount > 0 && <button className="btn btn-primary" onClick={markAll}>Mark all as read</button>}
      />

      {loading ? <Loader /> :
       error ? <ErrorBox message={error} /> :
       !items.length ? <Empty title="No notifications" hint="When something happens on your account, it'll show up here." /> :
        <div className="stack" style={{ gap: 8 }}>
          {items.map((n) => (
            <div key={n._id}
              className="card flat"
              onClick={() => markOne(n)}
              style={{
                cursor: n.readStatus ? 'default' : 'pointer',
                opacity: n.readStatus ? 0.7 : 1,
                borderLeft: n.readStatus ? '1px solid var(--line)' : '3px solid var(--brass)',
                paddingLeft: n.readStatus ? 24 : 22,
              }}>
              <div className="row between" style={{ marginBottom: 4 }}>
                <div className="row" style={{ gap: 10 }}>
                  <span className={`badge ${TYPE_BADGE[n.type] || 'muted'}`}>{n.type}</span>
                  <span className="bold">{n.title}</span>
                </div>
                <span className="tiny muted">{fmtDateTime(n.createdAt)}</span>
              </div>
              <div className="muted" style={{ fontSize: 14 }}>{n.message}</div>
              {n.relatedTransactionId && (
                <Link to="/transactions" className="tiny" style={{ color: 'var(--brass)' }}>
                  See transaction →
                </Link>
              )}
            </div>
          ))}
        </div>
      }
    </div>
  );
}
