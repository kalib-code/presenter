import { create } from 'zustand'

interface PingPongState {
  count: number
  ping: () => void
  pong: () => void
}

export const usePingPongStore = create<PingPongState>((set) => ({
  count: 0,
  ping: () => set((state) => ({ count: state.count + 1 })),
  pong: () => set((state) => ({ count: state.count - 1 }))
}))
