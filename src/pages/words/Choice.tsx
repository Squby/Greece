import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useReviewSession } from './useReviewSession'
import { ProgressBar, Loading, NoWords, Done } from './SessionShell'
import { Card } from '../../components/ui'
import WordIntro, { introSeen } from '../../components/WordIntro'
import { speakGreek, ttsSupported } from '../../tts'

function sample<T>(arr: T[], n: number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

export default function Choice() {
  const [params] = useSearchParams()
  const lessonSlug = params.get('lesson') ?? undefined
  const s = useReviewSession(lessonSlug)
  const pool = useLiveQuery(
    () =>
      lessonSlug ? db.words.where('lessonSlug').equals(lessonSlug).toArray() : db.words.toArray(),
    [lessonSlug],
  )
  const [showIntro, setShowIntro] = useState(() => !introSeen('choice'))
  const [picked, setPicked] = useState<string | null>(null)

  const w = s.current

  // Направление и варианты пересчитываем при смене слова
  const round = useMemo(() => {
    if (!w || !pool) return null
    // greek→перевод (true) или перевод→greek (false)
    const greekToRu = Math.random() < 0.5
    const correct = greekToRu ? w.translation : w.greek
    const distractors = sample(
      pool.filter((p) => p.id !== w.id),
      3,
    ).map((p) => (greekToRu ? p.translation : p.greek))
    const options = sample([correct, ...distractors], distractors.length + 1)
    return { greekToRu, prompt: greekToRu ? w.greek : w.translation, correct, options }
  }, [w?.id, pool])

  useEffect(() => {
    setPicked(null)
  }, [w?.id])

  if (s.loading || !pool) return <Loading />
  if (s.total === 0) return <NoWords />
  if (showIntro && w) {
    return <WordIntro mode="choice" sample={w} onStart={() => setShowIntro(false)} />
  }
  if (s.finished) return <Done count={s.done} />
  if (!round || !w) return <Loading />

  function choose(opt: string) {
    if (picked) return
    setPicked(opt)
    speakGreek(w.greek) // озвучиваем слово после ответа
  }

  function next() {
    s.grade(picked === round!.correct ? 'good' : 'again')
  }

  return (
    <div>
      <ProgressBar position={s.position - 1} total={s.total} />

      <Card className="mb-6 text-center">
        <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
          {round.greekToRu ? 'выбери перевод' : 'выбери слово по-гречески'}
        </div>
        <div
          className={`py-4 font-bold text-slate-800 ${round.greekToRu ? 'greek text-3xl' : 'text-2xl'}`}
        >
          {round.prompt}
        </div>
        {round.greekToRu && ttsSupported() && (
          <button onClick={() => speakGreek(w.greek)} className="text-2xl" aria-label="Озвучить">
            🔊
          </button>
        )}
      </Card>

      <div className="grid gap-3">
        {round.options.map((opt) => {
          const isCorrect = opt === round.correct
          const isPicked = opt === picked
          let style = 'border-slate-200 bg-card text-slate-800'
          if (picked) {
            if (isCorrect) style = 'border-emerald-400 bg-emerald-50 text-emerald-800'
            else if (isPicked) style = 'border-rose-400 bg-rose-50 text-rose-800'
            else style = 'border-slate-200 bg-card text-slate-400'
          }
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={picked !== null}
              className={`rounded-xl border-2 px-4 py-4 text-left text-lg font-medium transition active:scale-[0.99] ${style} ${
                !round.greekToRu ? 'greek' : ''
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {picked && (
        <button
          onClick={next}
          className="mt-6 w-full rounded-xl bg-brand px-5 py-3 font-semibold text-white active:scale-[0.98]"
        >
          Дальше
        </button>
      )}
    </div>
  )
}
