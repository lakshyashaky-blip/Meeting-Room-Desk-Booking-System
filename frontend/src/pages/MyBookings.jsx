import { useEffect, useState } from 'react'
import api from '../api/axios'

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(isoDatetime) {
  return new Date(isoDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/bookings/')
      setBookings(res.data)
    } catch (err) {
      setError('Could not load your bookings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return
    setCancellingId(bookingId)
    try {
      await api.delete(`/bookings/${bookingId}`)
      setBookings((prev) => prev.filter((b) => b.id !== bookingId))
    } catch (err) {
      setError('Could not cancel this booking.')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My bookings</h1>
          <p className="page-sub">Your upcoming room and desk reservations.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && bookings.length === 0 && (
        <div className="empty-state">You have no upcoming bookings. Head to Browse to reserve a room or desk.</div>
      )}

      <div className="booking-list">
        {bookings.map((b) => (
          <div className="booking-row" key={b.id}>
            <div className="booking-row-main">
              <span className="booking-date">{formatDate(b.date)}</span>
              <span className="booking-time">{formatTime(b.start_time)} – {formatTime(b.end_time)}</span>
              <span className="booking-resource">{b.resource_name}</span>
              <span className="booking-title muted">{b.title}</span>
            </div>
            <button
              className="btn btn-danger-ghost"
              onClick={() => handleCancel(b.id)}
              disabled={cancellingId === b.id}
            >
              {cancellingId === b.id ? 'Cancelling…' : 'Cancel'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
