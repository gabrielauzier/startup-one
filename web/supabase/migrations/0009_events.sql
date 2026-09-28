-- RF-31/RF-32/RN-41: tabela unica de eventos, com um discriminador
-- `kind` para os 2 usos que compartilham a mesma tabela (design.md):
--   'aviso'   - fila de avisos da T53 (lib/notifications/queue.ts),
--               consumida pela equipe (WhatsApp manual) e/ou disparada
--               por e-mail automatico.
--   'produto' - eventos de produto da T56 (lib/analytics/track.ts)
--               usados nas metricas do MVP (PRD 8.1).
--
-- Nomeada 0009 (nao 0008, como o texto de tasks.md previa) porque
-- 0008_interests.sql (T45, Lote 5) ja ocupou esse numero antes desta
-- fase comecar - mesma numeracao sequencial simples usada nas
-- migracoes anteriores.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('aviso', 'produto')),
  type text not null check (
    type in (
      -- RF-31: os 9 tipos de aviso.
      'cadastro_recebido',
      'ajuste_pedido',
      'selo_concedido',
      'reprovacao',
      'pedido_documento',
      'documento_liberado',
      'interesse_recebido',
      'interesse_aceito',
      'apresentacao_parceiro',
      -- RF-32: os 5 eventos de produto (metricas PRD 8.1).
      'cadastro_iniciado',
      'cadastro_enviado',
      'descoberta_concluida',
      'interesse_enviado',
      'conexao_em_negociacao'
    )
  ),
  payload jsonb not null default '{}'::jsonb,
  -- Dono do aviso (produtor ou investidor, conforme o tipo) ou o autor
  -- do evento de produto. Null quando o destinatario nao e' um profile
  -- (ex.: 'apresentacao_parceiro' vai para o e-mail do parceiro
  -- financeiro, que nao tem linha em `profiles`) ou quando o evento de
  -- produto nao tem um ator logado (ex.: 'cadastro_iniciado' antes de
  -- qualquer envio).
  destinatario_id uuid references public.profiles (id) on delete set null,
  -- Canal do aviso - so' faz sentido para kind='aviso'. Null em
  -- eventos de produto.
  canal text check (canal in ('email', 'whatsapp_manual')),
  -- Quando o envio de fato aconteceu (e-mail disparado com sucesso).
  -- Fica null para a linha canal='whatsapp_manual' ate' a equipe
  -- confirmar o envio manual (fora do escopo deste MVP - a lista
  -- diaria e' so' consultada, RN-41/CA-41.1) e para eventos de
  -- produto (nao se aplica).
  enviado_em timestamptz,
  created_at timestamptz not null default now()
);

-- RNF-04: RLS habilitada, sem nenhuma policy - nega tudo para
-- authenticated/anon por padrao (so' o cliente admin, com a
-- service-role key, le'/escreve `events`). Tabela interna de operacao:
-- nem a fila diaria de avisos nem as metricas de produto tem tela que
-- exponha estas linhas a nenhum perfil de usuario neste MVP.
alter table public.events enable row level security;

create index events_type_idx on public.events (type);
create index events_kind_idx on public.events (kind);
create index events_destinatario_idx on public.events (destinatario_id)
  where destinatario_id is not null;
