import { Outlet, NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Главная', icon: '🏠', end: true },
  { to: '/lessons', label: 'Уроки', icon: '📚' },
  { to: '/review', label: 'Повторение', icon: '🔁' },
  { to: '/editor', label: 'Редактор', icon: '✏️' },
]

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col">
      <main className="flex-1 px-4 pb-24 pt-5">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-[#0d3b66]' : 'text-slate-400'
                }`
              }
            >
              <span className="text-xl leading-none">{t.icon}</span>
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
