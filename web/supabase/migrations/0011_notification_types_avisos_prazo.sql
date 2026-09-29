-- Fix 5 (rodada 1 do Verifier): RF-31 lista 9 tipos de aviso, mas
-- nenhum cobre "prazo se esgotando" (CA-07.3, CA-19.2) nem "negocio
-- suspenso" (CA-21.1) - por isso os 3 TODO(T53) nunca foram
-- resolvidos. Adiciona os tipos que faltam ao check de `events.type`.
-- `suspensao_negocio_investidor` e' um tipo separado de
-- `suspensao_negocio` porque os dois tem canais diferentes
-- (produtor: whatsapp manual + email; investidor: so' email) - o
-- mesmo padrao de canal-por-tipo ja usado pelos 9 tipos originais em
-- lib/notifications/queue.ts.
alter table public.events drop constraint events_type_check;

alter table public.events add constraint events_type_check check (
  type in (
    -- RF-31: os 9 tipos de aviso originais.
    'cadastro_recebido',
    'ajuste_pedido',
    'selo_concedido',
    'reprovacao',
    'pedido_documento',
    'documento_liberado',
    'interesse_recebido',
    'interesse_aceito',
    'apresentacao_parceiro',
    -- Fix 5: avisos de prazo se esgotando e de suspensao.
    'rascunho_expirando_em_breve',
    'selo_expirando_em_breve',
    'suspensao_negocio',
    'suspensao_negocio_investidor',
    -- RF-32: os 5 eventos de produto (metricas PRD 8.1).
    'cadastro_iniciado',
    'cadastro_enviado',
    'descoberta_concluida',
    'interesse_enviado',
    'conexao_em_negociacao'
  )
);
