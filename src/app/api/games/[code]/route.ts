import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getPusherServer, channel, EVENTS } from '@/lib/pusher'

// POST /api/games/[code]/join
export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const { action, playerName, profileId, playerId } = await req.json()
  const code = params.code.toUpperCase()

  try {
    const [game] = await sql`SELECT * FROM games WHERE code = ${code}`
    if (!game) return NextResponse.json({ error: 'Partie introuvable' }, { status: 404 })

    if (action === 'join') {
      if (game.status !== 'lobby') {
        return NextResponse.json({ error: 'La partie a déjà commencé' }, { status: 400 })
      }
      if (!playerName?.trim()) {
        return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
      }

      const [player] = await sql`
        INSERT INTO players (game_id, profile_id, name, is_admin)
        VALUES (${game.id}, ${profileId || null}, ${playerName.trim()}, false)
        RETURNING *
      `

      // Notifie les autres joueurs
      await getPusherServer().trigger(channel(code), EVENTS.PLAYER_JOINED, { player })

      const players = await sql`SELECT * FROM players WHERE game_id = ${game.id} ORDER BY joined_at ASC`
      return NextResponse.json({ game, player, players })
    }

    if (action === 'start') {
      if (game.status !== 'lobby') {
        return NextResponse.json({ error: 'Partie déjà démarrée' }, { status: 400 })
      }

      const [updatedGame] = await sql`
        UPDATE games SET status = 'playing' WHERE id = ${game.id} RETURNING *
      `

      await getPusherServer().trigger(channel(code), EVENTS.GAME_STARTED, { game: updatedGame })
      return NextResponse.json({ game: updatedGame })
    }

    if (action === 'next-round') {
      const [updatedGame] = await sql`
        UPDATE games SET current_round = current_round + 1 WHERE id = ${game.id} RETURNING *
      `

      const scores = await sql`
        SELECT pl.id as player_id, pl.name, pl.total_score
        FROM players pl
        WHERE pl.game_id = ${game.id}
        ORDER BY pl.total_score DESC
      `

      await getPusherServer().trigger(channel(code), EVENTS.NEXT_ROUND, {
        round_number: updatedGame.current_round,
        scores,
      })
      return NextResponse.json({ game: updatedGame, scores })
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
