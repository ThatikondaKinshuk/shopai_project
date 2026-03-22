import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('shopai_user')
    const savedActivities = localStorage.getItem('shopai_activities')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    if (savedActivities) {
      setActivities(JSON.parse(savedActivities))
    }
    setLoading(false)
  }, [])

  const signup = (email, password, fullName) => {
    if (!email || !password || !fullName) {
      throw new Error('All fields are required')
    }
    if (email.length < 5) {
      throw new Error('Email must be at least 5 characters')
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      fullName,
      createdAt: new Date().toISOString(),
    }

    setUser(newUser)
    localStorage.setItem('shopai_user', JSON.stringify(newUser))
    
    trackActivity('signup', { email })
    return newUser
  }

  const login = (email, password) => {
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      fullName: email.split('@')[0],
      createdAt: new Date().toISOString(),
    }

    setUser(newUser)
    localStorage.setItem('shopai_user', JSON.stringify(newUser))
    
    trackActivity('login', { email })
    return newUser
  }

  const logout = () => {
    trackActivity('logout', { email: user?.email })
    setUser(null)
    localStorage.removeItem('shopai_user')
  }

  const trackActivity = (action, details = {}) => {
    const activity = {
      id: Date.now().toString(),
      action,
      userId: user?.id,
      userEmail: user?.email,
      details,
      timestamp: new Date().toISOString(),
    }

    setActivities(prev => [activity, ...prev])
    localStorage.setItem('shopai_activities', JSON.stringify([activity, ...activities]))
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, trackActivity, activities }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
