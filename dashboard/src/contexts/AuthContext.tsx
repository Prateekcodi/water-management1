import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase, User } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isUser: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Start with no user - require login
    setUser(null)
    setLoading(false)
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        setLoading(false)
        return
      }

      setUser(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    // Mock authentication
    if (email === 'admin@smartaqua.com' && password === 'admin123') {
      const mockUser: User = {
        id: 'admin-user-1',
        email: 'admin@smartaqua.com',
        full_name: 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setUser(mockUser)
      return { error: null }
    } else if (email === 'user@smartaqua.com' && password === 'user123') {
      const mockUser: User = {
        id: 'regular-user-1',
        email: 'user@smartaqua.com',
        full_name: 'Regular User',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setUser(mockUser)
      return { error: null }
    } else {
      return { error: { message: 'Invalid email or password' } }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    // Mock sign up - create a new user
    const mockUser: User = {
      id: `user-${Date.now()}`,
      email: email,
      full_name: fullName,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setUser(mockUser)
    return { error: null }
  }

  const signOut = async () => {
    setUser(null)
    setSession(null)
  }

  const isAdmin = user?.role === 'admin'
  const isUser = user?.role === 'user'

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}