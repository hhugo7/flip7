'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) return setError('Entre ton prénom')
    setLoading(true); setError('')
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName: name.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    // Stocke les infos du joueur en session
    sessionStorage.setItem('playerId', data.player.id)
    sessionStorage.setItem('playerName', data.player.name)
    sessionStorage.setItem('isAdmin', 'true')
    router.push(`/lobby/${data.game.code}`)
  }

  async function handleJoin() {
    if (!name.trim()) return setError('Entre ton prénom')
    if (code.trim().length !== 4) return setError('Code à 4 lettres')
    setLoading(true); setError('')
    const res = await fetch(`/api/games/${code.toUpperCase()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', playerName: name.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    sessionStorage.setItem('playerId', data.player.id)
    sessionStorage.setItem('playerName', data.player.name)
    sessionStorage.setItem('isAdmin', 'false')
    router.push(`/lobby/${code.toUpperCase()}`)
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0f0e17', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input { outline: none; }
        .btn { cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.15s; }
        .btn:hover { transform: translateY(-1px); }
        .btn:active { transform: scale(0.98); }
      `}</style>

      {mode === 'home' && (
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            FLIP<span style={{ color: '#f5a623' }}>7</span>
          </h1>
          <p style={{ color: '#a7a9be', marginTop: 8, marginBottom: 48, fontSize: 16 }}>
            Compteur de score multijoueur en temps réel
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <button className="btn" onClick={() => setMode('create')} style={{
              background: '#f5a623', color: '#0f0e17', padding: '20px 24px',
              borderRadius: 16, fontSize: 16, fontWeight: 700
            }}>
              ✦ Créer une partie
            </button>
            <button className="btn" onClick={() => setMode('join')} style={{
              background: '#1a1927', color: '#fff', padding: '20px 24px',
              borderRadius: 16, fontSize: 16, border: '1px solid rgba(255,255,255,0.1)'
            }}>
              → Rejoindre
            </button>
          </div>
          <div style={{ marginTop: 24 }}>
            <button className="btn" onClick={() => router.push('/admin')} style={{
              background: 'none', color: '#a7a9be', fontSize: 13, textDecoration: 'underline'
            }}>
              Admin — stats joueurs
            </button>
          </div>
        </div>
      )}

      {(mode === 'create' || mode === 'join') && (
        <div style={{
          background: '#1a1927', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: 36, maxWidth: 380, width: '100%'
        }}>
          <button onClick={() => { setMode('home'); setError('') }} style={{
            background: 'none', border: 'none', color: '#a7a9be', cursor: 'pointer',
            fontSize: 13, marginBottom: 20, padding: 0
          }}>← Retour</button>

          <h2 style={{ fontFamily: 'Syne', fontSize: 22, color: '#fff', marginBottom: 24 }}>
            {mode === 'create' ? 'Nouvelle partie' : 'Rejoindre'}
          </h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#a7a9be', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Ton prénom
            </label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (mode === 'create' ? handleCreate() : handleJoin())}
              placeholder="Ex: Marie"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10,
                background: '#242336', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', fontSize: 16
              }}
            />
          </div>

          {mode === 'join' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#a7a9be', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Code de la partie
              </label>
              <input
                value={code} onChange={e => setCode(e.target.value.toUpperCase().slice(0, 4))}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="XXXX"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10,
                  background: '#242336', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f5a623', fontSize: 28, fontFamily: 'Syne', letterSpacing: 8, textAlign: 'center'
                }}
              />
            </div>
          )}

          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button
            className="btn"
            onClick={mode === 'create' ? handleCreate : handleJoin}
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: loading ? '#888' : '#f5a623', color: '#0f0e17',
              fontSize: 16, fontWeight: 700, marginTop: 8
            }}
          >
            {loading ? 'Chargement...' : mode === 'create' ? 'Créer la partie' : 'Rejoindre'}
          </button>
        </div>
      )}
    </main>
  )
}
