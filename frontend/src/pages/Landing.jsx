// pages/Landing.jsx — GigCredit Public Homepage
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Brand from '../components/ui/Brand.jsx';

export default function Landing() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const goApp = () => navigate(isAdmin ? '/admin' : '/dashboard');

  return (
    <div className="lp">
      {/* Nav */}
      <nav className="lp-nav">
        <Brand />
        <div className="row" style={{ gap: 14 }}>
          <Link to="/login" className="lp-link">Sign in</Link>
          {!isAuthenticated
            ? <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            : <button className="btn btn-primary btn-sm" onClick={goApp}>Go to app</button>
          }
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero container">
        <div className="hero-text fade-up">
          <div className="eyebrow">Freelance Receivable Factoring</div>
          <h1>
            Get paid now,<br />
            <em style={{ fontStyle: 'italic', color: 'var(--brass)' }}>not in 30 days.</em>
          </h1>
          <p style={{ fontSize: '1.08rem', maxWidth: '54ch', color: 'var(--ink-2)' }}>
            GigCredit advances up to 75% of your pending Upwork or Fiverr earnings
            instantly — so you never wait on escrow again.
          </p>
          <div className="row" style={{ gap: 12, marginTop: 18 }}>
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">Open an account</Link>
                <Link to="/login" className="btn btn-ghost btn-lg">Sign in →</Link>
              </>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={goApp}>Go to app →</button>
            )}
          </div>
          <div className="trust-row">
            <span>JWT-secured sessions</span><span>·</span>
            <span>Bcrypt passwords</span><span>·</span>
            <span>Rule-based fraud detection</span><span>·</span>
            <span>Audited admin actions</span>
          </div>
        </div>

        {/* Mock card */}
        <div className="hero-card fade-up delay-2" aria-hidden="true">
          <div className="mc-head">
            <div>
              <div className="kpi-label">Wallet balance</div>
              <div className="kpi">PKR 63,750<span className="kpi-dec">.00</span></div>
            </div>
            <span className="badge ok">active</span>
          </div>
          <div className="mc-row">
            <div>
              <div className="tiny muted">Advance received</div>
              <div className="mono bold">+ 42,000.00</div>
            </div>
            <div>
              <div className="tiny muted">Outflow this month</div>
              <div className="mono bold">− 18,250.00</div>
            </div>
          </div>
          <div className="mc-tx">
            <div className="mc-tx-row">
              <span className="dot ok"/>
              <span>Advance — Upwork project</span>
              <span className="mono">+42,000</span>
            </div>
            <div className="mc-tx-row">
              <span className="dot info"/>
              <span>Received from Eman F.</span>
              <span className="mono">+8,000</span>
            </div>
            <div className="mc-tx-row">
              <span className="dot warn"/>
              <span>Internet bill</span>
              <span className="mono">−3,500</span>
            </div>
            <div className="mc-tx-row">
              <span className="dot ok"/>
              <span>Repayment — cleared</span>
              <span className="mono">−14,750</span>
            </div>
          </div>
          <div className="mc-foot">
            <div className="tiny muted">Risk score</div>
            <div className="tiny mono" style={{ color: 'var(--ok)' }}>720 — Good ✓</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="lp-feat container">
        <div className="feat fade-up">
          <span className="feat-num">01</span>
          <h3>Instant advance on pending earnings</h3>
          <p>Connect your Upwork or Fiverr profile. GigCredit advances up to 75% of
            pending funds — straight to your wallet, within minutes.</p>
        </div>
        <div className="feat fade-up delay-1">
          <span className="feat-num">02</span>
          <h3>Risk-scored, fraud-protected</h3>
          <p>Six backend suspicious-activity rules flag unusual transfers.
            Every action is logged and visible to you and the admin.</p>
        </div>
        <div className="feat fade-up delay-2">
          <span className="feat-num">03</span>
          <h3>Expenses, budgets, reports</h3>
          <p>Track your monthly spending, set category limits, and view income vs
            outflow charts — everything a freelancer needs to stay financially sharp.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-close container">
        <div className="close-card">
          <div>
            <h2>Start earning liquidity in under a minute.</h2>
            <p className="muted">Demo project — FAST University Islamabad, Semester 6 FinTech. Proposed by Muskan Ahmed, Eman Fatima, Anaya Noor.</p>
          </div>
          {!isAuthenticated
            ? <Link to="/register" className="btn btn-accent btn-lg">Open an account →</Link>
            : <button className="btn btn-accent btn-lg" onClick={goApp}>Go to app →</button>
          }
        </div>
      </section>

      <footer className="lp-foot container">
        <div className="row between">
          <Brand size="sm" />
          <div className="tiny muted">© GigCredit — academic demo. No real money is processed.</div>
        </div>
      </footer>

      <style>{`
        .lp { min-height: 100vh; }
        .lp-nav { display: flex; justify-content: space-between; align-items: center; max-width: 1240px; margin: 0 auto; padding: 22px 28px; }
        .lp-link { font-weight: 500; font-size: 14px; color: var(--ink-2); }
        .lp-link:hover { color: var(--ink); }
        .lp-hero { display: grid; grid-template-columns: 1.2fr 1fr; gap: 56px; align-items: center; padding-top: 60px; padding-bottom: 100px; }
        .hero-text h1 { margin: 12px 0 22px; }
        .trust-row { margin-top: 38px; display: flex; gap: 12px; flex-wrap: wrap; font-size: 12.5px; color: var(--ink-3); font-family: var(--mono); }
        .hero-card { background: linear-gradient(180deg, rgba(10,28,56,0.7), rgba(6,18,36,0.6)); backdrop-filter: blur(8px); color: var(--ink); padding: 28px; border-radius: 14px; border: 1px solid rgba(0,194,168,0.12); box-shadow: 0 28px 80px -30px rgba(0,0,0,.8); position: relative; overflow: hidden; }
        .mc-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; padding-bottom: 22px; border-bottom: 1px solid rgba(0,194,168,.12); }
        .mc-head .kpi-label { color: rgba(200,230,240,.65); }
        .mc-head .kpi { color: var(--ink); font-size: 2rem; }
        .kpi-dec { color: var(--brass-2); font-size: 1.1rem; }
        .mc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 22px; }
        .mc-row .muted { color: rgba(200,230,240,.6); }
        .mc-row .bold { color: var(--ink); font-size: 16px; }
        .mc-tx { display: flex; flex-direction: column; gap: 10px; }
        .mc-tx-row { display: grid; grid-template-columns: 14px 1fr auto; align-items: center; gap: 12px; font-size: 13px; color: rgba(230,245,255,.85); padding: 6px 0; border-bottom: 1px solid rgba(0,194,168,.06); }
        .mc-tx-row:last-child { border-bottom: 0; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.ok { background: #3ecf8e; }
        .dot.info { background: #4da1ff; }
        .dot.warn { background: #f6a623; }
        .mc-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(0,194,168,.12); }
        .mc-foot .muted { color: rgba(200,230,240,.5); font-size: 11px; }
        .lp-feat { display: grid; grid-template-columns: repeat(3, 1fr); gap: 36px; padding: 80px 28px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
        .feat { padding-right: 12px; }
        .feat-num { display: inline-block; font-family: var(--mono); font-size: 11px; color: var(--brass); font-weight: 600; letter-spacing: .15em; margin-bottom: 14px; }
        .feat h3 { font-size: 1.2rem; margin-bottom: 10px; }
        .feat p { color: var(--ink-3); }
        .lp-close { padding: 90px 28px 60px; }
        .close-card { background: var(--surface); border: 1px solid var(--line); padding: 40px 44px; display: flex; align-items: center; justify-content: space-between; gap: 30px; flex-wrap: wrap; box-shadow: var(--shadow-2); border-radius: 16px; }
        .close-card h2 { font-size: 1.7rem; margin-bottom: 4px; }
        .lp-foot { padding: 28px; border-top: 1px solid var(--line); }
        @media (max-width: 900px) {
          .lp-hero { grid-template-columns: 1fr; padding-top: 30px; padding-bottom: 60px; gap: 36px; }
          .lp-feat { grid-template-columns: 1fr; gap: 28px; padding: 50px 28px; }
        }
      `}</style>
    </div>
  );
}
