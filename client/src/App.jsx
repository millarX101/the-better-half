import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Home from './components/Home'
import Chat from './components/Chat'
import AuthModal from './components/AuthModal'
import AgeGate from './components/AgeGate'
import PartnerSetup, { getPartnerPrefs } from './components/PartnerSetup'
import { useState, useEffect } from 'react'

function App() {
  const [showAuth, setShowAuth] = useState(false)
  const [showPartnerSetup, setShowPartnerSetup] = useState(false)
  const [partnerPrefs, setPartnerPrefs] = useState(null)

  useEffect(() => {
    // Load partner preferences on mount
    const prefs = getPartnerPrefs()
    setPartnerPrefs(prefs)
  }, [])

  const handlePartnerPrefsChange = (prefs) => {
    setPartnerPrefs(prefs)
  }

  return (
    <AgeGate>
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
    </AgeGate>
  )
}

export default App
