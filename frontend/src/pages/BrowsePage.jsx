import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, Star, ChevronRight } from 'lucide-react'
import { fetchProducts } from '../utils/api'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['All', 'Headphones', 'Laptops', 'Smartphones', 'Cameras', 'Tablets', 'Speakers', 'Audio', 'Wearables']

function ProductCard({ product, onProductClick }) {
  const navigate = useNavigate()
  const ratingColor = product.average_rating >= 4.2 ? 'text-forest' : product.average_rating >= 3.5 ? 'text-amber' : 'text-rouge'

  const handleClick = () => {
    onProductClick(product)
    navigate(`/product/${product.product_id}`)
  }

  return (
    <article
      onClick={handleClick}
      className="card bg-white p-6 cursor-pointer group hover:shadow-md transition-shadow duration-200 animate-slide-up flex flex-col"
    >
      {/* Category badge */}
      <div className="mb-4">
        <span className="badge bg-slate-100 text-slate-600 font-mono">{product.category}</span>
      </div>

      {/* Product icon placeholder */}
      <div className="w-full h-32 bg-slate-50 border border-slate-100 flex items-center justify-center mb-5 group-hover:bg-slate-100 transition-colors">
        <div className="font-display text-4xl text-slate-200 select-none">
          {product.title.charAt(0)}
        </div>
      </div>

      <div className="flex-1">
        <p className="text-xs font-mono text-slate-400 mb-1">{product.brand}</p>
        <h3 className="font-display text-base font-semibold text-ink mb-3 leading-snug group-hover:text-amber-dark transition-colors">
          {product.title}
        </h3>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          <div>
            <div className="font-mono text-lg font-semibold text-ink">${product.price}</div>
            <div className={`flex items-center gap-1 text-xs font-mono ${ratingColor}`}>
              <Star size={11} fill="currentColor" />
              {product.average_rating} ({product.total_reviews} reviews)
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-ink transition-colors" />
        </div>
      </div>
    </article>
  )
}

function SkeletonCard() {
  return (
    <div className="card bg-white p-6">
      <div className="shimmer h-4 w-20 mb-4 rounded" />
      <div className="shimmer h-32 w-full mb-5 rounded" />
      <div className="shimmer h-3 w-16 mb-2 rounded" />
      <div className="shimmer h-5 w-3/4 mb-1 rounded" />
      <div className="shimmer h-5 w-1/2 rounded" />
    </div>
  )
}

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '')
  const [activeCategory, setActiveCategory] = useState('All')
  const { trackActivity, user } = useAuth()

  const q = searchParams.get('q') || undefined
  const category = activeCategory === 'All' ? undefined : activeCategory

  const { data, isLoading } = useQuery({
    queryKey: ['products', q, category],
    queryFn: () => fetchProducts({ q, category, limit: 40 }),
  })

  const products = data?.products || []

  const handleSearch = (e) => {
    e.preventDefault()
    if (user) {
      trackActivity('search', { query: inputVal, category })
    }
    setSearchParams(inputVal ? { q: inputVal } : {})
  }

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat)
    if (user) {
      trackActivity('filter_category', { category: cat })
    }
  }

  const handleProductClick = (product) => {
    if (user) {
      trackActivity('view_product', { productId: product.product_id, productName: product.title })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <p className="section-label mb-2">Product Catalog</p>
        <h1 className="font-display text-4xl text-ink">Browse &amp; Ask</h1>
        <p className="text-slate-500 text-sm mt-2 font-sans">
          Select any product to ask AI-powered questions grounded in real reviews.
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex flex-1 gap-0">
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Search by name, brand, or category…"
            className="input-base flex-1"
          />
          <button type="submit" className="btn-primary flex items-center gap-2 px-5">
            <Search size={15} />
          </button>
        </form>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`text-xs font-mono px-4 py-2 border transition-colors duration-150 ${
              activeCategory === cat
                ? 'bg-ink text-paper border-ink'
                : 'bg-white border-slate-200 text-slate-600 hover:border-ink hover:text-ink'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs font-mono text-slate-400 mb-5">
        {isLoading ? 'Loading…' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
      </p>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map(p => <ProductCard key={p.product_id} product={p} onProductClick={handleProductClick} />)
        }
      </div>

      {!isLoading && products.length === 0 && (
        <div className="text-center py-24 text-slate-400">
          <p className="font-display text-2xl mb-2">No products found</p>
          <p className="text-sm font-sans">Try a different search term or category</p>
        </div>
      )}
    </div>
  )
}
