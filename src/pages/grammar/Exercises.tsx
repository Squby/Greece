import { useState, useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db } from '../../db'
import { Button, Card, Empty } from '../../components/ui'
import { ProgressBar, Loading, Done } from '../words/SessionShell'
import GreekKeyboard from '../../components/GreekKeyboard'
import { checkAnswer, type CheckResult } from '../../text'
import type { Exercise } from '../../types'

// Порядок упражнений задаётся в материале урока (ключ "...::e::<номер>").
// Сохраняем его: сначала простые задания с примерами, затем — без них.
function exOrder(ex: Exercise): number {
  const m = ex.key.match(/::e::(\d+)$/)
  return m ? Number(m[1]) : ex.id ?? 0
}

export default function Exercises() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const lessonSlug = params.get('lesson') ?? undefined
  const all = useLiveQuery(
    () =>
      lessonSlug
        ? db.exercises.where('lessonSlug').equals(lessonSlug).toArray()
        : db.exercises.toArray(),
    [lessonSlug],
  )
  const [queue, setQueue] = useState<Exercise[] | null>(null)
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [correct, setCorrect] = useState(0)
  const built = useRef(false)

  // Формируем сессию один раз: по порядку из материала (простые → сложные)
  useEffect(() => {
    if (all && !built.current) {
      built.current = true
      setQueue([...all].sort((a, b) => exOrder(a) - exOrder(b)))
    }
  }, [all])

  const current = queue?.[index]

  useEffect(() => {
    setInput('')
    setResult(null)
  }, [current?.id])

  if (!all || !queue) return <Loading />

  if (all.length === 0) {
    return (
      <div className="mt-10">
        <Empty>
          Нет упражнений. Добавь их в разделе «Редактор».
          <div className="mt-4">
            <Button onClick={() => nav('/editor/grammar')}>Добавить упражнения</Button>
          </div>
        </Empty>
      </div>
    )
  }

  if (index >= queue.length) {
    return (
      <Done count={correct}>
        <p className="mt-1 text-slate-500">Верно из {queue.length}</p>
      </Done>
    )
  }

  const ex = current!

  function check() {
    if (!input.trim()) return
    const r = checkAnswer(input, ex.answer)
    setResult(r)
    if (r !== 'wrong') setCorrect((c) => c + 1)
  }

  const [before, after] = ex.prompt.split('___')

  return (
    <div>
      <ProgressBar position={index} total={queue.length} />

      <Card>
        {ex.example && (
          <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
            <span className="font-semibold">Пример: </span>
            <span className="greek">{ex.example}</span>
          </div>
        )}

        <div className="greek text-xl leading-relaxed text-slate-800">
          {before}
          <span className="font-bold text-[#0d3b66]">{result ? ex.answer : '___'}</span>
          {after}
        </div>
        {ex.hint && <div className="mt-3 text-sm text-slate-400">💡 {ex.hint}</div>}

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (result ? setIndex((i) => i + 1) : check())}
          disabled={result !== null}
          autoFocus
          placeholder="форма глагола…"
          className="greek mt-5 w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-xl outline-none focus:border-[#0d3b66] disabled:bg-slate-50"
        />

        {result === null && <GreekKeyboard onInsert={(ch) => setInput((v) => v + ch)} />}
      </Card>

      {result === 'correct' && (
        <p className="mt-4 text-center font-semibold text-emerald-600">✓ Правильно!</p>
      )}
      {result === 'accent' && (
        <p className="mt-4 text-center font-semibold text-amber-600">
          Верно, но следи за ударениями: <span className="greek">{ex.answer}</span>
        </p>
      )}
      {result === 'wrong' && (
        <p className="mt-4 text-center font-semibold text-rose-600">
          Правильный ответ: <span className="greek">{ex.answer}</span>
        </p>
      )}

      <div className="mt-6">
        {result === null ? (
          <Button className="w-full" onClick={check} disabled={!input.trim()}>
            Проверить
          </Button>
        ) : (
          <Button className="w-full" onClick={() => setIndex((i) => i + 1)}>
            Дальше
          </Button>
        )}
      </div>
    </div>
  )
}
