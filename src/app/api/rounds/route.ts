import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getPusherServer, channel, EVENTS } from '@/lib/pusher'
import { calculateRoundScore } from '@/types'

// POST /api/rounds — soumettre le score d'un joueur pour une manche
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      gameId,
      playerId,
      roundNumber,
      numberCardsTotal,
      bonusDouble,
      bonusPoints,
      didFlip7,
      didBust,
    } = body

    const roundScore = calculateRoundScore(
      numberCardsTotal,
      bonusDouble,
      bonusPoints,
      didFlip7,
      didBust
    )

    // Insère ou met à jour le round
    const [round] = await sql`
      INSERT INTO rounds (game_id, player_id, round_number, number_cards_total, bonus_double, bonus_points, did_flip7, did_bust, round_score)
      VALUES (${gameId}, ${playerId}, ${roundNumber}, ${numberCardsTotal}, ${bonusDouble}, ${bonusPoints}, ${didFlip7}, ${didBust}, ${roundScore})
      ON CONFLICT (game_id, player_id, round_number)
      DO UPDATE SET
        number_cards_total = EXCLUDED.number_cards_total,
        bonus_double = EXCLUDED.bonus_double,
        bonus_points = EXCLUDED.bonus_points,
        did_flip7 = EXCLUDED.did_flip7,
        did_bust = EXCLUDED.did_bust,
        round_score = EXCLUDED.round_score
      RETURNING *
    `

    // Met à jour le score total du joueur
    const [player] = await sql`
      UPDATE players
      SET total_score = (
        SELECT COALESCE(SUM(round_score), 0) FROM rounds
        WHERE player_id = ${playerId}
      )
      WHERE id = ${playerId}
      RETURNING *
    `

    // Récupère le code de la partie pour Pusher
    const [game] = await sql`SELECT code FROM games WHERE id = ${gameId}`

    // Notifie tous les joueurs en temps réel
    await getPusherServer().trigger(channel(game.code), EVENTS.SCORE_SUBMITTED, {
      player_id: playerId,
      player_name: player.name,
      round_score: roundScore,
      total_score: player.total_score,
      did_flip7: didFlip7,
      did_bust: didBust,
    })

    // Vérifie si quelqu'un a atteint 200 points
    const allPlayers = await sql`
      SELECT * FROM players WHERE game_id = ${gameId} ORDER BY total_score DESC
    `
    const winner = allPlayers.find((p: any) => p.total_score >= 200)

    if (winner) {
      // Termine la partie
      await sql`
        UPDATE games SET status = 'finished', winner_id = ${winner.profile_id}, finished_at = NOW()
        WHERE id = ${gameId}
      `

      const finalScores = await sql`
        SELECT pl.id as player_id, pl.name, pl.total_score,
          COUNT(r.id) FILTER (WHERE r.did_flip7) as flip7s
        FROM players pl
        LEFT JOIN rounds r ON r.player_id = pl.id
        WHERE pl.game_id = ${gameId}
        GROUP BY pl.id, pl.name, pl.total_score
        ORDER BY pl.total_score DESC
      `

      await getPusherServer().trigger(channel(game.code), EVENTS.GAME_FINISHED, {
        winner: player,
        final_scores: finalScores,
      })
    }

    // Vérifie si tous les joueurs ont soumis leur score pour cette manche
    const submittedCount = await sql`
      SELECT COUNT(*) as count FROM rounds
      WHERE game_id = ${gameId} AND round_number = ${roundNumber}
    `
    const playerCount = await sql`
      SELECT COUNT(*) as count FROM players WHERE game_id = ${gameId}
    `

    let roundComplete = false
    if (Number(submittedCount[0].count) >= Number(playerCount[0].count)) {
      roundComplete = true
      const roundSummary = await sql`
        SELECT pl.id as player_id, pl.name, r.round_score, pl.total_score
        FROM rounds r
        JOIN players pl ON pl.id = r.player_id
        WHERE r.game_id = ${gameId} AND r.round_number = ${roundNumber}
        ORDER BY pl.total_score DESC
      `
      await getPusherServer().trigger(channel(game.code), EVENTS.ROUND_END, {
        round_number: roundNumber,
        scores: roundSummary,
      })
    }

    return NextResponse.json({ round, player, roundComplete, winner: winner || null })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET /api/rounds?gameId=...&roundNumber=...
export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get('gameId')
  const roundNumber = req.nextUrl.searchParams.get('roundNumber')
  if (!gameId) return NextResponse.json({ error: 'gameId requis' }, { status: 400 })

  const rounds = roundNumber
    ? await sql`SELECT r.*, pl.name FROM rounds r JOIN players pl ON pl.id = r.player_id WHERE r.game_id = ${gameId} AND r.round_number = ${Number(roundNumber)}`
    : await sql`SELECT r.*, pl.name FROM rounds r JOIN players pl ON pl.id = r.player_id WHERE r.game_id = ${gameId} ORDER BY r.round_number, pl.name`

  return NextResponse.json({ rounds })
}
