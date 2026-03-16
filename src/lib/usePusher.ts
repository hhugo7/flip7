'use client'
import { useEffect, useRef } from 'react'
import PusherClient from 'pusher-js'
import { EVENTS } from '@/lib/pusher'
import type {
  PusherPlayerJoined,
  PusherGameStarted,
  PusherScoreSubmitted,
  PusherRoundEnd,
  PusherGameFinished,
} from '@/types'

let pusherInstance: PusherClient | null = null

function getPusherClient(): PusherClient {
  if (!pusherInstance) {
    pusherInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })
  }
  return pusherInstance
}

interface UsePusherOptions {
  gameCode: string
  onPlayerJoined?: (data: PusherPlayerJoined) => void
  onGameStarted?: (data: PusherGameStarted) => void
  onScoreSubmitted?: (data: PusherScoreSubmitted) => void
  onRoundEnd?: (data: PusherRoundEnd) => void
  onGameFinished?: (data: PusherGameFinished) => void
  onNextRound?: (data: any) => void
}

export function usePusher({
  gameCode,
  onPlayerJoined,
  onGameStarted,
  onScoreSubmitted,
  onRoundEnd,
  onGameFinished,
  onNextRound,
}: UsePusherOptions) {
  const channelRef = useRef<ReturnType<PusherClient['subscribe']> | null>(null)

  useEffect(() => {
    if (!gameCode) return

    const pusher = getPusherClient()
    const ch = pusher.subscribe(`game-${gameCode}`)
    channelRef.current = ch

    if (onPlayerJoined) ch.bind(EVENTS.PLAYER_JOINED, onPlayerJoined)
    if (onGameStarted) ch.bind(EVENTS.GAME_STARTED, onGameStarted)
    if (onScoreSubmitted) ch.bind(EVENTS.SCORE_SUBMITTED, onScoreSubmitted)
    if (onRoundEnd) ch.bind(EVENTS.ROUND_END, onRoundEnd)
    if (onGameFinished) ch.bind(EVENTS.GAME_FINISHED, onGameFinished)
    if (onNextRound) ch.bind(EVENTS.NEXT_ROUND, onNextRound)

    return () => {
      ch.unbind_all()
      pusher.unsubscribe(`game-${gameCode}`)
    }
  }, [gameCode])

  return channelRef
}
