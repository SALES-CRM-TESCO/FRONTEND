// Dashboard KPI card — same design as the Design CRM cards:
// uppercase title top-left, icon in a tinted rounded square top-right, big value,
// and a colored trend + muted description footer row.
export default function StatCard({ title, value, icon, trend, desc, color = '#4F46E5', bg = '#EEF2FF', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="dcard"
      style={{
        background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, padding: 16,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 118,
        cursor: onClick ? 'pointer' : 'default', textAlign: 'left', width: '100%',
        boxShadow: 'var(--shadow)', transition: 'transform .15s, box-shadow .15s',
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.03em', lineHeight: 1.2 }}>{title}</span>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        {(trend || desc) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: '0.7rem' }}>
            <span style={{ color, fontWeight: 700 }}>{trend}</span>
            <span style={{ color: 'var(--muted)' }}>{desc}</span>
          </div>
        )}
      </div>
    </button>
  );
}
