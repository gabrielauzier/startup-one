-- RN-01: perfil por conta (investidor, empresa, produtor, verificador)
create type public.role as enum ('investidor', 'empresa', 'produtor', 'verificador');

-- RN-12: maquina de estados do negocio
create type public.business_status as enum (
  'rascunho',
  'em_analise',
  'ajuste_solicitado',
  'verificado',
  'reprovado',
  'suspenso',
  'expirado'
);

-- RN-01, RN-03: perfil do usuario e consentimento LGPD
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.role not null,
  nome text not null,
  tipo_investidor text check (tipo_investidor in ('pf_qualificada', 'family', 'empresa')),
  termos_versao text,
  termos_aceitos_em timestamptz,
  created_at timestamptz not null default now()
);

-- RNF-04: RLS habilitada em toda tabela desde a criacao. As policies
-- (quem pode ler/escrever o proprio perfil, bloqueio do papel
-- verificador em insert publico - RN-01, CA-01.3) sao adicionadas na
-- Fase 2 (T12), junto com o fluxo de autenticacao que as exercita.
alter table public.profiles enable row level security;
