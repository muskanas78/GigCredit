// pages/admin/AdminWallets.jsx — GET /api/admin/wallets

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Empty, ErrorBox, StatusBadge } from '../../components/ui/States.jsx';
import { fmtMoney } from '../../utils/format';

export default function AdminWallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.admin.listWallets()
      .then((d) => { if (alive) setWallets(d.wallets || []); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const total = wallets.reduce((s, w) => s + Number(w.balance || 0), 0);

  return (
    <div>
      <PageHeader eyebrow="Administrator" title="Wallets"
        subtitle={`System balance across ${wallets.length} wallets: ${fmtMoney(total)}`} />
      {loading ? <Loader /> :
       error ? <ErrorBox message={error} /> :
       !wallets.length ? <Empty title="No wallets yet" /> :
        <div className="table-wrap">
          <table className="table">
            <thead><tr>
              <th>User</th><th>Email</th><th>Currency</th><th>Status</th><th className="right">Balance</th><th></th>
            </tr></thead>
            <tbody>
              {wallets.map((w) => (
                <tr key={w._id}>
                  <td className="bold">{w.userId?.name || '—'}</td>
                  <td className="tiny">{w.userId?.email || '—'}</td>
                  <td>{w.currency}</td>
                  <td><StatusBadge status={w.status} /></td>
                  <td className="right num">{fmtMoney(w.balance, w.currency)}</td>
                  <td className="right">
                    {w.userId && <Link to={`/admin/users/${w.userId._id}`} className="tiny" style={{ color: 'var(--brass)' }}>User →</Link>}
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
