import { Plus, Search, FolderClosed, EllipsisVertical, LibraryBig } from 'lucide-react'

export default function Sidebar({ projects = [], currentProjectId, isConnected, onNewProject, onSelectProject }) {
  const groupedProjects = projects.reduce((groups, project) => {
    const section = project.section || 'RECENT'
    if (!groups[section]) groups[section] = []
    groups[section].push(project)
    return groups
  }, {})

  return (
    <aside className="flex w-72 flex-col gap-6 border-r border-slate-200 bg-slate-50 p-6 text-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-red-600 text-center text-xl font-bold leading-8 text-white">T</div>
          <span className="text-2xl font-bold text-slate-900">Tuto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'animate-pulse bg-emerald-500' : 'bg-slate-300'}`} />
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500">
            <LibraryBig size={20} />
          </div>
        </div>
      </div>

      <button
        onClick={onNewProject}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
      >
        <Plus size={20} />
        New Project
      </button>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none"
        />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
        {Object.keys(groupedProjects).length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No projects found. create a new project to get started.
          </div>
        ) : (
          Object.entries(groupedProjects).map(([section, projectsList]) => (
            <div key={section} className="space-y-2">
              <h3 className="pl-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{section}</h3>
              {projectsList.map((project) => (
                <div
                  key={project.id}
                  onClick={() => onSelectProject?.(project.id)}
                  className={`flex cursor-pointer items-start gap-3.5 rounded-xl p-3 ${project.id === currentProjectId ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${project.id === currentProjectId ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                    <FolderClosed size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">{project.name}</p>
                    <p className="truncate text-xs text-slate-500">{project.info || 'Nouveau'}</p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </nav>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-5">
        <div className="h-10 w-10 rounded-full bg-slate-200 text-center text-xl font-medium leading-10 text-slate-500">G</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-950">Guest</p>
          <p className="text-xs text-slate-500">Studio • Pro</p>
        </div>
        <EllipsisVertical size={20} className="text-slate-500" />
      </div>
    </aside>
  )
}
