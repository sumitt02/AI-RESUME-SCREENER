import { useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

function ScoreBadge({ score }) {
  const color = score >= 75 ? '#1D9E75' : score >= 50 ? '#EF9F27' : '#E24B4A'
  const bg = score >= 75 ? '#E1F5EE' : score >= 50 ? '#FAEEDA' : '#FCEBEB'
  return (
    <span style={{
      background: bg, color, fontWeight: 600,
      padding: '4px 12px', borderRadius: 20, fontSize: 13
    }}>
      {score}
    </span>
  )
}

function CandidateDetail({ candidate, onClose, role }) {
  const radarData = Object.entries(candidate.breakdown || {}).map(([key, value]) => ({
    dimension: key.replace(/_/g, ' '),
    score: value
  }))

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28,
        width: '100%', maxWidth: 600, maxHeight: '85vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>{candidate.candidate}</h2>
            <p style={{ color: '#666', fontSize: 13 }}>{candidate.email}</p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            fontSize: 20, color: '#999', cursor: 'pointer'
          }}>✕</button>
        </div>

        {candidate.duplicate && candidate.duplicate_info && (
          <div style={{
            background: '#FAEEDA', border: '1px solid #EF9F27',
            borderRadius: 10, padding: '12px 16px', marginBottom: 16
          }}>
            <p style={{ fontWeight: 500, fontSize: 13, color: '#633806', marginBottom: 4 }}>
              Duplicate detected —{' '}
              {candidate.duplicate_info.type === 'exact' ? 'Exact match' :
                candidate.duplicate_info.type === 'same_candidate' ? 'Same candidate' : 'Similar resume'}
            </p>
            <p style={{ fontSize: 12, color: '#854F0B' }}>
              {candidate.duplicate_info.message}
            </p>
          </div>
        )}

        <p style={{ fontSize: 14, color: '#444', marginBottom: 20, lineHeight: 1.6 }}>
          {candidate.summary}
        </p>

        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
            <Radar dataKey="score" fill="#7F77DD" fillOpacity={0.35} stroke="#7F77DD" />
          </RadarChart>
        </ResponsiveContainer>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <div style={{ background: '#f8f8f7', borderRadius: 10, padding: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#1D9E75', marginBottom: 8 }}>
              Matched skills
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {(candidate.matched_skills || []).map(s => (
                <span key={s} style={{
                  background: '#E1F5EE', color: '#085041',
                  padding: '2px 8px', borderRadius: 20, fontSize: 11
                }}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ background: '#f8f8f7', borderRadius: 10, padding: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#E24B4A', marginBottom: 8 }}>
              Missing skills
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {(candidate.missing_skills || []).map(s => (
                <span key={s} style={{
                  background: '#FCEBEB', color: '#A32D2D',
                  padding: '2px 8px', borderRadius: 20, fontSize: 11
                }}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        {role === 'recruiter' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div style={{ background: '#f8f8f7', borderRadius: 10, padding: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#1D9E75', marginBottom: 8 }}>
                Green flags
              </p>
              {(candidate.green_flags || []).map((f, i) => (
                <p key={i} style={{ fontSize: 12, color: '#444', marginBottom: 4 }}>+ {f}</p>
              ))}
            </div>
            <div style={{ background: '#f8f8f7', borderRadius: 10, padding: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#E24B4A', marginBottom: 8 }}>
                Red flags
              </p>
              {(candidate.red_flags || []).map((f, i) => (
                <p key={i} style={{ fontSize: 12, color: '#444', marginBottom: 4 }}>- {f}</p>
              ))}
            </div>
          </div>
        )}

        {role === 'candidate' && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
              How to improve your score
            </p>
            {(candidate.improvements || []).map((tip, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, marginBottom: 6,
                padding: '7px 10px', background: '#f8f8f7', borderRadius: 8
              }}>
                <span style={{ color: '#7F77DD', fontWeight: 600 }}>{i + 1}.</span>
                <p style={{ fontSize: 12, color: '#444', lineHeight: 1.5 }}>{tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Leaderboard({ data, role = 'recruiter' }) {
  const [selected, setSelected] = useState(null)

  const duplicateCount = data.results.filter(r => r.duplicate).length

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>
          Candidate Leaderboard
        </h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {duplicateCount > 0 && (
            <span style={{
              background: '#FAEEDA', color: '#633806',
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500
            }}>
              {duplicateCount} duplicate{duplicateCount > 1 ? 's' : ''} skipped
            </span>
          )}
          <span style={{
            background: '#EEEDFE', color: '#3C3489',
            padding: '4px 12px', borderRadius: 20, fontSize: 13
          }}>
            {data.total_candidates} candidates screened
          </span>
        </div>
      </div>

      {data.duplicates_skipped > 0 && (
        <div style={{
          background: '#FAEEDA', border: '1px solid #EF9F27',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          fontSize: 13, color: '#633806'
        }}>
          {data.duplicates_skipped} duplicate resume{data.duplicates_skipped > 1 ? 's were' : ' was'} detected
          and skipped. {data.saved} new candidate{data.saved !== 1 ? 's' : ''} saved.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.results.map((c, i) => (
          <div key={i} style={{
            background: '#fff',
            border: c.duplicate
              ? '1px solid #EF9F27'
              : i === 0 ? '2px solid #1D9E75' : '1px solid #eee',
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 16,
            opacity: c.duplicate ? 0.7 : 1
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: '50%',
              background: c.duplicate ? '#FAEEDA' :
                i === 0 ? '#1D9E75' : i === 1 ? '#7F77DD' : i === 2 ? '#EF9F27' : '#f0f0f0',
              color: c.duplicate ? '#633806' : i < 3 ? '#fff' : '#999',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, flexShrink: 0
            }}>
              {c.duplicate ? '!' : i + 1}
            </span>

            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, fontSize: 14 }}>{c.candidate}</p>
              <p style={{ fontSize: 12, color: '#999' }}>
                {c.email || c.filename}
                {c.duplicate && c.duplicate_info && (
                  <span style={{ color: '#854F0B', marginLeft: 6 }}>
                    · {c.duplicate_info.type === 'exact' ? 'Exact duplicate' :
                      c.duplicate_info.type === 'same_candidate' ? 'Same candidate' : 'Similar resume'}
                  </span>
                )}
              </p>
            </div>

            <ScoreBadge score={c.total_score} />

            {c.status === 'success' && (
              <button
                onClick={() => setSelected(c)}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: '1px solid #ddd', background: 'transparent',
                  fontSize: 12, cursor: 'pointer', color: '#666'
                }}
              >
                View details
              </button>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <CandidateDetail
          candidate={selected}
          onClose={() => setSelected(null)}
          role={role}
        />
      )}
    </div>
  )
}