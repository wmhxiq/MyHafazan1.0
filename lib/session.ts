// Temporary session helper - will be replaced by NextAuth later

export function setSession(user: {
  id: string
  nama: string
  peranan: string
}) {
  localStorage.setItem('user', JSON.stringify(user))
}

export function getSession() {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem('user')
  return data ? JSON.parse(data) : null
}

export function clearSession() {
  localStorage.removeItem('user')
}

export function setWarisSession(data: {
  idPelajar: string
  namaPelajar: string
}) {
  localStorage.setItem('waris', JSON.stringify(data))
}

export function getWarisSession() {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem('waris')
  return data ? JSON.parse(data) : null
}

export function clearWarisSession() {
  localStorage.removeItem('waris')
}