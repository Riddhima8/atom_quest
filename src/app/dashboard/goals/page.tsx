'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Send, Sparkles } from 'lucide-react'

type Goal = {
  id: string; title: string; description: string; thrustArea: string;
  uom: string; target: string; weightage: number; status: string;
  ownerId: string; owner?: { username: string }; sharedFromId: string | null;
}

export default function GoalsPage() {
  const [user, setUser] = useState<{ id: string, username: string, role: string } | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [viewMode, setViewMode] = useState<'MY_GOALS' | 'TEAM_GOALS'>('MY_GOALS')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thrustArea, setThrustArea] = useState('')
  const [uom, setUom] = useState('NUMERIC')
  const [target, setTarget] = useState('')
  const [weightage, setWeightage] = useState('10')
  const [formError, setFormError] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    if (user) fetchGoals()
  }, [user, viewMode])

  const fetchSession = async () => {
    const res = await fetch('/api/auth/session')
    const data = await res.json()
    setUser(data.user)
  }

  const fetchGoals = async () => {
    setLoading(true)
    const url = viewMode === 'TEAM_GOALS' ? '/api/goals?asManager=true' : '/api/goals'
    const res = await fetch(url)
    if (res.ok) {
      setGoals(await res.json())
    }
    setLoading(false)
  }

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, thrustArea, uom, target, weightage })
    })

    const data = await res.json()
    if (res.ok) {
      setIsModalOpen(false)
      resetForm()
      fetchGoals()
    } else {
      setFormError(data.error || 'Failed to create goal')
    }
  }

  const generateGoalWithAI = async () => {
    if (!aiPrompt) return alert('Please enter a goal description first.')
    setGenerating(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_goal', payload: { prompt: aiPrompt } })
      })
      const data = await res.json()
      if (res.ok) {
        setTitle(data.title || '')
        setDescription(data.description || '')
        setThrustArea(data.thrustArea || '')
        setUom(data.uom || 'NUMERIC')
        setTarget(data.target || '')
      } else {
        alert(data.error || 'Failed to generate goal')
      }
    } catch (e) {
      alert('Error connecting to AI')
    }
    setGenerating(false)
  }

  const updateGoalStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (res.ok) fetchGoals()
  }

  const deleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return
    const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    if (res.ok) fetchGoals()
  }

  const resetForm = () => {
    setTitle(''); setDescription(''); setThrustArea(''); setUom('NUMERIC'); setTarget(''); setWeightage('10')
  }

  const currentWeightage = goals.reduce((sum: number, g: any) => sum + g.weightage, 0)
  const canSubmitForApproval = currentWeightage === 100 && goals.every(g => g.status === 'DRAFT' || g.status === 'RETURNED')

  const submitAllForApproval = async () => {
    if (currentWeightage !== 100) return alert('Total weightage must be exactly 100% to submit.')
    for (let g of goals) {
      if (g.status === 'DRAFT' || g.status === 'RETURNED') {
        await fetch(`/api/goals/${g.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PENDING' }) })
      }
    }
    fetchGoals()
  }

  if (!user) return <p>Loading...</p>

  return (
    <>
      <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Goal Management</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Set, submit, and review objectives.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {(user.role === 'MANAGER' || user.role === 'ADMIN') && (
            <select 
              className="input-field" 
              style={{ width: 'auto' }} 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value as any)}
            >
              <option value="MY_GOALS">My Goals</option>
              <option value="TEAM_GOALS">Team Goals</option>
            </select>
          )}
          {viewMode === 'MY_GOALS' && goals.length < 8 && (
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> New Goal
            </button>
          )}
        </div>
      </header>

      {viewMode === 'MY_GOALS' && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div>
            <strong>Total Weightage:</strong> <span style={{ color: currentWeightage === 100 ? 'var(--secondary-color)' : 'var(--warning-color)' }}>{currentWeightage}%</span>
            <span style={{ marginLeft: '1rem', color: 'var(--text-muted)' }}>{goals.length}/8 Goals Created</span>
          </div>
          {canSubmitForApproval && (
            <button className="btn-primary" onClick={submitAllForApproval} style={{ background: 'var(--secondary-color)' }}>
              <Send size={18} /> Submit All for Approval
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p>Loading goals...</p>
      ) : goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No goals found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {goals.map(goal => (
            <div key={goal.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ 
                  fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '12px',
                  backgroundColor: goal.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 
                                   goal.status === 'PENDING' ? 'rgba(245, 158, 11, 0.2)' : 
                                   goal.status === 'RETURNED' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                  color: goal.status === 'APPROVED' ? 'var(--secondary-color)' : 
                         goal.status === 'PENDING' ? 'var(--warning-color)' : 
                         goal.status === 'RETURNED' ? 'var(--accent-color)' : 'var(--text-muted)',
                }}>
                  {goal.status}
                </span>
                <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{goal.weightage}%</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>{goal.title}</h3>
              {viewMode === 'TEAM_GOALS' && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Owner: {goal.owner?.username}</p>}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flex: 1, marginBottom: '1rem' }}>{goal.description}</p>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Thrust Area</span><br/><strong>{goal.thrustArea}</strong></div>
                <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target ({goal.uom})</span><br/><strong>{goal.target}</strong></div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: 'auto' }}>
                {viewMode === 'MY_GOALS' && (goal.status === 'DRAFT' || goal.status === 'RETURNED') && (
                  <button onClick={() => deleteGoal(goal.id)} className="btn-secondary" style={{ padding: '0.5rem', color: 'var(--accent-color)' }} title="Delete">
                    <Trash2 size={16} />
                  </button>
                )}
                {viewMode === 'TEAM_GOALS' && goal.status === 'PENDING' && (
                  <>
                    <button onClick={() => updateGoalStatus(goal.id, 'APPROVED')} className="btn-primary" style={{ background: 'var(--secondary-color)', padding: '0.5rem 1rem' }}>
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={() => updateGoalStatus(goal.id, 'RETURNED')} className="btn-secondary" style={{ padding: '0.5rem 1rem', color: 'var(--accent-color)' }}>
                      <XCircle size={16} /> Return
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
    {/* Create Modal */}
    {isModalOpen && (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 50, padding: '2rem 1rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', minHeight: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel modal-animate" style={{ width: '100%', maxWidth: '550px', padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Create New Goal</h2>
            <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && <div style={{ color: 'var(--accent-color)', fontSize: '0.9rem' }}>{formError}</div>}
              
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--secondary-color)', fontWeight: 'bold' }}>
                  <Sparkles size={16} /> Draft with AI
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="input-field" placeholder="e.g. I want to increase Q3 sales by 15%..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} style={{ flex: 1 }} />
                  <button type="button" className="btn-primary" onClick={generateGoalWithAI} disabled={generating} style={{ background: 'var(--secondary-color)', whiteSpace: 'nowrap' }}>
                    {generating ? 'Drafting...' : 'Generate'}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Title</label>
                <input required type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description</label>
                <textarea className="input-field" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Thrust Area</label>
                  <input required type="text" className="input-field" value={thrustArea} onChange={e => setThrustArea(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>UoM</label>
                  <select className="input-field" value={uom} onChange={e => setUom(e.target.value)}>
                    <option value="NUMERIC">Numeric</option>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="TIMELINE">Timeline</option>
                    <option value="ZERO">Zero-based</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Target</label>
                  <input required type="text" className="input-field" value={target} onChange={e => setTarget(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Weightage (%)</label>
                  <input required type="number" min="10" max="100" className="input-field" value={weightage} onChange={e => setWeightage(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
  </>
  )
}
