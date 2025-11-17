import { useEffect, useRef } from 'react'

export default function ChatWindow({ messages }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="h-96 overflow-y-auto bg-white rounded border p-4 space-y-3">
      {messages.map((m, idx) => (
        <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'} px-3 py-2 rounded-lg max-w-[80%] whitespace-pre-wrap`}>{m.content}</div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )}
