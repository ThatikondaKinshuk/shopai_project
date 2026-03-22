import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
})

// Mock products data for demo
const MOCK_PRODUCTS = [
  {
    product_id: "281620DF23",
    title: "ZenTech Tablets Pro 600",
    brand: "ZenTech",
    category: "Tablets",
    price: 115.9,
    average_rating: 3.6,
    total_reviews: 30,
    description: "The ZenTech Tablets Pro features advanced technology designed for everyday use. With premium build quality and outstanding performance, this tablets delivers an exceptional experience.",
    specifications: {
      Brand: "ZenTech",
      Category: "Tablets",
      Price: "$115.9",
      Warranty: "2 Year",
      Weight: "2.4 kg",
      Color: "Space Gray"
    }
  },
  {
    product_id: "D1D2B3804B",
    title: "PixelBright Tablets Pro 900",
    brand: "PixelBright",
    category: "Tablets",
    price: 363.88,
    average_rating: 3.7,
    total_reviews: 30,
    description: "The PixelBright Tablets Pro features advanced technology designed for everyday use. With premium build quality and outstanding performance.",
    specifications: {
      Brand: "PixelBright",
      Category: "Tablets",
      Price: "$363.88",
      Warranty: "2 Year",
      Weight: "2.0 kg",
      Color: "Silver"
    }
  },
  {
    product_id: "AB3F8512E5",
    title: "ZenTech Headphones Pro 500",
    brand: "ZenTech",
    category: "Headphones",
    price: 103.47,
    average_rating: 3.4,
    total_reviews: 30,
    description: "The ZenTech Headphones Pro features advanced technology designed for everyday use. Crystal clear sound and comfortable fit.",
    specifications: {
      Brand: "ZenTech",
      Category: "Headphones",
      Price: "$103.47",
      Warranty: "1 Year",
      Weight: "0.25 kg",
      Color: "Black"
    }
  },
  {
    product_id: "C4E5F6G7H8",
    title: "SoundWave Bluetooth Speaker",
    brand: "SoundWave",
    category: "Audio",
    price: 89.99,
    average_rating: 4.2,
    total_reviews: 45,
    description: "Premium wireless speaker with 360-degree sound and 12-hour battery life. Perfect for outdoor adventures.",
    specifications: {
      Brand: "SoundWave",
      Category: "Audio",
      Price: "$89.99",
      Warranty: "1 Year",
      Weight: "0.6 kg",
      Color: "Blue"
    }
  },
  {
    product_id: "I9J0K1L2M3",
    title: "SmartWatch Pro Edition",
    brand: "SmartWatch",
    category: "Wearables",
    price: 249.99,
    average_rating: 4.1,
    total_reviews: 60,
    description: "Advanced smartwatch with fitness tracking, heart rate monitor, and 5-day battery life.",
    specifications: {
      Brand: "SmartWatch",
      Category: "Wearables",
      Price: "$249.99",
      Warranty: "2 Year",
      Weight: "0.05 kg",
      Color: "Space Black"
    }
  }
]

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
  return {
    aspects: [
      { name: 'build_quality', score: 0.85, sentiment: 'positive' },
      { name: 'battery_life', score: 0.78, sentiment: 'positive' },
      { name: 'price_value', score: 0.72, sentiment: 'neutral' },
      { name: 'performance', score: 0.88, sentiment: 'positive' },
    ]
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
  return {
    total_products: MOCK_PRODUCTS.length,
    total_reviews: 165,
    avg_rating: 3.8
  }
}

export default api

