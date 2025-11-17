import { useEffect, useRef, useState } from 'react'
import ModelSelector from './components/ModelSelector'
import ChatWindow from './components/ChatWindow'
import Sidebar from './components/Sidebar'

function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [model, setModel] = useState('echo:mini')
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [useStreaming, setUseStreaming] = useState(true)
  const [streamingText, setStreamingText] = useState('')
  const abortRef = useRef(null)

  const startNewConversation = async () => {
    try {
      const title = input?.trim() ? input.slice(0, 40) : 'New Chat'
      const r = await fetch(`${baseUrl}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, model })
      })
      const data = await r.json()
      setConversation(data)
      setMessages([])
    } catch (e) {}
  }

  const sendMessage = async () => {
    if (!input.trim() && !imageUrl.trim()) return
    setLoading(true)
    const convId = conversation?.id || ''
    const userMsg = { role: 'user', content: input, conversation_id: convId, image_url: imageUrl || undefined }
    const all = [...messages, userMsg]
    setMessages(all)
    setInput('')
    setImageUrl('')

    const payload = {
      model,
      conversation_id: conversation?.id,
      messages: all.map(m => ({ role: m.role, content: m.content, conversation_id: conversation?.id || '', image_url: m.image_url }))
    }

    if (useStreaming) {
      // SSE streaming
      try {
        setStreamingText('')
        const ctrl = new AbortController()
        abortRef.current = ctrl
        const resp = await fetch(`${baseUrl}/api/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: ctrl.signal
        })
        if (!resp.body) throw new Error('No stream body')
        const reader = resp.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''
        let newConvId = conversation?.id

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          let idx
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const eventChunk = buffer.slice(0, idx)
            buffer = buffer.slice(idx + 2)
            const lines = eventChunk.split('\n')
            let event = 'message'
            let data = ''
            for (const line of lines) {
              if (line.startsWith('event:')) event = line.replace('event:', '').trim()
              if (line.startsWith('data:')) data += line.replace('data:', '').trim()
            }
            if (event === 'meta') {
              try {
                const meta = JSON.parse(data)
                if (!newConvId && meta.conversation_id) newConvId = meta.conversation_id
                if (!conversation && meta.conversation_id) {
                  setConversation({ id: meta.conversation_id, title: all[0]?.content?.slice(0,40) || 'New Chat', model })
                }
              } catch {}
            } else if (event === 'token') {
              setStreamingText(prev => prev + data)
            } else if (event === 'done') {
              // finalize message
              setMessages(prev => [...prev, { role: 'assistant', content: streamingTextRef.current }])
              setStreamingText('')
            }
          }
        }
      } catch (e) {
        setStreamingText('')
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error during streaming.' }])
      } finally {
        setLoading(false)
      }
    } else {
      try {
        const r = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await r.json()
        if (!conversation) {
          setConversation({ id: data.conversation_id, title: all[0]?.content?.slice(0,40) || 'New Chat', model })
        }
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } catch (e) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error contacting backend.' }])
      } finally {
        setLoading(false)
      }
    }
  }

  // keep latest streaming text in ref for finalization
  const streamingTextRef = useRef('')
  useEffect(() => {
    streamingTextRef.current = streamingText
  }, [streamingText])

  const stopStreaming = () => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
  }

  const loadConversation = async (c) => {
    setConversation(c)
    try {
      const r = await fetch(`${baseUrl}/api/conversations/${c.id}/messages`)
      const data = await r.json()
      setMessages(data)
      setModel(c.model)
    } catch (e) {
      setMessages([])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex">
      <Sidebar onSelectConversation={loadConversation} onNewConversation={startNewConversation} />
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <ModelSelector value={model} onChange={setModel} />
          <div className="md:col-span-2 flex items-center justify-end gap-4">
            <label className="text-sm text-gray-700 flex items-center gap-2">
              <input type="checkbox" checked={useStreaming} onChange={e => setUseStreaming(e.target.checked)} />
              Streaming
            </label>
            <a href="/test" className="text-sm text-blue-600 hover:underline">Connection test</a>
          </div>
        </div>

        <ChatWindow messages={messages} streamingText={streamingText} />

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Type your message..."
              className="flex-1 border rounded px-4 py-3 bg-white"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded disabled:opacity-50"
            >{loading ? 'Thinking...' : 'Send'}</button>
            {useStreaming && loading && (
              <button onClick={stopStreaming} className="px-4 py-3 rounded border bg-white">Stop</button>
            )}
          </div>
          <input
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Paste image URL (optional) — works with GPT‑4o, 4o‑mini, Gemini 1.5"
            className="border rounded px-4 py-2 bg-white text-sm"
          />
        </div>
      </div>
    </div>
  )
}

export default App
