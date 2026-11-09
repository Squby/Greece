// Экранная палитра греческих букв — вставляет символ в конец ответа.
// Удобно, когда на устройстве нет греческой раскладки.

const ROWS = [
  'α β γ δ ε ζ η θ ι κ λ μ'.split(' '),
  'ν ξ ο π ρ σ τ υ φ χ ψ ω'.split(' '),
  // буквы с ударением и конечная сигма
  'ά έ ή ί ό ύ ώ ϊ ϋ ς'.split(' '),
]

export default function GreekKeyboard({ onInsert }: { onInsert: (ch: string) => void }) {
  return (
    <div className="mt-4 flex flex-col gap-1.5">
      {ROWS.map((row, i) => (
        <div key={i} className="flex flex-wrap justify-center gap-1.5">
          {row.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => onInsert(ch)}
              className="greek h-9 w-9 rounded-lg border border-slate-200 bg-white text-lg text-slate-700 shadow-sm active:scale-95"
            >
              {ch}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
