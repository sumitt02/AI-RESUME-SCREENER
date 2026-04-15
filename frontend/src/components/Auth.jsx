import { useState } from 'react'
import axios from 'axios'

const API = 'http://127.0.0.1:8000/api/auth'

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('recruiter')
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', company_name: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const switchMode = (m) => {
    setMode(m)
    setError(null)
    setForm({ email: '', password: '', full_name: '', company_name: '' })
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      let res
      if (mode === 'login') {
        res = await axios.post(`${API}/login`, {
          email: form.email,
          password: form.password
        })
      } else {
        const endpoint = role === 'recruiter'
          ? `${API}/signup/recruiter`
          : `${API}/signup/candidate`
        res = await axios.post(endpoint, form)
      }
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      onLogin(res.data.user, res.data.access_token)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f8f8f7'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16,
        border: '1px solid #eee', padding: '40px 36px',
        width: '100%', maxWidth: 400
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
          Resume Screener
        </h1>
        <p style={{ fontSize: 14, color: '#999', marginBottom: 28 }}>
          AI-powered hiring platform
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex: 1, padding: '8px', borderRadius: 8,
              border: '1px solid #ddd', cursor: 'pointer',
              background: mode === m ? '#7F77DD' : '#fff',
              color: mode === m ? '#fff' : '#666',
              fontSize: 13, fontWeight: 500
            }}>
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        {mode === 'signup' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['recruiter', 'candidate'].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                flex: 1, padding: '7px', borderRadius: 8,
                border: `1px solid ${role === r ? '#7F77DD' : '#ddd'}`,
                cursor: 'pointer',
                background: role === r ? '#EEEDFE' : '#fff',
                color: role === r ? '#3C3489' : '#666',
                fontSize: 12, fontWeight: 500
              }}>
                {r === 'recruiter' ? 'I am a recruiter' : 'I am a candidate'}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <input
              placeholder="Full name"
              value={form.full_name}
              onChange={e => update('full_name', e.target.value)}
              style={{
                padding: '10px 14px', borderRadius: 8,
                border: '1px solid #ddd', fontSize: 14, outline: 'none'
              }}
            />
          )}

          {mode === 'signup' && role === 'recruiter' && (
            <input
              placeholder="Company name"
              value={form.company_name}
              onChange={e => update('company_name', e.target.value)}
              style={{
                padding: '10px 14px', borderRadius: 8,
                border: '1px solid #ddd', fontSize: 14, outline: 'none'
              }}
            />
          )}

          <input
            placeholder="Email address"
            type="email"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            style={{
              padding: '10px 14px', borderRadius: 8,
              border: '1px solid #ddd', fontSize: 14, outline: 'none'
            }}
          />

          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={e => update('password', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{
              padding: '10px 14px', borderRadius: 8,
              border: '1px solid #ddd', fontSize: 14, outline: 'none'
            }}
          />
        </div>

        {error && (
          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: '#fff0f0', borderRadius: 8,
            color: '#cc0000', fontSize: 13
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', marginTop: 16, padding: '11px',
            background: loading ? '#ccc' : '#7F77DD',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 500, cursor: 'pointer'
          }}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </div>
    </div>
  )
}