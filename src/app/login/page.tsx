'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: '1rem', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            color: 'var(--primary-color)',
            marginBottom: '1rem'
          }}>
            <LogIn size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Welcome to AtomQuest</h1>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to set and track your goals.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ 
              backgroundColor: 'rgba(244, 63, 94, 0.1)', 
              color: 'var(--accent-color)', 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Username</label>
            <input
              id="username"
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. employee, manager, admin"
              required
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Password</label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.85rem' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <p>Demo Accounts:</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>admin</span>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>manager</span>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>employee</span>
          </div>
          <p style={{ marginTop: '0.5rem' }}>Password for all: <strong>password</strong></p>
        </div>
      </div>
    </div>
  )
}
