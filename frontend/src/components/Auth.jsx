import { useState } from 'react'
import axios from 'axios'

const API = 'https://ai-resume-screener-production-f337.up.railway.app/api/auth'

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('recruiter')
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company_name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const switchMode = (m) => {
    setMode(m); setError(null)
    setForm({ email: '', password: '', full_name: '', company_name: '' })
  }

  const handleSubmit = async () => {
    setError(null); setLoading(true)
    try {
      let res
      if (mode === 'login') {
        res = await axios.post(`${API}/login`, { email: form.email, password: form.password })
      } else {
        res = await axios.post(role === 'recruiter' ? `${API}/signup/recruiter` : `${API}/signup/candidate`, form)
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
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 480px' }}>

      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 80px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: -200, right: -200, width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', maxWidth: 560, animation: 'fadeIn 0.6s ease-out' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)',
            borderRadius: 100, padding: '6px 14px', marginBottom: 32
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-bright)', animation: 'pulse 2s infinite' }} />
            <span style={{ color: 'var(--accent-bright)', fontSize: 12, fontWeight: 500 }}>AI-Powered Resume Screening</span>
          </div>

          <h1 style={{
            fontSize: 56, fontWeight: 700, lineHeight: 1.05,
            background: 'linear-gradient(180deg, #fff 0%, #A1A1AA 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 20, letterSpacing: '-0.03em'
          }}>
            Hire smarter.<br />Apply with confidence.
          </h1>

          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 40, maxWidth: 480 }}>
            The AI resume platform that scores fit across 5 dimensions, detects duplicates automatically, and gives candidates personalised feedback in seconds.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 480 }}>
            {[
              { label: '10x', desc: 'Faster screening' },
              { label: '5', desc: 'Score dimensions' },
              { label: '< 30s', desc: 'Per resume' },
              { label: '100%', desc: 'Data isolation' }
            ].map((s, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '16px 20px',
                animation: `slideUp 0.6s ease-out ${0.1 * (i + 1)}s both`
              }}>
                <p style={{
                  fontSize: 28, fontWeight: 700,
                  background: 'var(--gradient-1)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  marginBottom: 4
                }}>
                  {s.label}
                </p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40
      }}>
        <div style={{ width: '100%', maxWidth: 360, animation: 'fadeIn 0.6s ease-out 0.2s both' }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em' }}>
              {mode === 'login' ? 'Welcome back' : 'Get started'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                style={{ color: 'var(--accent-bright)', cursor: 'pointer', fontWeight: 500 }}>
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </span>
            </p>
          </div>

          {mode === 'signup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {['recruiter', 'candidate'].map(r => (
                <button key={r} onClick={() => setRole(r)} style={{
                  padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                  border: `1px solid ${role === r ? 'var(--accent)' : 'var(--border-bright)'}`,
                  background: role === r ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                  color: role === r ? 'var(--accent-bright)' : 'var(--text-secondary)',
                  transition: 'all 0.15s'
                }}>
                  {r === 'recruiter' ? 'I hire' : 'I apply'}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'signup' && (
              <input placeholder="Full name" value={form.full_name}
                onChange={e => update('full_name', e.target.value)} style={inputStyle} />
            )}
            {mode === 'signup' && role === 'recruiter' && (
              <input placeholder="Company name" value={form.company_name}
                onChange={e => update('company_name', e.target.value)} style={inputStyle} />
            )}
            <input placeholder="Email" type="email" value={form.email}
              onChange={e => update('email', e.target.value)} style={inputStyle} />
            <input placeholder="Password" type="password" value={form.password}
              onChange={e => update('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={inputStyle} />
          </div>

          {error && (
            <div style={{
              marginTop: 12, padding: '10px 14px',
              background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 10, color: '#FCA5A5', fontSize: 13
            }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', marginTop: 20, padding: '14px',
            background: loading ? 'var(--bg-elevated)' : 'var(--gradient-1)',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
            boxShadow: loading ? 'none' : '0 4px 24px rgba(124, 58, 237, 0.35)'
          }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in →' : 'Create account →'}
          </button>

          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            By continuing you agree to our terms and privacy policy
          </p>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '12px 14px',
  border: '1px solid var(--border-bright)', borderRadius: 10,
  fontSize: 14, outline: 'none', background: 'var(--bg-card)',
  color: 'var(--text-primary)', transition: 'all 0.15s'
}