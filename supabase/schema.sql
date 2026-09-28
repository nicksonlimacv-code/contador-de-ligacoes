-- Contador de Ligações — schema
-- Rode este arquivo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.chamadas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('feita', 'atendida')),
  created_at timestamptz not null default now()
);

create table if not exists public.convertidos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text,
  cargo text,
  celular text,
  dia_workshop date,
  status text not null default 'Agendado' check (status in ('Interessado', 'Agendado')),
  observacoes text,
  created_at timestamptz not null default now()
);

create index if not exists chamadas_created_at_idx on public.chamadas (created_at);
create index if not exists convertidos_created_at_idx on public.convertidos (created_at);

-- RLS: uso pessoal, sem autenticação multiusuário — tudo liberado para anon.
alter table public.chamadas enable row level security;
alter table public.convertidos enable row level security;

drop policy if exists "chamadas_all" on public.chamadas;
create policy "chamadas_all" on public.chamadas
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "convertidos_all" on public.convertidos;
create policy "convertidos_all" on public.convertidos
  for all to anon, authenticated using (true) with check (true);

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chamadas'
  ) then
    alter publication supabase_realtime add table public.chamadas;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'convertidos'
  ) then
    alter publication supabase_realtime add table public.convertidos;
  end if;
end $$;

-- Integração com sistemas externos (ex.: WhatsApp Web) — ver INTEGRACAO.md.
alter table public.chamadas
  add column if not exists origem text not null default 'manual',
  add column if not exists externo_id text,
  add column if not exists telefone text,
  add column if not exists contato text,
  add column if not exists duracao_segundos integer check (duracao_segundos >= 0);

-- Uma ligação externa gera no máximo uma linha 'feita' e uma 'atendida'.
alter table public.chamadas drop constraint if exists chamadas_externo_unico;
alter table public.chamadas
  add constraint chamadas_externo_unico unique (origem, externo_id, tipo);

-- Tokens dos sistemas integrados (guardamos só o hash SHA-256).
-- RLS ligado e sem policies: só a service role (Edge Function) acessa.
create table if not exists public.integracao_tokens (
  id uuid primary key default gen_random_uuid(),
  sistema text not null,
  token_hash text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.integracao_tokens enable row level security;

-- Login: cada registro tem dono. Todos os logados leem tudo (painel geral),
-- cada um altera só o que é seu. Substitui as policies abertas para anon acima.
create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.perfis enable row level security;

drop policy if exists "perfis_select" on public.perfis;
create policy "perfis_select" on public.perfis
  for select to authenticated using (true);
drop policy if exists "perfis_update_own" on public.perfis;
create policy "perfis_update_own" on public.perfis
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;
revoke execute on function public.criar_perfil() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.criar_perfil();

alter table public.chamadas
  add column if not exists user_id uuid not null default auth.uid() references auth.users (id) on delete cascade;
alter table public.convertidos
  add column if not exists user_id uuid not null default auth.uid() references auth.users (id) on delete cascade;
create index if not exists chamadas_user_id_idx on public.chamadas (user_id);
create index if not exists convertidos_user_id_idx on public.convertidos (user_id);

-- Token de integração pode pertencer a um usuário (as ligações vão para ele).
alter table public.integracao_tokens
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

drop policy if exists "chamadas_all" on public.chamadas;
drop policy if exists "convertidos_all" on public.convertidos;
drop policy if exists "chamadas_select" on public.chamadas;
drop policy if exists "chamadas_insert_own" on public.chamadas;
drop policy if exists "chamadas_update_own" on public.chamadas;
drop policy if exists "chamadas_delete_own" on public.chamadas;
drop policy if exists "convertidos_select" on public.convertidos;
drop policy if exists "convertidos_insert_own" on public.convertidos;
drop policy if exists "convertidos_update_own" on public.convertidos;
drop policy if exists "convertidos_delete_own" on public.convertidos;

create policy "chamadas_select" on public.chamadas
  for select to authenticated using (true);
create policy "chamadas_insert_own" on public.chamadas
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "chamadas_update_own" on public.chamadas
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "chamadas_delete_own" on public.chamadas
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "convertidos_select" on public.convertidos
  for select to authenticated using (true);
create policy "convertidos_insert_own" on public.convertidos
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "convertidos_update_own" on public.convertidos
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "convertidos_delete_own" on public.convertidos
  for delete to authenticated using ((select auth.uid()) = user_id);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'perfis'
  ) then
    alter publication supabase_realtime add table public.perfis;
  end if;
end $$;
