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
- **Phase / Task**: Fases 1 e 2 **completas e commitadas** — T1 a T12 ✅. Próxima: Fase 3 (Cadastro do produtor — dados e rascunho offline, T13–T17).
- **Completed**: T1–T6 (Fase 1) e T7–T12 (Fase 2). Últimos commits: `019de9d` (T11), `5e26488` (T12), branch `feature/website-mvp` (a app criou essa branch de sessão automaticamente; `main` local parou em `3f8a76f`/T4).
- **In-progress**: nenhuma — próxima task a iniciar é T13 (migração `businesses`, `business_revisions`, `evidences`, `certifications`, `partners`).
- **Next step**: Executar a Fase 3 (T13–T17): schema de negócios, máquina de estados (`lib/business/state-machine.ts`), rascunho offline (IndexedDB) e o service worker escopado ao cadastro.
- **Blockers**: nenhum. `supabase start`/`db reset`/`test db`/e2e funcionam localmente com `[storage] enabled = false` em `supabase/config.toml` (reabilitar antes do T22). `web/.env.local` (gitignored) precisa existir com as credenciais do Supabase local para os e2e rodarem — valores documentados em `.env.local.example` e obtidos via `supabase status -o env`. Questões jurídicas/parceiro seguem como Assumptions em `spec.md`, sem bloquear o código.
- **Uncommitted files**: nenhum
- **Branch**: feature/website-mvp
