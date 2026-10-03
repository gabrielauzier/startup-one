-- AUTH-15: eventos de produto dos fluxos de autenticacao (cadastro,
-- confirmacao, login, magic link, reset, logout). Prefixo `auth_` para
-- nao colidir com `cadastro_enviado` do produtor. O payload nunca leva
-- e-mail, senha, token ou codigo. Mantem os 18 tipos existentes.
alter table public.events drop constraint events_type_check;

alter table public.events add constraint events_type_check check (
  type in (
    -- RF-31 e Fix 5: avisos.
    'cadastro_recebido',
    'ajuste_pedido',
    'selo_concedido',
    'reprovacao',
    'pedido_documento',
    'documento_liberado',
    'interesse_recebido',
    'interesse_aceito',
    'apresentacao_parceiro',
    'rascunho_expirando_em_breve',
    'selo_expirando_em_breve',
    'suspensao_negocio',
    'suspensao_negocio_investidor',
    -- RF-32: eventos de produto (metricas PRD 8.1).
    'cadastro_iniciado',
    'cadastro_enviado',
    'descoberta_concluida',
    'interesse_enviado',
    'conexao_em_negociacao',
    -- AUTH-15: eventos de autenticacao.
    'auth_cadastro_enviado',
    'auth_email_confirmado',
    'auth_login_senha_ok',
    'auth_login_senha_erro',
    'auth_magic_link_pedido',
    'auth_magic_link_ok',
    'auth_reset_pedido',
    'auth_reset_codigo_ok',
    'auth_reset_codigo_erro',
    'auth_senha_alterada',
    'auth_logout'
  )
);
