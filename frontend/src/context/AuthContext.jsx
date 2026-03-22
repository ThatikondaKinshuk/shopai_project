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

    setActivities((prev) => {
      const next = [activity, ...prev].slice(0, 500)
      localStorage.setItem('shopai_activities', JSON.stringify(next))
      return next
    })
  }

  const getAnalyticsSummary = () => {
    const counts = {
      searches: 0,
      productViews: 0,
      questionsAsked: 0,
      brandFilters: 0,
      categoryFilters: 0,
      priceFilters: 0,
    }

    const top = {
      categories: {},
      brands: {},
      priceRanges: {},
      queries: {},
    }

    activities.forEach((a) => {
      if (a.action === 'search') {
        counts.searches += 1
        const q = a.details?.query?.trim()
        if (q) top.queries[q] = (top.queries[q] || 0) + 1
      }
      if (a.action === 'view_product') counts.productViews += 1
      if (a.action === 'ask_question') counts.questionsAsked += 1
      if (a.action === 'filter_brand') {
        counts.brandFilters += 1
        const b = a.details?.brand
        if (b && b !== 'All Brands') top.brands[b] = (top.brands[b] || 0) + 1
      }
      if (a.action === 'filter_category') {
        counts.categoryFilters += 1
        const c = a.details?.category
        if (c && c !== 'All') top.categories[c] = (top.categories[c] || 0) + 1
      }
      if (a.action === 'filter_price_range') {
        counts.priceFilters += 1
        const p = a.details?.priceRange
        if (p && p !== 'all') top.priceRanges[p] = (top.priceRanges[p] || 0) + 1
      }
    })

    const pickTop = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0]

    return {
      counts,
      preferences: {
        category: pickTop(top.categories),
        brand: pickTop(top.brands),
        priceRange: pickTop(top.priceRanges),
        query: pickTop(top.queries),
      },
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signup, login, logout, trackActivity, activities, getAnalyticsSummary }}
    >
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
