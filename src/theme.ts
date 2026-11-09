// Управление темой: светлая / тёмная / как в системе. Выбор хранится в localStorage.

export type Theme = 'light' | 'dark' | 'system'
export const THEMES: Theme[] = ['light', 'dark', 'system']

const KEY = 'greek-theme'

export function getTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY) as Theme | null
    if (t && THEMES.includes(t)) return t
  } catch {
    /* localStorage недоступен */
  }
  return 'system'
}

function prefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function resolveTheme(t: Theme): 'light' | 'dark' {
  return t === 'system' ? (prefersDark() ? 'dark' : 'light') : t
}

export function applyTheme(t: Theme): void {
  document.documentElement.classList.toggle('dark', resolveTheme(t) === 'dark')
}

export function setTheme(t: Theme): void {
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* игнорируем */
  }
  applyTheme(t)
}

/** Применяет сохранённую тему и следит за системными изменениями в режиме «system». */
export function initTheme(): void {
  applyTheme(getTheme())
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'system') applyTheme('system')
  })
}
