-- Seed de desenvolvimento local: 1 usuario por papel (produtor, investidor,
-- verificador), com senha definida para permitir login via password grant
-- (util para testar com ferramentas como DataGrip/psql/curl). A UI do app
-- continua passwordless (RN-02, so aceita entrar por codigo de 6 digitos) -
-- ver README "Seeds locais" para as duas formas de logar com estes usuarios.
--
-- Rodado automaticamente a cada `npx supabase db reset`. Idempotente
-- (ON CONFLICT DO NOTHING) para o caso de ser executado avulso via
-- `psql ... -f supabase/seed.sql` sem um reset completo antes.

-- Mesma senha para os 3, so para facilitar o dev local.
-- LOGIN: <email-de-cada-usuario-abaixo>  SENHA: iasy123456
do $$
declare
  v_instance_id uuid := '00000000-0000-0000-0000-000000000000';
  v_password text := crypt('iasy123456', gen_salt('bf'));

  v_produtor_id uuid := '11111111-1111-1111-1111-111111111111';
  v_investidor_id uuid := '22222222-2222-2222-2222-222222222222';
  v_verificador_id uuid := '33333333-3333-3333-3333-333333333333';
begin
  -- auth.users: uma linha por usuario de teste. Os campos de token/change
  -- ficam em '' (nunca NULL) - o driver SQL do GoTrue nao aceita NULL
  -- nessas colunas varchar (erro "converting NULL to string is unsupported"
  -- ao tentar logar), mesmo sendo nullable no schema do Postgres.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, reauthentication_token,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values
    (v_instance_id, v_produtor_id, 'authenticated', 'authenticated', 'produtor@teste.iasy.local', v_password,
     now(), '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now()),
    (v_instance_id, v_investidor_id, 'authenticated', 'authenticated', 'investidor@teste.iasy.local', v_password,
     now(), '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now()),
    (v_instance_id, v_verificador_id, 'authenticated', 'authenticated', 'verificador@teste.iasy.local', v_password,
     now(), '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', now(), now())
  on conflict (id) do nothing;

  -- auth.identities: exigido pelo GoTrue para o login por senha funcionar.
  insert into auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
  values
    (gen_random_uuid(), v_produtor_id::text, v_produtor_id,
     jsonb_build_object('sub', v_produtor_id::text, 'email', 'produtor@teste.iasy.local'), 'email', now(), now()),
    (gen_random_uuid(), v_investidor_id::text, v_investidor_id,
     jsonb_build_object('sub', v_investidor_id::text, 'email', 'investidor@teste.iasy.local'), 'email', now(), now()),
    (gen_random_uuid(), v_verificador_id::text, v_verificador_id,
     jsonb_build_object('sub', v_verificador_id::text, 'email', 'verificador@teste.iasy.local'), 'email', now(), now())
  on conflict (provider_id, provider) do nothing;

  -- public.profiles: define o papel de cada um. O upsert de RF-02
  -- (`entrar/actions.ts`, `ignoreDuplicates: true`) nunca sobrescreve uma
  -- linha ja existente, entao o papel do verificador fica protegido mesmo
  -- que o login por codigo seja usado com outro radio marcado na tela.
  insert into public.profiles (id, role, nome, termos_versao, termos_aceitos_em)
  values
    (v_produtor_id, 'produtor', 'Produtora de Teste', null, null),
    (v_investidor_id, 'investidor', 'Investidor de Teste', '2026-09-28', now()),
    (v_verificador_id, 'verificador', 'Verificador de Teste', null, null)
  on conflict (id) do nothing;

  -- Um negocio ja Verificado, de propriedade da produtora de teste, para a
  -- vitrine/descoberta/verificacao terem algo pra mostrar sem precisar
  -- passar pelos fluxos de cadastro e analise inteiros.
  insert into public.businesses (
    owner_id, cnpj, nome, slug, tipo_org, cidade_ibge, uf, familias, anos_atividade,
    recebe_visitas, produtos, producao_mensal_kg, praticas, impactos, finalidade,
    valor_busca, prazo_meses, retorno_proposto, status, nota_a, nota_s, nota_g,
    verificado_em, selo_valido_ate
  )
  values (
    v_produtor_id, '11222333000181', 'Negócio de Teste', 'negocio-de-teste', 'cooperativa', '1501402', 'PA', 12, 5,
    true, array['Açaí'], 500, array['Manejo sem desmatamento'], array['Geração de renda'], 'equipamentos',
    100000, 24, 12.5, 'verificado', 85, 80, 90,
    now(), now() + interval '12 months'
  )
  on conflict (cnpj) where status not in ('reprovado', 'expirado') do nothing;
end $$;
