import { useEffect, useState } from 'react'

export default function ModelSelector({ value, onChange }) {
  const [models, setModels] = useState([])
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  useEffect(() => {
    fetch(`${baseUrl}/api/models`)
      .then(r => r.json())
      .then(setModels)
      .catch(() => setModels([]))
  }, [])

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
      <select
        className="w-full border rounded px-3 py-2 bg-white"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {models.map(m => (
          <option key={m.id} value={m.id}>
            {m.name} ({m.provider})
          </option>
        ))}
      </select>
    </div>
  )
}
