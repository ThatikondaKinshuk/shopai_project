import { Link, useLocation } from 'react-router-dom'
import { Cpu, Search, LayoutGrid } from 'lucide-react'

export default function Navbar() {
  const { pathname } = useLocation()

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

        {/* Status badge */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-forest bg-forest-light px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse-soft" />
          Ollama · Local LLM
        </div>
      </div>
    </header>
  )
}
