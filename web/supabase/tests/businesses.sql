begin;
select plan(10);

-- As 5 tabelas do modelo de dados do cadastro (RF-06 a RF-10).
select has_table('public', 'businesses', 'a tabela businesses deve existir');
select has_table('public', 'business_revisions', 'a tabela business_revisions deve existir');
select has_table('public', 'evidences', 'a tabela evidences deve existir');
select has_table('public', 'certifications', 'a tabela certifications deve existir');
select has_table('public', 'partners', 'a tabela partners deve existir');

-- Um profile "dono" para satisfazer a FK de owner_id nos testes abaixo.
insert into auth.users (id) values ('11111111-1111-1111-1111-111111111111');
insert into public.profiles (id, role, nome)
  values ('11111111-1111-1111-1111-111111111111', 'produtor', 'Raimunda');

-- RN-19/CA-19.1: nota fora de 0-100 e' rejeitada.
select throws_ok(
  $$ insert into public.businesses (owner_id, nota_a) values ('11111111-1111-1111-1111-111111111111', 101) $$,
  23514,
  null,
  'nota fora de 0-100 deve ser rejeitada (CA-19.1)'
);

-- RN-19/CA-19.1: nota com casa decimal e' rejeitada (nao arredondada).
select throws_ok(
  $$ insert into public.businesses (owner_id, nota_a) values ('11111111-1111-1111-1111-111111111111', 94.5) $$,
  23514,
  null,
  'nota decimal deve ser rejeitada, nao arredondada (CA-19.1)'
);

-- RN-10/CA-10.1: valor fora de R$50 mil a R$200 mil e' rejeitado.
select throws_ok(
  $$ insert into public.businesses (owner_id, valor_busca) values ('11111111-1111-1111-1111-111111111111', 49999) $$,
  23514,
  null,
  'valor abaixo de R$50 mil deve ser rejeitado (CA-10.1)'
);

-- RN-05/CA-05.3: no maximo um negocio ativo (nao Reprovado/Expirado) por CNPJ.
insert into public.businesses (owner_id, cnpj, status)
  values ('11111111-1111-1111-1111-111111111111', '12345678000199', 'em_analise');

select throws_ok(
  $$ insert into public.businesses (owner_id, cnpj, status)
     values ('11111111-1111-1111-1111-111111111111', '12345678000199', 'rascunho') $$,
  23505,
  null,
  'segundo negocio ativo com o mesmo CNPJ deve ser rejeitado (CA-05.3)'
);

-- Um negocio Reprovado com o mesmo CNPJ nao conta para o indice parcial.
select lives_ok(
  $$ insert into public.businesses (owner_id, cnpj, status)
     values ('11111111-1111-1111-1111-111111111111', '12345678000199', 'reprovado') $$,
  'negocio Reprovado nao bloqueia um novo cadastro com o mesmo CNPJ'
);

select * from finish();
rollback;
