'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore, Page } from '@/lib/store'
import apiFetch from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  Hash, IndianRupee, Scan, FileImage, FileEdit, FileType, Pause, Play
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
  return '৳' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
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
function LoginPage() {
  const { setAuth, setPage } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch('/auth', {
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
}

function RegisterPage() {
  const { setAuth, setPage } = useAppStore()
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
      const data = await apiFetch('/auth', {
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
}

function ForgotPasswordPage() {
  const { setPage } = useAppStore()
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
}

// ============ HEADER ============
function AppHeader() {
  const { currentPage, setPage, toggleSidebar, user, logout } = useAppStore()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const getTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard', expenses: 'Expenses', receivables: 'Receivables',
      payables: 'Payables', loans: 'Loan / EMI', accounts: 'Accounts',
      plans: "Tomorrow's Plan", notes: 'Notes', notecounter: 'Note Counter',
      docscanner: 'Doc Scanner', docvault: 'DocVault', calculator: 'Calculator',
      calendar: 'Calendar', alarm: 'Alarm', tools: 'Tools',
      profile: 'Profile', admin: 'Admin Panel', 'admin-users': 'Manage Users',
      'admin-stats': 'Statistics'
    }
    return titles[currentPage] || 'DailyLife Pro'
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          {currentPage !== 'dashboard' ? (
            <button onClick={() => setPage('dashboard')} className="p-1.5 hover:bg-muted rounded-lg">
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
          {user?.role === 'admin' && (
            <button onClick={() => setPage('admin')} className="p-1.5 hover:bg-muted rounded-lg">
              <Shield className="w-5 h-5 text-emerald-600" />
            </button>
          )}
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.[0]?.toUpperCase() || 'U'}
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
}

// ============ SIDEBAR / DRAWER ============
function Sidebar() {
  const { sidebarOpen, toggleSidebar, currentPage, setPage, user, logout } = useAppStore()

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
}

// ============ BOTTOM NAV ============
function BottomNav() {
  const { currentPage, setPage } = useAppStore()

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
}

// ============ DASHBOARD ============
function DashboardPage() {
  const { setPage, expenses, receivables, payables, loans, accounts, user } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true)
      try {
        const [exp, rec, pay, loan, acc] = await Promise.all([
          apiFetch('/expenses'), apiFetch('/receivables'),
          apiFetch('/payables'), apiFetch('/loans'), apiFetch('/accounts')
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

  const totalExpenses = (expenses as Expense[]).reduce((s, e) => s + e.amount, 0)
  const totalReceivables = (receivables as Receivable[]).filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)
  const totalPayables = (payables as Payable[]).filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const totalLoanRemaining = (loans as Loan[]).filter(l => l.status === 'active').reduce((s, l) => s + (l.totalAmount - l.paidAmount), 0)
  const totalBalance = (accounts as Account[]).reduce((s, a) => s + a.balance, 0)

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
        <h2 className="text-xl font-bold">Assalamu Alaikum, {user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-emerald-100 mt-1">Here&apos;s your financial overview</p>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-3xl font-bold">{formatCurrency(totalBalance)}</span>
          <span className="text-emerald-200 text-sm mb-1">total balance</span>
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
        <h3 className="font-semibold mb-3">Quick Actions</h3>
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
}

// ============ EXPENSES PAGE ============
function ExpensesPage() {
  const { expenses, setExpenses } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food & Dining', date: getToday(), note: '' })
  const [filter, setFilter] = useState('all')

  const loadExpenses = async () => {
    try {
      const data = await apiFetch(`/expenses${filter !== 'all' ? `?category=${filter}` : ''}`)
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

  const total = (expenses as Expense[]).reduce((s, e) => s + e.amount, 0)

  // Category breakdown
  const categoryTotals: Record<string, number> = {}
  ;(expenses as Expense[]).forEach(e => { categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount })

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
}

// ============ RECEIVABLES PAGE ============
function ReceivablesPage() {
  const { receivables, setReceivables } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', fromPerson: '', dueDate: '', note: '' })

  const load = async () => {
    try { const d = await apiFetch('/receivables'); setReceivables(d.receivables) } catch { /* */ }
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

  const total = (receivables as Receivable[]).filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)

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
}

// ============ PAYABLES PAGE ============
function PayablesPage() {
  const { payables, setPayables } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', toPerson: '', dueDate: '', note: '' })

  const load = async () => {
    try { const d = await apiFetch('/payables'); setPayables(d.payables) } catch { /* */ }
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

  const total = (payables as Payable[]).filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)

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
}

// ============ LOANS PAGE ============
function LoansPage() {
  const { loans, setLoans } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', totalAmount: '', emiAmount: '', interestRate: '', tenure: '', startDate: getToday(), endDate: '', note: '' })

  const load = async () => {
    try { const d = await apiFetch('/loans'); setLoans(d.loans) } catch { /* */ }
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

  const totalRemaining = (loans as Loan[]).filter(l => l.status === 'active').reduce((s, l) => s + (l.totalAmount - l.paidAmount), 0)

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
}

// ============ ACCOUNTS PAGE ============
function AccountsPage() {
  const { accounts, setAccounts } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'Bank Account', balance: '', note: '' })

  const load = async () => {
    try { const d = await apiFetch('/accounts'); setAccounts(d.accounts) } catch { /* */ }
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

  const totalBalance = (accounts as Account[]).reduce((s, a) => s + a.balance, 0)

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
}

// Helper icon components
function SmartphoneIcon({ className }: { className?: string }) { return <div className={className}>📱</div> }
function CreditCardIcon({ className }: { className?: string }) { return <div className={className}>💳</div> }
function PiggyBankIcon({ className }: { className?: string }) { return <div className={className}>🐷</div> }

// ============ TOMORROW'S PLAN ============
function PlansPage() {
  const { plans, setPlans } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', date: getTomorrow(), time: '', priority: 'medium' })

  const load = async () => {
    try { const d = await apiFetch('/plans'); setPlans(d.plans) } catch { /* */ }
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
}

// ============ NOTES PAGE ============
function NotesPage() {
  const { notes, setNotes } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)
  const [form, setForm] = useState({ title: '', content: '', color: '#ffffff', pinned: false })

  const load = async () => {
    try { const d = await apiFetch('/notes'); setNotes(d.notes) } catch { /* */ }
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
}

// ============ NOTE COUNTER ============
function NoteCounterPage() {
  const [counts, setCounts] = useState<Record<string, number>>({
    '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '2': 0, '1': 0
  })

  const denominations = [
    { value: 1000, label: '৳1000', color: 'from-red-400 to-red-500' },
    { value: 500, label: '৳500', color: 'from-orange-400 to-orange-500' },
    { value: 200, label: '৳200', color: 'from-yellow-400 to-yellow-500' },
    { value: 100, label: '৳100', color: 'from-green-400 to-green-500' },
    { value: 50, label: '৳50', color: 'from-teal-400 to-teal-500' },
    { value: 20, label: '৳20', color: 'from-blue-400 to-blue-500' },
    { value: 10, label: '৳10', color: 'from-purple-400 to-purple-500' },
    { value: 5, label: '৳5', color: 'from-pink-400 to-pink-500' },
    { value: 2, label: '৳2', color: 'from-indigo-400 to-indigo-500' },
    { value: 1, label: '৳1', color: 'from-gray-400 to-gray-500' },
  ]

  const total = denominations.reduce((sum, d) => sum + (d.value * (counts[String(d.value)] || 0)), 0)
  const totalNotes = Object.values(counts).reduce((s, c) => s + c, 0)

  return (
    <div className="p-4 pb-24 space-y-4">
      <Card className="border-0 shadow-md bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
        <CardContent className="p-5 text-center">
          <p className="text-amber-100 text-sm">Total Cash</p>
          <p className="text-4xl font-bold mt-1">{formatCurrency(total)}</p>
          <p className="text-amber-200 text-sm mt-1">{totalNotes} notes</p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {denominations.map(d => (
          <div key={d.value} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className={`w-16 h-10 bg-gradient-to-r ${d.color} rounded-lg flex items-center justify-center text-white text-sm font-bold`}>
              {d.label}
            </div>
            <div className="flex items-center gap-2 flex-1">
              <button onClick={() => setCounts({ ...counts, [d.value]: Math.max(0, (counts[String(d.value)] || 0) - 1) })} className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold">-</button>
              <Input type="number" value={counts[String(d.value)] || 0} onChange={e => setCounts({ ...counts, [d.value]: parseInt(e.target.value) || 0 })} className="w-16 text-center" min={0} />
              <button onClick={() => setCounts({ ...counts, [d.value]: (counts[String(d.value)] || 0) + 1 })} className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold">+</button>
            </div>
            <p className="text-sm font-semibold w-24 text-right">{formatCurrency(d.value * (counts[String(d.value)] || 0))}</p>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full" onClick={() => setCounts({ '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '2': 0, '1': 0 })}>
        <RefreshCw className="w-4 h-4 mr-2" /> Reset All
      </Button>
    </div>
  )
}

// ============ DOC SCANNER ============
function DocScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [scannedDocs, setScannedDocs] = useState<string[]>([])
  const videoRef = React.useRef<HTMLVideoElement>(null)

  const startScan = async () => {
    try {
      setScanning(true)
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      toast({ title: 'Camera Error', description: 'Could not access camera. Please grant permission.', variant: 'destructive' })
      setScanning(false)
    }
  }

  const capture = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setScannedDocs(prev => [...prev, dataUrl])
    toast({ title: 'Page captured!' })
    
    // Stop camera
    const stream = videoRef.current.srcObject as MediaStream
    stream?.getTracks().forEach(t => t.stop())
    setScanning(false)
  }

  const saveToVault = async (data: string) => {
    try {
      await apiFetch('/documents', {
        method: 'POST',
        body: JSON.stringify({ name: `Scan_${Date.now()}`, type: 'image/jpeg', data, category: 'scanned' })
      })
      toast({ title: 'Saved to DocVault!' })
    } catch { /* */ }
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <Card className="border-0 shadow-md bg-gradient-to-r from-slate-600 to-slate-700 text-white">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <ScanLine className="w-10 h-10" />
            <div>
              <p className="font-bold text-lg">Doc Scanner</p>
              <p className="text-slate-300 text-sm">Scan documents with your camera</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {scanning ? (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full" autoPlay playsInline />
            <div className="absolute inset-0 border-4 border-white/30 rounded-xl pointer-events-none" />
          </div>
          <div className="flex gap-2">
            <Button onClick={capture} className="flex-1 bg-red-500 hover:bg-red-600"><div className="w-4 h-4 rounded-full bg-white mr-2" /> Capture</Button>
            <Button variant="outline" onClick={() => { setScanning(false); const stream = videoRef.current?.srcObject as MediaStream; stream?.getTracks().forEach(t => t.stop()) }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button onClick={startScan} className="w-full h-14 text-lg"><ScanLine className="w-5 h-5 mr-2" /> Start Scanning</Button>
      )}

      {scannedDocs.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Scanned Pages ({scannedDocs.length})</h3>
          <div className="grid grid-cols-2 gap-3">
            {scannedDocs.map((doc, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden shadow-sm">
                <img src={doc} alt={`Scan ${i + 1}`} className="w-full h-40 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50">
                  <Button size="sm" variant="outline" onClick={() => saveToVault(doc)} className="w-full text-white border-white/50">
                    <FolderLock className="w-3.5 h-3.5 mr-1" /> Save to Vault
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============ DOCVAULT ============
function DocVaultPage() {
  const { documents, setDocuments } = useAppStore()
  const [showUpload, setShowUpload] = useState(false)

  const load = async () => {
    try { const d = await apiFetch('/documents'); setDocuments(d.documents) } catch { /* */ }
  }
  useEffect(() => { load() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await apiFetch('/documents', {
          method: 'POST',
          body: JSON.stringify({ name: file.name, type: file.type, size: file.size, data: reader.result, category: 'general' })
        })
        toast({ title: 'Document uploaded!' })
        load()
      } catch { /* */ }
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    try { await apiFetch(`/documents?id=${id}`, { method: 'DELETE' }); load() } catch { /* */ }
  }

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <FileImage className="w-6 h-6 text-blue-500" />
    if (type.includes('pdf')) return <FileType className="w-6 h-6 text-red-500" />
    return <FileText className="w-6 h-6 text-gray-500" />
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <Card className="border-0 shadow-md bg-gradient-to-r from-slate-700 to-slate-800 text-white">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <FolderLock className="w-10 h-10" />
            <div>
              <p className="font-bold text-lg">DocVault</p>
              <p className="text-slate-300 text-sm">{(documents as Document[]).length} documents secured</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => setShowUpload(!showUpload)}><Upload className="w-4 h-4 mr-2" /> Upload</Button>
      </div>

      {showUpload && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <Input type="file" onChange={handleUpload} accept="image/*,.pdf,.doc,.docx,.txt" />
            <p className="text-xs text-muted-foreground mt-2">Supports images, PDFs, and documents</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {(documents as Document[]).map(doc => (
          <div key={doc.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
              {getFileIcon(doc.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.name}</p>
              <p className="text-xs text-muted-foreground">{doc.type} · {doc.size > 1024 ? `${(doc.size / 1024).toFixed(1)} KB` : `${doc.size} B`}</p>
            </div>
            <div className="flex gap-1">
              {doc.data && (
                <a href={doc.data} download={doc.name} className="p-1.5 hover:bg-muted rounded-lg"><Download className="w-3.5 h-3.5" /></a>
              )}
              <button onClick={() => handleDelete(doc.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        {(documents as Document[]).length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FolderLock className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No documents yet</p>
            <p className="text-sm">Upload or scan documents to store them securely</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============ CALCULATOR ============
function CalculatorPage() {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<string | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [resetDisplay, setResetDisplay] = useState(false)

  const handleNumber = (num: string) => {
    if (resetDisplay) { setDisplay(num); setResetDisplay(false) }
    else setDisplay(display === '0' ? num : display + num)
  }

  const handleOperation = (op: string) => {
    if (previousValue && operation && !resetDisplay) { calculate() }
    setPreviousValue(display)
    setOperation(op)
    setResetDisplay(true)
  }

  const calculate = () => {
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
    setDisplay(String(result))
    setPreviousValue(null)
    setOperation(null)
    setResetDisplay(true)
  }

  const handleClear = () => { setDisplay('0'); setPreviousValue(null); setOperation(null) }
  const handlePercent = () => setDisplay(String(parseFloat(display) / 100))
  const handleToggleSign = () => setDisplay(String(-parseFloat(display)))
  const handleDecimal = () => { if (!display.includes('.')) setDisplay(display + '.') }

  const buttons = [
    ['C', '+/-', '%', '÷'],
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
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="bg-gray-900 rounded-2xl p-6 shadow-xl">
        <div className="text-right mb-6">
          {operation && previousValue && <p className="text-gray-400 text-sm">{previousValue} {operation}</p>}
          <p className="text-white text-4xl font-light">{display}</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {buttons.map((row, ri) => (
            row.map((btn, ci) => {
              const isOp = ['+', '-', '×', '÷', '='].includes(btn)
              const isFunc = ['C', '+/-', '%'].includes(btn)
              return (
                <button key={`${ri}-${ci}`} onClick={() => handleButton(btn)}
                  className={`h-16 rounded-2xl text-xl font-medium transition-all active:scale-95
                    ${btn === '0' ? 'col-span-2' : ''}
                    ${isOp ? 'bg-emerald-500 text-white hover:bg-emerald-600' : isFunc ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
                  {btn}
                </button>
              )
            })
          ))}
        </div>
      </div>
    </div>
  )
}

// ============ CALENDAR ============
function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { plans } = useAppStore()
  const [selectedDate, setSelectedDate] = useState(getToday())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const days = []
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
}

// ============ ALARM ============
function AlarmPage() {
  const { alarms, setAlarms } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', time: '07:00', date: '', repeat: 'once' })

  const load = async () => {
    try { const d = await apiFetch('/alarms'); setAlarms(d.alarms) } catch { /* */ }
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
}

// ============ TOOLS PAGE ============
function ToolsPage() {
  const { setPage } = useAppStore()
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [converting, setConverting] = useState(false)

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

  const handlePdfConvert = () => {
    if (!pdfFile) return
    toast({ title: 'PDF Conversion', description: 'PDF processing is simulated in this environment. In production, this would use a PDF library to convert pages to JPEG images.' })
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
          <Input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
          {pdfFile && <p className="text-sm text-muted-foreground">Selected: {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)</p>}
          <Button onClick={handlePdfConvert} disabled={!pdfFile || converting} className="w-full">
            {converting ? 'Converting...' : 'Convert to JPEG'}
          </Button>
        </CardContent>
      </Card>

      {/* PDF Edit Section */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2"><FileEdit className="w-5 h-5 text-blue-500" /> PDF Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-xl p-8 text-center">
            <FileType className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Upload a PDF to edit</p>
            <Input type="file" accept=".pdf" className="mt-3" onChange={() => {
              toast({ title: 'PDF Editor', description: 'PDF editing would open an in-browser editor. Available in production with PDF.js integration.' })
            }} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ PROFILE PAGE ============
function ProfilePage() {
  const { user, token, logout, setPage } = useAppStore()
  const [name, setName] = useState(user?.name || '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const updateProfile = async () => {
    try {
      const data = await apiFetch('/auth', {
        method: 'PUT',
        body: JSON.stringify({ action: 'updateProfile', name })
      })
      useAppStore.getState().setAuth(data.user, token!)
      toast({ title: 'Profile updated!' })
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    }
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
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
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
}

// ============ ADMIN PANEL ============
function AdminPage() {
  const { setPage, user } = useAppStore()
  const [stats, setStats] = useState<Record<string, number>>({})
  const [users, setUsers] = useState<UserInfo[]>([])
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null)
  const [userDetail, setUserDetail] = useState<Record<string, unknown[]>>({})

  useEffect(() => {
    if (user?.role !== 'admin') return
    const loadStats = async () => {
      try {
        const d = await apiFetch('/admin?action=stats')
        setStats(d.stats)
      } catch { /* */ }
    }
    const loadUsers = async () => {
      try {
        const d = await apiFetch('/admin?action=users')
        setUsers(d.users)
      } catch { /* */ }
    }
    loadStats()
    loadUsers()
  }, [user])

  const viewUserDetail = async (u: UserInfo) => {
    try {
      const d = await apiFetch(`/admin?action=userDetail&userId=${u.id}`)
      setUserDetail(d)
      setSelectedUser(u)
    } catch { /* */ }
  }

  const updateRole = async (userId: string, role: string) => {
    try {
      await apiFetch('/admin', { method: 'PUT', body: JSON.stringify({ action: 'updateRole', userId, role }) })
      toast({ title: 'Role updated' })
      const d = await apiFetch('/admin?action=users')
      setUsers(d.users)
    } catch { /* */ }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Delete this user and all their data?')) return
    try {
      await apiFetch(`/admin?userId=${userId}`, { method: 'DELETE' })
      toast({ title: 'User deleted' })
      const d = await apiFetch('/admin?action=users')
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
}

// ============ MAIN APP ============
export default function DailyLifeApp() {
  const { isAuthenticated, currentPage, token, setAuth, logout } = useAppStore()
  const [initialized, setInitialized] = useState(false)

  // Check for existing session
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const data = await apiFetch('/auth', {
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

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
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
    </div>
  )
}
