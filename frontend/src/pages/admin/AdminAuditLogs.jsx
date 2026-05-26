// pages/admin/AdminAuditLogs.jsx — GET /api/admin/audit-logs

import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Empty, ErrorBox } from '../../components/ui/States.jsx';
import { fmtDateTime } from '../../utils/format';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.admin.listAuditLogs()
      .then((d) => { if (alive) setLogs(d.logs || []); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Administrator · audit" title="Audit logs"
        subtitle="A timestamped record of every privileged action taken by an administrator." />
      {loading ? <Loader /> :
       error ? <ErrorBox message={error} /> :
       !logs.length ? <Empty title="No audit entries yet" /> :
        <div className="table-wrap">
          <table className="table">
            <thead><tr>
              <th>Time</th><th>Actor</th><th>Action</th><th>Target type</th><th>Target ID</th><th>IP</th>
            </tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id}>
                  <td className="tiny muted">{fmtDateTime(l.createdAt)}</td>
                  <td className="bold">{l.actorId?.name || '—'}<div className="tiny muted">{l.actorId?.email}</div></td>
                  <td><span className="badge muted">{l.action}</span></td>
                  <td className="tiny">{l.targetType || '—'}</td>
                  <td className="mono tiny muted">{l.targetId || '—'}</td>
                  <td className="tiny mono muted">{l.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}
