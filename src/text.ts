// Сравнение ответов пользователя с эталоном.

/** Приведение к нижнему регистру + нормализация пробелов, пунктуации и Unicode. */
export function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?·]/g, '') // знаки препинания не влияют на проверку (в т.ч. греч. «;»)
    .replace(/\s+/g, ' ')
    .trim()
    .normalize('NFC')
}

/** Убирает диакритику (ударения), чтобы сравнивать «мягко». */
export function stripAccents(s: string): string {
  return norm(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
}

export type CheckResult = 'correct' | 'accent' | 'wrong'

/**
 * Проверка ответа:
 * - 'correct' — точное совпадение
 * - 'accent'  — верно, но перепутаны/пропущены ударения
 * - 'wrong'   — неверно
 */
export function checkAnswer(input: string, expected: string): CheckResult {
  if (norm(input) === norm(expected)) return 'correct'
  if (stripAccents(input) === stripAccents(expected)) return 'accent'
  return 'wrong'
}
