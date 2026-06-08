import { create } from 'zustand'
import { Lang } from './i18n'

export type Page = 
  | 'login' | 'register' | 'forgot'
  | 'dashboard'
  | 'expenses' | 'receivables' | 'payables' | 'loans' | 'accounts'
  | 'plans' | 'notes' | 'notecounter'
  | 'docscanner' | 'docvault' | 'calculator' | 'calendar' | 'alarm'
  | 'tools' | 'profile'
  | 'admin' | 'admin-users' | 'admin-stats'

interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string | null
}

interface AppState {
  // Auth
  user: User | null
  token: string | null
  isAuthenticated: boolean
  
  // Navigation
  currentPage: Page
  pageHistory: Page[]
  
  // Data
  expenses: unknown[]
  receivables: unknown[]
  payables: unknown[]
  loans: unknown[]
  accounts: unknown[]
  notes: unknown[]
  plans: unknown[]
  documents: unknown[]
  alarms: unknown[]
  
  // UI
  sidebarOpen: boolean
  isLoading: boolean
  language: Lang
  darkMode: boolean
  
  // Actions
  setAuth: (user: User, token: string) => void
  logout: () => void
  setPage: (page: Page) => void
  goBack: () => void
  setExpenses: (data: unknown[]) => void
  setReceivables: (data: unknown[]) => void
  setPayables: (data: unknown[]) => void
  setLoans: (data: unknown[]) => void
  setAccounts: (data: unknown[]) => void
  setNotes: (data: unknown[]) => void
  setPlans: (data: unknown[]) => void
  setDocuments: (data: unknown[]) => void
  setAlarms: (data: unknown[]) => void
  toggleSidebar: () => void
  setLoading: (loading: boolean) => void
  setLanguage: (lang: Lang) => void
  toggleDarkMode: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  currentPage: 'login',
  pageHistory: [],
  expenses: [],
  receivables: [],
  payables: [],
  loans: [],
  accounts: [],
  notes: [],
  plans: [],
  documents: [],
  alarms: [],
  sidebarOpen: false,
  isLoading: false,
  language: (typeof window !== 'undefined' && localStorage.getItem('lang') === 'bn') ? 'bn' : 'en',
  darkMode: (typeof window !== 'undefined' && localStorage.getItem('darkMode') !== 'false'),

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
    set({ user, token, isAuthenticated: true, currentPage: 'dashboard' })
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    set({
      user: null, token: null, isAuthenticated: false,
      currentPage: 'login', pageHistory: [],
      expenses: [], receivables: [], payables: [], loans: [],
      accounts: [], notes: [], plans: [], documents: [], alarms: []
    })
  },

  setPage: (page) => set((s) => ({ 
    pageHistory: [...s.pageHistory, s.currentPage], 
    currentPage: page 
  })),
  
  goBack: () => {
    const history = get().pageHistory
    if (history.length > 0) {
      const prev = history[history.length - 1]
      set({ currentPage: prev, pageHistory: history.slice(0, -1) })
    } else {
      set({ currentPage: 'dashboard' })
    }
  },

  setExpenses: (data) => set({ expenses: data }),
  setReceivables: (data) => set({ receivables: data }),
  setPayables: (data) => set({ payables: data }),
  setLoans: (data) => set({ loans: data }),
  setAccounts: (data) => set({ accounts: data }),
  setNotes: (data) => set({ notes: data }),
  setPlans: (data) => set({ plans: data }),
  setDocuments: (data) => set({ documents: data }),
  setAlarms: (data) => set({ alarms: data }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setLoading: (loading) => set({ isLoading: loading }),
  setLanguage: (lang) => {
    if (typeof window !== 'undefined') localStorage.setItem('lang', lang)
    set({ language: lang })
  },
  toggleDarkMode: () => {
    const newMode = !get().darkMode
    if (typeof window !== 'undefined') localStorage.setItem('darkMode', String(newMode))
    set({ darkMode: newMode })
  },
}))
