import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../../db'
import { lessons } from '../../content'
import { PageTitle, Empty } from '../../components/ui'

export default function LessonsPath() {
  const words = useLiveQuery(() => db.words.toArray(), [])

  // Прогресс по уроку: доля слов, которые уже «закреплены» (reps >= 2)
  function progress(slug: string): { learned: number; total: number } {
    const w = (words ?? []).filter((x) => x.lessonSlug === slug)
    return { learned: w.filter((x) => x.reps >= 2).length, total: w.length }
  }

  return (
    <div>
      <PageTitle sub="Проходи уроки по порядку">📚 Уроки</PageTitle>

      {lessons.length === 0 ? (
        <Empty>Пока нет уроков. Пришли материалы — и урок появится здесь.</Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {lessons.map((l) => {
            const p = progress(l.slug)
            const pct = p.total ? Math.round((p.learned / p.total) * 100) : 0
            const complete = p.total > 0 && p.learned === p.total
            return (
              <Link
                key={l.slug}
                to={`/lessons/${l.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
                      complete ? 'bg-emerald-500 text-white' : 'bg-[#0d3b66] text-white'
                    }`}
                  >
                    {complete ? '✓' : l.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800">{l.title}</div>
                    {l.summary && (
                      <div className="truncate text-sm text-slate-500">{l.summary}</div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#0d3b66] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    {p.learned}/{p.total}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
