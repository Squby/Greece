import { db } from './db'
import { freshSrs } from './srs'
import { lessons } from './content'
import type { Word } from './types'

// Синхронизация контента уроков (из файлов) в IndexedDB.
// Слова сопоставляются по стабильному ключу lessonSlug::greek — SRS-прогресс
// существующих слов сохраняется. Грамматика и упражнения не несут прогресса,
// поэтому для каждого урока просто пересоздаются.

const wordKey = (slug: string, greek: string) => `${slug}::${greek}`

export async function syncContent(): Promise<void> {
  try {
    for (const lesson of lessons) {
      // --- Слова: upsert с сохранением SRS ---
      const desiredKeys = new Set<string>()
      for (let i = 0; i < lesson.words.length; i++) {
        const w = lesson.words[i]
        const key = wordKey(lesson.slug, w.greek)
        desiredKeys.add(key)
        const order = lesson.order * 1000 + i

        const existing = await db.words.where('key').equals(key).first()
        if (existing) {
          await db.words.update(existing.id!, {
            translation: w.translation,
            note: w.note,
            lessonSlug: lesson.slug,
            order,
          })
        } else {
          await db.words.add({
            key,
            lessonSlug: lesson.slug,
            order,
            greek: w.greek,
            translation: w.translation,
            note: w.note,
            createdAt: Date.now(),
            ...freshSrs(),
          } as Word)
        }
      }
      // Удаляем слова урока, которых больше нет в материале
      const lessonWords = await db.words.where('lessonSlug').equals(lesson.slug).toArray()
      for (const w of lessonWords) {
        if (!desiredKeys.has(w.key)) await db.words.delete(w.id!)
      }

      // --- Грамматика: пересоздаём ---
      await db.topics.where('lessonSlug').equals(lesson.slug).delete()
      await db.topics.bulkAdd(
        lesson.grammar.map((g, i) => ({
          key: `${lesson.slug}::g::${i}`,
          lessonSlug: lesson.slug,
          title: g.title,
          body: g.body,
          createdAt: Date.now(),
        })),
      )

      // --- Упражнения: пересоздаём ---
      await db.exercises.where('lessonSlug').equals(lesson.slug).delete()
      await db.exercises.bulkAdd(
        lesson.exercises.map((e, i) => ({
          key: `${lesson.slug}::e::${i}`,
          lessonSlug: lesson.slug,
          prompt: e.prompt,
          answer: e.answer,
          hint: e.hint,
          example: e.example,
          createdAt: Date.now(),
        })),
      )
    }
  } catch (err) {
    console.error('syncContent failed', err)
  }
}
