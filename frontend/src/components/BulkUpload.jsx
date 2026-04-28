import { useState } from 'react'
import axios from 'axios'

export default function BulkUpload({ setResults, setLoading, setError, loading }) {
  const [file, setFile] = useState(null)
  const [jd, setJd] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [dragging, setDragging] = useState(false)

  const handleSubmit = async () => {
    if (!file) return setError('Please upload a ZIP file of resumes')
    if (!jobTitle.trim()) return setError('Please enter a job title')
    if (!jd.trim()) return setError('Please paste a job description')
    setError(null); setLoading(true); setResults(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('job_description', jd)
    formData.append('job_title', jobTitle)
    try {
      const res = await axios.post('https://ai-resume-screener-production-f337.up.railway.app/api/bulk-score', formData)
      setResults(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.4s ease-out' }}>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault(); setDragging(false)
          const f = e.dataTransfer.files[0]
          if (f?.name.endsWith('.zip')) setFile(f)
          else setError('Only ZIP files accepted')
        }}
        onClick={() => document.getElementById('zip-input').click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--accent-bright)' : file ? 'var(--success)' : 'var(--border-bright)'}`,
          borderRadius: 16, padding: '40px 24px', textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(124, 58, 237, 0.08)' : file ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-card)',
          transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
        }}
      >
        <input id="zip-input" type="file" accept=".zip" style={{ display: 'none' }}
          onChange={e => setFile(e.target.files[0])} />
        {file ? (
          <div>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'var(--success-bg)', border: '1px solid var(--success)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, marginBottom: 12, color: 'var(--success)'
            }}>✓</div>
            <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--success)' }}>{file.name}</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 4 }}>Click to change file</p>
          </div>
        ) : (
          <div>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12, fontSize: 20
            }}>◇</div>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Drop ZIP file of resumes</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>or click to browse</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Job title (e.g. Senior Frontend Engineer)"
          value={jobTitle} onChange={e => setJobTitle(e.target.value)} style={inputStyle} />
        <textarea placeholder="Paste the full job description here..."
          value={jd} onChange={e => setJd(e.target.value)} rows={8}
          style={{ ...inputStyle, resize: 'vertical', height: 'auto', fontFamily: 'inherit' }} />
      </div>

      <button onClick={handleSubmit} disabled={loading} style={{
        padding: '14px 24px',
        background: loading ? 'var(--bg-elevated)' : 'var(--gradient-1)',
        color: '#fff', border: 'none', borderRadius: 12,
        fontSize: 15, fontWeight: 600,
        boxShadow: loading ? 'none' : '0 4px 24px rgba(124, 58, 237, 0.35)',
        transition: 'all 0.15s'
      }}>
        {loading ? 'Screening resumes...' : 'Screen All Resumes →'}
      </button>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '12px 14px',
  border: '1px solid var(--border-bright)', borderRadius: 10,
  fontSize: 14, outline: 'none',
  background: 'var(--bg-card)', color: 'var(--text-primary)',
  transition: 'all 0.15s'
}