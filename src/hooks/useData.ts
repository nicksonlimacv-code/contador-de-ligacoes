import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createdAtForDay, dayOf } from '../lib/dates'
import type { Chamada, Convertido, NovoConvertido, Status, TipoChamada } from '../lib/types'
import { useRealtimeTable } from './useRealtimeTable'

export function useData() {
  const chamadas = useRealtimeTable<Chamada>('chamadas')
  const pessoas = useRealtimeTable<Convertido>('convertidos')
  const [actionError, setActionError] = useState<string | null>(null)

  const fail = useCallback((msg: string, e: unknown) => {
    const detail = e && typeof e === 'object' && 'message' in e ? String(e.message) : ''
    setActionError(detail ? `${msg}: ${detail}` : msg)
  }, [])

  const addChamada = useCallback(
    async (tipo: TipoChamada, day: string) => {
      const { data, error } = await supabase
        .from('chamadas')
        .insert({ tipo, created_at: createdAtForDay(day) })
        .select()
        .single()
      if (error) return fail('Não foi possível registrar a ligação', error)
      chamadas.upsertLocal(data as Chamada)
    },
    [chamadas.upsertLocal, fail],
  )

  const undoChamada = useCallback(
    async (tipo: TipoChamada, day: string) => {
      const last = [...chamadas.rows]
        .reverse()
        .find((c) => c.tipo === tipo && dayOf(c.created_at) === day)
      if (!last) return
      chamadas.removeLocal(last.id)
      const { error } = await supabase.from('chamadas').delete().eq('id', last.id)
      if (error) {
        chamadas.upsertLocal(last)
        fail('Não foi possível desfazer', error)
      }
    },
    [chamadas.rows, chamadas.removeLocal, chamadas.upsertLocal, fail],
  )

  const addPessoa = useCallback(
    async (nova: NovoConvertido, day: string): Promise<boolean> => {
      const { data, error } = await supabase
        .from('convertidos')
        .insert({ ...nova, created_at: createdAtForDay(day) })
        .select()
        .single()
      if (error) {
        fail('Não foi possível salvar a pessoa', error)
        return false
      }
      pessoas.upsertLocal(data as Convertido)
      return true
    },
    [pessoas.upsertLocal, fail],
  )

  const updateStatus = useCallback(
    async (pessoa: Convertido, status: Status) => {
      if (pessoa.status === status) return
      pessoas.upsertLocal({ ...pessoa, status })
      const { error } = await supabase.from('convertidos').update({ status }).eq('id', pessoa.id)
      if (error) {
        pessoas.upsertLocal(pessoa)
        fail('Não foi possível alterar o status', error)
      }
    },
    [pessoas.upsertLocal, fail],
  )

  const removePessoa = useCallback(
    async (pessoa: Convertido) => {
      pessoas.removeLocal(pessoa.id)
      const { error } = await supabase.from('convertidos').delete().eq('id', pessoa.id)
      if (error) {
        pessoas.upsertLocal(pessoa)
        fail('Não foi possível remover', error)
      }
    },
    [pessoas.removeLocal, pessoas.upsertLocal, fail],
  )

  return {
    chamadas: chamadas.rows,
    pessoas: pessoas.rows,
    loading: chamadas.loading || pessoas.loading,
    loadError: chamadas.error ?? pessoas.error,
    actionError,
    clearActionError: () => setActionError(null),
    addChamada,
    undoChamada,
    addPessoa,
    updateStatus,
    removePessoa,
  }
}

export type AppData = ReturnType<typeof useData>
