import { Button, Card } from './ui'
import { speakGreek, ttsSupported } from '../tts'
import type { Word, WordMode } from '../types'

const KEY = (mode: WordMode) => `greek-intro-${mode}`

/** Видел ли пользователь разбор этого режима (чтобы показать его только первый раз). */
export function introSeen(mode: WordMode): boolean {
  try {
    return localStorage.getItem(KEY(mode)) === '1'
  } catch {
    return false
  }
}

function markSeen(mode: WordMode) {
  try {
    localStorage.setItem(KEY(mode), '1')
  } catch {
    /* localStorage может быть недоступен — не критично */
  }
}

const COPY: Record<WordMode, { title: string; steps: string[] }> = {
  flashcards: {
    title: '🃏 Карточки',
    steps: [
      'Смотришь греческое слово и вспоминаешь перевод.',
      'Жмёшь «Показать перевод» и проверяешь себя.',
      'Честно оцениваешь: Забыл / Трудно / Помню / Легко — от этого зависит, когда слово повторится.',
    ],
  },
  spelling: {
    title: '⌨️ По буквам',
    steps: [
      'По переводу набери слово по-гречески.',
      'Нет греческой раскладки? Используй кнопки-буквы под полем.',
      'Ударения важны, но если ошибёшься только в них — подскажу, не засчитаю за ошибку.',
    ],
  },
  listening: {
    title: '🎧 На слух',
    steps: [
      'Нажми 🔊 и послушай слово (можно повторить).',
      'Набери то, что услышал, греческими буквами.',
      'Проверь — и переходи к следующему.',
    ],
  },
  choice: {
    title: '✅ Выбор перевода',
    steps: [
      'Показывается слово и 4 варианта.',
      'Выбери правильный перевод (иногда наоборот — греческое слово по переводу).',
      'Ответил верно — слово повторится позже, ошибся — скоро вернётся.',
    ],
  },
  match: {
    title: '🧩 Подбор пар',
    steps: [
      'На поле — греческие слова и переводы вперемешку.',
      'Нажимай пару: греческое слово и его перевод.',
      'Соедини все пары как можно быстрее — время идёт.',
    ],
  },
  truefalse: {
    title: '⚖️ Правда или ложь',
    steps: [
      'Показывается греческое слово и перевод.',
      'Реши, верная ли это пара: «Верно» или «Неверно».',
      'Отвечай быстро — это хорошая разминка на узнавание.',
    ],
  },
  learn: {
    title: '🎓 Учить',
    steps: [
      'Умный режим: сам чередует выбор и набор по буквам.',
      'Сначала проще (выбрать вариант), потом сложнее (написать).',
      'Каждое слово нужно ответить верно дважды, чтобы закрыть его.',
    ],
  },
  test: {
    title: '📋 Тест',
    steps: [
      'Смешанный набор вопросов разных типов.',
      'Отвечаешь на все подряд — без подсказок.',
      'В конце — оценка и разбор ошибок.',
    ],
  },
}

/** Вводная карточка-разбор режима на примере конкретного слова. */
export default function WordIntro({
  mode,
  sample,
  onStart,
}: {
  mode: WordMode
  sample: Word
  onStart: () => void
}) {
  const { title, steps } = COPY[mode]

  function start() {
    markSeen(mode)
    onStart()
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-[#0d3b66]">{title}</h1>
      <p className="mb-5 text-sm text-slate-500">Как это работает — на примере:</p>

      <Card className="mb-5">
        <ol className="flex flex-col gap-2 pl-5 text-slate-700" style={{ listStyle: 'decimal' }}>
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </Card>

      <Card className="mb-6 text-center">
        <div className="text-xs uppercase tracking-wide text-slate-400">Пример</div>
        <div className="greek mt-2 text-3xl font-bold text-slate-800">{sample.greek}</div>
        <div className="mt-1 text-lg text-slate-500">— {sample.translation}</div>
        {sample.note && <div className="mt-1 text-sm text-slate-400">{sample.note}</div>}
        {ttsSupported() && (
          <button onClick={() => speakGreek(sample.greek)} className="mt-3 text-2xl" aria-label="Озвучить">
            🔊
          </button>
        )}
      </Card>

      <Button className="w-full" onClick={start}>
        Понятно, начать
      </Button>
    </div>
  )
}
