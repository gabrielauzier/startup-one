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
- **Phase / Task**: Fases 1 a 12 **completas e commitadas** — T1 a T60 ✅, **toda a feature website-mvp implementada**. Falta só o Verifier (sempre-on do skill `tlc-spec-driven`), que roda depois de T60.
- **Completed**: T1–T6 (Fase 1), T7–T12 (Fase 2), T13–T17 (Fase 3), T18–T24 (Fase 4), T25–T30 (Fase 5 — verificação e selo), T31–T38 (Fase 6+7 — matching e vitrine), T39–T44 (Fase 8 — negócio e documentos), T45–T52 (Fase 9+10 — interesse, conexão e painéis), T53–T56 (Fase 11 — avisos, cron diário, eventos de produto), T57–T60 (Fase 12 — `e2e/rls-full.spec.ts` (5 tabelas sensíveis), `ConnectionFooter` completado nas 5 telas que faltavam + `e2e/no-forbidden-terms.spec.ts` (8 rotas), 5 specs de fluxo ponta a ponta (`flow-cadastro`/`flow-verificacao`/`flow-vitrine`/`flow-documento`/`flow-interesse`), auditoria de a11y (`@axe-core/playwright`, corrigiu contraste real de `--muted-foreground`) e perf (`playwright-lighthouse`, funcionou de verdade neste ambiente) do produtor/investidor). Commits na `feature/website-mvp`: `30e8741`..`ddcb311` (Lote 7, merge fast-forward em cima de `681087b`). Gate completo (lint, build, typecheck, 221 unit, 96 e2e) verde no checkout principal, e2e reconfirmado 2x consecutivas sem falha.
- **In-progress**: nenhuma — todas as 60 tasks da feature estão `[x]` em `tasks.md`.
- **Next step**: Rodar o Verifier (author ≠ verifier, sub-agente fresco) — outcome check spec-anchored + sensor de discriminação (mutation testing em scratch) + `.specs/features/website-mvp/validation.md`. É o único passo que falta para fechar a feature de ponta a ponta.
- **Blockers**: nenhum para continuar o código. `[storage] enabled = false` em `supabase/config.toml` segue assim — reavaliar quando o ambiente permitir `supabase_storage_web` saudável.
- **Débito técnico sinalizado pelo Lote 3 (T33)**: lista de impactos do produtor (`web/lib/business/impact-options.ts`) diverge da lista de RN-22 usada na pergunta 5 do investidor (`web/app/(investor)/descobrir/questions-data.ts`) — reduz a interseção real do critério de alinhamento (RN-24, peso 15).
- **Gap de Storage confirmado de novo no Lote 4 (T42/T44)**: `createSignedUrl` retorna 503 "name resolution failed" com Storage desabilitado. CA-34.1/CA-35.1 são testados via e2e normalmente; CA-34.2 (URL expira após 5min) só tem cobertura unitária com client de Storage mockado.
- **Aproximações do Lote 6 (T56)**: `conexao_em_negociacao` é gravado no mesmo ponto de `apresentacao_parceiro` (`presentToPartner`) porque a etapa formal `em_negociacao` de `connection_events` não tem Server Action própria neste MVP; `descoberta_concluida` usa o gate `isComplete()` já existente (4 perguntas obrigatórias, a 5ª é opcional) em vez de exigir as 5 respondidas.
- **Padrão recorrente a manter**: `businesses`, `investor_answers`, `documents`/`document_requests`/`document_views`/`profile_visits`, `interests`/`connection_events` já têm RLS real e específica por tabela, agora com cobertura explícita e consolidada em `e2e/rls-full.spec.ts` (T57) — `business_revisions`/`evidences`/`certifications`/`partners` continuam via `createAdminClient()` + checagem manual de posse (decisão consciente do T57, fora do escopo explícito da task, não migradas). Server Actions do React 19 resetam inputs **não controlados** de `<form action=...>` após qualquer submissão — formulários com erro sem redirect usam `useState` controlado por campo.
- **Gotcha de ambiente — novo, achado no Lote 7**: depois de horas de uso pesado nesta mesma sessão (dezenas de `supabase stop/start`, centenas de logins e2e), o **Docker Desktop em si travou** (`docker ps` retornava 500 do socket, não um erro do Supabase) — diferente do blip de rede transitório já documentado abaixo. Sintoma: e2e falha em massa com `ECONNREFUSED 127.0.0.1:54321` bem no início de cada teste (não um timeout de login no meio do fluxo). Fix: `pkill -9 -f "Docker Desktop"` + `open -a Docker`, esperar `docker version` responder, depois `supabase start` de novo. Se isso acontecer de novo numa sessão muito longa, é o primeiro lugar a checar antes de suspeitar de regressão de código.
- **Gotcha permanente de e2e (achado 2x, sempre reaplicar)**: `GET /auth/v1/admin/users?email=<x>` do GoTrue local **ignora o filtro `email=`** e devolve a página 1 inteira sem filtrar — qualquer helper que faça `users[0]` pega o usuário errado. Fix: pedir `?per_page=1000` e filtrar por `email` exato no client. Fonte canônica: `web/e2e/helpers/db.ts`'s `getUserIdByEmail`, que agora também faz retry curto (até 2s) — sob carga pesada (muitos workers + centenas de signups acumulados na hora), o admin/users local pode falhar transitoriamente.
- **Gotcha de ambiente — Kong/OTP**: `npx supabase db reset` sozinho pode deixar o Kong servindo uma rota velha para o template `magic_link.html`, quebrando o envio de OTP local — se o e2e parar de achar código no Mailpit sem motivo aparente, rodar `supabase stop && supabase start` completo em vez de só `db reset`.
- **Gotcha de ambiente — rate limits de Auth local**: `supabase/config.toml`'s `[auth.rate_limit]` (`email_sent`, `sign_in_sign_ups`, `token_verifications`) veio nos padrões baixos do CLI (2/hora, 30/5min, 30/5min) — insuficientes para o volume de logins OTP da suite e2e completa deste projeto rodada mais de uma vez seguida. Já elevados (1000) neste repo; se algum ambiente novo resetar `config.toml`, reaplicar e rodar `supabase stop && start`.
- **Gotcha de ambiente — exaustão transitória de rede do Docker local**: rodar a suite e2e completa 3+ vezes seguidas sem pausa pode esgotar portas/conexões efêmeras do Docker Desktop neste Mac, causando `dial tcp ...: cannot assign requested address` nos logs do `supabase_auth_web` e falhas em cascata de login. Confirmado como blip transitório (não um bug de app) — se acontecer, aguardar um instante e rodar de novo; não é motivo para mexer em `playwright.config.ts` (retries/workers/timeout).
- **Uncommitted files**: nenhum
- **Branch**: `feature/website-mvp` (worktrees dos Lotes 4 a 7 já mergeados via fast-forward e removidos)
