import Dexie, { type Table } from 'dexie'
import type { Word, GrammarTopic, Exercise } from './types'

export class GreekDB extends Dexie {
  words!: Table<Word, number>
  topics!: Table<GrammarTopic, number>
  exercises!: Table<Exercise, number>

  constructor() {
    super('greek-trainer')
    this.version(1).stores({
      words: '++id, greek, due, createdAt',
      topics: '++id, title, createdAt',
      exercises: '++id, topicId, createdAt',
    })
    // v2: привязка контента к урокам + стабильные ключи.
    // Старые демо-данные чистим — прогресса там ещё нет, контент пересоберётся из файлов.
    this.version(2)
      .stores({
        words: '++id, &key, greek, due, lessonSlug, order, createdAt',
        topics: '++id, &key, lessonSlug, createdAt',
        exercises: '++id, &key, lessonSlug, createdAt',
      })
      .upgrade(async (tx) => {
        await tx.table('words').clear()
        await tx.table('topics').clear()
        await tx.table('exercises').clear()
      })
  }
}

export const db = new GreekDB()
