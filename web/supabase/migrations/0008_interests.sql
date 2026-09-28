-- RF-26 a RF-30, RN-36 a RN-41: interesse de um investidor em um
-- negocio (valor, mensagem, confirmacao de "nao e investimento") e a
-- linha do tempo de conexao ate a apresentacao ao parceiro financeiro.
--
-- Nomeada 0008 (nao 0007, como o texto de tasks.md previa) porque
-- 0007_documents.sql (T39, Lote 4) ja ocupou esse numero antes desta
-- fase comecar - mesma numeracao sequencial simples usada em
-- 0007_documents.sql.

-- RN-36/RN-38: interesse de um investidor em um negocio - valor
-- (minimo R$1.000, maximo = valor_busca do negocio e' validado na
-- aplicacao porque depende de outra tabela), mensagem opcional
-- (ate 500 caracteres), texto de confirmacao aceito e horario
-- (CA-38.2).
create table public.interests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  investor_id uuid not null references public.profiles (id) on delete cascade,
  valor numeric not null check (valor >= 1000),
  mensagem text check (mensagem is null or char_length(mensagem) <= 500),
  status text not null default 'pendente'
    check (status in ('pendente', 'aceito', 'recusado', 'expirado', 'cancelado')),
  confirmacao_texto text not null,
  confirmado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- RN-37/CA-37.1: no maximo 1 interesse Pendente OU Aceito por
-- investidor por negocio - indice unico parcial (so' considera as
-- linhas nesses 2 status; um interesse Recusado/Expirado/Cancelado
-- anterior nao bloqueia um novo).
create unique index interests_unique_pendente_aceito_per_investor_business
  on public.interests (business_id, investor_id)
  where status in ('pendente', 'aceito');

alter table public.interests enable row level security;

-- O investidor sempre le' os proprios interesses (tela "Meus
-- interesses", T51).
create policy "interests_select_own"
  on public.interests
  for select
  to authenticated
  using (investor_id = auth.uid());

-- A produtora le' os interesses do proprio negocio (tela "Quem tem
-- interesse", T48).
create policy "interests_select_owner_business"
  on public.interests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = interests.business_id
        and b.owner_id = auth.uid()
    )
  );

-- O verificador ve todos os interesses (painel de conexoes, T49).
create policy "interests_select_verificador"
  on public.interests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'verificador'
    )
  );

-- RN-36/CA-36.1: so' o proprio investidor cria o interesse, e so' se o
-- perfil for investidor/empresa (RN-01 - produtor nao demonstra
-- interesse, CA-36.3).
create policy "interests_insert_own"
  on public.interests
  for insert
  to authenticated
  with check (
    investor_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('investidor', 'empresa')
    )
  );

-- RN-37/T51: o investidor edita valor/mensagem ou cancela o proprio
-- interesse enquanto ele estiver Pendente - `using` so' deixa a
-- produtora... o investidor mirar linhas hoje Pendentes; `with check`
-- so' permite a linha continuar Pendente ou virar Cancelada (nunca
-- Aceita/Recusada por essa policy).
create policy "interests_update_own_pending"
  on public.interests
  for update
  to authenticated
  using (investor_id = auth.uid() and status = 'pendente')
  with check (investor_id = auth.uid() and status in ('pendente', 'cancelado'));

-- RN-39/T48: a produtora decide (Aceitar/Recusar) um interesse
-- Pendente do proprio negocio - `using` so' deixa mirar linhas hoje
-- Pendentes; `with check` so' permite a linha virar Aceita ou
-- Recusada.
create policy "interests_update_owner_business_decision"
  on public.interests
  for update
  to authenticated
  using (
    status = 'pendente'
    and exists (
      select 1
      from public.businesses b
      where b.id = interests.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (status in ('aceito', 'recusado'));

-- RN-40: linha do tempo de conexao de um interesse - cada mudanca de
-- etapa (pendente -> aceita -> apresentada_ao_parceiro -> ... ) vira
-- uma linha, com quem registrou (`autor_id`) e observacao opcional
-- (usada pelo painel de conexoes do verificador, T49).
create table public.connection_events (
  id uuid primary key default gen_random_uuid(),
  interest_id uuid not null references public.interests (id) on delete cascade,
  etapa text not null
    check (
      etapa in (
        'pendente',
        'aceita',
        'apresentada_ao_parceiro',
        'em_negociacao',
        'concluida',
        'nao_avancou'
      )
    ),
  observacao text,
  autor_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.connection_events enable row level security;

-- Quem pode ver a linha do tempo de um interesse: o proprio
-- investidor, a produtora dona do negocio, ou qualquer verificador -
-- mesma regra reaproveitada em select/insert para nao divergir.
create policy "connection_events_select_visible"
  on public.connection_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.interests i
      where i.id = connection_events.interest_id
        and (
          i.investor_id = auth.uid()
          or exists (
            select 1
            from public.businesses b
            where b.id = i.business_id
              and b.owner_id = auth.uid()
          )
          or exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role = 'verificador'
          )
        )
    )
  );

-- Insercao segue a mesma visibilidade: o investidor grava o evento
-- inicial "pendente" ao enviar o interesse (T46), a produtora grava
-- "aceita" (T48), o verificador grava "apresentada_ao_parceiro" e
-- demais etapas (T49) - cada Server Action ja valida a transicao
-- certa antes de chamar o insert, esta policy so' garante que o autor
-- tem visibilidade sobre o interesse.
create policy "connection_events_insert_visible"
  on public.connection_events
  for insert
  to authenticated
  with check (
    autor_id = auth.uid()
    and exists (
      select 1
      from public.interests i
      where i.id = connection_events.interest_id
        and (
          i.investor_id = auth.uid()
          or exists (
            select 1
            from public.businesses b
            where b.id = i.business_id
              and b.owner_id = auth.uid()
          )
          or exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role = 'verificador'
          )
        )
    )
  );
