# Contador de Ligações

Ferramenta pessoal de prospecção: ligações feitas, atendidas e conversões para o workshop.
React + Vite + TypeScript + Tailwind CSS v4 + Supabase (Postgres + realtime).

## Configuração

1. Crie um projeto no [Supabase](https://supabase.com).
2. No **SQL Editor**, rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql)
   (cria as tabelas, as policies de RLS liberadas e habilita o realtime).
3. Copie `.env.example` para `.env` e preencha com os valores de
   *Project Settings → API*:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```
4. `npm install` e `npm run dev`.

## Como os dias funcionam

Nada é filtrado por dia no banco: todo registro fica salvo com seu `created_at` real.
A separação por dia é feita no client, comparando a data **local** de `created_at`
com o dia selecionado. Ao registrar algo com outro dia selecionado, o `created_at`
recebe a hora atual aplicada àquela data.

> As policies liberam leitura e escrita para a chave anon. Qualquer pessoa com a URL
> e a anon key consegue ler e alterar os dados, então não publique essas chaves.
