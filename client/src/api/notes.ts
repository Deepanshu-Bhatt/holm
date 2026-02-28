import api from './axios'

export const generateNotes = async (title: string, text: string) => {
  const res = await api.post('/notes/generate', { title, text })
  return res.data
}

export const getAllNotes = async () => {
  const res = await api.get('/notes')
  return res.data
}

export const getNoteById = async (id: number) => {
  const res = await api.get(`/notes/${id}`)
  return res.data
}

export const deleteNote = async (id: number) => {
  const res = await api.delete(`/notes/${id}`)
  return res.data
}