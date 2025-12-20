import { useState, useEffect } from 'react'
import { X, User, Heart } from 'lucide-react'

const PARTNER_PREFS_KEY = 'tbh_partner_prefs'

const PARTNER_GENDERS = [
  { id: 'wife', label: 'Wife', description: 'She/Her energy' },
  { id: 'husband', label: 'Husband', description: 'He/Him energy' },
  { id: 'partner', label: 'Partner', description: 'Gender-neutral' }
]

const USER_GENDERS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other/Prefer not to say' }
]

export function getPartnerPrefs() {
  try {
    const saved = localStorage.getItem(PARTNER_PREFS_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export function savePartnerPrefs(prefs) {
  localStorage.setItem(PARTNER_PREFS_KEY, JSON.stringify(prefs))
}

export default function PartnerSetup({ isOpen, onClose, onSave, initialPrefs }) {
  const [partnerGender, setPartnerGender] = useState(initialPrefs?.partnerGender || 'partner')
  const [userGender, setUserGender] = useState(initialPrefs?.userGender || 'other')
  const [partnerName, setPartnerName] = useState(initialPrefs?.partnerName || '')

  const handleSave = () => {
    const prefs = {
      partnerGender,
      userGender,
      partnerName: partnerName.trim() || null
    }
    savePartnerPrefs(prefs)
    onSave(prefs)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-dark-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-dark-400" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-hottie-500/20 rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5 text-hottie-400" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Customise Your Other Half</h2>
            <p className="text-dark-400 text-sm">Make it feel like home</p>
          </div>
        </div>

        {/* Partner Gender */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">
            Your "other half" speaks as a...
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PARTNER_GENDERS.map((option) => (
              <button
                key={option.id}
                onClick={() => setPartnerGender(option.id)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  partnerGender === option.id
                    ? 'border-hottie-500 bg-hottie-500/10 text-white'
                    : 'border-dark-700 bg-dark-800 text-dark-300 hover:border-dark-600'
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-dark-500 mt-0.5">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Optional: Partner Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Give them a name <span className="text-dark-500">(optional)</span>
          </label>
          <input
            type="text"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="e.g., Babe, Hun, Love..."
            className="input-field w-full"
            maxLength={20}
          />
          <p className="text-dark-500 text-xs mt-1">
            They'll refer to you by this sometimes
          </p>
        </div>

        {/* User Gender (for pronoun context) */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">
            You are... <span className="text-dark-500">(helps with context)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {USER_GENDERS.map((option) => (
              <button
                key={option.id}
                onClick={() => setUserGender(option.id)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  userGender === option.id
                    ? 'border-hottie-500 bg-hottie-500/10 text-white'
                    : 'border-dark-700 bg-dark-800 text-dark-300 hover:border-dark-600'
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-dark-800 rounded-xl p-4 mb-6">
          <p className="text-dark-400 text-sm">
            💡 These settings affect how your "other half" talks to you — the pronouns, 
            pet names, and relationship dynamics. You can change this anytime.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="btn-primary w-full"
        >
          Save Preferences
        </button>
      </div>
    </div>
  )
}
