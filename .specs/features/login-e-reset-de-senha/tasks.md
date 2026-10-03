# Login com e-mail e senha, magic link e reset de senha — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

Regra do projeto (`web/AGENTS.md`): esta versão do Next.js tem mudanças incompatíveis. Antes de escrever código de route handler, `proxy`, server action ou `redirects()`, ler o guia correspondente em `web/node_modules/next/dist/docs/` (requer `npm ci` em `web/`).

---

**Design**: `.specs/features/login-e-reset-de-senha/design.md`
**Spec**: `.specs/features/login-e-reset-de-senha/spec.md`
**Status**: Draft
**Convenção de caminhos (AD-008)**: todo `Where` é relativo a `web/`; `../` sai de `web/`. Os gates rodam com `cwd=web/`.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `web/AGENTS.md` (só regras do Next.js, nenhuma de testes), `web/vitest.config.ts` (`jsdom`, `**/__tests__/**/*.test.{ts,tsx}`), `web/playwright.config.ts`, e `.specs/features/website-mvp/tasks.md` (matriz do MVP, usada como piso).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Funções puras de `lib/auth/*` | unit | Todas as branches; 1:1 com os ACs; todo edge case listado na spec | `lib/auth/__tests__/*.test.ts` | `npm run test` |
| Server actions e route handlers (`app/**/actions.ts`, `app/auth/confirm/route.ts`) | unit | Caminho feliz + toda validação e erro descritos nos ACs; mocks do Supabase no padrão de `entrar/__tests__/actions.test.ts` | `app/**/__tests__/*.test.ts` | `npm run test` |
| `proxy.ts` | unit | Cada regra de acesso (sem sessão, sem perfil, papel errado, recuperação, `/api`) | `__tests__/proxy.test.ts` | `npm run test` |
| Componentes com lógica (`SiteHeader`, `AppChrome`, navs, avisos) | unit | Cada condição de renderização dos ACs | `components/**/__tests__/*.test.tsx` | `npm run test` |
| Páginas e fluxos do App Router | e2e | Cada rota nova: caminho feliz + todo edge case + falhas (Mailpit para e-mails) | `e2e/*.spec.ts` | `npm run test:e2e` |
| Migrações SQL, RLS, trigger e funções | integration | Cada regra testada com papéis permitido e negado | `e2e/rls-*.spec.ts` | `npm run test:e2e` |
| `config.toml` e templates de e-mail | unit | Cada chave e placeholder exigidos pelo spec | `lib/auth/__tests__/*-config.test.ts`, `email-templates.test.ts` | `npm run test` |
| Documentação | none | - (build gate only) | - | build gate only |

## Gate Check Commands

> Generated from codebase (`web/package.json`) - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Após tasks só com testes unitários | `npm run test` |
| Full | Após tasks com e2e/integração (requer `supabase start` e Mailpit locais) | `npm run test && npm run test:e2e` |
| Build | Após fechar uma fase ou tasks só de documentação/config | `npm run lint && npm run build && npm run typecheck && npm run test` (nesta ordem; `typecheck` depende dos tipos gerados pelo `next build`) |

---

## Execution Plan

Phases rodam em sequência; tasks dentro de uma fase rodam em ordem. A Fase 3 já entrega valor sozinha (corrige G1, G3, G4, G7, G8). Fases 4 a 6 trocam a forma de entrar; a troca do helper de E2E (T26) precede a remoção do OTP (T27).

### Phase 1: Dados, configuração e contrato do GoTrue

Migrações, `config.toml`, templates e o teste de contrato que confirma as premissas do design sobre o GoTrue. Nenhuma mudança visível ao usuário.

```
T1 → T2 → T3 → T4 → T5 → T6
```

### Phase 2: Biblioteca de autenticação (funções puras e helpers)

Peças reutilizadas por todas as telas. Cada uma é testável isoladamente.

```
T7 → T8 → T9 → T10 → T11 → T12 → T13
```

### Phase 3: Guard, perfil, logout e chrome (entrega F1 da PRD)

Corrige G1, G3, G4, G7, G8 sem mudar a forma de entrar. Entrega valor sozinha.

```
T14 → T15 → T16 → T17 → T18 → T19 → T20
```

### Phase 4: Login por senha e magic link

Nova `/entrar`, `/auth/confirm`, `/entrar/link-enviado`, troca dos helpers E2E e remoção do login por OTP.

```
T21 → T22 → T23 → T24 → T25 → T26 → T27
```

### Phase 5: Cadastro e confirmação de e-mail

`/cadastro`, `/cadastro/confirmar-email` e os CTAs da home e do produtor.

```
T28 → T29 → T30 → T31 → T32 → T33
```

### Phase 6: Reset de senha por OTP

`/esqueci-senha`, `/esqueci-senha/codigo`, `/redefinir-senha`.

```
T34 → T35 → T36 → T37
```

### Phase 7: Fechamento (E2E transversais, a11y, produção e documentação)

Cobertura dos fluxos cruzados, rate limits e documentação.

```
T38 → T39 → T40 → T41 → T42 → T43
```

---

## Task Breakdown

### Phase 1: Dados, configuração e contrato do GoTrue

### T1: Migração do trigger de perfil

**What**: Criar `handle_new_user` e o trigger `on_auth_user_created` (role ausente não cria; role inválido, inclusive `verificador`, falha; role válido cria o perfil com `nome`).
**Where**: `supabase/migrations/0012_auth_profile_trigger.sql`
**Depends on**: None
**Reuses**: `0001_init.sql`, `0002_profiles_rls.sql` (enum `role`, policies)
**Requirement**: AUTH-11

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Migração aplica em `supabase db reset` sem erro e `seed.sql` continua carregando
- [x] Teste SQL/E2E: role `produtor` cria `profiles` com `nome` do metadado; sem `nome` usa o prefixo do e-mail
- [x] Teste: `role=verificador` e `role=xyz` falham o `auth.admin.createUser` e não deixam linha em `auth.users` nem em `profiles`
- [x] Teste: usuário sem `role` no metadado é criado sem `profiles`
- [x] Teste: `anon` e `authenticated` não executam `handle_new_user` diretamente
- [x] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: integration (`e2e/rls-auth-trigger.spec.ts`)
**Gate**: full
**Commit**: `feat(auth): migração do trigger de perfil`

---

### T2: Migração de `auth_throttle` e `email_account_status`

**What**: Criar a tabela `auth_throttle` (RLS sem policy) e a função `email_account_status(text)` restrita a `service_role`.
**Where**: `supabase/migrations/0013_auth_throttle.sql`
**Depends on**: T1
**Reuses**: `0009_events.sql` (padrão de tabela interna com RLS sem policy)
**Requirement**: AUTH-09, AUTH-03

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Migração aplica em `supabase db reset`
- [x] Teste: `anon` e `authenticated` não leem nem gravam `auth_throttle`; `service_role` sim
- [x] Teste: `email_account_status` devolve `none`, `unconfirmed` e `confirmed` para os três casos e é negada a `anon`/`authenticated`
- [x] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: integration (`e2e/rls-auth-throttle.spec.ts`)
**Gate**: full
**Commit**: `feat(auth): migração de `auth_throttle` e `email_account_status``

---

### T3: Migração dos tipos de evento de auth

**What**: Estender o CHECK de `events.type` com os 11 tipos `auth_*` e atualizar `ProductEventType` em `lib/analytics/track.ts`.
**Where**: `supabase/migrations/0014_events_auth_types.sql`
**Depends on**: T2
**Reuses**: `0009_events.sql`, `lib/analytics/track.ts`
**Requirement**: AUTH-15

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] CHECK aceita os 11 novos tipos e continua aceitando os 14 existentes
- [x] Teste: `trackEvent({ type: "auth_login_senha_ok", payload: {} })` grava `kind='produto'`; tipo inexistente é rejeitado pelo banco
- [x] `ProductEventType` espelha 1:1 o CHECK (teste de paridade lê o `.sql`)
- [x] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: unit + integration (`lib/analytics/__tests__/track.test.ts`, `e2e/avisos-eventos.spec.ts`)
**Gate**: full
**Commit**: `feat(auth): migração dos tipos de evento de auth`

---

### T4: Configuração de Auth no `config.toml`

**What**: Ajustar `enable_confirmations`, `minimum_password_length`, `password_requirements`, `max_frequency`, `additional_redirect_urls` e registrar os templates `confirmation`, `magic_link`, `recovery` e a notificação `password_changed`.
**Where**: `supabase/config.toml`
**Depends on**: T3
**Reuses**: `lib/auth/__tests__/otp-config.test.ts` (padrão de leitura do TOML)
**Requirement**: AUTH-02 (critério 16), AUTH-12

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] `enable_confirmations = true`, `minimum_password_length = 8`, `password_requirements = "letters_digits"` (`max_frequency = "60s"` fica para T27, ver Deviations)
- [x] `additional_redirect_urls` contém `http://127.0.0.1:3000/**`
- [x] (movido para T5: registro dos templates e da notificação, que dependem dos arquivos)
- [x] Teste novo `auth-config.test.ts` trava cada chave acima (e, em T5, os templates); `otp-config.test.ts` segue passando
- [x] Gate quick passa: `npm run test`

**Tests**: unit (`lib/auth/__tests__/auth-config.test.ts`)
**Gate**: quick
**Commit**: `feat(auth): configuração de Auth no `config.toml``

---

### T5: Templates de e-mail de Auth em pt-BR

**What**: Escrever `confirmation.html`, `magic_link.html` (só link), `recovery.html` (só código) e `password_changed.html`.
**Where**: `supabase/templates/`
**Depends on**: T4
**Reuses**: `supabase/templates/magic_link.html` (atual)
**Requirement**: AUTH-06 (critério 3), AUTH-08 (critério 2), AUTH-12, AUTH-14 (critério 15)

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] `confirmation.html` e `magic_link.html` usam `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=…&next={{ .RedirectTo }}` (ambos mantêm o código `{{ .Token }}` até T27, ver Deviations)
- [x] `recovery.html` contém `{{ .Token }}` e a validade de 10 minutos e **não** contém `{{ .ConfirmationURL }}`, `{{ .SiteURL }}` nem `href`
- [x] `password_changed.html` orienta o usuário caso não tenha sido ele
- [x] Teste de template lê os 4 arquivos e confere as regras acima
- [x] Gate quick passa: `npm run test`

**Tests**: unit (`lib/auth/__tests__/email-templates.test.ts`)
**Gate**: quick
**Commit**: `feat(auth): templates de e-mail de Auth em pt-BR`

---

### T6: Teste de contrato do GoTrue local

**What**: Verificar contra o Supabase local as premissas do design e anotar o resultado em `design.md` (seção "GoTrue verification").
**Where**: `e2e/auth-gotrue-contract.spec.ts`
**Depends on**: T5
**Reuses**: `e2e/helpers/db.ts` (admin client), Mailpit helper de `e2e/helpers/auth.ts`
**Requirement**: AUTH-03, AUTH-04, AUTH-06, AUTH-08, AUTH-14

**Tools**:

- MCP: `filesystem`, `context7`
- Skill: `supabase`

**Done when**:

- [x] Teste lê a documentação do Next em `node_modules/next/dist/docs/` para route handlers e `proxy` antes de qualquer código das fases seguintes (regra de `web/AGENTS.md`)
- [x] Confirma com asserções: `{{ .RedirectTo }}` chega no e-mail; `signUp` com e-mail existente e confirmação ligada não devolve erro; `signInWithOtp({shouldCreateUser:false})` com e-mail inexistente não cria usuário; `verifyOtp({email, token, type:"recovery"})` funciona; `updateUser` com a mesma senha devolve `error.code`; `signInWithPassword` sem confirmação devolve `email_not_confirmed`; rate limit devolve 429
- [x] Qualquer divergência ajusta o mapeamento descrito no design (não o spec) no mesmo commit
- [x] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: integration
**Gate**: full
**Commit**: `feat(auth): teste de contrato do GoTrue local`

---

### Phase 2: Biblioteca de autenticação (funções puras e helpers)

### T7: Normalização e hash de e-mail

**What**: Criar `normalizeEmail` e `hashEmail`.
**Where**: `lib/auth/email.ts`
**Depends on**: T6
**Reuses**: —
**Requirement**: AUTH-09

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] `normalizeEmail("  Foo@Bar.COM ")` devolve `foo@bar.com`
- [x] `hashEmail` é determinístico, hexadecimal de 64 caracteres e igual para variações de caixa/espaço
- [x] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): normalização e hash de e-mail`

---

### T8: Regra de senha compartilhada

**What**: Criar `validatePassword` e `passwordRequirementMessage`.
**Where**: `lib/auth/password.ts`
**Depends on**: T7
**Reuses**: —
**Requirement**: AUTH-02, AUTH-14

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Tabela de casos: 7 caracteres falha `min`; 73 falha `max`; sem número falha `digit`; sem letra falha `letter`; `abc12345` passa; 72 caracteres válidos passa
- [x] `passwordRequirementMessage` devolve texto pt-BR por requisito faltante
- [x] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): regra de senha compartilhada`

---

### T9: Redirect seguro e destino padrão do papel

**What**: Mover `redirect.ts` para `lib/auth/`, reescrever `isSafeRedirect`, criar `normalizeNext` e `roleHome`, e atualizar os imports.
**Where**: `lib/auth/redirect.ts`
**Depends on**: T8
**Reuses**: `app/(marketing)/entrar/redirect.ts` e seu teste `entrar/__tests__/redirect.test.ts`
**Requirement**: AUTH-01 (critérios 3, 4)

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] `isSafeRedirect` rejeita `//evil.com`, `/\evil.com`, `/%5Cevil.com`, `https://evil.com`, `/entrar`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha`, `/completar-perfil`, `/auth/x` e caracteres de controle; aceita `/negocios/abc?x=1`
- [x] `normalizeNext` aceita URL absoluta da mesma origem (devolve path+query), rejeita outra origem e usa o primeiro valor de lista
- [x] `roleHome` devolve `/verificacao`, `/produtor`, `/negocios`
- [x] Imports de `termos/actions.ts` e `entrar/actions.ts` atualizados; testes movidos para `lib/auth/__tests__/redirect.test.ts` com contagem igual ou maior que os anteriores
- [x] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): redirect seguro e destino padrão do papel`

---

### T10: Cookie de contexto de auth e flag de recuperação

**What**: Criar cookie httpOnly assinado `iasy_auth_ctx` e a flag `iasy_recovery`.
**Where**: `lib/auth/auth-context-cookie.ts`
**Depends on**: T9
**Reuses**: `lib/supabase/server.ts` (uso de `cookies()`)
**Requirement**: AUTH-08 (critério 4), AUTH-14 (critério 16), AUTH-10 (AD-010)

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] `readAuthContext` devolve o e-mail de um cookie válido e `null` para adulterado, expirado ou de outro `kind`
- [x] Cookie é `httpOnly`, `sameSite=lax`, 15 min e `secure` em produção
- [x] `hasRecoveryFlag` lê a flag do `NextRequest`; `clearRecoveryFlag` remove
- [x] Sem `AUTH_COOKIE_SECRET` em produção, assinar lança erro explícito
- [x] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): cookie de contexto de auth e flag de recuperação`

---

### T11: Throttle de envio de e-mail

**What**: Criar `checkAndRecordSend(email, kind)` com cooldown de 60 s e teto de 3/hora, limpando linhas antigas.
**Where**: `lib/auth/throttle.ts`
**Depends on**: T10
**Reuses**: `lib/supabase/admin.ts`
**Requirement**: AUTH-09

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Primeiro envio é permitido e grava linha
- [x] Segundo dentro de 60 s devolve `retryAfterSec` positivo
- [x] Quarto na mesma hora devolve bloqueio de teto
- [x] Chaves de `kind` e e-mail diferentes não interferem
- [x] Linhas com mais de 1 h são removidas na gravação
- [x] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): throttle de envio de e-mail`

---

### T12: Regra de acesso do produtor por rota

**What**: Alterar `ROUTE_ACCESS` para exigir sessão só em `/produtor/(cadastro|painel|pedidos|interesses)` e deixar `/produtor` público.
**Where**: `lib/auth/roles.ts`
**Depends on**: T11
**Reuses**: `lib/auth/__tests__/roles.test.ts`
**Requirement**: AUTH-17

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] `resolveAccess("/produtor", null)` permite; `/produtor/painel`, `/produtor/cadastro/1`, `/produtor/pedidos`, `/produtor/interesses` sem sessão devolvem `no-session`
- [x] Teste enumera as pastas de `app/(producer)/produtor` e falha se alguma não for `cadastro`, `painel`, `pedidos`, `interesses` ou `/` (fail-closed)
- [x] Testes existentes de `roles.test.ts` atualizados sem reduzir a contagem
- [x] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): regra de acesso do produtor por rota`

---

### T13: Destino pós-autenticação

**What**: Criar `resolvePostAuthDestination` com injeção de dependências (perfil, termos, migração de respostas, destino padrão).
**Where**: `lib/auth/post-auth.ts`
**Depends on**: T12
**Reuses**: `app/(marketing)/entrar/actions.ts` (sequência do `verifyOtp`), `migrateCookieAnswersToProfile`
**Requirement**: AUTH-01 (critérios 1 a 6, 8)

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Sem perfil devolve `/completar-perfil?redirect=…` (redirect só se seguro)
- [x] Investidor/empresa sem termos devolve `/termos?redirect=…` e migra as respostas antes
- [x] `redirect` seguro e permitido pelo papel é honrado; investidor com `/produtor/painel` e produtor com `/interesses` caem no padrão do papel
- [x] Produtor com negócio vai a `/produtor/painel`; sem negócio, `/produtor`; verificador a `/verificacao`
- [x] Investidor com respostas vai a `/negocios`; sem respostas, `/descobrir/1`
- [x] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): destino pós-autenticação`

---

### Phase 3: Guard, perfil, logout e chrome (entrega F1 da PRD)

### T14: Guard do `proxy`

**What**: Alterar `proxy.ts`: `getRole` devolve usuário e papel; perfil ausente vai a `/completar-perfil`; papel errado redireciona à `roleHome` com `?aviso=sem-permissao` (JSON 403 só em `/api/*`); flag de recuperação restringe a `/redefinir-senha`.
**Where**: `proxy.ts`
**Depends on**: T13
**Reuses**: `lib/auth/roles.ts`, `lib/auth/redirect.ts`, `lib/auth/auth-context-cookie.ts`
**Requirement**: AUTH-01 (7, 7a), AUTH-11 (8), AUTH-14 (16), AUTH-17 (12)

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Teste unitário do `proxy` (mock de `createServerClient`): sem sessão em rota privada redireciona a `/entrar?redirect=…`
- [x] Logado sem perfil em `/produtor/painel` e `/entrar` redireciona a `/completar-perfil`
- [x] Investidor em `/produtor/painel` redireciona a `/negocios?aviso=sem-permissao`; produtor em `/interesses` a `/produtor?aviso=sem-permissao`; `/api/x` restrita ainda responde 403 JSON
- [x] Com cookie `iasy_recovery`, `/negocios` redireciona a `/redefinir-senha` e `/redefinir-senha`, `/esqueci-senha/codigo`, `/auth/confirm` passam
- [x] Gate quick passa: `npm run test`

**Tests**: unit (`__tests__/proxy.test.ts`)
**Gate**: quick
**Commit**: `feat(auth): guard do `proxy``

---

### T15: Server action de logout

**What**: Criar `signOutAction` que encerra a sessão, limpa cookies de auth, registra `auth_logout` e redireciona a `/`.
**Where**: `lib/auth/sign-out.ts`
**Depends on**: T14
**Reuses**: `lib/supabase/server.ts`, `lib/analytics/track.ts`
**Requirement**: AUTH-16

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Chama `supabase.auth.signOut()` e `redirect("/")`
- [x] Remove `iasy_auth_ctx` e `iasy_recovery`
- [x] Falha em `trackEvent` não impede o logout
- [x] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): server action de logout`

---

### T16: "Sair" no `SiteHeader`

**What**: Trocar o link "Entrar" por um formulário "Sair" quando há papel.
**Where**: `components/shared/SiteHeader.tsx`
**Depends on**: T15
**Reuses**: `components/shared/SiteHeader.tsx`
**Requirement**: AUTH-16

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Com `role=null` o cabeçalho mostra link "Entrar" para `/entrar`; com qualquer papel mostra botão "Sair" e não mostra "Entrar"
- [x] Botão "Sair" submete `signOutAction`
- [x] Gate quick passa: `npm run test`

**Tests**: unit (`components/shared/__tests__/SiteHeader.test.tsx`)
**Gate**: quick
**Commit**: `feat(auth): "Sair" no `SiteHeader``

---

### T17: "Sair" na navegação inferior móvel

**What**: Adicionar o item "Sair" a `MobileBottomNav` quando há papel.
**Where**: `components/shared/MobileBottomNav.tsx`
**Depends on**: T16
**Reuses**: `components/shared/MobileBottomNav.tsx`
**Requirement**: AUTH-16

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Com papel, a barra mostra "Sair"; sem papel, não
- [x] Alvo de toque de ao menos 44 px (classe de altura/largura mínima)
- [x] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): "Sair" na navegação inferior móvel`

---

### T18: "Sair" na chrome do produtor

**What**: Adicionar o item "Sair" ao `BottomNav` do produtor.
**Where**: `components/producer/BottomNav.tsx`
**Depends on**: T17
**Reuses**: `components/producer/BottomNav.tsx`
**Requirement**: AUTH-16

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] `BottomNav` renderiza "Sair" que submete `signOutAction`
- [x] Itens existentes continuam renderizando (teste de snapshot de rótulos)
- [x] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): "Sair" na chrome do produtor`

---

### T19: Chrome mínimo de autenticação e faixa de aviso

**What**: Em `AppChrome`, renderizar `AuthChrome` (só logo com link para `/`) nas rotas de auth e exibir a faixa de `?aviso=sem-permissao` nas rotas com chrome.
**Where**: `components/shared/AppChrome.tsx`
**Depends on**: T18
**Reuses**: `components/shared/AppChrome.tsx` (`NO_CHROME_PATTERNS`)
**Requirement**: AUTH-05 (11), AUTH-01 (7a)

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] `/entrar`, `/cadastro`, `/esqueci-senha/codigo`, `/redefinir-senha`, `/completar-perfil`, `/auth/confirm` não renderizam `MobileBottomNav`, `FixedLegalBanner` nem `SiteHeader` completo, só o logo com link para `/`
- [x] `/negocios?aviso=sem-permissao` exibe a faixa e ela pode ser dispensada
- [x] `/produtor/*` e `/verificacao/*` continuam sem chrome
- [x] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): chrome mínimo de autenticação e faixa de aviso`

---

### T20: Tela "Complete seu perfil"

**What**: Criar `/completar-perfil` (escolha de perfil e nome) e a action que insere em `profiles` com o cliente do usuário.
**Where**: `app/(marketing)/completar-perfil/`
**Depends on**: T19
**Reuses**: `entrar-form.tsx` (grupo de perfis), `lib/auth/post-auth.ts`
**Requirement**: AUTH-11

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Action valida perfil (`investidor`, `empresa`, `produtor`) e nome de 2 a 80 caracteres; `verificador` forjado é recusado
- [x] Insere em `profiles` e redireciona via `resolvePostAuthDestination`
- [x] E2E: usuário criado sem `role` no metadado cai nesta tela ao abrir `/negocios` e, após enviar, chega ao destino do papel
- [x] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: unit + e2e (`e2e/completar-perfil.spec.ts`)
**Gate**: full
**Commit**: `feat(auth): tela "Complete seu perfil"`

---

### Phase 4: Login por senha e magic link

### T21: Route handler `/auth/confirm`

**What**: Trocar `token_hash` por sessão para `signup` e `email` e redirecionar pelo destino pós-autenticação.
**Where**: `app/auth/confirm/route.ts`
**Depends on**: T20
**Reuses**: `lib/auth/post-auth.ts`, `lib/auth/redirect.ts` (`normalizeNext`)
**Requirement**: AUTH-04, AUTH-07

**Tools**:

- MCP: `filesystem`, `context7`
- Skill: `supabase`

**Done when**:

- [x] Token válido `type=signup` ou `email` cria sessão e redireciona via `resolvePostAuthDestination`, com `next` honrado só se seguro e permitido
- [x] Token inválido, vencido ou usado redireciona a `/cadastro/confirmar-email?erro=expirado` (`signup`) ou `/entrar?erro=link-expirado` (`email`)
- [x] `type=recovery` ou desconhecido é tratado como inválido; `next` inseguro é ignorado
- [x] Registra `auth_email_confirmado` e `auth_magic_link_ok` sem PII
- [x] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: unit + e2e (`e2e/auth-confirm.spec.ts`: link aberto em contexto limpo)
**Gate**: full
**Commit**: `feat(auth): route handler `/auth/confirm``

---

### T22: Action `signInPassword`

**What**: Adicionar `signInPassword` com mapeamento de erros por `error.code` e destino pós-autenticação.
**Where**: `app/(marketing)/entrar/actions.ts`
**Depends on**: T21
**Reuses**: `sendOtp`/`verifyOtp` atuais (padrão de `useActionState`)
**Requirement**: AUTH-05 (2, 3, 4, 12, 13), AUTH-10

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Credenciais corretas autenticam e redirecionam via `resolvePostAuthDestination`
- [x] `invalid_credentials` (inclusive conta sem senha) devolve "E-mail ou senha incorretos." idêntica nos dois casos
- [x] `email_not_confirmed` devolve estado `unconfirmed`; 429 devolve "Muitas tentativas. Aguarde alguns minutos e tente de novo."
- [x] Registra `auth_login_senha_ok` e `auth_login_senha_erro` sem e-mail no payload
- [x] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): action `signInPassword``

---

### T23: Actions de magic link e reenvio de confirmação

**What**: Adicionar `requestMagicLink`, `resendMagicLink` e `resendConfirmation` com throttle e resposta neutra.
**Where**: `app/(marketing)/entrar/magic-link-actions.ts`
**Depends on**: T22
**Reuses**: `lib/auth/throttle.ts`, `lib/auth/auth-context-cookie.ts`
**Requirement**: AUTH-06, AUTH-07 (9), AUTH-09

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] `signInWithOtp` é chamado com `shouldCreateUser:false`; erro de e-mail inexistente é engolido e o resultado é idêntico
- [x] Cookie de contexto é gravado e o redirect vai a `/entrar/link-enviado`; e-mail não aparece na URL
- [x] Reenvio dentro de 60 s ou acima de 3/hora devolve a mensagem de espera/teto; falha de SMTP devolve "Não foi possível enviar o e-mail. Tente de novo." sem expor a mensagem interna
- [x] Registra `auth_magic_link_pedido`
- [x] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): actions de magic link e reenvio de confirmação`

---

### T24: Página e formulário `/entrar`

**What**: Reescrever `/entrar` com e-mail, senha, mostrar/ocultar, links e avisos de contexto; redirecionar usuário já logado.
**Where**: `app/(marketing)/entrar/`
**Depends on**: T23
**Reuses**: `components/ui/*`, `entrar-form.tsx` atual
**Requirement**: AUTH-05, AUTH-01 (9)

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Sem seleção de perfil; exibe e-mail, senha, "Mostrar", "Esqueci minha senha", "Receber link de acesso por e-mail", "Criar conta" e o texto para contas do MVP
- [x] Mostra "Entre para continuar" com `redirect`, o aviso de `sem-permissao`, de `senha-alterada` e de `link-expirado`
- [x] Erros em `role="alert"`, `aria-invalid`, foco no primeiro campo com erro, botão desabilitado ao enviar, `autocomplete` correto
- [x] Usuário logado com perfil é redirecionado ao destino do papel
- [x] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: unit + e2e (`e2e/entrar.spec.ts` reescrito)
**Gate**: full
**Commit**: `feat(auth): página e formulário `/entrar``

---

### T25: Página `/entrar/link-enviado`

**What**: Criar a tela com o e-mail do cookie de contexto e reenvio com cooldown visível.
**Where**: `app/(marketing)/entrar/link-enviado/page.tsx`
**Depends on**: T24
**Reuses**: `lib/auth/auth-context-cookie.ts`, `resendMagicLink`
**Requirement**: AUTH-06 (1, 2), AUTH-09

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Mostra o e-mail do cookie; sem cookie válido redireciona a `/entrar`
- [x] Botão "Reenviar" desabilitado por 60 s com contagem e mostra "Enviamos outro link"
- [x] Clique duplo no cooldown envia um só e-mail (E2E com Mailpit)
- [x] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: unit + e2e (`e2e/magic-link.spec.ts`: existente, inexistente, outro navegador, link usado duas vezes)
**Gate**: full
**Commit**: `feat(auth): página `/entrar/link-enviado``

---

### T26: Helpers E2E de login por senha

**What**: Reescrever `loginAsProducer`, `loginAsInvestor`, `loginAsVerifier` para criar o usuário por admin API (`email_confirm:true`, `user_metadata.role`) e entrar pelo formulário de senha; auditar todos os usos de login por OTP em `e2e/`.
**Where**: `e2e/helpers/auth.ts`
**Depends on**: T25
**Reuses**: `e2e/helpers/db.ts` (`createProfileWithAuth`, `promoteToVerifier`)
**Requirement**: AUTH-05

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Os três helpers mantêm assinatura e retorno (e-mail usado) e terminam na mesma URL de antes (`/produtor`, `/termos`→`/descobrir/1`, `/verificacao`)
- [x] Nenhum spec fora de `e2e/entrar*.spec.ts` e `e2e/auth-*.spec.ts` chama OTP ou lê código no Mailpit
- [x] `rls-*.spec.ts` e `loginViaApi` auditados
- [x] Suíte E2E completa passa
- [x] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: e2e (suíte completa)
**Gate**: full
**Commit**: `feat(auth): helpers E2E de login por senha`

---

### T27: Remover o login por OTP

**What**: Remover `sendOtp`, `verifyOtp`, `/entrar/codigo` e seus testes; adicionar redirect 308 de `/entrar/codigo` para `/entrar`.
**Where**: `next.config.ts`
**Depends on**: T26
**Reuses**: `app/(marketing)/entrar/codigo/`, `e2e/entrar-codigo.spec.ts`
**Requirement**: AUTH-05 (Assumption Q1)

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Pasta `entrar/codigo` e `e2e/entrar-codigo.spec.ts` removidas; `sendOtp`/`verifyOtp` removidos de `entrar/actions.ts` e de `entrar/__tests__/actions.test.ts`
- [x] `GET /entrar/codigo` responde 308 para `/entrar` (E2E)
- [x] Nenhuma referência restante a `sendOtp`, `verifyOtp` ou `/entrar/codigo` (`grep` vazio)
- [x] Gate build passa: `npm run lint && npm run build && npm run typecheck && npm run test`; E2E completo passa: `npm run test:e2e`

**Tests**: e2e (`e2e/entrar-redirect-legado.spec.ts`)
**Gate**: build
**Commit**: `feat(auth): remover o login por OTP`

---

### Phase 5: Cadastro e confirmação de e-mail

### T28: Action `signUpAction`

**What**: Criar a action de cadastro com validação, throttle, `email_account_status` e os três ramos (`none`, `confirmed`, `unconfirmed`).
**Where**: `app/(marketing)/cadastro/actions.ts`
**Depends on**: T27
**Reuses**: `lib/auth/password.ts`, `lib/auth/throttle.ts`, `lib/auth/email.ts`, `lib/notifications/send-email.ts`
**Requirement**: AUTH-02 (3 a 5), AUTH-03, AUTH-11 (8), AUTH-12

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Senha inválida, confirmação diferente, nome fora de 2 a 80 e `role` inválido bloqueiam sem chamar o Supabase
- [x] `none`: `signUp` com `data:{role,nome,has_password:true}` e `emailRedirectTo` seguro; `confirmed`: não chama `signUp` e chama `sendEmail` do aviso; `unconfirmed`: chama `resend({type:"signup"})` sujeito ao throttle
- [x] Todos os ramos gravam o cookie de contexto e redirecionam a `/cadastro/confirmar-email` com resposta idêntica
- [x] Registra `auth_cadastro_enviado` sem PII
- [x] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): action `signUpAction``

---

### T29: Página e formulário `/cadastro`

**What**: Criar `/cadastro` com perfil pré-selecionável por `?perfil=`, nome, e-mail, senha e confirmação.
**Where**: `app/(marketing)/cadastro/`
**Depends on**: T28
**Reuses**: `components/ui/*`, `lib/auth/password.ts`, grupo de perfis do `entrar-form.tsx` antigo
**Requirement**: AUTH-02 (1, 2, 3, 4, 5)

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] `?perfil=produtor|investidor|empresa` marca o perfil; valor inválido não marca nenhum
- [x] Validação no cliente mostra o requisito faltante no campo e bloqueia o envio
- [x] `autocomplete="new-password"`, alvos de 44 px, usuário logado redireciona ao destino do papel
- [x] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: unit + e2e (`e2e/cadastro.spec.ts`)
**Gate**: full
**Commit**: `feat(auth): página e formulário `/cadastro``

---

### T30: Página `/cadastro/confirmar-email`

**What**: Criar a tela de "Confira seu e-mail" com reenvio, cooldown e estado `?erro=expirado`.
**Where**: `app/(marketing)/cadastro/confirmar-email/page.tsx`
**Depends on**: T29
**Reuses**: `lib/auth/auth-context-cookie.ts`, `resendConfirmation`
**Requirement**: AUTH-02 (13, 14, 15), AUTH-04 (11)

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Mostra o e-mail do cookie; sem cookie redireciona a `/cadastro`
- [x] `?erro=expirado` mostra "Enviar novo link"
- [x] Cooldown de 60 s com contagem; 4º reenvio na hora mostra "Muitos pedidos. Tente de novo em alguns minutos."
- [x] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(auth): página `/cadastro/confirmar-email``

---

### T31: E2E do fluxo completo de cadastro e confirmação

**What**: Cobrir cadastro → e-mail no Mailpit → link em contexto limpo → termos/destino, para investidor e produtor, e o caso de e-mail duplicado.
**Where**: `e2e/cadastro-confirmacao.spec.ts`
**Depends on**: T30
**Reuses**: helpers de Mailpit de `e2e/helpers/auth.ts`
**Requirement**: AUTH-02, AUTH-03, AUTH-04, AUTH-11

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [x] Investidor: cadastro, confirmação e `/termos` antes do destino; produtor: cai em `/produtor/painel` ou `/produtor`
- [x] Tentativa de login antes de confirmar mostra "Confirme seu e-mail para entrar" e o botão de reenvio
- [x] E-mail duplicado mostra a mesma tela de sucesso e não cria segundo usuário
- [x] `role=verificador` forjado na requisição não cria conta
- [x] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(auth): e2E do fluxo completo de cadastro e confirmação`

---

### T32: CTAs da home e do cabeçalho

**What**: Apontar os CTAs de produtor e investidor a `/cadastro?perfil=…`.
**Where**: `app/(marketing)/page.tsx`
**Depends on**: T31
**Reuses**: `components/shared/SiteHeader.tsx`
**Requirement**: AUTH-17, AUTH-02 (2)

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] "Sou produtor, quero ser encontrado" leva a `/cadastro?perfil=produtor` e "Sou investidor…" a `/cadastro?perfil=investidor`
- [ ] `e2e/home.spec.ts` atualizado e passando
- [ ] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(auth): cTAs da home e do cabeçalho`

---

### T33: Boas-vindas do produtor públicas

**What**: Fazer `/produtor` abrir sem sessão e levar o visitante a `/cadastro?perfil=produtor` no "Começar cadastro".
**Where**: `app/(producer)/produtor/boas-vindas-form.tsx`
**Depends on**: T32
**Reuses**: `app/(producer)/produtor/actions.ts` (`createBusiness` exige sessão)
**Requirement**: AUTH-17 (11)

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Visitante abre `/produtor` e vê as boas-vindas, sem redirecionar a `/entrar`
- [ ] "Começar cadastro" para visitante leva a `/cadastro?perfil=produtor`; para produtor logado continua chamando `createBusiness`
- [ ] `e2e/produtor-boas-vindas.spec.ts` atualizado e passando
- [ ] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(auth): boas-vindas do produtor públicas`

---

### Phase 6: Reset de senha por OTP

### T34: Páginas e action `/esqueci-senha`

**What**: Criar `/esqueci-senha` e `requestReset` com throttle e resposta neutra.
**Where**: `app/(marketing)/esqueci-senha/`
**Depends on**: T33
**Reuses**: `lib/auth/throttle.ts`, `lib/auth/auth-context-cookie.ts`
**Requirement**: AUTH-08 (1, 3), AUTH-09

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] E-mail existente e inexistente redirecionam do mesmo jeito a `/esqueci-senha/codigo`; só o existente recebe e-mail
- [ ] Resposta e texto idênticos quando o throttle bloqueia, sem diferença por existência de conta
- [ ] Registra `auth_reset_pedido`
- [ ] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(auth): páginas e action `/esqueci-senha``

---

### T35: Página e actions `/esqueci-senha/codigo`

**What**: Criar a tela do código, `verifyResetCode` e `resendResetCode`.
**Where**: `app/(marketing)/esqueci-senha/codigo/`
**Depends on**: T34
**Reuses**: `lib/auth/auth-context-cookie.ts`
**Requirement**: AUTH-08 (4 a 9), AUTH-09, AUTH-10

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Código correto com `type:"recovery"` grava `iasy_recovery` e redireciona a `/redefinir-senha`; espaços colados são removidos
- [ ] Código errado, vencido, usado ou substituído devolve "Código inválido ou vencido."; 429 devolve "Muitas tentativas. Peça um novo código."
- [ ] `inputmode="numeric"`, `autocomplete="one-time-code"`, `maxLength=6`
- [ ] Registra `auth_reset_codigo_ok` e `auth_reset_codigo_erro`
- [ ] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(auth): página e actions `/esqueci-senha/codigo``

---

### T36: Página e action `/redefinir-senha`

**What**: Criar a tela de nova senha com confirmação e `setNewPassword`.
**Where**: `app/(marketing)/redefinir-senha/`
**Depends on**: T35
**Reuses**: `lib/auth/password.ts`, `lib/auth/post-auth.ts`
**Requirement**: AUTH-14

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Sem sessão redireciona a `/esqueci-senha`
- [ ] Senhas diferentes ou fora da regra bloqueiam; `same_password` mostra "Escolha uma senha diferente da atual."
- [ ] Sucesso chama `updateUser({password, data:{has_password:true}})`, `signOut({scope:"others"})`, limpa `iasy_recovery`, registra `auth_senha_alterada` e redireciona ao destino com `?aviso=senha-alterada`
- [ ] Conta do MVP sem senha define a primeira senha e passa a entrar por senha
- [ ] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(auth): página e action `/redefinir-senha``

---

### T37: E2E do reset completo

**What**: Cobrir pedir código, validar, redefinir, entrar com a nova senha e falhar com a antiga; sessões antigas encerradas; bloqueio de rotas durante a recuperação; e-mail inexistente.
**Where**: `e2e/reset-senha.spec.ts`
**Depends on**: T36
**Reuses**: helpers de Mailpit
**Requirement**: AUTH-08, AUTH-14

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] E-mail de recuperação contém 6 dígitos e nenhum link
- [ ] Reuso do código e código substituído por reenvio falham
- [ ] Durante a sessão de recuperação, abrir `/negocios` redireciona a `/redefinir-senha`
- [ ] Segundo contexto de navegador logado perde a sessão após a troca; e-mail "senha alterada" chega ao Mailpit
- [ ] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(auth): e2E do reset completo`

---

### Phase 7: Fechamento (E2E transversais, a11y, produção e documentação)

### T38: E2E de redirect cruzado, logout e público do produtor

**What**: Cobrir investidor↔produtor com `?redirect=`, `redirect` malicioso, Sair e rotas do produtor.
**Where**: `e2e/auth-redirect.spec.ts`
**Depends on**: T37
**Reuses**: helpers de login por senha
**Requirement**: AUTH-01, AUTH-16, AUTH-17

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Investidor com `/produtor/painel` cai em `/negocios` ou `/descobrir/1` sem JSON 403; produtor com `/interesses` cai no padrão do papel
- [ ] `//evil.com`, `/\evil.com`, `https://evil.com`, `/entrar` ignorados
- [ ] Papel errado por URL direta redireciona à página inicial do papel
- [ ] Sair encerra a sessão e rota privada volta a pedir login; `/produtor` abre sem login
- [ ] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(auth): e2E de redirect cruzado, logout e público do produtor`

---

### T39: E2E de eventos e ausência de PII

**What**: Verificar que cada fluxo grava o evento `auth_*` e que payload, URLs e logs não contêm e-mail, senha, token ou código.
**Where**: `e2e/auth-eventos.spec.ts`
**Depends on**: T38
**Reuses**: `e2e/helpers/db.ts` (`getEventsByType`)
**Requirement**: AUTH-15

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Cada um dos 11 tipos aparece em `events` após executar o fluxo correspondente
- [ ] Nenhum payload contém `@`, a senha usada ou o código/token
- [ ] Nenhuma URL visitada no fluxo contém o e-mail (assert em todas as navegações)
- [ ] Falha forçada de `trackEvent` não quebra o fluxo
- [ ] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(auth): e2E de eventos e ausência de PII`

---

### T40: Acessibilidade das telas novas

**What**: Incluir `/entrar`, `/cadastro`, `/esqueci-senha`, `/esqueci-senha/codigo` e `/redefinir-senha` na checagem de a11y.
**Where**: `e2e/a11y-auth.spec.ts`
**Depends on**: T39
**Reuses**: `e2e/a11y-investor.spec.ts`
**Requirement**: AUTH-05 (6, 14)

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Zero violações sérias/críticas nas 5 telas
- [ ] Campos têm rótulo, `aria-invalid` em erro e navegação completa por teclado
- [ ] Gate full passa: `npm run test && npm run test:e2e`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(auth): acessibilidade das telas novas`

---

### T41: Aviso "Defina uma senha" após magic link

**What**: Exibir uma vez por sessão o aviso para usuários sem `has_password` que entraram por link.
**Where**: `components/shared/SetPasswordNotice.tsx`
**Depends on**: T40
**Reuses**: `components/shared/AppChrome.tsx`
**Requirement**: AUTH-18

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] Usuário com `user_metadata.has_password` ausente que entrou por link vê o aviso com link a `/redefinir-senha`
- [ ] Dispensar esconde o aviso na mesma sessão; quem tem senha não vê
- [ ] Gate quick passa: `npm run test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): aviso "Defina uma senha" após magic link`

---

### T42: Produção: rate limits, SMTP e URLs no `DEPLOY.md`

**What**: Documentar `AUTH_COOKIE_SECRET`, `site_url`/redirects de produção e preview, SMTP, valores de rate limit de produção, `enable_confirmations` e o checklist de contas do MVP.
**Where**: `../DEPLOY.md`
**Depends on**: T41
**Reuses**: `DEPLOY.md` §0.2, §0.3, §1.3, §1.4
**Requirement**: AUTH-10, AUTH-12, AUTH-13

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] `DEPLOY.md` lista cada chave de `config.toml` alterada com o valor de produção e a variável `AUTH_COOKIE_SECRET`
- [ ] Checklist pré-deploy inclui a consulta que confirma `email_confirmed_at` preenchido nas contas do MVP
- [ ] Seções que citavam login só por OTP atualizadas
- [ ] Gate build passa: `npm run lint && npm run build && npm run typecheck && npm run test`

**Tests**: none (documentação)
**Gate**: build
**Commit**: `feat(auth): produção: rate limits, SMTP e URLs no `DEPLOY.md``

---

### T43: Atualizar o PRD do MVP e o `STATE.md`

**What**: Marcar RN-02, RF-02 e T02 do MVP como substituídos por esta feature e registrar o handoff.
**Where**: `../mvp/prd-mvp.md`
**Depends on**: T42
**Reuses**: `.specs/STATE.md` (AD-009, AD-010 já registrados)
**Requirement**: AUTH-01 a AUTH-18 (rastreabilidade)

**Tools**:

- MCP: `filesystem`
- Skill: NONE

**Done when**:

- [ ] RN-02, RF-02 e a linha de T02 apontam para `.specs/features/login-e-reset-de-senha/prd.md`
- [ ] Nenhuma outra regra do MVP é alterada
- [ ] Gate build passa: `npm run lint && npm run build && npm run typecheck && npm run test`

**Tests**: none (documentação)
**Gate**: build
**Commit**: `feat(auth): atualizar o PRD do MVP e o `STATE.md``

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

Phase 1:  T1 ---→ T2 ---→ T3 ---→ T4 ---→ T5 ---→ T6
Phase 2:  T7 ---→ T8 ---→ T9 ---→ T10 ---→ T11 ---→ T12 ---→ T13
Phase 3:  T14 ---→ T15 ---→ T16 ---→ T17 ---→ T18 ---→ T19 ---→ T20
Phase 4:  T21 ---→ T22 ---→ T23 ---→ T24 ---→ T25 ---→ T26 ---→ T27
Phase 5:  T28 ---→ T29 ---→ T30 ---→ T31 ---→ T32 ---→ T33
Phase 6:  T34 ---→ T35 ---→ T36 ---→ T37
Phase 7:  T38 ---→ T39 ---→ T40 ---→ T41 ---→ T42 ---→ T43
```

Execução estritamente sequencial. Com 43 tasks, o empacotamento em lotes de ~7 tasks (fases inteiras) rende vários lotes; a oferta de sub-agentes é feita antes do Execute.

---

## Deviations (registradas durante o Execute)

| # | Desvio | Motivo |
| --- | --- | --- |
| D1 | Commit extra `chore(e2e)`: `playwright.config.ts` lê `E2E_PORT` | Já existe um `next-server` do checkout principal na porta 3000; sem isso o E2E testaria o código errado |
| D2 | `max_frequency = "60s"` (T4) passa a ser aplicado em T27 | Com 60 s por usuário o fluxo OTP atual (reenvio) e os helpers de E2E quebrariam até a remoção do OTP |
| D3 | Registro dos templates em `config.toml` fica em T5 (junto dos arquivos) | O `config.toml` não pode apontar para arquivo inexistente |
| D4 | `magic_link.html` **e `confirmation.html`** ficam "código + link `/auth/confirm`" até T27; a versão só-link e seu teste entram em T27 (com `enable_confirmations=true`, o 1º e-mail do login por OTP de usuário novo usa o template de confirmação) | Os helpers de E2E atuais leem o código de 6 dígitos do Mailpit; tirá-lo em T5 quebraria a suíte por 20 tasks |
| D6 | `/entrar` deixa de aceitar o login por OTP em T24 (antes de T26/T27): os specs E2E que logam pela UI ficam vermelhos entre T24 e T26; T24 só valida `entrar.spec.ts` | A troca do helper (T26) depende do formulário novo; `PasswordInput` e `AuthTabs` (`components/auth/`) entram em T24 por serem dele |
| D5 | Gate full roda unit + os specs E2E tocados pela task; a suíte E2E completa roda ao fim de cada fase | A suíte completa leva dezenas de minutos e o STATE.md documenta esgotamento de rede do Docker em rodadas repetidas |
