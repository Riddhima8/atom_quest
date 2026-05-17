'use client'

import { useState, useEffect } from 'react'
import { Download, Shield, Activity, FileText } from 'lucide-react'

export default function AdminHubPage() {
  const [user, setUser] = useState<{ id: string, username: string, role: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'AUDIT'>('ANALYTICS')
  
  const [completionRates, setCompletionRates] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchData(activeTab)
    } else if (user && user.role !== 'ADMIN') {
      setLoading(false)
    }
  }, [user, activeTab])

  const fetchSession = async () => {
    const res = await fetch('/api/auth/session')
    const data = await res.json()
    setUser(data.user)
  }

  const fetchData = async (tab: 'ANALYTICS' | 'AUDIT') => {
    setLoading(true)
    const type = tab === 'ANALYTICS' ? 'completion' : 'audit'
    const res = await fetch(`/api/admin?type=${type}`)
    if (res.ok) {
      const data = await res.json()
      if (tab === 'ANALYTICS') setCompletionRates(data)
      if (tab === 'AUDIT') setAuditLogs(data)
    }
    setLoading(false)
  }

  const handleExport = () => {
    window.open('/api/admin/export', '_blank')
  }

  if (!user) return <p>Loading...</p>
  if (user.role !== 'ADMIN') return (
    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--accent-color)' }}>
      <Shield size={48} style={{ margin: '0 auto 1rem auto' }} />
      <h2>Access Denied</h2>
      <p>You do not have administrative privileges to view this page.</p>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Admin Hub</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Governance, reporting, and analytics.</p>
        </div>
        <div>
          <button onClick={handleExport} className="btn-secondary" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary-color)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <Download size={18} /> Export Achievements (CSV)
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('ANALYTICS')}
          style={{ 
            background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: '600', 
            color: activeTab === 'ANALYTICS' ? 'var(--primary-color)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'
          }}
        >
          <Activity size={20} /> Completion Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('AUDIT')}
          style={{ 
            background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: '600', 
            color: activeTab === 'AUDIT' ? 'var(--primary-color)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'
          }}
        >
          <FileText size={20} /> Audit Trail
        </button>
      </div>

      {loading ? (
        <p>Loading data...</p>
      ) : activeTab === 'ANALYTICS' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {completionRates.map(rate => (
            <div key={rate.quarter} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{rate.quarter} Check-ins</h3>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '120px', height: '120px', borderRadius: '50%', background: `conic-gradient(var(--secondary-color) ${rate.rate}%, rgba(255,255,255,0.1) 0)` }}>
                <div style={{ position: 'absolute', inset: '8px', background: 'var(--bg-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{rate.rate}%</span>
                </div>
              </div>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {rate.completed} / {rate.total} Completed
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
              <tr>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Time</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>User</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Action</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Goal</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No logs found.</td></tr>
              ) : auditLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{log.user.username}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-color)' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{log.goal?.title || 'N/A'}</td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
