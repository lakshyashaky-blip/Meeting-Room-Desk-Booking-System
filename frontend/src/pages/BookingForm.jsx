import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import api from '../api/axios'

function todayISO() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

export default function BookingForm() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [resource, setResource] = useState(null)
  const [date, setDate] = useState(location.state?.date || todayISO())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/resources/').then((res) => {
      setResource(res.data.find((x) => String(x.id) === String(id)) || null)
    })
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (endTime <= startTime) {
      setError('End time must be after start time.')
      return
    }

    setLoading(true)
    try {
      await api.post('/bookings/', {
        resource_id: Number(id),
        date,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        title,
      })
      setSuccess(true)
      setTimeout(() => navigate('/my-bookings'), 1000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create booking.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <div>
          <h1>Book {resource ? resource.name : 'resource'}</h1>
          <p className="page-sub">Pick a date and time. Overlapping bookings are rejected automatically.</p>
        </div>
        <Link className="btn btn-secondary" to={`/resources/${id}/availability`}>View availability</Link>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">Booking confirmed — redirecting…</div>}

        <label>
          Title / purpose
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sprint planning" required />
        </label>

        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>

        <div className="form-row">
          <label>
            Start time
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </label>
          <label>
            End time
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </label>
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Booking…' : 'Confirm booking'}
        </button>
      </form>
    </div>
  )
}
