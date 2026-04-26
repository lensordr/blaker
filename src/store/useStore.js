import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_ADMIN = {
  id: 'admin-001',
  name: 'Blaker Admin',
  email: 'admin@blaker.es',
  password: 'blaker2024',
  role: 'admin',
  avatar: null,
  createdAt: new Date('2024-01-01').toISOString(),
}

const SEED_EVENTS = [
  {
    id: 'evt-001',
    title: 'Ruta por Andalucía',
    description: 'Recorremos los mejores puertos de Andalucía. Salida desde Málaga, pasando por Ronda y terminando en Granada.',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
    location: 'Málaga, España',
    routeUrl: 'https://maps.google.com/maps?q=Malaga+to+Granada',
    coverImage: null,
    createdBy: 'admin-001',
    createdAt: new Date().toISOString(),
    status: 'upcoming', // upcoming | active | ended
    maxParticipants: 30,
  },
  {
    id: 'evt-002',
    title: 'Costa Brava Weekend',
    description: 'Fin de semana épico por la Costa Brava. Carreteras de montaña con vistas al Mediterráneo.',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Girona, España',
    routeUrl: 'https://maps.google.com/maps?q=Costa+Brava+motorcycle+route',
    coverImage: null,
    createdBy: 'admin-001',
    createdAt: new Date().toISOString(),
    status: 'upcoming',
    maxParticipants: 20,
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────
const useStore = create(
  persist(
    (set, get) => ({
      // ── Auth ──────────────────────────────────────────────────────────────
      currentUser: null,
      users: [SEED_ADMIN],

      login: (email, password) => {
        const { users } = get()
        const user = users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        )
        if (!user) return { error: 'Email o contraseña incorrectos' }
        const { password: _, ...safeUser } = user
        set({ currentUser: safeUser })
        return { user: safeUser }
      },

      logout: () => set({ currentUser: null }),

      register: (data) => {
        const { users } = get()
        if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
          return { error: 'Este email ya está registrado' }
        }
        const newUser = {
          id: `user-${Date.now()}`,
          name: data.name,
          email: data.email,
          password: data.password,
          role: 'user',
          avatar: null,
          // Questionnaire
          motoType: data.motoType || '',
          motoModel: data.motoModel || '',
          location: data.location || '',
          experience: data.experience || '',
          needsFood: data.needsFood ?? false,
          isSubscriber: data.isSubscriber ?? false,
          instaHandle: data.instaHandle || '',
          heardFrom: data.heardFrom || '',
          createdAt: new Date().toISOString(),
        }
        set({ users: [...users, newUser] })
        const { password: _, ...safeUser } = newUser
        set({ currentUser: safeUser })
        return { user: safeUser }
      },

      updateUser: (userId, updates) => {
        const { users, currentUser } = get()
        const updated = users.map((u) => (u.id === userId ? { ...u, ...updates } : u))
        set({ users: updated })
        if (currentUser?.id === userId) {
          set({ currentUser: { ...currentUser, ...updates } })
        }
      },

      // ── Events ────────────────────────────────────────────────────────────
      events: SEED_EVENTS,

      createEvent: (data) => {
        const { events, currentUser } = get()
        const newEvent = {
          id: `evt-${Date.now()}`,
          ...data,
          createdBy: currentUser.id,
          createdAt: new Date().toISOString(),
          status: 'upcoming',
        }
        set({ events: [...events, newEvent] })
        return newEvent
      },

      updateEvent: (eventId, updates) => {
        const { events } = get()
        set({ events: events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)) })
      },

      deleteEvent: (eventId) => {
        const { events } = get()
        set({ events: events.filter((e) => e.id !== eventId) })
      },

      // Auto-update event status based on time
      syncEventStatuses: () => {
        const { events } = get()
        const now = new Date()
        const updated = events.map((e) => {
          const start = new Date(e.date)
          const end = new Date(e.endDate)
          if (now >= start && now <= end) return { ...e, status: 'active' }
          if (now > end) return { ...e, status: 'ended' }
          return { ...e, status: 'upcoming' }
        })
        set({ events: updated })
      },

      // ── Participants ──────────────────────────────────────────────────────
      // { id, eventId, userId, status: 'pending'|'approved'|'rejected', joinedAt }
      participants: [],

      requestJoin: (eventId) => {
        const { participants, currentUser } = get()
        const exists = participants.find(
          (p) => p.eventId === eventId && p.userId === currentUser.id
        )
        if (exists) return { error: 'Ya has solicitado unirte a este evento' }
        const entry = {
          id: `part-${Date.now()}`,
          eventId,
          userId: currentUser.id,
          status: 'pending',
          joinedAt: new Date().toISOString(),
        }
        set({ participants: [...participants, entry] })
        // Add notification for admin
        get().addNotification({
          userId: 'admin-001',
          type: 'join_request',
          message: `${currentUser.name} quiere unirse a un evento`,
          eventId,
          fromUserId: currentUser.id,
        })
        return { ok: true }
      },

      updateParticipant: (participantId, status) => {
        const { participants } = get()
        const part = participants.find((p) => p.id === participantId)
        if (!part) return
        set({
          participants: participants.map((p) =>
            p.id === participantId ? { ...p, status } : p
          ),
        })
        // Notify the user
        const msg =
          status === 'approved'
            ? '¡Has sido aceptado en el evento! Ya puedes acceder al chat y fotos.'
            : 'Tu solicitud para el evento ha sido rechazada.'
        get().addNotification({
          userId: part.userId,
          type: status === 'approved' ? 'approved' : 'rejected',
          message: msg,
          eventId: part.eventId,
        })
      },

      getParticipantStatus: (eventId, userId) => {
        const { participants } = get()
        return participants.find((p) => p.eventId === eventId && p.userId === userId)
      },

      getEventParticipants: (eventId) => {
        const { participants, users } = get()
        return participants
          .filter((p) => p.eventId === eventId)
          .map((p) => ({
            ...p,
            user: users.find((u) => u.id === p.userId),
          }))
      },

      // ── Chat ──────────────────────────────────────────────────────────────
      // { id, eventId, userId, text, imageUrl, createdAt }
      messages: [],

      sendMessage: (eventId, text, imageUrl = null) => {
        const { messages, currentUser, events } = get()
        const event = events.find((e) => e.id === eventId)
        if (!event || event.status === 'ended') return { error: 'El chat está cerrado' }
        const msg = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          eventId,
          userId: currentUser.id,
          userName: currentUser.name,
          text,
          imageUrl,
          createdAt: new Date().toISOString(),
        }
        set({ messages: [...messages, msg] })
        return { ok: true }
      },

      getEventMessages: (eventId) => {
        const { messages } = get()
        return messages.filter((m) => m.eventId === eventId)
      },

      // ── Photos ────────────────────────────────────────────────────────────
      // { id, eventId, userId, url, caption, createdAt }
      photos: [],

      addPhoto: (eventId, url, caption = '') => {
        const { photos, currentUser } = get()
        const photo = {
          id: `photo-${Date.now()}`,
          eventId,
          userId: currentUser.id,
          userName: currentUser.name,
          url,
          caption,
          createdAt: new Date().toISOString(),
        }
        set({ photos: [...photos, photo] })
        return photo
      },

      getEventPhotos: (eventId) => {
        const { photos } = get()
        return photos.filter((p) => p.eventId === eventId)
      },

      // ── Notifications ─────────────────────────────────────────────────────
      // { id, userId, type, message, eventId, read, createdAt }
      notifications: [],

      addNotification: (data) => {
        const { notifications } = get()
        const notif = {
          id: `notif-${Date.now()}`,
          ...data,
          read: false,
          createdAt: new Date().toISOString(),
        }
        set({ notifications: [...notifications, notif] })
      },

      markNotificationRead: (notifId) => {
        const { notifications } = get()
        set({
          notifications: notifications.map((n) =>
            n.id === notifId ? { ...n, read: true } : n
          ),
        })
      },

      markAllNotificationsRead: (userId) => {
        const { notifications } = get()
        set({
          notifications: notifications.map((n) =>
            n.userId === userId ? { ...n, read: true } : n
          ),
        })
      },

      getUserNotifications: (userId) => {
        const { notifications } = get()
        return notifications
          .filter((n) => n.userId === userId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      },

      getUnreadCount: (userId) => {
        const { notifications } = get()
        return notifications.filter((n) => n.userId === userId && !n.read).length
      },
    }),
    {
      name: 'blaker-storage',
      // Don't persist passwords in currentUser
      partialize: (state) => ({
        ...state,
        currentUser: state.currentUser
          ? { ...state.currentUser, password: undefined }
          : null,
      }),
    }
  )
)

export default useStore
