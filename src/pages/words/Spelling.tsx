import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useReviewSession } from './useReviewSession'
import { ProgressBar, Loading, NoWords, Done } from './SessionShell'
import { Button, Card } from '../../components/ui'
import GreekKeyboard from '../../components/GreekKeyboard'
import WordIntro, { introSeen } from '../../components/WordIntro'
import { checkAnswer, type CheckResult } from '../../text'
import { speakGreek, ttsSupported } from '../../tts'

export default function Spelling() {
  const [params] = useSearchParams()
  const s = useReviewSession(params.get('lesson') ?? undefined)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [showIntro, setShowIntro] = useState(() => !introSeen('spelling'))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInput('')
    setResult(null)
  }, [s.current?.id])

  if (s.loading) return <Loading />
  if (s.total === 0) return <NoWords />
  if (showIntro && s.current) {
    return <WordIntro mode="spelling" sample={s.current} onStart={() => setShowIntro(false)} />
  }
  if (s.finished) return <Done count={s.done} />

  const w = s.current!

  function check() {
    if (!input.trim()) return
    setResult(checkAnswer(input, w.greek))
  }

  function next() {
    if (result === 'wrong') s.grade('again')
    else if (result === 'accent') s.grade('hard')
    else s.grade('good')
  }

  return (
    <div>
      <ProgressBar position={s.position - 1} total={s.total} />

      <Card className="text-center">
        <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">напиши по-гречески</div>
        <div className="text-3xl font-bold text-slate-800">{w.translation}</div>
        {w.note && <div className="mt-1 text-sm text-slate-400">{w.note}</div>}

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (result ? next() : check())}
          disabled={result !== null}
          autoFocus
          placeholder="γράψε εδώ…"
          className="greek mt-5 w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-2xl outline-none focus:border-brand disabled:bg-slate-50"
        />

        {result === null && <GreekKeyboard onInsert={(ch) => setInput((v) => v + ch)} />}
      </Card>

      {result && <Feedback result={result} answer={w.greek} />}

      <div className="mt-6">
        {result === null ? (
          <Button className="w-full" onClick={check} disabled={!input.trim()}>
            Проверить
          </Button>
        ) : (
          <div className="flex gap-3">
            {ttsSupported() && (
              <Button variant="ghost" onClick={() => speakGreek(w.greek)}>
                🔊
              </Button>
            )}
            <Button className="flex-1" onClick={next}>
              Дальше
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function Feedback({ result, answer }: { result: CheckResult; answer: string }) {
  if (result === 'correct')
    return <p className="mt-4 text-center font-semibold text-emerald-600">✓ Правильно!</p>
  if (result === 'accent')
    return (
      <p className="mt-4 text-center font-semibold text-amber-600">
        Почти! Следи за ударениями: <span className="greek">{answer}</span>
      </p>
    )
  return (
    <p className="mt-4 text-center font-semibold text-rose-600">
      Правильно так: <span className="greek">{answer}</span>
    </p>
  )
}
