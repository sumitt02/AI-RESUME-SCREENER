import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'https://ai-resume-screener-production-f337.up.railway.app/api/recruiter'

export default function RecruiterDashboard() {
  const [candidates, setCandidates] = useState([])
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [comparison, setComparison] = useState([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [c, s] = await Promise.all([
        axios.get(`${API}/candidates`),
        axios.get(`${API}/stats`)
      ])
      setCandidates(c.data)
      setStats(s.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    window.addEventListener('recruiter-refresh', fetchData)
    return () => window.removeEventListener('recruiter-refresh', fetchData)
  }, [])

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${API}/candidates/${id}/status`, { status })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const toggleCompare = (c) => {
    if (comparison.find(x => x.id === c.id)) {
      setComparison(comparison.filter(x => x.id !== c.id))
    } else if (comparison.length < 2) {
      setComparison([...comparison, c])
    }
  }

  const filtered = filter === 'all'
    ? candidates
    : candidates.filter(c => c.status === filter)

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{
          width: 32, height: 32, border: '3px solid var(--border-bright)',
          borderTop: '3px solid var(--accent)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
        }} />
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Loading candidates...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.4s ease-out' }}>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCard label="Total" value={stats.total} color="var(--accent-bright)" />
          <StatCard label="Pending" value={stats.pending} color="var(--warning)" />
          <StatCard label="Shortlisted" value={stats.shortlisted} color="var(--success)" />
          <StatCard label="Rejected" value={stats.rejected} color="var(--danger)" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {['all', 'pending', 'shortlisted', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13,
            border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border-bright)'}`,
            background: filter === f ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
            color: filter === f ? 'var(--accent-bright)' : 'var(--text-secondary)',
            fontWeight: 500, textTransform: 'capitalize', transition: 'all 0.15s'
          }}>
            {f}
          </button>
        ))}
      </div>

      {comparison.length === 2 && (
        <ComparisonPanel candidates={comparison} onClose={() => setComparison([])} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: 60, textAlign: 'center',
            background: 'var(--bg-card)', border: '1px dashed var(--border-bright)',
            borderRadius: 16
          }}>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
              No candidates {filter !== 'all' ? `with status "${filter}"` : 'yet'}
            </p>
          </div>
        ) : filtered.map(c => (
          <CandidateRow
            key={c.id}
            candidate={c}
            onUpdateStatus={updateStatus}
            onSelect={() => setSelected(c)}
            onCompare={() => toggleCompare(c)}
            isComparing={!!comparison.find(x => x.id === c.id)}
          />
        ))}
      </div>

      {selected && <CandidateModal candidate={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 18px'
    }}>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
    </div>
  )
}

function CandidateRow({ candidate, onUpdateStatus, onSelect, onCompare, isComparing }) {
  const c = candidate
  const scoreColor = c.total_score >= 75 ? 'var(--success)' : c.total_score >= 50 ? 'var(--warning)' : 'var(--danger)'

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${isComparing ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 12, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 16,
      transition: 'all 0.15s'
    }}>
      <input type="checkbox" checked={isComparing} onChange={onCompare}
        style={{ accentColor: '#7C3AED', cursor: 'pointer' }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{c.candidate_name}</p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {c.email || c.filename} · {c.job_title}
        </p>
      </div>

      <div style={{
        background: 'var(--bg-elevated)', border: `1px solid ${scoreColor}`,
        borderRadius: 8, padding: '4px 12px'
      }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{c.total_score}</p>
      </div>

      <span style={{
        fontSize: 10, padding: '4px 10px', borderRadius: 6,
        background: c.status === 'shortlisted' ? 'var(--success-bg)' : c.status === 'rejected' ? 'var(--danger-bg)' : 'var(--warning-bg)',
        color: c.status === 'shortlisted' ? '#6EE7B7' : c.status === 'rejected' ? '#FCA5A5' : '#FCD34D',
        textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em'
      }}>
        {c.status}
      </span>

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onSelect} style={btnSecondary}>View</button>
        {c.status !== 'shortlisted' && (
          <button onClick={() => onUpdateStatus(c.id, 'shortlisted')} style={btnSuccess}>
            Shortlist
          </button>
        )}
        {c.status !== 'rejected' && (
          <button onClick={() => onUpdateStatus(c.id, 'rejected')} style={btnDanger}>
            Reject
          </button>
        )}
      </div>
    </div>
  )
}

function CandidateModal({ candidate, onClose }) {
  const c = candidate
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10, 10, 15, 0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20, animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
        borderRadius: 16, padding: 28,
        width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{c.candidate_name}</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{c.email} · {c.job_title}</p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 22,
            color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4
          }}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          {c.summary}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <SkillBox title="Matched" skills={c.matched_skills || []} type="success" />
          <SkillBox title="Missing" skills={c.missing_skills || []} type="danger" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FlagBox title="Green flags" items={c.green_flags || []} symbol="+" color="var(--success)" />
          <FlagBox title="Red flags" items={c.red_flags || []} symbol="−" color="var(--danger)" />
        </div>
      </div>
    </div>
  )
}

function ComparisonPanel({ candidates, onClose }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--accent)',
      borderRadius: 12, padding: 20
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-bright)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Comparing 2 candidates
        </p>
        <button onClick={onClose} style={btnSecondary}>Clear</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {candidates.map(c => (
          <div key={c.id} style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 16
          }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.candidate_name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 12 }}>{c.job_title}</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: c.total_score >= 75 ? 'var(--success)' : c.total_score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
              {c.total_score}
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 12, marginBottom: 6 }}>
              Top dimensions
            </p>
            {Object.entries(c.breakdown || {}).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SkillBox({ title, skills, type }) {
  const colors = type === 'success'
    ? { bg: 'var(--success-bg)', color: '#6EE7B7', border: 'rgba(16, 185, 129, 0.3)' }
    : { bg: 'var(--danger-bg)', color: '#FCA5A5', border: 'rgba(239, 68, 68, 0.3)' }
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 10, padding: 14
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: colors.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {skills.map(s => (
          <span key={s} style={{
            background: colors.bg, color: colors.color,
            border: `1px solid ${colors.border}`,
            padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500
          }}>{s}</span>
        ))}
      </div>
    </div>
  )
}

function FlagBox({ title, items, symbol, color }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 10, padding: 14
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {title}
      </p>
      {items.map((f, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <span style={{ color, fontWeight: 700, flexShrink: 0 }}>{symbol}</span>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f}</p>
        </div>
      ))}
    </div>
  )
}

const btnSecondary = {
  padding: '6px 12px', borderRadius: 6, fontSize: 11,
  border: '1px solid var(--border-bright)', background: 'transparent',
  color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer'
}

const btnSuccess = {
  padding: '6px 12px', borderRadius: 6, fontSize: 11,
  border: '1px solid rgba(16, 185, 129, 0.3)', background: 'var(--success-bg)',
  color: '#6EE7B7', fontWeight: 600, cursor: 'pointer'
}

const btnDanger = {
  padding: '6px 12px', borderRadius: 6, fontSize: 11,
  border: '1px solid rgba(239, 68, 68, 0.3)', background: 'var(--danger-bg)',
  color: '#FCA5A5', fontWeight: 600, cursor: 'pointer'
}