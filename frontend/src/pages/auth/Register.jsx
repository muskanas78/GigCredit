// pages/auth/Register.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Brand from '../../components/ui/Brand.jsx';
import { ErrorBox } from '../../components/ui/States.jsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || form.name.trim().length < 2) return setError('Please enter your full name.');
    if (!form.email) return setError('Email is required.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      const user = await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast.ok(`Welcome to GigCredit, ${user.name.split(' ')[0]}`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-frame">
        <Link to="/"><Brand size="lg" /></Link>
        <h2 style={{ marginTop: 28, marginBottom: 6, fontSize: '1.7rem', fontWeight: 400 }}>
          Open your account
        </h2>
        <p className="muted" style={{ marginBottom: 22 }}>
          Free to set up. Your wallet activates immediately.
        </p>

        <ErrorBox message={error} />

        <form onSubmit={submit}>
          <div className="field">
            <label>Full name</label>
            <input
              type="text" autoComplete="name"
              value={form.name} onChange={set('name')}
              className="input"
              placeholder="e.g. Ali Raza"
              required minLength={2} maxLength={80}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email" autoComplete="email"
              value={form.email} onChange={set('email')}
              className="input"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Password</label>
              <input
                type="password" autoComplete="new-password"
                value={form.password} onChange={set('password')}
                className="input"
                placeholder="6+ characters"
                minLength={6} maxLength={80} required
              />
            </div>
            <div className="field">
              <label>Confirm password</label>
              <input
                type="password" autoComplete="new-password"
                value={form.confirm} onChange={set('confirm')}
                className="input"
                placeholder="Repeat password"
                required
              />
            </div>
          </div>

          <p className="tiny muted" style={{ marginBottom: 14 }}>
            By creating an account you accept that this is an academic demo project
            and no real funds will be processed.
          </p>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {submitting ? <span className="spinner" /> : 'Create account'}
          </button>
        </form>

        <p className="muted tiny" style={{ marginTop: 22 }}>
          Already a member? <Link to="/login" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>Sign in</Link>
        </p>
      </div>

      <div className="auth-side" aria-hidden="true">
        <div className="auth-quote">
          <span className="eyebrow" style={{ color: 'var(--brass-2)' }}>What you get</span>
          <ul className="check-list">
            <li>A wallet with PKR/USD/EUR support</li>
            <li>Send & receive within GigCredit</li>
            <li>Expense tracking with category budgets</li>
            <li>Monthly reports & exportable receipts</li>
            <li>Suspicious-activity alerts</li>
          </ul>
        </div>
      </div>

      <style>{`
        .auth { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
        .auth-frame { padding: 48px 64px; max-width: 540px; margin: 0 auto; width: 100%; align-self: center; }
        .auth-side {
          background: linear-gradient(160deg, #0b1620 0%, #1a2331 80%);
          color: #fff; padding: 56px;
          display: flex; align-items: center;
          position: relative; overflow: hidden;
        }
        .auth-side::before {
          content: '';
          position: absolute; top: -10%; left: -10%;
          width: 60%; height: 70%;
          background: radial-gradient(circle, rgba(212,165,116,.18), transparent 70%);
        }
        .auth-quote { position: relative; max-width: 480px; }
        .check-list { list-style: none; padding: 0; margin: 18px 0 0; }
        .check-list li {
          padding: 10px 0; font-size: 14.5px;
          color: rgba(255,255,255,.78);
          border-bottom: 1px solid rgba(255,255,255,.06);
          position: relative; padding-left: 24px;
        }
        .check-list li:last-child { border-bottom: 0; }
        .check-list li::before {
          content: '→'; position: absolute; left: 0;
          color: var(--brass-2); font-weight: 600;
        }
        @media (max-width: 900px) {
          .auth { grid-template-columns: 1fr; }
          .auth-side { display: none; }
          .auth-frame { padding: 36px 24px; }
        }
      `}</style>
    </div>
  );
}
