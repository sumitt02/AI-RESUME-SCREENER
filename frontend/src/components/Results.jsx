import { useEffect, useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

function AnimatedScore({ target, color }) {
  const [score, setScore] = useState(0)

  useEffect(() => {
    const duration = 1200
    const steps = 60
    const increment = target / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= target) {
        setScore(target)
        clearInterval(interval)
      } else {
        setScore(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(interval)
  }, [target])

  return (
    <p style={{
      fontSize: 56, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.02em',
      fontVariantNumeric: 'tabular-nums'
    }}>{score}</p>
  )
}

function ProgressBar({ label, value, delay = 0 }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  const color = value >= 75 ? '#10B981' : value >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{label}</span>
        <span style={{ fontSize: 12, color, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      </div>
      <div style={{
        width: '100%', height: 6, background: 'var(--bg-elevated)',
        borderRadius: 100, overflow: 'hidden'
      }}>
        <div style={{
          width: `${width}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}88 0%, ${color} 100%)`,
          borderRadius: 100, transition: 'width 1s ease-out',
          boxShadow: `0 0 12px ${color}66`
        }} />
      </div>
    </div>
  )
}

function SectionHeader({ icon, title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      marginTop: 8, marginBottom: 4
    }}>
      <span style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: 'var(--accent-bright)'
      }}>{icon}</span>
      <p style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.12em'
      }}>{title}</p>
    </div>
  )
}

export default function Results({ result, role = 'candidate' }) {
  if (!result || !result.score) return null
  const { candidate, score } = result
  const radarData = Object.entries(score.breakdown).map(([key, value]) => ({
    dimension: key.replace(/_/g, ' '), score: value
  }))
  const scoreColor = score.total_score >= 75 ? '#10B981' : score.total_score >= 50 ? '#F59E0B' : '#EF4444'

  const getResourceUrl = (r, skill) => {
    const query = r.search_query || (r.title + ' ' + skill + ' tutorial')
    const platform = (r.platform || '').toLowerCase()
    if (platform.includes('youtube')) return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query)
    if (platform.includes('udemy')) return 'https://www.udemy.com/courses/search/?q=' + encodeURIComponent(skill)
    if (platform.includes('coursera')) return 'https://www.coursera.org/search?query=' + encodeURIComponent(skill)
    return 'https://www.google.com/search?q=' + encodeURIComponent(query)
  }

  const handleShare = async () => {
    const text = `My ${role === 'candidate' ? 'fit' : 'screening'} score: ${score.total_score}/100 — ${score.summary}`
    if (navigator.share) {
      try { await navigator.share({ title: 'Resume Screening Result', text }) } catch (e) {}
    } else {
      navigator.clipboard.writeText(text)
      alert('Result copied to clipboard!')
    }
  }

  const handleDownload = () => {
    const reportText = `RESUME SCREENING REPORT
========================
Candidate: ${candidate}
Total Score: ${score.total_score}/100

SUMMARY
${score.summary}

SCORE BREAKDOWN
${Object.entries(score.breakdown).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}/100`).join('\n')}

MATCHED SKILLS
${score.matched_skills.join(', ')}

MISSING SKILLS
${score.missing_skills.join(', ')}

${role === 'recruiter' ? `GREEN FLAGS\n${score.green_flags.map(f => `+ ${f}`).join('\n')}\n\nRED FLAGS\n${score.red_flags.map(f => `- ${f}`).join('\n')}` : `IMPROVEMENTS\n${score.improvements.map((t, i) => `${i + 1}. ${t}`).join('\n')}`}
`
    const blob = new Blob([reportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${candidate.replace(/\s/g, '_')}_screening_report.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16, animation: 'slideUp 0.5s ease-out' }}>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={handleDownload} style={actionBtn}>
          ↓ Download report
        </button>
        <button onClick={handleShare} style={{ ...actionBtn, background: 'var(--gradient-1)', border: 'none', color: '#fff' }}>
          ↗ Share results
        </button>
      </div>

      {result.duplicate && result.duplicate_info && (
        <div style={{
          background: 'var(--warning-bg)', border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 12, padding: '14px 18px'
        }}>
          <p style={{ fontWeight: 600, fontSize: 13, color: '#FCD34D', marginBottom: 2 }}>Duplicate detected</p>
          <p style={{ fontSize: 12, color: '#FDE68A' }}>{result.duplicate_info.message}</p>
        </div>
      )}

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '28px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: -100, right: -100, width: 300, height: 300,
          background: `radial-gradient(circle, ${scoreColor}22 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Candidate</p>
            <p style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>{candidate}</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 500 }}>{score.summary}</p>
          </div>
          <div style={{
            background: 'var(--bg-elevated)', border: `2px solid ${scoreColor}`,
            borderRadius: 20, padding: '20px 32px', textAlign: 'center', flexShrink: 0,
            boxShadow: `0 4px 32px ${scoreColor}33`
          }}>
            <AnimatedScore target={score.total_score} color={scoreColor} />
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, fontWeight: 600, letterSpacing: '0.05em' }}>OUT OF 100</p>
          </div>
        </div>
      </div>

      <SectionHeader icon="◐" title="Performance" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Score breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border-bright)" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <Radar dataKey="score" fill="#7C3AED" fillOpacity={0.3} stroke="#A78BFA" strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Dimension scores">
          {Object.entries(score.breakdown).map(([key, value], i) => (
            <ProgressBar key={key} label={key.replace(/_/g, ' ')} value={value} delay={i * 100} />
          ))}
        </Card>
      </div>

      <SectionHeader icon="◈" title="Skills analysis" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Matched skills" titleColor="var(--success)">
          <SkillTags skills={score.matched_skills} type="success" />
        </Card>
        <Card title="Missing skills" titleColor="var(--danger)">
          <SkillTags skills={score.missing_skills} type="danger" />
        </Card>
      </div>

      {role === 'recruiter' && (
        <>
          <SectionHeader icon="◉" title="Recruiter insights" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card title="Green flags" titleColor="var(--success)">
              {score.green_flags.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>+</span>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f}</p>
                </div>
              ))}
            </Card>
            <Card title="Red flags" titleColor="var(--danger)">
              {score.red_flags.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <span style={{ color: 'var(--danger)', fontWeight: 700 }}>−</span>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f}</p>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}

      {role === 'candidate' && (
        <>
          <SectionHeader icon="◎" title="Action plan" />
          <Card title="How to improve">
            {score.improvements.map((tip, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, marginBottom: 10,
                padding: '12px 14px', background: 'var(--bg-elevated)',
                borderRadius: 10, border: '1px solid var(--border)'
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--gradient-1)', color: '#fff',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>{i + 1}</span>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tip}</p>
              </div>
            ))}
          </Card>

          {score.learning_resources && score.learning_resources.length > 0 && (
            <>
              <SectionHeader icon="◇" title="Learning path" />
              <Card title="Resources to close your gaps">
                {score.learning_resources.map((item, i) => (
                  <div key={i} style={{
                    marginBottom: 20, paddingBottom: 20,
                    borderBottom: i < score.learning_resources.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <span style={{
                      background: 'var(--danger-bg)', color: '#FCA5A5',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600
                    }}>{item.skill}</span>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '8px 0 12px', lineHeight: 1.5 }}>{item.reason}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(item.resources || []).map((r, j) => (
                        <a key={j} href={getResourceUrl(r, item.skill)} target="_blank" rel="noopener noreferrer"
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 14px', background: 'var(--bg-elevated)',
                            borderRadius: 10, border: '1px solid var(--border)',
                            textDecoration: 'none', transition: 'all 0.15s'
                          }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{r.title}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{r.platform} · {r.duration}</p>
                          </div>
                          <span style={{
                            fontSize: 10, padding: '4px 10px', borderRadius: 6,
                            background: r.type === 'free' ? 'var(--success-bg)' : 'rgba(124, 58, 237, 0.15)',
                            color: r.type === 'free' ? '#6EE7B7' : 'var(--accent-bright)',
                            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'
                          }}>{r.type}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}

function Card({ title, titleColor, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 20
    }}>
      <p style={{
        fontSize: 11, fontWeight: 600,
        color: titleColor || 'var(--text-tertiary)',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14
      }}>{title}</p>
      {children}
    </div>
  )
}

function SkillTags({ skills, type }) {
  const colors = type === 'success'
    ? { bg: 'var(--success-bg)', color: '#6EE7B7', border: 'rgba(16, 185, 129, 0.3)' }
    : { bg: 'var(--danger-bg)', color: '#FCA5A5', border: 'rgba(239, 68, 68, 0.3)' }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {skills.map(s => (
        <span key={s} style={{
          background: colors.bg, color: colors.color,
          border: `1px solid ${colors.border}`,
          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500
        }}>{s}</span>
      ))}
    </div>
  )
}

const actionBtn = {
  padding: '8px 16px', borderRadius: 10, fontSize: 12,
  border: '1px solid var(--border-bright)',
  background: 'var(--bg-card)', color: 'var(--text-secondary)',
  fontWeight: 500, transition: 'all 0.15s'
}