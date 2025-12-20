import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Send, ArrowLeft, AlertCircle, User } from 'lucide-react'
import PersonalitySettings from './PersonalitySettings'

const API_URL = import.meta.env.VITE_API_URL || ''

const DEFAULT_PERSONALITY = {
  savagery: 50,    // 0 = gentle roast, 100 = brutal
  honesty: 50,     // 0 = lie to me, 100 = truth hurts
  crassness: 50,   // 0 = polished, 100 = absolute filth (capped for free users)
  class: 50        // 0 = full bogan, 100 = posh
}

const PERSONA_CONFIG = {
  partner: {
    name: 'Your Other Half',
    title: 'Chaotically Realistic',
    color: 'from-pink-500 to-orange-500',
    bgGlow: 'bg-pink-500/20',
    avatar: '/avatars/realist.svg',
    avatarFemale: '/avatars/realist-female.svg'
  },
  alien: {
    name: 'Zyx-9',
    title: 'The Alien Observer',
    color: 'from-green-500 to-emerald-500',
    bgGlow: 'bg-green-500/20',
    avatar: '/avatars/alien.svg',
    avatarFemale: '/avatars/alien-female.svg'
  }
}

const STARTER_MESSAGES = {
  partner: "Oh, you're here. *sighs* Let me guess — you've done something and now you want me to tell you it's fine. It's not fine. But go on then, what is it this time? And before you start, I'm having a hot flash so choose your words carefully.",
  alien: "Greetings, human. I have been observing your species' relationship patterns and I have... concerns. But please, share your query. I am fascinated by your primitive bonding rituals."
}

export default function Chat({ onShowAuth, onShowPartnerSetup, partnerPrefs }) {
  const { persona: personaId = 'partner' } = useParams()
  useNavigate() // keep for potential future use
  const { user, isAuthenticated } = useAuth()
  
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [remainingMessages, setRemainingMessages] = useState(null)
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [requiresUpgrade, setRequiresUpgrade] = useState(false)
  const [personality, setPersonality] = useState(DEFAULT_PERSONALITY)
  const [showSettings, setShowSettings] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  const persona = PERSONA_CONFIG[personaId] || PERSONA_CONFIG.partner
  const avatarSrc = partnerPrefs?.partnerGender === 'wife'
    ? persona.avatarFemale
    : persona.avatar

  // Initialize with starter message
  useEffect(() => {
    const starterMessage = STARTER_MESSAGES[personaId] || STARTER_MESSAGES.partner
    setMessages([{
      role: 'assistant',
      content: starterMessage
    }])
    setError(null)
    setRequiresAuth(false)
    setRequiresUpgrade(false)
  }, [personaId])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Check premium status on mount/login
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const response = await fetch(`${API_URL}/api/user-status?userId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            setIsPremium(data.isPremium || false)
          }
        } catch (err) {
          console.error('Failed to check premium status:', err)
        }
      }
    }
    checkPremiumStatus()
  }, [isAuthenticated, user?.id])

  const sendMessage = async (e) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return
    
    const userMessage = input.trim()
    setInput('')
    setError(null)
    
    // Add user message immediately
    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          persona: personaId,
          personality: personality,
          partnerPrefs: partnerPrefs || {},
          conversationHistory: newMessages.slice(1), // Exclude starter message
          userId: user?.id,
          isAuthenticated: isAuthenticated
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        if (data.requiresAuth) {
          setRequiresAuth(true)
          setError(data.error)
        } else if (data.requiresUpgrade) {
          setRequiresUpgrade(true)
          setError(data.error)
        } else {
          setError(data.error || 'Something went wrong')
        }
        return
      }
      
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
      setRemainingMessages(data.remainingMessages)
      setIsPremium(data.isPremium || false)
      
    } catch (err) {
      console.error('Chat error:', err)
      setError("Ugh, something broke. Even I can't look this good all the time.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-dark-800 bg-dark-950/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link 
            to="/"
            className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${persona.color}
              flex items-center justify-center shadow-lg overflow-hidden`}>
              <img src={avatarSrc} alt={persona.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold leading-tight">{persona.name}</h1>
              <p className="text-dark-400 text-xs">{persona.title}</p>
            </div>
          </div>
          
          {remainingMessages !== null && remainingMessages !== 'unlimited' && (
            <div className="text-xs text-dark-400 hidden sm:block">
              {remainingMessages} left
            </div>
          )}
          
          <PersonalitySettings
            settings={personality}
            onSettingsChange={setPersonality}
            isOpen={showSettings}
            onToggle={() => setShowSettings(!showSettings)}
            isPremium={isPremium}
          />
          
          <button
            onClick={onShowPartnerSetup}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-all"
            title="Partner Settings"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${persona.color}
                  flex items-center justify-center mr-2 flex-shrink-0 mt-1 overflow-hidden`}>
                  <img src={avatarSrc} alt={persona.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className={message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
                {message.content}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${persona.color}
                flex items-center justify-center mr-2 flex-shrink-0 overflow-hidden`}>
                <img src={avatarSrc} alt={persona.name} className="w-full h-full object-cover" />
              </div>
              <div className="chat-bubble-bot">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 max-w-md text-center">
                <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
                <p className="text-red-200 text-sm">{error}</p>
                
                {requiresAuth && (
                  <button 
                    onClick={onShowAuth}
                    className="btn-primary mt-3 text-sm py-2"
                  >
                    Sign Up for More
                  </button>
                )}
                
                {requiresUpgrade && (
                  <button 
                    className="btn-primary mt-3 text-sm py-2"
                    onClick={() => alert('Stripe checkout would go here!')}
                  >
                    Upgrade to Premium - $5/mo
                  </button>
                )}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-dark-800 bg-dark-950/95 backdrop-blur-sm p-4">
        <form onSubmit={sendMessage} className="max-w-2xl mx-auto">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything... if you dare"
              className="input-field flex-1"
              disabled={isLoading || requiresAuth || requiresUpgrade}
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || requiresAuth || requiresUpgrade}
              className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {!isAuthenticated && (
            <p className="text-center text-dark-500 text-xs mt-3">
              <button onClick={onShowAuth} className="text-hottie-400 hover:underline">
                Sign up
              </button>
              {' '}for 20 free messages/day • Premium for unlimited
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
