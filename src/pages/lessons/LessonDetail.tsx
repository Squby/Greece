import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, Link } from 'react-router-dom'
import { db } from '../../db'
import { getLesson } from '../../content'
import { isDue } from '../../srs'
import { Card, MenuCard, Empty } from '../../components/ui'

export default function LessonDetail() {
  const { slug } = useParams()
  const lesson = slug ? getLesson(slug) : undefined

  const words = useLiveQuery(
    () => (slug ? db.words.where('lessonSlug').equals(slug).toArray() : []),
    [slug],
  )
  const topics = useLiveQuery(
    () => (slug ? db.topics.where('lessonSlug').equals(slug).toArray() : []),
    [slug],
  )
  const exCount = useLiveQuery(
    () => (slug ? db.exercises.where('lessonSlug').equals(slug).count() : 0),
    [slug],
  )

  if (!lesson) {
    return (
      <div className="mt-10">
        <Empty>Урок не найден.</Empty>
      </div>
    )
  }

  const total = words?.length ?? 0
  const dueCount = words?.filter(isDue).length ?? 0
  const q = `?lesson=${lesson.slug}`

  return (
    <div>
      <Link to="/lessons" className="mb-3 inline-block text-sm text-[#0d3b66]">
        ← Уроки
      </Link>
      <h1 className="mb-1 text-xl font-bold text-[#0d3b66]">{lesson.title}</h1>
      {lesson.summary && <p className="mb-4 text-sm text-slate-500">{lesson.summary}</p>}

      {/* Грамматика урока */}
      {topics && topics.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Правила
          </h2>
          <div className="flex flex-col gap-2">
            {topics.map((t) => (
              <Link
                key={t.id}
                to={`/grammar/topic/${t.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:scale-[0.98]"
              >
                <span className="font-medium text-slate-800">{t.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Слова урока */}
      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Слова · {total}
          {dueCount > 0 && <span className="ml-2 text-[#0d3b66]">({dueCount} на повторение)</span>}
        </h2>
        {total === 0 ? (
          <Empty>В этом уроке пока нет слов.</Empty>
        ) : (
          <div className="flex flex-col gap-3">
            <MenuCard to={`/words/learn${q}`} icon="🎓" title="Учить" desc="Умный режим" />
            <MenuCard to={`/words/flashcards${q}`} icon="🃏" title="Карточки" desc="Смотри перевод" />
            <MenuCard
              to={`/words/spelling${q}`}
              icon="⌨️"
              title="По буквам"
              desc="Напиши слово по-гречески"
            />
            <MenuCard
              to={`/words/listening${q}`}
              icon="🎧"
              title="На слух"
              desc="Послушай и запиши"
            />
            <MenuCard
              to={`/words/choice${q}`}
              icon="✅"
              title="Выбор перевода"
              desc="Выбери вариант из четырёх"
            />
            <MenuCard
              to={`/words/truefalse${q}`}
              icon="⚖️"
              title="Правда или ложь"
              desc="Верная ли пара?"
            />
            <MenuCard to={`/words/match${q}`} icon="🧩" title="Подбор пар" desc="Соедини пары на время" />
            <MenuCard to={`/words/test${q}`} icon="📋" title="Тест" desc="Вопросы + оценка" />
          </div>
        )}
      </section>

      {/* Упражнения урока */}
      {(exCount ?? 0) > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Грамматика
          </h2>
          <MenuCard
            to={`/grammar/exercises${q}`}
            icon="📝"
            title="Упражнения"
            desc={`Вставь форму · ${exCount} шт.`}
          />
        </section>
      )}

      {/* Список слов для быстрого просмотра */}
      {total > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Словарь урока
          </h2>
          <Card>
            <ul className="flex flex-col gap-2">
              {words
                ?.slice()
                .sort((a, b) => a.order - b.order)
                .map((w) => (
                  <li key={w.id} className="flex justify-between gap-3 text-sm">
                    <span className="greek font-medium text-slate-800">{w.greek}</span>
                    <span className="text-slate-500">{w.translation}</span>
                  </li>
                ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  )
}
