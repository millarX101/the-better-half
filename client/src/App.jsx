import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Home from './components/Home'
import Chat from './components/Chat'
import AuthModal from './components/AuthModal'
import AgeGate from './components/AgeGate'
import PartnerSetup, { getPartnerPrefs } from './components/PartnerSetup'
import LegalPages from './components/LegalPages'
import { useState, useEffect } from 'react'

// Pages that don't need age verification
const LEGAL_PAGES = ['terms', 'privacy', 'refund']

function AppContent() {
  const [showAuth, setShowAuth] = useState(false)
  const [showPartnerSetup, setShowPartnerSetup] = useState(false)
  const [partnerPrefs, setPartnerPrefs] = useState(null)
  const location = useLocation()

  useEffect(() => {
    // Load partner preferences on mount
    const prefs = getPartnerPrefs()
    setPartnerPrefs(prefs)
  }, [])

  const handlePartnerPrefsChange = (prefs) => {
    setPartnerPrefs(prefs)
  }

  // Check if current page is a legal page (no age gate needed)
  const currentPage = location.pathname.replace('/', '')
  const isLegalPage = LEGAL_PAGES.includes(currentPage)

  const content = (
    <AuthProvider>
      <div className="min-h-screen bg-dark-950">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                onShowAuth={() => setShowAuth(true)}
                onShowPartnerSetup={() => setShowPartnerSetup(true)}
                partnerPrefs={partnerPrefs}
              />
            }
          />
          <Route
            path="/chat"
            element={
              <Chat
                onShowAuth={() => setShowAuth(true)}
                onShowPartnerSetup={() => setShowPartnerSetup(true)}
                partnerPrefs={partnerPrefs}
              />
            }
          />
          <Route
            path="/chat/:persona"
            element={
              <Chat
                onShowAuth={() => setShowAuth(true)}
                onShowPartnerSetup={() => setShowPartnerSetup(true)}
                partnerPrefs={partnerPrefs}
              />
            }
          />
          <Route path="/:page" element={<LegalPages />} />
        </Routes>

        {showAuth && (
          <AuthModal onClose={() => setShowAuth(false)} />
        )}

        <PartnerSetup
          isOpen={showPartnerSetup}
          onClose={() => setShowPartnerSetup(false)}
          onSave={handlePartnerPrefsChange}
          initialPrefs={partnerPrefs}
        />
      </div>
    </AuthProvider>
  )

  // Legal pages don't need age verification
  if (isLegalPage) {
    return content
  }

  return <AgeGate>{content}</AgeGate>
}

function App() {
  return <AppContent />
}

export default App
