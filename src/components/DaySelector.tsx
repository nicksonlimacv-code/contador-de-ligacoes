import { formatTitle, shiftDay, todayStr } from '../lib/dates'

interface Props {
  day: string
  onChange: (day: string) => void
}

const navBtn =
  'grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-surface text-ink-2 transition hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent'

export function DaySelector({ day, onChange }: Props) {
  const today = todayStr()
  const isToday = day === today

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Dia selecionado</p>
          <h2 className="font-serif text-2xl font-semibold leading-tight sm:text-[28px]">{formatTitle(day)}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className={navBtn} onClick={() => onChange(shiftDay(day, -1))} aria-label="Dia anterior">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <input
            type="date"
            value={day}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 font-mono text-sm text-ink tabular focus-visible:outline-2 focus-visible:outline-accent sm:flex-none"
            aria-label="Escolher dia"
          />
          <button type="button" className={navBtn} onClick={() => onChange(shiftDay(day, 1))} aria-label="Dia seguinte">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onChange(today)}
            disabled={isToday}
            className="h-10 shrink-0 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:opacity-90 disabled:cursor-default disabled:opacity-40"
          >
            Hoje
          </button>
        </div>
      </div>

      {!isToday && (
        <div role="note" className="flex gap-3 rounded-xl border border-warn-line bg-warn-soft px-4 py-3 text-sm text-warn">
          <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.5v4M8 11v.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <p>
            Você está vendo outro dia. Os registros novos entram em <strong>{formatTitle(day).toLowerCase()}</strong>,
            separados dos outros dias. Nada se apaga.
          </p>
        </div>
      )}
    </section>
  )
}
