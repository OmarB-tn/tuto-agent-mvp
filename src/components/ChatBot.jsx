import { Users, Paperclip, ArrowUp, Bot, FileText, X } from 'lucide-react'
import { useState, useRef } from 'react'

export default function ChatBot({ currentProject, logs = [], agentStatus, onSendMessage, onEmergencyStop }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [attachedFiles, setAttachedFiles] = useState([])
  const fileInputRef = useRef(null)

  const handlePaperclipClick = () => fileInputRef.current?.click()

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length > 0) setAttachedFiles((prev) => [...prev, ...selected])
    e.target.value = ''
  }

  const removeFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text && attachedFiles.length === 0) return

    const fileData = attachedFiles.map((file) => ({ name: file.name }))
    setMessages((prev) => [...prev, { id: Date.now(), type: 'user', text, files: fileData }])
    onSendMessage({ goal: text, files: fileData })

    setInputValue('')
    setAttachedFiles([])
  }

  return (
    <main className="flex h-full flex-1 flex-col overflow-hidden bg-white text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-100 p-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">{currentProject?.name || 'New Session'}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{currentProject?.info || 'Offline'}</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-700">Status: {agentStatus}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onEmergencyStop}
            className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-red-700"
          >
            EMERGENCY STOP
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">
            <Users size={18} /> Share
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-8">
        {messages.length === 0 && logs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Bot size={28} />
            </div>
            <p className="text-sm font-medium">Need help with something...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[70%] rounded-2xl bg-slate-100 p-4 text-slate-900">
                <p className="text-sm">{msg.text}</p>
                {msg.files?.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">📎 {msg.files.map((f) => f.name).join(', ')}</p>
                )}
              </div>
            </div>
          ))
        )}

        {logs.length > 0 && (
          <div className="space-y-1 rounded-xl bg-slate-900 p-4 font-mono text-xs text-emerald-400">
            <p className="font-sans text-[10px] font-bold uppercase text-slate-500">Live Agent Execution Log</p>
            {logs.map((log, idx) => (
              <p key={idx}>
                <span className="font-bold text-yellow-400">[{log.action ?? 'LOG'}]</span>{' '}
                <span className="text-slate-200">{typeof log === 'string' ? log : (log.text ?? JSON.stringify(log))}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <footer className="flex flex-col items-center gap-2 border-t border-slate-100 p-6">
        <div className="flex w-full max-w-4xl flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-slate-100 px-2 pb-2 pt-1">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  <FileText size={14} className="text-red-600" />
                  <span className="max-w-[180px] truncate">{file.name}</span>
                  <button onClick={() => removeFile(index)} className="ml-1 cursor-pointer text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
            <button
              type="button"
              onClick={handlePaperclipClick}
              className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Posez une question ou entrez une commande..."
              className="flex-1 border-none bg-transparent px-2 text-sm focus:outline-none"
            />
            <button onClick={handleSend} className="cursor-pointer rounded-xl bg-red-600 p-2.5 text-white transition hover:bg-red-700">
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </footer>
    </main>
  )
}
