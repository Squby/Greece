export interface Word {
  id?: number
  key: string // стабильный ключ для сохранения SRS между обновлениями контента
  lessonSlug?: string // к какому уроку относится (undefined = добавлено вручную)
  order: number // порядок внутри программы
  greek: string // греческое слово, напр. "το σπίτι"
  translation: string // перевод, напр. "дом"
  note?: string // необязательная заметка (род, ударение, пример)
  tags?: string[] // темы/уроки, напр. ["урок 3", "еда"]
  createdAt: number

  // Поля интервального повторения (SRS, алгоритм в духе SM-2)
  ease: number // коэффициент лёгкости (старт 2.5)
  intervalDays: number // текущий интервал в днях
  reps: number // сколько раз подряд вспомнил
  due: number // timestamp, когда слово снова нужно повторить
  lapses: number // сколько раз забыл
}

export interface GrammarTopic {
  id?: number
  key: string
  lessonSlug?: string
  title: string // напр. "Настоящее время глаголов -ω"
  body: string // правило в формате Markdown-lite (текст с переносами)
  tags?: string[]
  createdAt: number
}

export interface Exercise {
  id?: number
  key: string
  lessonSlug?: string
  topicId?: number // к какой теме относится (необязательно)
  // Предложение с пропуском, пропуск обозначается ___
  // напр. "Εγώ ___ (γράφω) ένα γράμμα."
  prompt: string
  answer: string // правильная форма, напр. "γράφω"
  hint?: string // подсказка, напр. "1 лицо ед. ч."
  example?: string // разобранный пример-образец
  createdAt: number
}

export type WordMode =
  | 'flashcards'
  | 'spelling'
  | 'listening'
  | 'choice'
  | 'match'
  | 'truefalse'
  | 'learn'
  | 'test'
