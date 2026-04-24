import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, Leaf } from 'lucide-react'
import toast from 'react-hot-toast'

export function Sidebar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
      toast.success('Logged out')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const isActive = (path) => location.pathname === path

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/add-produce', label: 'Add Produce' },
    { path: '/inventory', label: 'Inventory' },
    { path: '/dispatch', label: 'Dispatch' },
    { path: '/reports', label: 'Reports' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Leaf size={24} className="text-green-600" />
          <span className="text-xl font-bold text-white">AgriChain</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-green-600 text-white px-4 py-2 rounded-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Section */}
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition-all"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
