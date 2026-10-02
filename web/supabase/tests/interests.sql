begin;
select plan(5);

-- As 2 tabelas de interesse/conexao (T45).
select has_table('public', 'interests', 'a tabela interests deve existir');
select has_table('public', 'connection_events', 'a tabela connection_events deve existir');

-- Investidor e dono do negocio, para satisfazer as FKs abaixo.
insert into auth.users (id) values ('77777777-7777-7777-7777-777777777777');
insert into public.profiles (id, role, nome)
  values ('77777777-7777-7777-7777-777777777777', 'produtor', 'Raimunda');
insert into auth.users (id) values ('88888888-8888-8888-8888-888888888888');
insert into public.profiles (id, role, nome)
  values ('88888888-8888-8888-8888-888888888888', 'investidor', 'Investidora Teste');

insert into public.businesses (id, owner_id, status, valor_busca)
  values ('99999999-9999-9999-9999-999999999999', '77777777-7777-7777-7777-777777777777', 'verificado', 100000);

-- RN-36/CHECK: valor abaixo de R$1.000 e rejeitado.
select throws_ok(
  $$ insert into public.interests (business_id, investor_id, valor, confirmacao_texto)
     values ('99999999-9999-9999-9999-999999999999', '88888888-8888-8888-8888-888888888888', 500, 'Entendo que estou demonstrando interesse, e nao investindo agora') $$,
  'new row for relation "interests" violates check constraint "interests_valor_check"',
  'valor abaixo de R$1.000 deve ser rejeitado (RN-36)'
);

insert into public.interests (id, business_id, investor_id, valor, confirmacao_texto)
  values (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '99999999-9999-9999-9999-999999999999',
    '88888888-8888-8888-8888-888888888888',
    50000,
    'Entendo que estou demonstrando interesse, e nao investindo agora'
  );

-- RN-37/CA-37.1: um 2o interesse Pendente do mesmo investidor no
-- mesmo negocio deve ser bloqueado pelo indice unico parcial.
select throws_ok(
  $$ insert into public.interests (business_id, investor_id, valor, confirmacao_texto)
     values ('99999999-9999-9999-9999-999999999999', '88888888-8888-8888-8888-888888888888', 60000, 'Entendo que estou demonstrando interesse, e nao investindo agora') $$,
  'duplicate key value violates unique constraint "interests_unique_pendente_aceito_per_investor_business"',
  'so pode haver 1 interesse Pendente ou Aceito por investidor por negocio (RN-37)'
);

-- Cancelar o interesse anterior libera um novo (recusado/cancelado
-- nao contam para o indice parcial).
update public.interests set status = 'cancelado' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select lives_ok(
  $$ insert into public.interests (business_id, investor_id, valor, confirmacao_texto)
     values ('99999999-9999-9999-9999-999999999999', '88888888-8888-8888-8888-888888888888', 60000, 'Entendo que estou demonstrando interesse, e nao investindo agora') $$,
  'apos cancelar, um novo interesse Pendente do mesmo par investidor/negocio deve ser permitido'
);

select * from finish();
rollback;
