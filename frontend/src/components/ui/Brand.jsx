// Brand.jsx — GigCredit logo/wordmark
export default function Brand({ size = 'md' }) {
  const fontSize = size === 'sm' ? 15 : 18;
  return (
    <span style={{
      fontWeight: 800, fontSize, letterSpacing: '-0.03em',
      color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <span style={{
        background: 'linear-gradient(135deg, #00c2a8, #0077ff)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>Gig</span>
      <span style={{ color: 'var(--ink)' }}>Credit</span>
    </span>
  );
}
