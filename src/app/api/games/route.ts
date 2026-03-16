import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getPusherServer, channel, EVENTS } from '@/lib/pusher'
import { generateGameCode } from '@/lib/utils'

// POST /api/games — créer une nouvelle partie
export async function POST(req: NextRequest) {
  try {
    const { hostName, profileId } = await req.json()
    if (!hostName?.trim()) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    }

    // Génère un code unique
    let code = generateGameCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await sql`SELECT id FROM games WHERE code = ${code} AND status != 'finished'`
      if (existing.length === 0) break
      code = generateGameCode()
      attempts++
    }

    // Crée la partie
    const [game] = await sql`
      INSERT INTO games (code, status, current_round)
      VALUES (${code}, 'lobby', 1)
      RETURNING *
    `

    // Ajoute l'hôte comme premier joueur (admin)
    const [player] = await sql`
      INSERT INTO players (game_id, profile_id, name, is_admin)
      VALUES (${game.id}, ${profileId || null}, ${hostName.trim()}, true)
      RETURNING *
    `

    return NextResponse.json({ game, player })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET /api/games?code=XXXX — récupérer l'état d'une partie
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'Code requis' }, { status: 400 })

  try {
    const [game] = await sql`SELECT * FROM games WHERE code = ${code.toUpperCase()}`
    if (!game) return NextResponse.json({ error: 'Partie introuvable' }, { status: 404 })

    const players = await sql`
      SELECT * FROM players WHERE game_id = ${game.id} ORDER BY joined_at ASC
    `
    return NextResponse.json({ game, players })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
