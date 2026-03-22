import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

export const fetchProducts = ({ q, category, limit = 20, offset = 0 } = {}) =>
  api.get('/products', { params: { q, category, limit, offset } }).then(r => r.data)

export const fetchProduct = (productId) =>
  api.get(`/products/${productId}`).then(r => r.data)

export const fetchProductAspects = (productId) =>
  api.get(`/products/${productId}/aspects`).then(r => r.data)

export const askQuestion = ({ product_id, question, top_k = 5 }) =>
  api.post('/ask', { product_id, question, top_k }).then(r => r.data)

export const fetchStats = () =>
  api.get('/stats').then(r => r.data)

export default api
