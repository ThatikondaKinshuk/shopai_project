import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import BrowsePage from './pages/BrowsePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/"                   element={<HomePage />} />
            <Route path="/login"              element={<LoginPage />} />
            <Route path="/signup"             element={<SignupPage />} />
            <Route path="/browse"             element={<BrowsePage />} />
            <Route path="/product/:productId" element={<ProductPage />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs font-mono text-slate-400 bg-paper">
          ShopMind AI · Explainable Product Intelligence · Built with ChromaDB + Ollama + React
        </footer>
      </div>
    </AuthProvider>
  )
}
