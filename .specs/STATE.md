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
- **Phase / Task**: Fases 1 a 4 **completas e commitadas** — T1 a T24 ✅. Próxima: Fase 5 (Verificação e selo, M3, T25–T30).
- **Completed**: T1–T6 (Fase 1), T7–T12 (Fase 2), T13–T17 (Fase 3), T18–T24 (Fase 4 — as 5 partes do cadastro do produtor, revisão e envio). Últimos commits: `bca8381`..`(T24)` na branch de trabalho deste worktree (`worktree-agent-a8bc6b32fee916751`, aberta a partir da ponta de `feature/website-mvp` em `f59322e`) — fazer merge/rebase para `feature/website-mvp` antes de continuar a Fase 5.
- **In-progress**: nenhuma — próxima task a iniciar é T25 (migração `verifications` e RLS de visibilidade de `businesses`).
- **Next step**: Executar a Fase 5 (T25–T30): fila de verificação, tela de análise, notas A/S/G, selo, suspensão/reativação e cron de expiração do selo. T25 é bloqueante para tudo depois: só a partir dela `businesses`/`business_revisions`/`evidences`/`certifications` ganham RLS de verdade — até lá, toda Server Action que mexe nessas tabelas continua usando `createAdminClient()` + checagem manual de posse (ver padrão abaixo).
- **Blockers**: nenhum para continuar o código. `[storage] enabled = false` em `supabase/config.toml` segue assim — testado de novo no T22 (`supabase stop && supabase start` com `enabled = true` trava em `HealthCheckTimeoutError` neste ambiente). O upload real de fotos (T22) e a Parte 4 do e2e completo (T24) usam esse gap documentado: testes unitários de compressão/validação cobrem o Done-when de T22 sem Storage; o e2e ponta a ponta do T24 insere evidências direto via REST em vez de um upload real. Reavaliar quando o ambiente permitir `supabase_storage_web` saudável. `web/.env.local` (gitignored) precisa existir com as credenciais do Supabase local — valores em `.env.local.example`, obtidos via `supabase status -o env`.
- **Padrão recorrente a manter**: `businesses`/`business_revisions`/`evidences`/`certifications`/`partners` ainda não têm RLS (só `enable row level security` sem policies, chegam no T25) — Server Actions que leem/escrevem essas tabelas usam `createAdminClient()` e conferem a posse manualmente (ex.: `saveDraftPart`, `submitBusiness`, `getActiveBusinessForOwner`), seguindo o mesmo padrão usado em `profiles` antes do T12.
- **Novo padrão desta fase**: os Server Actions do React 19 resetam inputs **não controlados** de um `<form action=...>` após qualquer submissão (sucesso ou erro) — todo formulário de múltiplos campos com validação server-side que pode retornar erro sem redirecionar (Parte 1 a 5 do cadastro) usa `useState` controlado por campo, inicializado do rascunho, em vez de `defaultValue`/`defaultChecked`. Manter esse padrão em qualquer formulário novo com a mesma forma (ex.: telas de verificação, T27).
- **Uncommitted files**: nenhum
- **Branch**: `worktree-agent-a8bc6b32fee916751` (worktree isolado; fazer merge/rebase para `feature/website-mvp` antes de prosseguir)
