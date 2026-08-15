import { useEffect, useState } from 'react'
import api from '../api/axios'

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(isoDatetime) {
  return new Date(isoDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [resources, setResources] = useState([])
  const [resourceFilter, setResourceFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => {
    api.get('/resources/').then((res) => setResources(res.data)).catch(() => {})
  }, [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      let res
      if (resourceFilter) {
        res = await api.get(`/bookings/resource/${resourceFilter}`, {
          params: dateFilter ? { date: dateFilter } : {},
        })
      } else {
        res = await api.get('/bookings/')
        if (dateFilter) {
          res = { data: res.data.filter((b) => b.date === dateFilter) }
        }
      }
      setBookings(res.data)
    } catch (err) {
      setError('Could not load bookings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [resourceFilter, dateFilter]) // eslint-disable-line react-hooks/exhaustive-deps

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
          <h1>All bookings</h1>
          <p className="page-sub">Every booking across all resources, filterable by date and resource.</p>
        </div>
      </div>

      <div className="filter-bar">
        <label>
          Resource
          <select value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)}>
            <option value="">All resources</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </label>
        {(resourceFilter || dateFilter) && (
          <button className="btn btn-ghost" onClick={() => { setResourceFilter(''); setDateFilter('') }}>Clear filters</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && bookings.length === 0 && (
        <div className="empty-state">No bookings match these filters.</div>
      )}

      <div className="booking-list">
        {bookings.map((b) => (
          <div className="booking-row" key={b.id}>
            <div className="booking-row-main">
              <span className="booking-date">{formatDate(b.date)}</span>
              <span className="booking-time">{formatTime(b.start_time)} – {formatTime(b.end_time)}</span>
              <span className="booking-resource">{b.resource_name}</span>
              <span className="booking-title muted">{b.title}</span>
              <span className="booking-user muted">by {b.user_name}</span>
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
