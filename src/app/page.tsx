'use client'

import React, { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react'
import { useAppStore, Page } from '@/lib/store'
import { useShallow } from 'zustand/react/shallow'
import apiFetch from '@/lib/api'
import { AdMob, BannerAdSize, BannerAdPosition, InterstitialAdPluginEvents } from '@capacitor-community/admob'
import { translations, TranslationKey, Lang } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast, useToast } from '@/hooks/use-toast'
import {
  Home, DollarSign, ArrowDownLeft, ArrowUpRight, Landmark, Wallet,
  CalendarDays, StickyNote, Banknote, ScanLine, FolderLock, Calculator,
  Calendar, Bell, Wrench, Shield, Menu, X, ChevronLeft, Plus, Trash2,
  Edit, Eye, LogOut, User, TrendingUp, TrendingDown, Clock, CheckCircle,
  AlertCircle, FileText, Search, Moon, Sun, Download, Upload, Pencil,
  ChevronRight, MoreVertical, Star, StarOff, RefreshCw, Activity,
  PieChart, BarChart3, Users, Settings, HelpCircle, Info, ArrowRight,
  Hash, IndianRupee, Scan, FileImage, FileEdit, FileType, Pause, Play, Grid3X3, List, History,
  Smartphone, Share2, FolderOpen, Copy, Globe
} from 'lucide-react'

// ============ TYPES ============
interface Expense { id: string; title: string; amount: number; category: string; date: string; note?: string }
interface Receivable { id: string; title: string; amount: number; fromPerson: string; dueDate?: string; status: string; note?: string }
interface Payable { id: string; title: string; amount: number; toPerson: string; dueDate?: string; status: string; note?: string }
interface Loan { id: string; title: string; totalAmount: number; paidAmount: number; emiAmount?: number | null; interestRate?: number | null; tenure?: number | null; startDate: string; endDate?: string; status: string; note?: string }
interface Account { id: string; name: string; type: string; balance: number; note?: string }
interface Note { id: string; title: string; content: string; color: string; pinned: boolean }
interface Plan { id: string; title: string; description?: string; date: string; time?: string; priority: string; completed: boolean }
interface Document { id: string; name: string; type: string; size: number; data: string; category: string }
interface Alarm { id: string; title: string; time: string; date?: string; repeat: string; active: boolean }
interface UserInfo { id: string; email: string; name: string; role: string; createdAt: string }

// ============ EXPENSE CATEGORIES ============
const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Bills & Utilities', 'Health',
  'Education', 'Entertainment', 'Travel', 'Rent', 'Insurance', 'Gifts',
  'Personal Care', 'Home Maintenance', 'Other'
]

const ACCOUNT_TYPES = ['Bank Account', 'Cash', 'Mobile Wallet', 'Credit Card', 'Savings', 'Investment', 'Other']
const NOTE_COLORS = ['#ffffff', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff', '#fed7aa', '#e2e8f0']
const EXPENSE_COLORS: Record<string, string> = {
  'Food & Dining': '#f97316', 'Transport': '#3b82f6', 'Shopping': '#ec4899',
  'Bills & Utilities': '#eab308', 'Health': '#22c55e', 'Education': '#8b5cf6',
  'Entertainment': '#f43f5e', 'Travel': '#06b6d4', 'Rent': '#64748b',
  'Insurance': '#14b8a6', 'Gifts': '#d946ef', 'Personal Care': '#fb923c',
  'Home Maintenance': '#78716c', 'Other': '#94a3b8'
}

// ============ HELPER ============
function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string): string {
  try { return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return dateStr }
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

// ============ AUTH PAGES ============
const LoginPage = memo(function LoginPage() {
  const setAuth = useAppStore(state => state.setAuth)
  const setPage = useAppStore(state => state.setPage)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<any>('/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', email, password })
      })
      setAuth(data.user, data.token)
      toast({ title: 'Welcome back!', description: `Hello, ${data.user.name}` })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">DailyLife Pro</h1>
          <p className="text-muted-foreground mt-2">Your complete life management app</p>
        </div>
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            <div className="mt-4 text-center space-y-2">
              <button onClick={() => setPage('forgot')} className="text-sm text-emerald-600 hover:underline">Forgot Password?</button>
              <div className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <button onClick={() => setPage('register')} className="text-emerald-600 hover:underline font-medium">Sign Up</button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

const RegisterPage = memo(function RegisterPage() {
  const setAuth = useAppStore(state => state.setAuth)
  const setPage = useAppStore(state => state.setPage)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<any>('/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'register', name, email, password })
      })
      setAuth(data.user, data.token)
      toast({ title: 'Account created!', description: 'Welcome to DailyLife Pro' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">DailyLife Pro</h1>
        </div>
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button onClick={() => setPage('login')} className="text-emerald-600 hover:underline font-medium">Sign In</button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

const ForgotPasswordPage = memo(function ForgotPasswordPage() {
  const setPage = useAppStore(state => state.setPage)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiFetch('/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'forgot', email })
      })
      setSent(true)
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">Enter your email to receive reset instructions</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-green-700">Reset instructions sent to your email!</p>
                <Button onClick={() => setPage('login')} className="bg-emerald-600 hover:bg-emerald-700">Back to Login</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => setPage('login')} className="text-sm text-emerald-600 hover:underline">Back to Login</button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

// ============ HEADER ============
const AppHeader = memo(function AppHeader() {
  const { currentPage, setPage, goBack, toggleSidebar, user, logout, language, setLanguage, darkMode, toggleDarkMode } = useAppStore(useShallow(state => ({
    currentPage: state.currentPage,
    setPage: state.setPage,
    goBack: state.goBack,
    toggleSidebar: state.toggleSidebar,
    user: state.user,
    logout: state.logout,
    language: state.language,
    setLanguage: state.setLanguage,
    darkMode: state.darkMode,
    toggleDarkMode: state.toggleDarkMode,
  })))
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; read: boolean; createdAt: string }>>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const token = useAppStore(state => state.token)

  const t = (key: TranslationKey): string => translations[language][key] || translations['en'][key] || key

  const getTitle = () => {
    const titles: Record<string, string> = {
      dashboard: t('dashboard'), expenses: t('expenses'), receivables: t('receivables'),
      payables: t('payables'), loans: t('loanEmi'), accounts: t('accounts'),
      plans: t('tomorrowPlan'), notes: t('notes'), notecounter: t('noteCounter'),
      docscanner: t('docScanner'), docvault: t('docVault'), calculator: t('calculator'),
      calendar: t('calendar'), alarm: t('alarm'), tools: t('tools'),
      profile: t('profile'), admin: t('adminPanel'), 'admin-users': t('manageUsers'),
      'admin-stats': 'Statistics'
    }
    return titles[currentPage] || 'DailyLife Pro'
  }

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return
    try {
      const data = await apiFetch<any>('/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {}
  }, [token])

  useEffect(() => {
    if (!token) return
    const load = async () => { await fetchNotifications() }
    load()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAllRead = async () => {
    try {
      await apiFetch('/notifications', {
        method: 'PUT',
        body: JSON.stringify({ markAllRead: true }),
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          {currentPage !== 'dashboard' ? (
            <button onClick={() => goBack()} className="p-1.5 hover:bg-muted rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={toggleSidebar} className="p-1.5 hover:bg-muted rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-semibold text-lg">{getTitle()}</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Refresh / Update Button */}
          <button onClick={() => window.location.reload()} className="p-1.5 hover:bg-muted rounded-lg" title={language === 'bn' ? 'রিফ্রেশ / আপডেট' : 'Refresh / Update'}>
            <RefreshCw className="w-5 h-5" />
          </button>
          {/* Dark Mode Toggle */}
          <button onClick={toggleDarkMode} className="p-1.5 hover:bg-muted rounded-lg">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {/* Language Toggle */}
          <button onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')} className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
            {language === 'bn' ? 'EN' : 'বাং'}
          </button>
          {user?.role === 'admin' && (
            <button onClick={() => setPage('admin')} className="p-1.5 hover:bg-muted rounded-lg">
              <Shield className="w-5 h-5 text-emerald-600" />
            </button>
          )}
          {/* Notification Bell */}
          <div className="relative">
            <button onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }} className="p-1.5 hover:bg-muted rounded-lg relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-10 w-80 max-h-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-border z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <p className="font-semibold text-sm">{t('notifications')}</p>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">{t('markAllRead')}</button>
                  )}
                </div>
                <div className="overflow-y-auto max-h-72">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">{t('noNotifications')}</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`px-4 py-3 border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${!n.read ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : ''}`}>
                        <div className="flex items-start gap-2">
                          {!n.read && <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>}
                          <div className={n.read ? 'ml-4' : ''}>
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-medium">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
              )}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-border z-50 py-2">
                <div className="px-4 py-2 border-b">
                  <p className="font-medium text-sm">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <button onClick={() => { setPage('profile'); setShowUserMenu(false) }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
                  <User className="w-4 h-4" /> Profile
                </button>
                <button onClick={() => { logout(); setShowUserMenu(false) }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
})

// ============ SIDEBAR / DRAWER ============
const Sidebar = memo(function Sidebar() {
  const { sidebarOpen, toggleSidebar, currentPage, setPage, user, logout } = useAppStore(useShallow(state => ({
    sidebarOpen: state.sidebarOpen,
    toggleSidebar: state.toggleSidebar,
    currentPage: state.currentPage,
    setPage: state.setPage,
    user: state.user,
    logout: state.logout,
  })))

  const menuItems: { icon: React.ReactNode; label: string; page: Page }[] = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', page: 'dashboard' },
    { icon: <DollarSign className="w-5 h-5" />, label: 'Expenses', page: 'expenses' },
    { icon: <ArrowDownLeft className="w-5 h-5" />, label: 'Receivables', page: 'receivables' },
    { icon: <ArrowUpRight className="w-5 h-5" />, label: 'Payables', page: 'payables' },
    { icon: <Landmark className="w-5 h-5" />, label: 'Loan / EMI', page: 'loans' },
    { icon: <Wallet className="w-5 h-5" />, label: 'Accounts', page: 'accounts' },
    { icon: <CalendarDays className="w-5 h-5" />, label: "Tomorrow's Plan", page: 'plans' },
    { icon: <StickyNote className="w-5 h-5" />, label: 'Notes', page: 'notes' },
    { icon: <Banknote className="w-5 h-5" />, label: 'Note Counter', page: 'notecounter' },
    { icon: <ScanLine className="w-5 h-5" />, label: 'Doc Scanner', page: 'docscanner' },
    { icon: <FolderLock className="w-5 h-5" />, label: 'DocVault', page: 'docvault' },
    { icon: <Calculator className="w-5 h-5" />, label: 'Calculator', page: 'calculator' },
    { icon: <Calendar className="w-5 h-5" />, label: 'Calendar', page: 'calendar' },
    { icon: <Bell className="w-5 h-5" />, label: 'Alarm', page: 'alarm' },
    { icon: <Wrench className="w-5 h-5" />, label: 'Tools', page: 'tools' },
  ]

  if (user?.role === 'admin') {
    menuItems.push({ icon: <Shield className="w-5 h-5" />, label: 'Admin Panel', page: 'admin' })
  }

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-50" onClick={toggleSidebar} />}
      <div aria-hidden={!sidebarOpen} className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm">DailyLife Pro</h2>
              <p className="text-xs text-muted-foreground">{user?.name}</p>
            </div>
          </div>
          <button onClick={toggleSidebar} className="p-1.5 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <nav className="p-2 space-y-1">
            {menuItems.map(item => (
              <button
                key={item.page}
                onClick={() => { setPage(item.page); toggleSidebar() }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  currentPage === item.page ? 'bg-emerald-50 text-emerald-700 font-medium' : 'hover:bg-muted'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 mt-4 border-t">
            <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </ScrollArea>
      </div>
    </>
  )
})

// ============ BOTTOM NAV ============
const BottomNav = memo(function BottomNav() {
  const { currentPage, setPage } = useAppStore(useShallow(state => ({
    currentPage: state.currentPage,
    setPage: state.setPage,
  })))

  const tabs = [
    { icon: <Home className="w-5 h-5" />, label: 'Home', page: 'dashboard' as Page },
    { icon: <DollarSign className="w-5 h-5" />, label: 'Finance', page: 'expenses' as Page },
    { icon: <StickyNote className="w-5 h-5" />, label: 'Notes', page: 'notes' as Page },
    { icon: <Wrench className="w-5 h-5" />, label: 'Tools', page: 'tools' as Page },
    { icon: <MoreVertical className="w-5 h-5" />, label: 'More', page: 'calendar' as Page },
  ]

  const isActive = (page: Page) => {
    if (page === 'dashboard') return currentPage === 'dashboard'
    if (page === 'expenses') return ['expenses', 'receivables', 'payables', 'loans', 'accounts'].includes(currentPage)
    if (page === 'notes') return ['notes', 'plans'].includes(currentPage)
    if (page === 'tools') return ['tools', 'calculator', 'notecounter', 'docscanner', 'docvault', 'alarm'].includes(currentPage)
    if (page === 'calendar') return ['calendar', 'profile', 'admin'].includes(currentPage)
    return false
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-border/50 z-40 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => setPage(tab.page)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
              isActive(tab.page) ? 'text-emerald-600' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
})

// ============ DASHBOARD ============
const DashboardPage = memo(function DashboardPage() {
  const { setPage, expenses, receivables, payables, loans, accounts, user, language } = useAppStore(useShallow(state => ({
    setPage: state.setPage,
    expenses: state.expenses,
    receivables: state.receivables,
    payables: state.payables,
    loans: state.loans,
    accounts: state.accounts,
    user: state.user,
    language: state.language,
  })))
  const [loading, setLoading] = useState(true)

  const t = (key: TranslationKey): string => translations[language][key] || translations['en'][key] || key

  const getGreeting = () => {
    const hour = new Date().getHours()
    const lang = useAppStore.getState().language
    const t = (key: TranslationKey) => translations[lang][key] || translations['en'][key] || key
    if (hour < 12) return t('goodMorning')
    if (hour < 17) return t('goodAfternoon')
    return t('goodEvening')
  }

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true)
      try {
        const [exp, rec, pay, loan, acc] = await Promise.all([
          apiFetch<any>('/expenses'), apiFetch<any>('/receivables'),
          apiFetch<any>('/payables'), apiFetch<any>('/loans'), apiFetch<any>('/accounts')
        ])
        useAppStore.getState().setExpenses(exp.expenses)
        useAppStore.getState().setReceivables(rec.receivables)
        useAppStore.getState().setPayables(pay.payables)
        useAppStore.getState().setLoans(loan.loans)
        useAppStore.getState().setAccounts(acc.accounts)
      } catch { /* ignore */ }
      setLoading(false)
    }
    fetchDashboard()
  }, [])

  const totalExpenses = useMemo(() => (expenses as Expense[]).reduce((s, e) => s + e.amount, 0), [expenses])
  const totalReceivables = useMemo(() => (receivables as Receivable[]).filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0), [receivables])
  const totalPayables = useMemo(() => (payables as Payable[]).filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0), [payables])
  const totalLoanRemaining = useMemo(() => (loans as Loan[]).filter(l => l.status === 'active').reduce((s, l) => s + (l.totalAmount - l.paidAmount), 0), [loans])
  const totalBalance = useMemo(() => (accounts as Account[]).reduce((s, a) => s + a.balance, 0), [accounts])

  const quickActions = [
    { icon: <DollarSign className="w-5 h-5" />, label: 'Expenses', page: 'expenses' as Page, color: 'from-orange-400 to-red-400' },
    { icon: <ArrowDownLeft className="w-5 h-5" />, label: 'Receivable', page: 'receivables' as Page, color: 'from-green-400 to-emerald-500' },
    { icon: <ArrowUpRight className="w-5 h-5" />, label: 'Payable', page: 'payables' as Page, color: 'from-red-400 to-rose-500' },
    { icon: <Landmark className="w-5 h-5" />, label: 'Loan/EMI', page: 'loans' as Page, color: 'from-purple-400 to-violet-500' },
  ]

  const toolCards = [
    { icon: <Calculator className="w-6 h-6" />, label: 'Calculator', page: 'calculator' as Page, desc: 'Quick math' },
    { icon: <Banknote className="w-6 h-6" />, label: 'Note Counter', page: 'notecounter' as Page, desc: 'Count cash' },
    { icon: <CalendarDays className="w-6 h-6" />, label: "Tomorrow's Plan", page: 'plans' as Page, desc: 'Plan ahead' },
    { icon: <StickyNote className="w-6 h-6" />, label: 'Notes', page: 'notes' as Page, desc: 'Write notes' },
    { icon: <ScanLine className="w-6 h-6" />, label: 'Doc Scanner', page: 'docscanner' as Page, desc: 'Scan docs' },
    { icon: <FolderLock className="w-6 h-6" />, label: 'DocVault', page: 'docvault' as Page, desc: 'Secure docs' },
    { icon: <Bell className="w-6 h-6" />, label: 'Alarm', page: 'alarm' as Page, desc: 'Set alarms' },
    { icon: <Wrench className="w-6 h-6" />, label: 'Tools', page: 'tools' as Page, desc: 'PDF & more' },
  ]

  const recentExpenses = (expenses as Expense[]).slice(0, 5)

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">{getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-emerald-100 mt-1">{t('financialOverview')}</p>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-3xl font-bold">{formatCurrency(totalBalance)}</span>
          <span className="text-emerald-200 text-sm mb-1">{t('totalBalance')}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setPage('expenses')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-xs text-muted-foreground">Expenses</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setPage('receivables')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-muted-foreground">Receivable</span>
            </div>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalReceivables)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setPage('payables')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs text-muted-foreground">Payable</span>
            </div>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalPayables)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setPage('loans')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Landmark className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-xs text-muted-foreground">Loan Due</span>
            </div>
            <p className="text-lg font-bold text-purple-600">{formatCurrency(totalLoanRemaining)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold mb-3">{t('quickActions')}</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {quickActions.map(action => (
            <button key={action.label} onClick={() => setPage(action.page)} className="flex flex-col items-center gap-2 min-w-[72px]">
              <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center text-white shadow-md`}>
                {action.icon}
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div>
        <h3 className="font-semibold mb-3">Tools & Utilities</h3>
        <div className="grid grid-cols-4 gap-3">
          {toolCards.map(tool => (
            <button key={tool.label} onClick={() => setPage(tool.page)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted transition-colors">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600">
                {tool.icon}
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Expenses */}
      {recentExpenses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Expenses</h3>
            <button onClick={() => setPage('expenses')} className="text-sm text-emerald-600 hover:underline">View All</button>
          </div>
          <div className="space-y-2">
            {recentExpenses.map(expense => (
              <div key={expense.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (EXPENSE_COLORS[expense.category] || '#94a3b8') + '20' }}>
                  <DollarSign className="w-5 h-5" style={{ color: EXPENSE_COLORS[expense.category] || '#94a3b8' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{expense.title}</p>
                  <p className="text-xs text-muted-foreground">{expense.category} · {formatDate(expense.date)}</p>
                </div>
                <p className="text-sm font-semibold text-red-500">-{formatCurrency(expense.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      )}
    </div>
  )
})

// ============ EXPENSES PAGE ============
const ExpensesPage = memo(function ExpensesPage() {
  const { expenses, setExpenses } = useAppStore(useShallow(state => ({
    expenses: state.expenses,
    setExpenses: state.setExpenses,
  })))
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food & Dining', date: getToday(), note: '' })
  const [filter, setFilter] = useState('all')

  const loadExpenses = async () => {
    try {
      const data = await apiFetch<any>(`/expenses${filter !== 'all' ? `?category=${filter}` : ''}`)
      setExpenses(data.expenses)
    } catch { /* */ }
  }

  useEffect(() => { loadExpenses() }, [filter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await apiFetch('/expenses', { method: 'PUT', body: JSON.stringify({ id: editing.id, ...form }) })
        toast({ title: 'Expense updated' })
      } else {
        await apiFetch('/expenses', { method: 'POST', body: JSON.stringify(form) })
        toast({ title: 'Expense added' })
      }
      setForm({ title: '', amount: '', category: 'Food & Dining', date: getToday(), note: '' })
      setEditing(null)
      setShowForm(false)
      loadExpenses()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditing(expense)
    setForm({ title: expense.title, amount: String(expense.amount), category: expense.category, date: expense.date, note: expense.note || '' })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    try {
      await apiFetch(`/expenses?id=${id}`, { method: 'DELETE' })
      toast({ title: 'Expense deleted' })
      loadExpenses()
    } catch { /* */ }
  }

  const total = useMemo(() => (expenses as Expense[]).reduce((s, e) => s + e.amount, 0), [expenses])

  // Category breakdown
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    ;(expenses as Expense[]).forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount })
    return totals
  }, [expenses])

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* Summary */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <CardContent className="p-5">
          <p className="text-orange-100 text-sm">Total Expenses</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(total)}</p>
          <p className="text-orange-200 text-xs mt-1">{(expenses as Expense[]).length} transactions</p>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">By Category</h3>
          {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EXPENSE_COLORS[cat] || '#94a3b8' }} />
              <span className="text-sm flex-1">{cat}</span>
              <span className="text-sm font-medium">{formatCurrency(amt)}</span>
              <div className="w-20">
                <Progress value={(amt / total) * 100} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
        {EXPENSE_CATEGORIES.slice(0, 8).map(cat => (
          <Button key={cat} variant={filter === cat ? 'default' : 'outline'} size="sm" onClick={() => setFilter(cat)} className="whitespace-nowrap text-xs">
            {cat}
          </Button>
        ))}
      </div>

      {/* Add Button */}
      <Button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ title: '', amount: '', category: 'Food & Dining', date: getToday(), note: '' }) }} className="w-full">
        <Plus className="w-4 h-4 mr-2" /> Add Expense
      </Button>

      {/* Form */}
      {showForm && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                <div><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
              </div>
              <div><Label>Note</Label><Textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} /></div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editing ? 'Update' : 'Add'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="space-y-2">
        {(expenses as Expense[]).map(expense => (
          <div key={expense.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (EXPENSE_COLORS[expense.category] || '#94a3b8') + '20' }}>
              <DollarSign className="w-5 h-5" style={{ color: EXPENSE_COLORS[expense.category] || '#94a3b8' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{expense.title}</p>
              <p className="text-xs text-muted-foreground">{expense.category} · {formatDate(expense.date)}</p>
            </div>
            <p className="text-sm font-semibold text-red-500">-{formatCurrency(expense.amount)}</p>
            <div className="flex gap-1">
              <button onClick={() => handleEdit(expense)} className="p-1.5 hover:bg-muted rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(expense.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        {(expenses as Expense[]).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No expenses yet</p>
          </div>
        )}
      </div>
    </div>
  )
})

// ============ RECEIVABLES PAGE ============
const ReceivablesPage = memo(function ReceivablesPage() {
  const { receivables, setReceivables } = useAppStore(useShallow(state => ({
    receivables: state.receivables,
    setReceivables: state.setReceivables,
  })))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', fromPerson: '', dueDate: '', note: '' })

  const load = async () => {
    try { const d = await apiFetch<any>('/receivables'); setReceivables(d.receivables) } catch { /* */ }
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiFetch('/receivables', { method: 'POST', body: JSON.stringify(form) })
      toast({ title: 'Receivable added' })
      setForm({ title: '', amount: '', fromPerson: '', dueDate: '', note: '' })
      setShowForm(false)
      load()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    }
  }

  const markReceived = async (id: string) => {
    try {
      await apiFetch('/receivables', { method: 'PUT', body: JSON.stringify({ id, status: 'received' }) })
      toast({ title: 'Marked as received' })
      load()
    } catch { /* */ }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return
    try { await apiFetch(`/receivables?id=${id}`, { method: 'DELETE' }); load() } catch { /* */ }
  }

  const total = useMemo(() => (receivables as Receivable[]).filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0), [receivables])

  return (
    <div className="p-4 pb-24 space-y-4">
      <Card className="border-0 shadow-md bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardContent className="p-5">
          <p className="text-green-100 text-sm">Total Receivable</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(total)}</p>
        </CardContent>
      </Card>

      <Button onClick={() => setShowForm(!showForm)} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Receivable</Button>

      {showForm && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                <div><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>From</Label><Input value={form.fromPerson} onChange={e => setForm({ ...form, fromPerson: e.target.value })} required /></div>
                <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
              </div>
              <div><Label>Note</Label><Textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} /></div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Add</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {(receivables as Receivable[]).map(r => (
          <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl shadow-sm ${r.status === 'received' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800'}`}>
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              {r.status === 'received' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <ArrowDownLeft className="w-5 h-5 text-green-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground">From: {r.fromPerson}{r.dueDate ? ` · Due: ${formatDate(r.dueDate)}` : ''}</p>
            </div>
            <p className="text-sm font-semibold text-green-600">{formatCurrency(r.amount)}</p>
            <div className="flex gap-1">
              {r.status === 'pending' && <button onClick={() => markReceived(r.id)} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"><CheckCircle className="w-3.5 h-3.5" /></button>}
              <button onClick={() => handleDelete(r.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

// ============ PAYABLES PAGE ============
const PayablesPage = memo(function PayablesPage() {
  const { payables, setPayables } = useAppStore(useShallow(state => ({
    payables: state.payables,
    setPayables: state.setPayables,
  })))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', toPerson: '', dueDate: '', note: '' })

  const load = async () => {
    try { const d = await apiFetch<any>('/payables'); setPayables(d.payables) } catch { /* */ }
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiFetch('/payables', { method: 'POST', body: JSON.stringify(form) })
      toast({ title: 'Payable added' })
      setForm({ title: '', amount: '', toPerson: '', dueDate: '', note: '' })
      setShowForm(false)
      load()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    }
  }

  const markPaid = async (id: string) => {
    try {
      await apiFetch('/payables', { method: 'PUT', body: JSON.stringify({ id, status: 'paid' }) })
      toast({ title: 'Marked as paid' })
      load()
    } catch { /* */ }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return
    try { await apiFetch(`/payables?id=${id}`, { method: 'DELETE' }); load() } catch { /* */ }
  }

  const total = useMemo(() => (payables as Payable[]).filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0), [payables])

  return (
    <div className="p-4 pb-24 space-y-4">
      <Card className="border-0 shadow-md bg-gradient-to-r from-red-500 to-rose-500 text-white">
        <CardContent className="p-5">
          <p className="text-red-100 text-sm">Total Payable</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(total)}</p>
        </CardContent>
      </Card>

      <Button onClick={() => setShowForm(!showForm)} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Payable</Button>

      {showForm && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                <div><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>To</Label><Input value={form.toPerson} onChange={e => setForm({ ...form, toPerson: e.target.value })} required /></div>
                <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
              </div>
              <div><Label>Note</Label><Textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} /></div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Add</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {(payables as Payable[]).map(p => (
          <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl shadow-sm ${p.status === 'paid' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800'}`}>
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              {p.status === 'paid' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <ArrowUpRight className="w-5 h-5 text-red-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{p.title}</p>
              <p className="text-xs text-muted-foreground">To: {p.toPerson}{p.dueDate ? ` · Due: ${formatDate(p.dueDate)}` : ''}</p>
            </div>
            <p className="text-sm font-semibold text-red-600">{formatCurrency(p.amount)}</p>
            <div className="flex gap-1">
              {p.status === 'pending' && <button onClick={() => markPaid(p.id)} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"><CheckCircle className="w-3.5 h-3.5" /></button>}
              <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

// ============ LOANS PAGE ============
const LoansPage = memo(function LoansPage() {
  const { loans, setLoans } = useAppStore(useShallow(state => ({
    loans: state.loans,
    setLoans: state.setLoans,
  })))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', totalAmount: '', emiAmount: '', interestRate: '', tenure: '', startDate: getToday(), endDate: '', note: '' })

  const load = async () => {
    try { const d = await apiFetch<any>('/loans'); setLoans(d.loans) } catch { /* */ }
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiFetch('/loans', { method: 'POST', body: JSON.stringify(form) })
      toast({ title: 'Loan added' })
      setForm({ title: '', totalAmount: '', emiAmount: '', interestRate: '', tenure: '', startDate: getToday(), endDate: '', note: '' })
      setShowForm(false)
      load()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    }
  }

  const addPayment = async (loan: Loan) => {
    const amount = prompt(`Enter EMI payment amount (EMI: ${formatCurrency(loan.emiAmount || 0)})`)
    if (!amount) return
    try {
      await apiFetch('/loans', { method: 'PUT', body: JSON.stringify({ id: loan.id, paidAmount: loan.paidAmount + parseFloat(amount) }) })
      toast({ title: 'Payment recorded' })
      load()
    } catch { /* */ }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this loan?')) return
    try { await apiFetch(`/loans?id=${id}`, { method: 'DELETE' }); load() } catch { /* */ }
  }

  const totalRemaining = useMemo(() => (loans as Loan[]).filter(l => l.status === 'active').reduce((s, l) => s + (l.totalAmount - l.paidAmount), 0), [loans])

  return (
    <div className="p-4 pb-24 space-y-4">
      <Card className="border-0 shadow-md bg-gradient-to-r from-purple-500 to-violet-600 text-white">
        <CardContent className="p-5">
          <p className="text-purple-100 text-sm">Total Loan Remaining</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalRemaining)}</p>
        </CardContent>
      </Card>

      <Button onClick={() => setShowForm(!showForm)} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Loan</Button>

      {showForm && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Loan Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Home Loan, Car Loan..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Total Amount</Label><Input type="number" step="0.01" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} required /></div>
                <div><Label>EMI Amount</Label><Input type="number" step="0.01" value={form.emiAmount} onChange={e => setForm({ ...form, emiAmount: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Interest Rate %</Label><Input type="number" step="0.1" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} /></div>
                <div><Label>Tenure (months)</Label><Input type="number" value={form.tenure} onChange={e => setForm({ ...form, tenure: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required /></div>
                <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
              </div>
              <div><Label>Note</Label><Textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} /></div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Add Loan</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {(loans as Loan[]).map(loan => {
          const progress = loan.totalAmount > 0 ? (loan.paidAmount / loan.totalAmount) * 100 : 0
          const remaining = loan.totalAmount - loan.paidAmount
          return (
            <Card key={loan.id} className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{loan.title}</p>
                    <p className="text-xs text-muted-foreground">Started: {formatDate(loan.startDate)}{loan.interestRate ? ` · ${loan.interestRate}%` : ''}</p>
                  </div>
                  <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>{loan.status}</Badge>
                </div>
                <Progress value={progress} className="h-2 mb-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Paid: {formatCurrency(loan.paidAmount)}</span>
                  <span className="text-red-600">Remaining: {formatCurrency(remaining)}</span>
                </div>
                {loan.emiAmount && <p className="text-xs text-muted-foreground mt-1">EMI: {formatCurrency(loan.emiAmount)}/month</p>}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => addPayment(loan)} className="flex-1">
                    <DollarSign className="w-3.5 h-3.5 mr-1" /> Pay EMI
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(loan.id)} className="text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
})

// ============ ACCOUNTS PAGE ============
const AccountsPage = memo(function AccountsPage() {
  const { accounts, setAccounts } = useAppStore(useShallow(state => ({
    accounts: state.accounts,
    setAccounts: state.setAccounts,
  })))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'Bank Account', balance: '', note: '' })

  const load = async () => {
    try { const d = await apiFetch<any>('/accounts'); setAccounts(d.accounts) } catch { /* */ }
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiFetch('/accounts', { method: 'POST', body: JSON.stringify(form) })
      toast({ title: 'Account added' })
      setForm({ name: '', type: 'Bank Account', balance: '', note: '' })
      setShowForm(false)
      load()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this account?')) return
    try { await apiFetch(`/accounts?id=${id}`, { method: 'DELETE' }); load() } catch { /* */ }
  }

  const totalBalance = useMemo(() => (accounts as Account[]).reduce((s, a) => s + a.balance, 0), [accounts])

  const typeIcons: Record<string, React.ReactNode> = {
    'Bank Account': <Landmark className="w-5 h-5" />,
    'Cash': <Banknote className="w-5 h-5" />,
    'Mobile Wallet': <SmartphoneIcon className="w-5 h-5" />,
    'Credit Card': <CreditCardIcon className="w-5 h-5" />,
    'Savings': <PiggyBankIcon className="w-5 h-5" />,
    'Investment': <TrendingUp className="w-5 h-5" />,
    'Other': <Wallet className="w-5 h-5" />,
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <Card className="border-0 shadow-md bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
        <CardContent className="p-5">
          <p className="text-teal-100 text-sm">Total Balance</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
        </CardContent>
      </Card>

      <Button onClick={() => setShowForm(!showForm)} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Account</Button>

      {showForm && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Account Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="My Savings, Cash..." /></div>
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Balance</Label><Input type="number" step="0.01" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} required /></div>
              <div><Label>Note</Label><Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Add</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {(accounts as Account[]).map(acc => (
          <div key={acc.id} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-xl flex items-center justify-center text-teal-600">
              {typeIcons[acc.type] || <Wallet className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">{acc.name}</p>
              <p className="text-xs text-muted-foreground">{acc.type}</p>
            </div>
            <p className="text-lg font-bold text-teal-600">{formatCurrency(acc.balance)}</p>
            <button onClick={() => handleDelete(acc.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  )
})

// Helper icon components
function SmartphoneIcon({ className }: { className?: string }) { return <div className={className}>📱</div> }
function CreditCardIcon({ className }: { className?: string }) { return <div className={className}>💳</div> }
function PiggyBankIcon({ className }: { className?: string }) { return <div className={className}>🐷</div> }

// ============ TOMORROW'S PLAN ============
const PlansPage = memo(function PlansPage() {
  const { plans, setPlans } = useAppStore(useShallow(state => ({
    plans: state.plans,
    setPlans: state.setPlans,
  })))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', date: getTomorrow(), time: '', priority: 'medium' })

  const load = async () => {
    try { const d = await apiFetch<any>('/plans'); setPlans(d.plans) } catch { /* */ }
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiFetch('/plans', { method: 'POST', body: JSON.stringify(form) })
      toast({ title: 'Plan added' })
      setForm({ title: '', description: '', date: getTomorrow(), time: '', priority: 'medium' })
      setShowForm(false)
      load()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    }
  }

  const toggleComplete = async (plan: Plan) => {
    try {
      await apiFetch('/plans', { method: 'PUT', body: JSON.stringify({ id: plan.id, completed: !plan.completed }) })
      load()
    } catch { /* */ }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return
    try { await apiFetch(`/plans?id=${id}`, { method: 'DELETE' }); load() } catch { /* */ }
  }

  const priorityColors: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' }

  return (
    <div className="p-4 pb-24 space-y-4">
      <Card className="border-0 shadow-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <CardContent className="p-5">
          <p className="text-blue-100 text-sm">Tomorrow&apos;s Plans</p>
          <p className="text-2xl font-bold mt-1">{(plans as Plan[]).filter(p => !p.completed).length} pending</p>
        </CardContent>
      </Card>

      <Button onClick={() => setShowForm(!showForm)} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Plan</Button>

      {showForm && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Plan Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
                <div><Label>Time</Label><Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
              </div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Add</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {(plans as Plan[]).map(plan => (
          <div key={plan.id} className={`flex items-center gap-3 p-3 rounded-xl shadow-sm ${plan.completed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800'}`}>
            <button onClick={() => toggleComplete(plan)} className="flex-shrink-0">
              {plan.completed ? <CheckCircle className="w-6 h-6 text-green-600" /> : <div className="w-6 h-6 border-2 border-muted-foreground/30 rounded-full" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${plan.completed ? 'line-through text-muted-foreground' : ''}`}>{plan.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{formatDate(plan.date)}{plan.time ? ` · ${plan.time}` : ''}</span>
                <Badge className={`text-[10px] ${priorityColors[plan.priority]}`}>{plan.priority}</Badge>
              </div>
            </div>
            <button onClick={() => handleDelete(plan.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  )
})

// ============ NOTES PAGE ============
const NotesPage = memo(function NotesPage() {
  const { notes, setNotes } = useAppStore(useShallow(state => ({
    notes: state.notes,
    setNotes: state.setNotes,
  })))
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)
  const [form, setForm] = useState({ title: '', content: '', color: '#ffffff', pinned: false })

  const load = async () => {
    try { const d = await apiFetch<any>('/notes'); setNotes(d.notes) } catch { /* */ }
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await apiFetch('/notes', { method: 'PUT', body: JSON.stringify({ id: editing.id, ...form }) })
        toast({ title: 'Note updated' })
      } else {
        await apiFetch('/notes', { method: 'POST', body: JSON.stringify(form) })
        toast({ title: 'Note created' })
      }
      setForm({ title: '', content: '', color: '#ffffff', pinned: false })
      setEditing(null)
      setShowForm(false)
      load()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    }
  }

  const handleEdit = (note: Note) => {
    setEditing(note)
    setForm({ title: note.title, content: note.content, color: note.color, pinned: note.pinned })
    setShowForm(true)
  }

  const togglePin = async (note: Note) => {
    try {
      await apiFetch('/notes', { method: 'PUT', body: JSON.stringify({ id: note.id, pinned: !note.pinned }) })
      load()
    } catch { /* */ }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return
    try { await apiFetch(`/notes?id=${id}`, { method: 'DELETE' }); load() } catch { /* */ }
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <Button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ title: '', content: '', color: '#ffffff', pinned: false }) }} className="w-full">
        <Plus className="w-4 h-4 mr-2" /> New Note
      </Button>

      {showForm && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>Content</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} /></div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-1">
                  {NOTE_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full border-2 ${form.color === c ? 'border-emerald-500' : 'border-gray-200'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.pinned} onCheckedChange={v => setForm({ ...form, pinned: v })} />
                <Label>Pin this note</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editing ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        {(notes as Note[]).map(note => (
          <Card key={note.id} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" style={{ backgroundColor: note.color }} onClick={() => handleEdit(note)}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                {note.pinned && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }} className="p-1 hover:bg-black/10 rounded ml-auto">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm font-medium line-clamp-1">{note.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{note.content || 'No content'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
})

// ============ NOTE COUNTER ============
const NoteCounterPage = memo(function NoteCounterPage() {
  const language = useAppStore(state => state.language)
  const [counts, setCounts] = useState<Record<string, number>>({
    '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '2': 0, '1': 0
  })
  const [savedCounts, setSavedCounts] = useState<Array<{ id: string; date: string; counts: Record<string, number>; total: number; category?: string; remark?: string; personName?: string; mobileNumber?: string; accountNumber?: string; entryType?: 'in' | 'out' }>>([])
  const [showSaved, setShowSaved] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const [showCalcHistory, setShowCalcHistory] = useState(false)

  // Extra entry fields (like the reference app)
  const [category, setCategory] = useState('')
  const [remark, setRemark] = useState('')
  const [personName, setPersonName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  // Amount to Payable/Receivable - tally calculator
  const [targetAmount, setTargetAmount] = useState<string>('')
  const [targetMode, setTargetMode] = useState<'payable' | 'receivable'>('payable')

  // Calculator state
  const [calcDisplay, setCalcDisplay] = useState('0')
  const [calcPrevious, setCalcPrevious] = useState<string | null>(null)
  const [calcOperation, setCalcOperation] = useState<string | null>(null)
  const [calcReset, setCalcReset] = useState(false)
  const [calcExpression, setCalcExpression] = useState('')

  // Calculator history
  const [calcHistory, setCalcHistory] = useState<Array<{ id: string; expression: string; result: string; date: string; fromNoteCount?: boolean }>>([])

  const denominations = [
    { value: 500, label: '₹500', labelBn: '₹৫০০', color: '#FF6B35', textColor: '#fff' },
    { value: 200, label: '₹200', labelBn: '₹২০০', color: '#FFB347', textColor: '#1a1a2e' },
    { value: 100, label: '₹100', labelBn: '₹১০০', color: '#4CAF50', textColor: '#fff' },
    { value: 50, label: '₹50', labelBn: '₹৫০', color: '#26A69A', textColor: '#fff' },
    { value: 20, label: '₹20', labelBn: '₹২০', color: '#42A5F5', textColor: '#fff' },
    { value: 10, label: '₹10', labelBn: '₹১০', color: '#AB47BC', textColor: '#fff' },
    { value: 5, label: '₹5', labelBn: '₹৫', color: '#EC407A', textColor: '#fff' },
    { value: 2, label: '₹2', labelBn: '₹২', color: '#5C6BC0', textColor: '#fff' },
    { value: 1, label: '₹1', labelBn: '₹১', color: '#78909C', textColor: '#fff' },
  ]

  // Keyboard detection for sticky bottom bar
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const handleResize = () => {
      const offsetHeight = window.innerHeight - viewport.height
      setKeyboardHeight(offsetHeight > 50 ? offsetHeight : 0)
    }
    viewport.addEventListener('resize', handleResize)
    viewport.addEventListener('scroll', handleResize)
    return () => {
      viewport.removeEventListener('resize', handleResize)
      viewport.removeEventListener('scroll', handleResize)
    }
  }, [])

  const resetCounts = { '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '2': 0, '1': 0 }

  const total = denominations.reduce((sum, d) => sum + (d.value * (counts[String(d.value)] || 0)), 0)
  const totalNotes = Object.values(counts).reduce((s, c) => s + c, 0)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('noteCounterSaved')
      if (saved) setSavedCounts(JSON.parse(saved))
    } catch {}
    try {
      const hist = localStorage.getItem('noteCounterCalcHistory')
      if (hist) setCalcHistory(JSON.parse(hist))
    } catch {}
  }, [])

  const saveCalcHistory = (history: Array<{ id: string; expression: string; result: string; date: string; fromNoteCount?: boolean }>) => {
    const trimmed = history.slice(0, 100)
    setCalcHistory(trimmed)
    localStorage.setItem('noteCounterCalcHistory', JSON.stringify(trimmed))
  }

  const handleSave = (entryType: 'in' | 'out') => {
    if (total === 0) {
      toast({ title: language === 'bn' ? 'খালি কাউন্ট' : 'Empty Count', description: language === 'bn' ? 'সেভ করার আগে কিছু নোট কাউন্ট করুন।' : 'Count some notes first before saving.', variant: 'destructive' })
      return
    }
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      counts: { ...counts },
      total: total,
      category,
      remark,
      personName,
      mobileNumber,
      accountNumber,
      entryType,
    }
    const updated = [newEntry, ...savedCounts].slice(0, 50)
    setSavedCounts(updated)
    localStorage.setItem('noteCounterSaved', JSON.stringify(updated))
    toast({ title: language === 'bn' ? `সেভ হয়েছে! (${entryType === 'in' ? 'ইন' : 'আউট'})` : `Saved! (${entryType === 'in' ? 'In' : 'Out'})`, description: language === 'bn' ? `${formatCurrency(total)} সফলভাবে সেভ হয়েছে` : `Cash count of ${formatCurrency(total)} saved successfully.` })
  }

  const handleDelete = (id: string) => {
    const updated = savedCounts.filter(s => s.id !== id)
    setSavedCounts(updated)
    localStorage.setItem('noteCounterSaved', JSON.stringify(updated))
    toast({ title: language === 'bn' ? 'মুছে ফেলা হয়েছে' : 'Deleted', description: language === 'bn' ? 'সেভ করা কাউন্ট মুছে ফেলা হয়েছে' : 'Saved count removed.' })
  }

  const handleShare = () => {
    if (total === 0) {
      toast({ title: language === 'bn' ? 'খালি কাউন্ট' : 'Empty Count', description: language === 'bn' ? 'শেয়ার করার আগে কিছু নোট কাউন্ট করুন।' : 'Count some notes first before sharing.', variant: 'destructive' })
      return
    }
    let text = `💰 Note Count - ${new Date().toLocaleString('en-IN')}\n`
    text += `━━━━━━━━━━━━━━━━━━\n`
    denominations.forEach(d => {
      const c = counts[String(d.value)] || 0
      if (c > 0) text += `${d.label} × ${c} = ${formatCurrency(d.value * c)}\n`
    })
    text += `━━━━━━━━━━━━━━━━━━\n`
    text += `📝 Total Notes: ${totalNotes}\n`
    text += `💵 Total Cash: ${formatCurrency(total)}`
    if (category) text += `\n📂 Category: ${category}`
    if (remark) text += `\n📝 Remark: ${remark}`
    if (personName) text += `\n👤 Person: ${personName}`

    if (navigator.share) {
      navigator.share({ title: 'Note Count', text })
    } else {
      navigator.clipboard.writeText(text)
      toast({ title: language === 'bn' ? 'কপি হয়েছে!' : 'Copied!', description: language === 'bn' ? 'কাউন্ট বিবরণ ক্লিপবোর্ডে কপি হয়েছে' : 'Count details copied to clipboard. You can paste and share.' })
    }
  }

  const handleShareSaved = (entry: { id: string; date: string; counts: Record<string, number>; total: number }) => {
    let text = `💰 Note Count - ${entry.date}\n`
    text += `━━━━━━━━━━━━━━━━━━\n`
    denominations.forEach(d => {
      const c = entry.counts[String(d.value)] || 0
      if (c > 0) text += `${d.label} × ${c} = ${formatCurrency(d.value * c)}\n`
    })
    text += `━━━━━━━━━━━━━━━━━━\n`
    text += `💵 Total Cash: ${formatCurrency(entry.total)}`

    if (navigator.share) {
      navigator.share({ title: 'Note Count', text })
    } else {
      navigator.clipboard.writeText(text)
      toast({ title: language === 'bn' ? 'কপি হয়েছে!' : 'Copied!', description: language === 'bn' ? 'কাউন্ট বিবরণ ক্লিপবোর্ডে কপি হয়েছে' : 'Count details copied to clipboard.' })
    }
  }

  // Calculator functions
  const calcHandleNumber = (num: string) => {
    if (calcReset) { setCalcDisplay(num); setCalcReset(false) }
    else setCalcDisplay(calcDisplay === '0' ? num : calcDisplay + num)
  }

  const calcHandleOperation = (op: string) => {
    if (calcPrevious && calcOperation && !calcReset) { calcCalculate(false) }
    setCalcExpression(formatCurrency(parseFloat(calcDisplay)) + ' ' + op)
    setCalcPrevious(calcDisplay)
    setCalcOperation(op)
    setCalcReset(true)
  }

  const calcCalculate = (addToHistory = true) => {
    if (!calcPrevious || !calcOperation) return
    const prev = parseFloat(calcPrevious)
    const curr = parseFloat(calcDisplay)
    let result = 0
    switch (calcOperation) {
      case '+': result = prev + curr; break
      case '-': result = prev - curr; break
      case '×': result = prev * curr; break
      case '÷': result = curr !== 0 ? prev / curr : 0; break
    }
    const resultStr = String(Math.round(result * 100000000) / 100000000)
    const expressionStr = `${formatCurrency(prev)} ${calcOperation} ${formatCurrency(curr)} = ${formatCurrency(result)}`

    if (addToHistory) {
      const newEntry = {
        id: Date.now().toString(),
        expression: expressionStr,
        result: resultStr,
        date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      }
      saveCalcHistory([newEntry, ...calcHistory])
    }

    setCalcDisplay(resultStr)
    setCalcExpression('')
    setCalcPrevious(null)
    setCalcOperation(null)
    setCalcReset(true)
  }

  const calcClear = () => { setCalcDisplay('0'); setCalcPrevious(null); setCalcOperation(null); setCalcExpression('') }
  const calcPercent = () => setCalcDisplay(String(parseFloat(calcDisplay) / 100))
  const calcToggleSign = () => setCalcDisplay(String(-parseFloat(calcDisplay)))
  const calcDecimal = () => { if (!calcDisplay.includes('.')) setCalcDisplay(calcDisplay + '.') }

  const calcBackspace = () => {
    if (calcReset) return
    if (calcDisplay.length <= 1 || (calcDisplay.length === 2 && calcDisplay.startsWith('-'))) {
      setCalcDisplay('0')
    } else {
      setCalcDisplay(calcDisplay.slice(0, -1))
    }
  }

  const sendTotalToCalc = () => {
    const newEntry = {
      id: Date.now().toString(),
      expression: `${language === 'bn' ? 'নোট কাউন্ট থেকে' : 'From Note Count'} → ${formatCurrency(total)}`,
      result: String(total),
      date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      fromNoteCount: true as const,
    }
    saveCalcHistory([newEntry, ...calcHistory])
    setCalcDisplay(String(total))
    setCalcPrevious(null)
    setCalcOperation(null)
    setCalcExpression('')
    setCalcReset(true)
    setShowCalc(true)
    toast({ title: language === 'bn' ? 'ক্যালকুলেটরে পাঠানো হয়েছে!' : 'Sent to Calculator!', description: language === 'bn' ? `${formatCurrency(total)} ক্যালকুলেটরে ট্রান্সফার হয়েছে` : `${formatCurrency(total)} transferred to calculator.` })
  }

  const clearCalcHistory = () => {
    saveCalcHistory([])
    toast({ title: language === 'bn' ? 'ইতিহাস মুছে ফেলা হয়েছে' : 'History Cleared', description: language === 'bn' ? 'সব ক্যালকুলেশন ইতিহাস মুছে ফেলা হয়েছে' : 'All calculation history has been cleared.' })
  }

  const applyHistoryResult = (result: string) => {
    setCalcDisplay(result)
    setCalcPrevious(null)
    setCalcOperation(null)
    setCalcExpression('')
    setCalcReset(true)
  }

  const calcButtons = [
    ['C', '⌫', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ]

  const calcHandleButton = (val: string) => {
    if (val >= '0' && val <= '9') calcHandleNumber(val)
    else if (['+', '-', '×', '÷'].includes(val)) calcHandleOperation(val)
    else if (val === '=') calcCalculate()
    else if (val === 'C') calcClear()
    else if (val === '+/-') calcToggleSign()
    else if (val === '%') calcPercent()
    else if (val === '.') calcDecimal()
    else if (val === '⌫') calcBackspace()
  }

  // Calculate Payable/Receivable difference
  const targetNum = parseInt(targetAmount) || 0
  const tallyDiff = targetNum > 0 ? total - targetNum : 0

  const resetAll = () => {
    setCounts({ ...resetCounts })
    setCategory('')
    setRemark('')
    setPersonName('')
    setMobileNumber('')
    setAccountNumber('')
    setTargetAmount('')
  }

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden" style={{ height: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight}px)` : '100vh', transition: 'height 0.15s ease' }}>
      {/* ===== FIXED TOP: HEADER + SUMMARY + PAYABLE/RECEIVABLE ===== */}
      <div className="bg-white dark:bg-gray-900 shrink-0 z-30 border-b border-border/30">
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-lg">{language === 'bn' ? 'নোট কাউন্টার' : 'Note Counter'}</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowCalc(!showCalc)} className="p-1.5 hover:bg-muted rounded-lg text-emerald-600 dark:text-emerald-400 transition-colors" title={language === 'bn' ? 'ক্যালকুলেটর' : 'Calculator'}>
              <Calculator className="w-5 h-5" />
            </button>
            <button onClick={handleShare} className="p-1.5 hover:bg-muted rounded-lg text-blue-600 dark:text-blue-400 transition-colors" title={language === 'bn' ? 'শেয়ার' : 'Share'}>
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={resetAll} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-500 transition-colors" title={language === 'bn' ? 'রিসেট' : 'Reset'}>
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Summary Bar */}
        <div className="border-b border-border/50 px-4 py-2 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">N</span>
              <span className="text-yellow-500 dark:text-yellow-400 font-bold text-lg">{totalNotes}</span>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <span className="text-yellow-600 dark:text-yellow-500 text-xs font-bold">₹</span>
              <span className="text-yellow-500 dark:text-yellow-400 font-bold text-lg">{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
        {/* Payable/Receivable */}
        <div className="px-3 py-2 border-b border-border/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between p-2 pb-1">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-muted-foreground text-xs font-medium">{language === 'bn' ? 'অ্যামাউন্ট (পে/রিসি)' : 'Amount (Pay/Rec)'}</span>
              </div>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-border">
                <button
                  onClick={() => setTargetMode('payable')}
                  className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${targetMode === 'payable' ? 'bg-red-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {language === 'bn' ? 'পেয়াবল' : 'Pay'}
                </button>
                <button
                  onClick={() => setTargetMode('receivable')}
                  className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${targetMode === 'receivable' ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {language === 'bn' ? 'রিসিভেবল' : 'Rec'}
                </button>
              </div>
            </div>
            <div className="px-2 pb-2 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`text-base font-bold ${targetMode === 'payable' ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>₹</span>
                <input
                  type="number"
                  value={targetAmount}
                  placeholder={targetMode === 'payable' ? (language === 'bn' ? 'যত টাকা দিতে হবে...' : 'Amount to pay...') : (language === 'bn' ? 'যত টাকা পাবেন...' : 'Amount to receive...')}
                  onChange={e => setTargetAmount(e.target.value)}
                  className="flex-1 h-8 px-2 bg-gray-100 dark:bg-gray-800 text-foreground text-sm font-bold rounded border border-border focus:border-yellow-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground placeholder:font-normal placeholder:text-xs"
                  min={0}
                />
                {targetAmount && (
                  <button onClick={() => setTargetAmount('')} className="text-muted-foreground hover:text-foreground p-0.5">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Live Tally Result */}
              {targetNum > 0 && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 border border-border">
                  {tallyDiff === 0 ? (
                    <div className="bg-emerald-900/30 border border-emerald-600/40 rounded-lg p-1.5 text-center">
                      <p className="text-emerald-400 text-xs font-bold">✓ {language === 'bn' ? 'সমান! হিসাব মিলেছে' : 'Equal! Tally matched'}</p>
                    </div>
                  ) : targetMode === 'payable' ? (
                    tallyDiff > 0 ? (
                      <div className="flex items-center justify-between bg-emerald-900/30 border border-emerald-600/40 rounded-lg p-1.5">
                        <div>
                          <p className="text-emerald-400 text-[10px]">{language === 'bn' ? 'বেশি হয়েছে' : 'Excess'}</p>
                          <p className="text-emerald-300 text-sm font-bold">{formatCurrency(Math.abs(tallyDiff))}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-red-900/30 border border-red-600/40 rounded-lg p-1.5">
                        <div>
                          <p className="text-red-400 text-[10px]">{language === 'bn' ? 'কম হয়েছে' : 'Shortfall'}</p>
                          <p className="text-red-300 text-sm font-bold">{formatCurrency(Math.abs(tallyDiff))}</p>
                        </div>
                      </div>
                    )
                  ) : tallyDiff > 0 ? (
                    <div className="flex items-center justify-between bg-amber-900/30 border border-amber-600/40 rounded-lg p-1.5">
                      <div>
                        <p className="text-amber-400 text-[10px]">{language === 'bn' ? 'বেশি পাওয়া' : 'Excess Recv'}</p>
                        <p className="text-amber-300 text-sm font-bold">{formatCurrency(Math.abs(tallyDiff))}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-blue-900/30 border border-blue-600/40 rounded-lg p-1.5">
                      <div>
                        <p className="text-blue-400 text-[10px]">{language === 'bn' ? 'কম পাওয়া' : 'Shortfall Recv'}</p>
                        <p className="text-blue-300 text-sm font-bold">{formatCurrency(Math.abs(tallyDiff))}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== SCROLLABLE MIDDLE: NOTE ROWS + ENTRY DETAILS + CALCULATOR ===== */}
      <div className="flex-1 overflow-y-auto pb-2 px-3 pt-2 space-y-1.5" id="note-counter-scroll">
        {denominations.map(d => {
          const count = counts[String(d.value)] || 0
          const subtotal = d.value * count
          return (
            <div key={d.value} className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg border border-border overflow-hidden">
              <div className="w-14 h-11 flex items-center justify-center font-bold text-sm shrink-0" style={{ backgroundColor: d.color, color: d.textColor }}>
                {language === 'bn' ? d.labelBn : d.label}
              </div>
              <div className="flex-1 flex items-center gap-1 px-1">
                <span className="text-muted-foreground text-xs">×</span>
                <button onClick={() => setCounts({ ...counts, [d.value]: Math.max(0, count - 1) })} className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center text-sm font-bold active:scale-90 transition-transform border border-red-200 dark:border-red-700/40">−</button>
                <input type="number" value={count || ''} placeholder="0" onChange={e => setCounts({ ...counts, [d.value]: parseInt(e.target.value) || 0 })} onFocus={e => { setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 300) }} className="w-10 h-8 text-center bg-gray-100 dark:bg-gray-800 text-foreground text-sm font-medium rounded border border-border focus:border-emerald-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" min={0} />
                <button onClick={() => setCounts({ ...counts, [d.value]: count + 1 })} className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold active:scale-90 transition-transform border border-emerald-200 dark:border-emerald-700/40">+</button>
              </div>
              <div className="w-20 text-right pr-3 shrink-0">
                <span className="text-yellow-500 dark:text-yellow-400 text-sm font-bold">{subtotal > 0 ? formatCurrency(subtotal) : ''}</span>
              </div>
            </div>
          )
        })}

      {/* ===== ENTRY DETAILS ===== */}
      <div className="px-3 pt-2">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-muted-foreground text-sm font-medium">{language === 'bn' ? 'এন্ট্রি বিবরণ' : 'Entry Details'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={category} onChange={e => setCategory(e.target.value)} onFocus={e => { setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 300) }} placeholder={language === 'bn' ? 'ক্যাটাগরি' : 'Category'} className="h-8 px-2 text-sm bg-gray-100 dark:bg-gray-800 text-foreground rounded border border-border focus:border-emerald-500 focus:outline-none placeholder:text-muted-foreground" />
            <input value={remark} onChange={e => setRemark(e.target.value)} onFocus={e => { setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 300) }} placeholder={language === 'bn' ? 'রিমার্ক' : 'Remark'} className="h-8 px-2 text-sm bg-gray-100 dark:bg-gray-800 text-foreground rounded border border-border focus:border-emerald-500 focus:outline-none placeholder:text-muted-foreground" />
            <input value={personName} onChange={e => setPersonName(e.target.value)} onFocus={e => { setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 300) }} placeholder={language === 'bn' ? 'ব্যক্তির নাম' : 'Person Name'} className="h-8 px-2 text-sm bg-gray-100 dark:bg-gray-800 text-foreground rounded border border-border focus:border-emerald-500 focus:outline-none placeholder:text-muted-foreground" />
            <input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} onFocus={e => { setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 300) }} placeholder={language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'} className="h-8 px-2 text-sm bg-gray-100 dark:bg-gray-800 text-foreground rounded border border-border focus:border-emerald-500 focus:outline-none placeholder:text-muted-foreground" />
          </div>
          <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} onFocus={e => { setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 300) }} placeholder={language === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'} className="w-full h-8 px-2 text-sm bg-gray-100 dark:bg-gray-800 text-foreground rounded border border-border focus:border-emerald-500 focus:outline-none placeholder:text-muted-foreground" />
        </div>
      </div>

      {/* ===== CALCULATOR ===== */}
      {showCalc && (
        <div className="px-3 pt-3">
          <div className="rounded-xl overflow-hidden border border-gray-800">
            <div className="flex items-center justify-between p-3 bg-gray-900">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span className="text-gray-300 text-sm font-medium">{language === 'bn' ? 'ক্যালকুলেটর' : 'Calculator'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCalcHistory(!showCalcHistory)} className={`text-gray-400 hover:text-white p-1 transition-colors ${showCalcHistory ? 'text-emerald-400' : ''}`}><History className="w-4 h-4" /></button>
                <button onClick={() => setShowCalc(false)} className="text-gray-400 hover:text-white p-1"><X className="w-4 h-4" /></button>
              </div>
            </div>
            {showCalcHistory && (
              <div className="bg-gray-800 border-t border-gray-700 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between p-2 px-3 sticky top-0 bg-gray-800 z-10">
                  <span className="text-gray-400 text-xs font-medium">{language === 'bn' ? 'ইতিহাস' : 'History'} ({calcHistory.length})</span>
                  {calcHistory.length > 0 && <button onClick={clearCalcHistory} className="text-red-400 hover:text-red-300 text-xs">{language === 'bn' ? 'মুছুন' : 'Clear'}</button>}
                </div>
                {calcHistory.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4">{language === 'bn' ? 'এখনও কোনো ক্যালকুলেশন নেই' : 'No calculations yet'}</p>
                ) : (
                  <div className="space-y-1 px-2 pb-2">
                    {calcHistory.map(entry => (
                      <button key={entry.id} onClick={() => applyHistoryResult(entry.result)} className="w-full text-right p-2 rounded-lg hover:bg-gray-700 transition-colors group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">{entry.fromNoteCount && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">{language === 'bn' ? 'নোট' : 'Note'}</span>}</div>
                          <p className="text-gray-500 text-[10px]">{entry.date}</p>
                        </div>
                        <p className="text-gray-400 text-xs">{entry.expression}</p>
                        <p className="text-emerald-400 text-sm font-medium group-hover:text-emerald-300">= {formatCurrency(parseFloat(entry.result))}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="bg-gray-900 p-4 pt-3">
              <div className="text-right mb-4 p-3 bg-gray-800 rounded-xl">
                {calcExpression && <p className="text-gray-400 text-sm h-5 truncate">{calcExpression}</p>}
                {!calcExpression && calcOperation && calcPrevious && <p className="text-gray-400 text-sm h-5 truncate">{formatCurrency(parseFloat(calcPrevious))} {calcOperation}</p>}
                <p className="text-white text-3xl font-light truncate">{calcDisplay.includes('.') ? calcDisplay : formatCurrency(parseFloat(calcDisplay))}</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {calcButtons.map((row, ri) => (
                  row.map((btn, ci) => {
                    const isOp = ['+', '-', '×', '÷', '='].includes(btn)
                    const isFunc = ['C', '⌫', '%'].includes(btn)
                    const isActiveOp = calcOperation === btn && calcReset
                    return (
                      <button key={`${ri}-${ci}`} onClick={() => calcHandleButton(btn)}
                        className={`h-12 rounded-xl text-lg font-medium transition-all active:scale-95 ${btn === '0' ? 'col-span-2' : ''} ${isOp ? (isActiveOp ? 'bg-emerald-300 text-gray-900' : 'bg-emerald-500 text-white hover:bg-emerald-600') : isFunc ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
                        {btn}
                      </button>
                    )
                  })
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SAVED ENTRIES ===== */}
      {showSaved && (
        <div className="px-3 pt-3 pb-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span className="text-muted-foreground text-sm font-medium">{language === 'bn' ? 'সেভ করা এন্ট্রি' : 'Saved Entries'} ({savedCounts.length})</span>
              </div>
              <button onClick={() => setShowSaved(false)} className="text-muted-foreground hover:text-foreground p-1"><X className="w-4 h-4" /></button>
            </div>
            {savedCounts.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">{language === 'bn' ? 'এখনও কোনো সেভ করা এন্ট্রি নেই' : 'No saved entries yet'}</p>
            ) : (
              <div className="divide-y divide-border">
                {savedCounts.map(entry => (
                  <div key={entry.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${entry.entryType === 'in' ? 'bg-emerald-900/60 text-emerald-400' : 'bg-red-900/60 text-red-400'}`}>
                          {entry.entryType === 'in' ? (language === 'bn' ? 'ইন' : 'IN') : (language === 'bn' ? 'আউট' : 'OUT')}
                        </span>
                        <span className="text-yellow-400 font-bold text-sm">{formatCurrency(entry.total)}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleShareSaved(entry)} className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded"><Share2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span>{entry.date}</span>
                      {entry.category && <span>• {entry.category}</span>}
                      {entry.personName && <span>• {entry.personName}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>{/* end scrollable middle */}

      {/* ===== FIXED BOTTOM: GRAND TOTAL + ACTION BUTTONS ===== */}
      <div className="shrink-0 bg-white dark:bg-gray-900 border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-30">
        {/* Grand Total */}
        <div className="px-3 pt-2 pb-1">
          <div className="bg-gradient-to-r from-amber-600 to-yellow-500 rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-[10px]">{language === 'bn' ? 'গ্র্যান্ড টোটাল' : 'GRAND TOTAL'}</p>
              <p className="text-white text-xl font-bold">{formatCurrency(total)}</p>
            </div>
            <div className="text-right">
              <p className="text-amber-100 text-[10px]">{language === 'bn' ? 'মোট নোট টাকা' : 'Total Cash'}</p>
              <p className="text-white/80 text-xs">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="px-3 pb-2 grid grid-cols-3 gap-2">
          <button onClick={() => handleSave('in')} className="bg-[#2e7d32] hover:bg-[#388e3c] text-white py-2.5 rounded-lg font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-lg">
            <Download className="w-4 h-4" /> {language === 'bn' ? 'সেভ ইন' : 'Save In'}
          </button>
          <button onClick={() => setShowSaved(!showSaved)} className="bg-[#6d4c41] hover:bg-[#795548] text-white py-2.5 rounded-lg font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-lg">
            <Eye className="w-4 h-4" /> {language === 'bn' ? 'এন্ট্রি দেখুন' : 'View Entry'}
          </button>
          <button onClick={() => handleSave('out')} className="bg-[#c62828] hover:bg-[#d32f2f] text-white py-2.5 rounded-lg font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-lg">
            <Upload className="w-4 h-4" /> {language === 'bn' ? 'সেভ আউট' : 'Save Out'}
          </button>
        </div>
      </div>
    </div>
  )
})


// ============ DOC SCANNER ============
type ScanFilter = 'original' | 'bw' | 'grayscale' | 'photo' | 'sepia'

interface ScanDoc {
  id: string
  data: string
  filter: ScanFilter
  savedToVault: boolean
  vaultId?: string
  name?: string
  category?: string
}

const DocScannerPage = memo(function DocScannerPage() {
  const { language, documents, setDocuments } = useAppStore(useShallow(state => ({
    language: state.language,
    documents: state.documents,
    setDocuments: state.setDocuments,
  })))
  const t = translations[language]
  const [scanning, setScanning] = useState(false)
  const [scannedDocs, setScannedDocs] = useState<ScanDoc[]>([])
  const [editingDoc, setEditingDoc] = useState<string | null>(null)
  const [cropMode, setCropMode] = useState(false)
  const [collageMode, setCollageMode] = useState(false)
  const [selectedForCollage, setSelectedForCollage] = useState<Set<string>>(new Set())
  const [collageLayout, setCollageLayout] = useState<'2x1' | '1x2' | '2x2'>('2x2')
  const [activeTab, setActiveTab] = useState<'new' | 'vault'>('new')
  const [autoSave, setAutoSave] = useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  // Crop state: 4 corner points as percentages (0-1) of the image
  const [cropCorners, setCropCorners] = useState<{ tl: { x: number; y: number }; tr: { x: number; y: number }; br: { x: number; y: number }; bl: { x: number; y: number } } | null>(null)
  const [draggingHandle, setDraggingHandle] = useState<string | null>(null)
  const imageRef = React.useRef<HTMLImageElement>(null)
  const [imageNaturalSize, setImageNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [rotation, setRotation] = useState(0)
  const [vaultLoaded, setVaultLoaded] = useState(false)
  const [magnifier, setMagnifier] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false })

  // Simple drag tracking ref
  const dragRef = useRef<string | null>(null) // just the handle id
  // Pre-loaded image for magnifier and crop/rotate operations
  const magnifierImgRef = useRef<HTMLImageElement | null>(null)
  const [magnifierImgReady, setMagnifierImgReady] = useState(false)
  const [detectingEdges, setDetectingEdges] = useState(false)

  // ============ AUTO DOCUMENT EDGE DETECTION (CamScanner-like) ============
  // Detects the document boundary in the image and returns 4 corner points as percentages (0-1)
  const autoDetectDocumentEdges = (img: HTMLImageElement): { tl: { x: number; y: number }; tr: { x: number; y: number }; br: { x: number; y: number }; bl: { x: number; y: number } } | null => {
    const PROC_SIZE = 300
    let w = img.naturalWidth, h = img.naturalHeight
    if (!w || !h) return null
    const s = Math.min(PROC_SIZE / w, PROC_SIZE / h, 1)
    w = Math.round(w * s)
    h = Math.round(h * s)

    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, w, h)
    const imgData = ctx.getImageData(0, 0, w, h)
    const px = imgData.data

    // Step 1: Convert to grayscale
    const gray = new Float32Array(w * h)
    for (let i = 0; i < w * h; i++) {
      gray[i] = px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114
    }

    // Step 2: Gaussian blur (5x5, sigma=1.4) to reduce noise
    const kernel = [1, 4, 7, 4, 1, 4, 16, 26, 16, 4, 7, 26, 41, 26, 7, 4, 16, 26, 16, 4, 1, 4, 7, 4, 1]
    const kSum = 273
    const blurred = new Float32Array(w * h)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (y < 2 || y >= h - 2 || x < 2 || x >= w - 2) { blurred[y * w + x] = gray[y * w + x]; continue }
        let sum = 0
        for (let ky = -2; ky <= 2; ky++) {
          for (let kx = -2; kx <= 2; kx++) {
            sum += gray[(y + ky) * w + (x + kx)] * kernel[(ky + 2) * 5 + (kx + 2)]
          }
        }
        blurred[y * w + x] = sum / kSum
      }
    }

    // Step 3: Sobel edge detection
    const edgesMag = new Float32Array(w * h)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const gx = -blurred[(y - 1) * w + (x - 1)] + blurred[(y - 1) * w + (x + 1)]
          - 2 * blurred[y * w + (x - 1)] + 2 * blurred[y * w + (x + 1)]
          - blurred[(y + 1) * w + (x - 1)] + blurred[(y + 1) * w + (x + 1)]
        const gy = -blurred[(y - 1) * w + (x - 1)] - 2 * blurred[(y - 1) * w + x] - blurred[(y - 1) * w + (x + 1)]
          + blurred[(y + 1) * w + (x - 1)] + 2 * blurred[(y + 1) * w + x] + blurred[(y + 1) * w + (x + 1)]
        edgesMag[y * w + x] = Math.sqrt(gx * gx + gy * gy)
      }
    }

    // Step 4: Adaptive threshold - use 70th percentile of non-zero edges
    const sortedEdges = [...edgesMag].filter(m => m > 0).sort((a, b) => a - b)
    if (sortedEdges.length < 50) return null
    const threshVal = sortedEdges[Math.floor(sortedEdges.length * 0.65)] || 40
    const edgeBin = new Uint8Array(w * h)
    for (let i = 0; i < w * h; i++) edgeBin[i] = edgesMag[i] > threshVal ? 1 : 0

    // Step 5: Dilate edges to close small gaps (radius=3)
    const dilateR = 3
    const dilated = new Uint8Array(w * h)
    for (let y = dilateR; y < h - dilateR; y++) {
      for (let x = dilateR; x < w - dilateR; x++) {
        let found = false
        for (let dy = -dilateR; dy <= dilateR && !found; dy++) {
          for (let dx = -dilateR; dx <= dilateR && !found; dx++) {
            if (edgeBin[(y + dy) * w + (x + dx)]) found = true
          }
        }
        dilated[y * w + x] = found ? 1 : 0
      }
    }

    // Step 6: Flood fill from image border to find background
    // Background = region reachable from the borders without crossing an edge
    const visited = new Uint8Array(w * h)
    const isBackground = new Uint8Array(w * h)

    const floodFill = (sx: number, sy: number) => {
      if (sx < 0 || sx >= w || sy < 0 || sy >= h) return
      if (visited[sy * w + sx] || dilated[sy * w + sx]) return
      const stack = [sx, sy]
      while (stack.length > 0) {
        const cy = stack.pop()!, cx = stack.pop()!
        const idx = cy * w + cx
        if (visited[idx] || dilated[idx]) continue
        visited[idx] = 1
        isBackground[idx] = 1
        if (cx > 0 && !visited[cy * w + cx - 1]) { stack.push(cx - 1); stack.push(cy) }
        if (cx < w - 1 && !visited[cy * w + cx + 1]) { stack.push(cx + 1); stack.push(cy) }
        if (cy > 0 && !visited[(cy - 1) * w + cx]) { stack.push(cx); stack.push(cy - 1) }
        if (cy < h - 1 && !visited[(cy + 1) * w + cx]) { stack.push(cx); stack.push(cy + 1) }
      }
    }

    // Flood fill from all border pixels
    for (let x = 0; x < w; x += 3) { floodFill(x, 0); floodFill(x, h - 1) }
    for (let y = 0; y < h; y += 3) { floodFill(0, y); floodFill(w - 1, y) }
    // Also fill from corners for good measure
    floodFill(0, 0); floodFill(w - 1, 0); floodFill(0, h - 1); floodFill(w - 1, h - 1)

    // Step 7: Document region = NOT background AND NOT edge
    const isDoc = new Uint8Array(w * h)
    let docPixelCount = 0
    for (let i = 0; i < w * h; i++) {
      isDoc[i] = (!isBackground[i]) ? 1 : 0
      if (isDoc[i]) docPixelCount++
    }

    // If document covers more than 95% of image, it likely fills the frame - use default with small margin
    if (docPixelCount > w * h * 0.95) return null
    // If document is too small (< 10%), detection probably failed
    if (docPixelCount < w * h * 0.10) return null

    // Step 8: Find boundary pixels of the document region
    const boundary: { x: number; y: number }[] = []
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (isDoc[y * w + x]) {
          if (!isDoc[(y - 1) * w + x] || !isDoc[(y + 1) * w + x] || !isDoc[y * w + x - 1] || !isDoc[y * w + x + 1]) {
            boundary.push({ x, y })
          }
        }
      }
    }

    if (boundary.length < 20) return null

    // Step 9: Find 4 corners by scoring boundary points
    // Use directional scoring: each corner is the point that maximizes a score
    // based on distance from center in that corner's direction
    const centerX = boundary.reduce((s, p) => s + p.x, 0) / boundary.length
    const centerY = boundary.reduce((s, p) => s + p.y, 0) / boundary.length

    let bestTL = { x: 0, y: 0, score: -Infinity }
    let bestTR = { x: 0, y: 0, score: -Infinity }
    let bestBL = { x: 0, y: 0, score: -Infinity }
    let bestBR = { x: 0, y: 0, score: -Infinity }

    for (const p of boundary) {
      const dx = p.x - centerX, dy = p.y - centerY
      // TL: most top-left = maximize (-dx - dy)
      const sTL = -dx - dy
      if (sTL > bestTL.score) bestTL = { x: p.x, y: p.y, score: sTL }
      // TR: most top-right = maximize (dx - dy)
      const sTR = dx - dy
      if (sTR > bestTR.score) bestTR = { x: p.x, y: p.y, score: sTR }
      // BL: most bottom-left = maximize (-dx + dy)
      const sBL = -dx + dy
      if (sBL > bestBL.score) bestBL = { x: p.x, y: p.y, score: sBL }
      // BR: most bottom-right = maximize (dx + dy)
      const sBR = dx + dy
      if (sBR > bestBR.score) bestBR = { x: p.x, y: p.y, score: sBR }
    }

    // Step 10: Add small padding (2%) around detected edges for safety
    // This ensures document content is not cut off (CamScanner adds padding too)
    const padPct = 0.02

    const corners = {
      tl: { x: Math.max(0, bestTL.x / w - padPct), y: Math.max(0, bestTL.y / h - padPct) },
      tr: { x: Math.min(1, bestTR.x / w + padPct), y: Math.max(0, bestTR.y / h - padPct) },
      br: { x: Math.min(1, bestBR.x / w + padPct), y: Math.min(1, bestBR.y / h + padPct) },
      bl: { x: Math.max(0, bestBL.x / w - padPct), y: Math.min(1, bestBL.y / h + padPct) },
    }

    return corners
  }

  // Auto-detect crop corners when entering crop mode
  const handleAutoDetectCrop = async () => {
    setDetectingEdges(true)
    try {
      const doc = scannedDocs.find(d => d.id === editingDoc)
      if (!doc) {
        setCropCorners({ tl: { x: 0.05, y: 0.05 }, tr: { x: 0.95, y: 0.05 }, br: { x: 0.95, y: 0.95 }, bl: { x: 0.05, y: 0.95 } })
        return
      }

      // Small delay to let UI show "Detecting..." indicator
      await new Promise(r => setTimeout(r, 50))

      // Use the pre-loaded image if available, otherwise load fresh
      const detectWithImage = (img: HTMLImageElement) => {
        const detected = autoDetectDocumentEdges(img)
        if (detected) {
          setCropCorners(detected)
        } else {
          // Fallback to default corners with slightly more margin
          setCropCorners({ tl: { x: 0.03, y: 0.03 }, tr: { x: 0.97, y: 0.03 }, br: { x: 0.97, y: 0.97 }, bl: { x: 0.03, y: 0.97 } })
        }
      }

      if (magnifierImgRef.current && magnifierImgRef.current.complete && magnifierImgRef.current.naturalWidth > 0) {
        detectWithImage(magnifierImgRef.current)
      } else {
        const img = new Image()
        await new Promise<void>((resolve) => {
          img.onload = () => { detectWithImage(img); resolve() }
          img.onerror = () => {
            setCropCorners({ tl: { x: 0.05, y: 0.05 }, tr: { x: 0.95, y: 0.05 }, br: { x: 0.95, y: 0.95 }, bl: { x: 0.05, y: 0.95 } })
            resolve()
          }
          img.src = doc.filter === 'original' ? doc.data : getFilteredData(doc)
        })
      }
    } finally {
      setDetectingEdges(false)
    }
  }

  // ============ CROP DRAG - Full-screen overlay pattern ============
  // The ONLY reliable mobile drag pattern: when drag starts, show a full-screen
  // invisible overlay that captures ALL pointer events. This prevents the browser
  // from scrolling, zooming, or losing the touch. All move/up events go to the overlay.
  // Used by react-image-crop, Cropper.js, CamScanner web, etc.

  const startCropDrag = (e: React.PointerEvent, handleId: string) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = handleId
    setDraggingHandle(handleId)
    setMagnifier(prev => ({ ...prev, show: true }))
  }

  const handleOverlayMove = (e: React.PointerEvent) => {
    const handle = dragRef.current
    if (!handle) return
    e.preventDefault()

    if (!imageRef.current) return
    const imgRect = imageRef.current.getBoundingClientRect()
    if (!imgRect.width || !imgRect.height) return

    const px = Math.max(0, Math.min(1, (e.clientX - imgRect.left) / imgRect.width))
    const py = Math.max(0, Math.min(1, (e.clientY - imgRect.top) / imgRect.height))

    setMagnifier({ x: px, y: py, show: true })

    setCropCorners(prev => {
      if (!prev) return prev
      const u = { ...prev, tl: { ...prev.tl }, tr: { ...prev.tr }, br: { ...prev.br }, bl: { ...prev.bl } }
      switch (handle) {
        case 'tl': u.tl = { x: px, y: py }; break
        case 'tr': u.tr = { x: px, y: py }; break
        case 'br': u.br = { x: px, y: py }; break
        case 'bl': u.bl = { x: px, y: py }; break
        case 'top': u.tl = { ...u.tl, y: py }; u.tr = { ...u.tr, y: py }; break
        case 'bottom': u.bl = { ...u.bl, y: py }; u.br = { ...u.br, y: py }; break
        case 'left': u.tl = { ...u.tl, x: px }; u.bl = { ...u.bl, x: px }; break
        case 'right': u.tr = { ...u.tr, x: px }; u.br = { ...u.br, x: px }; break
      }
      return u
    })
  }

  const handleOverlayUp = () => {
    if (!dragRef.current) return
    dragRef.current = null
    setDraggingHandle(null)
    setMagnifier(prev => ({ ...prev, show: false }))
  }

  // Load vault documents on mount
  const loadVaultDocs = useCallback(async () => {
    try {
      const d = await apiFetch<any>('/documents')
      setDocuments(d.documents)
      setVaultLoaded(true)
    } catch { /* */ }
  }, [setDocuments])

  useEffect(() => { loadVaultDocs() }, [loadVaultDocs])

  // Get vault scanned/collage docs
  const vaultScanDocs: ScanDoc[] = (documents as Document[])
    .filter(doc => doc.category === 'scanned' || doc.category === 'collage')
    .filter(doc => doc.type?.includes('image') && doc.data)
    .map(doc => ({
      id: `vault_${doc.id}`,
      data: doc.data,
      filter: 'original' as ScanFilter,
      savedToVault: true,
      vaultId: doc.id,
      name: doc.name,
      category: doc.category
    }))

  const allDocs = [...scannedDocs, ...vaultScanDocs]
  const unsavedDocs = scannedDocs.filter(d => !d.savedToVault)
  const savedCount = scannedDocs.filter(d => d.savedToVault).length + vaultScanDocs.length

  const generateId = () => `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  const startScan = async () => {
    try {
      setScanning(true)
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      toast({ title: t.error, description: language === 'bn' ? 'ক্যামেরা অ্যাক্সেস করা যায়নি। অনুগ্রহ করে পারমিশন দিন বা ছবি আপলোড করুন।' : 'Could not access camera. Please grant permission or upload an image instead.', variant: 'destructive' })
      setScanning(false)
    }
  }

  const capture = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const newDoc: ScanDoc = { id: generateId(), data: dataUrl, filter: 'original', savedToVault: false }
    setScannedDocs(prev => [...prev, newDoc])
    toast({ title: language === 'bn' ? 'পেজ ক্যাপচার হয়েছে!' : 'Page captured!' })
    const stream = videoRef.current.srcObject as MediaStream
    stream?.getTracks().forEach(t => t.stop())
    setScanning(false)
    if (autoSave) saveSingleToVault(newDoc)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        const newDoc: ScanDoc = { id: generateId(), data: reader.result as string, filter: 'original', savedToVault: false }
        setScannedDocs(prev => [...prev, newDoc])
        toast({ title: language === 'bn' ? 'ছবি যোগ হয়েছে!' : 'Image added!' })
        if (autoSave) saveSingleToVault(newDoc)
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const applyFilter = (docId: string, filter: ScanFilter) => {
    setScannedDocs(prev => prev.map(d => d.id === docId ? { ...d, filter, savedToVault: false } : d))
  }

  const getFilteredData = (doc: { data: string; filter: string }): string => {
    if (doc.filter === 'original') return doc.data
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return doc.data
    const img = new Image()
    img.src = doc.data
    canvas.width = img.naturalWidth || 800
    canvas.height = img.naturalHeight || 600
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    if (doc.filter === 'bw') {
      for (let i = 0; i < data.length; i += 4) {
        const avg = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
        const val = avg > 128 ? 255 : 0
        data[i] = val; data[i + 1] = val; data[i + 2] = val
      }
    } else if (doc.filter === 'grayscale') {
      for (let i = 0; i < data.length; i += 4) {
        const avg = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
        data[i] = avg; data[i + 1] = avg; data[i + 2] = avg
      }
    } else if (doc.filter === 'photo') {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.15)
        data[i + 1] = Math.min(255, data[i + 1] * 1.15)
        data[i + 2] = Math.min(255, data[i + 2] * 1.15)
      }
    } else if (doc.filter === 'sepia') {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2]
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
      }
    }
    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.85)
  }

  const removeDoc = (docId: string) => {
    setScannedDocs(prev => prev.filter(d => d.id !== docId))
    if (editingDoc === docId) setEditingDoc(null)
  }

  const saveSingleToVault = async (doc: ScanDoc) => {
    try {
      const filteredData = getFilteredData(doc)
      const filterLabel = doc.filter !== 'original' ? `_${doc.filter === 'bw' ? 'B&W' : doc.filter === 'grayscale' ? 'Gray' : doc.filter === 'sepia' ? 'Sepia' : 'Enhanced'}` : ''
      await apiFetch('/documents', {
        method: 'POST',
        body: JSON.stringify({
          name: `Scan_${new Date().toISOString().replace(/[:.]/g, '-')}${filterLabel}`,
          type: 'image/jpeg',
          data: filteredData,
          category: 'scanned'
        })
      })
      // Mark as saved in local state
      setScannedDocs(prev => prev.map(d => d.id === doc.id ? { ...d, savedToVault: true } : d))
      loadVaultDocs()
      toast({ title: language === 'bn' ? 'ডকভল্টে সেভ হয়েছে!' : 'Saved to DocVault!', description: language === 'bn' ? 'ডকুমেন্ট সফলভাবে সেভ হয়েছে' : 'Document saved successfully' })
    } catch {
      toast({ title: t.error, description: language === 'bn' ? 'ডকুমেন্ট সেভ করতে ব্যর্থ' : 'Failed to save document', variant: 'destructive' })
    }
  }

  const saveAllToVault = async () => {
    const unsaved = scannedDocs.filter(d => !d.savedToVault)
    if (unsaved.length === 0) {
      toast({ title: language === 'bn' ? 'সব ডকুমেন্ট ইতিমধ্যে সেভ করা আছে' : 'All documents are already saved' })
      return
    }
    for (const doc of unsaved) {
      await saveSingleToVault(doc)
    }
    toast({ title: language === 'bn' ? `${unsaved.length}টি ডকুমেন্ট ডকভল্টে সেভ হয়েছে!` : `${unsaved.length} documents saved to DocVault!` })
  }

  // Pre-load image for magnifier/crop when editing doc changes
  useEffect(() => {
    if (!editingDoc) return
    const doc = scannedDocs.find(d => d.id === editingDoc)
    if (!doc) return
    const img = new Image()
    img.onload = () => {
      magnifierImgRef.current = img
      setMagnifierImgReady(true)
    }
    img.src = doc.filter === 'original' ? doc.data : getFilteredData(doc)
    return () => { magnifierImgRef.current = null; setMagnifierImgReady(false) }
  }, [editingDoc, scannedDocs])

  // (Crop drag handlers are defined above via getCropHandleHandlers)

  const applyCrop = () => {
    const doc = scannedDocs.find(d => d.id === editingDoc)
    if (!doc || !cropCorners) return
    const currentCorners = cropCorners
    const doCrop = (img: HTMLImageElement) => {
      let nw = img.naturalWidth
      let nh = img.naturalHeight
      if (!nw || !nh) return

      // For perspective transform, limit max dimension for performance
      // (pixel-by-pixel processing is slow on very large images)
      const MAX_DIM = 3000
      let scale = 1
      if (nw > MAX_DIM || nh > MAX_DIM) {
        scale = Math.min(MAX_DIM / nw, MAX_DIM / nh)
        nw = Math.round(nw * scale)
        nh = Math.round(nh * scale)
      }

      // Source points: the 4 corners the user selected on the original image (in pixels)
      const srcPts = [
        { x: currentCorners.tl.x * nw, y: currentCorners.tl.y * nh }, // top-left
        { x: currentCorners.tr.x * nw, y: currentCorners.tr.y * nh }, // top-right
        { x: currentCorners.br.x * nw, y: currentCorners.br.y * nh }, // bottom-right
        { x: currentCorners.bl.x * nw, y: currentCorners.bl.y * nh }, // bottom-left
      ]

      // Destination: a perfect rectangle (CamScanner-style perspective correction!)
      // Calculate output dimensions from the selected edges
      const topWidth = Math.sqrt(Math.pow(srcPts[1].x - srcPts[0].x, 2) + Math.pow(srcPts[1].y - srcPts[0].y, 2))
      const bottomWidth = Math.sqrt(Math.pow(srcPts[2].x - srcPts[3].x, 2) + Math.pow(srcPts[2].y - srcPts[3].y, 2))
      const leftHeight = Math.sqrt(Math.pow(srcPts[3].x - srcPts[0].x, 2) + Math.pow(srcPts[3].y - srcPts[0].y, 2))
      const rightHeight = Math.sqrt(Math.pow(srcPts[2].x - srcPts[1].x, 2) + Math.pow(srcPts[2].y - srcPts[1].y, 2))
      const outW = Math.round(Math.max(topWidth, bottomWidth))
      const outH = Math.round(Math.max(leftHeight, rightHeight))

      if (outW < 20 || outH < 20) { toast({ title: language === 'bn' ? 'ক্রপ এরিয়া ছোট হয়েছে' : 'Crop area too small', variant: 'destructive' }); return }

      // Destination points: perfect rectangle
      const dstPts = [
        { x: 0, y: 0 },         // top-left
        { x: outW, y: 0 },       // top-right
        { x: outW, y: outH },    // bottom-right
        { x: 0, y: outH },       // bottom-left
      ]

      // Compute perspective transform matrix using direct computation
      // We solve for the 3x3 homography matrix H such that: dst = H * src
      // Using the 4 point correspondences (8 equations, 8 unknowns)
      const perspectiveTransform = () => {
        // Build the system of equations: A * h = b
        // For each point correspondence (src -> dst), we get 2 equations
        const A: number[][] = []
        const b: number[] = []

        for (let i = 0; i < 4; i++) {
          const sx = srcPts[i].x, sy = srcPts[i].y
          const dx = dstPts[i].x, dy = dstPts[i].y
          A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy])
          b.push(dx)
          A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy])
          b.push(dy)
        }

        // Solve using Gaussian elimination
        const n = 8
        const aug = A.map((row, i) => [...row, b[i]])

        for (let col = 0; col < n; col++) {
          // Find pivot
          let maxRow = col
          for (let row = col + 1; row < n; row++) {
            if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row
          }
          ;[aug[col], aug[maxRow]] = [aug[maxRow], aug[col]]

          const pivot = aug[col][col]
          if (Math.abs(pivot) < 1e-10) return null

          for (let j = col; j <= n; j++) aug[col][j] /= pivot
          for (let row = 0; row < n; row++) {
            if (row === col) continue
            const factor = aug[row][col]
            for (let j = col; j <= n; j++) aug[row][j] -= factor * aug[col][j]
          }
        }

        const h = aug.map(row => row[n])
        // h = [a,b,c,d,e,f,g,h] => H = [[a,b,c],[d,e,f],[g,h,1]]
        return h
      }

      const h = perspectiveTransform()
      if (!h) {
        // Fallback: simple rectangular crop
        const minX = Math.min(...srcPts.map(p => p.x))
        const minY = Math.min(...srcPts.map(p => p.y))
        const maxX = Math.max(...srcPts.map(p => p.x))
        const maxY = Math.max(...srcPts.map(p => p.y))
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width = Math.round(maxX - minX)
        canvas.height = Math.round(maxY - minY)
        ctx.drawImage(img, minX, minY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)
        const croppedData = canvas.toDataURL('image/jpeg', 0.85)
        setScannedDocs(prev => prev.map(d => d.id === editingDoc ? { ...d, data: croppedData, filter: 'original' as ScanFilter, savedToVault: false } : d))
        setCropMode(false)
        setCropCorners(null)
        dragRef.current = null
        setDraggingHandle(null)
        toast({ title: language === 'bn' ? 'ক্রপ হয়েছে!' : 'Cropped!' })
        return
      }

      // Apply perspective transform pixel by pixel (inverse mapping)
      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Draw original image to a temp canvas (scaled if needed) to get pixel data
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = nw
      tempCanvas.height = nh
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return
      if (scale < 1) {
        tempCtx.drawImage(img, 0, 0, nw, nh)
      } else {
        tempCtx.drawImage(img, 0, 0)
      }
      const srcData = tempCtx.getImageData(0, 0, nw, nh)
      const srcPixels = srcData.data

      const dstData = ctx.createImageData(outW, outH)
      const dstPixels = dstData.data

      // Initialize all destination pixels to white (opaque) instead of transparent black
      // This prevents black/transparent borders when edge pixels are slightly outside bounds
      for (let i = 0; i < dstPixels.length; i += 4) {
        dstPixels[i] = 255     // R
        dstPixels[i + 1] = 255 // G
        dstPixels[i + 2] = 255 // B
        dstPixels[i + 3] = 255 // A
      }

      // Inverse mapping: for each destination pixel, find the source pixel
      // dst -> src using inverse homography
      // H = [[h[0],h[1],h[2]],[h[3],h[4],h[5]],[h[6],h[7],1]]
      // For inverse, we need H^-1, but simpler: compute H for src->dst, then invert
      // Actually, we already computed src->dst. For inverse mapping we need dst->src.
      // Let's compute the inverse by building the reverse system

      // Build inverse: dstPts -> srcPts
      const A2: number[][] = []
      const b2: number[] = []
      for (let i = 0; i < 4; i++) {
        const dx = dstPts[i].x, dy = dstPts[i].y
        const sx = srcPts[i].x, sy = srcPts[i].y
        A2.push([dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy])
        b2.push(sx)
        A2.push([0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy])
        b2.push(sy)
      }

      const aug2 = A2.map((row, i) => [...row, b2[i]])
      for (let col = 0; col < 8; col++) {
        let maxRow = col
        for (let row = col + 1; row < 8; row++) {
          if (Math.abs(aug2[row][col]) > Math.abs(aug2[maxRow][col])) maxRow = row
        }
        ;[aug2[col], aug2[maxRow]] = [aug2[maxRow], aug2[col]]
        const pivot = aug2[col][col]
        if (Math.abs(pivot) < 1e-10) return
        for (let j = col; j <= 8; j++) aug2[col][j] /= pivot
        for (let row = 0; row < 8; row++) {
          if (row === col) continue
          const factor = aug2[row][col]
          for (let j = col; j <= 8; j++) aug2[row][j] -= factor * aug2[col][j]
        }
      }
      const ih = aug2.map(row => row[8])

      // For each destination pixel, find source pixel and copy
      // FIXED: Use clamped boundary instead of strict check to prevent document cutting
      // CamScanner-style: edge pixels are preserved by clamping source coordinates
      for (let dy = 0; dy < outH; dy++) {
        for (let dx = 0; dx < outW; dx++) {
          const w = ih[6] * dx + ih[7] * dy + 1
          const sx = (ih[0] * dx + ih[1] * dy + ih[2]) / w
          const sy = (ih[3] * dx + ih[4] * dy + ih[5]) / w

          // Skip pixels that map far outside the source image
          if (sx < -2 || sx > nw + 1 || sy < -2 || sy > nh + 1) continue

          // Bilinear interpolation with CLAMPED boundaries
          // Instead of strict check (sx0>=0 && sx1<nw && sy0>=0 && sy1<nh),
          // we clamp coordinates to valid range - this prevents edge pixels from being cut
          const sx0 = Math.floor(sx), sy0 = Math.floor(sy)
          const sx1 = sx0 + 1, sy1 = sy0 + 1
          const fx = sx - sx0, fy = sy - sy0

          // Clamp source coordinates to image bounds
          const csx0 = Math.max(0, Math.min(nw - 1, sx0))
          const csy0 = Math.max(0, Math.min(nh - 1, sy0))
          const csx1 = Math.max(0, Math.min(nw - 1, sx1))
          const csy1 = Math.max(0, Math.min(nh - 1, sy1))

          const idx00 = (csy0 * nw + csx0) * 4
          const idx01 = (csy0 * nw + csx1) * 4
          const idx10 = (csy1 * nw + csx0) * 4
          const idx11 = (csy1 * nw + csx1) * 4

          const dstIdx = (dy * outW + dx) * 4
          for (let c = 0; c < 4; c++) {
            dstPixels[dstIdx + c] = Math.round(
              srcPixels[idx00 + c] * (1 - fx) * (1 - fy) +
              srcPixels[idx01 + c] * fx * (1 - fy) +
              srcPixels[idx10 + c] * (1 - fx) * fy +
              srcPixels[idx11 + c] * fx * fy
            )
          }
        }
      }

      ctx.putImageData(dstData, 0, 0)
      const croppedData = canvas.toDataURL('image/jpeg', 0.85)
      setScannedDocs(prev => prev.map(d => d.id === editingDoc ? { ...d, data: croppedData, filter: 'original' as ScanFilter, savedToVault: false } : d))
      setCropMode(false)
      setCropCorners(null)
      dragRef.current = null
      setDraggingHandle(null)
      toast({ title: language === 'bn' ? 'ক্রপ ও সোজা হয়েছে!' : 'Cropped & Straightened!' })
    }
    // Use pre-loaded image if ready, otherwise load fresh with onload
    if (magnifierImgRef.current && magnifierImgRef.current.complete && magnifierImgRef.current.naturalWidth > 0) {
      doCrop(magnifierImgRef.current)
    } else {
      const img = new Image()
      img.onload = () => doCrop(img)
      img.src = doc.filter === 'original' ? doc.data : getFilteredData(doc)
    }
  }

  const resetCrop = async () => {
    // Re-run auto detection on reset (CamScanner-style: reset re-detects edges)
    await handleAutoDetectCrop()
  }

  const rotateImage = (degrees: number) => {
    const doc = scannedDocs.find(d => d.id === editingDoc)
    if (!doc) return
    const currentEditingDoc = editingDoc
    const doRotate = (img: HTMLImageElement) => {
      const nw = img.naturalWidth
      const nh = img.naturalHeight
      if (!nw || !nh) return
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      if (degrees === 90 || degrees === 270) {
        canvas.width = nh; canvas.height = nw
      } else {
        canvas.width = nw; canvas.height = nh
      }
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((degrees * Math.PI) / 180)
      ctx.drawImage(img, -nw / 2, -nh / 2)
      const rotatedData = canvas.toDataURL('image/jpeg', 0.85)
      setScannedDocs(prev => prev.map(d => d.id === currentEditingDoc ? { ...d, data: rotatedData, filter: 'original' as ScanFilter, savedToVault: false } : d))
      setRotation(prev => (prev + degrees) % 360)
      setCropCorners({ tl: { x: 0.05, y: 0.05 }, tr: { x: 0.95, y: 0.05 }, br: { x: 0.95, y: 0.95 }, bl: { x: 0.05, y: 0.95 } })
    }
    if (magnifierImgRef.current && magnifierImgRef.current.complete && magnifierImgRef.current.naturalWidth > 0) {
      doRotate(magnifierImgRef.current)
    } else {
      const img = new Image()
      img.onload = () => doRotate(img)
      img.src = doc.data
    }
  }

  // Generate collage
  const generateCollage = (): string | null => {
    const selectedDocs = allDocs.filter(d => selectedForCollage.has(d.id))
    if (selectedDocs.length === 0) return null
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const gap = 8
    const baseSize = 800

    const drawImageFitted = (imgUrl: string, x: number, y: number, cellW: number, cellH: number) => {
      const img = new Image()
      img.src = getFilteredData({ data: imgUrl, filter: 'original' })
      const scale = Math.min(cellW / (img.width || 1), cellH / (img.height || 1))
      const w = (img.width || cellW) * scale
      const h = (img.height || cellH) * scale
      ctx.drawImage(img, x + (cellW - w) / 2, y + (cellH - h) / 2, w, h)
    }

    if (collageLayout === '2x1') {
      canvas.width = baseSize; canvas.height = baseSize / 2
      const cellW = (baseSize - gap) / 2; const cellH = canvas.height
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      selectedDocs.slice(0, 2).forEach((doc, i) => {
        drawImageFitted(getFilteredData(doc), i * (cellW + gap), 0, cellW, cellH)
      })
    } else if (collageLayout === '1x2') {
      canvas.width = baseSize / 2; canvas.height = baseSize
      const cellW = canvas.width; const cellH = (baseSize - gap) / 2
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      selectedDocs.slice(0, 2).forEach((doc, i) => {
        drawImageFitted(getFilteredData(doc), 0, i * (cellH + gap), cellW, cellH)
      })
    } else {
      canvas.width = baseSize; canvas.height = baseSize
      const cellW = (baseSize - gap) / 2; const cellH = (baseSize - gap) / 2
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      selectedDocs.slice(0, 4).forEach((doc, i) => {
        const col = i % 2; const row = Math.floor(i / 2)
        const x = col * (cellW + gap); const y = row * (cellH + gap)
        drawImageFitted(getFilteredData(doc), x, y, cellW, cellH)
      })
    }
    return canvas.toDataURL('image/jpeg', 0.9)
  }

  const saveCollageToVault = async () => {
    const collageData = generateCollage()
    if (!collageData) return
    try {
      await apiFetch('/documents', {
        method: 'POST',
        body: JSON.stringify({ name: `Collage_${Date.now()}`, type: 'image/jpeg', data: collageData, category: 'collage' })
      })
      toast({ title: language === 'bn' ? 'কলাজ ডকভল্টে সেভ হয়েছে!' : 'Collage saved to DocVault!' })
      setCollageMode(false)
      setSelectedForCollage(new Set())
      loadVaultDocs()
    } catch {
      toast({ title: language === 'bn' ? 'কলাজ সেভ করতে ত্রুটি' : 'Error saving collage', variant: 'destructive' })
    }
  }

  const toggleCollageSelect = (docId: string) => {
    setSelectedForCollage(prev => {
      const next = new Set(prev)
      if (next.has(docId)) next.delete(docId)
      else if (next.size < 4) next.add(docId)
      else { toast({ title: language === 'bn' ? 'কলাজে সর্বোচ্চ ৪টি ছবি' : 'Max 4 images for collage', variant: 'destructive' }); return prev }
      return next
    })
  }

  const clearSavedDocs = () => {
    setScannedDocs(prev => prev.filter(d => !d.savedToVault))
  }

  const editingDocData = scannedDocs.find(d => d.id === editingDoc)

  const filterLabels: Record<ScanFilter, { label: string; labelBn: string; color: string }> = {
    original: { label: 'Original', labelBn: 'মূল', color: 'bg-emerald-600 hover:bg-emerald-700' },
    bw: { label: 'B&W', labelBn: 'ব্ল্যাক ও হোয়াইট', color: 'bg-gray-800 hover:bg-gray-900 text-white' },
    grayscale: { label: 'Gray', labelBn: 'গ্রেস্কেল', color: 'bg-gray-500 hover:bg-gray-600 text-white' },
    photo: { label: 'Photo', labelBn: 'ফটো', color: 'bg-amber-500 hover:bg-amber-600 text-white' },
    sepia: { label: 'Sepia', labelBn: 'সেপিয়া', color: 'bg-orange-700 hover:bg-orange-800 text-white' },
  }

  // ============ EDITOR VIEW ============
  if (editingDoc && editingDocData) {
    const filteredSrc = editingDocData.filter === 'original' ? editingDocData.data : getFilteredData(editingDocData)
    const defaultCorners = { tl: { x: 0.05, y: 0.05 }, tr: { x: 0.95, y: 0.05 }, br: { x: 0.95, y: 0.95 }, bl: { x: 0.05, y: 0.95 } }
    const cc = cropCorners || defaultCorners

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        {/* Green Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-700 shrink-0">
          <button onClick={() => { setEditingDoc(null); setCropMode(false); setCropCorners(null); setRotation(0); dragRef.current = null; setDraggingHandle(null) }} className="text-white flex items-center gap-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-white font-semibold text-base">{cropMode ? (detectingEdges ? (language === 'bn' ? 'সনাক্ত হচ্ছে...' : 'Detecting...') : (language === 'bn' ? 'বর্ডার সমন্বয়' : 'Border Adjustment')) : (language === 'bn' ? 'স্ক্যান সম্পাদনা' : 'Edit Scan')}</h2>
          {cropMode ? (
            <button onClick={applyCrop} className="text-white">
              <CheckCircle className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        {/* Main Image Area */}
        <div className={`flex-1 relative flex items-center justify-center overflow-hidden bg-black p-2 ${cropMode ? 'touch-none' : ''}`}>
          {/* Image with relative positioning for overlay */}
          <div className="relative inline-block max-w-full max-h-full" style={{ lineHeight: 0 }}>
            <img
              ref={imageRef}
              src={filteredSrc}
              alt="Scan"
              className={`max-w-full max-h-[70dvh] select-none ${cropMode ? 'touch-none pointer-events-none' : ''}`}
              style={{ objectFit: 'contain' }}
              draggable={false}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement
                setImageNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
              }}
            />

            {/* Crop Overlay - positioned over the actual image */}
            {cropMode && (
              <>
                {/* Auto-detection loading indicator */}
                {detectingEdges && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 pointer-events-none">
                    <div className="flex flex-col items-center gap-2 bg-black/80 px-6 py-4 rounded-2xl">
                      <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-emerald-300 text-sm font-medium">{language === 'bn' ? 'ডকুমেন্ট সনাক্ত হচ্ছে...' : 'Detecting document...'}</span>
                    </div>
                  </div>
                )}
                {/* Top dim */}
                <div className="absolute pointer-events-none bg-black/60" style={{
                  top: 0, left: 0, right: 0,
                  height: `${cc.tl.y * 100}%`
                }} />
                {/* Bottom dim */}
                <div className="absolute pointer-events-none bg-black/60" style={{
                  bottom: 0, left: 0, right: 0,
                  height: `${(1 - cc.br.y) * 100}%`
                }} />
                {/* Left dim */}
                <div className="absolute pointer-events-none bg-black/60" style={{
                  top: `${cc.tl.y * 100}%`, bottom: `${(1 - cc.bl.y) * 100}%`, left: 0,
                  width: `${cc.tl.x * 100}%`
                }} />
                {/* Right dim */}
                <div className="absolute pointer-events-none bg-black/60" style={{
                  top: `${cc.tr.y * 100}%`, bottom: `${(1 - cc.br.y) * 100}%`, right: 0,
                  width: `${(1 - cc.tr.x) * 100}%`
                }} />

                {/* Green border lines using SVG */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                  <line x1={`${cc.tl.x * 100}%`} y1={`${cc.tl.y * 100}%`} x2={`${cc.tr.x * 100}%`} y2={`${cc.tr.y * 100}%`} stroke="#22c55e" strokeWidth="2.5" />
                  <line x1={`${cc.tr.x * 100}%`} y1={`${cc.tr.y * 100}%`} x2={`${cc.br.x * 100}%`} y2={`${cc.br.y * 100}%`} stroke="#22c55e" strokeWidth="2.5" />
                  <line x1={`${cc.br.x * 100}%`} y1={`${cc.br.y * 100}%`} x2={`${cc.bl.x * 100}%`} y2={`${cc.bl.y * 100}%`} stroke="#22c55e" strokeWidth="2.5" />
                  <line x1={`${cc.bl.x * 100}%`} y1={`${cc.bl.y * 100}%`} x2={`${cc.tl.x * 100}%`} y2={`${cc.tl.y * 100}%`} stroke="#22c55e" strokeWidth="2.5" />
                  {/* 3x3 Grid lines */}
                  <line x1={`${(cc.tl.x * 2 + cc.tr.x) / 3 * 100}%`} y1={`${cc.tl.y * 100}%`} x2={`${(cc.bl.x * 2 + cc.br.x) / 3 * 100}%`} y2={`${cc.bl.y * 100}%`} stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
                  <line x1={`${(cc.tl.x + cc.tr.x * 2) / 3 * 100}%`} y1={`${cc.tr.y * 100}%`} x2={`${(cc.bl.x + cc.br.x * 2) / 3 * 100}%`} y2={`${cc.br.y * 100}%`} stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
                  <line x1={`${cc.tl.x * 100}%`} y1={`${(cc.tl.y * 2 + cc.bl.y) / 3 * 100}%`} x2={`${cc.tr.x * 100}%`} y2={`${(cc.tr.y * 2 + cc.br.y) / 3 * 100}%`} stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
                  <line x1={`${cc.tl.x * 100}%`} y1={`${(cc.tl.y + cc.bl.y * 2) / 3 * 100}%`} x2={`${cc.tr.x * 100}%`} y2={`${(cc.tr.y + cc.br.y * 2) / 3 * 100}%`} stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
                </svg>

                {/* Corner Handles - CamScanner style L-shaped corners */}
                {(['tl', 'tr', 'br', 'bl'] as const).map(corner => {
                  const pos = cc[corner]
                  const isActive = draggingHandle === corner
                  return (
                    <div
                      key={corner}
                      onPointerDown={(e) => startCropDrag(e, corner)}
                      className="absolute z-20"
                      style={{
                        left: `${pos.x * 100}%`,
                        top: `${pos.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        width: 52, height: 52,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        touchAction: 'none',
                        cursor: isActive ? 'grabbing' : 'grab',
                      }}
                    >
                      <div className="relative" style={{ width: isActive ? 28 : 24, height: isActive ? 28 : 24 }}>
                        {corner === 'tl' && <>
                          <div className="absolute top-0 left-0 rounded-sm" style={{ width: isActive ? 24 : 20, height: 3, backgroundColor: isActive ? '#4ade80' : 'white' }} />
                          <div className="absolute top-0 left-0 rounded-sm" style={{ width: 3, height: isActive ? 24 : 20, backgroundColor: isActive ? '#4ade80' : 'white' }} />
                        </>}
                        {corner === 'tr' && <>
                          <div className="absolute top-0 right-0 rounded-sm" style={{ width: isActive ? 24 : 20, height: 3, backgroundColor: isActive ? '#4ade80' : 'white' }} />
                          <div className="absolute top-0 right-0 rounded-sm" style={{ width: 3, height: isActive ? 24 : 20, backgroundColor: isActive ? '#4ade80' : 'white' }} />
                        </>}
                        {corner === 'bl' && <>
                          <div className="absolute bottom-0 left-0 rounded-sm" style={{ width: isActive ? 24 : 20, height: 3, backgroundColor: isActive ? '#4ade80' : 'white' }} />
                          <div className="absolute bottom-0 left-0 rounded-sm" style={{ width: 3, height: isActive ? 24 : 20, backgroundColor: isActive ? '#4ade80' : 'white' }} />
                        </>}
                        {corner === 'br' && <>
                          <div className="absolute bottom-0 right-0 rounded-sm" style={{ width: isActive ? 24 : 20, height: 3, backgroundColor: isActive ? '#4ade80' : 'white' }} />
                          <div className="absolute bottom-0 right-0 rounded-sm" style={{ width: 3, height: isActive ? 24 : 20, backgroundColor: isActive ? '#4ade80' : 'white' }} />
                        </>}
                      </div>
                    </div>
                  )
                })}

                {/* Edge Handles */}
                {[
                  { id: 'top', pos: { x: (cc.tl.x + cc.tr.x) / 2, y: (cc.tl.y + cc.tr.y) / 2 } },
                  { id: 'bottom', pos: { x: (cc.bl.x + cc.br.x) / 2, y: (cc.bl.y + cc.br.y) / 2 } },
                  { id: 'left', pos: { x: (cc.tl.x + cc.bl.x) / 2, y: (cc.tl.y + cc.bl.y) / 2 } },
                  { id: 'right', pos: { x: (cc.tr.x + cc.br.x) / 2, y: (cc.tr.y + cc.br.y) / 2 } },
                ].map(({ id, pos }) => {
                  const isActive = draggingHandle === id
                  return (
                    <div
                      key={id}
                      onPointerDown={(e) => startCropDrag(e, id)}
                      className="absolute z-20"
                      style={{
                        left: `${pos.x * 100}%`,
                        top: `${pos.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        width: 48, height: 48,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        touchAction: 'none',
                        cursor: isActive ? 'grabbing' : 'grab',
                      }}
                    >
                      <div className="rounded-sm shadow-lg shadow-black/60" style={{
                        width: (id === 'top' || id === 'bottom') ? (isActive ? 40 : 32) : 4,
                        height: (id === 'left' || id === 'right') ? (isActive ? 40 : 32) : 4,
                        backgroundColor: isActive ? '#4ade80' : '#34d399',
                        border: '2px solid white',
                      }} />
                    </div>
                  )
                })}

                {/* Magnifier / Zoom Lens - shows zoomed view while dragging */}
                {magnifier.show && draggingHandle && magnifierImgReady && magnifierImgRef.current && (
                  <div
                    className="absolute z-30 pointer-events-none"
                    style={{
                      left: `${Math.min(magnifier.x * 100 + 8, 60)}%`,
                      top: `${Math.max(magnifier.y * 100 - 45, 2)}%`,
                    }}
                  >
                    <div className="relative">
                      <div className="w-[100px] h-[100px] rounded-xl border-[3px] border-emerald-400 shadow-2xl shadow-black/80 overflow-hidden bg-black">
                        <canvas
                          width={100}
                          height={100}
                          style={{ width: 100, height: 100, display: 'block' }}
                          ref={(el) => {
                            if (!el || !magnifierImgRef.current) return
                            const mCtx = el.getContext('2d')
                            if (!mCtx) return
                            const img = magnifierImgRef.current!
                            const nw = img.naturalWidth
                            const nh = img.naturalHeight
                            if (!nw || !nh) return
                            const zoomFactor = 3.5
                            const displaySize = 100
                            const srcW = displaySize / zoomFactor
                            const srcH = displaySize / zoomFactor
                            const srcX = Math.max(0, Math.min(nw - srcW, magnifier.x * nw - srcW / 2))
                            const srcY = Math.max(0, Math.min(nh - srcH, magnifier.y * nh - srcH / 2))
                            mCtx.clearRect(0, 0, displaySize, displaySize)
                            mCtx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, displaySize, displaySize)
                            mCtx.strokeStyle = 'rgba(34,197,94,0.7)'
                            mCtx.lineWidth = 1
                            mCtx.beginPath()
                            mCtx.moveTo(displaySize / 2, 0); mCtx.lineTo(displaySize / 2, displaySize)
                            mCtx.moveTo(0, displaySize / 2); mCtx.lineTo(displaySize, displaySize / 2)
                            mCtx.stroke()
                          }}
                        />
                      </div>
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-300 bg-black/80 px-2 py-0.5 rounded-full whitespace-nowrap">
                        3.5x {language === 'bn' ? 'জুম' : 'zoom'}
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== DRAG OVERLAY - The key to reliable mobile drag ===== */}
                {/* When dragging, this invisible overlay covers the entire screen and
                    captures ALL pointer events. This prevents browser scroll/zoom and
                    ensures move/up events are never lost. This is the pattern used by
                    react-image-crop, Cropper.js, and CamScanner web. */}
                {draggingHandle && (
                  <div
                    className="fixed inset-0"
                    style={{ zIndex: 9999, touchAction: 'none', cursor: 'grabbing' }}
                    onPointerMove={handleOverlayMove}
                    onPointerUp={handleOverlayUp}
                    onPointerCancel={handleOverlayUp}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom Toolbar */}
        {cropMode ? (
          <div className="flex items-center justify-around px-4 py-4 bg-emerald-700 shrink-0 safe-bottom">
            <button onClick={resetCrop} className="flex flex-col items-center gap-1 text-white/80 hover:text-white active:scale-95 transition-transform">
              <Grid3X3 className="w-5 h-5" />
              <span className="text-[10px]">{language === 'bn' ? 'অটো ডিটেক্ট' : 'Auto Detect'}</span>
            </button>
            <button onClick={applyCrop} className="flex flex-col items-center gap-1 text-white/80 hover:text-white active:scale-95 transition-transform">
              <FileEdit className="w-5 h-5" />
              <span className="text-[10px]">{language === 'bn' ? 'ক্রপ' : 'Crop'}</span>
            </button>
            <button onClick={() => rotateImage(90)} className="flex flex-col items-center gap-1 text-white/80 hover:text-white active:scale-95 transition-transform">
              <RefreshCw className="w-5 h-5" />
              <span className="text-[10px]">{language === 'bn' ? 'ঘোরান' : 'Rotate'}</span>
            </button>
            <button onClick={() => rotateImage(-90)} className="flex flex-col items-center gap-1 text-white/80 hover:text-white active:scale-95 transition-transform">
              <RefreshCw className="w-5 h-5 transform -scale-x-100" />
              <span className="text-[10px]">{language === 'bn' ? 'উল্টো' : 'Rev'}</span>
            </button>
            <button onClick={applyCrop} className="flex flex-col items-center gap-1 text-white active:scale-95 transition-transform">
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </button>
          </div>
        ) : (
          <div className="bg-gray-900 shrink-0 safe-bottom">
            {/* Filter bar */}
            <div className="px-4 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {(Object.keys(filterLabels) as ScanFilter[]).map(f => (
                  <Button
                    key={f}
                    variant={editingDocData.filter === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyFilter(editingDoc!, f)}
                    className={`shrink-0 text-xs ${editingDocData.filter === f ? filterLabels[f].color : ''}`}
                  >
                    {language === 'bn' ? filterLabels[f].labelBn : filterLabels[f].label}
                  </Button>
                ))}
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2 px-4 pb-4 pt-1">
              <Button
                onClick={() => { setCropMode(true); handleAutoDetectCrop() }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <FileEdit className="w-4 h-4 mr-1" /> {language === 'bn' ? 'ক্রপ' : 'Crop'}
              </Button>
              <Button
                onClick={() => rotateImage(90)}
                variant="outline"
                className="text-white border-gray-600 hover:bg-gray-800"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => saveSingleToVault(editingDocData)}
              >
                <FolderLock className="w-4 h-4 mr-1" /> {editingDocData.savedToVault ? (language === 'bn' ? 'আপডেট' : 'Update') : (language === 'bn' ? 'সেভ' : 'Save')}
              </Button>
              <Button variant="outline" onClick={() => { removeDoc(editingDocData.id); setEditingDoc(null) }} className="text-red-400 border-gray-600 hover:bg-gray-800 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============ COLLAGE VIEW ============
  if (collageMode) {
    const collagePreview = generateCollage()
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 overflow-auto p-4 pb-24 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => { setCollageMode(false); setSelectedForCollage(new Set()) }}>
            <ChevronLeft className="w-5 h-5 mr-1" /> {language === 'bn' ? 'ফিরে যান' : 'Back'}
          </Button>
          <h2 className="font-semibold">{language === 'bn' ? 'কলাজ তৈরি করুন' : 'Create Collage'}</h2>
        </div>

        <p className="text-sm text-muted-foreground">{language === 'bn' ? 'কলাজ তৈরি করতে সর্বোচ্চ ৪টি স্ক্যান নির্বাচন করুন' : 'Select up to 4 scans to combine into a collage'}</p>

        {/* Layout Selection */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">{language === 'bn' ? 'লেআউট' : 'Layout'}</p>
          <div className="flex gap-2">
            {(['2x1', '1x2', '2x2'] as const).map(layout => (
              <Button
                key={layout}
                variant={collageLayout === layout ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCollageLayout(layout)}
                className={collageLayout === layout ? 'bg-emerald-600' : ''}
              >
                {layout}
              </Button>
            ))}
          </div>
        </div>

        {/* Image Selection Grid */}
        <div className="grid grid-cols-3 gap-2">
          {allDocs.map(doc => (
            <button
              key={doc.id}
              onClick={() => toggleCollageSelect(doc.id)}
              className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                selectedForCollage.has(doc.id) ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-transparent opacity-70'
              }`}
            >
              <img src={doc.data} alt="" className="w-full h-28 object-cover" />
              {selectedForCollage.has(doc.id) && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Collage Preview */}
        {collagePreview && selectedForCollage.size > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">{language === 'bn' ? 'প্রিভিউ' : 'Preview'}</p>
            <div className="rounded-xl overflow-hidden border shadow-md">
              <img src={collagePreview} alt="Collage Preview" className="w-full" />
            </div>
          </div>
        )}

        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          onClick={saveCollageToVault}
          disabled={selectedForCollage.size === 0}
        >
          <FolderLock className="w-4 h-4 mr-2" /> {language === 'bn' ? 'কলাজ ভল্টে সেভ করুন' : 'Save Collage to Vault'}
        </Button>
      </div>
    )
  }

  // ============ MAIN SCANNER VIEW ============
  return (
    <div className="p-4 pb-24 space-y-4">
      <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-700 to-teal-700 text-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ScanLine className="w-10 h-10" />
              <div>
                <p className="font-bold text-lg">{language === 'bn' ? 'ডক স্ক্যানার' : 'Doc Scanner'}</p>
                <p className="text-emerald-200 text-sm">{language === 'bn' ? 'স্ক্যান, ক্রপ, ফিল্টার ও কলাজ' : 'Scan, crop, filter & collage'}</p>
              </div>
            </div>
            {/* Auto-save Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-200">{language === 'bn' ? 'অটো সেভ' : 'Auto'}</span>
              <Switch checked={autoSave} onCheckedChange={setAutoSave} className="scale-75" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <p className="text-lg font-bold text-blue-600">{scannedDocs.length}</p>
            <p className="text-[10px] text-muted-foreground">{language === 'bn' ? 'নতুন স্ক্যান' : 'New Scans'}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <p className="text-lg font-bold text-emerald-600">{savedCount}</p>
            <p className="text-[10px] text-muted-foreground">{language === 'bn' ? 'ভল্টে সেভ' : 'In Vault'}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <p className="text-lg font-bold text-orange-600">{unsavedDocs.length}</p>
            <p className="text-[10px] text-muted-foreground">{language === 'bn' ? 'সেভ বাকি' : 'Unsaved'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Scan / Upload Buttons */}
      {scanning ? (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full" autoPlay playsInline />
            <div className="absolute inset-0 border-4 border-white/30 rounded-xl pointer-events-none" />
          </div>
          <div className="flex gap-2">
            <Button onClick={capture} className="flex-1 bg-red-500 hover:bg-red-600">
              <div className="w-4 h-4 rounded-full bg-white mr-2" /> {language === 'bn' ? 'ক্যাপচার' : 'Capture'}
            </Button>
            <Button variant="outline" onClick={() => {
              setScanning(false)
              const stream = videoRef.current?.srcObject as MediaStream
              stream?.getTracks().forEach(t => t.stop())
            }}>{language === 'bn' ? 'বাতিল' : 'Cancel'}</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Button onClick={startScan} className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700">
            <ScanLine className="w-5 h-5 mr-2" /> {language === 'bn' ? 'ক্যামেরা দিয়ে স্ক্যান' : 'Scan with Camera'}
          </Button>
          <label className="w-full h-14 text-lg flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors text-muted-foreground font-medium">
            <Upload className="w-5 h-5" /> {language === 'bn' ? 'ছবি আপলোড' : 'Upload Image'}
            <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )}

      {/* Tabs: New Scans / Vault Docs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'new' | 'vault')} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="new" className="flex-1">
            {language === 'bn' ? 'নতুন স্ক্যান' : 'New Scans'} {scannedDocs.length > 0 && `(${scannedDocs.length})`}
          </TabsTrigger>
          <TabsTrigger value="vault" className="flex-1">
            {language === 'bn' ? 'ভল্ট ডকুমেন্ট' : 'Vault Docs'} {vaultScanDocs.length > 0 && `(${vaultScanDocs.length})`}
          </TabsTrigger>
        </TabsList>

        {/* New Scans Tab */}
        <TabsContent value="new" className="space-y-3 mt-3">
          {scannedDocs.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{language === 'bn' ? 'স্ক্যান করা পেজ' : 'Scanned Pages'} ({scannedDocs.length})</h3>
                <div className="flex gap-2">
                  {allDocs.length >= 2 && (
                    <Button size="sm" variant="outline" onClick={() => setCollageMode(true)}>
                      <FileImage className="w-3.5 h-3.5 mr-1" /> {language === 'bn' ? 'কলাজ' : 'Collage'}
                    </Button>
                  )}
                  {unsavedDocs.length > 0 && (
                    <Button size="sm" onClick={saveAllToVault} className="bg-emerald-600 hover:bg-emerald-700">
                      <FolderLock className="w-3.5 h-3.5 mr-1" /> {language === 'bn' ? 'সব সেভ' : 'Save All'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {scannedDocs.map((doc) => (
                  <div key={doc.id} className="relative rounded-xl overflow-hidden shadow-sm border bg-white">
                    <img src={doc.data} alt={`Scan`} className="w-full h-40 object-cover" />
                    {/* Filter Badge */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-white/90">
                        {language === 'bn' ? filterLabels[doc.filter].labelBn : filterLabels[doc.filter].label}
                      </Badge>
                      {doc.savedToVault && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500 text-white">
                          <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> {language === 'bn' ? 'সেভ' : 'Saved'}
                        </Badge>
                      )}
                    </div>
                    {/* Unsaved indicator */}
                    {!doc.savedToVault && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" title="Unsaved" />
                      </div>
                    )}
                    {/* Actions Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setEditingDoc(doc.id)} className="flex-1 text-white border-white/40 bg-white/10 text-xs h-7">
                          <Pencil className="w-3 h-3 mr-1" /> {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => saveSingleToVault(doc)} className="flex-1 text-white border-white/40 bg-white/10 text-xs h-7">
                          <FolderLock className="w-3 h-3 mr-1" /> {doc.savedToVault ? (language === 'bn' ? 'আপডেট' : 'Update') : (language === 'bn' ? 'সেভ' : 'Save')}
                        </Button>
                        <button onClick={() => removeDoc(doc.id)} className="p-1.5 text-red-300 hover:text-red-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear Saved */}
              {savedCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearSavedDocs} className="text-muted-foreground w-full">
                  {language === 'bn' ? 'সেভ করা ডকুমেন্ট মুছুন (ভল্ট থেকে নয়)' : 'Clear saved docs from view (not from vault)'}
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ScanLine className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="font-medium">{language === 'bn' ? 'এখনও কোনো স্ক্যান নেই' : 'No new scans yet'}</p>
              <p className="text-sm mt-1">{language === 'bn' ? 'ক্যামেরা বা আপলোড দিয়ে স্ক্যান শুরু করুন' : 'Use camera or upload images to start scanning'}</p>
            </div>
          )}
        </TabsContent>

        {/* Vault Docs Tab */}
        <TabsContent value="vault" className="space-y-3 mt-3">
          {vaultScanDocs.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{language === 'bn' ? 'ভল্ট থেকে ডকুমেন্ট' : 'Docs from Vault'} ({vaultScanDocs.length})</h3>
                <Button size="sm" variant="outline" onClick={() => setCollageMode(true)}>
                  <FileImage className="w-3.5 h-3.5 mr-1" /> {language === 'bn' ? 'কলাজ' : 'Collage'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {vaultScanDocs.map((doc) => (
                  <div key={doc.id} className="relative rounded-xl overflow-hidden shadow-sm border bg-white">
                    <img src={doc.data} alt={doc.name || 'Doc'} className="w-full h-40 object-cover" />
                    {/* Vault Badge */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500 text-white">
                        <FolderLock className="w-2.5 h-2.5 mr-0.5" /> {language === 'bn' ? 'ভল্ট' : 'Vault'}
                      </Badge>
                      {doc.category === 'collage' && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-purple-500 text-white">
                          <FileImage className="w-2.5 h-2.5 mr-0.5" /> {language === 'bn' ? 'কলাজ' : 'Collage'}
                        </Badge>
                      )}
                    </div>
                    {/* Doc Name */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-white text-xs truncate mb-1">{doc.name || 'Document'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FolderLock className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="font-medium">{language === 'bn' ? 'ভল্টে কোনো স্ক্যান ডকুমেন্ট নেই' : 'No scanned docs in vault yet'}</p>
              <p className="text-sm mt-1">{language === 'bn' ? 'স্ক্যান করে ভল্টে সেভ করুন' : 'Scan and save documents to vault'}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
})

// ============ DOCVAULT ============
const DocVaultPage = memo(function DocVaultPage() {
  const { documents, setDocuments, setPage, language } = useAppStore(useShallow(state => ({
    documents: state.documents,
    setDocuments: state.setDocuments,
    setPage: state.setPage,
    language: state.language,
  })))
  const t = translations[language]
  const [showUpload, setShowUpload] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const load = async () => {
    try { const d = await apiFetch<any>('/documents'); setDocuments(d.documents) } catch { /* */ }
  }
  useEffect(() => { load() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          await apiFetch('/documents', {
            method: 'POST',
            body: JSON.stringify({ name: file.name, type: file.type, size: file.size, data: reader.result, category: 'general' })
          })
          toast({ title: language === 'bn' ? 'ডকুমেন্ট আপলোড হয়েছে!' : 'Document uploaded!', description: file.name })
          load()
        } catch { /* */ }
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'bn' ? 'এই ডকুমেন্টটি মুছবেন?' : 'Delete this document?')) return
    try { await apiFetch(`/documents?id=${id}`, { method: 'DELETE' }); toast({ title: language === 'bn' ? 'ডকুমেন্ট মুছে ফেলা হয়েছে' : 'Document deleted' }); load() } catch { /* */ }
  }

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <FileImage className="w-6 h-6 text-blue-500" />
    if (type.includes('pdf')) return <FileType className="w-6 h-6 text-red-500" />
    return <FileText className="w-6 h-6 text-gray-500" />
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'scanned': return <ScanLine className="w-3.5 h-3.5" />
      case 'collage': return <FileImage className="w-3.5 h-3.5" />
      default: return <FolderLock className="w-3.5 h-3.5" />
    }
  }

  const filteredDocs = (documents as Document[]).filter(doc => {
    const matchCategory = filterCategory === 'all' || doc.category === filterCategory
    const matchSearch = !searchQuery || doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  const categories = ['all', 'scanned', 'collage', 'general']
  const scannedCount = (documents as Document[]).filter(d => d.category === 'scanned').length
  const collageCount = (documents as Document[]).filter(d => d.category === 'collage').length

  // Preview Modal
  if (previewDoc) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => setPreviewDoc(null)}>
            <ChevronLeft className="w-5 h-5 mr-1" /> {language === 'bn' ? 'ফিরে যান' : 'Back'}
          </Button>
          <h2 className="font-semibold truncate">{previewDoc.name}</h2>
        </div>

        {previewDoc.type.includes('image') && previewDoc.data ? (
          <div className="rounded-xl overflow-hidden border shadow-md bg-white">
            <img src={previewDoc.data} alt={previewDoc.name} className="w-full" style={{ maxHeight: '70vh', objectFit: 'contain' }} />
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-3 opacity-20" />
            <p>Preview not available for this file type</p>
          </div>
        )}

        <div className="space-y-3">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium truncate max-w-[200px]">{previewDoc.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge variant="secondary">{previewDoc.type}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <Badge variant="outline" className="capitalize">{previewDoc.category}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Size</span>
                <span className="text-sm">{previewDoc.size > 1024 ? `${(previewDoc.size / 1024).toFixed(1)} KB` : `${previewDoc.size} B`}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            {previewDoc.data && (
              <a href={previewDoc.data} download={previewDoc.name} className="flex-1">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </a>
            )}
            <Button variant="destructive" onClick={() => { handleDelete(previewDoc.id); setPreviewDoc(null) }}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <Card className="border-0 shadow-md bg-gradient-to-r from-slate-700 to-slate-800 text-white">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <FolderLock className="w-10 h-10" />
            <div>
              <p className="font-bold text-lg">{language === 'bn' ? 'ডকভল্ট' : 'DocVault'}</p>
              <p className="text-slate-300 text-sm">{(documents as Document[]).length} {language === 'bn' ? 'টি ডকুমেন্ট সুরক্ষিত' : 'documents secured'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterCategory('scanned')}>
          <CardContent className="p-3 text-center">
            <ScanLine className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold">{scannedCount}</p>
            <p className="text-[10px] text-muted-foreground">{language === 'bn' ? 'স্ক্যান করা' : 'Scanned'}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterCategory('collage')}>
          <CardContent className="p-3 text-center">
            <FileImage className="w-5 h-5 mx-auto text-purple-500 mb-1" />
            <p className="text-lg font-bold">{collageCount}</p>
            <p className="text-[10px] text-muted-foreground">{language === 'bn' ? 'কলাজ' : 'Collages'}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterCategory('general')}>
          <CardContent className="p-3 text-center">
            <Upload className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <p className="text-lg font-bold">{(documents as Document[]).filter(d => d.category === 'general').length}</p>
            <p className="text-[10px] text-muted-foreground">{language === 'bn' ? 'আপলোড' : 'Uploaded'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Actions */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={language === 'bn' ? 'ডকুমেন্ট খুঁজুন...' : 'Search documents...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button size="icon" variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
          {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={filterCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(cat)}
            className={filterCategory === cat ? 'bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap' : 'whitespace-nowrap'}
          >
            {getCategoryIcon(cat === 'all' ? 'general' : cat)}
            <span className="ml-1 capitalize">{cat}</span>
          </Button>
        ))}
      </div>

      {/* Upload */}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => setShowUpload(!showUpload)}>
          <Upload className="w-4 h-4 mr-2" /> {language === 'bn' ? 'আপলোড' : 'Upload'}
        </Button>
        <Button variant="outline" onClick={() => setPage('docscanner')}>
          <ScanLine className="w-4 h-4 mr-2" /> {language === 'bn' ? 'স্ক্যান' : 'Scan'}
        </Button>
      </div>

      {showUpload && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <Input type="file" onChange={handleUpload} accept="image/*,.pdf,.doc,.docx,.txt" multiple />
            <p className="text-xs text-muted-foreground mt-2">Supports images, PDFs, and documents</p>
          </CardContent>
        </Card>
      )}

      {/* Documents Grid/List */}
      {filteredDocs.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                className="relative rounded-xl overflow-hidden shadow-sm border bg-white cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setPreviewDoc(doc)}
              >
                {doc.type.includes('image') && doc.data ? (
                  <img src={doc.data} alt={doc.name} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-muted flex items-center justify-center">
                    {getFileIcon(doc.type)}
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{doc.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="secondary" className="text-[9px] px-1 capitalize">{doc.category}</Badge>
                    <div className="flex gap-1">
                      {doc.data && (
                        <a href={doc.data} download={doc.name} onClick={e => e.stopPropagation()} className="p-1 hover:bg-muted rounded">
                          <Download className="w-3 h-3" />
                        </a>
                      )}
                      <button onClick={e => { e.stopPropagation(); handleDelete(doc.id) }} className="p-1 hover:bg-red-50 rounded text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setPreviewDoc(doc)}
              >
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  {doc.type.includes('image') && doc.data ? (
                    <img src={doc.data} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getFileIcon(doc.type)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[9px] px-1 capitalize">{doc.category}</Badge>
                    <span className="text-xs text-muted-foreground">{doc.type.split('/')[1] || doc.type}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {doc.data && (
                    <a href={doc.data} download={doc.name} onClick={e => e.stopPropagation()} className="p-1.5 hover:bg-muted rounded-lg">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button onClick={e => { e.stopPropagation(); handleDelete(doc.id) }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <FolderLock className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No documents found</p>
          <p className="text-sm">{searchQuery || filterCategory !== 'all' ? 'Try changing filters' : 'Upload or scan documents to store them securely'}</p>
        </div>
      )}
    </div>
  )
})

// ============ CALCULATOR ============
const CalculatorPage = memo(function CalculatorPage() {
  const language = useAppStore(state => state.language)
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<string | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [resetDisplay, setResetDisplay] = useState(false)
  const [expression, setExpression] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [calcHistory, setCalcHistory] = useState<Array<{ id: string; expression: string; result: string; date: string }>>([])

  // Load history from localStorage
  useEffect(() => {
    try {
      const hist = localStorage.getItem('calculatorHistory')
      if (hist) setCalcHistory(JSON.parse(hist))
    } catch {}
  }, [])

  const saveHistory = (history: Array<{ id: string; expression: string; result: string; date: string }>) => {
    const trimmed = history.slice(0, 100)
    setCalcHistory(trimmed)
    localStorage.setItem('calculatorHistory', JSON.stringify(trimmed))
  }

  const handleNumber = (num: string) => {
    if (resetDisplay) { setDisplay(num); setResetDisplay(false) }
    else setDisplay(display === '0' ? num : display + num)
  }

  const handleOperation = (op: string) => {
    if (previousValue && operation && !resetDisplay) { calculate(false) }
    setExpression(formatCurrency(parseFloat(display)) + ' ' + op)
    setPreviousValue(display)
    setOperation(op)
    setResetDisplay(true)
  }

  const calculate = (addToHistory = true) => {
    if (!previousValue || !operation) return
    const prev = parseFloat(previousValue)
    const curr = parseFloat(display)
    let result = 0
    switch (operation) {
      case '+': result = prev + curr; break
      case '-': result = prev - curr; break
      case '×': result = prev * curr; break
      case '÷': result = curr !== 0 ? prev / curr : 0; break
    }
    const resultStr = String(Math.round(result * 100000000) / 100000000)
    const expressionStr = `${formatCurrency(prev)} ${operation} ${formatCurrency(curr)} = ${formatCurrency(result)}`

    if (addToHistory) {
      const newEntry = {
        id: Date.now().toString(),
        expression: expressionStr,
        result: resultStr,
        date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      }
      saveHistory([newEntry, ...calcHistory])
    }

    setDisplay(resultStr)
    setExpression('')
    setPreviousValue(null)
    setOperation(null)
    setResetDisplay(true)
  }

  const handleClear = () => { setDisplay('0'); setPreviousValue(null); setOperation(null); setExpression('') }
  const handlePercent = () => setDisplay(String(parseFloat(display) / 100))
  const handleToggleSign = () => setDisplay(String(-parseFloat(display)))
  const handleDecimal = () => { if (!display.includes('.')) setDisplay(display + '.') }
  const handleBackspace = () => {
    if (resetDisplay) return
    if (display.length <= 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0')
    } else {
      setDisplay(display.slice(0, -1))
    }
  }

  const clearHistory = () => {
    saveHistory([])
    toast({ title: language === 'bn' ? 'ইতিহাস মুছে ফেলা হয়েছে' : 'History Cleared', description: language === 'bn' ? 'সব ক্যালকুলেশন ইতিহাস মুছে ফেলা হয়েছে' : 'All calculation history has been cleared.' })
  }

  const applyHistoryResult = (result: string) => {
    setDisplay(result)
    setPreviousValue(null)
    setOperation(null)
    setExpression('')
    setResetDisplay(true)
  }

  const buttons = [
    ['C', '⌫', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ]

  const handleButton = (val: string) => {
    if (val >= '0' && val <= '9') handleNumber(val)
    else if (['+', '-', '×', '÷'].includes(val)) handleOperation(val)
    else if (val === '=') calculate()
    else if (val === 'C') handleClear()
    else if (val === '+/-') handleToggleSign()
    else if (val === '%') handlePercent()
    else if (val === '.') handleDecimal()
    else if (val === '⌫') handleBackspace()
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-border">
        {/* Header with history toggle */}
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">{language === 'bn' ? 'ক্যালকুলেটর' : 'Calculator'}</span>
          <button onClick={() => setShowHistory(!showHistory)} className={`text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 transition-colors ${showHistory ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
            <History className="w-4 h-4" />
          </button>
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="mx-4 mb-2 bg-gray-100 dark:bg-gray-800 rounded-xl max-h-48 overflow-y-auto border border-border">
            <div className="flex items-center justify-between p-2 px-3 sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">{language === 'bn' ? 'ইতিহাস' : 'History'} ({calcHistory.length})</span>
              {calcHistory.length > 0 && (
                <button onClick={clearHistory} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs">{language === 'bn' ? 'মুছুন' : 'Clear'}</button>
              )}
            </div>
            {calcHistory.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-xs text-center py-4">{language === 'bn' ? 'এখনও কোনো ক্যালকুলেশন নেই' : 'No calculations yet'}</p>
            ) : (
              <div className="space-y-1 px-2 pb-2">
                {calcHistory.map(entry => (
                  <button key={entry.id} onClick={() => applyHistoryResult(entry.result)}
                    className="w-full text-right p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group">
                    <p className="text-gray-400 dark:text-gray-500 text-[10px]">{entry.date}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{entry.expression}</p>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-300">= {formatCurrency(parseFloat(entry.result))}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Display */}
        <div className="px-6 pb-2">
          <div className="text-right mb-4">
            {expression && <p className="text-gray-500 dark:text-gray-400 text-sm h-5 truncate">{expression}</p>}
            {!expression && operation && previousValue && <p className="text-gray-500 dark:text-gray-400 text-sm h-5 truncate">{formatCurrency(parseFloat(previousValue))} {operation}</p>}
            <p className="text-gray-900 dark:text-white text-4xl font-light truncate">{display.includes('.') ? display : formatCurrency(parseFloat(display))}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-4 pb-5">
          <div className="grid grid-cols-4 gap-3">
            {buttons.map((row, ri) => (
              row.map((btn, ci) => {
                const isOp = ['+', '-', '×', '÷', '='].includes(btn)
                const isFunc = ['C', '⌫', '%'].includes(btn)
                const isActiveOp = operation === btn && resetDisplay
                return (
                  <button key={`${ri}-${ci}`} onClick={() => handleButton(btn)}
                    className={`h-14 rounded-2xl text-xl font-medium transition-all active:scale-95
                      ${btn === '0' ? 'col-span-2' : ''}
                      ${isOp ? (isActiveOp ? 'bg-emerald-300 text-gray-900' : 'bg-emerald-500 text-white hover:bg-emerald-600') : isFunc ? 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                    {btn}
                  </button>
                )
              })
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

// ============ CALENDAR ============
const CalendarPage = memo(function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const plans = useAppStore(state => state.plans)
  const [selectedDate, setSelectedDate] = useState(getToday())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const dayPlans = (dateStr: string) => (plans as Plan[]).filter(p => p.date === dateStr)

  const selectedPlans = dayPlans(selectedDate)

  return (
    <div className="p-4 pb-24 space-y-4">
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
            <h3 className="font-semibold text-lg">{monthName}</h3>
            <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-lg"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const dateStr = getDateStr(day)
              const hasPlan = dayPlans(dateStr).length > 0
              const isToday = dateStr === getToday()
              const isSelected = dateStr === selectedDate
              return (
                <button key={day} onClick={() => setSelectedDate(dateStr)}
                  className={`h-10 rounded-xl text-sm flex flex-col items-center justify-center relative
                    ${isSelected ? 'bg-emerald-500 text-white font-bold' : isToday ? 'bg-emerald-100 text-emerald-700 font-bold' : 'hover:bg-muted'}`}>
                  {day}
                  {hasPlan && <div className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedPlans.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Plans on {formatDate(selectedDate)}</h3>
          <div className="space-y-2">
            {selectedPlans.map(plan => (
              <div key={plan.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className={`w-3 h-3 rounded-full ${plan.completed ? 'bg-green-500' : plan.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${plan.completed ? 'line-through text-muted-foreground' : ''}`}>{plan.title}</p>
                  {plan.time && <p className="text-xs text-muted-foreground">{plan.time}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

// ============ ALARM ============
const AlarmPage = memo(function AlarmPage() {
  const { alarms, setAlarms } = useAppStore(useShallow(state => ({
    alarms: state.alarms,
    setAlarms: state.setAlarms,
  })))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', time: '07:00', date: '', repeat: 'once' })

  const load = async () => {
    try { const d = await apiFetch<any>('/alarms'); setAlarms(d.alarms) } catch { /* */ }
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiFetch('/alarms', { method: 'POST', body: JSON.stringify(form) })
      toast({ title: 'Alarm set!' })
      setForm({ title: '', time: '07:00', date: '', repeat: 'once' })
      setShowForm(false)
      load()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    }
  }

  const toggleActive = async (alarm: Alarm) => {
    try {
      await apiFetch('/alarms', { method: 'PUT', body: JSON.stringify({ id: alarm.id, active: !alarm.active }) })
      load()
    } catch { /* */ }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete alarm?')) return
    try { await apiFetch(`/alarms?id=${id}`, { method: 'DELETE' }); load() } catch { /* */ }
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <Button onClick={() => setShowForm(!showForm)} className="w-full"><Plus className="w-4 h-4 mr-2" /> Set Alarm</Button>

      {showForm && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Alarm Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Wake up, Meeting..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Time</Label><Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required /></div>
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              </div>
              <div><Label>Repeat</Label>
                <Select value={form.repeat} onValueChange={v => setForm({ ...form, repeat: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekdays">Weekdays</SelectItem>
                    <SelectItem value="weekends">Weekends</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Set Alarm</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {(alarms as Alarm[]).map(alarm => (
          <div key={alarm.id} className={`flex items-center gap-3 p-4 rounded-xl shadow-sm ${alarm.active ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-800/50 opacity-60'}`}>
            <div className="flex-1">
              <p className="text-2xl font-bold">{alarm.time}</p>
              <p className="text-sm text-muted-foreground">{alarm.title}</p>
              <Badge variant="outline" className="mt-1">{alarm.repeat}</Badge>
            </div>
            <Switch checked={alarm.active} onCheckedChange={() => toggleActive(alarm)} />
            <button onClick={() => handleDelete(alarm.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {(alarms as Alarm[]).length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No alarms set</p>
          </div>
        )}
      </div>
    </div>
  )
})

// ============ TOOLS PAGE ============
const ToolsPage = memo(function ToolsPage() {
  const setPage = useAppStore(state => state.setPage)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [converting, setConverting] = useState(false)
  const [convertedImages, setConvertedImages] = useState<string[]>([])
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null)
  const [editPdfImages, setEditPdfImages] = useState<string[]>([])
  const [editCurrentPage, setEditCurrentPage] = useState(0)
  const [editAnnotations, setEditAnnotations] = useState<Array<{ page: number; x: number; y: number; text: string; color: string }>>([])
  const [editTextInput, setEditTextInput] = useState('')
  const [editTextColor, setEditTextColor] = useState('#ff0000')
  const [showTextInput, setShowTextInput] = useState(false)
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })

  const tools = [
    { icon: <FileImage className="w-6 h-6" />, label: 'PDF to JPEG', desc: 'Convert PDF pages to images', color: 'from-red-400 to-orange-400' },
    { icon: <FileEdit className="w-6 h-6" />, label: 'PDF Edit', desc: 'Edit PDF documents', color: 'from-blue-400 to-cyan-400' },
    { icon: <Calculator className="w-6 h-6" />, label: 'Calculator', desc: 'Quick calculations', color: 'from-gray-400 to-slate-500', page: 'calculator' as Page },
    { icon: <Banknote className="w-6 h-6" />, label: 'Note Counter', desc: 'Count cash notes', color: 'from-green-400 to-emerald-500', page: 'notecounter' as Page },
    { icon: <ScanLine className="w-6 h-6" />, label: 'Doc Scanner', desc: 'Scan with camera', color: 'from-purple-400 to-violet-500', page: 'docscanner' as Page },
    { icon: <FolderLock className="w-6 h-6" />, label: 'DocVault', desc: 'Secure storage', color: 'from-slate-500 to-gray-600', page: 'docvault' as Page },
    { icon: <Calendar className="w-6 h-6" />, label: 'Calendar', desc: 'View calendar', color: 'from-teal-400 to-cyan-500', page: 'calendar' as Page },
    { icon: <Bell className="w-6 h-6" />, label: 'Alarm', desc: 'Set alarms', color: 'from-yellow-400 to-amber-500', page: 'alarm' as Page },
  ]

  // PDF to JPEG - Real conversion using canvas
  const handlePdfConvert = async () => {
    if (!pdfFile) return
    setConverting(true)
    setConvertedImages([])
    try {
      const arrayBuffer = await pdfFile.arrayBuffer()
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
      const images: string[] = []
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const scale = 2
        const viewport = page.getViewport({ scale })
        
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise
        images.push(canvas.toDataURL('image/jpeg', 0.9))
      }
      
      setConvertedImages(images)
      toast({ title: 'Conversion Complete!', description: `${images.length} page(s) converted to JPEG.` })
    } catch (err) {
      console.error('PDF conversion error:', err)
      toast({ title: 'Conversion Failed', description: 'Could not convert PDF. Please try a different file.', variant: 'destructive' })
    }
    setConverting(false)
  }

  const downloadImage = (dataUrl: string, index: number) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${pdfFile?.name?.replace('.pdf', '') || 'page'}_${index + 1}.jpg`
    link.click()
  }

  const downloadAllImages = () => {
    convertedImages.forEach((img, i) => {
      setTimeout(() => downloadImage(img, i), i * 300)
    })
  }

  // PDF Editor - Load and annotate
  const handleEditPdf = async () => {
    if (!editPdfFile) return
    try {
      const arrayBuffer = await editPdfFile.arrayBuffer()
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
      const images: string[] = []
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const scale = 2
        const viewport = page.getViewport({ scale })
        
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise
        images.push(canvas.toDataURL('image/jpeg', 0.9))
      }
      
      setEditPdfImages(images)
      setEditCurrentPage(0)
      setEditAnnotations([])
      toast({ title: 'PDF Loaded', description: `${images.length} page(s) loaded for editing.` })
    } catch (err) {
      console.error('PDF editor error:', err)
      toast({ title: 'Load Failed', description: 'Could not load PDF for editing.', variant: 'destructive' })
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setTextPosition({ x, y })
    setShowTextInput(true)
    setEditTextInput('')
  }

  const addTextAnnotation = () => {
    if (!editTextInput.trim()) return
    setEditAnnotations([...editAnnotations, {
      page: editCurrentPage,
      x: textPosition.x,
      y: textPosition.y,
      text: editTextInput,
      color: editTextColor
    }])
    setShowTextInput(false)
    setEditTextInput('')
  }

  const deleteAnnotation = (index: number) => {
    setEditAnnotations(editAnnotations.filter((_, i) => i !== index))
  }

  const saveEditedPdf = async () => {
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

      // Render each page with annotations to canvas, then create downloadable images
      for (let p = 0; p < editPdfImages.length; p++) {
        const img = new Image()
        img.src = editPdfImages[p]
        await new Promise(resolve => { img.onload = resolve })
        
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        
        // Draw annotations for this page
        const pageAnnotations = editAnnotations.filter(a => a.page === p)
        const scaleX = img.width / (img.naturalWidth || img.width)
        const scaleY = img.height / (img.naturalHeight || img.height)
        
        pageAnnotations.forEach(ann => {
          ctx.font = `bold ${Math.round(20 * scaleX)}px Arial`
          ctx.fillStyle = ann.color
          ctx.fillText(ann.text, ann.x * scaleX, ann.y * scaleY)
        })
        
        // Download
        const link = document.createElement('a')
        link.href = canvas.toDataURL('image/jpeg', 0.95)
        link.download = `edited_page_${p + 1}.jpg`
        link.click()
      }
      
      toast({ title: 'Saved!', description: 'Edited pages downloaded.' })
    } catch (err) {
      console.error('Save error:', err)
      toast({ title: 'Save Failed', description: 'Could not save edited PDF.', variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <h2 className="text-xl font-bold">Tools & Utilities</h2>

      <div className="grid grid-cols-2 gap-3">
        {tools.map(tool => (
          <Card key={tool.label} className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => tool.page && setPage(tool.page)}>
            <CardContent className="p-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center text-white mb-3`}>
                {tool.icon}
              </div>
              <p className="font-medium text-sm">{tool.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tool.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PDF to JPEG Section */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2"><FileImage className="w-5 h-5 text-red-500" /> PDF to JPEG</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border-2 border-dashed rounded-xl p-4 text-center">
            <Input type="file" accept=".pdf" onChange={e => { setPdfFile(e.target.files?.[0] || null); setConvertedImages([]) }} />
            {pdfFile && (
              <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm font-medium">{pdfFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button size="sm" onClick={() => { setPdfFile(null); setConvertedImages([]) }} variant="ghost"><X className="w-4 h-4" /></Button>
              </div>
            )}
          </div>
          <Button onClick={handlePdfConvert} disabled={!pdfFile || converting} className="w-full bg-red-500 hover:bg-red-600">
            {converting ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Converting...</> : <><FileImage className="w-4 h-4 mr-2" /> Convert to JPEG</>}
          </Button>
          
          {convertedImages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Converted Pages ({convertedImages.length})</p>
                <Button size="sm" variant="outline" onClick={downloadAllImages}><Download className="w-4 h-4 mr-1" /> Download All</Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {convertedImages.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt={`Page ${i + 1}`} className="w-full rounded-lg border shadow-sm" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button size="sm" variant="secondary" onClick={() => downloadImage(img, i)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Page {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Edit Section */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2"><FileEdit className="w-5 h-5 text-blue-500" /> PDF Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border-2 border-dashed rounded-xl p-4 text-center">
            <Input type="file" accept=".pdf" onChange={e => { setEditPdfFile(e.target.files?.[0] || null); setEditPdfImages([]) }} />
            {editPdfFile && (
              <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm font-medium">{editPdfFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(editPdfFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button size="sm" onClick={handleEditPdf} className="bg-blue-500 hover:bg-blue-600">Load PDF</Button>
              </div>
            )}
          </div>

          {editPdfImages.length > 0 && (
            <div className="space-y-3">
              {/* Page Navigation */}
              <div className="flex items-center justify-between">
                <Button size="sm" variant="outline" disabled={editCurrentPage === 0} onClick={() => setEditCurrentPage(editCurrentPage - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium">Page {editCurrentPage + 1} of {editPdfImages.length}</span>
                <Button size="sm" variant="outline" disabled={editCurrentPage === editPdfImages.length - 1} onClick={() => setEditCurrentPage(editCurrentPage + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Color Picker */}
              <div className="flex items-center gap-2">
                <Label className="text-xs">Text Color:</Label>
                {['#ff0000', '#0000ff', '#000000', '#008000', '#ff6600'].map(c => (
                  <button
                    key={c}
                    className={`w-7 h-7 rounded-full border-2 ${editTextColor === c ? 'border-gray-800 scale-110' : 'border-gray-300'} transition-all`}
                    style={{ backgroundColor: c }}
                    onClick={() => setEditTextColor(c)}
                  />
                ))}
              </div>

              {/* PDF Canvas with Click-to-Add-Text */}
              <div className="relative border rounded-lg overflow-hidden" onClick={handleCanvasClick}>
                <img src={editPdfImages[editCurrentPage]} alt={`Page ${editCurrentPage + 1}`} className="w-full" />
                {/* Render existing annotations */}
                {editAnnotations.filter(a => a.page === editCurrentPage).map((ann, i) => (
                  <div
                    key={i}
                    className="absolute group cursor-pointer"
                    style={{ left: ann.x, top: ann.y, color: ann.color }}
                  >
                    <span className="text-sm font-bold drop-shadow-md">{ann.text}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteAnnotation(editAnnotations.indexOf(ann)) }}
                      className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >×</button>
                  </div>
                ))}
              </div>

              {/* Text Input Popup */}
              {showTextInput && (
                <div className="flex gap-2 items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Input
                    value={editTextInput}
                    onChange={e => setEditTextInput(e.target.value)}
                    placeholder="Type text to add..."
                    className="flex-1"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && addTextAnnotation()}
                  />
                  <Button size="sm" onClick={addTextAnnotation} className="bg-blue-500 hover:bg-blue-600">Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowTextInput(false)}>Cancel</Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">Tap on the page to add text. Hover over text to delete.</p>

              {/* Save Button */}
              <Button onClick={saveEditedPdf} className="w-full bg-blue-500 hover:bg-blue-600" disabled={editPdfImages.length === 0}>
                <Download className="w-4 h-4 mr-2" /> Save Edited Pages
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})

// ============ PROFILE PAGE ============
const ProfilePage = memo(function ProfilePage() {
  const { user, token, logout, setPage, language } = useAppStore(useShallow(state => ({
    user: state.user,
    token: state.token,
    logout: state.logout,
    setPage: state.setPage,
    language: state.language,
  })))
  const [name, setName] = useState(user?.name || '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Please select an image under 2MB.', variant: 'destructive' })
      return
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please select an image file.', variant: 'destructive' })
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setAvatarPreview(result)
    }
    reader.readAsDataURL(file)
  }

  const updateProfile = async () => {
    try {
      const data = await apiFetch<any>('/auth', {
        method: 'PUT',
        body: JSON.stringify({ action: 'updateProfile', name, avatar: avatarPreview })
      })
      useAppStore.getState().setAuth(data.user, token!)
      toast({ title: 'Profile updated!' })
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    }
  }

  const removeAvatar = () => {
    setAvatarPreview(null)
  }

  const changePassword = async () => {
    try {
      await apiFetch('/auth', {
        method: 'PUT',
        body: JSON.stringify({ action: 'resetPassword', oldPassword, newPassword })
      })
      setOldPassword('')
      setNewPassword('')
      toast({ title: 'Password changed!' })
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* Profile Header */}
      <div className="text-center py-6">
        <div className="relative w-28 h-28 mx-auto mb-3">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-emerald-200 shadow-lg" />
          ) : (
            <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-emerald-200 shadow-lg">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-9 h-9 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white transition-colors"
            title="Change photo"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        {avatarPreview && (
          <button onClick={removeAvatar} className="text-xs text-red-500 hover:text-red-600 mb-1">
            Remove Photo
          </button>
        )}
        <h2 className="text-xl font-bold">{user?.name}</h2>
        <p className="text-muted-foreground">{user?.email}</p>
        {user?.role === 'admin' && <Badge className="mt-2 bg-emerald-100 text-emerald-700">Admin</Badge>}
      </div>

      {/* Update Profile */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2"><CardTitle className="text-base">Edit Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <Button onClick={updateProfile} className="w-full">Save Changes</Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2"><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Current Password</Label><Input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} /></div>
          <div><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
          <Button onClick={changePassword} className="w-full">Update Password</Button>
        </CardContent>
      </Card>

      {/* Language Setting */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2"><CardTitle className="text-base">🌐 Language / ভাষা</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => useAppStore.getState().setLanguage('en')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${language === 'en' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className="font-bold text-lg">English</p>
              <p className="text-xs text-muted-foreground">View app in English</p>
            </button>
            <button
              onClick={() => useAppStore.getState().setLanguage('bn')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${language === 'bn' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className="font-bold text-lg">বাংলা</p>
              <p className="text-xs text-muted-foreground">অ্যাপ বাংলায় দেখুন</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-2">
          {[
            { icon: <CalendarDays className="w-5 h-5" />, label: "Tomorrow's Plan", page: 'plans' as Page },
            { icon: <Bell className="w-5 h-5" />, label: 'Alarms', page: 'alarm' as Page },
            { icon: <FolderLock className="w-5 h-5" />, label: 'DocVault', page: 'docvault' as Page },
            { icon: <Shield className="w-5 h-5" />, label: 'Admin Panel', page: 'admin' as Page, adminOnly: true },
          ].filter(item => !item.adminOnly || user?.role === 'admin').map(item => (
            <button key={item.label} onClick={() => setPage(item.page)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-xl">
              {item.icon}
              <span className="flex-1 text-left text-sm">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full" onClick={logout}>
        <LogOut className="w-4 h-4 mr-2" /> Logout
      </Button>
    </div>
  )
})

// ============ ADMIN PANEL ============
const AdminPage = memo(function AdminPage() {
  const { setPage, user, token } = useAppStore(useShallow(state => ({
    setPage: state.setPage,
    user: state.user,
    token: state.token,
  })))
  const [stats, setStats] = useState<Record<string, number>>({})
  const [users, setUsers] = useState<UserInfo[]>([])
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null)
  const [userDetail, setUserDetail] = useState<Record<string, unknown[]>>({})
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [sendingNotif, setSendingNotif] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') return
    const loadStats = async () => {
      try {
        const d = await apiFetch<any>('/admin?action=stats')
        setStats(d.stats)
      } catch { /* */ }
    }
    const loadUsers = async () => {
      try {
        const d = await apiFetch<any>('/admin?action=users')
        setUsers(d.users)
      } catch { /* */ }
    }
    loadStats()
    loadUsers()
  }, [user])

  const viewUserDetail = async (u: UserInfo) => {
    try {
      const d = await apiFetch<any>(`/admin?action=userDetail&userId=${u.id}`)
      setUserDetail(d)
      setSelectedUser(u)
    } catch { /* */ }
  }

  const updateRole = async (userId: string, role: string) => {
    try {
      await apiFetch('/admin', { method: 'PUT', body: JSON.stringify({ action: 'updateRole', userId, role }) })
      toast({ title: 'Role updated' })
      const d = await apiFetch<any>('/admin?action=users')
      setUsers(d.users)
    } catch { /* */ }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Delete this user and all their data?')) return
    try {
      await apiFetch(`/admin?userId=${userId}`, { method: 'DELETE' })
      toast({ title: 'User deleted' })
      const d = await apiFetch<any>('/admin?action=users')
      setUsers(d.users)
    } catch { /* */ }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="p-4 pb-24 text-center py-20">
        <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <p className="text-muted-foreground mt-2">You need admin privileges to access this page.</p>
      </div>
    )
  }

  const statCards = [
    { label: 'Users', value: stats.users || 0, icon: <Users className="w-5 h-5" />, color: 'from-blue-400 to-blue-500' },
    { label: 'Expenses', value: stats.expenses || 0, icon: <DollarSign className="w-5 h-5" />, color: 'from-orange-400 to-red-400' },
    { label: 'Receivables', value: stats.receivables || 0, icon: <ArrowDownLeft className="w-5 h-5" />, color: 'from-green-400 to-emerald-500' },
    { label: 'Payables', value: stats.payables || 0, icon: <ArrowUpRight className="w-5 h-5" />, color: 'from-red-400 to-rose-500' },
    { label: 'Loans', value: stats.loans || 0, icon: <Landmark className="w-5 h-5" />, color: 'from-purple-400 to-violet-500' },
    { label: 'Notes', value: stats.notes || 0, icon: <StickyNote className="w-5 h-5" />, color: 'from-yellow-400 to-amber-500' },
    { label: 'Documents', value: stats.documents || 0, icon: <FolderLock className="w-5 h-5" />, color: 'from-slate-400 to-gray-500' },
  ]

  return (
    <div className="p-4 pb-24 space-y-4">
      <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10" />
            <div>
              <p className="font-bold text-lg">Admin Panel</p>
              <p className="text-emerald-200 text-sm">Manage your application</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Notification */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-500" /> Send Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="Notification title..." />
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} placeholder="Write your message..." rows={3} />
          </div>
          <Button
            onClick={async () => {
              if (!notifTitle.trim() || !notifMessage.trim()) {
                toast({ title: 'Error', description: 'Title and message are required.', variant: 'destructive' })
                return
              }
              setSendingNotif(true)
              try {
                await apiFetch('/notifications', {
                  method: 'POST',
                  body: JSON.stringify({ title: notifTitle, message: notifMessage, sendToAll: true }),
                  headers: { Authorization: `Bearer ${token}` }
                })
                setNotifTitle('')
                setNotifMessage('')
                toast({ title: 'Sent!', description: 'Notification sent to all users.' })
              } catch (err) {
                toast({ title: 'Failed', description: 'Could not send notification.', variant: 'destructive' })
              }
              setSendingNotif(false)
            }}
            disabled={sendingNotif}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {sendingNotif ? 'Sending...' : '📢 Send to All Users'}
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div>
        <h3 className="font-semibold mb-3">System Statistics</h3>
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(s => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-white`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Users */}
      <div>
        <h3 className="font-semibold mb-3">Users ({users.length})</h3>
        <div className="space-y-2">
          {users.map(u => (
            <Card key={u.id} className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-600">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => viewUserDetail(u)} className="flex-1">
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateRole(u.id, u.role === 'admin' ? 'user' : 'admin')}>
                    <Shield className="w-3.5 h-3.5 mr-1" /> {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  </Button>
                  {u.id !== user?.id && (
                    <Button size="sm" variant="outline" onClick={() => deleteUser(u.id)} className="text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedUser.name}&apos;s Data</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted p-2 rounded-lg"><span className="text-muted-foreground">Expenses:</span> {(userDetail.expenses as unknown[])?.length || 0}</div>
                <div className="bg-muted p-2 rounded-lg"><span className="text-muted-foreground">Receivables:</span> {(userDetail.receivables as unknown[])?.length || 0}</div>
                <div className="bg-muted p-2 rounded-lg"><span className="text-muted-foreground">Payables:</span> {(userDetail.payables as unknown[])?.length || 0}</div>
                <div className="bg-muted p-2 rounded-lg"><span className="text-muted-foreground">Loans:</span> {(userDetail.loans as unknown[])?.length || 0}</div>
                <div className="bg-muted p-2 rounded-lg"><span className="text-muted-foreground">Notes:</span> {(userDetail.notes as unknown[])?.length || 0}</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
})

// ============ ADMOB HELPER ============
const ADMOB_BANNER_ID = 'ca-app-pub-1742730064755213/6662912587'
const ADMOB_INTERSTITIAL_ID = 'ca-app-pub-1742730064755213/6471340896'

// Check if running in Capacitor native app
function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).Capacitor?.isNativePlatform?.()
}

// AdMob Banner Component
const AdMobBanner = memo(function AdMobBanner() {
  const [bannerReady, setBannerReady] = useState(false)

  useEffect(() => {
    if (!isNativeApp()) return

    let mounted = true

    const initBanner = async () => {
      try {
        await AdMob.initialize({
          testingDevices: [''],
          initializeForTesting: true,
        })
        await AdMob.showBanner({
          adId: ADMOB_BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          isTesting: true,
          margin: 60, // Above bottom nav
        })
        if (mounted) setBannerReady(true)
      } catch (e) {
        console.log('AdMob banner error:', e)
      }
    }

    initBanner()

    return () => {
      mounted = false
      if (isNativeApp()) {
        AdMob.removeBanner().catch(() => {})
      }
    }
  }, [])

  if (!isNativeApp() || !bannerReady) return null
  return null // Banner is rendered natively by AdMob
})

// Show interstitial ad (call on page transitions)
let interstitialLoaded = false
let lastInterstitialTime = 0

async function showInterstitialAd() {
  if (!isNativeApp()) return
  
  // Don't show more than once every 3 minutes
  const now = Date.now()
  if (now - lastInterstitialTime < 180000) return

  try {
    if (!interstitialLoaded) {
      await AdMob.prepareInterstitial({
        adId: ADMOB_INTERSTITIAL_ID,
        isTesting: true,
      })
      interstitialLoaded = true
    }
    await AdMob.showInterstitial()
    lastInterstitialTime = now
    interstitialLoaded = false
  } catch (e) {
    console.log('AdMob interstitial error:', e)
  }
}

// ============ MAIN APP ============
export default function DailyLifeApp() {
  const { isAuthenticated, currentPage, token, setAuth, logout, language, setLanguage } = useAppStore(useShallow(state => ({
    isAuthenticated: state.isAuthenticated,
    currentPage: state.currentPage,
    token: state.token,
    setAuth: state.setAuth,
    logout: state.logout,
    language: state.language,
    setLanguage: state.setLanguage,
  })))
  const [initialized, setInitialized] = useState(false)

  // Translation function
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['en'][key] || key
  }

  // Check for existing session
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const data = await apiFetch<any>('/auth', {
            method: 'POST',
            body: JSON.stringify({ action: 'verify' }),
            headers: { Authorization: `Bearer ${token}` }
          } as RequestInit)
          setAuth(data.user, token)
        } catch {
          logout()
        }
      }
      setInitialized(true)
    }
    checkAuth()
  }, [])

  // Browser back button support
  const goBack = useAppStore(state => state.goBack)
  const setPage = useAppStore(state => state.setPage)

  useEffect(() => {
    const handlePopState = () => {
      goBack()
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [goBack])

  useEffect(() => {
    if (currentPage !== 'dashboard' && isAuthenticated) {
      window.history.pushState({ page: currentPage }, '', '')
    }
    // Show interstitial ad on page change (not on first load)
    if (isAuthenticated && currentPage !== 'dashboard') {
      showInterstitialAd()
    }
  }, [currentPage, isAuthenticated])

  // Dark mode support
  const darkMode = useAppStore(state => state.darkMode)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        {currentPage === 'register' ? <RegisterPage /> : currentPage === 'forgot' ? <ForgotPasswordPage /> : <LoginPage />}
      </>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />
      case 'expenses': return <ExpensesPage />
      case 'receivables': return <ReceivablesPage />
      case 'payables': return <PayablesPage />
      case 'loans': return <LoansPage />
      case 'accounts': return <AccountsPage />
      case 'plans': return <PlansPage />
      case 'notes': return <NotesPage />
      case 'notecounter': return <NoteCounterPage />
      case 'docscanner': return <DocScannerPage />
      case 'docvault': return <DocVaultPage />
      case 'calculator': return <CalculatorPage />
      case 'calendar': return <CalendarPage />
      case 'alarm': return <AlarmPage />
      case 'tools': return <ToolsPage />
      case 'profile': return <ProfilePage />
      case 'admin': return <AdminPage />
      default: return <DashboardPage />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 max-w-lg mx-auto">
      <Sidebar />
      <AppHeader />
      <main className="min-h-[calc(100vh-7rem)]">
        {renderPage()}
      </main>
      <BottomNav />
      <AdMobBanner />
    </div>
  )
}
