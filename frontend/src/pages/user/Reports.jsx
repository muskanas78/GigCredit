// pages/user/Reports.jsx — GigCredit Reports
// Income vs outflow chart + budget usage + transaction monthly summary
// + Advance Eligibility Calculator (GigCredit-specific, replaces old rent/loan planner)

import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Empty, ErrorBox, StatusBadge } from '../../components/ui/States.jsx';
import { LineSeries, BarSeries } from '../../components/charts/Charts.jsx';
import { fmtMoney, fmtMonth, monthLabel } from '../../utils/format.js';

export default function Reports() {
  const [io,         setIo]         = useState(null);
  const [budgets,    setBudgets]    = useState([]);
  const [txnMonthly, setTxnMonthly] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // Advance calculator state
  const [pendingEarnings, setPendingEarnings] = useState(60000);
  const [feeRate,         setFeeRate]         = useState(4);
  const [plan,            setPlan]            = useState(null);
  const [planLoading,     setPlanLoading]     = useState(false);
  const [planError,       setPlanError]       = useState('');

  // Load charts data
  useEffect(() => {
    let alive = true;
    Promise.all([
      api.reports.incomeVsExpense(),
      api.reports.budgetUsage(),
      api.transactions.monthlySummary(),
    ]).then(([a, b, c]) => {
      if (!alive) return;
      setIo(a);
      setBudgets(b.budgets || []);
      setTxnMonthly(c.summary || []);
    }).catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // Calculate advance plan
  const calculatePlan = async () => {
    if (!pendingEarnings || pendingEarnings <= 0) {
      setPlanError('Please enter a positive pending earnings amount.');
      return;
    }
    setPlanLoading(true);
    setPlanError('');
    try {
      const d = await api.reports.advancePlan({ pendingEarnings, feeRate });
      setPlan(d.plan);
    } catch (e) {
      setPlanError(e.message || 'Failed to calculate plan.');
    } finally {
      setPlanLoading(false);
    }
  };

  if (loading) return <Loader label="Loading reports…" />;
  if (error)   return <ErrorBox message={error} />;

  // Income vs outflow chart data
  const ioData = (() => {
    const map = {};
    (io?.income  || []).forEach((x) => {
      const k = `${x._id.y}-${String(x._id.m).padStart(2, '0')}`;
      if (!map[k]) map[k] = { label: monthLabel(x._id.y, x._id.m), income: 0, outflow: 0 };
      map[k].income += x.total;
    });
    (io?.outflow || []).forEach((x) => {
      const k = `${x._id.y}-${String(x._id.m).padStart(2, '0')}`;
      if (!map[k]) map[k] = { label: monthLabel(x._id.y, x._id.m), income: 0, outflow: 0 };
      map[k].outflow += x.total;
    });
    return Object.keys(map).sort().map((k) => map[k]);
  })();

  // Transactions by month chart data
  const txnData = (() => {
    const map = {};
    (txnMonthly || []).forEach((x) => {
      const k = `${x._id.y}-${String(x._id.m).padStart(2, '0')}`;
      if (!map[k]) map[k] = { label: monthLabel(x._id.y, x._id.m), deposit: 0, withdrawal: 0, transfer: 0 };
      if (map[k][x._id.type] !== undefined) map[k][x._id.type] = x.total;
    });
    return Object.keys(map).sort().map((k) => map[k]);
  })();

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        subtitle="Track your income, outflow, budget usage, and freelance advance eligibility."
      />

      {/* Income vs Outflow */}
      <div className="card" style={{ marginBottom: 22 }}>
        <h3 className="card-title" style={{ marginBottom: 16 }}>Income vs Outflow</h3>
        {ioData.length ? (
          <LineSeries
            data={ioData}
            xKey="label"
            lines={[
              { key: 'income',  name: 'Income',  color: '#3ecf8e' },
              { key: 'outflow', name: 'Outflow', color: '#f25f5c' },
            ]}
            height={260}
          />
        ) : (
          <Empty title="Not enough data yet" hint="Make a few transactions to see income vs outflow." />
        )}
      </div>

      {/* Transactions + Budget */}
      <div className="grid grid-2" style={{ gap: 22, marginBottom: 22 }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Transactions by type</h3>
          {txnData.length ? (
            <BarSeries
              data={txnData}
              xKey="label"
              bars={[
                { key: 'deposit',    name: 'Deposit',    color: '#3ecf8e' },
                { key: 'withdrawal', name: 'Withdrawal', color: '#f25f5c' },
                { key: 'transfer',   name: 'Transfer',   color: '#f6a623' },
              ]}
              height={240}
            />
          ) : (
            <Empty title="No transactions yet" />
          )}
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Budget usage</h3>
          {budgets.length ? (
            <div className="stack" style={{ gap: 14 }}>
              {budgets.map((b) => {
                const pct   = Math.min(100, ((b.spentAmount || 0) / (b.totalLimit || 1)) * 100);
                const color = pct >= 100 ? 'var(--err)' : pct >= 80 ? 'var(--warn)' : 'var(--ok)';
                return (
                  <div key={b._id}>
                    <div className="row between" style={{ marginBottom: 6 }}>
                      <span className="bold tiny">{fmtMonth(b.month)}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div style={{
                      height: 7, background: 'rgba(255,255,255,.07)',
                      borderRadius: 999,
                    }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: color, borderRadius: 999,
                        transition: 'width .3s ease',
                      }} />
                    </div>
                    <div className="row between" style={{ marginTop: 5 }}>
                      <span className="tiny muted">{fmtMoney(b.spentAmount)} of {fmtMoney(b.totalLimit)}</span>
                      <span className="tiny muted mono">{Math.round(pct)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty title="No budgets set" hint="Create a budget on the Budgets page." />
          )}
        </div>
      </div>

      {/* Advance Eligibility Calculator */}
      <div className="card">
        <div className="row between" style={{ marginBottom: 6 }}>
          <div>
            <h3 className="card-title">Advance eligibility calculator</h3>
            <p className="tiny muted" style={{ marginTop: 4 }}>
              Enter your pending Upwork / Fiverr earnings. GigCredit advances up to 75% minus a flat fee.
            </p>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '14px 0' }} />

        <div className="grid grid-2" style={{ gap: 16, marginBottom: 16 }}>
          <div className="field">
            <label className="label">Pending earnings (PKR)</label>
            <input
              className="input"
              type="number"
              min="1"
              step="1000"
              placeholder="e.g. 60000"
              value={pendingEarnings}
              onChange={(e) => setPendingEarnings(Number(e.target.value))}
            />
            <span className="tiny muted">Total amount pending on your freelance platform</span>
          </div>
          <div className="field">
            <label className="label">Fee rate (%)</label>
            <input
              className="input"
              type="number"
              min="0"
              max="20"
              step="0.5"
              placeholder="e.g. 4"
              value={feeRate}
              onChange={(e) => setFeeRate(Number(e.target.value))}
            />
            <span className="tiny muted">Service fee charged on the advance amount (default 4%)</span>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={calculatePlan}
          disabled={planLoading}
          style={{ marginBottom: 18 }}
        >
          {planLoading ? <span className="spinner" /> : 'Calculate advance'}
        </button>

        {planError && <ErrorBox message={planError} />}

        {plan && !planError && (
          <div>
            {/* Summary cards */}
            <div className="grid grid-4" style={{ gap: 14, marginBottom: 22 }}>
              <PlanCard label="Pending earnings"   value={fmtMoney(plan.pendingEarnings)} />
              <PlanCard label="Max advance (75%)"  value={fmtMoney(plan.maxAdvance)}      highlight />
              <PlanCard label={`Fee (${plan.feeRate}%)`} value={fmtMoney(plan.fee)} />
              <PlanCard label="Net disbursed"      value={fmtMoney(plan.netDisbursed)}    highlight />
            </div>

            {/* Eligibility badge */}
            <div style={{
              padding: '12px 18px',
              borderRadius: 10,
              border: `1px solid ${plan.eligible ? 'rgba(62,207,142,.3)' : 'rgba(242,95,92,.3)'}`,
              background: plan.eligible ? 'rgba(62,207,142,.07)' : 'rgba(242,95,92,.07)',
              marginBottom: 14,
            }}>
              <span style={{
                fontWeight: 700,
                color: plan.eligible ? 'var(--ok)' : 'var(--err)',
              }}>
                {plan.eligible
                  ? `✓ Eligible — you can request up to ${fmtMoney(plan.maxAdvance)}`
                  : `✗ Not eligible — advance amount (${fmtMoney(plan.maxAdvance)}) is below the minimum threshold of ${fmtMoney(plan.minimumThreshold)}`
                }
              </span>
            </div>

            {/* Simple breakdown table */}
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Pending earnings on platform</td>
                    <td className="right num">{fmtMoney(plan.pendingEarnings)}</td>
                  </tr>
                  <tr>
                    <td>Eligible advance ({plan.eligiblePercent}% of pending)</td>
                    <td className="right num" style={{ color: 'var(--ok)', fontWeight: 700 }}>
                      {fmtMoney(plan.maxAdvance)}
                    </td>
                  </tr>
                  <tr>
                    <td>GigCredit service fee ({plan.feeRate}%)</td>
                    <td className="right num" style={{ color: 'var(--warn)' }}>
                      − {fmtMoney(plan.fee)}
                    </td>
                  </tr>
                  <tr style={{ borderTop: '2px solid var(--line)' }}>
                    <td style={{ fontWeight: 700 }}>Net amount disbursed to your wallet</td>
                    <td className="right num" style={{ color: 'var(--brass)', fontWeight: 700, fontSize: '1.05rem' }}>
                      {fmtMoney(plan.netDisbursed)}
                    </td>
                  </tr>
                  <tr>
                    <td className="muted tiny">Minimum advance threshold</td>
                    <td className="right num muted tiny">{fmtMoney(plan.minimumThreshold)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlanCard({ label, value, highlight }) {
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 12,
      border: `1px solid ${highlight ? 'rgba(0,194,168,.25)' : 'var(--line)'}`,
      background: highlight ? 'rgba(0,194,168,.07)' : 'var(--surface)',
    }}>
      <div className="kpi-label" style={{ marginBottom: 6 }}>{label}</div>
      <div className="num bold" style={{
        fontSize: '1.15rem',
        color: highlight ? 'var(--brass)' : 'var(--ink)',
      }}>
        {value}
      </div>
    </div>
  );
}
