import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://127.0.0.1:8000/api/recruiter'

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #eee',
      borderRadius: 12, padding: '16px 20px', flex: 1
    }}>
      <p style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: color || '#1a1a1a' }}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    shortlisted: { bg: '#E1F5EE', color: '#085041' },
    rejected: { bg: '#FCEBEB', color: '#A32D2D' },
    pending: { bg: '#f0f0f0', color: '#666' }
  }
  const s = styles[status] || styles.pending
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 500
    }}>
      {status}
    </span>
  )
}

function ComparePanel({ candidates, onClose }) {
  const [a, b] = candidates
  const dims = Object.keys(a.breakdown || {})

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28,
        width: '100%', maxWidth: 700,
        maxHeight: '85vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Side by side comparison</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999'
          }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[a, b].map((c, i) => (
            <div key={i} style={{
              background: '#f8f8f7', borderRadius: 10, padding: 16, textAlign: 'center'
            }}>
              <p style={{ fontWeight: 600, fontSize: 15 }}>{c.candidate_name}</p>
              <p style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>{c.email}</p>
              <p style={{
                fontSize: 36, fontWeight: 700,
                color: c.total_score >= 75 ? '#1D9E75' : c.total_score >= 50 ? '#EF9F27' : '#E24B4A'
              }}>{c.total_score}</p>
              <p style={{ fontSize: 11, color: '#999' }}>overall score</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Dimension breakdown</p>
        {dims.map(dim => {
          const scoreA = a.breakdown[dim]
          const scoreB = b.breakdown[dim]
          const winner = scoreA > scoreB ? 0 : scoreB > scoreA ? 1 : -1
          return (
            <div key={dim} style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                {dim.replace(/_/g, ' ')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[scoreA, scoreB].map((score, i) => (
                  <div key={i} style={{
                    background: winner === i ? '#E1F5EE' : '#f0f0f0',
                    borderRadius: 6, padding: '6px 10px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{
                      height: 6, borderRadius: 3,
                      background: winner === i ? '#1D9E75' : '#ccc',
                      width: `${score}%`, flex: 1, marginRight: 8
                    }} />
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: winner === i ? '#085041' : '#666'
                    }}>{score}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          {[a, b].map((c, i) => (
            <div key={i}>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Summary</p>
              <p style={{ fontSize: 12, color: '#444', lineHeight: 1.6 }}>{c.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function RecruiterDashboard() {
  const [candidates, setCandidates] = useState([])
  const [stats, setStats] = useState(null)
  const [selected, setSelected] = useState([])
  const [comparing, setComparing] = useState(false)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [cRes, sRes] = await Promise.all([
        axios.get(`${API}/candidates`),
        axios.get(`${API}/stats`)
      ])
      setCandidates(cRes.data)
      setStats(sRes.data)
    } catch (e) {
      console.error(e)
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
    await axios.patch(`${API}/candidates/${id}/status`, { status })
    setCandidates(prev =>
      prev.map(c => c.id === id ? { ...c, status } : c)
    )
  }

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev
    )
  }

  const filtered = candidates.filter(c =>
    filter === 'all' ? true : c.status === filter
  )

  const compareData = selected.length === 2
    ? candidates.filter(c => selected.includes(c.id))
    : null

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
      Loading candidates...
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Recruiter dashboard</h2>
        <button onClick={fetchData} style={{
          padding: '7px 16px', borderRadius: 8,
          border: '1px solid #ddd', background: '#fff',
          fontSize: 13, cursor: 'pointer', color: '#666'
        }}>
          Refresh
        </button>
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <StatCard label="Total screened" value={stats.total} />
          <StatCard label="Shortlisted" value={stats.shortlisted} color="#1D9E75" />
          <StatCard label="Pending" value={stats.pending} color="#EF9F27" />
          <StatCard label="Rejected" value={stats.rejected} color="#E24B4A" />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'pending', 'shortlisted', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12,
              border: '1px solid #ddd', cursor: 'pointer',
              background: filter === f ? '#7F77DD' : '#fff',
              color: filter === f ? '#fff' : '#666'
            }}>{f}</button>
          ))}
        </div>

        {selected.length === 2 && (
          <button onClick={() => setComparing(true)} style={{
            padding: '8px 18px', borderRadius: 10,
            background: '#7F77DD', color: '#fff',
            border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer'
          }}>
            Compare selected ({selected.length})
          </button>
        )}

        {selected.length === 1 && (
          <p style={{ fontSize: 12, color: '#999' }}>Select one more to compare</p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
          No candidates yet. Screen some resumes first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((c, i) => (
            <div key={c.id} style={{
              background: '#fff',
              border: selected.includes(c.id) ? '2px solid #7F77DD' : '1px solid #eee',
              borderRadius: 12, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14
            }}>
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={() => toggleSelect(c.id)}
                style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
              />

              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: i === 0 ? '#1D9E75' : i === 1 ? '#7F77DD' : i === 2 ? '#EF9F27' : '#f0f0f0',
                color: i < 3 ? '#fff' : '#999',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600
              }}>
                {i + 1}
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500, fontSize: 14 }}>{c.candidate_name}</p>
                <p style={{ fontSize: 11, color: '#999' }}>{c.job_title} · {c.email || c.filename}</p>
              </div>

              <span style={{
                fontSize: 18, fontWeight: 700,
                color: c.total_score >= 75 ? '#1D9E75' : c.total_score >= 50 ? '#EF9F27' : '#E24B4A'
              }}>
                {c.total_score}
              </span>

              <StatusBadge status={c.status} />

              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => updateStatus(c.id, 'shortlisted')} style={{
                  padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                  border: '1px solid #1D9E75',
                  background: c.status === 'shortlisted' ? '#1D9E75' : 'transparent',
                  color: c.status === 'shortlisted' ? '#fff' : '#1D9E75'
                }}>Shortlist</button>
                <button onClick={() => updateStatus(c.id, 'rejected')} style={{
                  padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                  border: '1px solid #E24B4A',
                  background: c.status === 'rejected' ? '#E24B4A' : 'transparent',
                  color: c.status === 'rejected' ? '#fff' : '#E24B4A'
                }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {comparing && compareData && (
        <ComparePanel
          candidates={compareData}
          onClose={() => { setComparing(false); setSelected([]) }}
        />
      )}
    </div>
  )
}