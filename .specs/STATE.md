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
- **Phase / Task**: Fases 1 a 5 **completas e commitadas** — T1 a T30 ✅. Próxima: Fase 6 (Motor de alinhamento) + Fase 7 (Descoberta guiada e vitrine), T31–T38.
- **Completed**: T1–T6 (Fase 1), T7–T12 (Fase 2), T13–T17 (Fase 3), T18–T24 (Fase 4), T25–T30 (Fase 5 — migração `verifications`/RLS de `businesses`, fila de verificação, tela de análise com checklist, notas A/S/G e selo Verificado Îasy por 12 meses, suspensão/reativação com histórico, cron de expiração do selo). Commits na `feature/website-mvp`: `2499da6`..`0db6838` (merge fast-forward do worktree do Lote 2). Gate completo (lint, build, typecheck, 138 unit, 34 e2e) rodado e verde no checkout principal após o merge.
- **In-progress**: nenhuma — próxima task a iniciar é T31 (motor de alinhamento investidor↔negócio, `lib/matching/score.ts`, AD-003).
- **Next step**: Executar Fase 6+7 (T31–T38): score de alinhamento, telas de descoberta guiada (`/descobrir/*`) e vitrine de negócios verificados.
- **Blockers**: nenhum para continuar o código. `[storage] enabled = false` em `supabase/config.toml` segue assim (retestado até o T22, trava em `HealthCheckTimeoutError` neste ambiente) — reavaliar quando o ambiente permitir `supabase_storage_web` saudável. `web/.env.local` (gitignored) precisa existir com as credenciais do Supabase local — valores em `.env.local.example`, obtidos via `supabase status -o env`.
- **Padrão recorrente a manter**: `businesses`/`business_revisions`/`evidences`/`certifications`/`partners` já têm RLS de verdade a partir do T25 (visibilidade: dono sempre vê o próprio negócio, verificador vê qualquer status, público só vê `verificado`) — mas `business_revisions`/`evidences`/`certifications`/`partners` continuam via `createAdminClient()` + checagem manual de posse (RLS dessas tabelas ainda não migrada; revisar caso uma fase futura precise). Server Actions do React 19 resetam inputs **não controlados** de um `<form action=...>` após qualquer submissão — todo formulário com validação server-side que pode retornar erro sem redirecionar usa `useState` controlado por campo (padrão confirmado de novo nas telas de verificação, T27/T29).
- **Gotcha permanente de e2e (achado 2x, sempre reaplicar)**: `GET /auth/v1/admin/users?email=<x>` do GoTrue local **ignora o filtro `email=`** e devolve a página 1 inteira (50 usuários) sem filtrar — qualquer helper que faça `users[0]` pega o usuário errado. Fix: pedir `?per_page=1000` e filtrar por `email` exato no client. Fonte canônica: `web/e2e/helpers/db.ts`'s `getUserIdByEmail` — todo helper novo de e2e deve reusar essa função em vez de duplicar a chamada.
- **Gotcha de ambiente**: `npx supabase db reset` sozinho pode deixar o Kong servindo uma rota velha/inalcançável para o template customizado `magic_link.html`, quebrando silenciosamente o envio de OTP local — se o e2e parar de achar código no Mailpit sem motivo aparente, rodar `supabase stop && supabase start` completo em vez de só `db reset`.
- **Uncommitted files**: nenhum
- **Branch**: `feature/website-mvp` (worktree do Lote 2 já mergeado via fast-forward e removido)
