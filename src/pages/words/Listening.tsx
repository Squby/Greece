import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useReviewSession } from './useReviewSession'
import { ProgressBar, Loading, NoWords, Done } from './SessionShell'
import { Button, Card, Empty } from '../../components/ui'
import GreekKeyboard from '../../components/GreekKeyboard'
import VoiceNotice, { useGreekVoice } from '../../components/VoiceNotice'
import WordIntro, { introSeen } from '../../components/WordIntro'
import { checkAnswer, type CheckResult } from '../../text'
import { speakGreek, ttsSupported } from '../../tts'

export default function Listening() {
  const [params] = useSearchParams()
  const s = useReviewSession(params.get('lesson') ?? undefined)
  const { ready, hasGreek } = useGreekVoice()
  const [input, setInput] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [showIntro, setShowIntro] = useState(() => !introSeen('listening'))

  // Автоматически проговариваем слово при его появлении (но не во время разбора)
  useEffect(() => {
    setInput('')
    setResult(null)
    if (s.current && hasGreek && !showIntro) {
      const t = setTimeout(() => speakGreek(s.current!.greek), 300)
      return () => clearTimeout(t)
    }
  }, [s.current?.id, hasGreek, showIntro])

  if (s.loading) return <Loading />
  if (s.total === 0) return <NoWords />

  // Без греческого голоса режим «на слух» бессмыслен — показываем инструкцию
  if (!ttsSupported() || (ready && !hasGreek)) {
    return (
      <div className="mt-6">
        <VoiceNotice />
        <Empty>
          Для режима «На слух» нужен греческий голос. Пока его нет — попробуй «Карточки» или «По
          буквам».
        </Empty>
      </div>
    )
  }

  if (showIntro && s.current) {
    return <WordIntro mode="listening" sample={s.current} onStart={() => setShowIntro(false)} />
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
        <div className="mb-3 text-xs uppercase tracking-wide text-slate-400">
          послушай и запиши
        </div>

        <button
          onClick={() => speakGreek(w.greek)}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-brand text-5xl text-white shadow-lg active:scale-95"
          aria-label="Повторить звук"
        >
          🔊
        </button>
        <div className="mt-2 text-xs text-slate-400">нажми, чтобы повторить</div>

        <input
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

      {result && (
        <div className="mt-4 text-center">
          {result === 'correct' && <p className="font-semibold text-emerald-600">✓ Правильно!</p>}
          {result === 'accent' && (
            <p className="font-semibold text-amber-600">
              Почти — ударения: <span className="greek">{w.greek}</span>
            </p>
          )}
          {result === 'wrong' && (
            <p className="font-semibold text-rose-600">
              Это слово: <span className="greek">{w.greek}</span> — {w.translation}
            </p>
          )}
        </div>
      )}

      <div className="mt-6">
        {result === null ? (
          <Button className="w-full" onClick={check} disabled={!input.trim()}>
            Проверить
          </Button>
        ) : (
          <Button className="w-full" onClick={next}>
            Дальше
          </Button>
        )}
      </div>
    </div>
  )
}
