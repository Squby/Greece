import type { Lesson } from './types'
import { lesson01 } from './lessons/lesson-01'
import { lesson02 } from './lessons/lesson-02'

// Все уроки программы. Новые уроки добавляются сюда по мере прохождения материала.
// Порядок берётся из поля order.
export const lessons: Lesson[] = [lesson01, lesson02].sort((a, b) => a.order - b.order)

export function getLesson(slug: string): Lesson | undefined {
  return lessons.find((l) => l.slug === slug)
}
