import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import BrowsePage from './pages/BrowsePage'

export default function App() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"                   element={<HomePage />} />
          <Route path="/browse"             element={<BrowsePage />} />
          <Route path="/product/:productId" element={<ProductPage />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs font-mono text-slate-400 bg-paper">
        ShopMind AI · Explainable Product Intelligence · Built with ChromaDB + Ollama + React
      </footer>
    </div>
  )
}
