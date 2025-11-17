import { useEffect, useState } from 'react'
import ModelSelector from './components/ModelSelector'
import ChatWindow from './components/ChatWindow'
import Sidebar from './components/Sidebar'

function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [model, setModel] = useState('echo:mini')
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

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
    if (!input.trim()) return
    setLoading(true)
    const userMsg = { role: 'user', content: input, conversation_id: conversation?.id || '' }
    const all = [...messages, userMsg]
    setMessages(all)
    setInput('')
    try {
      const payload = {
        model,
        conversation_id: conversation?.id,
        messages: all.map(m => ({ role: m.role, content: m.content, conversation_id: conversation?.id || '' }))
      }
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

  useEffect(() => {
    // preload models list so selector has options
    // handled inside component
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex">
      <Sidebar onSelectConversation={loadConversation} onNewConversation={startNewConversation} />
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <ModelSelector value={model} onChange={setModel} />
          <div className="md:col-span-2 text-right">
            <a href="/test" className="text-sm text-blue-600 hover:underline">Connection test</a>
          </div>
        </div>

        <ChatWindow messages={messages} />

        <div className="mt-4 flex gap-2">
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
        </div>
      </div>
    </div>
  )
}

export default App
