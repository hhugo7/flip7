import Pusher from 'pusher'

// Singleton côté serveur
let pusherServer: Pusher | null = null

export function getPusherServer(): Pusher {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })
  }
  return pusherServer
}

// Noms de channels et events
export const channel = (gameCode: string) => `game-${gameCode}`

export const EVENTS = {
  PLAYER_JOINED: 'player-joined',
  GAME_STARTED: 'game-started',
  SCORE_SUBMITTED: 'score-submitted',
  ROUND_END: 'round-end',
  GAME_FINISHED: 'game-finished',
  NEXT_ROUND: 'next-round',
} as const
