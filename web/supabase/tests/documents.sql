begin;
select plan(5);

-- As 4 tabelas de documentos/pedidos/visualizacoes/visitas (T39).
select has_table('public', 'documents', 'a tabela documents deve existir');
select has_table('public', 'document_requests', 'a tabela document_requests deve existir');
select has_table('public', 'document_views', 'a tabela document_views deve existir');
select has_table('public', 'profile_visits', 'a tabela profile_visits deve existir');

-- Dono do negocio e investidor, para satisfazer as FKs abaixo.
insert into auth.users (id) values ('22222222-2222-2222-2222-222222222222');
insert into public.profiles (id, role, nome)
  values ('22222222-2222-2222-2222-222222222222', 'produtor', 'Raimunda');
insert into auth.users (id) values ('33333333-3333-3333-3333-333333333333');
insert into public.profiles (id, role, nome)
  values ('33333333-3333-3333-3333-333333333333', 'investidor', 'Investidora Teste');

insert into public.businesses (id, owner_id, status)
  values ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'verificado');

insert into public.documents (id, business_id, titulo, tipo, storage_path, aberto_a_todos)
  values (
    '55555555-5555-5555-5555-555555555555',
    '44444444-4444-4444-4444-444444444444',
    'CAR da propriedade',
    'car',
    '44444444-4444-4444-4444-444444444444/car.pdf',
    false
  );

-- RN-33/CA-33.1: liberar um pedido grava expira_em = decidido_em + 30
-- dias automaticamente, via trigger (nao depende da aplicacao calcular).
insert into public.document_requests (id, document_id, investor_id, status, decidido_em)
  values (
    '66666666-6666-6666-6666-666666666666',
    '55555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    'liberado',
    '2026-01-01T00:00:00Z'
  );

select is(
  (select expira_em from public.document_requests where id = '66666666-6666-6666-6666-666666666666'),
  '2026-01-31T00:00:00Z'::timestamptz,
  'expira_em deve ser decidido_em + 30 dias quando o pedido e liberado (RN-33)'
);

select * from finish();
rollback;
