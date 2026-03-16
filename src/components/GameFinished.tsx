'use client'
import { useRouter } from 'next/navigation'
import { getAvatarColor, getInitials } from '@/lib/utils'
import type { PusherGameFinished } from '@/types'

interface Props {
  data: PusherGameFinished
  gameCode: string
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function GameFinished({ data, gameCode }: Props) {
  const router = useRouter()
  const sorted = [...data.final_scores].sort((a, b) => b.total_score - a.total_score)
  const winner = sorted[0]
  const maxScore = winner?.total_score || 1

  return (
    <div style={{
      minHeight: '100vh', padding: '32px 16px', background: '#0f0e17',
      fontFamily: "'DM Sans', sans-serif", color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center'
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=DM+Sans:wght@400;500&display=swap'); @keyframes pop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>

      {/* Winner banner */}
      <div style={{ textAlign: 'center', marginBottom: 36, animation: 'pop 0.4s ease' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🏆</div>
        <h1 style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color: '#f5a623', marginBottom: 4 }}>
          {winner?.name} gagne !
        </h1>
        <p style={{ color: '#a7a9be', fontSize: 15 }}>
          {winner?.total_score} points — Fin de la partie
        </p>
      </div>

      {/* Podium */}
      <div style={{
        background: '#1a1927', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: 24, width: '100%', maxWidth: 440, marginBottom: 20
      }}>
        <div style={{ fontSize: 12, color: '#a7a9be', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Classement final</div>
        {sorted.map((p, i) => {
          const color = getAvatarColor(i)
          const barPct = Math.round((p.total_score / maxScore) * 100)
          return (
            <div key={p.player_id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#242336', borderRadius: 10, padding: '12px 14px',
              marginBottom: 8,
              border: i === 0 ? '1px solid rgba(245,166,35,0.4)' : '1px solid transparent'
            }}>
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{MEDALS[i] || `#${i + 1}`}</span>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: color.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: color.text, flexShrink: 0
              }}>{getInitials(p.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: '#fff', marginBottom: 4 }}>{p.name}</div>
                <div style={{ height: 3, background: '#333', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${barPct}%`, background: i === 0 ? '#f5a623' : '#3b82f6', borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: i === 0 ? '#f5a623' : '#fff' }}>
                  {p.total_score}
                </div>
                {(p as any).flip7s > 0 && (
                  <div style={{ fontSize: 11, color: '#00d4aa' }}>
                    {(p as any).flip7s}× Flip 7
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats rapides */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        width: '100%', maxWidth: 440, marginBottom: 28
      }}>
        {[
          { label: 'Vainqueur', value: winner?.name },
          { label: 'Score max', value: `${winner?.total_score} pts` },
          { label: 'Flip 7 total', value: `${sorted.reduce((a, p) => a + ((p as any).flip7s || 0), 0)}` },
          { label: 'Joueurs', value: `${sorted.length}` },
        ].map(s => (
          <div key={s.label} style={{ background: '#1a1927', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#a7a9be', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, color: '#f5a623' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => router.push('/')} style={{
          padding: '12px 28px', borderRadius: 12, background: '#f5a623',
          color: '#0f0e17', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer'
        }}>
          Nouvelle partie
        </button>
        <button onClick={() => router.push('/admin')} style={{
          padding: '12px 28px', borderRadius: 12, background: '#1a1927',
          color: '#a7a9be', fontSize: 15, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
        }}>
          Voir les stats
        </button>
      </div>
    </div>
  )
}
