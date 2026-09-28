import { PeopleTable } from '../components/PeopleTable'
import { formatShort, todayStr, weekdayShort } from '../lib/dates'
import type { DayStats } from '../lib/stats'

interface Props {
  day: string
  stats: DayStats
  recentDays: string[]
  onPick: (day: string) => void
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted sm:text-[11px]">{label}</p>
      <p className="mt-1.5 font-mono text-3xl font-semibold tabular">{value}</p>
    </div>
  )
}

export function Datas({ day, stats, recentDays, onPick }: Props) {
  const today = todayStr()
  const thisYear = today.slice(0, 4)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Mini label="Ligações feitas" value={stats.feitas} />
        <Mini label="Ligações atendidas" value={stats.atendidas} />
        <Mini label="Agendamentos" value={stats.convertidas} />
      </div>

      <section className="space-y-3">
        <h3 className="font-serif text-lg font-semibold">
          Pessoas registradas neste dia{' '}
          <span className="font-mono text-sm font-medium text-muted tabular">{stats.pessoas.length}</span>
        </h3>
        <PeopleTable people={[...stats.pessoas].reverse()} emptyText="Nenhuma pessoa registrada neste dia." />
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-lg font-semibold">Dias com registro</h3>
        {recentDays.length === 0 ? (
          <p className="text-sm text-muted">Nenhum registro ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recentDays.map((d) => {
              const active = d === day
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => onPick(d)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1.5 font-mono text-xs tabular transition ${
                    active
                      ? 'border-accent bg-accent text-accent-ink'
                      : 'border-line bg-surface text-ink-2 hover:border-accent hover:text-accent'
                  }`}
                >
                  {d === today ? 'hoje' : weekdayShort(d)} · {formatShort(d, d.slice(0, 4) !== thisYear)}
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
