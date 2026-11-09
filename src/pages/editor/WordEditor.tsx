import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../../db'
import { freshSrs } from '../../srs'
import { Button, Card } from '../../components/ui'
import GreekKeyboard from '../../components/GreekKeyboard'
import { speakGreek, ttsSupported } from '../../tts'
import type { Word } from '../../types'

export default function WordEditor() {
  const words = useLiveQuery(() => db.words.orderBy('createdAt').reverse().toArray(), [])

  const [greek, setGreek] = useState('')
  const [translation, setTranslation] = useState('')
  const [note, setNote] = useState('')
  const [tags, setTags] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showKbd, setShowKbd] = useState(false)

  function reset() {
    setGreek('')
    setTranslation('')
    setNote('')
    setTags('')
    setEditingId(null)
    setShowKbd(false)
  }

  async function save() {
    if (!greek.trim() || !translation.trim()) return
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    if (editingId != null) {
      await db.words.update(editingId, {
        greek: greek.trim(),
        translation: translation.trim(),
        note: note.trim() || undefined,
        tags: tagList.length ? tagList : undefined,
      })
    } else {
      const now = Date.now()
      await db.words.add({
        key: `custom::${greek.trim()}::${now}`,
        order: 9_000_000 + (now % 1_000_000),
        greek: greek.trim(),
        translation: translation.trim(),
        note: note.trim() || undefined,
        tags: tagList.length ? tagList : undefined,
        createdAt: now,
        ...freshSrs(),
      } as Word)
    }
    reset()
  }

  function startEdit(w: Word) {
    setEditingId(w.id!)
    setGreek(w.greek)
    setTranslation(w.translation)
    setNote(w.note ?? '')
    setTags(w.tags?.join(', ') ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(id: number) {
    if (confirm('Удалить слово?')) {
      await db.words.delete(id)
      if (editingId === id) reset()
    }
  }

  return (
    <div>
      <Link to="/editor" className="mb-3 inline-block text-sm text-[#0d3b66]">
        ← Редактор
      </Link>
      <h1 className="mb-4 text-xl font-bold text-[#0d3b66]">
        {editingId != null ? 'Редактировать слово' : 'Новое слово'}
      </h1>

      <Card className="mb-6">
        <div className="flex flex-col gap-3">
          <Field label="Греческое слово *">
            <input
              value={greek}
              onChange={(e) => setGreek(e.target.value)}
              onFocus={() => setShowKbd(true)}
              placeholder="το σπίτι"
              className="greek input"
            />
          </Field>
          {showKbd && <GreekKeyboard onInsert={(ch) => setGreek((v) => v + ch)} />}

          <Field label="Перевод *">
            <input
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="дом"
              className="input"
            />
          </Field>
          <Field label="Заметка">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ср. род, ударение…"
              className="input"
            />
          </Field>
          <Field label="Темы (через запятую)">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="урок 3, еда"
              className="input"
            />
          </Field>

          <div className="mt-1 flex gap-2">
            <Button className="flex-1" onClick={save} disabled={!greek.trim() || !translation.trim()}>
              {editingId != null ? 'Сохранить' : 'Добавить'}
            </Button>
            {editingId != null && (
              <Button variant="ghost" onClick={reset}>
                Отмена
              </Button>
            )}
          </div>
        </div>
      </Card>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Все слова · {words?.length ?? 0}
      </h2>
      <div className="flex flex-col gap-2">
        {words?.map((w) => (
          <div
            key={w.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="min-w-0 flex-1">
              <div className="greek truncate font-semibold text-slate-800">{w.greek}</div>
              <div className="truncate text-sm text-slate-500">{w.translation}</div>
            </div>
            {ttsSupported() && (
              <button onClick={() => speakGreek(w.greek)} className="text-lg" aria-label="Озвучить">
                🔊
              </button>
            )}
            <button onClick={() => startEdit(w)} className="text-lg" aria-label="Изменить">
              ✏️
            </button>
            <button onClick={() => remove(w.id!)} className="text-lg" aria-label="Удалить">
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}
