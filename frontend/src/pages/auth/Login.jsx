// pages/auth/Login.jsx

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Brand from '../../components/ui/Brand.jsx';
import { ErrorBox } from '../../components/ui/States.jsx';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      toast.ok(`Welcome back, ${user.name.split(' ')[0]}`);
      const dest = location.state?.from || (user.role === 'admin' ? '/admin' : '/dashboard');
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-frame">
        <Link to="/"><Brand size="lg" /></Link>
        <h2 style={{ marginTop: 28, marginBottom: 6, fontSize: '1.7rem', fontWeight: 400 }}>
          Sign in to your account
        </h2>
        <p className="muted" style={{ marginBottom: 24 }}>
          Welcome back. Continue where you left off.
        </p>

        <ErrorBox message={error} />

        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="At least 6 characters"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
          >
            {submitting ? <span className="spinner" /> : 'Sign in'}
          </button>
        </form>

        <p className="muted tiny" style={{ marginTop: 22 }}>
          New to GigCredit? <Link to="/register" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>Create an account</Link>
        </p>
      </div>

      <div className="auth-side" aria-hidden="true">
        <div className="auth-quote">
          <span className="eyebrow" style={{ color: 'var(--brass-2)' }}>GigCredit</span>
          <h3 style={{ color: '#fff', fontSize: '1.6rem', margin: '12px 0 14px', fontWeight: 400 }}>
            "A clean ledger is the start of a calm mind."
          </h3>
          <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 14 }}>
            Every transaction is signed, hashed, and recorded. Suspicious activity
            is flagged for you, never silently absorbed.
          </p>
        </div>
      </div>

      <style>{`
        .auth {
          min-height: 100vh;
          display: grid; grid-template-columns: 1fr 1fr;
        }
        .auth-frame {
          padding: 56px 64px;
          max-width: 540px; margin: 0 auto;
          width: 100%;
          align-self: center;
        }
        .auth-side {
          background: linear-gradient(160deg, #0b1620 0%, #1a2331 80%);
          color: #fff;
          padding: 56px;
          display: flex; align-items: flex-end;
          position: relative; overflow: hidden;
        }
        .auth-side::before {
          content: '';
          position: absolute; top: -10%; right: -20%;
          width: 70%; height: 60%;
          background: radial-gradient(circle, rgba(212,165,116,.20), transparent 70%);
        }
        .auth-quote { position: relative; max-width: 480px; }

        @media (max-width: 900px) {
          .auth { grid-template-columns: 1fr; }
          .auth-side { display: none; }
          .auth-frame { padding: 36px 24px; }
        }
      `}</style>
    </div>
  );
}
