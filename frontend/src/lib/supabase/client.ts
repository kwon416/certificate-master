import { createBrowserClient } from '@supabase/ssr'

// Mock Supabase client for development without Supabase
const mockClient = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
    signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    signUp: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({ data: null, error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
  }),
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If environment variables are not properly set, return mock client
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_')) {
    console.warn('Supabase not configured. Using mock client for development.')
    return mockClient as ReturnType<typeof createBrowserClient>
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
