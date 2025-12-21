import { useState } from 'react'
import { Settings, X, Flame, Heart, MessageSquare, Crown, Lock, Zap } from 'lucide-react'

const FULL_SEND_SETTINGS = {
  savagery: 100,
  honesty: 100,
  crassness: 100,
  class: 0
}

const SLIDER_CONFIG = [
  {
    id: 'savagery',
    label: 'Savagery Level',
    icon: Flame,
    min: 'Gentle Nudge',
    max: 'No Mercy',
    description: 'How hard do you want to be called out?'
  },
  {
    id: 'honesty',
    label: 'Honesty Level',
    icon: Heart,
    min: 'Tell Me What I Want',
    max: 'Truth Hurts',
    description: 'Comfortable lies or uncomfortable truths?'
  },
  {
    id: 'crassness',
    label: 'Language',
    icon: MessageSquare,
    min: 'Polished',
    max: 'Full Bogan',
    description: 'How sweary should they be?',
    premiumNote: 'Max filth requires premium'
  },
  {
    id: 'class',
    label: 'Vibe',
    icon: Crown,
    min: 'Tradie Energy',
    max: 'Champagne Problems',
    description: 'Bunnings car park or Byron Bay?'
  }
]

export default function PersonalitySettings({ settings, onSettingsChange, isOpen, onToggle, isPremium = false, onUpgrade }) {
  const [showPaywall, setShowPaywall] = useState(false)

  const isFullSend = settings.savagery === 100 &&
                     settings.honesty === 100 &&
                     settings.crassness === 100 &&
                     settings.class === 0

  const handleFullSendToggle = () => {
    if (!isPremium) {
      setShowPaywall(true)
      return
    }

    if (isFullSend) {
      // Turn off full send - go back to defaults
      onSettingsChange({ savagery: 50, honesty: 50, crassness: 50, class: 50 })
    } else {
      // Turn on full send
      onSettingsChange(FULL_SEND_SETTINGS)
    }
  }

  const handleUpgradeClick = () => {
    setShowPaywall(false)
    if (onUpgrade) {
      onUpgrade()
    }
  }

  const handleSliderChange = (id, value) => {
    onSettingsChange({
      ...settings,
      [id]: parseInt(value)
    })
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-dark-400 hover:text-white text-sm 
          bg-dark-800 hover:bg-dark-700 px-3 py-2 rounded-lg transition-all"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Personality</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onToggle}
          className="absolute top-4 right-4 p-2 hover:bg-dark-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-dark-400" />
        </button>

        <h2 className="font-display text-xl font-bold mb-2">Customise Your Other Half</h2>
        <p className="text-dark-400 text-sm mb-6">
          Dial in exactly how much relationship realness you can handle.
        </p>

        {/* Full Send Mode Toggle */}
        <div
          onClick={handleFullSendToggle}
          className={`mb-6 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            isFullSend && isPremium
              ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/50'
              : 'bg-dark-800 border-dark-700 hover:border-dark-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isFullSend && isPremium ? 'bg-red-500/30' : 'bg-dark-700'}`}>
                <Zap className={`w-5 h-5 ${isFullSend && isPremium ? 'text-red-400' : 'text-dark-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">Full Send Mode</span>
                  {!isPremium && <Lock className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-dark-400 text-xs">Maximum chaos. No filter. Full bogan.</p>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full p-1 transition-colors ${
              isFullSend && isPremium ? 'bg-red-500' : 'bg-dark-600'
            }`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isFullSend && isPremium ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {SLIDER_CONFIG.map((slider) => {
            const Icon = slider.icon
            const value = settings[slider.id] || 50
            const showPremiumLock = slider.id === 'crassness' && value > 70 && !isPremium
            
            return (
              <div key={slider.id}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-hottie-400" />
                  <span className="font-medium text-sm">{slider.label}</span>
                  {showPremiumLock && (
                    <span className="flex items-center gap-1 text-xs text-amber-400 ml-auto">
                      <Lock className="w-3 h-3" />
                      Premium for max
                    </span>
                  )}
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => handleSliderChange(slider.id, e.target.value)}
                  className="w-full accent-hottie-500"
                />
                
                <div className="flex justify-between text-xs text-dark-500 mt-1">
                  <span>{slider.min}</span>
                  <span className="text-dark-600">{slider.description}</span>
                  <span>{slider.max}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Presets */}
        <div className="mt-8 pt-6 border-t border-dark-800">
          <p className="text-sm text-dark-400 mb-3">Quick Presets:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSettingsChange({ savagery: 20, honesty: 30, crassness: 20, class: 80 })}
              className="text-xs bg-dark-800 hover:bg-dark-700 px-3 py-1.5 rounded-full transition-colors"
            >
              🍷 Gentle Hint
            </button>
            <button
              onClick={() => onSettingsChange({ savagery: 50, honesty: 50, crassness: 50, class: 50 })}
              className="text-xs bg-dark-800 hover:bg-dark-700 px-3 py-1.5 rounded-full transition-colors"
            >
              ⚖️ Balanced
            </button>
            <button
              onClick={() => onSettingsChange({ savagery: 80, honesty: 90, crassness: 50, class: 30 })}
              className="text-xs bg-dark-800 hover:bg-dark-700 px-3 py-1.5 rounded-full transition-colors"
            >
              🔥 Real Talk
            </button>
            <button
              onClick={() => onSettingsChange({ savagery: 90, honesty: 100, crassness: 70, class: 10 })}
              className="text-xs bg-dark-800 hover:bg-dark-700 px-3 py-1.5 rounded-full transition-colors"
            >
              🇦🇺 Aussie Mate
            </button>
            <button
              onClick={() => onSettingsChange({ savagery: 100, honesty: 100, crassness: 100, class: 0 })}
              className="text-xs bg-dark-800 hover:bg-dark-700 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
            >
              💀 Full Send
              {!isPremium && <Lock className="w-3 h-3 text-amber-400" />}
            </button>
          </div>
        </div>

        {!isPremium && (
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="font-medium text-sm">Unlock Full Bogan Mode</span>
            </div>
            <p className="text-dark-400 text-xs mb-3">
              Premium unlocks maximum crassness — full f-bombs, c-bombs, and absolutely no filter.
            </p>
            <div className="flex items-center gap-3">
              <button className="text-amber-400 text-sm font-medium hover:underline">
                $6.99/month
              </button>
              <span className="text-dark-600 text-xs">or</span>
              <button className="text-amber-400 text-sm font-medium hover:underline">
                $49.99/year (save 40%)
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="btn-primary w-full mt-6"
        >
          Save & Close
        </button>

        {/* Paywall Popup */}
        {showPaywall && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="card max-w-sm w-full p-6 text-center relative">
              <button
                onClick={() => setShowPaywall(false)}
                className="absolute top-4 right-4 p-2 hover:bg-dark-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>

              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>

              <h3 className="font-display text-2xl font-bold mb-2">Unlock Full Send Mode</h3>
              <p className="text-dark-400 text-sm mb-6">
                Get maximum savagery, brutal honesty, full bogan language, and absolutely no filter.
                Your partner will hold nothing back.
              </p>

              <div className="bg-dark-800 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-3xl font-bold">$49.99</span>
                  <span className="text-dark-400">/year</span>
                </div>
                <p className="text-green-400 text-xs mb-3">Save 40% vs monthly ($6.99/mo)</p>
                <ul className="text-sm text-dark-300 space-y-1">
                  <li>✓ Unlimited messages</li>
                  <li>✓ UNHINGED Mode unlocked</li>
                  <li>✓ Maximum crassness enabled</li>
                  <li>✓ No daily limits</li>
                  <li>✓ 1 year access</li>
                </ul>
              </div>

              <button
                onClick={handleUpgradeClick}
                className="btn-primary w-full mb-3"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={() => setShowPaywall(false)}
                className="text-dark-400 text-sm hover:text-white transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
