import { useState } from 'react'
import { formatShort } from '../lib/dates'
import type { Convertido, Status } from '../lib/types'
import { StatusBadge, StatusSelect } from './Status'

interface Props {
  people: Convertido[]
  emptyText: string
  onStatus?: (p: Convertido, s: Status) => void
  onRemove?: (p: Convertido) => void
}

const dash = <span className="text-muted">—</span>
const val = (v: string | null) => (v && v.trim() ? v : dash)
const workshop = (d: string | null) =>
  d ? <span className="font-mono text-[13px] tabular">{formatShort(d, true)}</span> : dash

function RemoveButton({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false)
  if (armed) {
    return (
      <span className="inline-flex items-center gap-1">
        <button type="button" onClick={onConfirm} className="rounded-lg bg-danger px-2 py-1 text-xs font-semibold text-white hover:opacity-90">
          Remover
        </button>
        <button type="button" onClick={() => setArmed(false)} className="rounded-lg px-2 py-1 text-xs text-muted hover:text-ink">
          Cancelar
        </button>
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={() => setArmed(true)}
      aria-label="Remover pessoa"
      title="Remover"
      className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-danger"
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export function PeopleTable({ people, emptyText, onStatus, onRemove }: Props) {
  if (people.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-sm text-muted">{emptyText}</div>
    )
  }

  const status = (p: Convertido) =>
    onStatus ? <StatusSelect status={p.status} onChange={(s) => onStatus(p, s)} /> : <StatusBadge status={p.status} />

  return (
    <>
      {/* Mobile: cartões */}
      <ul className="space-y-3 md:hidden">
        {people.map((p) => (
          <li key={p.id} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{p.nome}</p>
                <p className="truncate text-sm text-ink-2">{[p.cargo, p.empresa].filter(Boolean).join(' · ') || dash}</p>
              </div>
              {onRemove && <RemoveButton onConfirm={() => onRemove(p)} />}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">Celular</dt>
                <dd className="font-mono text-[13px]">{val(p.celular)}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">Workshop</dt>
                <dd>{workshop(p.dia_workshop)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="sr-only">Status</dt>
                <dd>{status(p)}</dd>
              </div>
              {p.observacoes && (
                <div className="col-span-2">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">Observações</dt>
                  <dd className="whitespace-pre-line text-ink-2">{p.observacoes}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>

      {/* Desktop: tabela */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface shadow-card md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
              <th className="px-4 py-3 font-medium">Celular</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Dia do workshop</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Observações</th>
              {onRemove && (
                <th className="w-12 px-2 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                <td className="px-4 py-3 font-medium">{p.nome}</td>
                <td className="px-4 py-3 text-ink-2">{val(p.empresa)}</td>
                <td className="px-4 py-3 text-ink-2">{val(p.cargo)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px]">{val(p.celular)}</td>
                <td className="px-4 py-3">{workshop(p.dia_workshop)}</td>
                <td className="px-4 py-3">{status(p)}</td>
                <td className="max-w-[260px] px-4 py-3 text-ink-2">
                  <span className="line-clamp-2 whitespace-pre-line" title={p.observacoes ?? undefined}>
                    {val(p.observacoes)}
                  </span>
                </td>
                {onRemove && (
                  <td className="px-2 py-2 text-right">
                    <RemoveButton onConfirm={() => onRemove(p)} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
