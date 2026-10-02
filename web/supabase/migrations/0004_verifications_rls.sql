-- RF-14 a RF-16, RN-13, RN-30, RN-31: registro de cada decisao de
-- verificacao (aprovar/pedir ajuste/reprovar/suspender/reativar) e as
-- policies de visibilidade de `businesses` por papel.

-- RN-18, RN-21: decisao de verificacao, sempre com autor, motivo e data.
-- Sem UPDATE/DELETE exposto na aplicacao (T27-T29) - decisao gravada e'
-- imutavel, historico completo por negocio (RF-16).
create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  verifier_id uuid not null references public.profiles (id),
  decisao text not null check (decisao in ('aprovar', 'ajuste', 'reprovar', 'suspender', 'reativar')),
  motivo text,
  checklist jsonb not null default '{}'::jsonb,
  itens_ajuste text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- RNF-04: RLS habilitada, sem policy propria nesta fase - so' o cliente
-- admin (Server Actions de app/(verifier)/verificacao) le/escreve esta
-- tabela, mesmo padrao usado em `businesses` antes deste migration.
alter table public.verifications enable row level security;

-- RN-13: so' negocios com selo "Verificado Iasy" sao publicos (vitrine,
-- resultados, busca - RF-18/RF-19). `suspenso`/`em_analise`/etc. NAO
-- aparecem aqui - a mesma policy ja cobre a exclusao de `suspenso`
-- exigida por RN-21/CA-13.2 (T29), porque so' `status = 'verificado'`
-- passa.
create policy "businesses_select_public_verificado"
  on public.businesses
  for select
  to anon, authenticated
  using (status = 'verificado');

-- RN-05/RF-11: o dono sempre ve o proprio negocio, em qualquer status
-- (rascunho, em_analise, ajuste_solicitado, reprovado, suspenso,
-- expirado) - precisa continuar o cadastro e ver o resultado da
-- analise.
create policy "businesses_select_owner"
  on public.businesses
  for select
  to authenticated
  using (auth.uid() = owner_id);

-- RF-14 a RF-16: o verificador enxerga todos os negocios, em qualquer
-- status, para a fila e a tela de analise.
create policy "businesses_select_verificador"
  on public.businesses
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'verificador'
    )
  );
