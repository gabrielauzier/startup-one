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
- **Phase / Task**: T1 a T60 ✅ (as 60 tasks da feature) + **Rodada 1 de fix tasks do Verifier ✅** (Fix 1-5, 7). Verificação está em ciclo fix→re-verify (skill limita a 3 iterações) — **rodada 1 terminou FAIL, correções aplicadas, rodada 2 do Verifier acabou de ser despachada**.
- **Completed**: T1–T6 (Fase 1) ... T57–T60 (Fase 12, fecha as 60 tasks — ver histórico completo nas entradas anteriores deste arquivo/`git log`). **Verifier rodada 1** (após T60): FAIL — 59/77 ACs batiam com o spec, 15 gaps, sensor de mutação 8/13 mortos. Relatório em `.specs/features/website-mvp/validation.md`, commit `4edf8c6`. **Fix tasks rodada 1** (commits `d2aab22`..`a3e5c46`): Fix1 (Blocker — rascunho offline ligado à UI via `useDraftSync`, `lib/offline/use-draft-sync.ts`), Fix2 (OTP 60min→10min), Fix3 (ajuste por campo com comentário, `itens_ajuste` virou `jsonb`, migração `0010`), Fix4 (CNPJ duplicado bloqueado com mensagem clara, `lib/business/cnpj-uniqueness.ts`), Fix5 (3 avisos ligados: rascunho expirando, selo expirando, suspensão — 4 `NotificationType` novos, migração `0011`), Fix7 (testes fortalecidos matam M1/M5/M6/M10/M11/M13 do sensor). Deixados como débito técnico (não corrigidos nesta rodada, por decisão do usuário): Fix6 (CA-11.2, parceiro indicador visível ao verificador), Fix8 (comportamentos sem teste: foco em campo inválido, ordem da fila, etc.), Fix9 (higiene de gate: ordem typecheck/build já corrigida por nós ao rodar o gate — `lint && build && typecheck && test` —, mas `perf-producer.spec.ts` seguia reportando `JS=0KB` vazio e o checkbox de `tasks.md:1226` ainda não foi marcado). Gate completo (lint, build, typecheck, 239 unit, 99 e2e) verde no checkout principal após o merge da rodada 1, e2e reconfirmado 2x.
- **In-progress**: Verifier rodada 2 despachado (sub-agente fresco, author≠verifier de novo) — aguardando resultado. Se PASS, a feature fecha; se FAIL, rodada 2 de fix tasks (última permitida antes de escalar ao usuário, per o limite de 3 do skill).
- **Next step**: Aguardar veredito da rodada 2 do Verifier. Se PASS: feature website-mvp fechada, oferecer ao usuário rodar `git push`/abrir PR (fora do blast radius já autorizado, precisa de go-ahead explícito). Se FAIL: rotear os novos gaps como fix tasks rodada 2, aplicar, re-verificar rodada 3 (última).
- **Blockers**: nenhum para continuar o código. `[storage] enabled = false` em `supabase/config.toml` segue assim — reavaliar quando o ambiente permitir `supabase_storage_web` saudável. **Disco do Mac esteve crítico durante a rodada 1 do Verifier** (~650MB livres, quase 0) — liberado pelo usuário para ~5GB, caiu para ~3GB livres depois da rodada 1 de fixes (builds/node_modules/playwright acumulam). Monitorar `df -h /` antes de qualquer lote pesado novo; não tentar limpar disco por conta própria.
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
