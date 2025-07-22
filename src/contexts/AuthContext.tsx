import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Debug URL fragments for OAuth callback
    console.log('AuthContext - Current URL:', window.location.href)
    console.log('AuthContext - URL hash:', window.location.hash)
    console.log('AuthContext - URL search:', window.location.search)
    
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
    console.log('AuthContext - URL params:', Object.fromEntries(urlParams))
    console.log('AuthContext - Hash params:', Object.fromEntries(hashParams))
    
    // Check for preserved OAuth tokens (only on first load)
    const preservedFragment = sessionStorage.getItem('supabase_auth_fragment')
    console.log('AuthContext - Preserved fragment:', preservedFragment)
    
    if (preservedFragment && !window.location.hash) {
      console.log('AuthContext - Restoring OAuth fragment')
      window.location.hash = preservedFragment.replace('#', '')
    }
    // Always clear from storage to prevent reprocessing
    if (preservedFragment) {
      sessionStorage.removeItem('supabase_auth_fragment')
    }

    // Handle OAuth callback if present
    const handleAuthCallback = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
      }
      console.log('Initial session:', data.session)
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    }

    handleAuthCallback()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in successfully:', session.user.email)
          // Don't force redirect - let React Router handle navigation
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return { error: new Error('Supabase client not initialized') }
    }
    
    console.log('Attempting Google OAuth sign in...')
    console.log('Current URL:', window.location.href)
    console.log('Redirect URL:', `${window.location.origin}/move/`)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/move/`,
        skipBrowserRedirect: false,
        queryParams: {
          prompt: 'select_account'
        }
      }
    })
    
    if (error) {
      console.error('Google OAuth error:', error)
    } else {
      console.log('Google OAuth initiated successfully')
    }
    
    return { error }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}