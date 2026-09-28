import { PeopleTable } from '../components/PeopleTable'
import type { Convertido, Status } from '../lib/types'

interface Props {
  status: Status
  pessoas: Convertido[]
  onAdd: () => void
  onStatus: (p: Convertido, s: Status) => void
  onRemove: (p: Convertido) => void
}

const copy: Record<Status, { title: string; sub: string; add: string; empty: string }> = {
  Agendado: {
    title: 'Convertidos',
    sub: 'Quem confirmou presença no workshop.',
    add: '+ Adicionar pessoa convertida',
    empty: 'Ninguém agendado ainda.',
  },
  Interessado: {
    title: 'Interessados',
    sub: 'Quem demonstrou interesse mas ainda não confirmou presença.',
    add: '+ Adicionar interessado',
    empty: 'Nenhum interessado no momento.',
  },
}

export function Pessoas({ status, pessoas, onAdd, onStatus, onRemove }: Props) {
  const c = copy[status]
  // Mais recentes primeiro.
  const lista = pessoas.filter((p) => p.status === status).reverse()

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-baseline gap-3 font-serif text-2xl font-semibold sm:text-[28px]">
            {c.title}
            <span className="font-mono text-base font-medium text-muted tabular">{lista.length}</span>
          </h2>
          <p className="text-sm text-ink-2">{c.sub}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition hover:opacity-90"
        >
          {c.add}
        </button>
      </div>
      <PeopleTable people={lista} emptyText={c.empty} onStatus={onStatus} onRemove={onRemove} />
    </div>
  )
}
