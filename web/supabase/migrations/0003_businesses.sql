-- RN-11, RN-40: cooperativas/ONGs que indicam produtores, e parceiros
-- financeiros que formalizam o aporte.
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('financeiro', 'indicador')),
  email_contato text,
  ativo boolean not null default true
);

alter table public.partners enable row level security;

-- RN-05 a RN-21: negocio da bioeconomia amazonica cadastrado pelo produtor.
-- Um rascunho comeca so' com id/owner_id/status (T18, "Comecar cadastro")
-- e os demais campos abaixo sao preenchidos aos poucos pelas 5 partes do
-- cadastro (T17 grava cada parte em business_revisions; os campos aqui
-- se tornam obrigatorios de fato so' no envio final, RN-06/RF-12).
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  cnpj text,
  nome text,
  slug text unique,
  tipo_org text check (tipo_org in ('cooperativa', 'associacao', 'pequena_empresa')),
  cidade_ibge text,
  uf text,
  familias integer check (familias >= 0),
  anos_atividade integer check (anos_atividade >= 0),
  recebe_visitas boolean not null default false,
  indicado_por uuid references public.partners (id),
  produtos text[] not null default '{}',
  producao_mensal_kg numeric check (producao_mensal_kg > 0),
  praticas text[] not null default '{}',
  impactos text[] not null default '{}',
  finalidade text check (finalidade in ('obras', 'equipamentos', 'area', 'contas')),
  -- RN-10: R$50 mil a R$200 mil, em passos de R$5 mil (CA-10.1).
  valor_busca numeric check (
    valor_busca >= 50000
    and valor_busca <= 200000
    and valor_busca % 5000 = 0
  ),
  prazo_meses integer check (prazo_meses in (12, 18, 24, 36)),
  -- RN-10: 0% a 30%, uma casa decimal.
  retorno_proposto numeric(4, 1) check (retorno_proposto >= 0 and retorno_proposto <= 30),
  status public.business_status not null default 'rascunho',
  -- RN-19: notas inteiras de 0 a 100 (CA-19.1). Usa numeric + check de
  -- "sem casas decimais" em vez de integer: uma coluna integer arredonda
  -- silenciosamente um valor como 94.5 para 95 no INSERT, antes de
  -- qualquer CHECK rodar, e nunca rejeitaria a nota decimal.
  nota_a numeric check (nota_a between 0 and 100 and nota_a = trunc(nota_a)),
  nota_s numeric check (nota_s between 0 and 100 and nota_s = trunc(nota_s)),
  nota_g numeric check (nota_g between 0 and 100 and nota_g = trunc(nota_g)),
  verificado_em timestamptz,
  selo_valido_ate timestamptz,
  created_at timestamptz not null default now()
);

-- RN-05, CA-05.3: no maximo um negocio ativo (nao Reprovado/Expirado)
-- por CNPJ.
create unique index businesses_cnpj_ativo_idx
  on public.businesses (cnpj)
  where status not in ('reprovado', 'expirado');

alter table public.businesses enable row level security;

-- RN-15: nova versao de um negocio verificado, em analise ate ser aprovada.
create table public.business_revisions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  dados jsonb not null,
  status public.business_status not null,
  created_at timestamptz not null default now()
);

alter table public.business_revisions enable row level security;

-- RN-08, RN-09: fotos e documentos enviados pelo produtor pelo celular.
create table public.evidences (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  grupo text not null check (grupo in ('onde_produz', 'produto', 'terra', 'selo')),
  storage_path text not null,
  mime text not null,
  tamanho integer not null check (tamanho > 0),
  created_at timestamptz not null default now()
);

alter table public.evidences enable row level security;

-- RN-20: selos de certificadoras enviados pelo produtor, so' visiveis
-- depois de conferidos pela equipe.
create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  certificadora text not null,
  evidence_id uuid references public.evidences (id),
  conferido boolean not null default false,
  conferido_por uuid references public.profiles (id),
  conferido_em timestamptz
);

alter table public.certifications enable row level security;
