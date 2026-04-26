import { useState, useEffect } from 'react'
import Upload from './components/Upload'
import Results from './components/Results'
import BulkUpload from './components/BulkUpload'
import Leaderboard from './components/Leaderboard'
import RecruiterDashboard from './components/RecruiterDashboard'
import Auth from './components/Auth'
import axios from 'axios'

export default function App() {
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('single')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [singleResult, setSingleResult] = useState(null)
  const [bulkResults, setBulkResults] = useState(null)

  useEffect(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    if (t && u) {
      setUser(JSON.parse(u))
      axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
      axios.get('http://127.0.0.1:8000/api/auth/me').catch(() => handleLogout())
    }
  }, [])

  const handleLogin = (userData, accessToken) => {
    setUser(userData)
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    setMode(userData.role === 'recruiter' ? 'single' : 'candidate')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setSingleResult(null)
    setBulkResults(null)
    delete axios.defaults.headers.common['Authorization']
  }

  if (!user) return <Auth onLogin={handleLogin} />

  const recruiterTabs = [
    { id: 'single', label: 'Screen', icon: '◈' },
    { id: 'bulk', label: 'Bulk', icon: '◇' },
    { id: 'recruiter', label: 'Dashboard', icon: '▤' },
  ]

  const candidateTabs = [
    { id: 'candidate', label: 'Check my fit', icon: '◉' },
  ]

  const tabs = user.role === 'recruiter' ? recruiterTabs : candidateTabs

  const handleTabClick = (id) => {
    setMode(id)
    setError(null)
    if (id === 'recruiter') window.dispatchEvent(new Event('recruiter-refresh'))
  }

  const Sidebar = (
    <aside style={{
      width: 240, minHeight: '100vh',
      background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
      padding: '24px 16px', display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0
    }}>
      <div style={{ padding: '0 12px 24px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--gradient-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)'
          }}>R</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14 }}>ResumeAI</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Pro</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 12px' }}>
          {user.role === 'recruiter' ? 'Recruiter' : 'Candidate'}
        </p>
        {tabs.map(t => (
          <button key={t.id} onClick={() => handleTabClick(t.id)} style={{
            padding: '10px 12px', borderRadius: 8, fontSize: 13,
            fontWeight: 500, border: 'none', cursor: 'pointer',
            background: mode === t.id ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
            color: mode === t.id ? 'var(--accent-bright)' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
            transition: 'all 0.15s', position: 'relative'
          }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            <span>{t.label}</span>
            {mode === t.id && (
              <span style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                width: 3, height: 16, background: 'var(--accent)', borderRadius: '0 2px 2px 0'
              }} />
            )}
          </button>
        ))}
      </div>

      <div style={{
        padding: 12, borderRadius: 10,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--gradient-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700
        }}>
          {user.full_name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name}</p>
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.role === 'recruiter' ? user.company_name : user.email}
          </p>
        </div>
      </div>

      <button onClick={handleLogout} style={{
        padding: '10px 12px', borderRadius: 8, fontSize: 13,
        border: '1px solid var(--border-bright)', background: 'transparent',
        color: 'var(--text-secondary)', fontWeight: 500,
        transition: 'all 0.15s'
      }}>
        Log out
      </button>
    </aside>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {Sidebar}
      <main style={{ flex: 1, padding: '40px 48px', maxWidth: 1100, animation: 'fadeIn 0.4s ease-out' }}>
        {error && (
          <div style={{
            marginBottom: 16, padding: '12px 16px',
            background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 10, color: '#FCA5A5', fontSize: 14
          }}>
            {error}
          </div>
        )}

        {user.role === 'recruiter' && (
          <>
            <div style={{ display: mode === 'single' ? 'block' : 'none' }}>
              <PageHeader title="Screen a resume" subtitle="Upload a PDF and paste the job description to get an AI-powered fit score across 5 dimensions." />
              <Upload setResult={setSingleResult} setLoading={setLoading} setError={setError} loading={loading && mode === 'single'} role={user.role} />
              {loading && mode === 'single' && <LoadingState text="Analysing resume..." />}
              {singleResult && !loading && <Results result={singleResult} role={user.role} />}
            </div>

            <div style={{ display: mode === 'bulk' ? 'block' : 'none' }}>
              <PageHeader title="Bulk screening" subtitle="Upload a ZIP of PDF resumes to screen and rank all candidates at once with parallel processing." />
              <BulkUpload setResults={setBulkResults} setLoading={setLoading} setError={setError} loading={loading} />
              {loading && mode === 'bulk' && <LoadingState text="Screening all resumes in parallel..." />}
              {bulkResults && !loading && <Leaderboard data={bulkResults} role={user.role} />}
            </div>

            <div style={{ display: mode === 'recruiter' ? 'block' : 'none' }}>
              <PageHeader title="Recruiter dashboard" subtitle="Manage screened candidates, shortlist or reject, and compare profiles side by side." />
              <RecruiterDashboard />
            </div>
          </>
        )}

        {user.role === 'candidate' && (
          <div>
            <PageHeader title="Check your fit" subtitle="Upload your resume and paste a job description to see how well you match — with personalised feedback and learning resources." />
            <Upload setResult={setSingleResult} setLoading={setLoading} setError={setError} loading={loading} role={user.role} />
            {loading && <LoadingState text="Analysing your resume..." />}
            {singleResult && !loading && <Results result={singleResult} role={user.role} />}
          </div>
        )}
      </main>
    </div>
  )
}

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 32, animation: 'slideUp 0.4s ease-out' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>{title}</h1>
      <p style={{ fontSize: 14, color: 'var(--text-tertiary)', maxWidth: 600 }}>{subtitle}</p>
    </div>
  )
}

function LoadingState({ text }) {
  return (
    <div style={{ marginTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 40, height: 40, border: '3px solid var(--border-bright)',
        borderTop: '3px solid var(--accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{text}</p>
    </div>
  )
}