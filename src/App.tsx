import { useCallback, useEffect, useMemo, useState } from 'react'
import { DaySelector } from './components/DaySelector'
import { PersonModal } from './components/PersonModal'
import { useData } from './hooks/useData'
import { todayStr } from './lib/dates'
import { daysWithRecords, statsForDay } from './lib/stats'
import { supabaseConfigured } from './lib/supabase'
import type { NovoConvertido, Status } from './lib/types'
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

export default function App() {
  const data = useData()
  const [tab, setTab] = useState<Tab>('contador')
  const [selectedDay, setSelectedDay] = useState(todayStr)
  const [modalStatus, setModalStatus] = useState<Status | null>(null)
  const [, setTick] = useState(0)

  // Re-renderiza a cada minuto para "Hoje" virar corretamente à meia-noite.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const stats = useMemo(
    () => statsForDay(data.chamadas, data.pessoas, selectedDay),
    [data.chamadas, data.pessoas, selectedDay],
  )
  const recentDays = useMemo(() => daysWithRecords(data.chamadas, data.pessoas, 14), [data.chamadas, data.pessoas])

  const closeModal = useCallback(() => setModalStatus(null), [])
  const savePessoa = useCallback((p: NovoConvertido) => data.addPessoa(p, selectedDay), [data.addPessoa, selectedDay])

  const showDaySelector = tab === 'contador' || tab === 'datas'
  const counts = {
    convertidos: data.pessoas.filter((p) => p.status === 'Agendado').length,
    interessados: data.pessoas.filter((p) => p.status === 'Interessado').length,
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent font-mono text-sm font-semibold text-accent-ink">
            +1
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold leading-tight sm:text-2xl">Contador de Ligações</h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">prospecção · workshop</p>
          </div>
        </div>
        {data.loading && supabaseConfigured && (
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">carregando…</span>
        )}
      </header>

      {!supabaseConfigured && (
        <div className="mb-6 rounded-xl border border-warn-line bg-warn-soft px-4 py-3 text-sm text-warn">
          Configure <code className="font-mono">VITE_SUPABASE_URL</code> e <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> no
          arquivo <code className="font-mono">.env</code> e reinicie o servidor.
        </div>
      )}

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
          />
        )}
        {tab === 'convertidos' && (
          <Pessoas
            status="Agendado"
            pessoas={data.pessoas}
            onAdd={() => setModalStatus('Agendado')}
            onStatus={data.updateStatus}
            onRemove={data.removePessoa}
          />
        )}
        {tab === 'interessados' && (
          <Pessoas
            status="Interessado"
            pessoas={data.pessoas}
            onAdd={() => setModalStatus('Interessado')}
            onStatus={data.updateStatus}
            onRemove={data.removePessoa}
          />
        )}
        {tab === 'datas' && <Datas day={selectedDay} stats={stats} recentDays={recentDays} onPick={setSelectedDay} />}
      </main>

      {modalStatus && <PersonModal initialStatus={modalStatus} day={selectedDay} onClose={closeModal} onSave={savePessoa} />}
    </div>
  )
}
