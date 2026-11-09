import { useEffect, useState } from 'react'
import { voiceDiagnostics, speakGreek, ttsSupported, type VoiceDiagnostics } from '../tts'

/** Хук: загружена ли информация о голосах и есть ли греческий. */
export function useGreekVoice() {
  const [diag, setDiag] = useState<VoiceDiagnostics | null>(null)

  useEffect(() => {
    let alive = true
    voiceDiagnostics().then((d) => alive && setDiag(d))
    // Список голосов может подгрузиться позже — перечитаем по событию
    if (ttsSupported()) {
      const handler = () => voiceDiagnostics().then((d) => alive && setDiag(d))
      window.speechSynthesis.addEventListener('voiceschanged', handler)
      return () => {
        alive = false
        window.speechSynthesis.removeEventListener('voiceschanged', handler)
      }
    }
    return () => {
      alive = false
    }
  }, [])

  return {
    ready: diag !== null,
    hasGreek: (diag?.greekVoices.length ?? 0) > 0,
    diag,
  }
}

/** Баннер с инструкцией, если греческого голоса нет (иначе ничего не рисует). */
export default function VoiceNotice() {
  const { ready, hasGreek } = useGreekVoice()

  if (!ttsSupported()) {
    return (
      <Banner>
        Этот браузер не поддерживает синтез речи. Открой приложение в <b>Chrome</b> или <b>Edge</b>.
      </Banner>
    )
  }

  if (!ready || hasGreek) return null

  return (
    <Banner>
      <p className="font-semibold">Нет греческого голоса 🔇</p>
      <p className="mt-1">
        Поэтому слова читались по буквам. Добавь греческий голос — и озвучка заработает целиком:
      </p>
      <ol className="mt-2 list-decimal space-y-0.5 pl-5">
        <li>
          Windows: <b>Параметры → Время и язык → Речь → Управление голосами → Добавить</b> →
          выбери <b>Ελληνικά (Greek)</b>.
        </li>
        <li>Либо открой приложение в <b>Google Chrome</b> (у него есть онлайн-голос «Google ελληνικά»).</li>
        <li>После установки перезапусти браузер.</li>
      </ol>
      <button
        onClick={() => speakGreek('Γεια σου')}
        className="mt-3 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white"
      >
        🔊 Проверить ещё раз
      </button>
    </Banner>
  )
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
      {children}
    </div>
  )
}
