// pages/admin/AdminUsers.jsx
// GET /api/admin/users  with search/status/role filters

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Empty, ErrorBox, StatusBadge } from '../../components/ui/States.jsx';
import { fmtDateTime } from '../../utils/format';

export default function AdminUsers() {
  const [filters, setFilters] = useState({ search: '', status: '', role: '' });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const params = useMemo(() => {
    const p = {}; Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; }); return p;
  }, [filters]);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    api.admin.listUsers(params)
      .then((d) => { if (alive) setUsers(d.users || []); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [params]);

  return (
    <div>
      <PageHeader eyebrow="Administrator" title="Users"
        subtitle="Search and manage every user account in the system." />
      <div className="card flat" style={{ marginBottom: 18 }}>
        <div className="form-grid">
          <div className="field"><label>Search</label>
            <input className="input" placeholder="Name or email"
              value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div>
          <div className="field"><label>Status</label>
            <select className="select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option><option>active</option><option>blocked</option>
            </select></div>
          <div className="field"><label>Role</label>
            <select className="select" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
              <option value="">All</option><option>user</option><option>admin</option>
            </select></div>
        </div>
      </div>

      {loading ? <Loader /> :
       error ? <ErrorBox message={error} /> :
       !users.length ? <Empty title="No users match" /> :
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="bold">{u.name}</td>
                  <td className="tiny">{u.email}</td>
                  <td><span className="badge muted">{u.role}</span></td>
                  <td><StatusBadge status={u.status} /></td>
                  <td className="tiny muted">{fmtDateTime(u.createdAt)}</td>
                  <td className="right">
                    <Link to={`/admin/users/${u._id}`} className="tiny" style={{ color: 'var(--brass)' }}>Open →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}
