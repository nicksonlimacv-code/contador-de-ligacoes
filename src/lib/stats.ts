import { dayOf } from './dates'
import type { Chamada, Convertido } from './types'

export interface DayStats {
  feitas: number
  atendidas: number
  /** Pessoas com status Agendado registradas no dia. */
  convertidas: number
  pessoas: Convertido[]
}

/** Filtro por dia sempre no client, pela data local de created_at. */
export function statsForDay(chamadas: Chamada[], pessoas: Convertido[], day: string): DayStats {
  let feitas = 0
  let atendidas = 0
  for (const c of chamadas) {
    if (dayOf(c.created_at) !== day) continue
    if (c.tipo === 'feita') feitas++
    else atendidas++
  }
  const doDia = pessoas.filter((p) => dayOf(p.created_at) === day)
  return {
    feitas,
    atendidas,
    convertidas: doDia.filter((p) => p.status === 'Agendado').length,
    pessoas: doDia,
  }
}

/** Dias (mais recentes primeiro) que têm alguma ligação ou pessoa registrada. */
export function daysWithRecords(chamadas: Chamada[], pessoas: Convertido[], limit: number): string[] {
  const days = new Set<string>()
  for (const c of chamadas) days.add(dayOf(c.created_at))
  for (const p of pessoas) days.add(dayOf(p.created_at))
  return [...days].sort().reverse().slice(0, limit)
}
