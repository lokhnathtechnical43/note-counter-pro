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

  return data as T
}

export default apiFetch
