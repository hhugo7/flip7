'use client'
import { useState } from 'react'
import { calculateRoundScore } from '@/types'

interface ScoreInputProps {
  gameId: string
  playerId: string
  roundNumber: number
  onSubmitted: (score: number) => void
}

export default function ScoreInput({ gameId, playerId, roundNumber, onSubmitted }: ScoreInputProps) {
  const [numberCards, setNumberCards] = useState('')
  const [bonusDouble, setBonusDouble] = useState(false)
  const [bonusPoints, setBonusPoints] = useState(0)
  const [didFlip7, setDidFlip7] = useState(false)
  const [didBust, setDidBust] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const numVal = parseInt(numberCards) || 0
  const preview = calculateRoundScore(numVal, bonusDouble, bonusPoints, didFlip7, didBust)

  const bonusOptions = [0, 2, 4, 6, 8, 10]

  async function handleSubmit() {
    setSubmitting(true)
    const res = await fetch('/api/rounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId, playerId, roundNumber,
        numberCardsTotal: numVal,
        bonusDouble, bonusPoints, didFlip7, didBust
      }),
    })
    if (res.ok) {
      setSubmitted(true)
      onSubmitted(preview)
    }
    setSubmitting(false)
  }

  if (submitted) return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 36, fontFamily: 'Syne', fontWeight: 800, color: '#f5a623' }}>
        +{preview}
      </div>
      <p style={{ color: '#a7a9be', fontSize: 13, marginTop: 4 }}>Score soumis ✓</p>
    </div>
  )

  return (
    <div>
      {/* Sauté ? */}
      <div
        onClick={() => { setDidBust(!didBust); if (!didBust) { setBonusDouble(false); setBonusPoints(0); setDidFlip7(false) } }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          padding: '10px 12px', borderRadius: 10,
          background: didBust ? 'rgba(239,68,68,0.15)' : '#242336',
          border: `1px solid ${didBust ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
          color: didBust ? '#ef4444' : '#a7a9be', fontSize: 14, marginBottom: 12, userSelect: 'none'
        }}
      >
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: didBust ? '#ef4444' : 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
        J'ai sauté (doublon reçu)
      </div>

      {!didBust && (
        <>
          {/* Cartes numéro */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Total cartes numéro</label>
            <input
              type="number" min="0" max="78" value={numberCards}
              onChange={e => setNumberCards(e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
          </div>

          {/* Bonus double */}
          <div
            onClick={() => setBonusDouble(!bonusDouble)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              padding: '8px 12px', borderRadius: 10,
              background: bonusDouble ? 'rgba(245,166,35,0.15)' : '#242336',
              border: `1px solid ${bonusDouble ? '#f5a623' : 'rgba(255,255,255,0.08)'}`,
              color: bonusDouble ? '#f5a623' : '#a7a9be', fontSize: 13, marginBottom: 10, userSelect: 'none'
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: bonusDouble ? '#f5a623' : 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            Bonus ×2 (double le total numéros)
          </div>

          {/* Bonus points */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Bonus points</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {bonusOptions.map(v => (
                <button
                  key={v}
                  onClick={() => setBonusPoints(v)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: bonusPoints === v ? '#f5a623' : '#242336',
                    color: bonusPoints === v ? '#0f0e17' : '#a7a9be',
                    fontSize: 13, fontWeight: bonusPoints === v ? 700 : 400, transition: 'all 0.1s'
                  }}
                >
                  {v === 0 ? 'Aucun' : `+${v}`}
                </button>
              ))}
            </div>
          </div>

          {/* Flip 7 */}
          <div
            onClick={() => setDidFlip7(!didFlip7)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              padding: '8px 12px', borderRadius: 10,
              background: didFlip7 ? 'rgba(0,212,170,0.15)' : '#242336',
              border: `1px solid ${didFlip7 ? '#00d4aa' : 'rgba(255,255,255,0.08)'}`,
              color: didFlip7 ? '#00d4aa' : '#a7a9be', fontSize: 13, marginBottom: 14, userSelect: 'none'
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: didFlip7 ? '#00d4aa' : 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            Flip 7 ! (+15 points bonus)
          </div>
        </>
      )}

      {/* Preview */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#242336', borderRadius: 10, padding: '10px 14px', marginBottom: 14
      }}>
        <span style={{ color: '#a7a9be', fontSize: 13 }}>Score cette manche</span>
        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: didBust ? '#ef4444' : '#f5a623' }}>
          {didBust ? '0' : `+${preview}`}
        </span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || (!didBust && numberCards === '')}
        style={{
          width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: submitting ? '#555' : '#f5a623', color: '#0f0e17',
          fontWeight: 700, fontSize: 15, transition: 'background 0.15s'
        }}
      >
        {submitting ? 'Envoi...' : 'Confirmer le score'}
      </button>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: '#a7a9be', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: 1
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  background: '#242336', border: '1px solid rgba(255,255,255,0.08)',
  color: '#fff', fontSize: 20, fontFamily: 'Syne', fontWeight: 700,
  outline: 'none', textAlign: 'center'
}
