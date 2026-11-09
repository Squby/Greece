// Озвучка греческого через Web Speech API (SpeechSynthesis).
// Голоса браузер загружает асинхронно, поэтому ждём события voiceschanged.

let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices()
    if (existing.length) {
      cachedVoices = existing
      resolve(existing)
      return
    }
    const handler = () => {
      cachedVoices = window.speechSynthesis.getVoices()
      resolve(cachedVoices)
    }
    window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true })
    // Фолбэк: если событие не придёт
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000)
  })
}

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickGreek(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return voices.find((v) => v.lang.toLowerCase().startsWith('el')) ?? null
}

/** Есть ли в системе греческий голос. */
export async function hasGreekVoice(): Promise<boolean> {
  if (!ttsSupported()) return false
  const voices = cachedVoices.length ? cachedVoices : await loadVoices()
  return pickGreek(voices) !== null
}

export interface VoiceDiagnostics {
  supported: boolean
  greekVoices: string[] // имена найденных греческих голосов
  totalVoices: number
}

/** Сводка по голосам — для подсказки пользователю, если греческого нет. */
export async function voiceDiagnostics(): Promise<VoiceDiagnostics> {
  if (!ttsSupported()) return { supported: false, greekVoices: [], totalVoices: 0 }
  const voices = cachedVoices.length ? cachedVoices : await loadVoices()
  return {
    supported: true,
    greekVoices: voices.filter((v) => v.lang.toLowerCase().startsWith('el')).map((v) => v.name),
    totalVoices: voices.length,
  }
}

/**
 * Произнести греческий текст. Если греческого голоса нет — не читаем по буквам
 * запасным голосом (это только путает), а возвращаем false, чтобы UI показал подсказку.
 * Возвращает true, если удалось произнести греческим голосом.
 */
export async function speakGreek(text: string): Promise<boolean> {
  if (!ttsSupported()) return false
  const voices = cachedVoices.length ? cachedVoices : await loadVoices()
  const greek = pickGreek(voices)

  window.speechSynthesis.cancel()

  if (!greek) {
    // Нет греческого голоса: английский/русский голос продиктует буквы по одной —
    // лучше промолчать и дать UI показать инструкцию по установке голоса.
    return false
  }

  const u = new SpeechSynthesisUtterance(text)
  u.voice = greek
  u.lang = greek.lang
  u.rate = 0.9
  window.speechSynthesis.speak(u)
  return true
}
