import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Sparkles, Settings } from 'lucide-react'

const PERSONAS = [
  {
    id: 'realist',
    name: 'The Realist',
    title: 'Seen Your Shit Before',
    description: "Loves you, but they're exhausted by your choices. They've had this conversation before.",
    color: 'from-orange-500 to-red-500',
    avatar: '/avatars/realist.svg',
    avatarFemale: '/avatars/realist-female.svg',
    traits: ['Zero patience', 'Pattern spotter', '"Here we go again"']
  },
  {
    id: 'nurturer',
    name: 'The Nurturer',
    title: 'Disappointed, Not Angry',
    description: "Weaponised kindness. Somehow worse than yelling.",
    color: 'from-pink-500 to-rose-500',
    avatar: '/avatars/nurturer.svg',
    avatarFemale: '/avatars/nurturer-female.svg',
    traits: ['Devastating sighs', 'Guilt trips', '"I just want what\'s best"']
  },
  {
    id: 'scorekeeper',
    name: 'The Scorekeeper',
    title: 'Remembers Everything',
    description: "Has a mental filing cabinet of every mistake you've made since 2019.",
    color: 'from-purple-500 to-indigo-500',
    avatar: '/avatars/scorekeeper.svg',
    avatarFemale: '/avatars/scorekeeper-female.svg',
    traits: ['Keeps receipts', 'Never wrong', '"Remember when you..."']
  },
  {
    id: 'alien',
    name: 'Zyx-9',
    title: 'The Alien Observer',
    description: "Came to study human relationships. Is horrified by what they found.",
    color: 'from-green-500 to-emerald-500',
    avatar: '/avatars/alien.svg',
    avatarFemale: '/avatars/alien-female.svg',
    traits: ['Outside perspective', 'Confused by monogamy', 'Weirdly helpful']
  }
]

export default function Home({ onShowAuth, onShowPartnerSetup, partnerPrefs }) {
  const navigate = useNavigate()
  const { user, signOut, loading } = useAuth()

  const handlePersonaSelect = (personaId) => {
    navigate(`/chat/${personaId}`)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-dark-800 bg-dark-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-hottie-500" />
            <span className="font-display text-xl font-bold">The Better Half</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={onShowPartnerSetup}
              className="flex items-center gap-2 text-dark-400 hover:text-white text-sm transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">
                {partnerPrefs?.partnerGender === 'wife' ? 'Wife Mode' : 
                 partnerPrefs?.partnerGender === 'husband' ? 'Husband Mode' : 
                 'Setup'}
              </span>
            </button>
            
            {loading ? null : user ? (
              <>
                <span className="text-dark-400 text-sm hidden sm:block">
                  {user.email}
                </span>
                <button 
                  onClick={signOut}
                  className="text-dark-400 hover:text-white text-sm transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={onShowAuth}
                className="btn-secondary text-sm py-2 px-4"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-hottie-500/10 text-hottie-400 px-4 py-2 rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Relationship Realness</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Your Partner Was
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-hottie-400 to-hottie-600">
              {' '}Right.{' '}
            </span>
            Again.
          </h1>
          
          <p className="text-dark-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Get the advice your other half would give you — the brutal honesty, 
            the "I told you so", the eye-rolls — without the argument afterwards.
          </p>
          
          <p className="text-dark-500 text-sm">
            ⚠️ Contains relationship truths, sarcasm, and things you needed to hear
          </p>
        </div>
      </section>

      {/* Persona Selection */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-2">Choose Your Other Half</h2>
          <p className="text-center text-dark-400 mb-10">Pick the partner energy you need right now. They're all going to judge you.</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PERSONAS.map((persona) => {
              const avatarSrc = partnerPrefs?.partnerGender === 'wife'
                ? persona.avatarFemale
                : persona.avatar
              return (
                <div
                  key={persona.id}
                  onClick={() => handlePersonaSelect(persona.id)}
                  className="persona-card group"
                >
                  {/* Avatar */}
                  <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${persona.color}
                    flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden`}>
                    <img
                      src={avatarSrc}
                      alt={persona.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <h3 className="font-display text-xl font-bold text-center mb-1">
                    {persona.name}
                  </h3>
                  <p className="text-hottie-400 text-sm text-center mb-3">
                    {persona.title}
                  </p>
                  <p className="text-dark-400 text-sm text-center mb-4">
                    {persona.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {persona.traits.map((trait, idx) => (
                      <span 
                        key={idx}
                        className="text-xs bg-dark-800 text-dark-300 px-2 py-1 rounded-full"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                  
                  <button className="btn-primary w-full mt-6 group-hover:shadow-hottie-500/50">
                    Chat with {persona.name}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 border-t border-dark-800">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl mb-3">💅</div>
              <h3 className="font-bold mb-2">Actually Helpful</h3>
              <p className="text-dark-400 text-sm">
                Real advice wrapped in the familiar tone of someone who knows you too well
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">🙄</div>
              <h3 className="font-bold mb-2">Relatable AF</h3>
              <p className="text-dark-400 text-sm">
                Every eye-roll, sigh, and "I told you so" you've ever experienced
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">🔥</div>
              <h3 className="font-bold mb-2">No Arguments After</h3>
              <p className="text-dark-400 text-sm">
                All the honesty, none of the silent treatment or sleeping on the couch
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-dark-800 text-center text-dark-500 text-sm">
        <p>Made for everyone who's ever heard "I told you so" • Powered by Claude AI</p>
        <p className="mt-2">The personas are fictional. The relationship dynamics are painfully real.</p>
      </footer>
    </div>
  )
}
