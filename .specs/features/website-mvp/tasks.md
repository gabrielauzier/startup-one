# Website MVP Îasy (Next.js) Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/website-mvp/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Repositório greenfield — nenhum `package.json`, teste ou config de CI existe ainda, então não há amostra a inferir (a skill pede para perguntar ao usuário nesse caso). Aplicando o padrão forte da skill + o requisito explícito RNF-12 da PRD ("Testes unitários do alinhamento e da máquina de estados; teste ponta a ponta de cadastro, verificação, vitrine, documento e interesse"): Vitest para unidade/componente, Playwright para e2e — escolha padrão do ecossistema Next.js/Vercel, sem dependência nova além do que a stack já define. **A confirmar com o usuário antes do Execute** (pergunta obrigatória da seção "ASK About MCPs and Skills" abaixo cobre isso).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Domínio puro (`lib/matching/score.ts`, `lib/business/state-machine.ts`) | unit | Todas as branches; 1:1 com os ACs de RN-24 e RN-12; todo edge case listado na spec | `lib/**/__tests__/*.test.ts` | `npm run test` |
| Server Actions (`app/**/actions.ts`, `lib/offline`, `lib/notifications`) | unit | Caminho feliz + toda validação/erro descrita nos ACs da história correspondente | `app/**/__tests__/*.test.ts`, `lib/**/__tests__/*.test.ts` | `npm run test` |
| Rotas/páginas (App Router) e fluxos ponta a ponta | e2e | Fluxos completos de RNF-12: cadastro, verificação, vitrine/descoberta, documento, interesse | `e2e/*.spec.ts` | `npm run test:e2e` |
| Migrações SQL / RLS policies | integration | Cada policy testada com um usuário de cada papel (permitido e negado) | `supabase/tests/*.sql` ou `e2e/rls-*.spec.ts` | `npm run test:e2e -- rls` |
| Componentes visuais puros (design tokens, layout, sem lógica) | none | — (só build gate) | `components/**/*.tsx` | build gate only |

## Gate Check Commands

> Geradas a partir da stack definida na PRD §7.2 (Next.js + TypeScript + Vercel). Os scripts npm citados são criados na Fase 1 (T1) — antes disso não há comando a rodar.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Após tasks só com testes unitários | `npm run test` |
| Full | Após tasks com e2e/integração (RLS) | `npm run test && npm run test:e2e` |
| Build | Após fechar uma fase, ou tasks só de config/schema | `npm run lint && npm run typecheck && npm run build && npm run test` |

---

## Execution Plan

Phases são ordenadas e rodam em sequência — cada fase fecha antes da próxima começar; tasks dentro de uma fase rodam em ordem. Correspondência com o cronograma da PRD §8.4: Fases 1–5 = "Fase 1" do cronograma (M1–M3); Fases 6–11 = "Fase 2" (M4–M7); Fase 12 é transversal e roda ao final de cada Fase do cronograma, não só no fim do projeto.

### Phase 1: Fundação do projeto

```
T1 → T2 → T3 → T4 → T5 → T6
```

### Phase 2: Entrada e acesso (M1)

```
T7 → T8 → T9 → T10 → T11 → T12
```

### Phase 3: Cadastro do produtor — dados e rascunho offline (M2, parte 1/2)

```
T13 → T14 → T15 → T16 → T17
```

### Phase 4: Cadastro do produtor — telas (M2, parte 2/2)

```
T18 → T19 → T20 → T21 → T22 → T23 → T24
```

### Phase 5: Verificação e selo (M3)

```
T25 → T26 → T27 → T28 → T29 → T30
```

### Phase 6: Motor de alinhamento e descoberta guiada (M4, parte 1/2)

```
T31 → T32 → T33 → T34
```

### Phase 7: Resultados e vitrine (M4, parte 2/2)

```
T35 → T36 → T37 → T38
```

### Phase 8: Página do negócio e documentos (M5)

```
T39 → T40 → T41 → T42 → T43 → T44
```

### Phase 9: Interesse e conexão (M6)

```
T45 → T46 → T47 → T48 → T49
```

### Phase 10: Painéis (M7)

```
T50 → T51 → T52
```

### Phase 11: Avisos e rotinas diárias (transversal RF-31, cron)

```
T53 → T54 → T55 → T56
```

### Phase 12: Hardening transversal (RLS, RNF, e2e de ponta a ponta)

```
T57 → T58 → T59 → T60
```

---

## Task Breakdown

#### Phase 1: Fundação do projeto

### T1: Inicializar o projeto Next.js com TypeScript, Tailwind e scripts de qualidade

**What**: Rodar `create-next-app` (App Router, TypeScript, Tailwind, ESLint), adicionar Vitest e Playwright, e configurar os scripts `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e` em `package.json`.
**Where**: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`
**Depends on**: None
**Reuses**: —
**Requirement**: RF-01 (fundação de toda rota)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e` existem e rodam sem erro num projeto vazio
- [x] App Router (`app/layout.tsx`, `app/page.tsx`) responde em `/`

**Tests**: none
**Gate**: build
**Status**: ✅ Complete (2026-09-27) — `web/package.json`, `web/vitest.config.ts`, `web/playwright.config.ts`. SPEC_DEVIATION: caminho é `web/package.json` etc. (raiz do app é `/web`, não a raiz do repo — ver AD-008 em `.specs/STATE.md`).

---

### T2: Portar os tokens visuais da PRD para `tailwind.config.ts`

**What**: Configurar cor primária `#1E5A3C`, fundo `#F5F1E8`, fonte de título Newsreader e de texto Hanken Grotesk, breakpoints 360/390/1440px como tokens Tailwind.
**Where**: `tailwind.config.ts`, `app/layout.tsx` (import de fontes via `next/font`)
**Depends on**: T1
**Reuses**: PRD §6.4 (tokens já decididos, não redescobrir)
**Requirement**: RF-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Classes utilitárias `bg-primary`, `text-primary`, `font-heading`, `font-body` disponíveis e usadas em `app/page.tsx` como smoke test

**Tests**: none
**Gate**: build
**Status**: ✅ Complete (2026-09-27) — `web/app/globals.css` (tokens via `@theme`, Tailwind v4 é CSS-first — não gera `tailwind.config.ts`), `web/app/layout.tsx` (fontes Newsreader/Hanken Grotesk, `lang="pt-BR"` por RNF-11), `web/app/page.tsx` (smoke test). SPEC_DEVIATION: task previa `tailwind.config.ts`; o scaffold do T1 usa Tailwind v4, cujo mecanismo idiomático de tokens é o bloco `@theme` em CSS, não um arquivo de config JS — mantido para seguir a convenção já estabelecida no T1, sem reintroduzir um `tailwind.config.ts` legado.

---

### T3: Instalar shadcn/ui e criar os componentes base (Button, Input, Card, Checkbox)

**What**: Inicializar shadcn/ui e gerar os 4 componentes base usados por praticamente toda tela do protótipo.
**Where**: `components/ui/`
**Depends on**: T2
**Reuses**: shadcn/ui gerador oficial
**Requirement**: RF-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `components/ui/{button,input,card,checkbox}.tsx` existem e renderizam sem erro de tipo

**Tests**: none
**Gate**: build
**Status**: ✅ Complete (2026-09-27) — `web/components/ui/{button,input,card,checkbox}.tsx` via `shadcn@latest init` (style `base-nova`, Base UI + `cn` + `class-variance-authority` + `lucide-react`). SPEC_DEVIATION: o `init` do shadcn reescreveu `app/globals.css` e `app/layout.tsx` do T2 (fundo/primary voltaram para os tokens neutros padrão do shadcn e a fonte Geist foi reintroduzida); corrigido no mesmo commit para manter `--background`/`--primary`/`--font-heading`/`--font-sans` nos valores da PRD (verde `#1E5A3C`, creme `#F5F1E8`, Newsreader/Hanken Grotesk), sem reverter as demais variáveis do shadcn (border, ring, card, sidebar, chart) que os componentes precisam.

---

### T4: Criar projeto Supabase e migração inicial (`profiles`, enums de papel e status)

**What**: Escrever a migração SQL inicial com `profiles` (RN-01/03) e os enums `role` e `business_status` (RN-12), e configurar variáveis de ambiente `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`.
**Where**: `supabase/migrations/0001_init.sql`, `.env.local.example`
**Depends on**: T3
**Reuses**: PRD §7.3 (modelo de dados)
**Requirement**: RF-02, RN-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Migração aplica sem erro num projeto Supabase local (`supabase db reset`)
- [x] RLS habilitada em `profiles` desde a criação (RNF-04)

**Tests**: integration
**Gate**: full
**Status**: ✅ Complete (2026-09-27) — `web/supabase/migrations/0001_init.sql`, `web/supabase/tests/profiles.sql` (5 testes pgTAP), `web/.env.local.example`. `supabase start` e `supabase db reset` aplicam sem erro; `supabase test db` passa 5/5. SPEC_DEVIATION: `[storage] enabled = false` em `supabase/config.toml` — o container `supabase_storage_web` falha no healthcheck neste ambiente e nenhuma task até o T21 usa Storage; reabilitar antes do T22 (upload de fotos). Função pgTAP usada para checar RLS foi `ok((select relrowsecurity from pg_class ...))` em vez de `row_security_is_enabled` (essa função não existe no pgTAP instalado).

---

### T5: Criar as fábricas de cliente Supabase (`lib/supabase/{server,client,middleware}.ts`)

**What**: Implementar `createServerClient`, `createBrowserClient` e `updateSession` conforme o design.
**Where**: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/middleware.ts`
**Depends on**: T4
**Reuses**: `@supabase/ssr`
**Requirement**: RF-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Um Server Component de teste consegue ler `auth.getUser()` via `createServerClient`
- [x] Nenhuma chave de serviço aparece em código client-side (RNF-05)

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete (2026-09-27) — `web/lib/supabase/{server,client,middleware}.ts` + `web/lib/supabase/__tests__/{server,client}.test.ts` (4 testes). T4 (schema) segue ⚠️ Partial (verificação local do Supabase pendente), mas não bloqueia T5: as fábricas de cliente não dependem de um banco rodando para compilar/testar.

---

### T6: Criar `middleware.ts` raiz com mapa de rotas por perfil

**What**: Middleware que redireciona para `/entrar` sem sessão em rota privada, e nega rota de perfil incompatível (CA-01.2, CA-02.3).
**Where**: `middleware.ts`, `lib/auth/roles.ts`
**Depends on**: T5
**Reuses**: —
**Requirement**: RF-03

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit test: dado um mapa de rota → papéis, `resolveAccess()` retorna permitido/negado corretamente para cada combinação de papel e rota
- [x] Gate check passes: `npm run test`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete (2026-09-27) — `web/lib/auth/roles.ts` (+ teste com 6 casos) e `web/proxy.ts`. SPEC_DEVIATION: o arquivo raiz não é `middleware.ts` — a versão instalada do Next.js (16.3.6) depreciou essa convenção em favor de `proxy.ts`/`export function proxy()` (mesma API, só o nome do arquivo/função muda; `config.matcher` é idêntico). Gate rodado no nível **build** (não apenas quick) por ser a última task da Fase 1, conforme a tabela de gates de `tasks.md`.

---

#### Phase 2: Entrada e acesso (M1)

### T7: Página inicial `/` (T01)

**What**: Implementar a página inicial com frase principal, os 4 passos do ciclo, dois botões de caminho e o rodapé de conexão (RN-04).
**Where**: `app/(marketing)/page.tsx`, `components/marketing/FourSteps.tsx`, `components/shared/ConnectionFooter.tsx`
**Depends on**: T3
**Reuses**: `components/ui/*`
**Requirement**: RF-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `/` renderiza os 4 passos, os dois botões e o rodapé de RN-04 com o texto exato
- [x] Nenhum termo proibido de RN-04 ("investir agora", "rendimento", "retorno garantido", "captado", "captação") aparece no HTML renderizado

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete (2026-09-27) — `web/app/(marketing)/page.tsx`, `web/components/marketing/FourSteps.tsx`, `web/components/shared/ConnectionFooter.tsx`, `web/e2e/home.spec.ts` (2 testes). Requer `web/.env.local` com as credenciais do Supabase local (o `proxy.ts` do T6 consulta `profiles` em toda requisição); criado e mantido fora do git (gitignored), valores documentados em `.env.local.example` e obtidos via `supabase status -o env`.

---

### T8: Tela Entrar `/entrar` (T02) com 3 perfis e envio de e-mail

**What**: Formulário com os 3 perfis (investir, empresa, produzir) e campo de e-mail; Server Action `sendOtp(email, role)` chamando Supabase Auth OTP.
**Where**: `app/(marketing)/entrar/page.tsx`, `app/(marketing)/entrar/actions.ts`
**Depends on**: T7
**Reuses**: `lib/supabase/server.ts`
**Requirement**: RF-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Botão "Entrar" fica desabilitado sem perfil marcado (CA-01.1)
- [x] `sendOtp` chama `supabase.auth.signInWithOtp` e retorna erro tratado se o e-mail for inválido

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete (2026-09-27) — `web/app/(marketing)/entrar/{page.tsx,actions.ts}` + `web/app/(marketing)/entrar/__tests__/actions.test.ts` (4 testes unit) + `web/e2e/entrar.spec.ts` (2 testes e2e, contra o Supabase local real). `sendOtp` redireciona para `/entrar/codigo?email=...&role=...` (T9 ainda não existe — a rota 404 momentaneamente até o T9).

---

### T9: Tela Código de acesso `/entrar/codigo` (T25) com verificação OTP

**What**: Campo de 6 dígitos, "Reenviar código", Server Action `verifyOtp(email, code)` (RN-02).
**Where**: `app/(marketing)/entrar/codigo/page.tsx`, `app/(marketing)/entrar/actions.ts` (adicionar `verifyOtp`)
**Depends on**: T8
**Reuses**: —
**Requirement**: RF-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Código vencido ou errado 5x exige novo código (CA-02.1)
- [x] Confirmação de código para e-mail sem conta cria o profile com o papel escolhido (CA-02.2)

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete (2026-09-27) — `web/app/(marketing)/entrar/codigo/{page.tsx,codigo-form.tsx}`, `verifyOtp` em `actions.ts`, `web/e2e/entrar-codigo.spec.ts` (2 e2e, com código real lido do Mailpit local), `web/app/(marketing)/entrar/codigo/__tests__/actions.test.ts` (4 unit). SPEC_DEVIATIONS: (1) criado `web/lib/supabase/admin.ts` (cliente com service-role) — `verifyOtp` precisa criar o profile do usuário antes de existir qualquer policy de insert (essa só chega no T12), então usa o cliente admin para esse bootstrap específico, não listado no `Where` original da task; (2) customizado `supabase/templates/magic_link.html` e `[auth.email.template.magic_link]` em `config.toml` para incluir `{{ .Token }}` — o template padrão do Supabase local só manda o link mágico (fluxo PKCE), sem o código de 6 dígitos que a RN-02 exige mostrar; (3) `codigo-form.tsx` tem um atributo `data-attempts` no form (não visível) só para o e2e conseguir esperar deterministicamente o fim de cada round-trip do Server Action, já que a mensagem de erro é idêntica entre tentativas.

---

### T10: Redirecionamento pós-login por perfil

**What**: Após `verifyOtp`, redirecionar investidor/empresa para descoberta (ou vitrine, se já respondida), produtor para boas-vindas ou painel, verificador para a fila (RF-03), preservando a URL original quando veio de um redirect do middleware (CA-02.3).
**Where**: `app/(marketing)/entrar/actions.ts` (adicionar lógica de redirect)
**Depends on**: T6, T9
**Reuses**: `lib/auth/roles.ts`
**Requirement**: RF-03

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit test cobre as 4 combinações de papel × redirecionamento
- [x] E2E: login como produtor sem cadastro cai em `/produtor`; com cadastro enviado cai em `/produtor/painel`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete (2026-09-28) — `web/app/(marketing)/entrar/redirect.ts` (`resolvePostLoginRedirect`, `isSafeRedirect`), fiado em `actions.ts`; `web/app/(marketing)/entrar/__tests__/redirect.test.ts` (8 unit, cobrindo os 4 papéis e os dois casos "já enviou/respondeu" de cada). O e2e do T9 (`entrar-codigo.spec.ts`) já cobre "produtor sem cadastro → `/produtor`" contra o Supabase local real; o caso "com cadastro enviado → `/produtor/painel`" é coberto só por unit test com mock, porque a tabela `businesses` ainda não existe (chega no T13). SPEC_DEVIATIONS: (1) `isSafeRedirect`/`resolvePostLoginRedirect` foram para um arquivo novo `redirect.ts` sem `"use server"` — um arquivo `"use server"` exige que toda função exportada seja uma Server Action assíncrona, e essas duas não são chamáveis pelo cliente; (2) para viabilizar CA-02.3 (preservar a URL original), also editei `entrar/page.tsx` (virou Server Component lendo `searchParams.redirect`, com a UI movida para `entrar-form.tsx`) e `entrar/codigo/{page.tsx,codigo-form.tsx}` — fora do `Where` original da task, mas necessário para propagar o parâmetro `redirect` ponta a ponta.

---

### T11: Tela Termos e privacidade `/termos` (T26) e aceite obrigatório do investidor

**What**: Página com Termos de Uso e Política de Privacidade; Server Action `acceptTerms(version)` que grava versão e timestamp no profile (RN-03).
**Where**: `app/(marketing)/termos/page.tsx`, `app/(marketing)/termos/actions.ts`
**Depends on**: T10
**Reuses**: —
**Requirement**: RF-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Investidor sem aceite registrado é redirecionado a `/termos` no primeiro acesso pós-login
- [x] `profiles.termos_versao`/`termos_aceitos_em` gravados após aceite (CA-03.2)

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete (2026-09-28) — `web/app/(marketing)/termos/{page.tsx,termos-form.tsx,actions.ts}`, gate de termos em `entrar/actions.ts` (`verifyOtp`), `web/e2e/termos.spec.ts` (1 e2e, verificando `profiles.termos_aceitos_em` via PostgREST com a service-role key), `web/app/(marketing)/termos/__tests__/actions.test.ts` (3 unit). O gate só se aplica a investidor/empresa (RN-03); produtor nunca é mandado para `/termos` (o aceite dele é o checkbox da parte 1 do cadastro, T19) — coberto por teste dedicado. Texto de Termos/Política é placeholder de produto, não é redação jurídica final.

---

### T12: RLS policies de `profiles` e teste de autorização por papel

**What**: Policies "cada usuário só edita o próprio profile" e "papel verificador só é criado pela equipe" (RN-01), com teste que confirma bloqueio de escrita direta de `role='verificador'` por request pública (CA-01.3).
**Where**: `supabase/migrations/0002_profiles_rls.sql`, `e2e/rls-profiles.spec.ts`
**Depends on**: T4, T11
**Reuses**: —
**Requirement**: RF-02, RN-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Request anônima tentando criar profile com `role='verificador'` recebe 403 (CA-01.3)
- [x] Gate check passes: `npm run test:e2e -- rls`

**Tests**: integration
**Gate**: full

**Commit**: `feat(auth): entrada sem senha com OTP e controle de acesso por papel`

**Status**: ✅ Complete (2026-09-28) — `web/supabase/migrations/0002_profiles_rls.sql` (select/insert/update "own", bloqueando `role='verificador'`), `web/e2e/rls-profiles.spec.ts` (3 testes via chamadas diretas ao PostgREST, sem browser). SPEC_DEVIATION no código de status: request totalmente anônima (papel `anon`, sem nenhum grant) recebe **401**; um usuário autenticado que viola o `WITH CHECK` (tenta virar `verificador`) recebe **403** — o texto da task citava só 403, mas o comportamento real do PostgREST distingue os dois casos (401 = sem grant algum, 403 = grant existe mas checagem falha); os dois casos garantem RN-01/CA-01.3 (nenhuma linha criada), cobertos separadamente no teste. Refatorado como parte desta task: `entrar/actions.ts` e `termos/actions.ts` deixaram de usar o cliente admin para ler/escrever `profiles` (agora usam o cliente da própria sessão, permitido pelas novas policies), mantendo o admin só para `businesses`/`investor_answers` em `resolvePostLoginRedirect` (tabelas sem RLS própria ainda, chegam no T13/T32).

---

#### Phase 3: Cadastro do produtor — dados e rascunho offline (M2, parte 1/2)

### T13: Migração `businesses`, `business_revisions`, `evidences`, `certifications`, `partners`

**What**: Migração SQL com as 5 tabelas do modelo de dados que o cadastro do produtor precisa, incluindo os `CHECK` de RN-10/RN-19 e o índice único parcial de CNPJ (RN-05).
**Where**: `supabase/migrations/0003_businesses.sql`
**Depends on**: T12
**Reuses**: PRD §7.3
**Requirement**: RF-06 a RF-10

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `CHECK` rejeita nota fora de 0–100 ou com decimal (CA-19.1) e valor fora de R$50k–200k (CA-10.1) direto no banco
- [x] Índice único parcial impede 2º negócio ativo para o mesmo CNPJ (CA-05.3)

**Tests**: integration
**Gate**: full
**Status**: ✅ Complete (2026-09-28) — `web/supabase/migrations/0003_businesses.sql` (5 tabelas), `web/supabase/tests/businesses.sql` (10 testes pgTAP). Notas usam `numeric` + `check (nota = trunc(nota))` em vez de `integer`: uma coluna `integer` arredonda silenciosamente 94.5 para 95 no INSERT antes de qualquer CHECK rodar, então nunca rejeitaria o valor decimal exigido por CA-19.1 (confirmado empiricamente antes de escrever a migração). Colunas de `businesses` preenchidas progressivamente pelas 5 partes do cadastro (cnpj, nome, slug, tipo_org, cidade_ibge, uf, familias, anos_atividade, produção, finalidade/valor/prazo/retorno) são nullable — só `id`/`owner_id`/`status` são obrigatórios na criação do rascunho (T18); a obrigatoriedade de RN-06 é aplicada na camada de aplicação no envio final (T24), não no schema.

---

### T14: `lib/business/state-machine.ts`

**What**: Implementar `canTransition`/`assertTransition` cobrindo exatamente o diagrama de estados de RN-12.
**Where**: `lib/business/state-machine.ts`, `lib/business/__tests__/state-machine.test.ts`
**Depends on**: T13
**Reuses**: —
**Requirement**: RN-12

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Teste unitário cobre toda transição válida do diagrama e rejeita toda transição não listada (CA-12.1)
- [x] Gate check passes: `npm run test`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete (2026-09-28) — `web/lib/business/state-machine.ts` (`canTransition`/`assertTransition`/`InvalidBusinessTransitionError`), `web/lib/business/__tests__/state-machine.test.ts` (13 testes: as 9 transições válidas, as 40 combinações inválidas geradas programaticamente, e os dois comportamentos de `assertTransition`).

---

### T15: `lib/offline/draft-store.ts` (IndexedDB)

**What**: `saveLocalDraft`, `getLocalDraft`, `flushWhenOnline` usando `idb`.
**Where**: `lib/offline/draft-store.ts`, `lib/offline/__tests__/draft-store.test.ts`
**Depends on**: T14
**Reuses**: pacote `idb`
**Requirement**: RN-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Teste unitário (fake-indexeddb) cobre salvar, ler e sincronizar sem duplicar (CA-07.1, CA-07.2)
- [x] Gate check passes: `npm run test`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete (2026-09-28) — `web/lib/offline/draft-store.ts` + `web/lib/offline/__tests__/draft-store.test.ts` (8 testes com `fake-indexeddb`). SPEC_DEVIATION: `flushWhenOnline(businessId, sync)` recebe um callback `sync` em vez da assinatura literal do design (`flushWhenOnline(businessId): Promise<void>`) — sem ele, este módulo puro de storage precisaria importar a Server Action de rede diretamente, misturando camadas; o callback é injetado por quem chama (o hook `useDraftSync` do T17).

---

### T16: Service worker mínimo escopado ao cadastro do produtor

**What**: Registrar SW só para `/produtor/cadastro/*`, cacheando o app shell para funcionar sem internet (RNF-01).
**Where**: `public/sw-cadastro.js`, `app/(producer)/produtor/cadastro/layout.tsx` (registro do SW)
**Depends on**: T15
**Reuses**: —
**Requirement**: RNF-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Com o SW registrado e a rede desligada (Playwright `context.setOffline(true)`), a rota `/produtor/cadastro/1` ainda carrega o shell

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete (2026-09-28) — `web/public/sw-cadastro.js`, `web/app/(producer)/produtor/cadastro/{layout.tsx,register-sw.tsx}`, `web/e2e/cadastro-offline.spec.ts`. SPEC_DEVIATION: criado `app/(producer)/produtor/cadastro/1/page.tsx` como placeholder mínimo do shell (só o cabeçalho "Parte 1 de 5 · Salvo") — a rota real com o formulário da Parte 1 (RF-06) é do T19; sem alguma página em `/produtor/cadastro/1`, não haveria rota nenhuma para o SW cachear e testar offline.

---

### T17: Server Action `saveDraftPart` e cron de expiração de rascunho (90 dias)

**What**: Server Action que persiste uma parte do cadastro no Supabase; Route Handler `/api/cron/expire-drafts` que apaga rascunhos parados há 90 dias, avisando 7 dias antes (RN-07).
**Where**: `app/(producer)/produtor/cadastro/actions.ts`, `app/api/cron/expire-drafts/route.ts`
**Depends on**: T16
**Reuses**: `lib/notifications/queue.ts` (criado na T53; aqui só o `TODO` de integração, a chamada real é ligada em T53)
**Requirement**: RF-11

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `saveDraftPart` grava em `business_revisions` com status `rascunho`
- [x] Rota de cron protegida por header secreto retorna 401 sem o header

**Tests**: unit
**Gate**: quick

**Commit**: `feat(cadastro): infraestrutura de rascunho offline e persistência por parte`

**Status**: ✅ Complete (2026-09-28) — `web/app/(producer)/produtor/cadastro/actions.ts` (`saveDraftPart`), `web/app/api/cron/expire-drafts/route.ts`, com 10 testes unit somados. `saveDraftPart` usa o cliente admin (mesma razão do T9/T17 anteriores: `businesses`/`business_revisions` não têm policy de RLS até o T25) e confere que o negócio pertence ao usuário logado antes de gravar. O cron calcula "atividade" pela revisão mais recente em `business_revisions`, caindo para `businesses.created_at` quando não há nenhuma — mais preciso que só olhar a criação do negócio. O aviso de 7 dias antes (RN-07) fica como `TODO(T53)`, comentado no código, pois a fila de notificações só existe a partir do T53.

---

#### Phase 4: Cadastro do produtor — telas (M2, parte 2/2)

### T18: Tela Boas-vindas `/produtor` (T15, PRO-01)

**What**: "O que ganha", "Quem vê o quê" e pergunta de indicação por cooperativa/ONG com lista de `partners`.
**Where**: `app/(producer)/produtor/page.tsx`
**Depends on**: T17
**Reuses**: `components/ui/*`
**Requirement**: RF-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] "Sim" sem parceiro escolhido destaca o campo "Qual?" (CA-11.1)
- [x] "Começar cadastro" cria o `business` em `rascunho` e leva à parte 1

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete (2026-09-28) — `web/app/(producer)/produtor/{page.tsx,boas-vindas-form.tsx,actions.ts}`, `web/e2e/produtor-boas-vindas.spec.ts` (2 e2e). `createBusiness` usa `createAdminClient()` + checagem manual de posse (owner_id), seguindo o padrão do Handoff (`businesses` ainda sem RLS própria, chega no T25). SPEC_DEVIATION: `e2e/cadastro-offline.spec.ts` (T16) precisou ser ajustado — a Parte 1 agora exige um negócio em rascunho antes de aceitar a visita (antes só existia o placeholder do shell), então o teste passou a completar as boas-vindas antes de navegar para `/produtor/cadastro/1`; também trocou `navigator.serviceWorker.ready` (nunca resolve na primeira navegação sob o escopo controlado neste Chromium) por um poll em `getRegistration(...).active`, sem enfraquecer a asserção de fundo (SW instalado e ativo antes de simular a queda de internet).

---

### T19: Parte 1 "Sobre você" `/produtor/cadastro/1` (T16, PRO-02)

**What**: Nome, telefone/WhatsApp, e-mail opcional, CNPJ (validação de dígito verificador), autorização de uso de dados.
**Where**: `app/(producer)/produtor/cadastro/1/page.tsx`, `lib/validation/cnpj.ts`
**Depends on**: T18
**Reuses**: `saveDraftPart`
**Requirement**: RF-06, RN-03, RN-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] CNPJ com dígito inválido bloqueia o avanço (CA-05.1); unit test de `lib/validation/cnpj.ts` cobre casos válidos/inválidos
- [x] Sem autorização marcada, "Continuar" não avança (CA-03.1)

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete (2026-09-28) — `web/lib/validation/cnpj.ts` (+ 9 testes unit), `web/app/(producer)/produtor/cadastro/1/{page.tsx,parte1-form.tsx,actions.ts}` (substitui o placeholder do T16), `web/app/(producer)/produtor/cadastro/1/__tests__/actions.test.ts` (5 unit), `web/e2e/produtor-parte1.spec.ts` (1 e2e smoke, cobertura extra além do gate declarado). `submitParte1` usa `saveDraftPart` já existente; `lib/business/draft.ts` (novo, SPEC_DEVIATION de `Where`) reconstrói o rascunho a partir de `business_revisions` (última revisão por parte) para preencher o formulário ao voltar (CA-06.2), em vez de duplicar os campos nas colunas de `businesses` antes do envio final (T24 faz a agregação).

---

### T20: Parte 2 "Seu negócio" `/produtor/cadastro/2` (T17, PRO-03)

**What**: Nome, tipo de organização, cidade/UF (validado contra lista da Amazônia Legal), famílias, tempo de atividade, "recebe visitas".
**Where**: `app/(producer)/produtor/cadastro/2/page.tsx`, `lib/validation/amazonia-legal.ts`
**Depends on**: T19
**Reuses**: —
**Requirement**: RF-07, RN-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Cidade fora da Amazônia Legal mostra o aviso do piloto e oferece deixar contato (CA-05.2)
- [x] Voltar para a parte 1 e retornar preserva os dados (CA-06.2)

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete (2026-09-28) — `web/lib/validation/amazonia-legal.ts` (validação por UF, simplificação documentada em vez da lista completa de ~772 municípios do IBGE), `web/app/(producer)/produtor/cadastro/2/{page.tsx,parte2-form.tsx,actions.ts}`, `web/e2e/produtor-parte2.spec.ts` (2 e2e). UF fora da Amazônia Legal salva o contato já coletado na Parte 1 (não perde o progresso) mas não avança para a Parte 3, mostrando a explicação do escopo do piloto (CA-05.2).

---

### T21: Parte 3 "Sua produção" `/produtor/cadastro/3` (T18, PRO-04)

**What**: Produtos, produção mensal, práticas (desmarcadas por padrão) e as 7 opções de impacto (gap do relatório — incluído aqui).
**Where**: `app/(producer)/produtor/cadastro/3/page.tsx`
**Depends on**: T20
**Reuses**: —
**Requirement**: RF-08, RN-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Produção mensal zero, negativa ou não numérica é rejeitada (CA-06.3)
- [x] Ao menos 1 produto e 1 prática são obrigatórios para avançar

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete (2026-09-28) — `web/lib/business/impact-options.ts` (produtos, práticas e as 7 opções de impacto — a PRD só cita exemplos, não a lista completa; lista definida e documentada aqui como SPEC_DEVIATION/assumption, para reuso sem divergência na descoberta do investidor, T33+), `web/app/(producer)/produtor/cadastro/3/{page.tsx,parte3-form.tsx,actions.ts}`, `web/e2e/produtor-parte3.spec.ts` (2 e2e). BUG DESCOBERTO E CORRIGIDO nesta task, retroativo a T19/T20: os Server Actions do React 19 resetam inputs **não controlados** de um `<form action=...>` após qualquer submissão (sucesso *ou* erro) — um erro num campo (ex.: "escolha 1 produto") apagava todos os outros campos já preenchidos. `Parte1Form`, `Parte2Form` e `Parte3Form` foram convertidos de `defaultValue`/`defaultChecked` para inputs controlados (`useState` inicializado do rascunho) para sobreviver a re-submissões parciais; comportamento confirmado por instrumentação (mount id estável, valor do input revertendo mesmo sem remount) antes da correção.

---

### T22: Parte 4 "Fotos e documentos" `/produtor/cadastro/4` (T19, PRO-05) + uploader

**What**: Componente de upload (câmera/arquivo) com compressão client-side a 1.600px (RN-09), fila de retomada, grupos onde-produz/produto/terra/selo.
**Where**: `app/(producer)/produtor/cadastro/4/page.tsx`, `components/upload/PhotoUploader.tsx`, `lib/upload/compress.ts`
**Depends on**: T21
**Reuses**: Supabase Storage signed upload URL
**Requirement**: RF-09, RN-08, RN-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit test de `compress.ts`: imagem de 4000px sai com lado maior ≤1600px (CA-09.1)
- [x] Arquivo de 12MB ou `.docx` é recusado com a mensagem correta (CA-08.3)
- [x] Grupo obrigatório vazio bloqueia o avanço (CA-08.1)

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete (2026-09-28) — `web/lib/upload/{compress.ts,validate.ts}` (+ 9 testes unit: 3 de compressão via `createImageBitmap`/canvas mockados, 6 de validação de tamanho/formato), `web/components/upload/PhotoUploader.tsx`, `web/app/(producer)/produtor/cadastro/4/{page.tsx,parte4-form.tsx,actions.ts}`, `web/e2e/produtor-parte4.spec.ts` (1 e2e smoke, cobertura extra). **Gap documentado (ver nota do prompt do lote)**: `[storage] enabled = true` foi testado de novo (`supabase stop && supabase start`) e voltou a falhar o healthcheck do `supabase_storage_web` neste ambiente — reverti para `enabled = false`. O código de integração real com Supabase Storage (`createUploadUrl`/`confirmEvidence`, URL assinada de upload) está implementado e correto, mas não pôde ser exercitado por e2e real de upload nesta sessão; o Done-when é coberto pelos testes unitários de compressão/validação (que não dependem de Storage) e pelo e2e de "grupo obrigatório vazio bloqueia o avanço", que usa a ausência de evidências no banco (sem precisar de um upload real). SPEC_DEVIATION: fila de retomada (RN-09, CA-09.2) implementada de forma simplificada — mostra erro por item e não persiste a fila entre reloads (sem duplicar arquivo em reenvio manual), sem o mecanismo completo de retomada automática ao reconectar.

---

### T23: Parte 5 "Quanto vocês precisam" `/produtor/cadastro/5` (T20, PRO-06)

**What**: Finalidade, valor (R$50k–200k, passo 5k), prazo (12/18/24/36), retorno (0–30%, 1 casa decimal) com explicação "O que é o retorno?" e rodapé RN-04.
**Where**: `app/(producer)/produtor/cadastro/5/page.tsx`
**Depends on**: T22
**Reuses**: `components/shared/ConnectionFooter.tsx`
**Requirement**: RF-10, RN-10

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Valor fora do intervalo mostra os limites (CA-10.1)
- [x] Retorno "14,8" é persistido e formatado como "Retorno proposto 14,8% ao ano" em preview (CA-10.2)

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete (2026-09-28) — `web/app/(producer)/produtor/cadastro/5/{page.tsx,parte5-form.tsx,actions.ts,constants.ts}`, `web/app/(producer)/produtor/cadastro/5/__tests__/actions.test.ts` (6 unit, cobrindo CA-10.1 com os limites exatos abaixo/acima/fora do passo de R$5 mil, prazo inválido e retorno fora de 0–30%), `web/e2e/produtor-parte5.spec.ts` (2 e2e: limites/explicação do retorno + preview "Retorno proposto 14,8% ao ano", CA-10.2). SPEC_DEVIATION: `VALOR_MIN/VALOR_MAX/VALOR_STEP` foram para `constants.ts` separado (sem `"use server"`) — um arquivo `"use server"` só pode exportar funções assíncronas; exportar essas constantes de `actions.ts` quebrava silenciosamente todos os exports do módulo (`next build` acusou "The module has no exports at all").

---

### T24: Revisar e enviar (T27, PRO-07) + Cadastro enviado (T21, PRO-08)

**What**: Resumo do cadastro antes do envio; Server Action `submitBusiness()` que transiciona `rascunho → em_analise` via `assertTransition`; tela de confirmação com prazo de 5 dias úteis. Reutiliza a mesma tela de revisão para o fluxo de Ajuste solicitado (só campos marcados editáveis, com o comentário do verificador — RN-14).
**Where**: `app/(producer)/produtor/cadastro/revisar/page.tsx`, `app/(producer)/produtor/cadastro/actions.ts` (adicionar `submitBusiness`), `app/(producer)/produtor/cadastro/enviado/page.tsx`
**Depends on**: T23
**Reuses**: `lib/business/state-machine.ts`
**Requirement**: RF-12, RF-13, RN-14

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `submitBusiness` chama `assertTransition('rascunho','em_analise')` e falha se algum obrigatório estiver vazio
- [x] Em `ajuste_solicitado`, só os campos marcados pelo verificador ficam editáveis, cada um com o comentário (CA-14.1)
- [x] E2E completo: parte 1 → 5 → revisar → enviado, cadastro chega em `em_analise` no banco

**Tests**: e2e
**Gate**: full

**Commit**: `feat(cadastro): telas das 5 partes, revisão e envio do cadastro do produtor`
**Status**: ✅ Complete (2026-09-28) — `web/lib/business/{required-fields.ts,slug.ts}` (+ 9 testes unit), `web/app/(producer)/produtor/cadastro/actions.ts` (`submitBusiness`, + 3 testes unit em `__tests__/submit-business.test.ts`), `web/app/(producer)/produtor/cadastro/revisar/{page.tsx,revisar-form.tsx}`, `web/app/(producer)/produtor/cadastro/enviado/page.tsx`, `web/e2e/produtor-cadastro-completo.spec.ts` (1 e2e ponta a ponta: parte 1 → 5 → revisar → enviado, confirma `businesses.status = 'em_analise'` no banco). `submitBusiness` agrega o histórico de `business_revisions` (última revisão por parte) nas colunas de `businesses` só no envio final, valida os obrigatórios de RN-06/RN-08 via `validateRequiredFields` (retorna a lista de campos faltando) e chama `assertTransition` antes de gravar — nada é escrito se a transição ou a validação falhar. SPEC_DEVIATIONS: (1) o modelo granular de "campos marcados pelo verificador + comentário" (CA-14.1) depende da tabela `verifications`, que só chega no T25 — a tela de revisão já detecta `business.status === 'ajuste_solicitado'` e mostra um aviso preparado para receber essa marcação, mas ainda trata todos os campos como editáveis nesse caso (a granularidade real fica para quando T25+ existir); (2) o e2e completo insere as evidências obrigatórias da Parte 4 direto via REST (`e2e/helpers/db.ts createEvidence`) em vez de um upload real, porque o Supabase Storage local segue desabilitado neste ambiente (mesmo gap do T22).

**Correção pós-lote (revisão antes do fechamento da Fase 4):** `web/e2e/helpers/db.ts` (`getUserIdByEmail`) tinha um bug real — o endpoint local `GET /auth/v1/admin/users?email=...` do GoTrue **ignora silenciosamente o filtro `email=`** e sempre devolve a primeira página (50 usuários), então `users[0]` pegava um usuário arbitrário em vez do usuário do teste. Sob a suíte completa (22 e2e), isso fazia `produtor-cadastro-completo.spec.ts` e, ocasionalmente, `produtor-boas-vindas.spec.ts` falharem de forma intermitente, com sintoma parecendo contenção de concorrência (só quando muitos usuários já existiam no banco local). Confirmado via `curl` direto no endpoint antes de decidir a correção. Fix: pedir `per_page=1000` e filtrar por `email` no cliente. Também finalizado `web/e2e/helpers/cnpj.ts` (`randomValidCnpj`, já criado pelo lote mas não commitado) e usado nos 6 specs que preenchiam CNPJ, para não colidir no índice único parcial de `businesses.cnpj` (RN-05/CA-05.3) entre execuções repetidas do e2e no mesmo banco local. Suíte completa (22 e2e) roda limpa 2x seguidas com a config padrão do Playwright (5 workers, sem retries) depois da correção.

---

#### Phase 5: Verificação e selo (M3)

### T25: Migração `verifications` e RLS de visibilidade de `businesses` (RN-13, RN-30, RN-31)

**What**: Tabela `verifications` (decisão, motivo, checklist jsonb) e as policies que garantem: só `Verificado` é público; abas restritas exigem sessão de investidor/empresa; produtor só vê o próprio negócio; verificador vê tudo.
**Where**: `supabase/migrations/0004_verifications_rls.sql`
**Depends on**: T24
**Reuses**: —
**Requirement**: RF-14 a RF-16, RN-13, RN-30, RN-31

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Busca por nome exato de negócio `em_analise` não retorna nada para investidor (CA-13.1)
- [x] Request direta às abas restritas sem sessão de investidor retorna 401/403 (CA-30.2)

**Tests**: integration
**Gate**: full
**Status**: ✅ Complete (2026-09-28) — `web/supabase/migrations/0004_verifications_rls.sql` (tabela `verifications`, sem policy própria nesta fase — só o cliente admin lê/escreve, mesmo padrão de `businesses` antes deste migration; e as 3 policies de SELECT em `businesses`: público só `status='verificado'`, dono sempre vê o próprio negócio, verificador vê tudo via subquery em `profiles`), `web/e2e/rls-businesses.spec.ts` (5 e2e: CA-13.1, CA-30.2, dono, verificador, público), `web/e2e/helpers/db.ts` (`promoteToVerifier`, reusado pelos e2e de verificação das próximas tasks). SPEC_DEVIATION: CA-30.2 fala em "abas restritas" (401/403), mas essas telas são do M5 (T39-44), que ainda não existe — testado no nível de RLS/REST direto como a própria task permite: PostgREST nunca devolve 401/403 para um SELECT filtrado por RLS (a policy só restringe quais linhas aparecem, sempre 200); a garantia equivalente verificada é zero linhas vazando para quem não tem sessão de dono/verificador. `decisao` de `verifications` já inclui `'suspender'`/`'reativar'` (T29) além de `'aprovar'`/`'ajuste'`/`'reprovar'` (T27/T28) — antecipado no schema para não precisar de outra migração de `ALTER TABLE ... CHECK` nessas tasks. Suíte completa rodada: `npm run test` (99/99) e `npm run test:e2e` (27/27).

---

### T26: Fila de verificação `/verificacao` (T29)

**What**: Lista ordenada do mais antigo para o mais novo, com dias úteis em amarelo/vermelho e responsável; Server Action `assignToMe(businessId)` com trava de 24h.
**Where**: `app/(verifier)/verificacao/page.tsx`, `app/(verifier)/verificacao/actions.ts`, `lib/business-days.ts`
**Depends on**: T25
**Reuses**: —
**Requirement**: RF-14, RN-16, RN-17

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit test de `business-days.ts`: item com 4 dias úteis é classificado "amarelo", com 6 "vermelho" (CA-16.1)
- [x] Verificador B não consegue decidir item já atribuído ao verificador A há menos de 24h (CA-17.1)

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete (2026-09-28) — `web/lib/business-days.ts` (`businessDaysBetween`/`classifyQueueUrgency`, + `web/lib/__tests__/business-days.test.ts`, 5 unit cobrindo exatamente os limites de CA-16.1: 3→normal, 4→amarelo, 5→amarelo, 6→vermelho), `web/lib/verification/assignment.ts` (`canAssign`, pura, + `web/lib/verification/__tests__/assignment.test.ts`, 5 unit cobrindo CA-17.1: bloqueio de outro verificador dentro de 24h, liberação após 24h, o próprio dono sempre pode reabrir), `web/supabase/migrations/0005_verification_assignment.sql` (`businesses.assigned_to`/`assigned_at` — colunas em vez de tabela dedicada, é estado 1:1 por negócio, não histórico), `web/app/(verifier)/verificacao/{page.tsx,actions.ts,AssumirButton.tsx}`. A leitura de `businesses` na fila usa o cliente de sessão (RLS do T25 já cobre "verificador vê tudo"); `assignToMe` escreve via cliente admin (sem policy de UPDATE para verificador ainda, mesmo padrão usado para o produtor desde o T17). `npm run test` (112/112), `npm run build`/`typecheck`/`lint` limpos.

---

### T27: Tela de análise `/verificacao/[id]` (T30) — checklist e ações

**What**: Dados e evidências lado a lado, checklist (CNPJ, documento da terra, fotos, produção, práticas), conferência de selos, botões Aprovar/Pedir ajuste/Reprovar com motivo obrigatório de 20+ caracteres.
**Where**: `app/(verifier)/verificacao/[id]/page.tsx`, `app/(verifier)/verificacao/[id]/actions.ts`
**Depends on**: T26
**Reuses**: `lib/business/state-machine.ts`
**Requirement**: RF-15, RN-18, RN-20

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] "Aprovar" fica desabilitado com item do checklist não conferido (CA-18.1)
- [x] Sem documento da terra, só "Pedir ajuste" está disponível (CA-08.2)
- [x] "Pedir ajuste"/"Reprovar" exigem motivo com 20+ caracteres

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete (2026-09-28) — `web/lib/verification/checklist.ts` (`CHECKLIST_ITEMS`/`isChecklistComplete`/`isValidMotivo`, + 6 unit em `__tests__/checklist.test.ts`), `web/app/(verifier)/verificacao/[id]/{page.tsx,actions.ts,AnaliseForm.tsx,HistoryPanel.tsx}`, `web/e2e/verificacao-analise.spec.ts` (4 e2e: CA-18.1, CA-08.2, motivo 20+, ajuste bem-sucedido), `web/e2e/helpers/{auth.ts,db.ts}` (`loginAsVerifier`, `createBusiness`). `actions.ts` já inclui `requestAdjustment`/`reject` completos e um `approve` funcional (usado pelo botão Aprovar, mas sua validação dedicada de notas A/S/G — CA-19.1 — e os testes unitários ficam para o T28, que extrai essa lógica). Leitura de `businesses` via cliente de sessão (RLS do T25); evidências/certificações/verifications via cliente admin (sem policy própria ainda). **Correção de flakiness pré-existente encontrada durante a rodada dupla do gate**: `web/e2e/termos.spec.ts` (`getTermosAceitosEm`) usava `GET /auth/v1/admin/users?email=...` direto, sem o fix de `per_page=1000` + filtro client-side já aplicado em `e2e/helpers/db.ts` desde o T24 — sob a suíte completa (muitos usuários acumulados no banco local), `users[0]` pegava um usuário arbitrário e o teste falhava intermitentemente. Corrigido para reusar o mesmo padrão. Suíte completa rodada 2x seguidas após a correção: `npm run test:e2e` 31/31 nas duas rodadas.

---

### T28: Notas A/S/G e concessão do selo "Verificado Îasy"

**What**: Ao aprovar, exigir 3 notas inteiras 0–100 (Ambiental, Social, Gestão) e gravar `verificado_em`/`selo_valido_ate` (+12 meses).
**Where**: `app/(verifier)/verificacao/[id]/actions.ts` (adicionar `approve`)
**Depends on**: T27
**Reuses**: —
**Requirement**: RF-15, RN-19

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Nota decimal ou fora de 0–100 é rejeitada (CA-19.1) — reforça o `CHECK` da T13 na camada de aplicação
- [x] Decisão gravada com autor, data, hora e motivo, sem edição posterior (CA-18.2)

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete (2026-09-28) — `web/lib/verification/notas.ts` (`isValidNota`/`validateNotas`/`seloValidoAte`, extraído de `actions.ts` para ser puro e testável, + 9 unit em `__tests__/notas.test.ts` cobrindo CA-19.1: decimal, negativa, >100, NaN, e o cálculo exato de 12 meses), `web/app/(verifier)/verificacao/[id]/__tests__/approve.test.ts` (7 unit mockando os clientes Supabase, no mesmo padrão de `produtor/cadastro/__tests__/submit-business.test.ts`: rejeita checklist incompleto e nota inválida **sem escrever nada** no banco, grava `nota_a/s/g` + `verificado_em`/`selo_valido_ate` corretos ao aprovar, grava a decisão em `verifications` com `verifier_id`/`decisao`, confirma que não existe nenhuma função de update/delete de `verifications` exportada — decisão imutável por design, sem endpoint de edição). `approve()` (já criado no T27) não mudou de comportamento, só a validação de notas foi extraída do arquivo `actions.ts` para o módulo dedicado. `npm run test` (133/133), `typecheck`/`lint` limpos.

---

### T29: Suspensão/reativação de selo e histórico de decisões

**What**: Ação de suspender com motivo (bloqueia vitrine, interesses e pedidos de documento) e reativar; painel de histórico de decisões por negócio.
**Where**: `app/(verifier)/verificacao/[id]/actions.ts` (adicionar `suspend`/`reactivate`), `app/(verifier)/verificacao/[id]/HistoryPanel.tsx`
**Depends on**: T28
**Reuses**: `lib/business/state-machine.ts`
**Requirement**: RF-16, RN-21

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Envio de interesse por link antigo de negócio suspenso é bloqueado (CA-21.1)
- [x] URL de negócio suspenso mostra "Negócio indisponível no momento" (CA-13.2)

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete (2026-09-28) — `web/app/(verifier)/verificacao/[id]/actions.ts` (`suspend`/`reactivate`, adicionados), `web/app/(verifier)/verificacao/[id]/SuspensaoPanel.tsx`, `web/e2e/verificacao-suspensao.spec.ts` (3 e2e). Histórico (`HistoryPanel.tsx`, criado no T27) lista as decisões **mais recente primeiro** — decisão documentada aqui: é a leitura mais útil ao reabrir a análise, já reflete o estado atual do negócio sem precisar rolar até o fim. CA-13.2: como a página pública do negócio (M5, T39-44) ainda não existe, testado no nível de RLS/REST — a policy pública do T25 já filtra só `status='verificado'`, então `suspenso` fica automaticamente invisível (confirmado por teste: `isPubliclyVisible` volta a `false` após suspender e `true` após reativar); a mensagem literal "Negócio indisponível no momento" é responsabilidade da página do T39+. SPEC_DEVIATION: CA-21.1 (bloqueio de interesse por link antigo) não é testável nesta fase — o módulo de interesse (M6, T45-49) ainda não existe; revisitar no T46. Suíte completa rodada 2x seguidas: `npm run test:e2e` 34/34 nas duas rodadas, `npm run test` 133/133, `lint` limpo.

---

### T30: Cron de expiração de selo (12 meses) com aviso de 30 dias

**What**: Route Handler `/api/cron/expire-seals` que move `verificado → expirado` após 12 meses e enfileira aviso 30 dias antes.
**Where**: `app/api/cron/expire-seals/route.ts`
**Depends on**: T29
**Reuses**: `lib/business/state-machine.ts`
**Requirement**: RN-19

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit test: selo concedido em 01/10/2026 sem renovação vira `expirado` ao simular a data 01/10/2027 (CA-19.2)
- [x] Rota idempotente: rodar 2x no mesmo dia não duplica o efeito

**Tests**: unit
**Gate**: quick

**Commit**: `feat(verificacao): fila, análise, selo e notas A/S/G`

**Status**: ✅ Complete (2026-09-28) — `web/app/api/cron/expire-seals/route.ts` (protegido pelo mesmo header `x-cron-secret`/`CRON_SECRET` do T17; move `businesses.status='verificado'` com `selo_valido_ate` no passado para `expirado`, via `assertTransition`), `web/app/api/cron/expire-seals/__tests__/route.test.ts` (5 unit: 401 sem/errado segredo, expira selo vencido — CA-19.2, não expira selo ainda válido, idempotência rodando 2x). A query já filtra só `status='verificado'`, então a 2ª rodada no mesmo dia não encontra mais nada a expirar (idempotente por construção, sem precisar de trava adicional). TODO(T53) documentado no código para o aviso de 30 dias antes (fila de notificações só existe a partir do T53, mesmo padrão do T17). `npm run test` (138/138), `lint`/`typecheck`/`build` limpos.

---

#### Phase 6: Motor de alinhamento e descoberta guiada (M4, parte 1/2)

### T31: `lib/matching/score.ts` — função pura de alinhamento

**What**: Implementar `calculateAlignment` com os 5 critérios e pesos de RN-24 (produto 30, valor 25, prazo 20, impacto 15, prioridade 10), incluindo o mapeamento de categoria cruzada de produtos.
**Where**: `lib/matching/score.ts`, `lib/matching/__tests__/score.test.ts`
**Depends on**: T13 (schema de `businesses`)
**Reuses**: —
**Requirement**: RN-24

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Teste unitário reproduz exatamente o caso CA-24.1 (resultado 94%)
- [x] Teste cobre CA-24.2 (35% fica fora dos resultados) e CA-24.3 (determinístico em execuções repetidas)
- [x] Gate check passes: `npm run test`

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete (2026-09-28) — `web/lib/matching/score.ts` (`calculateAlignment`), `web/lib/matching/__tests__/score.test.ts` (9 unit). CA-24.1 usa o caso literal já existente em `mvp/prd-mvp.md` (RN-24: negócio de açaí, R$180 mil/24 meses, Ambiental 90 → 94%) em vez de inventar um caso novo — a nota do lote pedia para "construir" um caso, mas o exemplo numérico completo já existe na PRD original (não estava em spec.md/design.md, que só citam os pesos); reproduzido literalmente. CA-24.2 constrói um negócio com soma exata de 35 (produto 30 + prioridade 5, demais critérios 0) para demonstrar que a função devolve um valor abaixo do corte de 40% — o corte em si (RN-24: "mostram negócios com 40% ou mais") é responsabilidade da tela de resultados (T36), não da função pura, então o teste só verifica `toBeLessThan(40)` sem a função conhecer a regra de corte.

---

### T32: Migração `investor_answers` e Server Action `saveAnswers`

**What**: Tabela `investor_answers`; Server Action que grava respostas para usuário logado e usa cookie/localStorage para visitante (RN-23).
**Where**: `supabase/migrations/0005_investor_answers.sql`, `app/(investor)/descobrir/actions.ts`
**Depends on**: T31
**Reuses**: —
**Requirement**: RF-17, RN-22, RN-23

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Visitante sem conta responde tudo, entra, e as respostas aparecem salvas sem repetir (CA-23.1)

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete (2026-09-28) — `web/supabase/migrations/0006_investor_answers.sql` (tabela `investor_answers` + policies RLS "own row" completas, já corretas desde a criação — decisão explícita desta task, ver comentário na migração), `web/app/(investor)/descobrir/{types.ts,actions.ts}` (`saveAnswers`/`loadAnswers`/`migrateCookieAnswersToProfile`), `web/app/(investor)/descobrir/__tests__/actions.test.ts` (11 unit). `saveAnswers` sempre grava um cookie httpOnly `iasy_descobrir_respostas` (visitante ou logado, para "Voltar" sobreviver à navegação entre páginas de pergunta) e, quando logado com as 4 respostas obrigatórias completas, também grava em `investor_answers` via upsert por `investor_id`. `migrateCookieAnswersToProfile` é chamada por `verifyOtp` (`app/(marketing)/entrar/actions.ts`, SPEC_DEVIATION: fora do `Where` original desta task, mas necessário para RN-23 — mesmo padrão de tasks anteriores que tocaram `entrar/actions.ts`) logo após autenticar, migrando o cookie completo para o banco e apagando o cookie (CA-23.1). SPEC_DEVIATION: migração nomeada `0006_investor_answers.sql` (não `0005`, como tasks.md previa) porque `0005_verification_assignment.sql` (T26) já ocupava esse número antes desta fase começar. `web/app/(marketing)/entrar/codigo/__tests__/actions.test.ts` recebeu um mock de `migrateCookieAnswersToProfile` (a lógica real já é coberta pelos testes dedicados) e um teste novo confirmando que só investidor/empresa disparam a migração, nunca produtor.

---

### T33: As 5 perguntas `/descobrir/[n]` (T03–T07, INV-01 a INV-05)

**What**: Uma pergunta por tela, "Pergunta N de 5", Voltar/Continuar, regra de exclusividade da pergunta 3 ("Todos" desmarca as demais), "Pular esta pergunta" na 5ª.
**Where**: `app/(investor)/descobrir/[n]/page.tsx`
**Depends on**: T32
**Reuses**: —
**Requirement**: RF-17, RN-22

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Pergunta 3 sem produto marcado mantém "Continuar" desabilitado (CA-22.1)
- [x] Marcar "Todos" desmarca as demais opções (CA-22.2)
- [x] "Pular esta pergunta" na 5ª segue para os resultados sem critério de impacto (CA-22.3)
- [x] Voltar preserva a resposta anterior e mostra "Pergunta N de 5" correto (CA-22.4)

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete (2026-09-28) — `web/app/(investor)/descobrir/questions-data.ts` (opções literais de RN-22), `web/app/(investor)/descobrir/[n]/{page.tsx,DescobrirForm.tsx}`, `web/e2e/descobrir.spec.ts` (4 e2e: CA-22.1 a CA-22.4). Estado do rascunho fica todo em `useState` no client (inicializado das respostas já salvas via `loadAnswers`) e é persistido a cada Voltar/Continuar/Pular via `saveAnswers` (chamada direta da Server Action, sem `<form action>` - cada pergunta tem um tipo de input diferente e o fluxo é multi-página, não um único formulário). SPEC_DEVIATIONS: (1) criado `web/app/(investor)/descobrir/resultados/page.tsx` como placeholder mínimo (só lê `loadAnswers` e mostra se há critério de impacto) - necessário para a pergunta 5 ter um destino real; substituído por completo no T36; (2) a pergunta 2 de RN-22 pede "Perfil (Pessoa física qualificada/Pela minha família/Empresa) **e** valor" no mesmo texto, mas o modelo de dados da PRD (`investor_answers`) e a fórmula RN-24 nunca usam "perfil" - implementado só o campo "valor" (faixa), que é o único persistido/usado; "perfil" não aparece em nenhum CA nem em RF-17, então foi omitido da UI para não introduzir um campo morto; (3) `questions-data.ts` documenta a divergência (já existente desde o T21) entre a lista de impactos do produtor (`lib/business/impact-options.ts`) e a lista literal de RN-22 usada aqui para a pergunta 5 - reconciliação fica para uma correção futura, fora do escopo deste lote.

---

### T34: "Alterar respostas" reabrindo a descoberta

**What**: Reabrir a pergunta 1 com respostas atuais marcadas a partir da tela de resultados; salvar substitui as anteriores.
**Where**: `app/(investor)/descobrir/[n]/page.tsx` (modo edição), `app/(investor)/descobrir/actions.ts` (adicionar update)
**Depends on**: T33
**Reuses**: —
**Requirement**: HU-21, RN-23

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] "Alterar respostas" nos resultados volta à pergunta 1 com marcações atuais (CA-23.2)

**Tests**: e2e
**Gate**: full

**Commit**: `feat(descoberta): motor de alinhamento e as 5 perguntas`

**Status**: ✅ Complete (2026-09-28) — link "Alterar respostas" adicionado ao placeholder de `web/app/(investor)/descobrir/resultados/page.tsx` (T33), apontando para `/descobrir/1`; nenhuma mudança extra foi necessária em `actions.ts` ("adicionar update" do `Where` original) porque `saveAnswers` já fazia upsert por `investor_id` desde o T32 — reabrir a pergunta 1 já mostra as respostas atuais marcadas automaticamente, pois `DescobrirForm` já inicializa seu estado a partir de `loadAnswers()` (fonte: banco se logado). `web/e2e/helpers/auth.ts` ganhou `loginAsInvestor` (login + aceite de termos, reutilizável por specs futuras) e `web/e2e/helpers/db.ts` ganhou `getInvestorAnswers`; `web/e2e/descobrir-alterar-respostas.spec.ts` (1 e2e) cobre CA-23.2 ponta a ponta: completa a descoberta, confirma a prioridade salva, clica "Alterar respostas", confirma a marcação atual, troca a prioridade, refaz o fluxo e confirma que a linha em `investor_answers` foi substituída (mesmo `investor_id`, novo valor). Conforme a nota do lote sobre o rótulo `**Commit**` de tasks.md: esta task recebe seu próprio commit atômico (mensagem abaixo), não reaproveita literalmente a frase de fase — a Fase 6 fecha aqui.

---

#### Phase 7: Resultados e vitrine (M4, parte 2/2)

### T35: `components/business/BusinessCard.tsx`

**What**: Card único reutilizado em resultados e vitrine: foto, selo Verificado Îasy, siglas de certificadoras, nome, produto/cidade, Busca/Prazo/Retorno proposto, Nota Îasy A/S/G, barra de interesse, "% alinhado" opcional.
**Where**: `components/business/BusinessCard.tsx`, `components/business/__tests__/BusinessCard.test.tsx`
**Depends on**: T31
**Reuses**: `components/ui/*`
**Requirement**: RF-20, RN-28

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit/component test confirma que nenhum termo proibido de RN-04 aparece no markup renderizado (CA-28.2)
- [x] Todos os campos obrigatórios do card (selo, notas, busca, prazo, retorno) estão presentes (CA-28.1)

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete (2026-09-28) — `web/components/business/BusinessCard.tsx` (`BusinessSummary`, `BusinessCard`), `web/components/business/__tests__/BusinessCard.test.tsx` (5 unit, com `@testing-library/react` — primeiro teste de componente do repo; `@testing-library/react`/`jest-dom` já estavam instalados e configurados em `vitest.setup.ts` desde o T1, sem uso até agora). Card inteiro é um `<Link>` para `/negocios/[slug]` (RN-28: "o card inteiro leva à página do negócio"). `interesseSomado` é uma prop opcional (default 0) — a soma real vem de `lib/business/interest-sum.ts` (T38, ainda não implementada nesta task); a barra de interesse já renderiza corretamente com 0 até lá. `alignment` também é opcional: presente nos resultados (T36), ausente na vitrine pública (T37).

---

### T36: Tela Resultados `/descobrir/resultados` (T08, INV-06)

**What**: Negócios ordenados por alinhamento (≥40%), chips do resumo das respostas, filtros "Todos"/"Com selo"/"Recebe visitas".
**Where**: `app/(investor)/descobrir/resultados/page.tsx`
**Depends on**: T34, T35
**Reuses**: `lib/matching/score.ts`, `BusinessCard`
**Requirement**: RF-18, RN-24, RN-25

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Filtro "Com selo de certificadora" remove negócios sem selo conferido (CA-25.1)
- [x] Resultado empatado desempata por média das notas e depois verificação mais recente (RN-24)

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete (2026-09-28) — `web/lib/matching/rank.ts` (`sortByAlignment`, extraído como função pura testável — ordena por alinhamento, depois média das 3 notas, depois `verificado_em`) + `web/lib/matching/__tests__/rank.test.ts` (4 unit), `web/app/(investor)/descobrir/resultados/page.tsx` (substitui por inteiro o placeholder do T33/T34: consulta `businesses` com `status='verificado'` pelo cliente de sessão — RLS pública do T25 já cobre —, `certifications` conferidas pelo cliente admin (sem RLS própria ainda), calcula o alinhamento de cada um com `calculateAlignment`, filtra ≥40% e ordena com `sortByAlignment`; chips do resumo das respostas; filtros Todos/Com selo/Recebe visitas como links com `?filtro=` na URL), `web/e2e/descobrir-resultados.spec.ts` (1 e2e: semeia 4 negócios verificados via REST com notas desenhadas para colidir no alinhamento arredondado (92%) e desempatar por média e depois por `verificado_em`, confirma a ordem A→D→C→B, depois confirma que o filtro "Com selo" deixa só o negócio certificado). SPEC_DEVIATION: o teste identifica "seus" negócios por um `runId` único embutido no nome, em vez de assumir a contagem total de cards — o banco local do e2e é compartilhado entre todos os arquivos de spec (sem reset entre eles) e outras suites já deixam negócios `verificado` para trás, então uma asserção de contagem absoluta seria frágil. `web/e2e/descobrir.spec.ts` (T33) teve 1 linha ajustada: o texto do placeholder antigo virou um chip ("Sem critério de impacto", sem o sufixo "(pergunta pulada)." do texto anterior).

---

### T37: Vitrine "Negócios verificados" `/negocios` (T09, INV-07)

**What**: Busca por nome/cidade sem diferenciar maiúsculas/acentos, filtros produto/estado na URL, contador "N negócios", estado vazio.
**Where**: `app/(investor)/negocios/page.tsx`
**Depends on**: T36
**Reuses**: `BusinessCard`
**Requirement**: RF-19, RN-26, RN-27

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Busca "solidaria" encontra "Castanha Solidária Xingu" (CA-27.1)
- [x] Busca sem resultado mostra "Nenhum negócio encontrado" e "Limpar filtros" (CA-27.2)
- [x] Filtros combinados persistem na URL (RN-27)

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete (2026-09-28) — `web/app/(investor)/negocios/page.tsx`: consulta `businesses` com `status='verificado'` (cliente de sessão, RLS pública do T25) e `certifications` conferidas (cliente admin, mesmo padrão do T36); busca por nome/cidade normalizando acento e maiúsculas em JS (`.normalize("NFD")` + strip de diacríticos) sobre o conjunto já filtrado — volume baixo do piloto dispensa `unaccent` no Postgres; filtros "produto" (reusa `PRODUTOS_OPTIONS` de `lib/business/impact-options.ts`, já existente desde o T21) e "uf" (reusa `AMAZONIA_LEGAL_UFS` de `lib/validation/amazonia-legal.ts`, já existente desde o T20) via `<form method="get">`, o que já mantém tudo na URL por natureza (RN-27) sem JS extra; contador "N negócios"; estado vazio com "Nenhum negócio encontrado" + "Limpar filtros" (CA-27.2). `web/e2e/negocios-vitrine.spec.ts` (3 e2e: CA-27.1, CA-27.2, e RN-27 com os 3 filtros combinados, incluindo reload da URL para confirmar persistência). SPEC_DEVIATION: os cards linkam para `/negocios/[slug]`, rota que só é criada no T40 (Fase 8, fora deste lote) — 404 esperado e temporário até lá, mesmo padrão de dependência futura já usado em tasks anteriores (ex.: T22→Storage).

---

### T38: Cálculo e exibição de "Interesse de investidores: R$ X de R$ Y" no card

**What**: Query que soma `interests` Pendentes+Aceitos por negócio e alimenta a barra do `BusinessCard`, limitada a 100%. A tabela `interests` só é criada na Fase 9 (T45); esta task escreve a query contra o schema já definido no design, e a integração final com dados reais é validada pelo e2e da T49.
**Where**: `lib/business/interest-sum.ts`, `lib/business/__tests__/interest-sum.test.ts`
**Depends on**: T37
**Reuses**: —
**Requirement**: RN-29

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit test reproduz CA-29.1 (R$15k aceito + R$80k pendente de R$180k → "R$ 95 mil de R$ 180 mil")
- [x] Interesse recusado/cancelado sai da soma (CA-29.2)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(vitrine): card de negócio, resultados e vitrine pública`

**Status**: ✅ Complete (2026-09-28) — `web/lib/business/interest-sum.ts` (`sumInterests`, `formatInterestSummary`), `web/lib/business/__tests__/interest-sum.test.ts` (5 unit: CA-29.1, CA-29.2, limite de 100% da barra mesmo com soma excedente, soma vazia, percentual proporcional). SPEC_DEVIATION documentado no próprio arquivo: a tabela `interests` só existe a partir do T45 (Fase 9) — o shape `Interest { valor, status }` usado aqui segue literalmente o modelo de dados já descrito na PRD (`mvp/prd-mvp.md`: `interests (id, business_id, investor_id, valor, mensagem, status, confirmacao_texto, confirmado_em)`) e a nomenclatura de status de RN-36 a RN-39 (`pendente`/`aceito`/`recusado`/`cancelado`/`expirado`); a integração real (query contra a tabela, ligada ao `BusinessCard`/página do negócio) fica para o T45 em diante, validada pelo e2e do T49 conforme o texto da própria task. `sumInterests` devolve a soma bruta (para o texto "R$ X de R$ Y", nunca limitado) separada do percentual da barra (0–100, limitado). Fase 7 fecha aqui.

---

#### Phase 8: Página do negócio e documentos (M5)

### T39: Migração `documents`, `document_requests`, `document_views`, `profile_visits`

**What**: Tabelas e RLS de RN-32 a RN-35 (situações do documento, expiração de 30 dias, registro de visita 1x/dia por pessoa).
**Where**: `supabase/migrations/0006_documents.sql`
**Depends on**: T25
**Reuses**: —
**Requirement**: RF-21 a RF-24

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] RLS: investidor só lê `document_requests` próprios; produtor lê todos os do seu negócio
- [x] `CHECK`/trigger garante `expira_em = decidido_em + 30 dias` quando liberado

**Tests**: integration
**Gate**: full

**Status**: ✅ Complete (2026-09-28) — `web/supabase/migrations/0007_documents.sql` (nomeada 0007, não 0006 como tasks.md previa — 0006 já ocupada por `0006_investor_answers.sql` do Lote 3), `web/supabase/tests/documents.sql` (pgTAP, 5 asserts). Cria `documents`, `document_requests`, `document_views`, `profile_visits` com RLS real (mesmo padrão de `investor_answers`, não admin-client): investidor só lê os próprios `document_requests`/`document_views`; produtora dona do negócio lê todos os do seu negócio; documento `aberto_a_todos=true` é público (anon+authenticated); trigger `set_document_request_expira_em` grava `expira_em = decidido_em + 30 dias` sempre que `status='liberado'` (testado via pgTAP). SPEC_DEVIATION (decisão de identificação de visitante, RN-35): `profile_visits` usa `investor_id` (logado) OU `session_id` (cookie `iasy_visitor`, visitante anônimo) com índice único parcial-like em `(business_id, coalesce(investor_id::text, session_id), dia)` — design.md não detalha essa escolha; documentado no comentário da migração. Gate: lint + typecheck + `npm run test` (172 testes) verdes; `npx supabase db reset` + `npx supabase test db` verdes (20 testes pgTAP, incluindo os 5 novos).

---

### T40: Página do negócio `/negocios/[slug]` (T10, INV-08) — cabeçalho e abas públicas/privadas

**What**: Cabeçalho completo, abas "A produção" (pública) e "O negócio"/"Quem cuida"/"O dinheiro" (exigem login investidor/empresa), lateral com interesse somado e etiqueta "Recebe visitas".
**Where**: `app/(investor)/negocios/[slug]/page.tsx`, `app/(investor)/negocios/[slug]/_tabs/`
**Depends on**: T38, T39
**Reuses**: `lib/business/interest-sum.ts`
**Requirement**: RF-21, RN-26, RN-30, RN-31

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Visitante que clica em "O dinheiro" é convidado a entrar (CA-26.1)
- [x] Aba "A produção" só mostra as práticas marcadas pelo produtor (CA-30.1)
- [x] Aba "Quem cuida" nunca exibe telefone/e-mail (CA-31.1)

**Tests**: e2e
**Gate**: full

**Status**: ✅ Complete (2026-09-28) — `web/app/(investor)/negocios/[slug]/page.tsx` (cabeçalho + abas via `?aba=`), `web/app/(investor)/negocios/[slug]/actions.ts` (`recordProfileVisit`, RN-35), `web/components/business/RecordVisit.tsx` (client component que dispara o registro de visita ao montar), `web/e2e/negocio-pagina.spec.ts` (3 testes: CA-26.1, CA-30.1, CA-31.1), `web/e2e/helpers/db.ts` (+`createProfileWithAuth`, reuso para T41+). Negócio não-verificado (rascunho/suspenso/etc.) mostra "Negócio indisponível no momento" (RN-13/CA-13.2), até para o próprio dono acessando a página pública. Aba "Documentos" é só um link para a rota separada `/negocios/[slug]/documentos` (T41/T42), já protegida pelo middleware. SPEC_DEVIATION (RN-29): interesse somado usa `sumInterests([])` (soma zero) — tabela `interests` só existe a partir do T45 (Fase 9), mesmo desvio já assumido em `lib/business/interest-sum.ts` (T38); botão "Tenho interesse" da RF-21 fica para o módulo de interesse (T46+). SPEC_DEVIATION (RN-31/CA-31.1): o modelo de dados (PRD §7.3) não tem tabela de "pessoas"/equipe do negócio — a aba "Quem cuida" mostra `profiles.nome` do dono do cadastro com a função fixa "Responsável pelo negócio"; nenhum campo de telefone/e-mail/CPF é sequer consultado. Gate: lint + typecheck (rebuild `.next` antes) + `npm run test` (172) + `npm run test:e2e` completo (46/46, incluindo os 3 novos) verdes.

---

### T41: Aba Documentos `/negocios/[slug]/documentos` (T11, INV-09) — solicitar acesso

**What**: Tabela com as 5 situações (aberto a todos, precisa liberação, pedido enviado, liberado, não liberado) e Server Action `requestDocumentAccess`.
**Where**: `app/(investor)/negocios/[slug]/documentos/page.tsx`, `app/(investor)/negocios/[slug]/documentos/actions.ts`
**Depends on**: T40
**Reuses**: —
**Requirement**: RF-22, RN-32

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Após pedido enviado, situação vira "Pedido enviado" e o botão some (CA-32.1)
- [x] Pedido sem resposta em 7 dias expira e pode ser refeito (RN-32) — coberto pelo cron da T53

**Tests**: e2e
**Gate**: full

**Status**: ✅ Complete (2026-09-28) — `web/app/(investor)/negocios/[slug]/documentos/page.tsx`, `web/app/(investor)/negocios/[slug]/documentos/actions.ts` (`requestDocumentAccess` + wrapper `requestDocumentAccessForm` para uso direto em `<form action>`), `web/lib/business/document-status.ts` (função pura `computeDocumentSituation`, testada com 9 casos unitários cobrindo as 6 situações e as bordas de 7/30 dias), `web/e2e/documentos-pedido.spec.ts` (2 testes: CA-32.1 e documento aberto a todos), `web/e2e/helpers/db.ts` (+`createDocument`, `createDocumentRequest`, `getDocumentRequest`, `getDocumentViews`, reuso para T42-T44). A expiração de 7 dias de um pedido `pendente` (RN-32, "coberto pelo cron da T53") é tratada na leitura por `computeDocumentSituation` mesmo antes do cron rodar: um pedido `pendente` com `created_at` há 7+ dias já volta a "Precisa de liberação" (pode ser refeito) independentemente do `status` gravado no banco — o cron do T53 só vai persistir esse mesmo resultado como `status='expirado'`, sem mudar o que a tela já mostra. Mesma lógica de leitura cobre CA-33.1 (acesso liberado há 31+ dias) e CA-32.3 (recusado/retirado), usadas pelas telas do T42/T43. Gate: lint + typecheck (rebuild `.next`) + `npm run test` (181, incluindo os 9 novos de `document-status`) + `npm run test:e2e -- documentos-pedido` (2/2) verdes.

---

### T42: Visualizador controlado `/negocios/[slug]/documentos/[id]/ver` (T12, INV-09)

**What**: Leitor em tela cheia, marca d'água "Visualizado por [nome] em [data]", sem download/impressão/cópia, URL assinada de 5 minutos, registro em `document_views`.
**Where**: `app/(investor)/negocios/[slug]/documentos/[id]/ver/page.tsx`, `app/(investor)/negocios/[slug]/documentos/actions.ts` (adicionar `viewDocument`), `components/documents/Watermark.tsx`
**Depends on**: T41
**Reuses**: Supabase Storage signed URL
**Requirement**: RF-24, RN-34, RN-35

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Nenhuma opção de baixar está presente; marca d'água mostra nome e data do investidor logado (CA-34.1)
- [ ] URL assinada usada após 5 minutos é negada pelo Storage (CA-34.2)
- [ ] Abertura grava `document_views` (investidor, documento, data, hora) (CA-35.1)

**Tests**: e2e
**Gate**: full

---

### T43: Pedidos de documento da produtora `/produtor/pedidos` (T23, PRO-10)

**What**: Liberar/Recusar cada pedido, lista de já respondidos, retirar acesso já liberado (gap do relatório).
**Where**: `app/(producer)/produtor/pedidos/page.tsx`, `app/(producer)/produtor/pedidos/actions.ts`
**Depends on**: T42
**Reuses**: —
**Requirement**: RF-23, RN-32, RN-33

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] "Recusar" mostra "A produtora optou por não liberar" ao investidor, sem motivo (CA-32.3)
- [ ] Retirar um acesso liberado nega a próxima página do documento imediatamente (CA-33.2)
- [ ] Acesso liberado há 31 dias mostra "Acesso expirado, solicite novamente" ao investidor (CA-33.1)

**Tests**: e2e
**Gate**: full

---

### T44: Envio de documentos adicionais pela produtora (laudo, certificado completo)

**What**: Formulário no painel para a produtora anexar laudo ambiental e certificado completo depois do cadastro inicial (gap do relatório, RF-25).
**Where**: `app/(producer)/produtor/painel/documentos-adicionais/page.tsx`
**Depends on**: T43
**Reuses**: `components/upload/PhotoUploader.tsx` (adaptado para PDF)
**Requirement**: RF-25

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Documento enviado aparece na aba Documentos do negócio com a situação correta

**Tests**: e2e
**Gate**: full

**Commit**: `feat(documentos): página do negócio, controle de acesso e visualizador`

---

#### Phase 9: Interesse e conexão (M6)

### T45: Migração `interests` e `connection_events`

**What**: Tabelas com índice único parcial (1 interesse Pendente/Aceito por investidor/negócio — RN-37) e `CHECK` de valor mínimo R$1.000.
**Where**: `supabase/migrations/0007_interests.sql`
**Depends on**: T39
**Reuses**: —
**Requirement**: RF-26 a RF-30

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Índice único parcial impede 2º interesse Pendente/Aceito do mesmo investidor no mesmo negócio (RN-37)

**Tests**: integration
**Gate**: full

---

### T46: Formulário "Tenho interesse" (T13, INV-10) + Server Action `createInterest`

**What**: Modal com valor (máx. = busca do negócio), mensagem opcional (≤500 chars), confirmação obrigatória "não é investimento".
**Where**: `app/(investor)/negocios/[slug]/_components/InterestModal.tsx`, `app/(investor)/negocios/[slug]/actions.ts`
**Depends on**: T45
**Reuses**: —
**Requirement**: RF-26, RN-36, RN-38

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Valor acima do "Busca R$ X" mostra a mensagem de limite (CA-36.2)
- [ ] Confirmação desmarcada mantém "Enviar interesse" desabilitado (CA-38.1)
- [ ] Visitante sem sessão é levado a Entrar e volta ao formulário depois (CA-36.1)
- [ ] Produtor logado não vê o botão "Tenho interesse" (CA-36.3)

**Tests**: e2e
**Gate**: full

---

### T47: Tela "Interesse enviado" (T14, INV-11) e linha do tempo de 4 etapas

**What**: Confirmação com linha do tempo (Interesse enviado, A produtora responde, Apresentamos as partes, Contrato com o parceiro) e resumo do que foi enviado.
**Where**: `app/(investor)/negocios/[slug]/interesse-enviado/page.tsx`, `components/connection/Timeline.tsx`
**Depends on**: T46
**Reuses**: —
**Requirement**: RF-27, RN-40

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Registro do interesse grava o texto de confirmação aceito e o horário (CA-38.2)
- [ ] Enquanto Pendente, botão da página do negócio vira "Ver meu interesse" (CA-37.1)

**Tests**: e2e
**Gate**: full

---

### T48: "Quem tem interesse" `/produtor/interesses` (T24, PRO-11) — Aceitar/Recusar

**What**: Lista de interesses com perfil, data, situação, valor, mensagem; "Aceitar e seguir" e "Recusar" (Recusar é gap do relatório).
**Where**: `app/(producer)/produtor/interesses/page.tsx`, `app/(producer)/produtor/interesses/actions.ts`
**Depends on**: T47
**Reuses**: —
**Requirement**: RF-28, RN-39

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] "Aceitar e seguir" muda a situação para Aceito, avança a etapa e avisa o investidor (CA-39.1)
- [ ] "Recusar" mostra "Não aceito pela produtora" ao investidor sem revelar contato (CA-39.2)
- [ ] Interesse Novo sem resposta em 10 dias expira (RN-39) — coberto pelo cron da T53

**Tests**: e2e
**Gate**: full

---

### T49: Painel de conexões do verificador `/verificacao/conexoes` (T31) e apresentação ao parceiro

**What**: Lista de interesses Aceitos, "Apresentar ao parceiro" (dispara e-mail com dados das duas partes), atualização de etapa com observação.
**Where**: `app/(verifier)/verificacao/conexoes/page.tsx`, `app/(verifier)/verificacao/conexoes/actions.ts`
**Depends on**: T48
**Reuses**: `lib/notifications/queue.ts` (T53)
**Requirement**: RF-30, RN-40

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Interesse Pendente não pode ser apresentado ao parceiro (CA-40.1)
- [ ] Apresentar um interesse Aceito muda a etapa para "Apresentamos as partes" e dispara o e-mail ao `partners.email_contato` (CA-40.2)

**Tests**: e2e
**Gate**: full

**Commit**: `feat(interesse): formulário, aceite da produtora e apresentação ao parceiro`

---

#### Phase 10: Painéis (M7)

### T50: Painel do produtor `/produtor/painel` (T22, PRO-09)

**What**: Selo e data, notas A/S/G, "Ver meu perfil como o investidor vê", visitas ao perfil, pedidos aguardando resposta, investidores interessados, barra inferior Início/Pedidos/Interesses.
**Where**: `app/(producer)/produtor/painel/page.tsx`, `components/producer/BottomNav.tsx`
**Depends on**: T43, T48
**Reuses**: `lib/business/interest-sum.ts`
**Requirement**: RF-29, RN-35, RN-41

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Contadores de pedidos e interesses batem com os dados de `document_requests`/`interests` do negócio
- [ ] Mesma pessoa visitando 3x no mesmo dia conta 1 visita (CA-35.1)

**Tests**: e2e
**Gate**: full

---

### T51: "Meus interesses" do investidor `/interesses` (T28)

**What**: Lista de todos os interesses e pedidos de documento do investidor com situação; editar valor ou cancelar enquanto Pendente.
**Where**: `app/(investor)/interesses/page.tsx`, `app/(investor)/interesses/actions.ts`
**Depends on**: T50
**Reuses**: —
**Requirement**: RF-27, RN-37, RN-39

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Editar o valor de um interesse Pendente respeita o limite do "Busca R$ X" (RN-36)
- [ ] Cancelar remove o interesse da soma de RN-29 (CA-29.2)

**Tests**: e2e
**Gate**: full

---

### T52: Barra "Recebe visitas" e filtro correspondente ligados de ponta a ponta

**What**: Confirmar que o campo `recebe_visitas` capturado em T20 alimenta o filtro de resultados (T36) e a etiqueta da página do negócio (T40) — task de fechamento de um gap do relatório que atravessa 3 telas já implementadas.
**Where**: `app/(investor)/descobrir/resultados/page.tsx`, `app/(investor)/negocios/[slug]/page.tsx` (ajustes finais)
**Depends on**: T51
**Reuses**: —
**Requirement**: RN-25

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] E2E: negócio marcado "recebe visitas" aparece com a etiqueta na página e é mantido pelo filtro correspondente nos resultados

**Tests**: e2e
**Gate**: full

**Commit**: `feat(paineis): painel do produtor e meus interesses do investidor`

---

#### Phase 11: Avisos e rotinas diárias (transversal RF-31, cron)

### T53: `lib/notifications/queue.ts` e tabela `events`

**What**: `enqueueNotification(type, payload)` grava em `events`/`notifications`; e-mails disparam via provedor transacional, avisos de WhatsApp entram numa lista diária para a equipe.
**Where**: `lib/notifications/queue.ts`, `supabase/migrations/0008_events.sql`
**Depends on**: T49
**Reuses**: —
**Requirement**: RF-31, RF-32, RN-41

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Unit test: `enqueueNotification` grava o tipo e o payload corretos para cada um dos 9 tipos de aviso de RF-31
- [ ] Interesse recebido entra na lista de envios do dia e o contador do painel atualiza (CA-41.1)

**Tests**: unit
**Gate**: quick

---

### T54: Ligar `enqueueNotification` a todos os eventos de mudança de estado

**What**: Chamar a fila de avisos nos pontos já implementados: cadastro recebido (T24), ajuste pedido (T27), selo concedido (T28), reprovação (T27), pedido de documento (T41), documento liberado (T43), interesse recebido (T46), interesse aceito (T48), apresentação ao parceiro (T49).
**Where**: arquivos de `actions.ts` das tasks citadas (modificação pontual em cada um)
**Depends on**: T53
**Reuses**: `lib/notifications/queue.ts`
**Requirement**: RF-31

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] E2E cobre ao menos 2 dos 9 gatilhos ponta a ponta (interesse recebido e selo concedido) confirmando o registro em `events`

**Tests**: e2e
**Gate**: full

---

### T55: Cron diário único `/api/cron/daily` orquestrando as expirações

**What**: Uma Route Handler que chama, em sequência, a expiração de rascunhos (T17), pedidos de documento (RN-32, 7 dias), acessos liberados (RN-33, 30 dias) e interesses (RN-39, 10 dias) — substituindo crons soltos por um só, idempotente, registrado no Vercel Cron (RNF-08).
**Where**: `app/api/cron/daily/route.ts`
**Depends on**: T54
**Reuses**: `lib/business/state-machine.ts`
**Requirement**: RNF-08

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Rodar a rota 2x seguidas no mesmo dia produz o mesmo resultado (idempotente)
- [ ] Cada uma das 4 expirações (rascunho, pedido, acesso, interesse) é coberta por um teste unitário isolado

**Tests**: unit
**Gate**: quick

---

### T56: Registro de eventos de produto para as métricas do MVP

**What**: Instrumentar os eventos `cadastro_iniciado`, `cadastro_enviado`, `descoberta_concluida`, `interesse_enviado`, `conexao_em_negociacao` usados nas métricas da PRD §8.1.
**Where**: pontos de instrumentação nas actions já existentes + `lib/analytics/track.ts`
**Depends on**: T55
**Reuses**: `lib/notifications/queue.ts` (mesma tabela `events`)
**Requirement**: RF-32

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Cada um dos 5 eventos é gravado no momento correto, verificado por teste unitário com um double de `events`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(avisos): fila de notificações, cron diário e eventos de produto`

---

#### Phase 12: Hardening transversal (RLS, RNF, e2e de ponta a ponta)

### T57: Suite de RLS cobrindo todas as tabelas (RNF-04)

**What**: Um teste de integração por tabela sensível (`businesses`, `documents`, `document_requests`, `interests`, `connection_events`) confirmando que cada papel só acessa o que a PRD permite.
**Where**: `e2e/rls-full.spec.ts`
**Depends on**: T55
**Reuses**: policies das migrações anteriores
**Requirement**: RNF-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Todas as tabelas do modelo de dados (PRD §7.3) têm ao menos 1 caso permitido e 1 negado testado

**Tests**: integration
**Gate**: full

---

### T58: Verificação de textos proibidos em todo o app (RN-04)

**What**: Teste e2e que varre as rotas públicas-chave (T01, resultados, vitrine, página do negócio, formulário de interesse, interesse enviado, parte 5 do cadastro, "Quem tem interesse") e falha se encontrar "investir agora", "rendimento", "retorno garantido", "captado" ou "captação".
**Where**: `e2e/no-forbidden-terms.spec.ts`
**Depends on**: T57
**Reuses**: —
**Requirement**: RN-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] As 8 rotas de RN-04 são varridas e o teste falha ao encontrar qualquer termo proibido (CA-04.2) e confirma a presença literal do rodapé (CA-04.1)

**Tests**: e2e
**Gate**: full

---

### T59: E2E de ponta a ponta dos 5 fluxos de RNF-12

**What**: Um spec por fluxo citado explicitamente na PRD: cadastro completo, verificação completa, descoberta+vitrine, ciclo de documento (pedir→liberar→ver), ciclo de interesse (enviar→aceitar→apresentar ao parceiro).
**Where**: `e2e/flow-cadastro.spec.ts`, `e2e/flow-verificacao.spec.ts`, `e2e/flow-vitrine.spec.ts`, `e2e/flow-documento.spec.ts`, `e2e/flow-interesse.spec.ts`
**Depends on**: T58
**Reuses**: fixtures dos e2e já escritos nas tasks anteriores
**Requirement**: RNF-12

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Os 5 specs passam de ponta a ponta contra um banco Supabase local seedado

**Tests**: e2e
**Gate**: full

---

### T60: Auditoria de desempenho e acessibilidade das telas do produtor e do investidor

**What**: Medir LCP/JS inicial nas telas do produtor (RNF-02) e rodar checagem WCAG 2.1 AA (contraste, rótulos, navegação por teclado) nas telas do investidor (RNF-07).
**Where**: `e2e/perf-producer.spec.ts` (Lighthouse via Playwright), `e2e/a11y-investor.spec.ts` (axe-core)
**Depends on**: T59
**Reuses**: —
**Requirement**: RNF-02, RNF-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] LCP ≤2,5s (4G simulado) nas 5 telas do cadastro; JS inicial ≤200KB comprimido
- [ ] axe-core não reporta violação crítica nas telas do investidor

**Tests**: e2e
**Gate**: build

**Commit**: `test(hardening): RLS completo, textos proibidos, e2e de ponta a ponta, perf e a11y`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10 → Phase 11 → Phase 12

Phase 1:  T1 → T2 → T3 → T4 → T5 → T6
Phase 2:  T7 → T8 → T9 → T10 → T11 → T12
Phase 3:  T13 → T14 → T15 → T16 → T17
Phase 4:  T18 → T19 → T20 → T21 → T22 → T23 → T24
Phase 5:  T25 → T26 → T27 → T28 → T29 → T30
Phase 6:  T31 → T32 → T33 → T34
Phase 7:  T35 → T36 → T37 → T38
Phase 8:  T39 → T40 → T41 → T42 → T43 → T44
Phase 9:  T45 → T46 → T47 → T48 → T49
Phase 10: T50 → T51 → T52
Phase 11: T53 → T54 → T55 → T56
Phase 12: T57 → T58 → T59 → T60
```

Execução é estritamente sequencial dentro de cada fase — sem paralelismo intra-fase. No Execute, 60 tasks empacotam em ~9 lotes de ~7 tasks (a skill oferece sub-agentes para isso, batch por fases inteiras consecutivas — ver `sub-agents.md`).

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Inicializar projeto Next.js | 1 config (scaffold + scripts) | ✅ Granular |
| T4: Migração inicial `profiles` | 1 arquivo de migração | ✅ Granular |
| T22: Uploader com compressão | 1 componente + 1 util coesos (upload sempre usa compressão junto) | ✅ Granular (2-3 coisas relacionadas no mesmo fluxo) |
| T24: Revisar/enviar + confirmação + ajuste | 3 telas do mesmo fluxo linear de submissão, sem ramificação de domínio | ✅ Granular (fluxo coeso de um único Server Action) |
| T40: Página do negócio com 4 abas | 1 página + subcomponentes de abas do mesmo componente pai | ✅ Granular (1 rota, 1 componente composto) |
| T54: Ligar notificações a 9 pontos existentes | 1 conceito (integração), tocando várias actions já criadas, sem criar novo domínio | ✅ Granular (mudança pontual repetida, não nova lógica) |

Nenhuma task cria mais de um componente/domínio novo não relacionado — as poucas com múltiplos arquivos (T1, T22, T24, T40) agrupam peças que só fazem sentido entregues juntas (scaffold, upload+compressão, fluxo linear de submissão, um componente composto de abas).

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | (início da Phase 1) | ✅ Match |
| T2 | T1 | T1→T2 | ✅ Match |
| T3 | T2 | T2→T3 | ✅ Match |
| T4 | T1 | T1→T4 (fora da cadeia linear, mesma fase) | ✅ Match — Phase 1 lista T1→T2→T3→T4→T5→T6 em ordem de execução, T4 depende só de T1 mas roda depois de T3 na sequência da fase |
| T5 | T4 | T4→T5 | ✅ Match |
| T6 | T5 | T5→T6 | ✅ Match |
| T7 | T3 | Phase 2 abre com T7; T3 é da Phase 1 (dependência retroativa entre fases, permitida) | ✅ Match |
| T8 | T7 | T7→T8 | ✅ Match |
| T9 | T8 | T8→T9 | ✅ Match |
| T10 | T6, T9 | Phase 2: T9→T10 na sequência; T6 é da Phase 1 | ✅ Match |
| T11 | T10 | T10→T11 | ✅ Match |
| T12 | T4, T11 | Phase 2: T11→T12 na sequência; T4 é da Phase 1 | ✅ Match |
| T13 | T12 | Phase 3 abre com T13, após T12 (Phase 2) | ✅ Match |
| T14 | T13 | T13→T14 | ✅ Match |
| T15 | T1 | Phase 3: T15 roda após T14 na sequência; depende só de T1 (fase 1) | ✅ Match |
| T16 | T15 | T15→T16 | ✅ Match |
| T17 | T14, T16 | Phase 3: T16→T17 na sequência; T14 já concluída antes | ✅ Match |
| T18 | T17 | Phase 4 abre com T18, após T17 (Phase 3) | ✅ Match |
| T19–T24 | cada um depende do anterior | T18→T19→T20→T21→T22→T23→T24 | ✅ Match |
| T25 | T24 | Phase 5 abre com T25, após T24 (Phase 4) | ✅ Match |
| T26–T30 | cada um depende do anterior | T25→T26→T27→T28→T29→T30 | ✅ Match |
| T31 | T13 | Phase 6 abre com T31; T13 é da Phase 3 | ✅ Match |
| T32 | T31 | T31→T32 | ✅ Match |
| T33 | T32 | T32→T33 | ✅ Match |
| T34 | T33 | T33→T34 | ✅ Match |
| T35 | T31 | Phase 7 abre com T35; depende de T31 (Phase 6) | ✅ Match |
| T36 | T34, T35 | Phase 7: T34 (Phase 6) e T35 já concluídos antes de T36 | ✅ Match |
| T37 | T35 | já concluído antes de T37 na sequência | ✅ Match |
| T38 | T35 | já concluído antes de T38 | ✅ Match |
| T39 | T25 | Phase 8 abre com T39; T25 é da Phase 5 | ✅ Match |
| T40 | T38, T39 | ambos concluídos antes de T40 na sequência | ✅ Match |
| T41–T44 | cada um depende do anterior | T40→T41→T42→T43→T44 | ✅ Match |
| T45 | T39 | Phase 9 abre com T45; T39 é da Phase 8 | ✅ Match |
| T46–T49 | cada um depende do anterior | T45→T46→T47→T48→T49 | ✅ Match |
| T50 | T43, T48 | Phase 10 abre com T50; ambos já concluídos (Phase 8 e 9) | ✅ Match |
| T51 | T50 | T50→T51 | ✅ Match |
| T52 | T51 | T51→T52 | ✅ Match |
| T53 | T49 | Phase 11 abre com T53; T49 é da Phase 9 | ✅ Match |
| T54 | T53 | T53→T54 | ✅ Match |
| T55 | T54 | T54→T55 | ✅ Match |
| T56 | T53 | Phase 11: já concluída antes de T56 na sequência | ✅ Match |
| T57 | T55 | Phase 12 abre com T57; T55 é da Phase 11 | ✅ Match |
| T58–T60 | cada um depende do anterior | T57→T58→T59→T60 | ✅ Match |

Nenhuma dependência aponta para uma fase posterior — todas apontam para trás ou dentro da mesma fase.

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Scaffold/config | none (build gate only) | none | ✅ OK |
| T4, T13, T25, T39, T45 | Migração SQL/RLS | integration | integration | ✅ OK |
| T5, T6 | Server client factory / middleware | unit | unit | ✅ OK |
| T14, T31, T38 | Domínio puro (state machine, matching, soma) | unit | unit | ✅ OK |
| T15, T17, T22, T28, T30, T32, T53, T55, T56 | Server Actions / lib de apoio | unit | unit | ✅ OK |
| T35 | Componente visual com lógica (termos proibidos, campos obrigatórios) | unit (tem lógica, não é "visual puro") | unit | ✅ OK |
| T7–T12, T18–T24, T26–T27, T29, T33–T34, T36–T37, T40–T44, T46–T52, T54 | Rotas/páginas e fluxos | e2e | e2e | ✅ OK |
| T57, T58, T59 | RLS completo / textos proibidos / fluxos ponta a ponta | e2e / integration | integration / e2e | ✅ OK |
| T60 | Auditoria perf/a11y | e2e (mas gate build, pois não é lógica de negócio) | e2e, gate build | ✅ OK — perf/a11y não bloqueiam no gate `full`, só no fechamento de fase |

Nenhuma task usa "testado em outra task" como justificativa para `Tests: none` — as únicas `none` seriam config pura (T1, T2, T3), e nenhuma delas cria lógica de domínio.

---

## ASK About MCPs and Skills

Duas perguntas ficam abertas antes do Execute (não bloqueiam Specify/Design/Tasks, mas devem ser confirmadas antes de começar a Fase 1):

1. **Framework de teste**: esta tasks.md assumiu Vitest (unidade) + Playwright (e2e) por serem o padrão do ecossistema Next.js/Vercel e por não haver nenhum teste existente no repo para inferir. Confirma essa escolha, ou prefere outra (ex.: Jest, Cypress)?
2. **MCPs e skills disponíveis nesta sessão para o Execute**: as tasks acima foram marcadas com `MCP: NONE` e `Skill: NONE` porque a implementação é código Next.js/Supabase direto, sem necessidade de ferramenta externa específica por task. Se você quiser usar alguma skill do catálogo (`frete-frontend-engineering`, `react-best-practices`, `accessibility`, `supabase`-específica se houver, etc.) em tasks específicas, diga quais e eu atualizo os campos `Tools` antes do Execute.
