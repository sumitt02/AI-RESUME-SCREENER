import { useState } from 'react'
import axios from 'axios'

export default function Upload({ setResult, setLoading, setError, loading, role = 'recruiter' }) {
  const [file, setFile] = useState(null)
  const [jd, setJd] = useState('')
  const [dragging, setDragging] = useState(false)
  const [jobTitle, setJobTitle] = useState('')

  const handleSubmit = async () => {
    if (!file) return setError('Please upload a resume PDF')
    if (!jobTitle.trim()) return setError('Please enter a job title')
    if (!jd.trim()) return setError('Please paste a job description')

    setError(null)
    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('job_description', jd)
    formData.append('job_title', jobTitle)

    const endpoint = role === 'candidate'
      ? 'http://127.0.0.1:8000/api/candidate-score'
      : 'http://127.0.0.1:8000/api/score'

    try {
      const res = await axios.post(endpoint, formData)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const dropped = e.dataTransfer.files[0]
          if (dropped?.type === 'application/pdf') setFile(dropped)
          else setError('Only PDF files accepted')
        }}
        onClick={() => document.getElementById('file-input').click()}
        style={{
          border: `2px dashed ${dragging ? '#7F77DD' : '#ddd'}`,
          borderRadius: 12, padding: '32px 20px',
          textAlign: 'center', cursor: 'pointer',
          background: dragging ? '#f5f4ff' : '#fff',
          transition: 'all 0.15s'
        }}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={(e) => setFile(e.target.files[0])}
        />
        {file ? (
          <p style={{ color: '#7F77DD', fontWeight: 500 }}>{file.name}</p>
        ) : (
          <>
            <p style={{ fontWeight: 500, marginBottom: 4 }}>Drop resume PDF here</p>
            <p style={{ color: '#999', fontSize: 13 }}>or click to browse</p>
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
          background: loading ? '#ccc' : '#7F77DD',
          color: '#fff', border: 'none',
          borderRadius: 10, fontSize: 15,
          fontWeight: 500, transition: 'background 0.15s'
        }}
      >
        {loading ? 'Analysing...' : 'Screen Resume'}
      </button>
    </div>
  )
}