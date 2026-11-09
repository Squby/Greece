import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db } from '../../db'
import { Card, Button } from '../../components/ui'
import { Loading } from '../words/SessionShell'

export default function GrammarTopicPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const topicId = Number(id)
  const topic = useLiveQuery(() => db.topics.get(topicId), [topicId])

  if (topic === undefined) return <Loading />
  if (topic === null) {
    return (
      <div className="mt-10 text-center text-slate-500">
        Правило не найдено.
        <div className="mt-4">
          <Button onClick={() => nav('/grammar')}>Назад</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link to="/grammar" className="mb-3 inline-block text-sm text-[#0d3b66]">
        ← Грамматика
      </Link>
      <h1 className="mb-4 text-xl font-bold text-[#0d3b66]">{topic.title}</h1>

      <Card>
        {/* Текст правила с сохранением переносов строк */}
        <div className="greek whitespace-pre-wrap leading-relaxed text-slate-700">
          {topic.body}
        </div>
      </Card>

      <div className="mt-6">
        <Button className="w-full" onClick={() => nav('/grammar/exercises')}>
          К упражнениям
        </Button>
      </div>
    </div>
  )
}
