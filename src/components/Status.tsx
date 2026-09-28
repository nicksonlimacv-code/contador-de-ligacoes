import type { Status } from '../lib/types'

const tone: Record<Status, string> = {
  Agendado: 'bg-accent-soft text-accent border-accent/30',
  Interessado: 'bg-warn-soft text-warn border-warn-line',
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider ${tone[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  )
}

export function StatusSelect({ status, onChange }: { status: Status; onChange: (s: Status) => void }) {
  return (
    <div className="relative inline-flex">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as Status)}
        aria-label="Status"
        className={`cursor-pointer appearance-none rounded-full border py-0.5 pl-2.5 pr-7 font-mono text-[11px] font-medium uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-accent ${tone[status]}`}
      >
        <option value="Agendado">Agendado</option>
        <option value="Interessado">Interessado</option>
      </select>
      <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path d="M2 3.5L5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}
