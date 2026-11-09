import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useReviewSession } from './useReviewSession'
import { ProgressBar, Loading, NoWords, Done } from './SessionShell'
import { Button, Card } from '../../components/ui'
import WordIntro, { introSeen } from '../../components/WordIntro'
import { speakGreek, ttsSupported } from '../../tts'
import type { Grade } from '../../srs'

export default function Flashcards() {
  const [params] = useSearchParams()
  const s = useReviewSession(params.get('lesson') ?? undefined)
  const [revealed, setRevealed] = useState(false)
  const [showIntro, setShowIntro] = useState(() => !introSeen('flashcards'))

  // Сбрасываем «переворот» при смене слова
  useEffect(() => {
    setRevealed(false)
  }, [s.current?.id])

  if (s.loading) return <Loading />
  if (s.total === 0) return <NoWords />
  if (showIntro && s.current) {
    return <WordIntro mode="flashcards" sample={s.current} onStart={() => setShowIntro(false)} />
  }
  if (s.finished) return <Done count={s.done} />

  const w = s.current!

  function grade(g: Grade) {
    s.grade(g)
  }

  return (
    <div>
      <ProgressBar position={s.position - 1} total={s.total} />

      <Card className="min-h-[220px] text-center">
        <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
          {revealed ? 'перевод' : 'греческий'}
        </div>

        {!revealed ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="greek text-4xl font-bold text-slate-800">{w.greek}</div>
            {ttsSupported() && (
              <button
                onClick={() => speakGreek(w.greek)}
                className="text-2xl"
                aria-label="Озвучить"
              >
                🔊
              </button>
            )}
          </div>
        ) : (
          <div className="py-6">
            <div className="text-3xl font-bold text-slate-800">{w.translation}</div>
            <div className="greek mt-2 text-lg text-slate-400">{w.greek}</div>
            {w.note && <div className="mt-2 text-sm text-slate-400">{w.note}</div>}
          </div>
        )}
      </Card>

      {!revealed ? (
        <div className="mt-6">
          <Button
            className="w-full"
            onClick={() => {
              setRevealed(true)
              speakGreek(w.greek)
            }}
          >
            Показать перевод
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-4 gap-2">
          <Button variant="danger" onClick={() => grade('again')}>
            Забыл
          </Button>
          <Button variant="ghost" onClick={() => grade('hard')}>
            Трудно
          </Button>
          <Button variant="primary" onClick={() => grade('good')}>
            Помню
          </Button>
          <Button variant="success" onClick={() => grade('easy')}>
            Легко
          </Button>
        </div>
      )}
    </div>
  )
}
