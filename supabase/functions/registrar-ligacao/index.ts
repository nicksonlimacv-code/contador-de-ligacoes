// Endpoint para sistemas externos registrarem ligações (ex.: WhatsApp Web).
// Contrato documentado em INTEGRACAO.md.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const optionalString = (v: unknown, max: number) =>
  v === undefined || v === null || (typeof v === 'string' && v.length <= max)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { erro: 'Use POST' })

  const token = req.headers.get('x-api-key')
  if (!token) return json(401, { erro: 'Header x-api-key ausente' })
  const { data: integracao } = await supabase
    .from('integracao_tokens')
    .select('sistema, user_id')
    .eq('token_hash', await sha256(token))
    .eq('ativo', true)
    .maybeSingle()
  if (!integracao) return json(401, { erro: 'Token inválido' })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json(400, { erro: 'Corpo precisa ser JSON' })
  }

  const { id, atendida, telefone, contato, duracao_segundos, iniciada_em, usuario_email } = body
  const erros: string[] = []
  if (typeof id !== 'string' || !id || id.length > 200) erros.push('id: texto obrigatório (até 200 caracteres)')
  if (typeof atendida !== 'boolean') erros.push('atendida: booleano obrigatório')
  if (!optionalString(telefone, 40)) erros.push('telefone: texto (até 40 caracteres)')
  if (!optionalString(contato, 200)) erros.push('contato: texto (até 200 caracteres)')
  if (duracao_segundos != null && !(Number.isInteger(duracao_segundos) && (duracao_segundos as number) >= 0))
    erros.push('duracao_segundos: inteiro >= 0')
  if (iniciada_em != null && (typeof iniciada_em !== 'string' || Number.isNaN(Date.parse(iniciada_em))))
    erros.push('iniciada_em: data ISO 8601')
  if (!integracao.user_id && (typeof usuario_email !== 'string' || !usuario_email.trim()))
    erros.push('usuario_email: obrigatório (e-mail de quem fez a ligação)')
  if (erros.length) return json(422, { erro: 'Dados inválidos', detalhes: erros })

  // Dono da ligação: o usuário do token ou, se o token é do sistema todo, quem veio em usuario_email.
  let userId: string | null = integracao.user_id
  if (!userId) {
    const { data: perfil } = await supabase
      .from('perfis')
      .select('id')
      .eq('email', (usuario_email as string).trim().toLowerCase())
      .maybeSingle()
    if (!perfil) return json(422, { erro: 'Dados inválidos', detalhes: ['usuario_email: nenhum usuário com esse e-mail'] })
    userId = perfil.id
  }

  // Parte do que já foi salvo desta ligação, para um reenvio não apagar dados de um envio anterior
  // e para a linha 'atendida' herdar telefone, contato e horário da 'feita'.
  const { data: anterior } = await supabase
    .from('chamadas')
    .select('telefone, contato, duracao_segundos, created_at')
    .eq('origem', integracao.sistema)
    .eq('externo_id', id)
    .eq('tipo', 'feita')
    .maybeSingle()
  const campos: Record<string, unknown> = { ...anterior, origem: integracao.sistema, externo_id: id, user_id: userId }
  if (telefone != null) campos.telefone = telefone
  if (contato != null) campos.contato = contato
  if (duracao_segundos != null) campos.duracao_segundos = duracao_segundos
  if (iniciada_em != null) campos.created_at = new Date(iniciada_em as string).toISOString()
  campos.created_at ??= new Date().toISOString()

  // Mesma regra do app: toda ligação conta como 'feita'; se atendida, conta também como 'atendida'.
  const tipos = atendida ? ['feita', 'atendida'] : ['feita']
  const { error } = await supabase
    .from('chamadas')
    .upsert(tipos.map((tipo) => ({ ...campos, tipo })), { onConflict: 'origem,externo_id,tipo' })
  if (error) {
    console.error(error)
    return json(500, { erro: 'Falha ao registrar a ligação' })
  }

  return json(200, { ok: true, registrada_como: tipos })
})
