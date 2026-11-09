import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Empty } from '../../components/ui'

export function ProgressBar({ position, total }: { position: number; total: number }) {
  const pct = total ? Math.min(100, (position / total) * 100) : 0
  return (
    <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-[#0d3b66] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function Loading() {
  return <p className="mt-10 text-center text-slate-400">Загрузка…</p>
}

export function NoWords() {
  const nav = useNavigate()
  return (
    <div className="mt-10">
      <Empty>
        Пока нет слов. Добавь их в разделе «Редактор».
        <div className="mt-4">
          <Button onClick={() => nav('/editor/words')}>Добавить слова</Button>
        </div>
      </Empty>
    </div>
  )
}

export function Done({ count, children }: { count: number; children?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="mt-10 text-center">
      <div className="text-6xl">🎉</div>
      <h2 className="mt-4 text-2xl font-bold text-[#0d3b66]">Μπράβο!</h2>
      <p className="mt-1 text-slate-500">Повторено слов: {count}</p>
      {children}
      <div className="mt-6 flex justify-center gap-3">
        <Button variant="ghost" onClick={() => nav('/words')}>
          К режимам
        </Button>
        <Button onClick={() => window.location.reload()}>Ещё раз</Button>
      </div>
    </div>
  )
}
