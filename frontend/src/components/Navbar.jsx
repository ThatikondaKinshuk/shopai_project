import { Link, useLocation } from 'react-router-dom'
import { Cpu, Search, LayoutGrid, LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-sans font-medium tracking-wide transition-colors duration-150 pb-0.5 ${
        pathname === to
          ? 'text-ink border-b border-ink'
          : 'text-slate-500 hover:text-ink'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 bg-paper border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-ink flex items-center justify-center">
            <Cpu size={14} className="text-paper" />
          </div>
          <span className="font-display text-lg font-semibold text-ink tracking-tight">
            ShopMind<span className="text-amber font-normal italic"> AI</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-8">
          {navLink('/', 'Home')}
          {navLink('/browse', 'Browse Products')}
        </nav>

        {/* Auth section */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User size={16} className="text-forest" />
                <span className="font-semibold text-slate-700">{user.fullName}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs font-semibold text-rouge hover:text-rouge/80 transition"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-3 py-1 text-sm font-semibold text-slate-600 hover:text-ink transition">
                Log In
              </Link>
              <Link to="/signup" className="px-3 py-1 text-sm font-semibold text-white bg-forest rounded hover:bg-forest/90 transition">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-forest bg-forest-light px-3 py-1 ml-4">
          <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse-soft" />
          Ollama · Local LLM
        </div>
      </div>
    </header>
  )
}
