/**
 * API Client
 * 
 * Centralized HTTP client for backend API communication with Supabase authentication.
 */

import { createClient } from '@/lib/supabase/client'

// Production에서는 상대 경로 사용 (Next.js rewrites로 프록시)
// Development에서는 직접 백엔드 접근
const API_URL = typeof window !== 'undefined'
  ? '' // 브라우저: 상대 경로 (Next.js rewrites 사용)
  : (process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') // 서버: 직접 접근

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Get authentication headers with Supabase JWT token
 * Returns empty object if no session (optional auth)
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  console.log('🔐 [API Client] Getting auth headers...')

  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  console.log('🔐 [API Client] Session check:', {
    hasSession: !!session,
    hasAccessToken: !!session?.access_token,
    tokenPreview: session?.access_token ?
      `${session.access_token.substring(0, 20)}...` : 'N/A',
    error: error?.message || 'none'
  })

  // If no session, return empty headers (optional auth)
  if (error || !session?.access_token) {
    console.log('ℹ️ [API Client] No session - continuing without auth')
    return {
      'Content-Type': 'application/json',
    }
  }

  console.log('✅ [API Client] Auth headers prepared')

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  
  console.log('=' .repeat(80))
  console.log('📡 [API Client] Fetching:', options.method || 'GET', endpoint)
  console.log('🌐 [API Client] Full URL:', url)
  
  // Get auth headers
  const authHeaders = await getAuthHeaders()
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers, // Allow override if needed
    },
  }

  // Log request details
  const headers = config.headers as Record<string, string> | undefined
  console.log('📤 [API Client] Request headers:', {
    Authorization: headers?.['Authorization'] ?
      `Bearer ${headers['Authorization'].substring(7, 27)}...` : 'N/A',
    'Content-Type': headers?.['Content-Type'] || 'N/A',
  })
  
  if (options.body) {
    try {
      const parsedBody = typeof options.body === 'string'
        ? JSON.parse(options.body)
        : options.body
      console.log('📦 [API Client] Request body:', parsedBody)
    } catch {
      console.log('📦 [API Client] Request body: [unparsed]')
    }
  }

  try {
    console.log('⏳ [API Client] Sending request...')
    const response = await fetch(url, config)

    console.log('📥 [API Client] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'content-type': response.headers.get('content-type'),
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as unknown
      console.error('❌ [API Client] Error response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      })

      // Log detail array if present
      if (
        typeof errorData === 'object' &&
        errorData !== null &&
        Array.isArray((errorData as { detail?: unknown }).detail)
      ) {
        const details = (errorData as { detail: unknown[] }).detail
        console.error('📋 [API Client] Validation errors:')
        details.forEach((err, idx) => {
          console.error(`  ${idx + 1}.`, err)
        })
      }

      console.log('=' .repeat(80))
      const errorDetail = (errorData as { detail?: string })?.detail
      throw new APIError(
        errorDetail || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      )
    }

    // Handle 204 No Content
    if (response.status === 204) {
      console.log('✅ [API Client] Success (204 No Content)')
      console.log('=' .repeat(80))
      return undefined as T
    }

    const data = await response.json()
    console.log('✅ [API Client] Success:', data)
    console.log('=' .repeat(80))
    return data
  } catch (error) {
    console.error('💥 [API Client] Fetch failed:', error)
    console.log('=' .repeat(80))
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0
    )
  }
}

export const api = {
  get: <T>(endpoint: string) => fetchAPI<T>(endpoint, { method: 'GET' }),
  
  post: <T, B = unknown>(endpoint: string, data: B) =>
    fetchAPI<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  patch: <T, B = unknown>(endpoint: string, data: B) =>
    fetchAPI<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: <T>(endpoint: string) =>
    fetchAPI<T>(endpoint, { method: 'DELETE' }),
}
