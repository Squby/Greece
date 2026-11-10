import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { isDue, schedule } from '../../srs'
import { ProgressBar, Loading, NoWords, Done } from './SessionShell'
import { Card } from '../../components/ui'
import GreekKeyboard from '../../components/GreekKeyboard'
import WordIntro, { introSeen } from '../../components/WordIntro'
import { checkAnswer } from '../../text'
import { speakGreek, ttsSupported } from '../../tts'
import { shuffle, sample } from '../../rand'
import type { Word } from '../../types'

const SESSION = 10 // слов за сессию
const NEED = 2 // сколько раз подряд ответить верно, чтобы закрыть слово

type Item = { word: Word; progress: number }

export default function Learn() {
  const [params] = useSearchParams()
  const lessonSlug = params.get('lesson') ?? undefined
  const pool = useLiveQuery(
    () =>
      lessonSlug ? db.words.where('lessonSlug').equals(lessonSlug).toArray() : db.words.toArray(),
    [lessonSlug],
  )

  const [showIntro, setShowIntro] = useState(() => !introSeen('learn'))
  const [queue, setQueue] = useState<Item[] | null>(null)
  const [total, setTotal] = useState(0)
  const [learned, setLearned] = useState(0)
  const [turn, setTurn] = useState(0)
  const [input, setInput] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [answered, setAnswered] = useState<null | { correct: boolean; answer: string }>(null)

  // Собираем сессию один раз
  useEffect(() => {
    if (pool && queue === null) {
      const ordered = shuffle(pool).sort((a, b) => Number(isDue(b)) - Number(isDue(a)))
      const chosen = ordered.slice(0, Math.min(SESSION, pool.length))
      setQueue(chosen.map((word) => ({ word, progress: 0 })))
      setTotal(chosen.length)
    }
  }, [pool, queue])

  const current = queue?.[0]
  const format: 'choice' | 'written' = (current?.progress ?? 0) === 0 ? 'choice' : 'written'

  // Варианты для режима выбора
  const options = useMemo(() => {
    if (!current || !pool || format !== 'choice') return []
    const distractors = sample(
      pool.filter((p) => p.id !== current.word.id),
      3,
    ).map((p) => p.translation)
    return shuffle([current.word.translation, ...distractors])
  }, [turn, current?.word.id, format, pool])

  useEffect(() => {
    setInput('')
    setPicked(null)
    setAnswered(null)
    // озвучиваем слово при показе — только в режиме выбора, где греческое слово видно
    if (!showIntro && current && format === 'choice') speakGreek(current.word.greek)
  }, [turn, showIntro])

  if (!pool || queue === null) return <Loading />
  if (total === 0) return <NoWords />
  if (showIntro && current) {
    return <WordIntro mode="learn" sample={current.word} onStart={() => setShowIntro(false)} />
  }
  if (queue.length === 0) return <Done count={learned} />
  if (!current) return <Loading />

  const w = current.word

  function submit(correct: boolean, shownAnswer: string) {
    if (answered) return
    setAnswered({ correct, answer: shownAnswer })
  }

  function checkWritten() {
    if (!input.trim()) return
    const r = checkAnswer(input, w.greek)
    submit(r !== 'wrong', w.greek)
  }

  async function next() {
    if (!answered || !queue) return
    const [, ...rest] = queue
    if (answered.correct) {
      const progress = current!.progress + 1
      if (progress >= NEED) {
        // слово закрыто — отметим в интервальном повторении
        if (w.id != null) await db.words.put(schedule(w, 'good'))
        setLearned((n) => n + 1)
        setQueue(rest)
      } else {
        // вернём позже в этой же сессии
        const pos = Math.min(3, rest.length)
        const nq = [...rest]
        nq.splice(pos, 0, { word: w, progress })
        setQueue(nq)
      }
    } else {
      // ошибка — прогресс сбрасывается, слово вернётся позже
      const pos = Math.min(3, rest.length)
      const nq = [...rest]
      nq.splice(pos, 0, { word: w, progress: 0 })
      setQueue(nq)
    }
    setTurn((t) => t + 1)
  }

  return (
    <div>
      <ProgressBar position={learned} total={total} />

      <Card className="mb-6 text-center">
        {format === 'choice' ? (
          <>
            <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">выбери перевод</div>
            <div className="flex items-center justify-center gap-2 py-3">
              <span className="greek text-3xl font-bold text-slate-800">{w.greek}</span>
              {ttsSupported() && (
                <button onClick={() => speakGreek(w.greek)} className="text-2xl" aria-label="Озвучить">
                  🔊
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">напиши по-гречески</div>
            <div className="py-3 text-2xl font-bold text-slate-800">{w.translation}</div>
            {w.note && <div className="text-sm text-slate-400">{w.note}</div>}
          </>
        )}
      </Card>

      {/* Режим выбора */}
      {format === 'choice' && (
        <div className="grid gap-3">
          {options.map((opt) => {
            const isCorrect = opt === w.translation
            const isPicked = opt === picked
            let style = 'border-slate-200 bg-card text-slate-800'
            if (answered) {
              if (isCorrect) style = 'border-emerald-400 bg-emerald-50 text-emerald-800'
              else if (isPicked) style = 'border-rose-400 bg-rose-50 text-rose-800'
              else style = 'border-slate-200 bg-card text-slate-400'
            }
            return (
              <button
                key={opt}
                disabled={answered !== null}
                onClick={() => {
                  setPicked(opt)
                  submit(opt === w.translation, w.translation)
                }}
                className={`rounded-xl border-2 px-4 py-4 text-left text-lg font-medium transition active:scale-[0.99] ${style}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      )}

      {/* Режим набора */}
      {format === 'written' && (
        <div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (answered ? next() : checkWritten())}
            disabled={answered !== null}
            autoFocus
            placeholder="γράψε εδώ…"
            className="greek w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-2xl outline-none focus:border-brand disabled:bg-slate-50"
          />
          {answered === null && <GreekKeyboard onInsert={(ch) => setInput((v) => v + ch)} />}
        </div>
      )}

      {/* Обратная связь + кнопка «Дальше» */}
      {answered && (
        <div className="mt-5">
          {answered.correct ? (
            <p className="text-center font-semibold text-emerald-600">✓ Правильно!</p>
          ) : (
            <p className="text-center font-semibold text-rose-600">
              Правильно: <span className="greek">{w.greek}</span> — {w.translation}
            </p>
          )}
          <button
            onClick={next}
            className="mt-4 w-full rounded-xl bg-brand px-5 py-3 font-semibold text-white active:scale-[0.98]"
          >
            Дальше
          </button>
        </div>
      )}
    </div>
  )
}
