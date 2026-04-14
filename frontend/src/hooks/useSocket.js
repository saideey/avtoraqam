import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

export function useSocket(userId) {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!userId) return

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: localStorage.getItem('access_token') },
    })

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join', { room: `user_${userId}` })
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [userId])

  return socketRef.current
}
