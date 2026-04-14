import { useState } from 'react'
import Upload from './components/Upload'
import Results from './components/Results'
import BulkUpload from './components/BulkUpload'
import Leaderboard from './components/leaderboard'
import RecruiterDashboard from './components/RecruiterDashboard'

export default function App() {
  const [mode, setMode] = useState('single')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [singleResult, setSingleResult] = useState(null)
  const [bulkResults, setBulkResults] = useState(null)

  const tabs = [
    { id: 'single', label: 'Single resume' },
    { id: 'bulk', label: 'Bulk screening' },
    { id: 'recruiter', label: 'Recruiter dashboard' },
  ]

  const handleTabClick = (id) => {
    setMode(id)
    setError(null)
    if (id === 'recruiter') {
      window.dispatchEvent(new Event('recruiter-refresh'))
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 6 }}>
          Resume Screener
        </h1>
        <p style={{ color: '#666', fontSize: 15 }}>
          AI-powered resume screening for recruiters and candidates.
        </p>
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
        />
        {loading && mode === 'single' && (
          <div style={{ marginTop: 40, textAlign: 'center', color: '#666', fontSize: 15 }}>
            Analysing resume...
          </div>
        )}
        {singleResult && !loading && <Results result={singleResult} />}
      </div>

      <div style={{ display: mode === 'bulk' ? 'block' : 'none' }}>
        <BulkUpload
          setResults={setBulkResults}
          setLoading={setLoading}
          setError={setError}
          loading={loading}
        />
        {loading && (
          <div style={{ marginTop: 40, textAlign: 'center', color: '#666', fontSize: 15 }}>
            Screening all resumes in parallel — this may take a minute...
          </div>
        )}
        {bulkResults && !loading && <Leaderboard data={bulkResults} />}
      </div>

      <div style={{ display: mode === 'recruiter' ? 'block' : 'none' }}>
        <RecruiterDashboard />
      </div>
    </div>
  )
}