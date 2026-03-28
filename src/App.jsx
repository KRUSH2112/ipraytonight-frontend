import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import './App.css'

const supabase = createClient(
  'https://nomejfcrioshhgbpgfgj.supabase.co',
  'sb_publishable_ZF6DOZtxhuCjL9YnTySvgg_17PJJjVZ'
)

const API = 'https://ipraytonight-production.up.railway.app'

function App() {
  const [user, setUser] = useState(null)
  const [prayers, setPrayers] = useState([])
  const [newPrayer, setNewPrayer] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true)
        setUser(session?.user ?? null)
        return
      }
      setUser(session?.user ?? null)
    })
    fetchPrayers()
    const interval = setInterval(fetchPrayers, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchPrayers = async () => {
    try {
      const res = await axios.get(`${API}/prayers`)
      setPrayers(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    } else if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Check your email to confirm your account!')
    } else if (authMode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://ipraytonight.com'
      })
      if (error) setMessage(error.message)
      else setMessage('Password reset email sent! Check your inbox.')
    }
    setLoading(false)
  }

  const handlePasswordReset = async () => {
    setMessage('')
    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password updated successfully! You are now logged in.')
      setIsResettingPassword(false)
      setNewPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsResettingPassword(false)
  }

  const handlePostPrayer = async () => {
    if (!newPrayer.trim()) return
    if (!user) { setMessage('Please log in to post a prayer.'); return }
    try {
      await axios.post(`${API}/prayers`, { text: newPrayer, user_id: user.email })
      setNewPrayer('')
      setMessage('')
      fetchPrayers()
    } catch (e) {
      setMessage('Error posting prayer. Please try again.')
    }
  }

  const handlePrayerKeyDown = (e) => {
    if (e.key === 'Enter') handlePostPrayer()
  }

  const handleBuyPack = async (type) => {
    try {
      const res = await axios.post(`${API}/create-checkout-session`, { type })
      window.location.href = res.data.url
    } catch (e) {
      setMessage('Payment error. Please try again.')
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🙏</span>
          <span className="logo-text">iPrayTonight</span>
        </div>
        <div className="header-right">
          {user && <span className="user-email">{user.email}</span>}
        </div>
      </header>

      <div className="main">
        <aside className="sidebar">
          {isResettingPassword ? (
            <div className="auth-card">
              <h3>Set New Password</h3>
              <p style={{fontSize: '12px', color: '#aaa', marginBottom: '8px'}}>Must be at least 8 characters and different from your previous password.</p>
              <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="auth-input" />
              <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="auth-input" />
              <button className="btn-primary" onClick={handlePasswordReset} disabled={loading}>
                {loading ? 'Please wait...' : 'Update Password'}
              </button>
              {message && <p className="message">{message}</p>}
            </div>
          ) : user ? (
            <div className="profile-card">
              <div className="avatar">👤</div>
              <div className="username">{user.email.split('@')[0]}</div>
              <div className="user-email-small">{user.email}</div>
              <button className="btn-logout-full" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className="auth-card">
              <h3>
                {authMode === 'login' ? 'Login' : authMode === 'signup' ? 'Sign Up' : 'Reset Password'}
              </h3>
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="auth-input" />
              {authMode !== 'forgot' && (
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="auth-input" />
              )}
              <button className="btn-primary" onClick={handleAuth} disabled={loading}>
                {loading ? 'Please wait...' : authMode === 'login' ? 'Login' : authMode === 'signup' ? 'Sign Up' : 'Send Reset Email'}
              </button>
              {authMode === 'login' && (
                <p className="auth-switch" onClick={() => { setAuthMode('forgot'); setMessage('') }}>
                  Forgot password?
                </p>
              )}
              <p className="auth-switch" onClick={() => { setAuthMode(authMode === 'signup' ? 'login' : authMode === 'forgot' ? 'login' : 'signup'); setMessage('') }}>
                {authMode === 'login' ? 'New user? Sign up' : 'Back to login'}
              </p>
              {message && <p className="message">{message}</p>}
            </div>
          )}
        </aside>

        <main className="feed">
          <h2 className="feed-title">Prayer Feed</h2>
          <div className="prayers-list">
            {prayers.length === 0 && <p className="no-prayers">No prayers yet. Be the first!</p>}
            {prayers.map((prayer, i) => (
              <div className="prayer-card" key={i}>
                <div className="prayer-avatar">👤</div>
                <div className="prayer-body">
                  <div className="prayer-user">{prayer.user_id || 'Anonymous'}</div>
                  <div className="prayer-text">{prayer.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="post-prayer">
            <input
              type="text"
              placeholder="Post a prayer request..."
              value={newPrayer}
              onChange={e => setNewPrayer(e.target.value)}
              onKeyDown={handlePrayerKeyDown}
              className="prayer-input"
            />
            <button className="btn-post" onClick={handlePostPrayer}>Post</button>
          </div>
          {message && <p className="message">{message}</p>}
        </main>

        <aside className="right-sidebar">
          <div className="payment-card">
            <h3>Support iPrayTonight</h3>
            <div className="price-option">
              <div className="price">$1.00 <span>for 10,000 prayers</span></div>
              <button className="btn-stripe" onClick={() => handleBuyPack('pack')}>Buy 10,000 Prayers with stripe</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default App