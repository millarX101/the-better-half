import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

const AGE_VERIFIED_KEY = 'tbh_age_verified'

export default function AgeGate({ children }) {
  const [verified, setVerified] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if already verified
    const isVerified = localStorage.getItem(AGE_VERIFIED_KEY)
    if (isVerified === 'true') {
      setVerified(true)
    }
    setChecking(false)
  }, [])

  const handleVerify = () => {
    localStorage.setItem(AGE_VERIFIED_KEY, 'true')
    setVerified(true)
  }

  const handleDeny = () => {
    window.location.href = 'https://www.google.com'
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-pulse text-dark-400">Loading...</div>
      </div>
    )
  }

  if (verified) {
    return children
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        
        <h1 className="font-display text-2xl font-bold mb-3">
          Age Verification Required
        </h1>
        
        <p className="text-dark-300 mb-6">
          This site contains adult language, mature themes, and content that may not be suitable for all audiences. 
          You must be <strong className="text-white">18 years or older</strong> to enter.
        </p>

        <div className="bg-dark-800 rounded-xl p-4 mb-6 text-left text-sm text-dark-400">
          <p className="mb-2">⚠️ <strong className="text-dark-200">Content Warning:</strong></p>
          <ul className="space-y-1 ml-4">
            <li>• Strong language and swearing</li>
            <li>• Adult relationship themes</li>
            <li>• Sarcasm and blunt honesty</li>
            <li>• Australian slang (including the c-word)</li>
          </ul>
        </div>

        <p className="text-dark-500 text-sm mb-6">
          By clicking "I'm 18+" you confirm you are of legal age and accept our terms.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={handleDeny}
            className="btn-secondary flex-1"
          >
            I'm Under 18
          </button>
          <button
            onClick={handleVerify}
            className="btn-primary flex-1"
          >
            I'm 18+
          </button>
        </div>
      </div>
    </div>
  )
}
