/** Перемешать массив (копия, алгоритм Фишера—Йейтса). */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Случайные n элементов из массива. */
export function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}
