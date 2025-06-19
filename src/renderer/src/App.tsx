import { usePingPongStore } from './store/pingpong'
import { useSongStore } from './store/song'
import { useState } from 'react'
import Layout from './components/Layout'

const App: React.FC = () => {
  const { count, ping, pong } = usePingPongStore()
  const { songs, fetchSongs, createSong } = useSongStore()
  const [songName, setSongName] = useState('')

  const handleCreateSong = async (): Promise<void> => {
    if (songName.trim()) {
      await createSong(songName.trim())
      setSongName('')
    }
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Zustand PingPong Test</h1>
        <div className="text-xl mb-4">Count: {count}</div>
        <div className="space-x-4 mb-8">
          <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={ping}>
            Ping
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={pong}>
            Pong
          </button>
        </div>
        <h2 className="text-xl font-semibold mb-2">Songs (from LMDB):</h2>
        <div className="flex items-center mb-2 space-x-2">
          <input
            className="px-2 py-1 border rounded"
            type="text"
            placeholder="Enter song name"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSong()
            }}
          />
          <button className="px-4 py-2 bg-indigo-500 text-white rounded" onClick={handleCreateSong}>
            Create Song
          </button>
        </div>
        <button className="px-4 py-2 bg-purple-500 text-white rounded mb-2" onClick={fetchSongs}>
          Fetch Songs
        </button>
        <ul className="list-disc pl-5">
          {songs.length === 0 && <li>No songs found.</li>}
          {songs.map((song, idx) => (
            <li key={idx}>{song.name}</li>
          ))}
        </ul>
      </div>
    </Layout>
  )
}

export default App
