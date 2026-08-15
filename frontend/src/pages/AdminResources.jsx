import { useEffect, useState } from 'react'
import api from '../api/axios'

const emptyForm = { name: '', type: 'room', floor_location: '', capacity: '', amenities: '' }

export default function AdminResources() {
  const [resources, setResources] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/resources/')
      setResources(res.data)
    } catch (err) {
      setError('Could not load resources.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      name: form.name,
      type: form.type,
      floor_location: form.floor_location || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      amenities: form.amenities || null,
    }
    try {
      if (editingId) {
        await api.put(`/resources/${editingId}`, payload)
      } else {
        await api.post('/resources/', payload)
      }
      resetForm()
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save resource.')
    }
  }

  const startEdit = (r) => {
    setEditingId(r.id)
    setForm({
      name: r.name,
      type: r.type,
      floor_location: r.floor_location || '',
      capacity: r.capacity ?? '',
      amenities: r.amenities || '',
    })
  }

  const handleDeactivate = async (r) => {
    if (!window.confirm(`Deactivate "${r.name}"? It will be hidden from employees.`)) return
    try {
      await api.put(`/resources/${r.id}`, { is_active: false })
      load()
    } catch (err) {
      setError('Could not deactivate resource.')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Manage resources</h1>
          <p className="page-sub">Add, edit, or deactivate rooms and desks.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="form-card" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit resource' : 'Add a new resource'}</h3>
        <div className="form-row">
          <label>
            Name
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Type
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="room">Room</option>
              <option value="desk">Desk</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            Floor / location
            <input type="text" value={form.floor_location} onChange={(e) => setForm({ ...form, floor_location: e.target.value })} />
          </label>
          <label>
            Capacity
            <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </label>
        </div>
        <label>
          Amenities
          <input type="text" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} placeholder="e.g. Projector, Whiteboard" />
        </label>
        <div className="form-row">
          <button className="btn btn-primary" type="submit">{editingId ? 'Save changes' : 'Add resource'}</button>
          {editingId && <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel edit</button>}
        </div>
      </form>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Location</th>
              <th>Capacity</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td><span className={`type-pill type-${r.type}`}>{r.type}</span></td>
                <td className="muted">{r.floor_location || '—'}</td>
                <td className="muted">{r.capacity ?? '—'}</td>
                <td>
                  <span className={r.is_active ? 'status-pill status-active' : 'status-pill status-inactive'}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="admin-table-actions">
                  <button className="btn btn-ghost" onClick={() => startEdit(r)}>Edit</button>
                  {r.is_active && (
                    <button className="btn btn-danger-ghost" onClick={() => handleDeactivate(r)}>Deactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
