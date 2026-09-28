import { useState, type FormEvent, type ReactNode } from 'react'
import type { AuthError } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from '../lib/supabase'

type Modo = 'entrar' | 'cadastrar' | 'recuperar'

const field =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25'
const label = 'mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted'
const primaryBtn =
  'w-full rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition hover:opacity-90 disabled:opacity-40'
const linkBtn = 'font-medium text-accent underline-offset-2 hover:underline'

const MIN_SENHA = 6

function mensagemErro(e: AuthError): string {
  switch (e.code) {
    case 'invalid_credentials':
      return 'E-mail ou senha incorretos.'
    case 'user_already_exists':
    case 'email_exists':
      return 'Já existe uma conta com este e-mail. Tente entrar ou recuperar a senha.'
    case 'weak_password':
      return `Senha fraca. Use pelo menos ${MIN_SENHA} caracteres.`
    case 'email_not_confirmed':
      return 'Confirme seu e-mail antes de entrar. Procure a mensagem na sua caixa de entrada.'
    case 'same_password':
      return 'A senha nova precisa ser diferente da atual.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.'
    case 'validation_failed':
      return 'Verifique o e-mail informado.'
    default:
      return e.message
  }
}

function Layout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent font-mono text-sm font-semibold text-accent-ink">
            +1
          </div>
          <div>
            <p className="font-serif text-xl font-semibold leading-tight">Contador de Ligações</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">prospecção · workshop</p>
          </div>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
          <h1 className="font-serif text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-ink-2">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

function Aviso({ tom, children }: { tom: 'erro' | 'ok'; children: ReactNode }) {
  const cls =
    tom === 'erro' ? 'border-danger/40 bg-danger/10 text-danger' : 'border-accent/30 bg-accent-soft text-accent'
  return (
    <p role={tom === 'erro' ? 'alert' : 'status'} className={`rounded-xl border px-3 py-2.5 text-sm ${cls}`}>
      {children}
    </p>
  )
}

const copy: Record<Modo, { title: string; subtitle: string; submit: string; enviando: string }> = {
  entrar: { title: 'Entrar', subtitle: 'Acesse o painel da equipe.', submit: 'Entrar', enviando: 'Entrando…' },
  cadastrar: { title: 'Criar conta', subtitle: 'Leva menos de um minuto.', submit: 'Criar conta', enviando: 'Criando…' },
  recuperar: {
    title: 'Recuperar senha',
    subtitle: 'Enviamos um link para você criar uma senha nova.',
    submit: 'Enviar link',
    enviando: 'Enviando…',
  },
}

export function AuthScreen() {
  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const trocar = (m: Modo) => {
    setModo(m)
    setErro(null)
    setOk(null)
    setSenha('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (enviando) return
    setEnviando(true)
    setErro(null)
    setOk(null)
    const emailLimpo = email.trim()

    if (modo === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email: emailLimpo, password: senha })
      if (error) setErro(mensagemErro(error))
    } else if (modo === 'cadastrar') {
      const { data, error } = await supabase.auth.signUp({
        email: emailLimpo,
        password: senha,
        options: { data: { nome: nome.trim() } },
      })
      if (error) setErro(mensagemErro(error))
      // Sem sessão = o projeto está exigindo confirmação de e-mail.
      else if (!data.session) setOk('Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre.')
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, {
        redirectTo: window.location.origin + window.location.pathname,
      })
      if (error) setErro(mensagemErro(error))
      else setOk('Se houver uma conta com este e-mail, o link chega em alguns minutos. Confira também o spam.')
    }
    setEnviando(false)
  }

  const c = copy[modo]

  return (
    <Layout title={c.title} subtitle={c.subtitle}>
      {!supabaseConfigured && (
        <div className="mb-4">
          <Aviso tom="erro">
            Configure <code className="font-mono">VITE_SUPABASE_URL</code> e <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>{' '}
            no arquivo <code className="font-mono">.env</code> e reinicie o servidor.
          </Aviso>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        {modo === 'cadastrar' && (
          <div>
            <label className={label} htmlFor="a-nome">
              Nome
            </label>
            <input
              id="a-nome"
              required
              autoComplete="name"
              className={field}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className={label} htmlFor="a-email">
            E-mail
          </label>
          <input
            id="a-email"
            type="email"
            required
            autoComplete="email"
            className={field}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {modo !== 'recuperar' && (
          <div>
            <div className="flex items-baseline justify-between">
              <label className={label} htmlFor="a-senha">
                Senha
              </label>
              {modo === 'entrar' && (
                <button type="button" onClick={() => trocar('recuperar')} className={`mb-1.5 text-xs ${linkBtn}`}>
                  Esqueci minha senha
                </button>
              )}
            </div>
            <input
              id="a-senha"
              type="password"
              required
              minLength={modo === 'cadastrar' ? MIN_SENHA : undefined}
              autoComplete={modo === 'cadastrar' ? 'new-password' : 'current-password'}
              className={field}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            {modo === 'cadastrar' && <p className="mt-1.5 text-xs text-muted">Mínimo de {MIN_SENHA} caracteres.</p>}
          </div>
        )}

        {erro && <Aviso tom="erro">{erro}</Aviso>}
        {ok && <Aviso tom="ok">{ok}</Aviso>}

        <button type="submit" disabled={enviando || !supabaseConfigured} className={primaryBtn}>
          {enviando ? c.enviando : c.submit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-2">
        {modo === 'entrar' ? (
          <>
            Não tem conta?{' '}
            <button type="button" onClick={() => trocar('cadastrar')} className={linkBtn}>
              Criar conta
            </button>
          </>
        ) : (
          <>
            {modo === 'cadastrar' ? 'Já tem conta? ' : 'Lembrou a senha? '}
            <button type="button" onClick={() => trocar('entrar')} className={linkBtn}>
              Entrar
            </button>
          </>
        )}
      </p>
    </Layout>
  )
}

/** Tela mostrada ao abrir o link de recuperação: define a senha nova. */
export function NovaSenha({ onDone }: { onDone: () => void }) {
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (enviando) return
    if (senha !== confirmacao) return setErro('As senhas não conferem.')
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setEnviando(false)
    if (error) return setErro(mensagemErro(error))
    window.history.replaceState(null, '', window.location.pathname)
    onDone()
  }

  return (
    <Layout title="Nova senha" subtitle="Escolha a senha que você vai usar a partir de agora.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={label} htmlFor="n-senha">
            Senha nova
          </label>
          <input
            id="n-senha"
            type="password"
            required
            minLength={MIN_SENHA}
            autoComplete="new-password"
            className={field}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-muted">Mínimo de {MIN_SENHA} caracteres.</p>
        </div>
        <div>
          <label className={label} htmlFor="n-confirma">
            Repita a senha
          </label>
          <input
            id="n-confirma"
            type="password"
            required
            autoComplete="new-password"
            className={field}
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
          />
        </div>
        {erro && <Aviso tom="erro">{erro}</Aviso>}
        <button type="submit" disabled={enviando} className={primaryBtn}>
          {enviando ? 'Salvando…' : 'Salvar senha'}
        </button>
      </form>
    </Layout>
  )
}
