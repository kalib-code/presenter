import { create } from 'zustand'

interface Song {
  name: string
}

interface SongStore {
  songs: Song[]
  fetchSongs: () => Promise<void>
  createSong: (name: string) => Promise<void>
}

export const useSongStore = create<SongStore>((set) => ({
  songs: [],
  fetchSongs: async () => {
    // @ts-ignore: window.electron is injected by preload
    const songs: Song[] = await window.electron.invoke('list-songs')
    set({ songs })
  },
  createSong: async (name: string) => {
    // @ts-ignore: window.electron is injected by preload
    const songs: Song[] = await window.electron.invoke('create-song', name)
    set({ songs })
  }
}))
