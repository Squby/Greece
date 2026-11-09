// Описание контента урока. Эти данные я (ассистент) генерирую из присланных
// материалов и кладу в src/content/lessons/. Прогресс пользователя (SRS) хранится
// отдельно в IndexedDB и не затрагивается при обновлении этих файлов.

export interface LessonWord {
  greek: string // напр. "το σπίτι"
  translation: string // напр. "дом"
  note?: string // род, ударение, пример и т.п.
}

export interface LessonGrammar {
  title: string
  body: string // текст правила; переносы строк сохраняются
}

export interface LessonExercise {
  prompt: string // предложение с пропуском ___, напр. "Εγώ ___ (γράφω)..."
  answer: string // правильная форма
  hint?: string
  example?: string // разобранный пример-образец (показывается до ответа)
}

export interface Lesson {
  slug: string // стабильный id урока, напр. "lesson-01"
  order: number // порядковый номер в программе (1, 2, 3…)
  title: string // напр. "Урок 1 — Знакомство"
  summary?: string // краткое описание, что в уроке
  words: LessonWord[]
  grammar: LessonGrammar[]
  exercises: LessonExercise[]
}
