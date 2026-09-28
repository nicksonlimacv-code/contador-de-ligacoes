import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { DaySelector } from './components/DaySelector'
import { PersonModal } from './components/PersonModal'
import { useAuth } from './hooks/useAuth'
import { useData } from './hooks/useData'
import { dayOf, todayStr } from './lib/dates'
import { daysWithRecords, statsForDay } from './lib/stats'
import { supabase } from './lib/supabase'
import type { Convertido, NovoConvertido, Status } from './lib/types'
import { AuthScreen, NovaSenha } from './views/Auth'
import { Contador } from './views/Contador'
import { Datas } from './views/Datas'
import { Pessoas } from './views/Pessoas'

type Tab = 'contador' | 'convertidos' | 'interessados' | 'datas'

const TABS: { id: Tab; label: string }[] = [
  { id: 'contador', label: 'Contador' },
  { id: 'convertidos', label: 'Convertidos' },
  { id: 'interessados', label: 'Interessados' },
  { id: 'datas', label: 'Datas' },
]

/** 'geral' = equipe toda; senão, o id do usuário filtrado. */
type Visao = 'geral' | string

export default function App() {
  const auth = useAuth()

  if (auth.loading) {
    return (
      <div className="grid min-h-screen place-items-center font-mono text-[11px] uppercase tracking-wider text-muted">
        carregando…
      </div>
    )
  }
  if (!auth.session) return <AuthScreen />
  if (auth.recovery) return <NovaSenha onDone={auth.finishRecovery} />
  // key: troca de usuário remonta o painel e reabre os canais realtime com a sessão nova.
  return <Painel key={auth.session.user.id} session={auth.session} />
}

function Painel({ session }: { session: Session }) {
  const me = session.user.id
  const data = useData(me)
  const [tab, setTab] = useState<Tab>('contador')
  const [selectedDay, setSelectedDay] = useState(todayStr)
  const [visao, setVisao] = useState<Visao>(me)
  const [modalStatus, setModalStatus] = useState<Status | null>(null)
  const [, setTick] = useState(0)

  // Re-renderiza a cada minuto para "Hoje" virar corretamente à meia-noite.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const nomes = useMemo(() => new Map(data.perfis.map((p) => [p.id, p.nome])), [data.perfis])
  const nomeDe = useCallback((id: string) => nomes.get(id) ?? '—', [nomes])
  const usuarios = useMemo(
    () => [...data.perfis].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [data.perfis],
  )

  const chamadas = useMemo(
    () => (visao === 'geral' ? data.chamadas : data.chamadas.filter((c) => c.user_id === visao)),
    [data.chamadas, visao],
  )
  const pessoas = useMemo(
    () => (visao === 'geral' ? data.pessoas : data.pessoas.filter((p) => p.user_id === visao)),
    [data.pessoas, visao],
  )

  const stats = useMemo(() => statsForDay(chamadas, pessoas, selectedDay), [chamadas, pessoas, selectedDay])
  const recentDays = useMemo(() => daysWithRecords(chamadas, pessoas, 14), [chamadas, pessoas])
  const minhas = useMemo(() => {
    const n = { feita: 0, atendida: 0 }
    for (const c of data.chamadas) if (c.user_id === me && dayOf(c.created_at) === selectedDay) n[c.tipo]++
    return n
  }, [data.chamadas, me, selectedDay])

  const closeModal = useCallback(() => setModalStatus(null), [])
  const savePessoa = useCallback((p: NovoConvertido) => data.addPessoa(p, selectedDay), [data.addPessoa, selectedDay])
  const canEdit = useCallback((p: Convertido) => p.user_id === me, [me])
  const ownerName = visao === 'geral' ? (p: Convertido) => nomeDe(p.user_id) : undefined

  const vendo = visao !== 'geral' && visao !== me ? nomeDe(visao) : null
  const showDaySelector = tab === 'contador' || tab === 'datas'
  const counts = {
    convertidos: pessoas.filter((p) => p.status === 'Agendado').length,
    interessados: pessoas.filter((p) => p.status === 'Interessado').length,
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent font-mono text-sm font-semibold text-accent-ink">
            +1
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold leading-tight sm:text-2xl">Contador de Ligações</h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">prospecção · workshop</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data.loading && <span className="font-mono text-[11px] uppercase tracking-wider text-muted">carregando…</span>}
          <span className="hidden max-w-[180px] truncate text-sm text-ink-2 sm:inline" title={session.user.email}>
            {nomeDe(me) === '—' ? session.user.email : nomeDe(me)}
          </span>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="rounded-xl border border-line px-3 py-2 text-sm text-ink-2 transition hover:border-ink-2 hover:text-ink"
          >
            Sair
          </button>
        </div>
      </header>

      {(data.loadError || data.actionError) && (
        <div role="alert" className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <p>{data.actionError ?? `Erro ao carregar dados: ${data.loadError}`}</p>
          {data.actionError && (
            <button type="button" onClick={data.clearActionError} className="shrink-0 font-medium underline">
              ok
            </button>
          )}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor="visao" className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Visão
        </label>
        <div className="relative">
          <select
            id="visao"
            value={visao}
            onChange={(e) => setVisao(e.target.value)}
            className="h-10 cursor-pointer appearance-none rounded-xl border border-line bg-surface pl-3 pr-9 text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            <option value="geral">Todos</option>
            {usuarios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <path d="M2 3.5L5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <button
          type="button"
          aria-pressed={visao === me}
          onClick={() => setVisao(visao === me ? 'geral' : me)}
          className={`h-10 rounded-xl border px-4 text-sm font-medium transition ${
            visao === me
              ? 'border-accent bg-accent text-accent-ink hover:opacity-90'
              : 'border-line bg-surface text-ink-2 hover:border-accent hover:text-accent'
          }`}
        >
          Só eu
        </button>
      </div>

      {showDaySelector && (
        <div className="mb-6">
          <DaySelector day={selectedDay} onChange={setSelectedDay} />
        </div>
      )}

      <nav className="mb-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Abas">
        <div role="tablist" className="inline-flex min-w-full gap-1 rounded-2xl border border-line bg-surface p-1 shadow-card sm:min-w-0">
          {TABS.map((t) => {
            const active = tab === t.id
            const count = t.id === 'convertidos' ? counts.convertidos : t.id === 'interessados' ? counts.interessados : null
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition sm:flex-none ${
                  active ? 'bg-accent text-accent-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {t.label}
                {count !== null && count > 0 && (
                  <span className={`font-mono text-[11px] tabular ${active ? 'opacity-80' : 'text-muted'}`}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <main>
        {tab === 'contador' && (
          <Contador
            stats={stats}
            onAdd={(tipo) => data.addChamada(tipo, selectedDay)}
            onUndo={(tipo) => data.undoChamada(tipo, selectedDay)}
            onRegistrar={() => setModalStatus('Agendado')}
            minhas={minhas}
            vendo={vendo}
            geral={visao === 'geral'}
          />
        )}
        {tab === 'convertidos' && (
          <Pessoas
            status="Agendado"
            pessoas={pessoas}
            onAdd={vendo ? undefined : () => setModalStatus('Agendado')}
            onStatus={data.updateStatus}
            onRemove={data.removePessoa}
            canEdit={canEdit}
            ownerName={ownerName}
          />
        )}
        {tab === 'interessados' && (
          <Pessoas
            status="Interessado"
            pessoas={pessoas}
            onAdd={vendo ? undefined : () => setModalStatus('Interessado')}
            onStatus={data.updateStatus}
            onRemove={data.removePessoa}
            canEdit={canEdit}
            ownerName={ownerName}
          />
        )}
        {tab === 'datas' && (
          <Datas day={selectedDay} stats={stats} recentDays={recentDays} onPick={setSelectedDay} ownerName={ownerName} />
        )}
      </main>

      {modalStatus && <PersonModal initialStatus={modalStatus} day={selectedDay} onClose={closeModal} onSave={savePessoa} />}
    </div>
  )
}
