-- RF-17, RN-22 a RN-24: respostas da descoberta guiada do investidor
-- (as 5 perguntas em /descobrir/[n]), usadas por lib/matching/score.ts
-- para calcular o alinhamento com cada negocio verificado.
--
-- Nomeada 0006 (nao 0005, como o texto de tasks.md previa) porque
-- 0005_verification_assignment.sql (T26) ja ocupou esse numero antes
-- desta fase comecar - numeracao sequencial simples, sem gap.
create table public.investor_answers (
  investor_id uuid primary key references public.profiles (id) on delete cascade,
  -- Pergunta 1: "o que pesa mais" (RN-22).
  prioridade text not null check (prioridade in ('impacto', 'retorno', 'pessoas', 'equilibrio')),
  -- Pergunta 2: faixa de valor que o investidor busca colocar.
  faixa_valor text not null check (faixa_valor in ('ate_50k', '50_200k', 'acima_200k')),
  -- Pergunta 3: categorias de produto (ou `{todos}`); ao menos 1 (CA-22.1).
  produtos text[] not null default '{}',
  -- Pergunta 4: prazo maximo aceito, em meses.
  prazo_max_meses integer not null check (prazo_max_meses in (18, 24, 36)),
  -- Pergunta 5 (opcional, RN-22): impactos escolhidos; vazio = pulada (CA-22.3).
  impactos text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.investor_answers enable row level security;

-- RN-23: cada investidor so' ve'/edita as proprias respostas. Decisao
-- desta task: escrever a policy real ja' na migracao (em vez do padrao
-- "admin client + checagem manual" usado por tabelas anteriores sem
-- RLS propria) porque o modelo aqui e' 1 linha por dono, sem nenhuma
-- visibilidade cruzada (nem verificador, nem produtor, nem publico
-- precisam ler `investor_answers`) - o caso mais simples possivel de
-- RLS, direto desde a criacao.
create policy "investor_answers_select_own"
  on public.investor_answers
  for select
  using (investor_id = auth.uid());

create policy "investor_answers_insert_own"
  on public.investor_answers
  for insert
  with check (investor_id = auth.uid());

create policy "investor_answers_update_own"
  on public.investor_answers
  for update
  using (investor_id = auth.uid())
  with check (investor_id = auth.uid());

create policy "investor_answers_delete_own"
  on public.investor_answers
  for delete
  using (investor_id = auth.uid());
