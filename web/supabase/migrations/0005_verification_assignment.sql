-- RN-17/CA-17.1: quando um verificador abre um item da fila, ele fica
-- com esse verificador por 24 horas (lib/verification/assignment.ts).
-- Colunas simples em `businesses` em vez de tabela dedicada: e' um
-- estado 1:1 por negocio (nao um historico - o historico de decisoes
-- ja vive em `verifications`), sem necessidade de mais uma tabela.
alter table public.businesses
  add column assigned_to uuid references public.profiles (id),
  add column assigned_at timestamptz;
