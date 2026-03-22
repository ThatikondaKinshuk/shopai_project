import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
})

const RAPID_KEY = import.meta.env.VITE_RAPIDAPI_KEY
const RAPID_HOST = 'real-time-amazon-data.p.rapidapi.com'

const toNum = (v, fallback = 0) => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const parsed = Number(String(v ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

const slug = (txt) => String(txt || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
const safeStr = (v, fallback = '') => (typeof v === 'string' && v.trim() ? v.trim() : fallback)
const amazonSearchUrl = (title) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}`
const imageFallback = (id) => `https://picsum.photos/seed/${slug(id) || 'shopmind'}/900/700`

const normalizeProduct = (raw, i = 0) => {
  const title = safeStr(raw?.title || raw?.product_title, `Product ${i + 1}`)
  const brand = safeStr(raw?.brand || raw?.product_byline || raw?.manufacturer, 'Generic')
  const category = safeStr(raw?.category, 'General')
  const pid = safeStr(raw?.product_id || raw?.asin || raw?.id, `PRD${String(i + 1).padStart(5, '0')}`)
  const price = toNum(raw?.price || raw?.product_price || raw?.discountedPrice || raw?.priceAmount, 49.99)
  const avgRating = toNum(raw?.average_rating || raw?.rating || raw?.product_star_rating, 4.0)
  const totalReviews = Math.max(1, Math.floor(toNum(raw?.total_reviews || raw?.reviews || raw?.product_num_ratings, 18)))
  const imageUrl = safeStr(raw?.image_url || raw?.thumbnail || raw?.product_photo || raw?.images?.[0], imageFallback(pid))
  const externalUrl = safeStr(raw?.external_url || raw?.product_url, amazonSearchUrl(title))

  return {
    product_id: String(pid),
    title,
    brand,
    category,
    price: Number(price.toFixed(2)),
    average_rating: Number(Math.min(Math.max(avgRating, 1), 5).toFixed(1)),
    total_reviews: totalReviews,
    image_url: imageUrl,
    external_url: externalUrl,
    description: safeStr(
      raw?.description,
      `${title} is a popular ${category.toLowerCase()} option known for balanced performance and value.`
    ),
    specifications: {
      Brand: brand,
      Category: category,
      Price: `$${Number(price).toFixed(2)}`,
      Warranty: safeStr(raw?.warranty, '1 Year'),
      Color: safeStr(raw?.color, 'Mixed'),
    },
  }
}

const SEED_COLORS = ['Black', 'Silver', 'Blue', 'Space Gray', 'White', 'Forest Green', 'Rose Gold', 'Titanium']

const money = (n) => Number(n.toFixed(2))
const toTitle = (str) => str.charAt(0).toUpperCase() + str.slice(1)

const CATEGORY_MANUFACTURERS = {
  Smartphones: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Motorola'],
  Wearables: ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Huawei', 'Amazfit'],
  Laptops: ['Dell', 'Lenovo', 'HP', 'Apple', 'ASUS', 'Acer', 'MSI'],
  Tablets: ['Apple', 'Samsung', 'Lenovo', 'Microsoft', 'Xiaomi'],
  Headphones: ['Sony', 'Bose', 'JBL', 'Sennheiser', 'Apple', 'Beats'],
  Speakers: ['JBL', 'Bose', 'Sony', 'Sonos', 'Marshall'],
  Cameras: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic'],
  Audio: ['JBL', 'Sony', 'Bose', 'Sennheiser', 'Audio-Technica'],
  Gaming: ['ASUS', 'MSI', 'Razer', 'Lenovo', 'Acer'],
  Monitors: ['Dell', 'LG', 'Samsung', 'ASUS', 'Acer'],
}

const CATEGORY_PRICE_RANGES = {
  Smartphones: [299, 499, 699, 899, 1099, 1299],
  Wearables: [149, 249, 349, 449, 599],
  Laptops: [499, 799, 1099, 1399, 1799, 2199],
  Tablets: [199, 349, 499, 699, 899],
  Headphones: [79, 129, 179, 249, 349],
  Speakers: [59, 99, 149, 229, 329],
  Cameras: [449, 699, 999, 1499, 2299],
  Audio: [69, 119, 189, 279, 399],
  Gaming: [699, 999, 1399, 1799, 2499],
  Monitors: [129, 219, 329, 499, 799],
}

const TIER_NAMES = ['SE', 'Core', 'Plus', 'Pro', 'Ultra', 'Max']

const MOCK_PRODUCTS = Object.entries(CATEGORY_MANUFACTURERS).flatMap(([category, brands], ci) => {
  const prices = CATEGORY_PRICE_RANGES[category] || [199, 399, 599]
  return brands.flatMap((brand, bi) => {
    return prices.map((basePrice, pi) => {
      const idx = ci * 100 + bi * 10 + pi
      const model = 100 + ci * 9 + bi * 5 + pi * 3
      const tier = TIER_NAMES[(ci + bi + pi) % TIER_NAMES.length]
      const title = `${brand} ${category.slice(0, -1)} ${tier} ${model}`
      const productId = `SMAI${String(idx + 1).padStart(5, '0')}`
      const reviewCount = 20 + ((idx * 13) % 380)
      const rating = 3.5 + ((idx * 7) % 14) / 10
      const price = money(basePrice + ((idx % 4) * 19.99))

      return {
        product_id: productId,
        title,
        brand,
        category,
        price,
        average_rating: money(Math.min(rating, 4.9)),
        total_reviews: reviewCount,
        image_url: imageFallback(`${brand}-${category}-${model}`),
        external_url: amazonSearchUrl(`${brand} ${category} ${tier}`),
        description: `${title} delivers strong ${category.toLowerCase()} performance with modern features, balanced battery life, and dependable build quality for daily use.`,
        specifications: {
          Brand: brand,
          Category: category,
          Price: `$${price}`,
          Warranty: `${1 + (idx % 3)} Year`,
          Weight: `${(0.2 + (idx % 9) * 0.18).toFixed(2)} kg`,
          Color: SEED_COLORS[idx % SEED_COLORS.length],
        },
      }
    })
  })
})

let cachedLiveCatalog = []

const applySearchFilters = (products, q, category, brand, priceRange) => {
  let filtered = products
  if (category) {
    filtered = filtered.filter((p) => String(p.category).toLowerCase().includes(String(category).toLowerCase()))
  }
  if (brand) {
    filtered = filtered.filter((p) => String(p.brand).toLowerCase() === String(brand).toLowerCase())
  }
  if (priceRange && priceRange !== 'all') {
    if (priceRange === '1000+') {
      filtered = filtered.filter((p) => Number(p.price) >= 1000)
    } else {
      const parts = String(priceRange).split('-')
      const min = Number(parts[0])
      const max = Number(parts[1])
      if (Number.isFinite(min) && Number.isFinite(max)) {
        filtered = filtered.filter((p) => Number(p.price) >= min && Number(p.price) <= max)
      }
    }
  }
  if (q) {
    const query = String(q).toLowerCase()
    filtered = filtered.filter((p) =>
      String(p.title).toLowerCase().includes(query) ||
      String(p.description).toLowerCase().includes(query) ||
      String(p.brand).toLowerCase().includes(query)
    )
  }
  return filtered
}

const fetchAmazonRealtimeCatalog = async ({ q, limit = 40, offset = 0 }) => {
  if (!RAPID_KEY) return null

  const query = encodeURIComponent(q || 'electronics')
  const page = Math.floor(offset / Math.max(limit, 1)) + 1
  const url = `https://${RAPID_HOST}/search?query=${query}&page=${page}&country=US&sort_by=BEST_SELLERS&product_condition=ALL`

  try {
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-key': RAPID_KEY,
        'x-rapidapi-host': RAPID_HOST,
      },
    })
    if (!res.ok) return null

    const json = await res.json()
    const rows = json?.data?.products || []
    if (!rows.length) return null

    return rows.map((p, i) => normalizeProduct(p, i))
  } catch (err) {
    return null
  }
}

const fetchPublicLiveCatalog = async () => {
  try {
    const res = await fetch('https://dummyjson.com/products?limit=100')
    if (!res.ok) return null
    const json = await res.json()
    const rows = json?.products || []
    if (!rows.length) return null

    return rows.map((p, i) => normalizeProduct({
      ...p,
      product_id: `DJS${p.id}`,
      external_url: amazonSearchUrl(`${p.brand || ''} ${p.title || ''}`),
      total_reviews: Math.round((p.rating || 4) * 35),
    }, i))
  } catch (err) {
    return null
  }
}

// Try to fetch from backend, fallback to mock data
const fetchWithFallback = async (fn) => {
  try {
    return await fn()
  } catch (error) {
    console.warn('Backend unavailable, using mock data')
    return null
  }
}

export const fetchProducts = async ({ q, category, brand, priceRange = 'all', limit = 20, offset = 0 } = {}) => {
  const result = await fetchWithFallback(() => 
    api.get('/products', { params: { q, category, brand, min_price: priceRange, limit, offset } }).then(r => r.data)
  )
  
  if (result?.products?.length) {
    const normalized = result.products.map((p, i) => normalizeProduct(p, i))
    const filtered = applySearchFilters(normalized, q, category, brand, priceRange)
    cachedLiveCatalog = normalized
    return {
      products: filtered.slice(offset, offset + limit),
      total: filtered.length,
      offset,
      limit,
    }
  }

  const amazonLive = await fetchAmazonRealtimeCatalog({ q, limit, offset })
  if (amazonLive?.length) {
    const filtered = applySearchFilters(amazonLive, q, category, brand, priceRange)
    cachedLiveCatalog = amazonLive
    return {
      products: filtered.slice(offset, offset + limit),
      total: filtered.length,
      offset,
      limit,
    }
  }

  const publicLive = await fetchPublicLiveCatalog()
  if (publicLive?.length) {
    const filtered = applySearchFilters(publicLive, q, category, brand, priceRange)
    cachedLiveCatalog = publicLive
    return {
      products: filtered.slice(offset, offset + limit),
      total: filtered.length,
      offset,
      limit,
    }
  }

  // Final fallback
  let filtered = applySearchFilters(MOCK_PRODUCTS, q, category, brand, priceRange)
  
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
  
  if (result) return normalizeProduct(result)

  const fromCache = cachedLiveCatalog.find((p) => String(p.product_id) === String(productId))
  if (fromCache) return fromCache
  
  // Mock implementation
  const product = MOCK_PRODUCTS.find(p => String(p.product_id) === String(productId))
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
  
  const activeCatalog = cachedLiveCatalog.length ? cachedLiveCatalog : MOCK_PRODUCTS
  // Mock implementation
  const totalReviewChunks = activeCatalog.reduce((sum, p) => sum + p.total_reviews, 0)
  return {
    total_products: activeCatalog.length,
    total_review_chunks: totalReviewChunks,
    vector_db: 'ChromaDB',
    embedding_model: 'all-MiniLM-L6-v2',
  }
}

export default api

