import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
})

const SEED_BRANDS = ['ZenTech', 'PixelBright', 'NovaGear', 'AeroCore', 'EchoWave', 'Luma', 'Orbit', 'Voltix']
const SEED_CATEGORIES = ['Headphones', 'Laptops', 'Smartphones', 'Cameras', 'Tablets', 'Speakers', 'Audio', 'Wearables']
const SEED_COLORS = ['Black', 'Silver', 'Blue', 'Space Gray', 'White', 'Forest Green', 'Rose Gold']

const money = (n) => Number(n.toFixed(2))
const toTitle = (str) => str.charAt(0).toUpperCase() + str.slice(1)

// Build a larger in-browser catalog for GitHub Pages mode.
const MOCK_PRODUCTS = Array.from({ length: 72 }, (_, i) => {
  const category = SEED_CATEGORIES[i % SEED_CATEGORIES.length]
  const brand = SEED_BRANDS[i % SEED_BRANDS.length]
  const tier = ['Core', 'Plus', 'Pro', 'Ultra'][i % 4]
  const model = 200 + i * 7
  const priceBase = 59 + (i % 12) * 34 + (category.length * 3)
  const rating = 3.3 + ((i * 3) % 14) / 10
  const reviewCount = 18 + (i % 20) * 9
  const weightKg = (0.15 + (i % 7) * 0.25).toFixed(2)
  const warranty = `${1 + (i % 3)} Year`
  const color = SEED_COLORS[i % SEED_COLORS.length]
  const productId = `SMAI${String(i + 1).padStart(4, '0')}`
  const title = `${brand} ${toTitle(category)} ${tier} ${model}`

  return {
    product_id: productId,
    title,
    brand,
    category,
    price: money(priceBase + (i % 5) * 6.49),
    average_rating: money(Math.min(rating, 4.9)),
    total_reviews: reviewCount,
    // Picsum provides deterministic CDN images by seed, good for static hosting.
    image_url: `https://picsum.photos/seed/${productId.toLowerCase()}/800/600`,
    description: `${title} is designed for everyday performance with reliable quality, smart features, and balanced value for money. Great for users who want dependable ${category.toLowerCase()} hardware without compromise.`,
    specifications: {
      Brand: brand,
      Category: category,
      Price: `$${money(priceBase + (i % 5) * 6.49)}`,
      Warranty: warranty,
      Weight: `${weightKg} kg`,
      Color: color,
    },
  }
})

// Try to fetch from backend, fallback to mock data
const fetchWithFallback = async (fn) => {
  try {
    return await fn()
  } catch (error) {
    console.warn('Backend unavailable, using mock data')
    return null
  }
}

export const fetchProducts = async ({ q, category, limit = 20, offset = 0 } = {}) => {
  const result = await fetchWithFallback(() => 
    api.get('/products', { params: { q, category, limit, offset } }).then(r => r.data)
  )
  
  if (result) return result
  
  // Mock implementation
  let filtered = MOCK_PRODUCTS
  if (category) {
    filtered = filtered.filter(p => p.category.toLowerCase().includes(category.toLowerCase()))
  }
  if (q) {
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(q.toLowerCase()) ||
      p.description.toLowerCase().includes(q.toLowerCase())
    )
  }
  
  return {
    products: filtered.slice(offset, offset + limit),
    total: filtered.length,
    offset,
    limit
  }
}

export const fetchProduct = async (productId) => {
  const result = await fetchWithFallback(() => 
    api.get(`/products/${productId}`).then(r => r.data)
  )
  
  if (result) return result
  
  // Mock implementation
  const product = MOCK_PRODUCTS.find(p => p.product_id === productId)
  if (!product) {
    throw new Error('Product not found')
  }
  return product
}

export const fetchProductAspects = async (productId) => {
  const result = await fetchWithFallback(() => 
    api.get(`/products/${productId}/aspects`).then(r => r.data)
  )
  
  if (result) return result
  
  // Mock implementation
  const idx = Number((productId || '0').replace(/\D/g, '').slice(-2)) || 1
  return {
    aspects: {
      build_quality: { positive: 40 + (idx % 20), neutral: 15 + (idx % 8), negative: 8 + (idx % 7) },
      battery_life: { positive: 36 + (idx % 18), neutral: 12 + (idx % 10), negative: 9 + (idx % 6) },
      price_value: { positive: 28 + (idx % 16), neutral: 20 + (idx % 9), negative: 12 + (idx % 5) },
      performance: { positive: 44 + (idx % 15), neutral: 11 + (idx % 7), negative: 7 + (idx % 6) },
    },
  }
}

export const askQuestion = async ({ product_id, question, top_k = 5 }) => {
  const result = await fetchWithFallback(() => 
    api.post('/ask', { product_id, question, top_k }).then(r => r.data)
  )
  
  if (result) return result
  
  // Mock implementation
  return {
    answer: `Based on the product data, the ${question.toLowerCase()}. Our analysis shows strong customer satisfaction in this area with 85% positive sentiment. This information is derived from multiple sources and cross-referenced with industry standards.`,
    confidence: 0.82,
    sources: [
      'Customer reviews',
      'Technical specifications',
      'Industry benchmarks'
    ],
    sentiment: 'positive',
    evidence_snippets: [
      'Great value for the price point',
      'Highly recommended by users',
      'Excellent performance metrics'
    ]
  }
}

export const fetchStats = async () => {
  const result = await fetchWithFallback(() => 
    api.get('/stats').then(r => r.data)
  )
  
  if (result) return result
  
  // Mock implementation
  const totalReviewChunks = MOCK_PRODUCTS.reduce((sum, p) => sum + p.total_reviews, 0)
  return {
    total_products: MOCK_PRODUCTS.length,
    total_review_chunks: totalReviewChunks,
    vector_db: 'ChromaDB',
    embedding_model: 'all-MiniLM-L6-v2',
  }
}

export default api

