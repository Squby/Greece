import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { isDue } from '../../srs'
import { Button } from '../../components/ui'
import WordIntro, { introSeen } from '../../components/WordIntro'
import { Loading, NoWords } from './SessionShell'
import { speakGreek } from '../../tts'
import type { Word } from '../../types'

const PAIRS = 6 // сколько пар на поле

type Tile = { tid: number; wordId: number; text: string; kind: 'gr' | 'ru' }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildTiles(words: Word[]): Tile[] {
  let tid = 0
  const tiles: Tile[] = []
  for (const w of words) {
    tiles.push({ tid: tid++, wordId: w.id!, text: w.greek, kind: 'gr' })
    tiles.push({ tid: tid++, wordId: w.id!, text: w.translation, kind: 'ru' })
  }
  return shuffle(tiles)
}

export default function Match() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const lessonSlug = params.get('lesson') ?? undefined
  const pool = useLiveQuery(
    () =>
      lessonSlug ? db.words.where('lessonSlug').equals(lessonSlug).toArray() : db.words.toArray(),
    [lessonSlug],
  )

  const [showIntro, setShowIntro] = useState(() => !introSeen('match'))
  const [tiles, setTiles] = useState<Tile[]>([])
  const [selected, setSelected] = useState<Tile | null>(null)
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [wrong, setWrong] = useState<Set<number>>(new Set())
  const [seconds, setSeconds] = useState(0)
  const [won, setWon] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const newGame = useCallback(() => {
    if (!pool || pool.length === 0) return
    // «срочные» слова первыми, среди равных — случайно; берём до PAIRS штук
    const ordered = shuffle(pool).sort((a, b) => Number(isDue(b)) - Number(isDue(a)))
    const picked = ordered.slice(0, Math.min(PAIRS, pool.length))
    setTiles(buildTiles(picked))
    setSelected(null)
    setMatched(new Set())
    setWrong(new Set())
    setSeconds(0)
    setWon(false)
  }, [pool])

  // Старт игры, когда данные готовы и разбор закрыт
  useEffect(() => {
    if (pool && pool.length > 0 && tiles.length === 0 && !showIntro) newGame()
  }, [pool, tiles.length, showIntro, newGame])

  // Таймер
  useEffect(() => {
    if (won || showIntro || tiles.length === 0) return
    timer.current = setInterval(() => setSeconds((x) => x + 1), 1000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [won, showIntro, tiles.length])

  // Победа, когда все пары собраны
  useEffect(() => {
    if (tiles.length > 0 && matched.size === tiles.length) setWon(true)
  }, [matched, tiles.length])

  if (!pool) return <Loading />
  if (pool.length === 0) return <NoWords />
  if (showIntro) {
    return <WordIntro mode="match" sample={pool[0]} onStart={() => setShowIntro(false)} />
  }

  function click(t: Tile) {
    if (matched.has(t.tid) || won) return
    if (!selected) {
      setSelected(t)
      return
    }
    if (selected.tid === t.tid) {
      setSelected(null)
      return
    }
    if (selected.wordId === t.wordId && selected.kind !== t.kind) {
      // верная пара
      const m = new Set(matched)
      m.add(selected.tid)
      m.add(t.tid)
      setMatched(m)
      setSelected(null)
      // озвучиваем греческое слово собранной пары
      speakGreek(selected.kind === 'gr' ? selected.text : t.text)
    } else {
      // неверно — подсветить красным на мгновение
      const pair = new Set([selected.tid, t.tid])
      setWrong(pair)
      setSelected(null)
      setTimeout(() => setWrong(new Set()), 600)
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  if (won) {
    return (
      <div className="mt-10 text-center">
        <div className="text-6xl">🏆</div>
        <h2 className="mt-4 text-2xl font-bold text-[#0d3b66]">Все пары собраны!</h2>
        <p className="mt-1 text-slate-500">
          Время: {mm}:{ss}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            variant="ghost"
            onClick={() => nav(lessonSlug ? `/lessons/${lessonSlug}` : '/review')}
          >
            К режимам
          </Button>
          <Button onClick={newGame}>Ещё раз</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0d3b66]">🧩 Подбор пар</h1>
        <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-slate-600">
          {mm}:{ss}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {tiles.map((t) => {
          const isMatched = matched.has(t.tid)
          const isSelected = selected?.tid === t.tid
          const isWrong = wrong.has(t.tid)
          let style = 'border-slate-200 bg-white text-slate-800'
          if (isMatched) style = 'border-transparent bg-transparent text-transparent'
          else if (isWrong) style = 'border-rose-400 bg-rose-50 text-rose-700'
          else if (isSelected) style = 'border-[#0d3b66] bg-sky-50 text-[#0d3b66]'
          return (
            <button
              key={t.tid}
              onClick={() => click(t)}
              disabled={isMatched}
              className={`flex min-h-[72px] items-center justify-center rounded-xl border-2 p-2 text-center text-sm font-medium transition active:scale-[0.97] ${style} ${
                t.kind === 'gr' ? 'greek' : ''
              }`}
            >
              {t.text}
            </button>
          )
        })}
      </div>

      <button
        onClick={newGame}
        className="mt-6 w-full rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-600 active:scale-[0.98]"
      >
        Новые пары
      </button>
    </div>
  )
}
