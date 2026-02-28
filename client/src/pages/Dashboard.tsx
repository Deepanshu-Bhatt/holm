import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">HOLM</h1>
        <div className="flex items-center gap-4">
          {/* Token Balance */}
          <div className="bg-blue-600/20 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium">
            🪙 {user?.tokens} tokens
          </div>
          {/* User name */}
          <span className="text-gray-400 text-sm">{user?.name}</span>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Welcome */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold">Welcome back, {user?.name} 👋</h2>
          <p className="text-gray-400 mt-1">What would you like to do today?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <p className="text-gray-400 text-sm">Token Balance</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">{user?.tokens}</p>
            <p className="text-gray-500 text-xs mt-1">tokens remaining</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <p className="text-gray-400 text-sm">Search Cost</p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">2</p>
            <p className="text-gray-500 text-xs mt-1">tokens per search</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <p className="text-gray-400 text-sm">Notes Cost</p>
            <p className="text-3xl font-bold text-green-400 mt-1">10</p>
            <p className="text-gray-500 text-xs mt-1">tokens per generation</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <button
              onClick={() => navigate('/notes')}
              className="bg-blue-600 hover:bg-blue-700 rounded-2xl p-6 text-left transition"
            >
              <p className="text-2xl mb-2">📝</p>
              <p className="text-white font-semibold text-lg">Generate AI Notes</p>
              <p className="text-blue-200 text-sm mt-1">Paste text and get structured notes</p>
              <p className="text-blue-300 text-xs mt-3">Costs 10 tokens</p>
            </button>

            <button
              onClick={() => navigate('/tokens')}
              className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl p-6 text-left transition"
            >
              <p className="text-2xl mb-2">🪙</p>
              <p className="text-white font-semibold text-lg">Buy Tokens</p>
              <p className="text-gray-400 text-sm mt-1">Purchase more tokens to keep using HOLM</p>
              <p className="text-gray-500 text-xs mt-3">Starting from ₹49</p>
            </button>

          </div>
        </div>

      </div>
    </div>
  )
}