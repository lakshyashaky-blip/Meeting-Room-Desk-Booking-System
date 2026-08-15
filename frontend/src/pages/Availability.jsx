import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

function todayISO() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function formatTime(isoDatetime) {
  const d = new Date(isoDatetime)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Availability() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [date, setDate] = useState(todayISO())
  const [bookings, setBookings] = useState([])
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [resourceRes, slotsRes] = await Promise.all([
          api.get('/resources/').then((r) => r.data.find((x) => String(x.id) === String(id))),
          api.get(`/resources/${id}/slots`, { params: { date } }),
        ])
        setResource(resourceRes || null)
        setBookings(slotsRes.data)
      } catch (err) {
        setError('Could not load availability for this resource.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, date])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{resource ? resource.name : 'Availability'}</h1>
          <p className="page-sub">See which time slots are already taken for this resource.</p>
        </div>
        <Link className="btn btn-secondary" to="/resources">Back to browse</Link>
      </div>

      <label className="date-picker">
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && (
        <div className="slots-panel">
          {bookings.length === 0 ? (
            <div className="empty-state">No bookings yet on this date — the whole day is free.</div>
          ) : (
            <ul className="slot-list">
              {bookings
                .slice()
                .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                .map((b) => (
                  <li className="slot-item" key={b.id}>
                    <span className="slot-time">{formatTime(b.start_time)} – {formatTime(b.end_time)}</span>
                    <span className="slot-title">{b.title}</span>
                    <span className="slot-user muted">booked by {b.user_name}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      <div className="page-footer-actions">
        <button className="btn btn-primary" onClick={() => navigate(`/resources/${id}/book`, { state: { date } })}>
          Book this resource
        </button>
      </div>
    </div>
  )
}
