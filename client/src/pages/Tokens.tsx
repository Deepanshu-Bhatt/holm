import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPackages, createOrder, verifyPayment, getTokenHistory } from '../api/tokens'
import type { TokenPackage, TokenTransaction } from '../types'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function Tokens() {
  const { user, updateTokens } = useAuth()
  const navigate = useNavigate()

  const [packages, setPackages] = useState<TokenPackage[]>([])
  const [history, setHistory] = useState<TokenTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchPackages()
    fetchHistory()
    loadRazorpay()
  }, [])

  const loadRazorpay = () => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    document.body.appendChild(script)
  }

  const fetchPackages = async () => {
    const data = await getPackages()
    setPackages(data)
  }

  const fetchHistory = async () => {
    try {
      const data = await getTokenHistory()
      setHistory(data)
    } catch (err) {
      console.error('Failed to fetch history')
    }
  }

  const handlePurchase = async (pkg: TokenPackage) => {
    setError('')
    setSuccess('')
    setLoading(true)
    setSelectedPkg(pkg.id)

    try {
      const order = await createOrder(pkg.id)

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'HOLM',
        description: `${pkg.name} - ${pkg.tokens} tokens`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            const result = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            updateTokens(result.newTokenBalance)
            setSuccess(`✅ Successfully added ${pkg.tokens} tokens!`)
            fetchHistory()
          } catch {
            setError('Payment verification failed')
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#2563eb' },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create order')
    } finally {
      setLoading(false)
      setSelectedPkg(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/dashboard')} className="text-2xl font-bold text-white">
          HOLM
        </button>
        <div className="flex items-center gap-4">
          <div className="bg-blue-600/20 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium">
            🪙 {user?.tokens} tokens
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white text-sm">
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        <h2 className="text-3xl font-bold mb-2">Buy Tokens</h2>
        <p className="text-gray-400 mb-8">Purchase tokens to search PDFs and generate AI notes</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {success}
          </div>
        )}

        {/* Token Cost Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-8 flex gap-6 text-sm">
          <div className="text-gray-400">🔍 Search PDF = <span className="text-white font-medium">2 tokens</span></div>
          <div className="text-gray-400">⬇️ Download PDF = <span className="text-white font-medium">5 tokens</span></div>
          <div className="text-gray-400">✨ Generate Notes = <span className="text-white font-medium">10 tokens</span></div>
        </div>

        {/* Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-gray-900 border rounded-2xl p-6 flex flex-col ${pkg.name === 'Pro' ? 'border-blue-500' : 'border-gray-800'}`}
            >
              {pkg.name === 'Pro' && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full w-fit mb-3">
                  Popular
                </span>
              )}
              <p className="text-lg font-bold text-white">{pkg.name}</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">🪙 {pkg.tokens}</p>
              <p className="text-gray-500 text-sm mt-1">tokens</p>
              <p className="text-2xl font-bold text-white mt-4">₹{pkg.price_inr}</p>
              <button
                onClick={() => handlePurchase(pkg)}
                disabled={loading && selectedPkg === pkg.id}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading && selectedPkg === pkg.id ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>

        {/* Transaction History */}
        <div>
          <h3 className="text-xl font-bold mb-4">Transaction History</h3>
          {history.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
              <p className="text-gray-400">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((txn) => (
                <div key={txn.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{txn.description}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {new Date(txn.created_at).toLocaleDateString()} · {txn.status}
                    </p>
                  </div>
                  <p className={`font-bold ${txn.type === 'purchase' ? 'text-green-400' : 'text-red-400'}`}>
                    {txn.type === 'purchase' ? '+' : '-'}{txn.tokens}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}