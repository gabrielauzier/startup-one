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

### AD-009
- **Decision**: Login por e-mail+senha, magic link e reset de senha por OTP via Supabase Auth; links de e-mail são verificados por `token_hash` em `/auth/confirm` (não PKCE); o perfil é criado por trigger em `auth.users`. Substitui a RN-02 do MVP (entrada sem senha); AD-004 (Supabase Auth + `@supabase/ssr`) permanece.
- **Reason**: O link precisa funcionar em outro aparelho/navegador (produtor pede no celular, abre em outro), e todo caminho de entrada precisa produzir o mesmo perfil (G3).
- **Trade-off**: Templates de e-mail próprios e dependência do `{{ .TokenHash }}`/`{{ .RedirectTo }}` do GoTrue; trigger no schema `auth` precisa de teste SQL.
- **Scope**: Todo fluxo de autenticação (feature login-e-reset-de-senha e futuros).
- **Date**: 2026-10-02
- **Status**: active

### AD-010
- **Decision**: Nenhum dado pessoal em query string nos fluxos de auth; o e-mail entre telas viaja em cookie httpOnly assinado (`iasy_auth_ctx`, 15 min); o envio de e-mail de auth (cadastro, magic link, reset) é limitado por `auth_throttle` (60 s e 3/hora por e-mail e tipo).
- **Reason**: Evitar PII em histórico/logs e permitir teto de reenvio que o GoTrue não oferece, inclusive para e-mail inexistente.
- **Trade-off**: Exige segredo `AUTH_COOKIE_SECRET` por ambiente e uma tabela interna com RLS sem policy.
- **Scope**: Telas e actions de cadastro, magic link e reset.
- **Date**: 2026-10-02
- **Status**: active

## Handoff

- **Feature**: login-e-reset-de-senha (`.specs/features/login-e-reset-de-senha/`)
- **Phase / Task**: T1 a T43 ✅ + 2 rodadas de correção do Verifier. Verificação final **PASS com ressalvas** (HEAD `aa1a0fb`): lint, typecheck, 548 unit, 194 e2e verdes; sensor 31/31 mutações mortas.
- **In-progress**: nenhuma.
- **Next step**: (1) o dono do produto confirma as emendas da spec que baixam a régua (AUTH-10.1, AUTH-12.3, AUTH-12.4, D9) e a decisão D7 (CTAs da home inalterados); (2) configurar SMTP, templates, rate limits e `AUTH_COOKIE_SECRET` por ambiente conforme `DEPLOY.md` §1.4 antes de qualquer deploy; (3) `git push` e PR só com go-ahead explícito.
- **Blockers**: nenhum no código. `sendEmail` ainda é stub (aviso de cadastro duplicado não chega em produção, DEPLOY.md §0.2).
- **Branch**: `claude/prd-login-reset-senha-87c5db`. Nada foi enviado ao remoto.
