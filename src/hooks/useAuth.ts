import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from '../lib/supabase'

/**
 * Sessão atual do Supabase Auth. `recovery` fica true quando o usuário chega
 * pelo link de "esqueci minha senha" e ainda precisa definir a senha nova.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(supabaseConfigured)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') setRecovery(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return { session, loading, recovery, finishRecovery: () => setRecovery(false) }
}
