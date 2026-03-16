'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { usePusher } from '@/lib/usePusher'
import { getAvatarColor, getInitials } from '@/lib/utils'
import type { Player, Game } from '@/types'

export default function LobbyPage() {
  const router = useRouter()
  const params = useParams()
  const code = (params.code as string).toUpperCase()

  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem('isAdmin') === 'true')
    fetch(`/api/games?code=${code}`)
      .then(r => r.json())
      .then(({ game, players }) => {
        setGame(game)
        setPlayers(players)
        setLoading(false)
        // Si la partie est déjà en cours, redirige
        if (game?.status === 'playing') router.push(`/game/${code}`)
      })
  }, [code])

  usePusher({
    gameCode: code,
    onPlayerJoined: ({ player }) => setPlayers(p => [...p, player]),
    onGameStarted: () => router.push(`/game/${code}`),
  })

  async function startGame() {
    await fetch(`/api/games/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    })
  }

  if (loading) return (
    <main style={mainStyle}>
      <p style={{ color: '#a7a9be' }}>Chargement...</p>
    </main>
  )

  return (
    <main style={mainStyle}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=DM+Sans:wght@400;500&display=swap');`}</style>

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p style={{ color: '#a7a9be', fontSize: 14, marginBottom: 8 }}>Code de la partie</p>
        <div style={{
          fontFamily: 'Syne', fontSize: 52, fontWeight: 800, color: '#f5a623',
          letterSpacing: 12, background: '#1a1927', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: '16px 32px', display: 'inline-block'
        }}>{code}</div>
        <p style={{ color: '#a7a9be', fontSize: 13, marginTop: 8 }}>
          Partage ce code pour inviter des joueurs
        </p>
      </div>

      <div style={{
        background: '#1a1927', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: 28, maxWidth: 420, width: '100%', marginBottom: 24
      }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: 16, color: '#fff', marginBottom: 16 }}>
          Joueurs ({players.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {players.map((p, i) => {
            const color = getAvatarColor(i)
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#242336', borderRadius: 10, padding: '10px 14px',
                animation: 'slideIn 0.2s ease'
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: color.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 13, fontWeight: 700, color: color.text,
                  flexShrink: 0
                }}>
                  {getInitials(p.name)}
                </div>
                <span style={{ color: '#fff', fontWeight: 500 }}>{p.name}</span>
                {p.is_admin && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, background: 'rgba(245,166,35,0.15)',
                    color: '#f5a623', padding: '2px 8px', borderRadius: 6
                  }}>Hôte</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {isAdmin ? (
        <button
          onClick={startGame}
          disabled={players.length < 2}
          style={{
            padding: '14px 40px', borderRadius: 14, background: players.length < 2 ? '#444' : '#f5a623',
            color: '#0f0e17', fontSize: 16, fontWeight: 700, border: 'none',
            cursor: players.length < 2 ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s'
          }}
        >
          {players.length < 2 ? 'En attente de joueurs...' : `Démarrer (${players.length} joueurs)`}
        </button>
      ) : (
        <p style={{ color: '#a7a9be', fontSize: 14 }}>
          En attente que l'hôte démarre la partie...
        </p>
      )}

      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </main>
  )
}

const mainStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', padding: '24px',
  background: '#0f0e17', fontFamily: "'DM Sans', sans-serif", color: '#fff'
}
