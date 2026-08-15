import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import { PrivateRoute, AdminRoute } from './components/PrivateRoute.jsx'

import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Resources from './pages/Resources.jsx'
import Availability from './pages/Availability.jsx'
import BookingForm from './pages/BookingForm.jsx'
import MyBookings from './pages/MyBookings.jsx'
import AdminResources from './pages/AdminResources.jsx'
import AdminBookings from './pages/AdminBookings.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/resources" element={<PrivateRoute><Resources /></PrivateRoute>} />
          <Route path="/resources/:id/availability" element={<PrivateRoute><Availability /></PrivateRoute>} />
          <Route path="/resources/:id/book" element={<PrivateRoute><BookingForm /></PrivateRoute>} />
          <Route path="/my-bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />

          <Route path="/admin/resources" element={<AdminRoute><AdminResources /></AdminRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />

          <Route path="/" element={<Navigate to="/resources" replace />} />
          <Route path="*" element={<Navigate to="/resources" replace />} />
        </Routes>
      </main>
    </div>
  )
}
