import { useState, useEffect, useRef, useCallback } from 'react'

const DEFAULT_URL = 'ws://127.0.0.1:8000/ws/agent'

// Single owner of the agent WebSocket connection.
// Protocol — client -> server: { goal, files } | { action: 'STOP' }
//             server -> client: { action: 'CLICK' | 'DONE' | 'STATUS' | 'ERROR', text, x?, y? }
export function useAgentSocket(url = DEFAULT_URL) {
  const [isConnected, setIsConnected] = useState(false)
  const [logs, setLogs] = useState([])
  const [agentStatus, setAgentStatus] = useState('idle')
  const socketRef = useRef(null)

  useEffect(() => {
    const ws = new WebSocket(url)
    socketRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      setAgentStatus('idle')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        // Legacy { type, payload } support
        if (data.type === 'STATUS') {
          setAgentStatus(String(data.payload))
          return
        }
        if (data.type === 'LOG') {
          setLogs((prev) => [...prev, data.payload])
          return
        }
        // Current { action, text } protocol
        setLogs((prev) => [...prev, data])
        if (data.action === 'DONE') setAgentStatus('idle')
        else setAgentStatus('running')
      } catch {
        setLogs((prev) => [...prev, { action: 'LOG', text: event.data }])
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      setAgentStatus('disconnected')
    }

    ws.onerror = () => {
      setIsConnected(false)
      setAgentStatus('disconnected')
    }

    return () => ws.close()
  }, [url])

  const sendGoal = useCallback(
    ({ goal, files = [] }) => {
      const socket = socketRef.current
      if (!socket || socket.readyState !== WebSocket.OPEN) return
      if (!goal?.trim() && files.length === 0) return
      socket.send(JSON.stringify({ goal: goal.trim(), files }))
      setAgentStatus('running')
    },
    [],
  )

  const stopAgent = useCallback(() => {
    const socket = socketRef.current
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'STOP' }))
    }
    setAgentStatus('idle')
  }, [])

  return { isConnected, logs, agentStatus, sendGoal, stopAgent }
}
