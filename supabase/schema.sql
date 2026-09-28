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
