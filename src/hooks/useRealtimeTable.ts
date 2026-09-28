import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

type Row = { id: string; created_at: string }

const PAGE = 1000

async function fetchAll<T extends Row>(table: string): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...((data ?? []) as T[]))
    if (!data || data.length < PAGE) return rows
  }
}

function sortRows<T extends Row>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at))
}

/**
 * Carrega a tabela inteira (sem filtro por dia) e a mantém sincronizada via
 * postgres_changes. Expõe helpers para atualização otimista local.
 */
export function useRealtimeTable<T extends Row>(table: string) {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const upsertLocal = useCallback((row: T) => {
    setRows((prev) => {
      const i = prev.findIndex((r) => r.id === row.id)
      if (i === -1) return sortRows([...prev, row])
      const next = [...prev]
      next[i] = row
      return sortRows(next)
    })
  }, [])

  const removeLocal = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false)
      return
    }
    let active = true

    const load = async () => {
      try {
        const data = await fetchAll<T>(table)
        if (active) {
          setRows(data)
          setError(null)
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (active) setLoading(false)
      }
    }

    const channel = supabase
      .channel(`rt-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as Partial<T>).id
          if (id) removeLocal(id)
        } else {
          upsertLocal(payload.new as T)
        }
      })
      .subscribe((status) => {
        // Recarrega ao (re)conectar para cobrir eventos perdidos.
        if (status === 'SUBSCRIBED') load()
      })

    load()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [table, upsertLocal, removeLocal])

  return { rows, loading, error, upsertLocal, removeLocal, setError }
}
