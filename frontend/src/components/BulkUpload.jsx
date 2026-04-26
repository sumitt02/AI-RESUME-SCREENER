import { useState } from 'react'
import axios from 'axios'

export default function BulkUpload({ setResults, setLoading, setError, loading }) {
  const [file, setFile] = useState(null)
  const [jd, setJd] = useState('')
  const [jobTitle, setJobTitle] = useState('')

  const handleSubmit = async () => {
    if (!file) return setError('Please upload a ZIP file of resumes')
    if (!jobTitle.trim()) return setError('Please enter a job title')
    if (!jd.trim()) return setError('Please paste a job description')

    setError(null)
    setLoading(true)
    setResults(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('job_description', jd)
    formData.append('job_title', jobTitle)

    try {
      const res = await axios.post('https://ai-resume-screener-production-f337.up.railway.app/api/bulk-score', formData)
      setResults(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        onClick={() => document.getElementById('zip-input').click()}
        style={{
          border: `2px dashed ${file ? '#1D9E75' : '#ddd'}`,
          borderRadius: 12, padding: '32px 20px',
          textAlign: 'center', cursor: 'pointer',
          background: file ? '#f0faf6' : '#fff',
          transition: 'all 0.15s'
        }}
      >
        <input
          id="zip-input"
          type="file"
          accept=".zip"
          style={{ display: 'none' }}
          onChange={(e) => setFile(e.target.files[0])}
        />
        {file ? (
          <p style={{ color: '#1D9E75', fontWeight: 500 }}>{file.name}</p>
        ) : (
          <>
            <p style={{ fontWeight: 500, marginBottom: 4 }}>Upload ZIP of resumes</p>
            <p style={{ color: '#999', fontSize: 13 }}>ZIP file containing multiple PDF resumes</p>
          </>
        )}
      </div>

      <input
        placeholder="Job title (e.g. Senior Frontend Engineer)"
        value={jobTitle}
        onChange={(e) => setJobTitle(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px',
          border: '1px solid #ddd', borderRadius: 12,
          fontSize: 14, outline: 'none', background: '#fff'
        }}
      />

      <textarea
        placeholder="Paste the job description here..."
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        rows={6}
        style={{
          width: '100%', padding: '12px 14px',
          border: '1px solid #ddd', borderRadius: 12,
          fontSize: 14, resize: 'vertical',
          outline: 'none', background: '#fff'
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          padding: '12px 24px',
          background: loading ? '#ccc' : '#1D9E75',
          color: '#fff', border: 'none',
          borderRadius: 10, fontSize: 15, fontWeight: 500
        }}
      >
        {loading ? 'Screening resumes...' : 'Screen All Resumes'}
      </button>
    </div>
  )
}