import { createContext, useState, useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'
import { notificationsAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export const NotifContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

export function NotifProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await notificationsAPI.getAll()
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
    } catch {
      // ignore
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!user) return

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: localStorage.getItem('access_token') },
    })

    socket.on('connect', () => {
      socket.emit('join', { room: `user_${user.id}` })
    })

    socket.on('new_notification', (notif) => {
      setNotifications((prev) => [notif, ...prev])
      setUnreadCount((prev) => prev + 1)
    })

    return () => socket.disconnect()
  }, [user])

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { /* ignore */ }
  }

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch { /* ignore */ }
  }

  return (
    <NotifContext.Provider value={{ notifications, unreadCount, markAllRead, markAsRead, fetchNotifications }}>
      {children}
    </NotifContext.Provider>
  )
}
