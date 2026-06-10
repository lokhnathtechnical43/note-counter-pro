const API_BASE = '/api'

// ============ API CACHING LAYER ============
const CACHE_TTL = 30_000 // 30 seconds cache for GET requests

interface CacheEntry {
  data: unknown
  timestamp: number
}

const cache = new Map<string, CacheEntry>()

function getCacheKey(endpoint: string, options?: RequestInit): string | null {
  // Only cache GET requests (no method or method === 'GET')
  if (options?.method && options.method !== 'GET') return null
  // Don't cache auth endpoints
  if (endpoint.startsWith('/auth')) return null
  return `GET:${endpoint}`
}

function getBaseEndpoint(endpoint: string): string {
  // Extract base endpoint without query params for invalidation
  // e.g. "/expenses?category=Food" → "/expenses"
  return endpoint.split('?')[0]
}

function invalidateCache(baseEndpoint: string) {
  // Delete all cache entries that start with this base endpoint
  for (const key of cache.keys()) {
    if (key.includes(baseEndpoint)) {
      cache.delete(key)
    }
  }
}

// Public: force invalidate all cache
export function invalidateAllCache() {
  cache.clear()
}

// ============ LOCAL STORAGE FALLBACK (OFFLINE / NATIVE MODE) ============

function isNative(): boolean {
  if (typeof window === 'undefined') return false
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    const cap = win['Capacitor']
    if (cap && typeof cap['isNativePlatform'] === 'function') {
      return !!cap['isNativePlatform']()
    }
    if (cap && cap['platform'] !== undefined) return true
  } catch { /* ignore */ }
  return false
}

function getStorageKey(endpoint: string): string {
  return `dlp_data_${getBaseEndpoint(endpoint)}`
}

function getLocalData<T = unknown>(endpoint: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getStorageKey(endpoint))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function setLocalData(endpoint: string, data: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getStorageKey(endpoint), JSON.stringify(data))
  } catch { /* storage full, ignore */ }
}

function removeLocalData(endpoint: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(getStorageKey(endpoint))
  } catch { /* ignore */ }
}

// Simple ID generator
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

// Simple hash for passwords (SHA-256)
async function simpleHash(str: string): Promise<string> {
  if (typeof window === 'undefined') return str
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Handle auth operations locally
async function localAuth(body: { action: string; email?: string; password?: string; name?: string }): Promise<unknown> {
  const { action, email, password, name } = body

  if (action === 'register') {
    const usersKey = 'dlp_users'
    const users: Array<{ id: string; email: string; name: string; password: string; role: string; createdAt: string }> =
      JSON.parse(localStorage.getItem(usersKey) || '[]')
    if (users.find(u => u.email === email)) {
      throw new Error('Email already registered')
    }
    const hashedPw = await simpleHash(password!)
    const user = { id: generateId(), email: email!, name: name!, password: hashedPw, role: 'user', createdAt: new Date().toISOString() }
    users.push(user)
    localStorage.setItem(usersKey, JSON.stringify(users))
    const token = btoa(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 86400000 }))
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt }, token }
  }

  if (action === 'login') {
    const usersKey = 'dlp_users'
    const users: Array<{ id: string; email: string; name: string; password: string; role: string; createdAt: string }> =
      JSON.parse(localStorage.getItem(usersKey) || '[]')
    const hashedPw = await simpleHash(password!)
    const user = users.find(u => u.email === email && u.password === hashedPw)
    if (!user) {
      throw new Error('Invalid email or password')
    }
    const token = btoa(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 86400000 }))
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt }, token }
  }

  if (action === 'forgot') {
    // In offline mode, just return success
    return { message: 'Password reset not available in offline mode' }
  }

  throw new Error('Unknown auth action')
}

// Handle CRUD operations locally
function localCrud(endpoint: string, options?: RequestInit): unknown {
  const baseEndpoint = getBaseEndpoint(endpoint)
  const method = options?.method || 'GET'
  const body = options?.body ? JSON.parse(options.body as string) : undefined

  // Parse query params from endpoint
  const [path, queryString] = endpoint.split('?')
  const params = new URLSearchParams(queryString || '')
  const resourceName = path!.replace(/^\//, '') // e.g. "expenses", "notes"

  // GET - return all items or filtered
  if (method === 'GET') {
    let data = getLocalData<Array<Record<string, unknown>>>(endpoint) || []
    // Handle admin endpoint
    if (resourceName === 'admin') {
      const action = params.get('action')
      if (action === 'stats') {
        const users = JSON.parse(localStorage.getItem('dlp_users') || '[]')
        return { totalUsers: users.length, activeUsers: users.length, totalExpenses: 0, totalNotes: 0 }
      }
      if (action === 'users') {
        const users = JSON.parse(localStorage.getItem('dlp_users') || '[]')
        return { users: users.map((u: any) => ({ id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt })) }
      }
      return {}
    }
    // Handle filter params
    const category = params.get('category')
    if (category && Array.isArray(data)) {
      data = data.filter((item: any) => item.category === category)
    }
    return { [resourceName]: data }
  }

  // POST - create new item
  if (method === 'POST') {
    const newItem = { id: generateId(), ...body, createdAt: new Date().toISOString() }
    const existing = getLocalData<Array<Record<string, unknown>>>(endpoint) || []
    existing.push(newItem)
    setLocalData(endpoint, existing)
    invalidateCache(baseEndpoint)
    return newItem
  }

  // PUT - update item
  if (method === 'PUT') {
    const existing = getLocalData<Array<Record<string, unknown>>>(endpoint) || []
    if (body?.id) {
      const idx = existing.findIndex((item: any) => item.id === body.id)
      if (idx !== -1) {
        existing[idx] = { ...existing[idx], ...body }
        setLocalData(endpoint, existing)
        invalidateCache(baseEndpoint)
        return existing[idx]
      }
    }
    // Handle markAllRead for notifications
    if (body?.markAllRead) {
      setLocalData(endpoint, [])
      invalidateCache(baseEndpoint)
      return { success: true }
    }
    throw new Error('Item not found')
  }

  // DELETE - remove item
  if (method === 'DELETE') {
    const existing = getLocalData<Array<Record<string, unknown>>>(endpoint) || []
    const id = params.get('id') || body?.id
    if (id) {
      const filtered = existing.filter((item: any) => item.id !== id)
      setLocalData(endpoint, filtered)
      invalidateCache(baseEndpoint)
      return { success: true }
    }
    throw new Error('Item not found')
  }

  throw new Error(`Unsupported method: ${method}`)
}

// Track if we've detected offline mode
let offlineDetected = false

export async function apiFetch<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Check cache for GET requests
  const cacheKey = getCacheKey(endpoint, options)
  if (cacheKey) {
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T
    }
  }

  // Try network first, fall back to localStorage
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await res.json()

    if (!res.ok) {
      // Auth errors - clear all cache
      if (res.status === 401 || res.status === 403) {
        cache.clear()
      }
      throw new Error(data.error || 'Something went wrong')
    }

    // Cache GET responses
    if (cacheKey) {
      cache.set(cacheKey, { data, timestamp: Date.now() })
    } else {
      // For mutations (POST/PUT/DELETE), invalidate related cache
      const baseEndpoint = getBaseEndpoint(endpoint)
      invalidateCache(baseEndpoint)
    }

    // Sync to localStorage for offline access
    if (typeof window !== 'undefined' && (options?.method === 'GET' || !options?.method)) {
      setLocalData(endpoint, data)
    }

    return data as T
  } catch (err: unknown) {
    // Network error - fall back to localStorage
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      offlineDetected = true
    }

    // If offline or native, use localStorage
    if (offlineDetected || isNative()) {
      return handleOffline(endpoint, options) as T
    }

    // For other errors, re-throw
    throw err
  }
}

function handleOffline(endpoint: string, options?: RequestInit): unknown {
  const baseEndpoint = getBaseEndpoint(endpoint)

  // Handle auth endpoints
  if (baseEndpoint === '/auth') {
    const body = options?.body ? JSON.parse(options.body as string) : {}
    return localAuth(body)
  }

  // Handle notifications (just return empty in offline)
  if (baseEndpoint === '/notifications') {
    const method = options?.method || 'GET'
    if (method === 'GET') {
      return { notifications: [], unreadCount: 0 }
    }
    return { success: true }
  }

  // Handle all CRUD endpoints
  return localCrud(endpoint, options)
}

export default apiFetch
