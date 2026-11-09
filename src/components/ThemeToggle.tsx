import { useState } from 'react'
import { getTheme, setTheme, THEMES, type Theme } from '../theme'

const META: Record<Theme, { icon: string; label: string }> = {
  light: { icon: '☀️', label: 'Светлая' },
  dark: { icon: '🌙', label: 'Тёмная' },
  system: { icon: '🖥️', label: 'Как в системе' },
}

/** Кнопка-переключатель темы: по кругу светлая → тёмная → системная. */
export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(getTheme)

  function cycle() {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
    setTheme(next)
    setThemeState(next)
  }

  return (
    <button
      onClick={cycle}
      aria-label={`Тема: ${META[theme].label}`}
      title={`Тема: ${META[theme].label}`}
      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-card px-3 py-1.5 text-sm text-slate-600 shadow-sm active:scale-95"
    >
      <span className="text-base leading-none">{META[theme].icon}</span>
      <span>{META[theme].label}</span>
    </button>
  )
}
