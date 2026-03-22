import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Star, Send, ChevronLeft, Cpu, Shield, AlertCircle,
  ThumbsUp, Minus, ThumbsDown, Loader2, BookOpen, Tag
} from 'lucide-react'
import { fetchProduct, fetchProductAspects, askQuestion } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import ConfidenceMeter from '../components/ConfidenceMeter'
import SentimentBar from '../components/SentimentBar'
import EvidencePanel from '../components/EvidencePanel'
import AspectRadar from '../components/AspectRadar'

const buildSuggestedQuestions = (product, analyticsSummary) => {
  const category = product?.category || 'product'
  const brand = product?.brand || 'this brand'
  const price = product?.price || ''
  const preferredBrand = analyticsSummary?.preferences?.brand
  const preferredCategory = analyticsSummary?.preferences?.category

  const base = [
    `Is this ${category.toLowerCase()} worth $${price}?`,
    `How does ${brand} compare with alternatives in ${category.toLowerCase()}?`,
    `What are the most common complaints about this ${category.toLowerCase()}?`,
    `Is build quality reliable for long-term use?`,
    `Who should buy this and who should avoid it?`,
    `What are the top pros and cons from reviews?`,
  ]

  if (preferredBrand && preferredBrand !== brand) {
    base.unshift(`Compare this with ${preferredBrand} models in the same price range.`)
  }
  if (preferredCategory && preferredCategory === category) {
    base.unshift(`How does this rank among top-rated ${category.toLowerCase()} options?`)
  }

  return Array.from(new Set(base)).slice(0, 8)
}

function SentimentIcon({ sentiment }) {
  if (sentiment === 'positive') return <ThumbsUp size={12} className="text-forest" />
  if (sentiment === 'negative') return <ThumbsDown size={12} className="text-rouge" />
  return <Minus size={12} className="text-amber" />
}

export default function ProductPage() {
  const { productId } = useParams()
  const [question, setQuestion] = useState('')
  const [qaHistory, setQaHistory] = useState([])
  const answerRef = useRef(null)
  const viewTrackedRef = useRef('')
  const { trackActivity, user, getAnalyticsSummary } = useAuth()
  const analyticsSummary = getAnalyticsSummary()

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
  })

  const { data: aspectData } = useQuery({
    queryKey: ['aspects', productId],
    queryFn: () => fetchProductAspects(productId),
  })

  const askMutation = useMutation({
    mutationFn: (q) => askQuestion({ product_id: productId, question: q }),
    onSuccess: (data, variables) => {
      setQaHistory(prev => [{ question: variables, ...data, id: Date.now() }, ...prev])
      setQuestion('')
      if (user) {
        trackActivity('ask_question', { productId, question: variables })
      }
      setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    },
  })

  const handleAsk = (q) => {
    const trimmed = (q || question).trim()
    if (!trimmed) return
    askMutation.mutate(trimmed)
  }

  useEffect(() => {
    if (!product || !user) return
    if (viewTrackedRef.current === product.product_id) return
    viewTrackedRef.current = product.product_id
    trackActivity('view_product', {
      productId: product.product_id,
      productName: product.title,
      category: product.category,
      brand: product.brand,
      price: product.price,
    })
  }, [product?.product_id])

  if (productLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 animate-fade-in">
        <div className="shimmer h-6 w-32 mb-8 rounded" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="shimmer h-64 w-full rounded mb-4" />
            <div className="shimmer h-4 w-3/4 rounded mb-2" />
            <div className="shimmer h-4 w-1/2 rounded" />
          </div>
          <div className="md:col-span-2">
            <div className="shimmer h-16 w-full rounded mb-4" />
            <div className="shimmer h-40 w-full rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-32 text-slate-400">
        <AlertCircle size={32} className="mx-auto mb-4" />
        <p className="font-display text-2xl">Product not found</p>
        <Link to="/browse" className="text-sm text-amber hover:underline mt-2 inline-block">← Back to browse</Link>
      </div>
    )
  }

  const ratingColor = product.average_rating >= 4.2 ? 'text-forest' : product.average_rating >= 3.5 ? 'text-amber' : 'text-rouge'
  const suggestedQuestions = buildSuggestedQuestions(product, analyticsSummary)

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-fade-in">
      {/* Breadcrumb */}
      <Link to="/browse" className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-ink mb-8 transition-colors">
        <ChevronLeft size={13} /> Browse Products
      </Link>

      <div className="grid md:grid-cols-5 gap-8 mb-12">
        {/* LEFT: Product info */}
        <aside className="md:col-span-2 space-y-5">
          {/* Product card */}
          <div className="card bg-white p-6">
            <div className="w-full h-52 bg-slate-50 border border-slate-100 mb-5 overflow-hidden">
              <img
                src={product.image_url}
                alt={product.title}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.nextElementSibling
                  if (fallback) fallback.style.display = 'flex'
                }}
                className="w-full h-full object-cover"
              />
              <div className="hidden w-full h-full items-center justify-center bg-slate-100">
                <span className="font-display text-6xl text-slate-300">{product.title.charAt(0)}</span>
              </div>
            </div>

            <span className="badge bg-slate-100 text-slate-600 font-mono mb-3 inline-block">{product.category}</span>
            <p className="text-xs font-mono text-slate-400 mb-1">{product.brand}</p>
            <h1 className="font-display text-xl font-semibold text-ink mb-3 leading-snug">{product.title}</h1>

            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-2xl font-semibold text-ink">${product.price}</span>
              <div className={`flex items-center gap-1 text-xs font-mono ${ratingColor}`}>
                <Star size={12} fill="currentColor" />
                {product.average_rating} · {product.total_reviews} reviews
              </div>
            </div>

            {product.external_url && (
              <a
                href={product.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-mono px-3 py-2 border border-ink text-ink hover:bg-ink hover:text-paper transition-colors mb-4"
              >
                Open Product Page
              </a>
            )}

            <p className="text-sm text-slate-500 leading-relaxed font-sans">{product.description}</p>
          </div>

          {/* Specs */}
          {product.specifications && (
            <div className="card bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag size={14} className="text-slate-400" />
                <p className="section-label">Specifications</p>
              </div>
              <div className="space-y-2">
                {Object.entries(product.specifications).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">{k}</span>
                    <span className="text-ink font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aspect chart */}
          {aspectData?.aspects && Object.keys(aspectData.aspects).length > 0 && (
            <div className="card bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={14} className="text-slate-400" />
                <p className="section-label">Aspect Sentiment</p>
              </div>
              <AspectRadar aspects={aspectData.aspects} />
            </div>
          )}
        </aside>

        {/* RIGHT: QA panel */}
        <div className="md:col-span-3 space-y-5">
          {/* Question input */}
          <div className="card bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-ink flex items-center justify-center">
                <Cpu size={12} className="text-paper" />
              </div>
              <p className="font-display text-lg font-semibold">Ask about this product</p>
            </div>

            <div className="flex gap-0">
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAsk()}
                placeholder="e.g. How long does the battery last?"
                className="input-base flex-1"
                disabled={askMutation.isPending}
              />
              <button
                onClick={() => handleAsk()}
                disabled={askMutation.isPending || !question.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {askMutation.isPending
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Send size={15} />
                }
              </button>
            </div>

            {/* Suggested questions */}
            <div className="mt-4">
              <p className="section-label mb-2">Suggested questions</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map(q => (
                  <button
                    key={q}
                    onClick={() => handleAsk(q)}
                    disabled={askMutation.isPending}
                    className="text-xs font-mono px-3 py-1.5 border border-slate-200 text-slate-600 hover:border-ink hover:text-ink transition-colors duration-150 disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading state */}
          {askMutation.isPending && (
            <div className="card bg-white p-6 animate-pulse-soft">
              <div className="flex items-center gap-3 text-slate-400 text-sm font-mono">
                <Loader2 size={16} className="animate-spin text-amber" />
                Retrieving from ChromaDB · Generating with Ollama…
              </div>
            </div>
          )}

          {/* Error state */}
          {askMutation.isError && (
            <div className="card bg-rouge-light border-rouge/20 p-5 flex gap-3 items-start">
              <AlertCircle size={16} className="text-rouge mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-rouge mb-1">Backend error</p>
                <p className="text-xs text-rouge/80 font-mono">
                  {askMutation.error?.response?.data?.detail || 'Make sure the FastAPI server is running on port 8000.'}
                </p>
              </div>
            </div>
          )}

          {/* QA History */}
          <div ref={answerRef} className="space-y-5">
            {qaHistory.map((entry) => (
              <div key={entry.id} className="card bg-white overflow-hidden animate-slide-up">
                {/* Question */}
                <div className="bg-slate-50 border-b border-slate-100 px-6 py-3">
                  <p className="text-xs font-mono text-slate-400 mb-1">Question</p>
                  <p className="font-sans text-sm font-medium text-ink">{entry.question}</p>
                </div>

                {/* Answer */}
                <div className="px-6 py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 bg-ink flex items-center justify-center">
                      <Cpu size={10} className="text-paper" />
                    </div>
                    <p className="section-label">AI Answer</p>
                    <span className="ml-auto badge bg-slate-100 text-slate-500 font-mono text-[10px]">
                      {entry.aspect_detected} · {entry.response_time_ms}ms
                    </span>
                  </div>

                  <p className="font-sans text-sm text-ink leading-relaxed mb-5">{entry.answer}</p>

                  {/* Confidence + Sentiment */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <p className="section-label mb-2">Confidence</p>
                      <ConfidenceMeter value={entry.confidence} />
                    </div>
                    <div>
                      <p className="section-label mb-2">Sentiment breakdown</p>
                      <SentimentBar summary={entry.sentiment_summary} />
                    </div>
                  </div>

                  {/* Evidence */}
                  {entry.evidence?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen size={13} className="text-slate-400" />
                        <p className="section-label">Supporting evidence</p>
                      </div>
                      <EvidencePanel evidence={entry.evidence} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {qaHistory.length === 0 && !askMutation.isPending && (
            <div className="border border-dashed border-slate-200 p-10 text-center text-slate-300">
              <Cpu size={28} className="mx-auto mb-3 opacity-40" />
              <p className="font-display text-lg">Your answers will appear here</p>
              <p className="text-xs font-mono mt-1">Ask a question above to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
