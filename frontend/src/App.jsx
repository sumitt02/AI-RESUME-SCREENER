import { useState } from 'react'
import Upload from './components/Upload'
import Results from './components/Results'

export default function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 6 }}>
          Resume Screener
        </h1>
        <p style={{ color: '#666', fontSize: 15 }}>
          Upload a resume and paste a job description to get an AI-powered fit score.
        </p>
      </div>

      <Upload
        setResult={setResult}
        setLoading={setLoading}
        setError={setError}
        loading={loading}
      />

      {error && (
        <div style={{
          marginTop: 20,
          padding: '12px 16px',
          background: '#fff0f0',
          border: '1px solid #ffcccc',
          borderRadius: 8,
          color: '#cc0000',
          fontSize: 14
        }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{
          marginTop: 40,
          textAlign: 'center',
          color: '#666',
          fontSize: 15
        }}>
          Analysing resume...
        </div>
      )}

      {result && !loading && <Results result={result} />}
    </div>
  )
}