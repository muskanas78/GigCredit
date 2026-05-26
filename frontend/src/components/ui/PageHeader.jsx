// components/ui/PageHeader.jsx
// Consistent title + optional subtitle + actions row at the top of every page.

export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="ph">
      <div className="ph-text">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="ph-title">{title}</h1>
        {subtitle && <p className="ph-sub">{subtitle}</p>}
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
      <style>{`
        .ph {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 24px; margin-bottom: 28px; padding-bottom: 18px;
          border-bottom: 1px solid var(--line);
        }
        .ph-title {
          font-size: clamp(1.7rem, 3vw, 2.4rem);
          margin: 4px 0 0; line-height: 1.05;
          font-weight: 400;
        }
        .ph-sub { color: var(--ink-3); margin: 6px 0 0; max-width: 60ch; }
        .ph-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        @media (max-width: 700px) {
          .ph { flex-direction: column; align-items: stretch; }
          .ph-actions { justify-content: flex-start; }
        }
      `}</style>
    </header>
  );
}
