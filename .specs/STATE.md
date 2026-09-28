# STATE

## Decisions

### AD-001
- **Decision**: Estrutura de rotas do App Router organizada por route group de perfil (`(marketing)`, `(investor)`, `(producer)`, `(verifier)`) em vez de por camada técnica.
- **Reason**: Os 4 perfis da PRD têm rotas, permissões (RLS) e layouts (mobile vs. desktop) inteiramente distintos; separar por perfil espelha a numeração de telas já existente (COM/INV/PRO) e deixa os guards de acesso óbvios por pasta.
- **Trade-off**: Componentes realmente compartilhados entre perfis (ex.: `BusinessCard`) precisam viver fora dos route groups, em `components/`.
- **Scope**: Toda a árvore `app/` do website-mvp e de qualquer feature futura que adicione tela nova.
- **Date**: 2026-09-27
- **Status**: active

### AD-002
- **Decision**: O cadastro offline do produtor usa um service worker mínimo + IndexedDB (`idb`), escopado só às rotas `/produtor/cadastro/*`, com sincronização manual quando `navigator.onLine`.
- **Reason**: RNF-01/RN-07 exigem que só essas 5 telas funcionem sem internet; um PWA cobrindo o app inteiro (`next-pwa`) cachearia rotas que não precisam (vitrine, verificação) e complicaria invalidação de cache em produção.
- **Trade-off**: Mais código próprio para manter (fila de sync, versionamento do rascunho) em vez de depender de uma lib pronta.
- **Scope**: Módulo M2 (cadastro do produtor) e qualquer fluxo offline futuro que reutilize o mesmo padrão.
- **Date**: 2026-09-27
- **Status**: active

### AD-003
- **Decision**: O cálculo de alinhamento investidor↔negócio (RN-24) vive em uma função pura server-side (`lib/matching/score.ts`), nunca no client.
- **Reason**: Mantém a fórmula de pontuação auditável e testável isoladamente (RNF-12) sem vazar os pesos/critérios no bundle do cliente, e evita duplicar a lógica entre a tela de resultados e testes.
- **Trade-off**: Toda mudança na fórmula exige round-trip ao servidor em vez de recalcular localmente; aceitável dado o volume baixo de negócios no piloto.
- **Scope**: Módulo M4 (descoberta e vitrine) e qualquer feature futura que reordene ou pontue negócios.
- **Date**: 2026-09-27
- **Status**: active

### AD-004
- **Decision**: Autenticação via `@supabase/ssr` + middleware do Next.js, sem biblioteca de auth adicional (NextAuth, Clerk, etc.).
- **Reason**: Supabase Auth OTP já resolve a entrada sem senha (RN-02) end-to-end; adicionar outra camada de auth duplicaria sessão/cookies sem necessidade.
- **Trade-off**: Se um dia for preciso um provedor de identidade externo (SSO corporativo, por exemplo), a migração exige revisar toda a integração de sessão.
- **Scope**: Todo o app — qualquer rota privada usa esse mesmo mecanismo.
- **Date**: 2026-09-27
- **Status**: active

### AD-005
- **Decision**: Autorização por perfil é feita em dupla barreira: RLS no Postgres como fonte da verdade + guard no middleware do Next.js só para UX (evitar round-trip desnecessário até o banco negar).
- **Reason**: RNF-04 exige RLS em toda tabela; o middleware sozinho não é suficiente porque pode ser contornado por chamada direta à API/Supabase.
- **Trade-off**: Toda regra de visibilidade precisa ser escrita duas vezes (policy SQL + mapa de rotas no middleware); risco de as duas divergirem se não revisadas juntas.
- **Scope**: Toda tabela e toda rota privada do website-mvp.
- **Date**: 2026-09-27
- **Status**: active

### AD-006
- **Decision**: UI kit é Tailwind CSS + shadcn/ui, com os tokens visuais da PRD §6.4 (cor, tipografia, breakpoints) portados 1:1 para `tailwind.config.ts`.
- **Reason**: Já definido na PRD §7.2 antes deste planejamento; portar os tokens em vez de redescobri-los evita reabrir uma decisão de design já aprovada no protótipo do pitch.
- **Trade-off**: Nenhum além do lock-in usual em Tailwind/shadcn.
- **Scope**: Todo componente visual do website-mvp.
- **Date**: 2026-09-27
- **Status**: active

### AD-007
- **Decision**: URLs assinadas de documentos sensíveis (Supabase Storage) são geradas sob demanda, no momento da visualização, com TTL de 5 minutos — nunca pré-geradas ou cacheadas.
- **Reason**: RN-34 exige uma janela curta de validade; gerar só na abertura evita que uma URL válida fique exposta em algum lugar (log, cache, histórico) antes do uso real.
- **Trade-off**: Cada abertura de documento custa uma chamada extra ao Storage antes de renderizar; aceitável dado o volume de documentos sensíveis por negócio.
- **Scope**: Módulo M5 (página do negócio e documentos) e qualquer arquivo sensível futuro servido por URL assinada.
- **Date**: 2026-09-27
- **Status**: active

### AD-008
- **Decision**: O código do Next.js mora em `/web` na raiz do repositório, não na raiz do repositório diretamente. Todo caminho `Where` em `tasks.md` (ex.: `package.json`, `app/`, `lib/`, `tailwind.config.ts`) é relativo a `web/` — ou seja, `package.json` significa `web/package.json`. Os comandos de gate (`npm run test`, etc.) rodam com `cwd=web/`.
- **Reason**: Pedido explícito do usuário ao iniciar a Fase 1: isolar o código da aplicação da documentação de planejamento que já ocupa a raiz do repositório (`mvp/`, `atividades/`, `.specs/`).
- **Trade-off**: Nenhum caminho em `tasks.md` foi reescrito com o prefixo `web/` para não gerar uma edição em massa fora do escopo da Fase 1; toda fase futura precisa lembrar dessa convenção ao interpretar os campos `Where`.
- **Scope**: Toda a feature website-mvp (as 12 fases de `tasks.md`).
- **Date**: 2026-09-27
- **Status**: active

## Handoff

- **Feature**: website-mvp (`.specs/features/website-mvp/`)
- **Phase / Task**: Fases 1 a 8 **completas e commitadas** — T1 a T44 ✅. Próxima: Fase 9 (Interesse e conexão, M6), T45–T49.
- **Completed**: T1–T6 (Fase 1), T7–T12 (Fase 2), T13–T17 (Fase 3), T18–T24 (Fase 4), T25–T30 (Fase 5 — verificação e selo), T31–T38 (Fase 6+7 — matching e vitrine), T39–T44 (Fase 8 — migração `documents`/`document_requests`/`document_views`/`profile_visits` com RLS real, página `/negocios/[slug]` com abas públicas/privadas, aba Documentos com pedido de acesso, visualizador controlado com marca d'água e URL assinada, painel `/produtor/pedidos` (liberar/recusar/retirar), upload de documentos adicionais). Commits na `feature/website-mvp`: `947d51c`..`8bed835` (merge fast-forward do worktree do Lote 4, em cima de `5ff3e3f`). Gate completo (lint, build, typecheck, 184 unit, 54 e2e) verde no checkout principal — `db reset` + `stop`/`start` completos rodados antes do e2e, suite e2e reconfirmada 2x.
- **In-progress**: nenhuma — próxima task a iniciar é T45 (migração `interests`/`connection_events`).
- **Next step**: Executar Fase 9 (T45–T49): tabela `interests`, fluxo de interesse do investidor, conexão/aceite da produtora, e a integração real de `lib/business/interest-sum.ts` (T38) com a tabela agora existente — depois Fase 10 (painéis).
- **Blockers**: nenhum para continuar o código. `[storage] enabled = false` em `supabase/config.toml` segue assim (retestado até o T42/T44, mesmo `HealthCheckTimeoutError`/503 neste ambiente) — reavaliar quando o ambiente permitir `supabase_storage_web` saudável.
- **Débito técnico sinalizado pelo Lote 3 (T33)**: lista de impactos do produtor (`web/lib/business/impact-options.ts`) diverge da lista de RN-22 usada na pergunta 5 do investidor (`web/app/(investor)/descobrir/questions-data.ts`) — reduz a interseção real do critério de alinhamento (RN-24, peso 15). Não bloqueia fases seguintes.
- **Gap de Storage confirmado de novo no Lote 4 (T42/T44)**: `createSignedUrl` retorna 503 "name resolution failed" com Storage desabilitado. CA-34.1 (marca d'água, sem download) e CA-35.1 (grava `document_views`) são testados via e2e normalmente; CA-34.2 (URL expira após 5min) só tem cobertura unitária com client de Storage mockado — validação end-to-end real fica pendente até o ambiente permitir Storage saudável. T44 usa a mesma estratégia do T22: e2e insere a linha em `documents` via REST em vez de exercitar upload real.
- **`interest-sum.ts` (T38) ainda roda contra schema mínimo** — a tabela `interests` real só chega no T45; a lateral de `/negocios/[slug]` (T40) hoje sempre soma `[]`. Ajustar a integração real quando T45 estiver pronto (a própria task já antecipa isso).
- **Padrão recorrente a manter**: `businesses`, `investor_answers`, `documents`/`document_requests`/`document_views`/`profile_visits` já têm RLS real e específica por tabela — `business_revisions`/`evidences`/`certifications`/`partners` continuam via `createAdminClient()` + checagem manual de posse (não migradas). Tabela nova com regra de visibilidade simples ganha RLS real direto na migração (feito em `investor_answers` e em toda a Fase 8); reavaliar caso a caso se a regra for complexa. Server Actions do React 19 resetam inputs **não controlados** de `<form action=...>` após qualquer submissão — formulários com erro sem redirect usam `useState` controlado por campo.
- **Gotcha permanente de e2e (achado 2x, sempre reaplicar)**: `GET /auth/v1/admin/users?email=<x>` do GoTrue local **ignora o filtro `email=`** e devolve a página 1 inteira (50 usuários) sem filtrar — qualquer helper que faça `users[0]` pega o usuário errado. Fix: pedir `?per_page=1000` e filtrar por `email` exato no client. Fonte canônica: `web/e2e/helpers/db.ts`'s `getUserIdByEmail` — todo helper novo de e2e deve reusar essa função em vez de duplicar a chamada.
- **Gotcha de ambiente**: `npx supabase db reset` sozinho pode deixar o Kong servindo uma rota velha/inalcançável para o template customizado `magic_link.html`, quebrando silenciosamente o envio de OTP local — se o e2e parar de achar código no Mailpit sem motivo aparente, rodar `supabase stop && supabase start` completo em vez de só `db reset`.
- **Uncommitted files**: nenhum
- **Branch**: `feature/website-mvp` (worktree do Lote 4 já mergeado via fast-forward e removido)
