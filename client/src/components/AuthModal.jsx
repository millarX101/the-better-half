import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { X, Mail, Lock, Sparkles, AlertCircle, CheckCircle } from 'lucide-react'

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('signin') // 'signin' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setSuccess('Check your email to confirm your account!')
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

        {/* Premium upsell */}
        <div className="mt-6 pt-6 border-t border-dark-800">
          <div className="bg-gradient-to-r from-hottie-500/10 to-purple-500/10 rounded-xl p-4 text-center">
            <p className="text-sm font-medium mb-1">Want unlimited messages + full bogan mode?</p>
            <p className="text-dark-400 text-xs mb-3">
              Premium unlocks unlimited chats, max crassness, and absolutely no filter.
            </p>
            <div className="flex justify-center gap-3 text-sm">
              <span className="text-hottie-400 font-medium">$6.99/month</span>
              <span className="text-dark-600">or</span>
              <span className="text-hottie-400 font-medium">$49.99/year (save 40%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
