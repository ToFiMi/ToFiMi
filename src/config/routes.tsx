// src/config/routes.ts

export type UserRole = 'ADMIN' | 'leader' | 'animator' | 'user'

export const ROUTES_BY_ROLE: Record<UserRole, { key: string, label: string }[]> = {
    ADMIN: [
        { key: '/', label: 'Domov' },
        { key: '/schools', label: 'Správa škôl' },
        { key: '/users', label: 'Účastníci' },
        { key: '/reports', label: 'Prehľady' },
        { key: '/notifications', label: 'Notifikácie' },
        { key: '/profile', label: 'Profil' },
    ],
    leader: [
        { key: '/', label: 'Domov' },
        { key: '/homeworks', label: 'Domáce úlohy' },
        { key: '/groups', label: 'Skupinky' },
        { key: '/users', label: 'Účastníci' },
        { key: '/daily-reflections', label: 'Zamyslenia' },
        { key: '/profile', label: 'Profil' },
    ],
    animator: [
        { key: '/', label: 'Domov' },
        { key: '/homeworks', label: 'Domáce úlohy' },
        { key: '/events', label: 'Termíny' },
        { key: '/groups', label: 'Skupinky' },
        { key: '/users', label: 'Účastníci' },
        { key: '/daily-reflections', label: 'Zamyslenia' },
        { key: '/profile', label: 'Profil' },
    ],
    user: [
        { key: '/', label: 'Domov' },
        { key: '/homeworks', label: 'Domáce úlohy' },
        { key: '/events', label: 'Termíny' },
        { key: '/users', label: 'Účastníci' },
        { key: '/daily-reflections', label: 'Zamyslenia' },
        { key: '/profile', label: 'Profil' },
    ],
}
