import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { isDue } from '../../srs'
import { PageTitle, MenuCard, Card } from '../../components/ui'
import VoiceNotice from '../../components/VoiceNotice'

export default function WordsHome() {
  const words = useLiveQuery(() => db.words.toArray(), [])
  const dueCount = words?.filter(isDue).length ?? 0
  const total = words?.length ?? 0

  return (
    <div>
      <PageTitle sub="Слова из всех уроков, которые пора повторить">🔁 Повторение</PageTitle>

      <VoiceNotice />

      <Card className="mb-5 text-center">
        <div className="text-sm text-slate-500">Готово к повторению сейчас</div>
        <div className="text-4xl font-bold text-[#0d3b66]">{dueCount}</div>
        <div className="mt-1 text-xs text-slate-400">из {total} слов всего</div>
      </Card>

      <div className="flex flex-col gap-3">
        <MenuCard
          to="/words/learn"
          icon="🎓"
          title="Учить"
          desc="Умный режим: сам чередует выбор и набор"
        />
        <MenuCard
          to="/words/flashcards"
          icon="🃏"
          title="Карточки"
          desc="Смотри перевод, оцени, как вспомнил"
        />
        <MenuCard
          to="/words/spelling"
          icon="⌨️"
          title="По буквам"
          desc="Напиши греческое слово по переводу"
        />
        <MenuCard
          to="/words/listening"
          icon="🎧"
          title="На слух"
          desc="Послушай и запиши, что услышал"
        />
        <MenuCard
          to="/words/choice"
          icon="✅"
          title="Выбор перевода"
          desc="Выбери правильный вариант из четырёх"
        />
        <MenuCard
          to="/words/truefalse"
          icon="⚖️"
          title="Правда или ложь"
          desc="Верная ли пара «слово — перевод»?"
        />
        <MenuCard
          to="/words/match"
          icon="🧩"
          title="Подбор пар"
          desc="Соедини слова с переводом на время"
        />
        <MenuCard
          to="/words/test"
          icon="📋"
          title="Тест"
          desc="Смешанные вопросы и оценка в конце"
        />
      </div>
    </div>
  )
}
