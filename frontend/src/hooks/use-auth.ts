'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import type { AuthUser } from '@/types'

interface UseAuthReturn {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const { user: storeUser, setUser, logout } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const checkSession = useCallback(async () => {
    try {
      setIsChecking(true)
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Session check error:', error)
        logout()
        return
      }

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        })
      } else {
        logout()
      }
    } catch (error) {
      console.error('Unexpected session check error:', error)
      logout()
    } finally {
      setIsChecking(false)
    }
  }, [logout, setUser, supabase])

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [checkSession])

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', session?.user?.email)

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          })
        } else {
          logout()
        }

        setIsChecking(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [logout, setUser, supabase])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      logout()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      // Force logout even if API call fails
      logout()
      router.push('/')
    }
  }

  return {
    user: storeUser,
    isLoading: isChecking,
    isAuthenticated: !!storeUser,
    signOut,
    checkSession,
  }
}
