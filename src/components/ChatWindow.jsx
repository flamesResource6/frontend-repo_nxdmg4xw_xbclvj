import { useEffect, useRef } from 'react'

export default function ChatWindow({ messages, streamingText }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  return (
    <div className="h-96 overflow-y-auto bg-white rounded border p-4 space-y-3">
      {messages.map((m, idx) => (
        <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'} px-3 py-2 rounded-lg max-w-[80%] whitespace-pre-wrap`}
          >
            {m.content}
            {m.image_url && (
              <div className="mt-2">
                <img src={m.image_url} alt="attached" className="max-w-full rounded border" />
              </div>
            )}
          </div>
        </div>
      ))}
      {streamingText && (
        <div className="flex justify-start">
          <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg max-w-[80%] whitespace-pre-wrap">
            {streamingText}
            <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse align-middle" />
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )}
