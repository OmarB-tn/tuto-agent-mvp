import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ChatBot from './components/ChatBot.jsx'
import { useAgentSocket } from './hooks/useAgentSocket.js'

// Tuto — MVP: vision-guided computer-use agent with a live HUD.
// Thin orchestrator: Sidebar (projects) + ChatBot (chat + execution log).
// All WebSocket logic lives in useAgentSocket.
export default function App() {
  const { isConnected, logs, agentStatus, sendGoal, stopAgent } = useAgentSocket()
  const [projects, setProjects] = useState([])
  const [currentProjectId, setCurrentProjectId] = useState(null)

  const currentProject = projects.find((p) => p.id === currentProjectId) ?? null

  const handleNewProject = () => {
    const project = {
      id: Date.now(),
      name: `Project ${projects.length + 1}`,
      info: 'Nouveau',
      section: 'RECENT',
    }
    setProjects((prev) => [project, ...prev])
    setCurrentProjectId(project.id)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white font-sans text-slate-800">
      <Sidebar
        projects={projects}
        currentProjectId={currentProjectId}
        isConnected={isConnected}
        onNewProject={handleNewProject}
        onSelectProject={setCurrentProjectId}
      />
      <ChatBot
        currentProject={currentProject}
        logs={logs}
        agentStatus={isConnected ? agentStatus : 'disconnected'}
        onSendMessage={sendGoal}
        onEmergencyStop={stopAgent}
      />
    </div>
  )
}
