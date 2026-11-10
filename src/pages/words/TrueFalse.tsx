import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useReviewSession } from './useReviewSession'
import { ProgressBar, Loading, NoWords, Done } from './SessionShell'
import { Card } from '../../components/ui'
import WordIntro, { introSeen } from '../../components/WordIntro'
import { speakGreek, ttsSupported } from '../../tts'
import { sample } from '../../rand'

export default function TrueFalse() {
  const [params] = useSearchParams()
  const lessonSlug = params.get('lesson') ?? undefined
  const s = useReviewSession(lessonSlug)
  const pool = useLiveQuery(
    () =>
      lessonSlug ? db.words.where('lessonSlug').equals(lessonSlug).toArray() : db.words.toArray(),
    [lessonSlug],
  )
  const [showIntro, setShowIntro] = useState(() => !introSeen('truefalse'))
  const [answered, setAnswered] = useState<null | { chosenTrue: boolean; correct: boolean }>(null)

  const w = s.current

  // Показываем верную пару или подставляем чужой перевод
  const round = useMemo(() => {
    if (!w || !pool) return null
    const showTrue = Math.random() < 0.5 || pool.length < 2
    let shown = w.translation
    if (!showTrue) {
      const others = pool.filter((p) => p.id !== w.id && p.translation !== w.translation)
      shown = others.length ? sample(others, 1)[0].translation : w.translation
    }
    return { shown, isReal: shown === w.translation }
  }, [w?.id, pool])

  useEffect(() => {
    setAnswered(null)
    if (!showIntro && w) speakGreek(w.greek) // озвучиваем слово при показе
  }, [w?.id, showIntro])

  if (s.loading || !pool) return <Loading />
  if (s.total === 0) return <NoWords />
  if (showIntro && w) {
    return <WordIntro mode="truefalse" sample={w} onStart={() => setShowIntro(false)} />
  }
  if (s.finished) return <Done count={s.done} />
  if (!round || !w) return <Loading />

  function answer(chosenTrue: boolean) {
    if (answered) return
    setAnswered({ chosenTrue, correct: chosenTrue === round!.isReal })
  }

  function next() {
    s.grade(answered!.correct ? 'good' : 'again')
  }

  return (
    <div>
      <ProgressBar position={s.position - 1} total={s.total} />

      <Card className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="greek text-3xl font-bold text-slate-800">{w.greek}</span>
          {ttsSupported() && (
            <button onClick={() => speakGreek(w.greek)} className="text-2xl" aria-label="Озвучить">
              🔊
            </button>
          )}
        </div>
        <div className="mt-2 text-slate-400">—</div>
        <div className="text-2xl font-semibold text-slate-700">{round.shown}</div>
      </Card>

      {answered === null ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => answer(true)}
            className="rounded-xl bg-emerald-600 px-5 py-4 text-lg font-semibold text-white active:scale-[0.98]"
          >
            ✓ Верно
          </button>
          <button
            onClick={() => answer(false)}
            className="rounded-xl bg-rose-600 px-5 py-4 text-lg font-semibold text-white active:scale-[0.98]"
          >
            ✗ Неверно
          </button>
        </div>
      ) : (
        <div>
          {answered.correct ? (
            <p className="text-center font-semibold text-emerald-600">✓ Правильно!</p>
          ) : (
            <p className="text-center font-semibold text-rose-600">
              Неверно. {w.greek} — это «{w.translation}»
            </p>
          )}
          <button
            onClick={next}
            className="mt-6 w-full rounded-xl bg-brand px-5 py-3 font-semibold text-white active:scale-[0.98]"
          >
            Дальше
          </button>
        </div>
      )}
    </div>
  )
}
