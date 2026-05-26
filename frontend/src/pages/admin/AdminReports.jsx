// pages/admin/AdminReports.jsx — System-wide analytics for admin
// GET /api/admin/reports/transaction-volume + /system-balance

import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Empty, ErrorBox } from '../../components/ui/States.jsx';
import { BarSeries, CategoryPie } from '../../components/charts/Charts.jsx';
import { fmtMoney, monthLabel } from '../../utils/format.js';

export default function AdminReports() {
  const [vol,     setVol]     = useState([]);
  const [bal,     setBal]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([api.admin.transactionVolume(), api.admin.systemBalance()])
      .then(([a, b]) => {
        if (!alive) return;
        // Backend returns { data } and { wallets } — axios interceptor already unwraps the envelope
        setVol(a.data    || []);
        setBal(b.wallets || []);
      })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <Loader label="Loading system reports…" />;
  if (error)   return <ErrorBox message={error} />;

  // Roll up transaction volume by month
  const volChartData = (() => {
    const map = {};
    (vol || []).forEach((x) => {
      const k = `${x._id.y}-${String(x._id.m).padStart(2, '0')}`;
      if (!map[k]) map[k] = { label: monthLabel(x._id.y, x._id.m), deposit: 0, withdrawal: 0, transfer: 0 };
      const type = x._id.type;
      if (map[k][type] !== undefined) map[k][type] = x.total;
    });
    return Object.keys(map).sort().map((k) => map[k]);
  })();

  // Pie data: wallet balance by status
  const balData = (bal || []).map((b) => ({
    name:  b._id || 'unknown',
    value: b.total  || 0,
    count: b.count  || 0,
  })).filter((b) => b.value > 0);

  return (
    <div>
      <PageHeader
        eyebrow="Administrator · reports"
        title="System reports"
        subtitle="Transaction volume by month and wallet balance distribution."
      />

      {/* Volume bar chart */}
      <div className="card" style={{ marginBottom: 22 }}>
        <h3 className="card-title" style={{ marginBottom: 16 }}>
          Transaction volume by month &amp; type
        </h3>
        {volChartData.length ? (
          <BarSeries
            data={volChartData}
            xKey="label"
            bars={[
              { key: 'deposit',    name: 'Deposit',    color: '#3ecf8e' },
              { key: 'withdrawal', name: 'Withdrawal', color: '#f25f5c' },
              { key: 'transfer',   name: 'Transfer',   color: '#f6a623' },
            ]}
            height={280}
          />
        ) : (
          <Empty
            title="No transaction data yet"
            hint="Volume will appear here once users start making transactions."
          />
        )}
      </div>

      {/* Pie + table */}
      <div className="grid grid-2" style={{ gap: 22 }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>
            System balance by wallet status
          </h3>
          {balData.length ? (
            <CategoryPie data={balData} height={260} />
          ) : (
            <Empty title="No wallet data" />
          )}
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>
            Wallet status breakdown
          </h3>
          {bal.length ? (
            <div className="stack" style={{ gap: 10 }}>
              {bal.map((b) => (
                <div
                  key={b._id}
                  className="row between"
                  style={{
                    padding: '12px 16px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                  }}
                >
                  <div>
                    <div className="bold" style={{ textTransform: 'capitalize' }}>
                      {b._id || 'unknown'}
                    </div>
                    <div className="tiny muted">{b.count} wallet{b.count !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="num bold" style={{ color: 'var(--brass)', fontSize: '1.05rem' }}>
                    {fmtMoney(b.total)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No data" />
          )}
        </div>
      </div>
    </div>
  );
}
