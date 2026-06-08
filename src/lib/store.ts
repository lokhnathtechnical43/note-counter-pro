import { create } from 'zustand'

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
  previousPage: Page | null
  
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
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  currentPage: 'login',
  previousPage: null,
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
      currentPage: 'login', previousPage: null,
      expenses: [], receivables: [], payables: [], loans: [],
      accounts: [], notes: [], plans: [], documents: [], alarms: []
    })
  },

  setPage: (page) => set({ previousPage: get().currentPage, currentPage: page }),
  
  goBack: () => {
    const prev = get().previousPage
    if (prev) set({ currentPage: prev, previousPage: null })
    else set({ currentPage: 'dashboard' })
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
}))
