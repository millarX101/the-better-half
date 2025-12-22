import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Sparkles, Settings } from 'lucide-react'

const PERSONAS = {
  partner: {
    id: 'partner',
    name: 'Your Other Half',
    title: 'Chaotically Realistic',
    color: 'from-pink-500 to-orange-500',
    avatar: '/avatars/realist.svg',
    avatarFemale: '/avatars/realist-female.svg',
    // Default / Partner mode
    description: "Roasts you, guilt trips you, brings up 2019, blames their hormones. Just like the real thing.",
    traits: ['Unpredictable moods', 'Keeps receipts', 'Hormone warfare'],
    // Wife mode
    wifeDescription: "Roasts you, guilt trips you, brings up 2019, blames their hormones. Just like the real thing.",
    wifeTraits: ['Unpredictable moods', 'Keeps receipts', 'Hormone warfare'],
    // Husband mode
    husbandDescription: "Overly needy, always wants more action, mostly drinks beer and farts. Selective hearing enabled.",
    husbandTraits: ['Selective hearing', 'Couch potato', 'Thinks he\'s hilarious']
  },
  alien: {
    id: 'alien',
    name: 'Zyx-9',
    title: 'The Alien Observer',
    description: "Came to study human relationships. Is horrified by what they found.",
    color: 'from-green-500 to-emerald-500',
    avatar: '/avatars/alien.svg',
    avatarFemale: '/avatars/alien-female.svg',
    traits: ['Outside perspective', 'Confused by monogamy', 'Weirdly helpful'],
    wifeDescription: "Came to study human wives. Is fascinated by their ability to remember everything.",
    wifeTraits: ['Outside perspective', 'Studying wine culture', 'Weirdly helpful'],
    husbandDescription: "Came to study human husbands. Cannot understand why they won't ask for directions.",
    husbandTraits: ['Outside perspective', 'Studying beer culture', 'Confused by sports']
  }
}

const PERSONA_LIST = Object.values(PERSONAS)

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
            <span>Find out what they REALLY think before you step in it</span>
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
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {PERSONA_LIST.map((persona) => {
              const gender = partnerPrefs?.partnerGender
              const avatarSrc = gender === 'wife'
                ? persona.avatarFemale
                : persona.avatar

              // Get gender-specific description and traits
              const description = gender === 'husband'
                ? persona.husbandDescription
                : gender === 'wife'
                  ? persona.wifeDescription
                  : persona.description

              const traits = gender === 'husband'
                ? persona.husbandTraits
                : gender === 'wife'
                  ? persona.wifeTraits
                  : persona.traits

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
                    {description}
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {traits.map((trait, idx) => (
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
        <p>Made for everyone who's ever heard "I told you so"</p>
        <p className="mt-2">The personas are fictional. The relationship dynamics are painfully real.</p>
        <div className="mt-4 flex justify-center gap-4">
          <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <span>•</span>
          <Link to="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
        </div>
      </footer>
    </div>
  )
}
