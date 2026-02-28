import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { generateNotes, getAllNotes, deleteNote } from '../api/notes'
import type { Note } from '../types'

export default function Notes() {
  const { user, updateTokens } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const data = await getAllNotes()
      setNotes(data)
    } catch (err) {
      console.error('Failed to fetch notes')
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setError('')
    setLoading(true)
    try {
      const data = await generateNotes(title, text)
      updateTokens(data.tokensRemaining)
      await fetchNotes()
      setSelectedNote({ id: data.noteId, title: data.title, notes: data.notes, tokens_used: 10, created_at: new Date().toISOString() })
      setTitle('')
      setText('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate notes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    await deleteNote(id)
    setNotes(notes.filter(n => n.id !== id))
    if (selectedNote?.id === id) setSelectedNote(null)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/dashboard')} className="text-2xl font-bold text-white">
          HOLM
        </button>
        <div className="flex items-center gap-4">
          <div className="bg-blue-600/20 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium">
            🪙 {user?.tokens} tokens
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white text-sm">
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left — Generate Notes */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Generate AI Notes</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 1 - Photosynthesis"
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">
                Paste your text
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the text you want to generate notes from..."
                required
                rows={12}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? '✨ Generating...' : '✨ Generate Notes (10 tokens)'}
            </button>
          </form>
        </div>

        {/* Right — Notes List & Viewer */}
        <div>
          {selectedNote ? (
            // Note Viewer
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{selectedNote.title}</h2>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  ← Back to list
                </button>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 whitespace-pre-wrap text-gray-300 text-sm leading-relaxed max-h-[600px] overflow-y-auto">
                {selectedNote.notes}
              </div>
            </div>
          ) : (
            // Notes List
            <div>
              <h2 className="text-2xl font-bold mb-6">My Notes</h2>
              {notes.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
                  <p className="text-4xl mb-3">📝</p>
                  <p className="text-gray-400">No notes yet</p>
                  <p className="text-gray-600 text-sm mt-1">Generate your first notes from the left</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition"
                    >
                      <button
                        onClick={() => setSelectedNote(note)}
                        className="text-left flex-1"
                      >
                        <p className="text-white font-medium">{note.title}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(note.created_at).toLocaleDateString()} · {note.tokens_used} tokens used
                        </p>
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-gray-600 hover:text-red-400 transition ml-4 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}