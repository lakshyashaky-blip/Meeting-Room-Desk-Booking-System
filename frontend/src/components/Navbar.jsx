import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-mark">RB</span>
        <span>Room &amp; Desk Booking</span>
      </div>
      <nav className="navbar-links">
        <NavLink to="/resources" className={({ isActive }) => isActive ? 'active' : ''}>Browse</NavLink>
        <NavLink to="/my-bookings" className={({ isActive }) => isActive ? 'active' : ''}>My Bookings</NavLink>
        {isAdmin && (
          <>
            <NavLink to="/admin/resources" className={({ isActive }) => isActive ? 'active' : ''}>Manage Resources</NavLink>
            <NavLink to="/admin/bookings" className={({ isActive }) => isActive ? 'active' : ''}>All Bookings</NavLink>
          </>
        )}
      </nav>
      <div className="navbar-user">
        <span className="navbar-user-name">{user.name}</span>
        <span className={`role-pill role-${user.role}`}>{user.role}</span>
        <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
      </div>
    </header>
  )
}
