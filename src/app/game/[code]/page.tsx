'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { usePusher } from '@/lib/usePusher'
import { getAvatarColor, getInitials } from '@/lib/utils'
import ScoreInput from '@/components/ScoreInput'
import GameFinished from '@/components/GameFinished'
import type { Player, Game, PusherScoreSubmitted, PusherGameFinished } from '@/types'

export default function GamePage() {
  const router = useRouter()
  const params = useParams()
  const code = (params.code as string).toUpperCase()

  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [roundComplete, setRoundComplete] = useState(false)
  const [gameFinished, setGameFinished] = useState<PusherGameFinished | null>(null)
  const [loading, setLoading] = useState(true)
  const [liveEvents, setLiveEvents] = useState<string[]>([])

  useEffect(() => {
    const pid = sessionStorage.getItem('playerId')
    setMyPlayerId(pid)
    setIsAdmin(sessionStorage.getItem('isAdmin') === 'true')

    fetch(`/api/games?code=${code}`)
      .then(r => r.json())
      .then(({ game, players }) => {
        setGame(game)
        setPlayers(players)
        setLoading(false)
      })
  }, [code])

  usePusher({
    gameCode: code,
    onScoreSubmitted: (data: PusherScoreSubmitted) => {
      // Met à jour le score du joueur en temps réel
      setPlayers(prev => prev.map(p =>
        p.id === data.player_id ? { ...p, total_score: data.total_score } : p
      ))
      // Ajoute un événement en live feed
      const msg = data.did_bust
        ? `${data.player_name} a sauté 💥`
        : data.did_flip7
          ? `${data.player_name} FLIP 7 ! 🎉 +${data.round_score}`
          : `${data.player_name} +${data.round_score}`
      setLiveEvents(prev => [msg, ...prev].slice(0, 5))
    },
    onRoundEnd: (data) => {
      setRoundComplete(true)
      setPlayers(data.scores.map((s: any) => ({
        ...players.find(p => p.id === s.player_id)!,
        total_score: s.total_score
      })))
    },
    onNextRound: (data) => {
      setRoundComplete(false)
      setGame(g => g ? { ...g, current_round: data.round_number } : g)
    },
    onGameFinished: (data: PusherGameFinished) => {
      setGameFinished(data)
    },
  })

  async function nextRound() {
    await fetch(`/api/games/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'next-round' }),
    })
  }

  if (loading) return <div style={{ ...pageStyle, justifyContent: 'center', alignItems: 'center' }}><p style={{ color: '#a7a9be' }}>Chargement...</p></div>
  if (gameFinished) return <GameFinished data={gameFinished} gameCode={code} />

  const sortedPlayers = [...players].sort((a, b) => b.total_score - a.total_score)
  const myPlayer = players.find(p => p.id === myPlayerId)

  return (
    <div style={pageStyle}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#1a1927', borderRadius: 14, padding: '12px 20px',
        border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16
      }}>
        <div>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#fff' }}>
            Manche {game?.current_round}
          </div>
          <div style={{ color: '#a7a9be', fontSize: 12 }}>Premier à 200 points gagne</div>
        </div>
        <div style={{
          fontFamily: 'Syne', fontSize: 16, fontWeight: 700, color: '#f5a623',
          letterSpacing: 4, background: '#242336', padding: '6px 14px', borderRadius: 8
        }}>{code}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Classement */}
        <div style={{
          background: '#1a1927', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: 16, gridColumn: '1 / -1'
        }}>
          <div style={{ fontSize: 12, color: '#a7a9be', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Classement</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedPlayers.map((p, i) => {
              const color = getAvatarColor(players.indexOf(p))
              const pct = Math.min((p.total_score / 200) * 100, 100)
              const isMe = p.id === myPlayerId
              return (
                <div key={p.id} style={{
                  background: isMe ? 'rgba(245,166,35,0.08)' : '#242336',
                  border: isMe ? '1px solid rgba(245,166,35,0.3)' : '1px solid transparent',
                  borderRadius: 10, padding: '10px 14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ color: '#a7a9be', fontSize: 12, width: 16 }}>#{i + 1}</span>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: color.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: color.text, flexShrink: 0
                    }}>{getInitials(p.name)}</div>
                    <span style={{ flex: 1, color: '#fff', fontWeight: 500, fontSize: 14 }}>
                      {p.name} {isMe && <span style={{ color: '#a7a9be', fontSize: 11 }}>(moi)</span>}
                    </span>
                    <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: i === 0 ? '#f5a623' : '#fff' }}>
                      {p.total_score}
                    </span>
                  </div>
                  <div style={{ height: 3, background: '#333', borderRadius: 2 }}>
                    <div style={{
                      height: '100%', borderRadius: 2, transition: 'width 0.5s ease',
                      background: pct > 80 ? '#ef4444' : i === 0 ? '#f5a623' : '#3b82f6',
                      width: `${pct}%`, minWidth: pct > 0 ? 4 : 0
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Live feed */}
      {liveEvents.length > 0 && (
        <div style={{
          background: '#1a1927', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: '12px 16px', marginBottom: 16
        }}>
          {liveEvents.map((e, i) => (
            <div key={i} style={{
              fontSize: 13, color: i === 0 ? '#fff' : '#a7a9be',
              padding: '3px 0', transition: 'all 0.3s'
            }}>{e}</div>
          ))}
        </div>
      )}

      {/* Saisie score */}
      {myPlayer && !roundComplete && (
        <div style={{
          background: '#1a1927', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: 20, marginBottom: 16
        }}>
          <div style={{ fontSize: 14, color: '#a7a9be', marginBottom: 16, fontWeight: 500 }}>
            Manche {game?.current_round} — Ton score
          </div>
          <ScoreInput
            gameId={game!.id}
            playerId={myPlayerId!}
            roundNumber={game!.current_round}
            onSubmitted={(score) => {}}
          />
        </div>
      )}

      {/* Admin : passer à la manche suivante */}
      {isAdmin && roundComplete && (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <p style={{ color: '#a7a9be', fontSize: 13, marginBottom: 12 }}>Tous les scores sont soumis</p>
          <button
            onClick={nextRound}
            style={{
              padding: '14px 32px', borderRadius: 12, background: '#f5a623',
              color: '#0f0e17', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer'
            }}
          >
            Manche suivante →
          </button>
        </div>
      )}
      {!isAdmin && roundComplete && (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <p style={{ color: '#a7a9be', fontSize: 14 }}>En attente de la manche suivante...</p>
        </div>
      )}
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh', padding: 16, background: '#0f0e17',
  fontFamily: "'DM Sans', sans-serif", color: '#fff', display: 'flex', flexDirection: 'column'
}
