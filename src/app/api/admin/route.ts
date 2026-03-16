import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

// GET /api/admin/stats — toutes les stats joueurs
export async function GET(req: NextRequest) {
  try {
    const stats = await sql`SELECT * FROM profile_stats ORDER BY games_won DESC, win_rate DESC`
    const recentGames = await sql`
      SELECT g.*, pl.name as winner_name,
        COUNT(DISTINCT p.id) as player_count
      FROM games g
      LEFT JOIN players pl ON pl.id = (
        SELECT id FROM players WHERE game_id = g.id AND profile_id = g.winner_id LIMIT 1
      )
      LEFT JOIN players p ON p.game_id = g.id
      WHERE g.status = 'finished'
      GROUP BY g.id, pl.name
      ORDER BY g.finished_at DESC
      LIMIT 20
    `
    return NextResponse.json({ stats, recentGames })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/stats — créer ou récupérer un profil
export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  try {
    const [profile] = await sql`
      INSERT INTO profiles (name) VALUES (${name.trim()})
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `
    return NextResponse.json({ profile })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
