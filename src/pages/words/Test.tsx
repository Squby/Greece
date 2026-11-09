import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { isDue, schedule } from '../../srs'
import { ProgressBar, Loading, NoWords } from './SessionShell'
import { Card, Button } from '../../components/ui'
import GreekKeyboard from '../../components/GreekKeyboard'
import WordIntro, { introSeen } from '../../components/WordIntro'
import { checkAnswer } from '../../text'
import { speakGreek, ttsSupported } from '../../tts'
import { shuffle, sample } from '../../rand'
import type { Word } from '../../types'

const SIZE = 10

type Q =
  | { type: 'choice'; word: Word; options: string[]; correct: string }
  | { type: 'truefalse'; word: Word; shown: string; isReal: boolean }
  | { type: 'written'; word: Word; answer: string }

type Result = { q: Q; correct: boolean; given: string }

function buildQuestions(pool: Word[]): Q[] {
  const ordered = shuffle(pool).sort((a, b) => Number(isDue(b)) - Number(isDue(a)))
  const words = ordered.slice(0, Math.min(SIZE, pool.length))
  const types: Q['type'][] = ['choice', 'truefalse', 'written']
  return words.map((word) => {
    const type = types[Math.floor(Math.random() * types.length)]
    if (type === 'choice') {
      const distractors = sample(
        pool.filter((p) => p.id !== word.id),
        3,
      ).map((p) => p.translation)
      return { type, word, options: shuffle([word.translation, ...distractors]), correct: word.translation }
    }
    if (type === 'truefalse') {
      const showTrue = Math.random() < 0.5 || pool.length < 2
      let shown = word.translation
      if (!showTrue) {
        const others = pool.filter((p) => p.id !== word.id && p.translation !== word.translation)
        shown = others.length ? sample(others, 1)[0].translation : word.translation
      }
      return { type, word, shown, isReal: shown === word.translation }
    }
    return { type, word, answer: word.greek }
  })
}

export default function Test() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const lessonSlug = params.get('lesson') ?? undefined
  const pool = useLiveQuery(
    () =>
      lessonSlug ? db.words.where('lessonSlug').equals(lessonSlug).toArray() : db.words.toArray(),
    [lessonSlug],
  )

  const [showIntro, setShowIntro] = useState(() => !introSeen('test'))
  const [questions, setQuestions] = useState<Q[] | null>(null)
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [input, setInput] = useState('')
  const [graded, setGraded] = useState(false)

  useEffect(() => {
    if (pool && questions === null && pool.length > 0) setQuestions(buildQuestions(pool))
  }, [pool, questions])

  useEffect(() => {
    setInput('')
  }, [index])

  const finished = questions !== null && index >= questions.length

  // По завершении — записываем результат в интервальное повторение (один раз)
  useEffect(() => {
    if (finished && !graded && results.length) {
      setGraded(true)
      ;(async () => {
        for (const r of results) {
          if (r.q.word.id != null) await db.words.put(schedule(r.q.word, r.correct ? 'good' : 'again'))
        }
      })()
    }
  }, [finished, graded, results])

  const q = questions?.[index]

  if (!pool || questions === null) return <Loading />
  if (pool.length === 0) return <NoWords />
  if (showIntro) {
    return <WordIntro mode="test" sample={pool[0]} onStart={() => setShowIntro(false)} />
  }

  if (finished) {
    const score = results.filter((r) => r.correct).length
    const wrong = results.filter((r) => !r.correct)
    return (
      <div>
        <div className="mt-4 text-center">
          <div className="text-6xl">{score === results.length ? '🏆' : '📋'}</div>
          <h2 className="mt-3 text-2xl font-bold text-brand">
            {score} / {results.length}
          </h2>
          <p className="mt-1 text-slate-500">правильных ответов</p>
        </div>

        {wrong.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Разбор ошибок
            </h3>
            <div className="flex flex-col gap-2">
              {wrong.map((r, i) => (
                <Card key={i}>
                  <div className="greek font-semibold text-slate-800">{r.q.word.greek}</div>
                  <div className="text-sm text-slate-500">— {r.q.word.translation}</div>
                  {r.given && (
                    <div className="mt-1 text-sm text-rose-500">твой ответ: {r.given}</div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Button variant="ghost" onClick={() => nav(lessonSlug ? `/lessons/${lessonSlug}` : '/review')}>
            К режимам
          </Button>
          <Button
            onClick={() => {
              setQuestions(buildQuestions(pool))
              setIndex(0)
              setResults([])
              setGraded(false)
            }}
          >
            Ещё раз
          </Button>
        </div>
      </div>
    )
  }

  if (!q) return <Loading />

  function record(correct: boolean, given: string) {
    speakGreek(q!.word.greek) // озвучиваем слово после ответа
    setResults((rs) => [...rs, { q: q!, correct, given }])
    setIndex((i) => i + 1)
  }

  return (
    <div>
      <ProgressBar position={index} total={questions.length} />
      <div className="mb-2 text-center text-xs uppercase tracking-wide text-slate-400">
        Вопрос {index + 1} из {questions.length}
      </div>

      {q.type === 'choice' && <ChoiceQ q={q} onAnswer={record} />}
      {q.type === 'truefalse' && <TrueFalseQ q={q} onAnswer={record} />}
      {q.type === 'written' && (
        <WrittenQ q={q} input={input} setInput={setInput} onAnswer={record} />
      )}
    </div>
  )
}

function Prompt({ word, label }: { word: Word; label: string }) {
  return (
    <Card className="mb-6 text-center">
      <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="greek text-3xl font-bold text-slate-800">{word.greek}</span>
        {ttsSupported() && (
          <button onClick={() => speakGreek(word.greek)} className="text-2xl" aria-label="Озвучить">
            🔊
          </button>
        )}
      </div>
    </Card>
  )
}

function ChoiceQ({
  q,
  onAnswer,
}: {
  q: Extract<Q, { type: 'choice' }>
  onAnswer: (correct: boolean, given: string) => void
}) {
  return (
    <div>
      <Prompt word={q.word} label="выбери перевод" />
      <div className="grid gap-3">
        {q.options.map((opt) => (
          <button
            key={opt}
            onClick={() => onAnswer(opt === q.correct, opt)}
            className="rounded-xl border-2 border-slate-200 bg-card px-4 py-4 text-left text-lg font-medium text-slate-800 active:scale-[0.99]"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function TrueFalseQ({
  q,
  onAnswer,
}: {
  q: Extract<Q, { type: 'truefalse' }>
  onAnswer: (correct: boolean, given: string) => void
}) {
  return (
    <div>
      <Card className="mb-6 text-center">
        <div className="greek text-3xl font-bold text-slate-800">{q.word.greek}</div>
        <div className="mt-1 text-slate-400">—</div>
        <div className="text-2xl font-semibold text-slate-700">{q.shown}</div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onAnswer(q.isReal === true, 'Верно')}
          className="rounded-xl bg-emerald-600 px-5 py-4 text-lg font-semibold text-white active:scale-[0.98]"
        >
          ✓ Верно
        </button>
        <button
          onClick={() => onAnswer(q.isReal === false, 'Неверно')}
          className="rounded-xl bg-rose-600 px-5 py-4 text-lg font-semibold text-white active:scale-[0.98]"
        >
          ✗ Неверно
        </button>
      </div>
    </div>
  )
}

function WrittenQ({
  q,
  input,
  setInput,
  onAnswer,
}: {
  q: Extract<Q, { type: 'written' }>
  input: string
  setInput: (v: string) => void
  onAnswer: (correct: boolean, given: string) => void
}) {
  const disabled = !input.trim()
  function submit() {
    if (disabled) return
    onAnswer(checkAnswer(input, q.answer) !== 'wrong', input)
  }
  return (
    <div>
      <Card className="mb-6 text-center">
        <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">напиши по-гречески</div>
        <div className="py-2 text-2xl font-bold text-slate-800">{q.word.translation}</div>
      </Card>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        autoFocus
        placeholder="γράψε εδώ…"
        className="greek w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-2xl outline-none focus:border-brand"
      />
      <GreekKeyboard onInsert={(ch) => setInput(input + ch)} />
      <Button className="mt-4 w-full" onClick={submit} disabled={disabled}>
        Ответить
      </Button>
    </div>
  )
}
