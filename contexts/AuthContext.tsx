"use client"

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

interface Admin {
  id: string
  name: string
  email: string
  role: string
  lastLogin?: string
}

interface AuthState {
  admin: Admin | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: Admin }
  | { type: 'AUTH_FAIL'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        admin: action.payload,
        error: null
      }
    case 'AUTH_FAIL':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        admin: null,
        error: action.payload
      }
    case 'LOGOUT':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        admin: null,
        error: null
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    default:
      return state
  }
}

const initialState: AuthState = {
  admin: null,
  isLoading: true, // Volvemos a true para verificar auth al cargar
  isAuthenticated: false,
  error: null
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Verificar autenticación al cargar la app
  useEffect(() => {
    // Solo verificar auth automáticamente si estamos en una ruta admin
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      console.log('🔍 Ruta actual:', path);

      if (path.startsWith('/admin')) {
        console.log('🔍 Verificando auth automáticamente para ruta admin')
        checkAuth()
      } else {
        // Si no estamos en ruta admin, marcar como no loading
        dispatch({ type: 'AUTH_FAIL', payload: '' })
      }
    }
  }, [])

  const checkAuth = async () => {
    try {
      console.log('🔍 Verificando autenticación...')
      dispatch({ type: 'AUTH_START' })

      const response = await fetch('http://localhost:5000/api/auth/me', {
        method: 'GET',
        credentials: 'include' // Incluir cookies
      })

      console.log('📡 Respuesta de auth/me:', response.status, response.ok)

      if (response.ok) {
        try {
          const result = await response.json()
          console.log('📄 Datos de auth/me:', result)
          if (result.success && result.data.admin) {
            console.log('✅ Usuario autenticado:', result.data.admin.email)
            dispatch({ type: 'AUTH_SUCCESS', payload: result.data.admin })
          } else {
            console.log('❌ Respuesta sin datos de admin válidos')
            dispatch({ type: 'LOGOUT' })
          }
        } catch (jsonError) {
          console.log('❌ Error parsing JSON in auth/me:', jsonError)
          dispatch({ type: 'LOGOUT' })
        }
      } else {
        const errorText = await response.text()
        console.log('❌ Error en auth/me:', response.status, errorText)
        // Solo hacer logout si es un error de autenticación, no de servidor
        if (response.status === 401 || response.status === 403) {
          dispatch({ type: 'LOGOUT' })
        } else {
          console.log('⚠️ Error de servidor, manteniendo estado actual')
          dispatch({ type: 'AUTH_FAIL', payload: 'Error temporal del servidor' })
        }
      }
    } catch (error) {
      console.error('💥 Error verificando autenticación:', error)
      dispatch({ type: 'LOGOUT' })
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔑 Intentando login para:', email)
      dispatch({ type: 'AUTH_START' })

      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      try {
        const result = await response.json()
        console.log('📡 Respuesta de login:', response.status, result)

        if (response.ok && result.success) {
          console.log('✅ Login exitoso para:', result.data.admin.email)
          dispatch({ type: 'AUTH_SUCCESS', payload: result.data.admin })
          // No llamar checkAuth inmediatamente después del login para evitar conflicts
          return true
        } else {
          console.log('❌ Login falló:', result.message)
          dispatch({ type: 'AUTH_FAIL', payload: result.message || 'Error al iniciar sesión' })
          return false
        }
      } catch (jsonError) {
        console.log('❌ Error parsing JSON in login:', jsonError)
        dispatch({ type: 'AUTH_FAIL', payload: 'Error de respuesta del servidor' })
        return false
      }
    } catch (error) {
      console.error('💥 Error en login:', error)
      dispatch({ type: 'AUTH_FAIL', payload: 'Error de conexión. Inténtalo más tarde.' })
      return false
    }
  }

  const logout = async () => {
    try {
      // Intentar logout en el servidor
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Error en logout del servidor:', error)
    } finally {
      // Siempre limpiar estado local
      dispatch({ type: 'LOGOUT' })
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    checkAuth
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}