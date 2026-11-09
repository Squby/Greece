import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { isDue } from '../srs'
import { lessons } from '../content'
import { PageTitle, MenuCard, Card } from '../components/ui'

export default function Home() {
  const words = useLiveQuery(() => db.words.toArray(), [])

  const total = words?.length ?? 0
  const dueCount = words?.filter(isDue).length ?? 0
  const learned = words?.filter((w) => w.reps >= 2).length ?? 0

  return (
    <div>
      <PageTitle sub="Учим греческий: слова и грамматика с уроков">Γεια σου! 👋</PageTitle>

      <Card className="mb-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat value={dueCount} label="на повторение" accent />
          <Stat value={learned} label="выучено" />
          <Stat value={total} label="всего слов" />
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <MenuCard
          to="/lessons"
          icon="📚"
          title="Уроки"
          desc={`Программа по порядку · ${lessons.length} ${lessons.length === 1 ? 'урок' : 'уроков'}`}
        />
        <MenuCard
          to="/review"
          icon="🔁"
          title="Повторение"
          desc="Слова из всех уроков — карточки, по буквам, на слух"
          badge={
            dueCount > 0 ? (
              <span className="rounded-full bg-[#0d3b66] px-2.5 py-1 text-xs font-bold text-white">
                {dueCount}
              </span>
            ) : undefined
          }
        />
        <MenuCard to="/editor" icon="✏️" title="Редактор" desc="Свои слова и правила вручную" />
      </div>
    </div>
  )
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div>
      <div className={`text-3xl font-bold ${accent ? 'text-[#0d3b66]' : 'text-slate-800'}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
    </div>
  )
}
