import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function Resources() {
  const [resources, setResources] = useState([])
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadResources = async (type) => {
    setLoading(true)
    setError('')
    try {
      const params = type ? { type } : {}
      const res = await api.get('/resources/', { params })
      setResources(res.data)
    } catch (err) {
      setError('Could not load resources.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources(typeFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Browse resources</h1>
          <p className="page-sub">Find an available meeting room or hot desk.</p>
        </div>
        <div className="filter-group">
          <button className={typeFilter === '' ? 'chip chip-active' : 'chip'} onClick={() => setTypeFilter('')}>All</button>
          <button className={typeFilter === 'room' ? 'chip chip-active' : 'chip'} onClick={() => setTypeFilter('room')}>Rooms</button>
          <button className={typeFilter === 'desk' ? 'chip chip-active' : 'chip'} onClick={() => setTypeFilter('desk')}>Desks</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading resources…</p>}

      {!loading && resources.length === 0 && (
        <div className="empty-state">No resources match this filter yet.</div>
      )}

      <div className="card-grid">
        {resources.map((r) => (
          <div className="resource-card" key={r.id}>
            <div className="resource-card-top">
              <span className={`type-pill type-${r.type}`}>{r.type}</span>
              {r.capacity != null && <span className="muted">Capacity {r.capacity}</span>}
            </div>
            <h3>{r.name}</h3>
            {r.floor_location && <p className="muted">{r.floor_location}</p>}
            {r.amenities && <p className="amenities">{r.amenities}</p>}
            <div className="resource-card-actions">
              <Link className="btn btn-secondary" to={`/resources/${r.id}/availability`}>Check availability</Link>
              <Link className="btn btn-primary" to={`/resources/${r.id}/book`}>Book</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
