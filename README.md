# Contador de Ligações

Ferramenta pessoal de prospecção: ligações feitas, atendidas e conversões para o workshop.
React + Vite + TypeScript + Tailwind CSS v4 + Supabase (Postgres + realtime).

## Configuração

1. Crie um projeto no [Supabase](https://supabase.com).
2. No **SQL Editor**, rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql)
   (cria as tabelas, os perfis de usuário, as policies de RLS e habilita o realtime).
3. Copie `.env.example` para `.env` e preencha com os valores de
   *Project Settings → API*:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```
4. `npm install` e `npm run dev`.

## Integração com outros sistemas

Sistemas externos (ex.: WhatsApp Web) registram ligações pela Edge Function
[`registrar-ligacao`](supabase/functions/registrar-ligacao/index.ts). O contrato está em
[`INTEGRACAO.md`](INTEGRACAO.md).

Cada sistema tem seu token; no banco fica só o hash, em `integracao_tokens`. Para criar
um token novo, gere um valor aleatório, entregue-o ao sistema e salve o hash. Com `user_id`
preenchido, as ligações vão para esse usuário; sem ele, o sistema precisa mandar
`usuario_email` em cada ligação.

```sql
insert into public.integracao_tokens (sistema, token_hash, user_id)
values ('nome-do-sistema', encode(extensions.digest('<token>', 'sha256'), 'hex'),
        (select id from public.perfis where email = 'pessoa@empresa.com'));  -- ou null
```

Para revogar: `update public.integracao_tokens set ativo = false where sistema = '...'`.

## Login e permissões

Login com e-mail e senha pelo Supabase Auth, com cadastro aberto e recuperação de senha por
e-mail. Todos os usuários logados veem os dados da equipe inteira (visão geral, com filtro por
pessoa), mas cada um só altera e remove o que registrou. Sem login, nada é lido nem gravado.

No painel do Supabase:

- **Authentication → Sign In / Providers → Email:** desligue *Confirm email* para o cadastro
  entrar direto.
- **Authentication → URL Configuration:** em *Site URL* coloque o endereço do app publicado
  e em *Redirect URLs* adicione também `http://localhost:5173`. O link de recuperação de
  senha só volta para endereços dessa lista.
- O envio de e-mails padrão do Supabase tem limite baixo por hora. Para uso real da
  recuperação de senha, configure um SMTP próprio em *Authentication → Emails*.

## Como os dias funcionam

Nada é filtrado por dia no banco: todo registro fica salvo com seu `created_at` real.
A separação por dia é feita no client, comparando a data **local** de `created_at`
com o dia selecionado. Ao registrar algo com outro dia selecionado, o `created_at`
recebe a hora atual aplicada àquela data.
