export default function DashboardHome() {
  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Welcome Back</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Here is an overview of your current goals and progress.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Goals</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--primary-color)' }}>0</p>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Approvals</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--warning-color)' }}>0</p>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Overall Progress</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--secondary-color)' }}>0%</p>
        </div>
      </div>
    </div>
  )
}
