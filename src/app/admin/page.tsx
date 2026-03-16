'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAvatarColor, getInitials } from '@/lib/utils'
import type { ProfileStats } from '@/types'

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<ProfileStats[]>([])
  const [recentGames, setRecentGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch('/api/admin')
      .then(r => r.json())
      .then(({ stats, recentGames }) => {
        setStats(stats)
        setRecentGames(recentGames)
        setLoading(false)
      })
  }, [])

  async function addProfile() {
    if (!newName.trim()) return
    setAdding(true)
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (res.ok) {
      setNewName('')
      fetch('/api/admin').then(r => r.json()).then(({ stats }) => setStats(stats))
    }
    setAdding(false)
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f0e17', fontFamily: "'DM Sans', sans-serif", color: '#fff' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=DM+Sans:wght@400;500&display=swap'); * { box-sizing: border-box; }`}</style>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={() => router.push('/')} style={{
            background: '#1a1927', border: '1px solid rgba(255,255,255,0.08)',
            color: '#a7a9be', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13
          }}>← Accueil</button>
          <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800 }}>
            FLIP<span style={{ color: '#f5a623' }}>7</span> Stats
          </h1>
        </div>

        {/* Ajouter un profil */}
        <div style={{
          background: '#1a1927', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: 20, marginBottom: 24
        }}>
          <div style={{ fontSize: 13, color: '#a7a9be', marginBottom: 12 }}>Ajouter un joueur récurrent</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addProfile()}
              placeholder="Prénom"
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                background: '#242336', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', fontSize: 15, outline: 'none'
              }}
            />
            <button onClick={addProfile} disabled={adding || !newName.trim()} style={{
              padding: '10px 20px', borderRadius: 10, background: '#f5a623',
              color: '#0f0e17', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer'
            }}>
              {adding ? '...' : 'Ajouter'}
            </button>
          </div>
        </div>

        {/* Tableau stats joueurs */}
        {!loading && stats.length > 0 && (
          <div style={{
            background: '#1a1927', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 20, marginBottom: 24, overflowX: 'auto'
          }}>
            <div style={{ fontSize: 13, color: '#a7a9be', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
              Joueurs ({stats.length})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ color: '#a7a9be', fontSize: 12, textTransform: 'uppercase' }}>
                  {['Joueur', 'Parties', 'Victoires', '% Victoire', 'Score moy.', 'Meilleur', 'Flip 7'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 12px', fontWeight: 500, letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => {
                  const color = getAvatarColor(i)
                  return (
                    <tr key={s.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', background: color.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: color.text, flexShrink: 0
                          }}>{getInitials(s.name)}</div>
                          <span style={{ color: '#fff', fontWeight: 500 }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#fff' }}>{s.games_played}</td>
                      <td style={{ padding: '10px 12px', color: '#fff' }}>{s.games_won}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: Number(s.win_rate) > 50 ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)',
                          color: Number(s.win_rate) > 50 ? '#00d4aa' : '#a7a9be',
                          padding: '2px 8px', borderRadius: 6, fontSize: 13
                        }}>
                          {s.win_rate}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#fff', fontFamily: 'Syne', fontWeight: 700 }}>{s.avg_score}</td>
                      <td style={{ padding: '10px 12px', color: '#f5a623', fontFamily: 'Syne', fontWeight: 700 }}>{s.best_score}</td>
                      <td style={{ padding: '10px 12px', color: s.total_flip7s > 0 ? '#00d4aa' : '#a7a9be' }}>
                        {s.total_flip7s > 0 ? `${s.total_flip7s} ✦` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Parties récentes */}
        {!loading && recentGames.length > 0 && (
          <div style={{
            background: '#1a1927', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 20
          }}>
            <div style={{ fontSize: 13, color: '#a7a9be', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
              Parties récentes
            </div>
            {recentGames.map((g: any) => (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#242336', borderRadius: 10, padding: '10px 14px', marginBottom: 8
              }}>
                <div style={{
                  fontFamily: 'Syne', fontSize: 14, fontWeight: 700, color: '#f5a623',
                  letterSpacing: 3, background: 'rgba(245,166,35,0.1)', padding: '4px 10px', borderRadius: 6
                }}>{g.code}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontSize: 14 }}>
                    {g.player_count} joueurs • {g.winner_name ? `🏆 ${g.winner_name}` : 'Pas de gagnant'}
                  </div>
                  <div style={{ color: '#a7a9be', fontSize: 12 }}>
                    {new Date(g.finished_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', color: '#a7a9be', padding: 40 }}>Chargement...</div>}
        {!loading && stats.length === 0 && (
          <div style={{ textAlign: 'center', color: '#a7a9be', padding: 40 }}>
            Aucun joueur récurrent pour l'instant. Ajoute des profils ci-dessus.
          </div>
        )}
      </div>
    </div>
  )
}
