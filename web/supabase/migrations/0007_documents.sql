-- RF-21 a RF-24, RN-32 a RN-35: documentos sensiveis de um negocio,
-- pedidos de acesso do investidor, registro de abertura e visitas ao
-- perfil publico.
--
-- Nomeada 0007 (nao 0006, como o texto de tasks.md previa) porque
-- 0006_investor_answers.sql (T32, Lote 3) ja ocupou esse numero antes
-- desta fase comecar - mesma numeracao sequencial simples usada em
-- 0006_investor_answers.sql.

-- RN-32/RN-34: documento de um negocio - "Aberto a todos" (resumo
-- gerado pela Iasy) ou sensivel (CAR, DAP, laudo, certificado
-- completo), so' liberado por pedido explicito (document_requests).
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  titulo text not null,
  tipo text not null check (tipo in ('resumo', 'car', 'dap', 'laudo', 'certificado_completo')),
  data date,
  storage_path text not null,
  aberto_a_todos boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

-- RN-32: o "resumo do negocio" e qualquer documento marcado aberto a
-- todos e' publico, mesmo para visitante sem sessao.
create policy "documents_select_aberto_a_todos"
  on public.documents
  for select
  to anon, authenticated
  using (aberto_a_todos = true);

-- A produtora sempre ve todos os documentos do proprio negocio,
-- sensiveis ou nao (para a tela de pedidos/documentos adicionais).
create policy "documents_select_owner"
  on public.documents
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = documents.business_id
        and b.owner_id = auth.uid()
    )
  );

-- RN-30: investidor/empresa logados veem a lista de documentos
-- (metadados) do negocio para montar a tabela de situacoes - o
-- conteudo em si so' e' servido por URL assinada gerada sob demanda
-- (AD-007), nunca por este SELECT.
create policy "documents_select_investidor"
  on public.documents
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('investidor', 'empresa')
    )
  );

-- RN-32, RN-33: pedido de acesso de um investidor a um documento
-- sensivel de um negocio especifico. Sem UNIQUE em
-- (document_id, investor_id) de proposito - um pedido recusado,
-- expirado ou retirado pode ser refeito, e cada tentativa fica
-- registrada como uma nova linha (historico visivel a produtora em
-- /produtor/pedidos, T43).
create table public.document_requests (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  investor_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pendente'
    check (status in ('pendente', 'liberado', 'recusado', 'expirado', 'retirado')),
  decidido_em timestamptz,
  expira_em timestamptz,
  created_at timestamptz not null default now()
);

alter table public.document_requests enable row level security;

-- RN-30/CA-30.2: investidor so' le' os proprios pedidos.
create policy "document_requests_select_own"
  on public.document_requests
  for select
  to authenticated
  using (investor_id = auth.uid());

-- A produtora le' todos os pedidos dos documentos do proprio negocio
-- (fila de /produtor/pedidos, T43).
create policy "document_requests_select_owner_business"
  on public.document_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.documents d
      join public.businesses b on b.id = d.business_id
      where d.id = document_requests.document_id
        and b.owner_id = auth.uid()
    )
  );

-- RN-32/CA-32.1: o investidor cria o proprio pedido.
create policy "document_requests_insert_own"
  on public.document_requests
  for insert
  to authenticated
  with check (investor_id = auth.uid());

-- RN-33/CA-32.3/CA-33.2: so' a produtora dona do negocio decide
-- (liberar/recusar/retirar) um pedido do proprio negocio.
create policy "document_requests_update_owner_business"
  on public.document_requests
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.documents d
      join public.businesses b on b.id = d.business_id
      where d.id = document_requests.document_id
        and b.owner_id = auth.uid()
    )
  );

-- RN-33: quando um pedido e' liberado, `expira_em` e' sempre
-- `decidido_em + 30 dias` (CA-33.1) - garantido por trigger, nao so'
-- na aplicacao, para nao depender de toda Server Action calcular a
-- data certa.
create or replace function public.set_document_request_expira_em()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'liberado' then
    if new.decidido_em is null then
      new.decidido_em := now();
    end if;
    new.expira_em := new.decidido_em + interval '30 days';
  end if;
  return new;
end;
$$;

create trigger document_requests_set_expira_em
  before insert or update on public.document_requests
  for each row
  execute function public.set_document_request_expira_em();

-- RN-35/CA-35.1: registro de cada abertura de documento sensivel -
-- investidor, documento, data e hora, visivel no painel da produtora.
create table public.document_views (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  investor_id uuid not null references public.profiles (id) on delete cascade,
  visto_em timestamptz not null default now()
);

alter table public.document_views enable row level security;

create policy "document_views_select_own"
  on public.document_views
  for select
  to authenticated
  using (investor_id = auth.uid());

create policy "document_views_select_owner_business"
  on public.document_views
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.documents d
      join public.businesses b on b.id = d.business_id
      where d.id = document_views.document_id
        and b.owner_id = auth.uid()
    )
  );

create policy "document_views_insert_own"
  on public.document_views
  for insert
  to authenticated
  with check (investor_id = auth.uid());

-- RN-35/CA-35.1: 1 visita por dia por pessoa no indicador da
-- produtora. `investor_id` identifica um visitante logado;
-- `session_id` (cookie httpOnly `iasy_visitor`, gerado no primeiro
-- carregamento de /negocios/[slug]) identifica um visitante anonimo -
-- o design.md nao detalha essa escolha, decisao registrada aqui: sem
-- isso, todo visitante sem sessao contaria como uma unica "pessoa"
-- (impossivel distinguir 2 anonimos), e um investidor deslogado que
-- depois loga contaria como 2 visitas no mesmo dia (cookie + login) -
-- aceito como limite conhecido do MVP, ainda assim melhor que nenhuma
-- deduplicacao.
create table public.profile_visits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  investor_id uuid references public.profiles (id) on delete cascade,
  session_id text,
  dia date not null default current_date,
  created_at timestamptz not null default now(),
  check (investor_id is not null or session_id is not null)
);

create unique index profile_visits_unique_per_day
  on public.profile_visits (business_id, coalesce(investor_id::text, session_id), dia);

alter table public.profile_visits enable row level security;

-- So' a produtora dona do negocio le' o contador de visitas (RF-29,
-- painel do produtor). Ninguem mais precisa ler esta tabela.
create policy "profile_visits_select_owner_business"
  on public.profile_visits
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = profile_visits.business_id
        and b.owner_id = auth.uid()
    )
  );

-- Qualquer visitante (logado ou anonimo) pode registrar a propria
-- visita - insert-only, sem leitura cruzada.
create policy "profile_visits_insert_any"
  on public.profile_visits
  for insert
  to anon, authenticated
  with check (true);
