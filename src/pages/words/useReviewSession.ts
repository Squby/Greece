import { useEffect, useRef, useState } from 'react'
import { db } from '../../db'
import { isDue, schedule, type Grade } from '../../srs'
import type { Word } from '../../types'

const SESSION_LIMIT = 20

/**
 * Загружает слова к тренировке и выдаёт их по одному.
 * - без lessonSlug: общее повторение — сначала просроченные/новые по всей базе
 * - c lessonSlug: все слова урока (для изучения), просроченные первыми
 */
export function useReviewSession(lessonSlug?: string) {
  const [queue, setQueue] = useState<Word[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(0)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    ;(async () => {
      let pool: Word[]
      if (lessonSlug) {
        pool = await db.words.where('lessonSlug').equals(lessonSlug).toArray()
        pool.sort((a, b) => a.due - b.due)
      } else {
        const all = await db.words.toArray()
        pool = all.filter(isDue)
        if (pool.length === 0) pool = all.sort((a, b) => a.due - b.due)
      }
      setQueue(pool.slice(0, SESSION_LIMIT))
      setLoading(false)
    })()
  }, [lessonSlug])

  const current: Word | undefined = queue[index]
  const finished = !loading && index >= queue.length

  async function grade(g: Grade) {
    if (!current) return
    const updated = schedule(current, g)
    if (updated.id != null) await db.words.put(updated)
    setDone((d) => d + 1)
    setIndex((i) => i + 1)
  }

  return {
    loading,
    current,
    finished,
    grade,
    total: queue.length,
    position: index + 1,
    done,
  }
}
