// pages/NotFound.jsx — 404.

import { Link } from 'react-router-dom';
import Brand from '../components/ui/Brand.jsx';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      padding: 24, textAlign: 'center',
    }}>
      <div>
        <Brand size="lg" />
        <div className="serif" style={{ fontSize: '7rem', lineHeight: 1, marginTop: 32, color: 'var(--brass)' }}>404</div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: 8 }}>This page doesn't exist.</h2>
        <p className="muted" style={{ maxWidth: 420, margin: '0 auto 22px' }}>
          The link may be broken, or the page may have moved. Let's get you somewhere useful.
        </p>
        <div className="row" style={{ justifyContent: 'center', gap: 10 }}>
          <Link to="/" className="btn btn-ghost">Home</Link>
          <Link to="/dashboard" className="btn btn-primary">Go to dashboard</Link>
        </div>
      </div>
    </div>
  );
}
