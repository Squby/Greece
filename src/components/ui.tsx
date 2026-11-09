import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export function PageTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-2xl font-bold text-[#0d3b66]">{children}</h1>
      {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
    </header>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function MenuCard({
  to,
  icon,
  title,
  desc,
  badge,
}: {
  to: string
  icon: string
  title: string
  desc: string
  badge?: ReactNode
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-transform active:scale-[0.98]"
    >
      <span className="text-3xl">{icon}</span>
      <span className="flex-1">
        <span className="block font-semibold text-slate-800">{title}</span>
        <span className="block text-sm text-slate-500">{desc}</span>
      </span>
      {badge}
    </Link>
  )
}

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'success' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className = '',
}: ButtonProps) {
  const styles: Record<string, string> = {
    primary: 'bg-[#0d3b66] text-white',
    ghost: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-600 text-white',
    danger: 'bg-rose-600 text-white',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-5 py-3 font-semibold transition active:scale-[0.98] disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
      {children}
    </div>
  )
}
