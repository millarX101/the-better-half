import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Send, ArrowLeft, AlertCircle, User, Flame } from 'lucide-react'
import PersonalitySettings from './PersonalitySettings'

const API_URL = import.meta.env.VITE_API_URL || ''

const DEFAULT_PERSONALITY = {
  savagery: 50,    // 0 = gentle roast, 100 = brutal
  honesty: 50,     // 0 = lie to me, 100 = truth hurts
  crassness: 50,   // 0 = polished, 100 = absolute filth (capped for free users)
  class: 50        // 0 = full bogan, 100 = posh
}

const PREMIUM_PERSONALITY = {
  savagery: 100,   // MAXIMUM CHAOS
  honesty: 100,    // BRUTAL TRUTH
  crassness: 100,  // FULL FILTH MODE
  class: 0         // FULL BOGAN
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
  partner: [
    "Oh, you're here. *sighs* Let me guess — you've done something and now you want me to tell you it's fine. It's not fine. But go on then, what is it this time?",
    "Well look who decided to show up. I've been waiting. Don't worry, I've had plenty of time to think about everything you've ever done wrong. What do you need?",
    "*looks up from phone* Oh. It's you. I was just reading about divorce statistics. No reason. What's up?",
    "Before you even start — yes, I'm still annoyed about last time. But fine, I'm listening. This better be good.",
    "You've got that look. The 'I need something' look. I've seen it before. March 2019. July 2021. And now. What is it?",
    "*deep breath* Okay. I'm calm. I'm centred. I did my breathing exercises. You have exactly 30 seconds before that wears off. Go.",
    "Oh good, you're here. I was just adding to my mental list of things we need to 'discuss'. But sure, you go first. What fresh drama have you brought me?",
    "Let me save you some time — whatever you're about to say, I probably already know. I always know. But go on, I want to hear how you're going to explain it.",
    "*puts down wine glass* This is either going to be really good or really bad. There's no in-between with you. Hit me.",
    "Fair dinkum, what is it now? I was just starting to relax. Can't have that, apparently. Alright, out with it."
  ],
  alien: [
    "Greetings, human. I have been observing your species' relationship patterns and I have... concerns. But please, share your query.",
    "Ah, another Earth creature seeks counsel. I have studied 47,000 of your 'relationship Reddit posts'. I am prepared for whatever chaos you bring.",
    "*adjusts observation device* Human detected. Relationship distress probability: 94.7%. Please state the nature of your bonding emergency.",
    "Welcome. I was just documenting how your species invented 'ghosting' — truly the most confusing communication method in the known universe. How may I assist?",
    "By the moons of Kepler! Another human approaches. Tell me of your romantic tribulations. I am compiling a research paper titled 'Why Earth Hasn't Achieved Interstellar Travel'.",
    "Greetings. I notice elevated stress hormones. On my planet, we would simply photosynthesize our problems away. But you cannot do this. How unfortunate. What troubles you?",
    "*blinks seventeen eyes* You wish to discuss 'relationship stuff', yes? I have learned this phrase. I am ready. I am also horrified in advance.",
    "Human! Excellent timing. I was just questioning why your species pair-bonds at all given the statistical failure rate. But please, add to my data.",
    "I sense disturbance in your primitive emotional centers. Is this about the 'partner'? It is always about the partner. Proceed.",
    "Welcome, Earth being. I have been on your planet for 6 of your 'months' and I have never been more confused. Please, add to my confusion."
  ]
}

// Get random starter message
function getRandomStarter(personaId) {
  const messages = STARTER_MESSAGES[personaId] || STARTER_MESSAGES.partner
  return messages[Math.floor(Math.random() * messages.length)]
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
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [streak, setStreak] = useState(null)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  const persona = PERSONA_CONFIG[personaId] || PERSONA_CONFIG.partner
  const avatarSrc = partnerPrefs?.partnerGender === 'wife'
    ? persona.avatarFemale
    : persona.avatar

  // Initialize with starter message
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: getRandomStarter(personaId)
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
            setStreak(data.streak || null)
            // Set premium users to full swear mode by default
            if (data.isPremium) {
              setPersonality(PREMIUM_PERSONALITY)
            }
          }
        } catch (err) {
          console.error('Failed to check premium status:', err)
        }
      }
    }
    checkPremiumStatus()
  }, [isAuthenticated, user?.id])

  const handleUpgrade = async () => {
    if (!user?.id || !user?.email) {
      onShowAuth()
      return
    }

    setIsUpgrading(true)
    try {
      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email
        })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to start checkout')
      }
    } catch (err) {
      console.error('Upgrade error:', err)
      setError('Failed to connect to payment system')
    } finally {
      setIsUpgrading(false)
    }
  }

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
      
      setMessages([...newMessages, {
        role: 'assistant',
        content: data.reply
      }])
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
          
          {/* Streak display */}
          {streak && streak.current > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-xs" title={`${streak.totalRoasts || 0} roasts received`}>
              <Flame className={`w-4 h-4 ${streak.current >= 7 ? 'text-orange-400' : streak.current >= 3 ? 'text-yellow-400' : 'text-dark-400'}`} />
              <span className={streak.current >= 7 ? 'text-orange-400 font-bold' : streak.current >= 3 ? 'text-yellow-400' : 'text-dark-400'}>
                {streak.current}
              </span>
            </div>
          )}

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
            onUpgrade={handleUpgrade}
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
                    onClick={handleUpgrade}
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? 'Loading...' : 'Go UNHINGED - $49.99/year'}
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
