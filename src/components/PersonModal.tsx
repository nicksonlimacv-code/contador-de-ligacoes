import { useEffect, useRef, useState, type FormEvent } from 'react'
import { formatTitle } from '../lib/dates'
import type { NovoConvertido, Status } from '../lib/types'

interface Props {
  initialStatus: Status
  day: string
  onClose: () => void
  onSave: (p: NovoConvertido) => Promise<boolean>
}

const field =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25'
const label = 'mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted'

const clean = (s: string) => (s.trim() ? s.trim() : null)

export function PersonModal({ initialStatus, day, onClose, onSave }: Props) {
  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [cargo, setCargo] = useState('')
  const [celular, setCelular] = useState('')
  const [diaWorkshop, setDiaWorkshop] = useState('')
  const [status, setStatus] = useState<Status>(initialStatus)
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const nomeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nomeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || saving) return
    setSaving(true)
    const ok = await onSave({
      nome: nome.trim(),
      empresa: clean(empresa),
      cargo: clean(cargo),
      celular: clean(celular),
      dia_workshop: diaWorkshop || null,
      status,
      observacoes: clean(observacoes),
    })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 id="modal-title" className="font-serif text-xl font-semibold">
              Registrar pessoa
            </h3>
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted">entra em · {formatTitle(day)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="f-nome">
              Nome <span className="text-danger">*</span>
            </label>
            <input id="f-nome" ref={nomeRef} required className={field} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="f-empresa">
              Empresa
            </label>
            <input id="f-empresa" className={field} value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="f-cargo">
              Cargo
            </label>
            <input id="f-cargo" className={field} value={cargo} onChange={(e) => setCargo(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="f-celular">
              Celular
            </label>
            <input
              id="f-celular"
              type="tel"
              inputMode="tel"
              placeholder="(11) 90000-0000"
              className={`${field} font-mono`}
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
            />
          </div>
          <div>
            <label className={label} htmlFor="f-dia">
              Dia do workshop
            </label>
            <input
              id="f-dia"
              type="date"
              className={`${field} font-mono`}
              value={diaWorkshop}
              onChange={(e) => setDiaWorkshop(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <span className={label}>Status</span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Status">
              {(['Interessado', 'Agendado'] as Status[]).map((s) => {
                const active = status === s
                const tone = s === 'Agendado' ? 'border-accent bg-accent-soft text-accent' : 'border-warn-line bg-warn-soft text-warn'
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setStatus(s)}
                    className={`rounded-xl border px-3 py-2.5 font-mono text-xs font-medium uppercase tracking-wider transition ${
                      active ? tone : 'border-line text-muted hover:text-ink'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="f-obs">
              Observações
            </label>
            <textarea id="f-obs" rows={3} className={`${field} resize-y`} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-2 hover:bg-surface-2">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!nome.trim() || saving}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition hover:opacity-90 disabled:opacity-40"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
