import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { PageTitle, MenuCard } from '../../components/ui'

export default function EditorHome() {
  const wordsCount = useLiveQuery(() => db.words.count(), [])
  const topicsCount = useLiveQuery(() => db.topics.count(), [])
  const exCount = useLiveQuery(() => db.exercises.count(), [])

  return (
    <div>
      <PageTitle sub="Добавляй сюда всё, что дали на уроке">✏️ Редактор</PageTitle>

      <div className="flex flex-col gap-3">
        <MenuCard
          to="/editor/words"
          icon="📘"
          title="Слова"
          desc={`Добавить и редактировать · ${wordsCount ?? 0} шт.`}
        />
        <MenuCard
          to="/editor/grammar"
          icon="📙"
          title="Грамматика"
          desc={`${topicsCount ?? 0} правил · ${exCount ?? 0} упражнений`}
        />
      </div>
    </div>
  )
}
