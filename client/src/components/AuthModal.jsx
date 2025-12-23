import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { X, Mail, Lock, Sparkles, AlertCircle, CheckCircle, Zap } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('signin') // 'signin', 'signup', or 'upgrade'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [signedUpUser, setSignedUpUser] = useState(null)

  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { data, error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          // Store user info and show upgrade screen
          setSignedUpUser({ email, id: data?.user?.id })
          setMode('upgrade')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        } else {
          onClose()
        }
      }
    } catch (err) {
      setError('Something went wrong. Even hotties have bad days.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plan) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: signedUpUser?.id,
          userEmail: signedUpUser?.email || email,
          plan: plan
        })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to start checkout')
        setLoading(false)
      }
    } catch (err) {
      setError('Failed to connect to payment system')
      setLoading(false)
    }
  }

  // Upgrade screen after signup
  if (mode === 'upgrade') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>

          {/* Success header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold">You're In!</h2>
            <p className="text-dark-400 text-sm mt-1">
              Check your email to confirm, then come back for the fun.
            </p>
          </div>

          {/* Upgrade offer */}
          <div className="bg-gradient-to-r from-hottie-500/10 to-orange-500/10 border border-hottie-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-hottie-400" />
              <span className="font-bold">Unlock Unhinged Mode</span>
            </div>
            <p className="text-dark-400 text-sm mb-4">
              Go premium for unlimited messages, maximum savagery, and absolutely no filter.
            </p>

            {/* Annual - Best Value */}
            <div className="bg-dark-800 rounded-xl p-4 mb-3 border-2 border-green-500 relative">
              <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded">
                BEST VALUE
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">$49.99</span>
                    <span className="text-dark-400">/year</span>
                  </div>
                  <p className="text-green-400 text-xs">Save 40% ($4.17/mo)</p>
                </div>
                <button
                  onClick={() => handleUpgrade('annual')}
                  disabled={loading}
                  className="btn-primary text-sm px-4 disabled:opacity-50"
                >
                  {loading ? '...' : 'Get Annual'}
                </button>
              </div>
            </div>

            {/* Monthly */}
            <div className="bg-dark-800 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold">$6.99</span>
                  <span className="text-dark-400 text-sm">/month</span>
                  <p className="text-dark-500 text-xs">Cancel anytime</p>
                </div>
                <button
                  onClick={() => handleUpgrade('monthly')}
                  disabled={loading}
                  className="btn-secondary text-sm px-4 disabled:opacity-50"
                >
                  {loading ? '...' : 'Go Monthly'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Skip option */}
          <button
            onClick={onClose}
            className="w-full text-center text-dark-500 text-sm hover:text-dark-300 transition-colors py-2"
          >
            Maybe later, start with free
          </button>

          {/* Features list */}
          <div className="mt-4 pt-4 border-t border-dark-800">
            <p className="text-xs text-dark-500 mb-2">Premium includes:</p>
            <ul className="text-xs text-dark-400 space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Unlimited messages (no daily cap)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Unhinged Mode - maximum savagery
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> No filter language (f-bombs, c-bombs, the lot)
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // Normal signin/signup form
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-dark-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-dark-400" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-hottie-500 to-hottie-600 rounded-full
            flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold">
            {mode === 'signin' ? 'Welcome Back' : 'Join the Hotties'}
          </h2>
          <p className="text-dark-400 text-sm mt-1">
            {mode === 'signin'
              ? "We've been judging you from afar"
              : "Get 20 free messages daily. We know you can't resist."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-field w-full pl-11"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field w-full pl-11"
                required
                minLength={6}
              />
            </div>
            {mode === 'signup' && (
              <p className="text-dark-500 text-xs mt-1">At least 6 characters. Make it memorable.</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-green-200 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading
              ? 'One moment...'
              : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="mt-6 text-center text-sm">
          <span className="text-dark-400">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
              setSuccess(null)
            }}
            className="text-hottie-400 hover:text-hottie-300 font-medium"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </div>

        {/* Premium teaser for signup */}
        {mode === 'signup' && (
          <div className="mt-6 pt-6 border-t border-dark-800">
            <div className="bg-gradient-to-r from-hottie-500/10 to-purple-500/10 rounded-xl p-4 text-center">
              <p className="text-sm font-medium mb-1">Want unlimited messages + full bogan mode?</p>
              <p className="text-dark-400 text-xs">
                Sign up first, then upgrade to premium for the full unhinged experience.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
