import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../../db'
import { Button, Card } from '../../components/ui'
import GreekKeyboard from '../../components/GreekKeyboard'
import type { GrammarTopic, Exercise } from '../../types'

type Tab = 'topics' | 'exercises'

export default function GrammarEditor() {
  const [tab, setTab] = useState<Tab>('topics')

  return (
    <div>
      <Link to="/editor" className="mb-3 inline-block text-sm text-[#0d3b66]">
        ← Редактор
      </Link>
      <h1 className="mb-4 text-xl font-bold text-[#0d3b66]">Грамматика</h1>

      <div className="mb-5 flex gap-2">
        <TabButton active={tab === 'topics'} onClick={() => setTab('topics')}>
          Правила
        </TabButton>
        <TabButton active={tab === 'exercises'} onClick={() => setTab('exercises')}>
          Упражнения
        </TabButton>
      </div>

      {tab === 'topics' ? <TopicsEditor /> : <ExercisesEditor />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2.5 font-semibold transition ${
        active ? 'bg-[#0d3b66] text-white' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {children}
    </button>
  )
}

function TopicsEditor() {
  const topics = useLiveQuery(() => db.topics.orderBy('createdAt').reverse().toArray(), [])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  function reset() {
    setTitle('')
    setBody('')
    setTags('')
    setEditingId(null)
  }

  async function save() {
    if (!title.trim() || !body.trim()) return
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)
    if (editingId != null) {
      await db.topics.update(editingId, {
        title: title.trim(),
        body: body.trim(),
        tags: tagList.length ? tagList : undefined,
      })
    } else {
      await db.topics.add({
        key: `custom::g::${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
        tags: tagList.length ? tagList : undefined,
        createdAt: Date.now(),
      })
    }
    reset()
  }

  function startEdit(t: GrammarTopic) {
    setEditingId(t.id!)
    setTitle(t.title)
    setBody(t.body)
    setTags(t.tags?.join(', ') ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(id: number) {
    if (confirm('Удалить правило?')) {
      await db.topics.delete(id)
      if (editingId === id) reset()
    }
  }

  return (
    <div>
      <Card className="mb-6">
        <div className="flex flex-col gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название правила"
            className="input"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Текст правила. Переносы строк сохраняются."
            rows={8}
            className="input greek"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Темы через запятую (глаголы, артикли)"
            className="input"
          />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={save} disabled={!title.trim() || !body.trim()}>
              {editingId != null ? 'Сохранить' : 'Добавить правило'}
            </Button>
            {editingId != null && (
              <Button variant="ghost" onClick={reset}>
                Отмена
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        {topics?.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="min-w-0 flex-1 truncate font-medium text-slate-800">{t.title}</div>
            <button onClick={() => startEdit(t)} className="text-lg" aria-label="Изменить">
              ✏️
            </button>
            <button onClick={() => remove(t.id!)} className="text-lg" aria-label="Удалить">
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExercisesEditor() {
  const exercises = useLiveQuery(() => db.exercises.orderBy('createdAt').reverse().toArray(), [])
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [hint, setHint] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [kbd, setKbd] = useState<'prompt' | 'answer' | null>(null)

  function reset() {
    setPrompt('')
    setAnswer('')
    setHint('')
    setEditingId(null)
    setKbd(null)
  }

  async function save() {
    if (!prompt.includes('___') || !answer.trim()) return
    if (editingId != null) {
      await db.exercises.update(editingId, {
        prompt: prompt.trim(),
        answer: answer.trim(),
        hint: hint.trim() || undefined,
      })
    } else {
      await db.exercises.add({
        key: `custom::e::${Date.now()}`,
        prompt: prompt.trim(),
        answer: answer.trim(),
        hint: hint.trim() || undefined,
        createdAt: Date.now(),
      })
    }
    reset()
  }

  function startEdit(ex: Exercise) {
    setEditingId(ex.id!)
    setPrompt(ex.prompt)
    setAnswer(ex.answer)
    setHint(ex.hint ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(id: number) {
    if (confirm('Удалить упражнение?')) {
      await db.exercises.delete(id)
      if (editingId === id) reset()
    }
  }

  return (
    <div>
      <Card className="mb-6">
        <div className="flex flex-col gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">
              Предложение — пропуск отметь как ___
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setKbd('prompt')}
              placeholder="Εγώ ___ (γράφω) ένα γράμμα."
              rows={2}
              className="input greek"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Правильный ответ</span>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onFocus={() => setKbd('answer')}
              placeholder="γράφω"
              className="input greek"
            />
          </label>
          {kbd && (
            <GreekKeyboard
              onInsert={(ch) =>
                kbd === 'prompt' ? setPrompt((v) => v + ch) : setAnswer((v) => v + ch)
              }
            />
          )}
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Подсказка (1 лицо ед. ч.)"
            className="input"
          />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={save}
              disabled={!prompt.includes('___') || !answer.trim()}
            >
              {editingId != null ? 'Сохранить' : 'Добавить упражнение'}
            </Button>
            {editingId != null && (
              <Button variant="ghost" onClick={reset}>
                Отмена
              </Button>
            )}
          </div>
          {!prompt.includes('___') && prompt.length > 0 && (
            <p className="text-xs text-rose-500">Добавь ___ туда, где должен быть пропуск.</p>
          )}
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        {exercises?.map((ex) => (
          <div
            key={ex.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="greek min-w-0 flex-1 truncate text-sm text-slate-700">{ex.prompt}</div>
            <button onClick={() => startEdit(ex)} className="text-lg" aria-label="Изменить">
              ✏️
            </button>
            <button onClick={() => remove(ex.id!)} className="text-lg" aria-label="Удалить">
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
