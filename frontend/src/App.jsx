import { useState, useEffect } from 'react'
import Upload from './components/Upload'
import Results from './components/Results'
import BulkUpload from './components/BulkUpload'
import Leaderboard from './components/leaderboard'
import RecruiterDashboard from './components/RecruiterDashboard'
import Auth from './components/Auth'
import axios from 'axios'

export default function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [mode, setMode] = useState('single')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [singleResult, setSingleResult] = useState(null)
  const [bulkResults, setBulkResults] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
    }
  }, [])

  const handleLogin = (userData, accessToken) => {
    setUser(userData)
    setToken(accessToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    if (userData.role === 'recruiter') setMode('single')
    else setMode('candidate')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
    setSingleResult(null)
    setBulkResults(null)
    delete axios.defaults.headers.common['Authorization']
  }

  if (!user) return <Auth onLogin={handleLogin} />

  const recruiterTabs = [
    { id: 'single', label: 'Single resume' },
    { id: 'bulk', label: 'Bulk screening' },
    { id: 'recruiter', label: 'Recruiter dashboard' },
  ]

  const candidateTabs = [
    { id: 'candidate', label: 'Check my fit' },
  ]

  const tabs = user.role === 'recruiter' ? recruiterTabs : candidateTabs

  const handleTabClick = (id) => {
    setMode(id)
    setError(null)
    if (id === 'recruiter') {
      window.dispatchEvent(new Event('recruiter-refresh'))
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 32
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>
            Resume Screener
          </h1>
          <p style={{ color: '#999', fontSize: 13 }}>
            {user.role === 'recruiter'
              ? `${user.company_name} · ${user.full_name}`
              : `${user.full_name} · Candidate`}
          </p>
        </div>
        <button onClick={handleLogout} style={{
          padding: '7px 16px', borderRadius: 8,
          border: '1px solid #ddd', background: '#fff',
          fontSize: 13, cursor: 'pointer', color: '#666'
        }}>
          Log out
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => handleTabClick(t.id)}
            style={{
              padding: '8px 20px', borderRadius: 20,
              border: '1px solid #ddd',
              background: mode === t.id ? '#7F77DD' : '#fff',
              color: mode === t.id ? '#fff' : '#666',
              fontSize: 13, fontWeight: 500, cursor: 'pointer'
            }}
          >
            {t.label}
            {t.id === 'bulk' && loading && mode !== 'bulk' && (
              <span style={{
                marginLeft: 6, width: 7, height: 7,
                borderRadius: '50%', background: '#EF9F27',
                display: 'inline-block', verticalAlign: 'middle'
              }} />
            )}
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          marginBottom: 16, padding: '12px 16px',
          background: '#fff0f0', border: '1px solid #ffcccc',
          borderRadius: 8, color: '#cc0000', fontSize: 14
        }}>
          {error}
        </div>
      )}

      <div style={{ display: mode === 'single' ? 'block' : 'none' }}>
        <Upload
          setResult={setSingleResult}
          setLoading={setLoading}
          setError={setError}
          loading={loading && mode === 'single'}
          role={user?.role}
        />
        {loading && mode === 'single' && (
          <div style={{ marginTop: 40, textAlign: 'center', color: '#666', fontSize: 15 }}>
            Analysing resume...
          </div>
        )}
        {singleResult && !loading && mode === 'single' && (
          <Results result={singleResult} role={user?.role} />
        )}
      </div>

      <div style={{ display: mode === 'bulk' ? 'block' : 'none' }}>
        <BulkUpload
          setResults={setBulkResults}
          setLoading={setLoading}
          setError={setError}
          loading={loading}
        />
        {loading && mode === 'bulk' && (
          <div style={{ marginTop: 40, textAlign: 'center', color: '#666', fontSize: 15 }}>
            Screening all resumes in parallel — this may take a minute...
          </div>
        )}
        {bulkResults && !loading && (
          <Leaderboard data={bulkResults} role={user?.role} />
        )}
      </div>

      <div style={{ display: mode === 'recruiter' ? 'block' : 'none' }}>
        <RecruiterDashboard />
      </div>

      <div style={{ display: mode === 'candidate' ? 'block' : 'none' }}>
        <Upload
          setResult={setSingleResult}
          setLoading={setLoading}
          setError={setError}
          loading={loading && mode === 'candidate'}
          role={user?.role}
        />
        {loading && mode === 'candidate' && (
          <div style={{ marginTop: 40, textAlign: 'center', color: '#666', fontSize: 15 }}>
            Analysing your resume...
          </div>
        )}
        {singleResult && !loading && mode === 'candidate' && (
          <Results result={singleResult} role={user?.role} />
        )}
      </div>
    </div>
  )
}