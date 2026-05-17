'use client'

import { useState, useEffect } from 'react'
import { Save, MessageSquare, Sparkles } from 'lucide-react'

type CheckIn = {
  id: string; quarter: string; status: string; achievementValue: string | null; managerComment: string | null;
}

type Goal = {
  id: string; title: string; uom: string; target: string; owner?: { username: string };
  checkIns: CheckIn[];
}

export default function CheckInsPage() {
  const [user, setUser] = useState<{ id: string, username: string, role: string } | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [viewMode, setViewMode] = useState<'MY_CHECKINS' | 'TEAM_CHECKINS'>('MY_CHECKINS')
  const [selectedQuarter, setSelectedQuarter] = useState('Q1')
  const [loading, setLoading] = useState(true)
  
  // Local state for edits: { [goalId]: { status, achievementValue, managerComment } }
  const [edits, setEdits] = useState<Record<string, any>>({})
  const [summarizing, setSummarizing] = useState(false)
  const [aiSummary, setAiSummary] = useState('')

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    if (user) fetchGoals()
  }, [user, viewMode, selectedQuarter])

  const fetchSession = async () => {
    const res = await fetch('/api/auth/session')
    const data = await res.json()
    setUser(data.user)
  }

  const fetchGoals = async () => {
    setLoading(true)
    const url = viewMode === 'TEAM_CHECKINS' ? '/api/check-ins?asManager=true' : '/api/check-ins'
    const res = await fetch(url)
    if (res.ok) {
      const fetchedGoals: Goal[] = await res.json()
      setGoals(fetchedGoals)
      
      // Initialize local edits state
      const newEdits: Record<string, any> = {}
      fetchedGoals.forEach(g => {
        const checkIn = g.checkIns.find(c => c.quarter === selectedQuarter)
        newEdits[g.id] = {
          status: checkIn?.status || 'NOT_STARTED',
          achievementValue: checkIn?.achievementValue || '',
          managerComment: checkIn?.managerComment || ''
        }
      })
      setEdits(newEdits)
    }
    setLoading(false)
  }

  const handleEditChange = (goalId: string, field: string, value: string) => {
    setEdits(prev => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value }
    }))
  }

  const saveCheckIn = async (goalId: string) => {
    const editData = edits[goalId]
    const res = await fetch('/api/check-ins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goalId,
        quarter: selectedQuarter,
        status: editData.status,
        achievementValue: editData.achievementValue,
        managerComment: editData.managerComment
      })
    })
    
    if (res.ok) {
      alert('Saved successfully')
      fetchGoals()
    } else {
      alert('Error saving check-in')
    }
  }

  const summarizeCheckInsWithAI = async () => {
    setSummarizing(true)
    setAiSummary('')
    try {
      const checkInsToSummarize = goals.map(g => {
        const checkIn = g.checkIns.find(c => c.quarter === selectedQuarter)
        return {
          employee: g.owner?.username,
          goal: g.title,
          status: edits[g.id]?.status || checkIn?.status || 'NOT_STARTED',
          achievement: edits[g.id]?.achievementValue || checkIn?.achievementValue || 'N/A'
        }
      })

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'summarize_checkins', payload: { checkIns: checkInsToSummarize } })
      })
      const data = await res.json()
      if (res.ok) {
        setAiSummary(data.summary)
      } else {
        alert(data.error || 'Failed to generate summary')
      }
    } catch (e) {
      alert('Error connecting to AI')
    }
    setSummarizing(false)
  }

  const computeProgress = (uom: string, target: string, achievement: string) => {
    if (!achievement || !target) return 'N/A'
    const t = parseFloat(target)
    const a = parseFloat(achievement)
    
    if (isNaN(t) || isNaN(a)) {
      if (uom === 'TIMELINE') return `${achievement} / ${target}`
      return 'N/A'
    }

    if (uom === 'PERCENTAGE' || uom === 'NUMERIC') {
      // Assuming higher is better by default for simplicity, unless we strictly implement min/max logic from BRD
      // Let's implement a generic Min logic (Higher is better)
      const score = (a / t) * 100
      return `${score.toFixed(1)}%`
    } else if (uom === 'ZERO') {
      return a === 0 ? '100%' : '0%'
    }
    return 'N/A'
  }

  if (!user) return <p>Loading...</p>

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Quarterly Check-ins</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Track progress against approved goals.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {(user.role === 'MANAGER' || user.role === 'ADMIN') && (
            <select className="input-field" value={viewMode} onChange={e => setViewMode(e.target.value as any)}>
              <option value="MY_CHECKINS">My Check-ins</option>
              <option value="TEAM_CHECKINS">Team Check-ins</option>
            </select>
          )}
          <select className="input-field" value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)}>
            <option value="Q1">Q1 (July)</option>
            <option value="Q2">Q2 (October)</option>
            <option value="Q3">Q3 (January)</option>
            <option value="Q4">Q4 (April)</option>
          </select>
        </div>
      </header>

      {viewMode === 'TEAM_CHECKINS' && !loading && goals.length > 0 && (
        <div style={{ marginBottom: '1.5rem', background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: 'var(--secondary-color)', fontWeight: 'bold', margin: 0 }}>
              <Sparkles size={18} /> AI Quarter Summary
            </h3>
            <button className="btn-primary" onClick={summarizeCheckInsWithAI} disabled={summarizing} style={{ background: 'var(--secondary-color)', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              {summarizing ? 'Summarizing...' : 'Generate Summary'}
            </button>
          </div>
          {aiSummary && (
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-color)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {aiSummary}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p>Loading check-ins...</p>
      ) : goals.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No approved goals found to track.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {goals.map(goal => {
            const editData = edits[goal.id] || { status: 'NOT_STARTED', achievementValue: '', managerComment: '' }
            const isTeamView = viewMode === 'TEAM_CHECKINS'
            const score = computeProgress(goal.uom, goal.target, editData.achievementValue)

            return (
              <div key={goal.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{goal.title}</h3>
                    {isTeamView && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Owner: {goal.owner?.username}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target ({goal.uom})</span>
                    <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-color)' }}>{goal.target}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  
                  {/* Employee Inputs */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Status</label>
                    <select 
                      className="input-field" 
                      value={editData.status} 
                      onChange={e => handleEditChange(goal.id, 'status', e.target.value)}
                      disabled={isTeamView}
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="ON_TRACK">On Track</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Actual Achievement</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={editData.achievementValue} 
                      onChange={e => handleEditChange(goal.id, 'achievementValue', e.target.value)}
                      disabled={isTeamView}
                      placeholder="Enter actual value..."
                    />
                  </div>

                  {/* Computed Score */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minWidth: '100px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Score</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: score === 'N/A' ? 'var(--text-muted)' : 'var(--secondary-color)' }}>{score}</span>
                  </div>
                </div>

                {/* Manager Comments */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--warning-color)' }}>
                    <MessageSquare size={16} /> Manager Feedback
                  </label>
                  <textarea 
                    className="input-field" 
                    rows={2} 
                    value={editData.managerComment}
                    onChange={e => handleEditChange(goal.id, 'managerComment', e.target.value)}
                    disabled={!isTeamView}
                    placeholder={isTeamView ? "Add your feedback for this quarter..." : "Waiting for manager feedback..."}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button onClick={() => saveCheckIn(goal.id)} className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
                    <Save size={16} /> Save Check-in
                  </button>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
