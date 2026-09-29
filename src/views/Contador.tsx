import type { ReactNode } from 'react'
import { PieChart } from '../components/PieChart'
import type { DayStats } from '../lib/stats'
import type { TipoChamada } from '../lib/types'

interface Props {
  stats: DayStats
  onAdd: (tipo: TipoChamada) => void
  onUndo: (tipo: TipoChamada) => void
  onRegistrar: () => void
  /** Quantas ligações de cada tipo o usuário logado tem no dia (o desfazer só remove as dele). */
  minhas: Record<TipoChamada, number>
  /** Nome de outra pessoa cujo painel está sendo visto: esconde os botões. */
  vendo: string | null
  /** Visão geral da equipe: avisa que os botões registram no nome do usuário. */
  geral: boolean
}

function StatCard({ label, value, children }: { label: string; value: number; children?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-5 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{label}</p>
        <p className="mt-2 font-mono text-5xl font-semibold leading-none tabular">{value}</p>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

const primaryBtn =
  'flex-1 rounded-xl bg-accent px-4 py-3 font-mono text-base font-semibold text-accent-ink transition hover:opacity-90 active:scale-[0.98]'
const ghostBtn =
  'rounded-xl border border-line px-3 py-3 text-sm text-ink-2 transition hover:border-ink-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line'

function Rate({ label, num, den, hint }: { label: string; num: number; den: number; hint: string }) {
  const pct = den ? Math.round((num / den) * 100) : null
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-ink-2">{label}</p>
        <p className="font-mono text-2xl font-semibold tabular">{pct === null ? '—' : `${pct}%`}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${Math.min(pct ?? 0, 100)}%` }} />
      </div>
      <p className="mt-1.5 font-mono text-[11px] text-muted tabular">
        {num} de {den} {hint}
      </p>
    </div>
  )
}

export function Contador({ stats, onAdd, onUndo, onRegistrar, minhas, vendo, geral }: Props) {
  const { feitas, atendidas, whatsapp, convertidas } = stats

  // Fatias mutuamente exclusivas que somam o total de ligações feitas.
  const atendidasCap = Math.min(atendidas, feitas)
  const converteu = Math.min(convertidas, atendidasCap)
  const slices = [
    { label: 'Só ligou, sem atender', value: feitas - atendidasCap, color: 'var(--pie-1)' },
    { label: 'Atendeu, sem converter', value: atendidasCap - converteu, color: 'var(--pie-2)' },
    { label: 'Converteu pro workshop', value: converteu, color: 'var(--pie-3)' },
  ]

  const editavel = vendo === null

  return (
    <div className="space-y-6">
      {(vendo || geral) && (
        <p className="text-sm text-ink-2">
          {vendo ? (
            <>
              Você está vendo os números de <strong className="text-ink">{vendo}</strong>. Para registrar, volte para a visão geral ou
              para a sua.
            </>
          ) : (
            'Números de toda a equipe. O que você registrar entra no seu nome.'
          )}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ligações feitas" value={feitas}>
          {editavel && (
            <>
              <button type="button" className={primaryBtn} onClick={() => onAdd('feita')}>
                +1
              </button>
              <button type="button" className={ghostBtn} onClick={() => onUndo('feita')} disabled={minhas.feita === 0}>
                desfazer
              </button>
            </>
          )}
        </StatCard>
        <StatCard label="Ligações atendidas" value={atendidas}>
          {editavel && (
            <>
              <button type="button" className={primaryBtn} onClick={() => onAdd('atendida')}>
                +1
              </button>
              <button type="button" className={ghostBtn} onClick={() => onUndo('atendida')} disabled={minhas.atendida === 0}>
                desfazer
              </button>
            </>
          )}
        </StatCard>
        <StatCard label="Não atendeu · chamei no WhatsApp" value={whatsapp}>
          {editavel && (
            <>
              <button type="button" className={primaryBtn} onClick={() => onAdd('whatsapp')}>
                +1
              </button>
              <button type="button" className={ghostBtn} onClick={() => onUndo('whatsapp')} disabled={minhas.whatsapp === 0}>
                desfazer
              </button>
            </>
          )}
        </StatCard>
        <StatCard label="Convertidas pro workshop" value={convertidas}>
          {editavel && (
            <button type="button" className={`${primaryBtn} font-sans text-sm`} onClick={onRegistrar}>
              + Registrar
            </button>
          )}
        </StatCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-card lg:col-span-2">
          <h3 className="font-serif text-lg font-semibold">Funil do dia</h3>
          <div className="mt-5 space-y-6">
            <Rate label="Feitas → atendidas" num={atendidas} den={feitas} hint="ligações atendidas" />
            <Rate label="Atendidas → convertidas" num={convertidas} den={atendidas} hint="atendidas viraram agendamento" />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5 shadow-card lg:col-span-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-serif text-lg font-semibold">Onde as ligações pararam</h3>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted tabular">{feitas} feitas</p>
          </div>
          <div className="mt-5">
            <PieChart slices={slices} total={feitas} />
          </div>
        </section>
      </div>
    </div>
  )
}
