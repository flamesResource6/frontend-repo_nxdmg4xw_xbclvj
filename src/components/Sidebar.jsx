import { useEffect, useState } from 'react'

export default function Sidebar({ onSelectConversation, onNewConversation }) {
  const [items, setItems] = useState([])
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const load = async () => {
    try {
      const r = await fetch(`${baseUrl}/api/conversations`)
      const data = await r.json()
      setItems(data)
    } catch (e) {
      setItems([])
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="w-72 bg-white/70 backdrop-blur border-r h-full p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800">Conversations</h2>
        <button onClick={onNewConversation} className="text-sm bg-blue-600 text-white px-3 py-1 rounded">New</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {items.map((c) => (
          <button key={c.id} onClick={() => onSelectConversation(c)} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">
            <div className="text-sm font-medium text-gray-800 truncate">{c.title}</div>
            <div className="text-xs text-gray-500">{c.model}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
