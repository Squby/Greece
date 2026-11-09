import type { Word } from './types'

export const DAY = 24 * 60 * 60 * 1000

export type Grade = 'again' | 'hard' | 'good' | 'easy'

/** Начальные SRS-поля для нового слова (готово к повторению сразу). */
export function freshSrs(): Pick<Word, 'ease' | 'intervalDays' | 'reps' | 'due' | 'lapses'> {
  return { ease: 2.5, intervalDays: 0, reps: 0, due: Date.now(), lapses: 0 }
}

/**
 * Пересчёт расписания по оценке ответа. Упрощённый SM-2:
 * - again: слово забыто, показать снова через ~1 минуту, интервал сбрасывается
 * - hard:  вспомнил с трудом
 * - good:  вспомнил нормально
 * - easy:  вспомнил легко — больший интервал
 */
export function schedule(word: Word, grade: Grade): Word {
  let { ease, intervalDays, reps, lapses } = word
  const now = Date.now()

  if (grade === 'again') {
    reps = 0
    lapses += 1
    ease = Math.max(1.3, ease - 0.2)
    intervalDays = 0
    return { ...word, ease, intervalDays, reps, lapses, due: now + 60 * 1000 }
  }

  reps += 1

  if (grade === 'hard') ease = Math.max(1.3, ease - 0.15)
  else if (grade === 'easy') ease = ease + 0.15

  if (reps === 1) {
    intervalDays = grade === 'easy' ? 2 : 1
  } else if (reps === 2) {
    intervalDays = grade === 'easy' ? 5 : 3
  } else {
    const factor = grade === 'hard' ? 1.2 : ease
    intervalDays = Math.round(intervalDays * factor)
  }

  if (intervalDays < 1) intervalDays = 1

  return { ...word, ease, intervalDays, reps, lapses, due: now + intervalDays * DAY }
}

/** Слова, которые пора повторять (due <= сейчас), включая новые. */
export function isDue(word: Word): boolean {
  return word.due <= Date.now()
}
