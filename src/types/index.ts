export type GameStatus = 'lobby' | 'playing' | 'finished'

export interface Game {
  id: string
  code: string
  status: GameStatus
  current_round: number
  winner_id: string | null
  created_at: string
  finished_at: string | null
}

export interface Player {
  id: string
  game_id: string
  profile_id: string | null
  name: string
  total_score: number
  is_admin: boolean
}

export interface Round {
  id: string
  game_id: string
  player_id: string
  round_number: number
  number_cards_total: number
  bonus_double: boolean
  bonus_points: number
  did_flip7: boolean
  did_bust: boolean
  round_score: number
}

export interface Profile {
  id: string
  name: string
}

export interface ProfileStats {
  id: string
  name: string
  games_played: number
  games_won: number
  avg_score: number
  best_score: number
  total_flip7s: number
  win_rate: number
}

// Payload Pusher
export interface PusherPlayerJoined {
  player: Player
}
export interface PusherGameStarted {
  game: Game
}
export interface PusherScoreSubmitted {
  player_id: string
  player_name: string
  round_score: number
  total_score: number
  did_flip7: boolean
  did_bust: boolean
}
export interface PusherRoundEnd {
  round_number: number
  scores: Array<{ player_id: string; name: string; round_score: number; total_score: number }>
}
export interface PusherGameFinished {
  winner: Player
  final_scores: Array<{ player_id: string; name: string; total_score: number; flip7s: number }>
}

// Calcul score côté client (preview instantané)
export function calculateRoundScore(
  numberCardsTotal: number,
  bonusDouble: boolean,
  bonusPoints: number,
  didFlip7: boolean,
  didBust: boolean
): number {
  if (didBust) return 0
  let score = numberCardsTotal
  if (bonusDouble) score *= 2
  score += bonusPoints
  if (didFlip7) score += 15
  return score
}
