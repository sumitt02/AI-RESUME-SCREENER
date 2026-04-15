import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

export default function Results({ result, role = 'candidate' }) {
  if (!result || !result.score) return null
  const { candidate, score } = result
  const radarData = Object.entries(score.breakdown).map(([key, value]) => ({
    dimension: key.replace(/_/g, ' '), score: value
  }))
  const scoreColor = score.total_score >= 75 ? '#1D9E75' : score.total_score >= 50 ? '#EF9F27' : '#E24B4A'

  return (
    <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {result.duplicate && result.duplicate_info && (
        <div style={{ background: '#FAEEDA', border: '1px solid #EF9F27', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ fontWeight: 500, fontSize: 14, color: '#633806', marginBottom: 4 }}>Duplicate detected</p>
          <p style={{ fontSize: 13, color: '#854F0B', lineHeight: 1.6 }}>{result.duplicate_info.message}</p>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>Candidate</p>
          <p style={{ fontSize: 20, fontWeight: 600 }}>{candidate}</p>
          <p style={{ fontSize: 13, color: '#666', marginTop: 6 }}>{score.summary}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{score.total_score}</p>
          <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>out of 100</p>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '24px' }}>
        <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Score breakdown</p>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
            <Radar dataKey="score" fill="#7F77DD" fillOpacity={0.35} stroke="#7F77DD" />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#1D9E75', marginBottom: 10 }}>Matched skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {score.matched_skills.map(s => (
              <span key={s} style={{ background: '#E1F5EE', color: '#085041', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>{s}</span>
            ))}
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#E24B4A', marginBottom: 10 }}>Missing skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {score.missing_skills.map(s => (
              <span key={s} style={{ background: '#FCEBEB', color: '#A32D2D', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {role === 'recruiter' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#1D9E75', marginBottom: 10 }}>Green flags</p>
            {score.green_flags.map((f, i) => (
              <p key={i} style={{ fontSize: 13, color: '#444', marginBottom: 6, lineHeight: 1.5 }}>+ {f}</p>
            ))}
          </div>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#E24B4A', marginBottom: 10 }}>Red flags</p>
            {score.red_flags.map((f, i) => (
              <p key={i} style={{ fontSize: 13, color: '#444', marginBottom: 6, lineHeight: 1.5 }}>- {f}</p>
            ))}
          </div>
        </div>
      )}

      {role === 'candidate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>How to improve your score</p>
            {score.improvements.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, padding: '8px 12px', background: '#f8f8f7', borderRadius: 8 }}>
                <span style={{ color: '#7F77DD', fontWeight: 600, flexShrink: 0 }}>{i + 1}.</span>
                <p style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{tip}</p>
              </div>
            ))}
          </div>

          {score.learning_resources && score.learning_resources.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Resources to close your skill gaps</p>
              {score.learning_resources.map((item, i) => (
                <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < score.learning_resources.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <span style={{ background: '#FCEBEB', color: '#A32D2D', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                    {item.skill}
                  </span>
                  <p style={{ fontSize: 12, color: '#666', margin: '8px 0 10px', lineHeight: 1.5 }}>{item.reason}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(item.resources || []).map((r, j) => (
                      <a key={j} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8f8f7', borderRadius: 8, textDecoration: 'none', border: '1px solid #eee' }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 2 }}>{r.title}</p>
                          <p style={{ fontSize: 11, color: '#999' }}>{r.platform} · {r.duration}</p>
                        </div>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: r.type === 'free' ? '#E1F5EE' : '#EEEDFE', color: r.type === 'free' ? '#085041' : '#3C3489', fontWeight: 500, flexShrink: 0, marginLeft: 12 }}>
                          {r.type}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
