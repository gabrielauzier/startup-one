# Website MVP Îasy Validation

**Date**: 2026-09-28
**Spec**: `.specs/features/website-mvp/spec.md`
**Diff range**: whole branch `feature/website-mvp` (the branch *is* the feature), verified at `355ac38`
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: FAIL ❌

---

## Task Completion

| Task | Status | Notes |
| --- | --- | --- |
| T1–T60 | ✅ Done (60/60) | All 60 tasks carry `**Status**: ✅ Complete`; `validate_tasks.py` → 0 errors, 42 granularity warnings |
| T48/T51 Done-when | ⚠️ | `tasks.md:1226` still `- [ ]` "Interesse Novo sem resposta em 10 dias expira (RN-39) — coberto pelo cron da T53". Implemented later in T55 (`lib/cron/expiration.ts:88`) but the checkbox was never ticked |
| T15 | ⚠️ Status claim not true | Status says the sync callback is "injetado por quem chama (o hook `useDraftSync` do T17)". `useDraftSync` does not exist; nothing in `app/` or `components/` imports `lib/offline/draft-store.ts` |
| T17 / T30 | ⚠️ Open TODO | `TODO(T53)` for the 7-day draft warning (`app/api/cron/expire-drafts/route.ts:12`) and the 30-day seal warning (`app/api/cron/expire-seals/route.ts:12`). T53/T55 explicitly left both open (`app/api/cron/daily/route.ts:30-39`) |
| T29 | ⚠️ Deferred and never revisited | `e2e/verificacao-suspensao.spec.ts:80-83` says the CA-21.1 interest block "revisitar no T46"; no test was added |

---

## Spec-Anchored Acceptance Criteria

Legend: ✅ PASS · ❌ GAP (no evidence, or not implemented) · ⚠️ partial/weak (evidence exists but does not pin the full spec outcome)

### P1: Entrada sem senha e escolha de perfil

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- | --- |
| 1 | WHEN visitante abre `/` | frase, 4 passos, 2 botões de caminho | `web/e2e/home.spec.ts:18` - `expect(getByRole("heading",{name:step})).toBeVisible()`; `:21-28` buttons | ✅ |
| 2 | Perfil não marcado → Entrar desabilitado | button disabled | `web/e2e/entrar.spec.ts:10` - `expect(entrarButton).toBeDisabled()` | ✅ |
| 3 | OTP 6 dígitos, **válido por 10 min**, até 5 tentativas | expiry = 600s | 6 digits: `web/supabase/config.toml:247` `otp_length = 6`; 5 tries: `web/app/(marketing)/entrar/codigo/__tests__/actions.test.ts:99`. **Expiry is `otp_expiry = 3600` (`web/supabase/config.toml:249`) = 60 min**, with no app-level 10-min check and no test | ❌ |
| 4 | Vencido ou errado 5x → novo código | input blocked | `web/e2e/entrar-codigo.spec.ts:53` - `expect(codeInput).toBeDisabled()` (wrong 5x). The "vencido" path is untested | ✅ (wrong-5x path) |
| 5 | Código confirmado p/ e-mail sem conta → cria conta c/ perfil | profile.role = escolhido | `web/e2e/entrar-codigo.spec.ts:57`; `web/app/(marketing)/entrar/codigo/__tests__/actions.test.ts:144` | ✅ |
| 6 | Redirect por perfil | investidor→descoberta/vitrine; produtor→boas-vindas/painel; verificador→fila | `web/app/(marketing)/entrar/__tests__/redirect.test.ts:17-47` | ✅ |
| 7 | Produtor em rota de investidor/verificador → "Sem permissão", API sem dados | 403 "Sem permissão" | `web/lib/auth/__tests__/roles.test.ts:28` (resolveAccess denies); impl `web/proxy.ts:52` returns `{error:"Sem permissão"}` 403 (no test asserts the response); API side via `web/e2e/rls-full.spec.ts:141` | ✅ (proxy response not asserted) |
| 8 | Parte 1 sem autorização → não avança | error, no advance | `web/app/(producer)/produtor/cadastro/1/__tests__/actions.test.ts:87` | ✅ |
| 9 | Investidor 1º acesso → aceite de Termos | redirect `/termos`, aceite gravado | `web/e2e/termos.spec.ts:79-91` - `expect(await getTermosAceitosEm(email)).not.toBeNull()`; `codigo/__tests__/actions.test.ts:234` | ✅ |

### P1: Cadastro do produtor em 5 partes

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- | --- |
| 1 | `/produtor` mostra ganhos e "Quem vê o quê" | both sections visible | impl `web/app/(producer)/produtor/page.tsx:40`; no assertion in `web/e2e/produtor-boas-vindas.spec.ts` | ❌ no evidence |
| 2 | Indicador "Parte N de 5 · Salvo" | text on every part | `web/e2e/cadastro-offline.spec.ts:77` - `getByText("Parte 1 de 5 · Salvo")` (part 1 only). Component is static: `web/components/cadastro/PartHeader.tsx:8` | ✅ |
| 3 | Campo obrigatório vazio → foco no 1º inválido + mensagem, não avança | focus + error + no advance | message/no-advance: `web/e2e/produtor-parte3.spec.ts:42,57`; focus impl `parte1-form.tsx:45`, but no `toBeFocused` assertion anywhere | ❌ focus unverified |
| 4 | Voltar e retornar preserva dados e fotos | values kept | `web/e2e/produtor-parte2.spec.ts:53-57` - `toHaveValue("Raimunda Souza")` (photos not covered) | ✅ |
| 5 | Produção ≤0/não numérica rejeitada | rejected | `web/e2e/produtor-parte3.spec.ts:39-46` | ✅ |
| 6 | Offline → salva em IndexedDB e mostra **"Salvo no celular"** | local save + label | **Not implemented in UI.** `saveLocalDraft` (`web/lib/offline/draft-store.ts:34`) has no caller in `app/`/`components/`; the string "Salvo no celular" does not exist in the codebase. Only unit: `web/lib/offline/__tests__/draft-store.test.ts:34` | ❌ |
| 7 | Conexão volta → sync automático, indicador volta a "Salvo" | auto sync | `flushWhenOnline` (`draft-store.ts:73`) has no caller; there is no `online` listener. Unit only: `draft-store.test.ts:71` | ❌ |
| 8 | Rascunho 90 dias → apaga, **avisando 7 dias antes** | delete + warning | delete: `web/app/api/cron/expire-drafts/__tests__/route.test.ts:76`; warning: `TODO(T53)` at `expire-drafts/route.ts:12`. Sensor M10 (90→60 days) **survived** | ❌ warning missing |
| 9 | ≥1 foto local + 1 produto; grupo vazio destacado, não avança | block | `web/e2e/produtor-parte4.spec.ts:35-38`; `web/lib/business/__tests__/required-fields.test.ts:36` | ✅ |
| 10 | >10MB ou formato inválido → recusa c/ mensagem | limit/format msg | `web/lib/upload/__tests__/validate.test.ts:16,24` | ✅ |
| 11 | Foto >1600px comprimida no aparelho | long side ≤1600 | `web/lib/upload/__tests__/compress.test.ts:50` | ✅ |
| 12 | Upload interrompido retomado sem duplicar | resume, no dup | impl comment `web/components/upload/PhotoUploader.tsx:62-64`; no test (Storage disabled per STATE) | ❌ no evidence |
| 13 | CNPJ DV inválido → "CNPJ inválido" | exact msg | `web/app/(producer)/produtor/cadastro/1/__tests__/actions.test.ts:70`; impl `cadastro/1/actions.ts:53` | ✅ |
| 14 | CNPJ já em rascunho/análise/verificado → bloqueia envio | blocked with feedback | Only a partial unique index, `web/supabase/migrations/0003_businesses.sql:60-62`. `businesses.cnpj` is written only at submit (`cadastro/actions.ts:142`), so drafts don't reserve the CNPJ. A violation surfaces as generic "Não foi possível enviar o cadastro". No test | ❌ |
| 15 | Valor 50–200k passo 5k, prazo {12,18,24,36}, retorno 0–30% 1 casa | bounds | `web/app/(producer)/produtor/cadastro/5/__tests__/actions.test.ts:69-101` | ✅ |
| 16 | Envio → confirmação c/ **5 dias úteis** e 3 próximos passos | text + 3 steps | `web/e2e/produtor-cadastro-completo.spec.ts:56` asserts heading "Recebemos seu cadastro" only; "5 dias úteis" (`enviado/page.tsx:10`) and the 3 steps are not asserted | ⚠️ weak |
| 17 | Ajuste solicitado → edita **somente campos marcados**, com comentário | per-field lock + comment | **Not implemented.** `web/app/(producer)/produtor/cadastro/revisar/page.tsx:8-13` shows a banner only and defers the per-field model; no field marking in `verificacao/[id]/actions.ts` or migrations | ❌ |

### P1: Verificação, selo e notas A/S/G

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- | --- |
| 1 | Fila ordenada mais antigo→novo, data, dias úteis, responsável | ordering + 3 columns | `web/e2e/flow-verificacao.spec.ts:38` asserts presence only; no test asserts order or columns | ❌ no evidence |
| 2 | >3 d.u. amarelo, >5 d.u. vermelho | thresholds | `web/lib/__tests__/business-days.test.ts:25-41` (3→normal, 4/5→amarelo, 6→vermelho) | ✅ |
| 3 | Abrir atribui por 24h; outro verificador bloqueado, vê quem analisa | lock 24h | `web/lib/verification/__tests__/assignment.test.ts:21,29,37` | ✅ (UI "quem analisa" not asserted) |
| 4 | Checklist incompleto → Aprovar desabilitado | disabled | `web/e2e/verificacao-analise.spec.ts:18,30,34`; `approve.test.ts:74` | ✅ |
| 5 | Sem CAR/DAP → só Pedir ajuste | approve hidden | `web/e2e/verificacao-analise.spec.ts:48-51` | ✅ |
| 6 | Aprovar exige notas inteiras 0–100; selo 12 meses | ints; +12 months | `web/app/(verifier)/verificacao/[id]/__tests__/approve.test.ts:89,105,120`; `web/e2e/flow-verificacao.spec.ts:67-71`; `web/lib/verification/__tests__/notas.test.ts:41` | ✅ |
| 7 | Ajuste/reprovação exige motivo ≥20 chars; imutável c/ autor/data | ≥20; immutable | `web/lib/verification/__tests__/checklist.test.ts:33-41`; `web/e2e/verificacao-analise.spec.ts:65-73`; `approve.test.ts:168` | ✅ |
| 8 | Selo de certificadora não conferido não aparece | hidden | impl filters `.eq("conferido", true)` at `descobrir/resultados/page.tsx:87`, `negocios/page.tsx:64`, `negocios/[slug]/page.tsx:157`; no test uses a `conferido: false` fixture | ❌ no evidence |
| 9 | Suspender → sai da vitrine, bloqueia interesses/pedidos, **avisa produtor e interessados** | 4 effects | vitrine: `web/e2e/verificacao-suspensao.spec.ts:36`. Interest block impl `negocios/[slug]/actions.ts:139`, untested (`verificacao-suspensao.spec.ts:80-83`). **No notification**: `suspend()` (`verificacao/[id]/actions.ts:272`) never calls `enqueueNotification` | ❌ partial |
| 10 | 12 meses sem renovação → Expirado, **aviso 30 dias antes** | expire + warning | expire: `web/app/api/cron/expire-seals/__tests__/route.test.ts:53`; warning `TODO(T53)` at `expire-seals/route.ts:12` | ❌ warning missing |

### P1: Descoberta guiada e vitrine

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- | --- |
| 1 | "Pergunta N de 5" + Voltar/Continuar | label | `web/e2e/descobrir.spec.ts:13,43,49,54` | ✅ |
| 2 | P3 sem opção → Continuar desabilitado | disabled | `web/e2e/descobrir.spec.ts:14` | ✅ |
| 3 | "Todos" desmarca as demais | exclusive | `web/e2e/descobrir.spec.ts:31-32` | ✅ |
| 4 | Pular P5 → sem critério de impacto | fixed 8 pts | `web/lib/matching/__tests__/score.test.ts:143`; `web/e2e/descobrir.spec.ts:58` | ✅ |
| 5 | Alinhamento 0–100 c/ pesos 30/25/20/15/10, inteiro, ≥40%, ordenado | formula + cutoff | `score.test.ts:39` `toBe(94)`; `web/e2e/descobrir-resultados.spec.ts:148` order. **Cutoff filter** (`resultados/page.tsx:14,130`) has no e2e fixture below 40%. Sensor **M1 (neighbor value band 10→0) survived** | ⚠️ partial |
| 6 | Função pura/determinística | same output | `score.test.ts:99-102` | ✅ |
| 7 | Visitante → respostas no navegador, migradas ao entrar | migrate | `web/app/(marketing)/entrar/codigo/__tests__/actions.test.ts:165`; `web/app/(investor)/descobrir/__tests__/actions.test.ts:184` | ✅ |
| 8 | "Alterar respostas" reabre P1 marcada; substitui | replace | `web/e2e/descobrir-alterar-respostas.spec.ts:42-53` | ✅ |
| 9 | Filtro "Com selo" oculta sem selo | filtered | `web/e2e/descobrir-resultados.spec.ts:157` - `toEqual(["A"])` | ✅ |
| 10 | Busca ignora caixa/acentos, combina c/ filtros na URL | match + URL | `web/e2e/negocios-vitrine.spec.ts:57,102-104` | ✅ |
| 11 | Sem resultados → "Nenhum negócio encontrado" + "Limpar filtros" | exact text | `web/e2e/negocios-vitrine.spec.ts:67-68` | ✅ |
| 12 | Card mostra selo, certs, nome, produto, cidade/UF, busca, prazo, retorno proposto, notas, barra | fields | `web/components/business/__tests__/BusinessCard.test.tsx:32,44` | ✅ |
| 13 | Só Verificado em vitrine/resultados/busca | status filter | `web/e2e/rls-businesses.spec.ts:124-125` - `expect(rows).toEqual([])` | ✅ |

### P1: Página do negócio e documentos

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- | --- |
| 1 | "A produção" pública; outras abas convidam a entrar | redirect `/entrar` | `web/e2e/negocio-pagina.spec.ts:31,63` | ✅ |
| 2 | Só práticas marcadas | filtered | `web/e2e/negocio-pagina.spec.ts:31-32` | ✅ |
| 3 | "Quem cuida": nome/função, nunca tel/e-mail/CPF | no PII | `web/e2e/negocio-pagina.spec.ts:95-101` | ✅ |
| 4 | Solicitar → "Pedido enviado" e notifica produtora | label + notify | `web/e2e/documentos-pedido.spec.ts:34-36` (notification not asserted) | ✅ |
| 5 | 7 dias sem resposta → expira, pode refazer | 7d | `web/lib/business/__tests__/document-status.test.ts:25`; `web/lib/cron/__tests__/expiration.test.ts:40`. Sensor M6 (cron 7→4 days) **survived** | ✅ (cron boundary weak) |
| 6 | Libera por 30 dias; retirar tem efeito imediato | 30d; immediate | `web/e2e/produtor-pedidos.spec.ts:103`; `document-status.test.ts:35,48` | ✅ |
| 7 | >30 dias → "Acesso expirado, solicite novamente" | exact text | `web/e2e/produtor-pedidos.spec.ts:138` | ✅ |
| 8 | Só na tela, sem download/impressão/cópia, marca d'água, URL assinada ≤5 min | watermark; TTL 300 | `web/e2e/documento-visualizador.spec.ts:50-55`; `web/lib/documents/__tests__/signed-url.test.ts:26` (TTL 300, mocked Storage) | ✅ |
| 9 | Abrir registra investidor/doc/data | `document_views` row | `web/e2e/documento-visualizador.spec.ts:14` (CA-35.1 test) | ✅ |
| 10 | Mesma pessoa várias vezes/dia = 1 visita | count 1 | `web/e2e/produtor-painel.spec.ts:79` - `toHaveText("1")` | ✅ |

### P1: Demonstrar interesse e conexão com o parceiro financeiro

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- | --- |
| 1 | Visitante "Tenho interesse" → Entrar → volta ao formulário | redirect back | `web/e2e/interesse-criar.spec.ts:68,105` | ✅ |
| 2 | Produtor não vê botão | hidden | `web/e2e/interesse-criar.spec.ts:31` | ✅ |
| 3 | Valor > busca → mensagem exata | exact msg | `web/e2e/interesse-criar.spec.ts:46` - `toHaveText("O valor não pode passar do que o negócio busca")` | ✅ |
| 4 | Confirmação desmarcada → Enviar desabilitado | disabled | `web/e2e/interesse-criar.spec.ts:49-56` | ✅ |
| 5 | Máx. 1 Pendente/Aceito; botão vira "Ver meu interesse" | uniqueness + label | `web/e2e/interesse-criar.spec.ts:59` (CA-37.1); impl `negocios/[slug]/actions.ts:163` | ✅ |
| 6 | Registra texto/horário aceito + linha do tempo 4 etapas | 4 steps | `web/e2e/interesse-criar.spec.ts:113-118` | ✅ |
| 7 | "Aceitar e seguir" → Aceito, etapa avança, **avisa investidor** | 3 effects | status: `web/e2e/produtor-interesses.spec.ts:54`; event: only via `web/e2e/flow-interesse.spec.ts:85` (the CA-39.1 test titled "grava o evento de conexão" does not assert it). Notification to the investor is untested: sensor **M13 survived** | ⚠️ partial |
| 8 | Recusa → "Não aceito pela produtora" sem contato | exact text | `web/e2e/produtor-interesses.spec.ts:57` | ✅ |
| 9 | Novo 10 dias sem resposta → expira | 10d | `web/lib/cron/__tests__/expiration.test.ts:78` (11d vs 2d). Sensor **M5 (10→5 days) survived** | ✅ (boundary weak) |
| 10 | Apresentar Aceito → e-mail ao parceiro, etapa "Apresentamos as partes"; Pendente não | 2 outcomes | `web/e2e/verificacao-conexoes.spec.ts:35,70-72` | ✅ |
| 11 | Soma Pendente+Aceito "R$ X de R$ Y", barra ≤100% | format + cap | `web/lib/business/__tests__/interest-sum.test.ts:5,31` | ✅ |
| 12 | Recusado/cancelado sai da soma | excluded | `interest-sum.test.ts:17`; `web/e2e/interesses-investidor.spec.ts:40` | ✅ |
| 13 | Painel: selo+data, notas, visitas, pedidos, interessados | 5 widgets | `web/e2e/produtor-painel.spec.ts:41-45,79` | ✅ |

### P2 stories

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- | --- |
| CA-11.1 | "Sim" sem parceiro → destaca "Qual?" | highlight | `web/e2e/produtor-boas-vindas.spec.ts:15-16` | ✅ |
| CA-11.2 | Verificador vê parceiro que indicou (investidor não) | shown to verifier | **Not implemented**: no reference to `indicado_por`/parceiro in `web/app/(verifier)/verificacao/[id]/` | ❌ |
| RN-25 | Filtro "Recebe visitas" | filtered | `web/e2e/recebe-visitas.spec.ts:82-83` | ✅ |
| RN-21 | Suspender com motivo registrado | motivo ≥20 | `web/e2e/verificacao-suspensao.spec.ts:36,52-55` | ✅ |
| RF-30 | `/verificacao/conexoes` lista Aceitos c/ etapa e **permite observações** | list + notes | list: `web/e2e/verificacao-conexoes.spec.ts:67-70`; observation action `conexoes/actions.ts:148-168` has no test | ❌ no evidence |

**Tally**: 77 ACs (72 P1 + 5 P2): **59 ✅, 15 ❌, 3 ⚠️ partial/weak**.

### ⚠️ Spec-precision gaps

1. **RN-24 sub-scores**: spec AC "Descoberta #5" names only the top-level weights. The partial scores the code and tests rely on (neighbor value band = 10, prazo within +12 months = 8, skipped impact = 8, "equilíbrio" = average) come from the PRD, not `spec.md`, so the spec gives no oracle for them. The neighbor-band branch is also untested (M1 survived).
2. **CA-21.1 "avisar produtor e interessados"**: the spec defines no channel or template for the suspension notice, and RF-31's 9 notification types don't include one. That's why the implementer could not map it.

**Status**: ❌ Gaps present / ⚠️ Spec-precision gaps flagged

---

## Discrimination Sensor

Scratch: temporary `git worktree` at `/Volumes/MacOnlySSD/dev/fiap/verifier-mut-scratch` (HEAD `355ac38`), removed afterwards. Unit mutants ran with `vitest` on the covering dirs. E2E mutants ran with Playwright against the scratch's **own** build on port 3100 (`reuseExistingServer: false`, changed in scratch only), after an unmutated control run of the same specs passed. Real-tree `git status --porcelain` was empty before and after.

| # | File:line | Description | Killed? |
| --- | --- | --- | --- |
| M1 | `web/lib/matching/score.ts:97` | neighbor value band `10` → `0` | ❌ Survived |
| M2 | `web/lib/matching/score.ts:45` | `PESO_VALOR` 25 → 20 | ✅ Killed (7 tests) |
| M3 | `web/lib/business/state-machine.ts:15` | allow `rascunho → verificado` | ✅ Killed (3) |
| M4 | `web/lib/business/document-status.ts:72` | `idade >= 7` → `idade > 7` | ✅ Killed (1) |
| M5 | `web/lib/cron/expiration.ts:91` | interest expiry cutoff 10 → 5 days | ❌ Survived |
| M6 | `web/lib/cron/expiration.ts:48` | document-request expiry cutoff 7 → 4 days | ❌ Survived |
| M7 | `web/lib/verification/notas.ts:8` | drop `Number.isInteger` (accept decimals) | ✅ Killed (3) |
| M8 | `web/lib/business/interest-sum.ts:42` | remove `Math.min(100, …)` cap | ✅ Killed (1) |
| M9 | `web/lib/business/interest-sum.ts:33` | `cancelado` counted in the sum | ✅ Killed (1) |
| M10 | `web/lib/cron/expiration.ts:28` | draft expiry cutoff 90 → 60 days | ❌ Survived |
| M11 | `web/app/(producer)/produtor/interesses/actions.ts:89-93` | `decideInterest` drops the `connection_events` "aceita" insert | ✅ Killed, by `e2e/flow-interesse.spec.ts:15` only (not the CA-39.1 test named for it) |
| M12 | `web/app/(producer)/produtor/interesses/actions.ts:77` | swap aceitar/recusar | ✅ Killed (3 e2e) |
| M13 | `web/app/(producer)/produtor/interesses/actions.ts:96` | investor notification sent with wrong type (`interesse_recebido`) | ❌ Survived |

Root cause of M5/M6/M10: the tests for the three pure cron selectors use loose fixtures (11 vs 2 days, 8 vs 3 days, 91 vs 10 days) instead of boundary values (N−1 / N+1 days), so the cutoff constant is effectively unpinned.

**Sensor depth**: P0-full (13 manual behavior-level mutations; no Stryker installed)
**Result**: 8/13 killed, FAIL ❌

---

## Interactive UAT Results

Not performed. The Verifier runs headless, and UAT is left to the orchestrator/user.

---

## Code Quality

Spot-checked `web/app/(producer)/produtor/interesses/actions.ts` (Fase 9/10 Server Action), `web/app/(verifier)/verificacao/[id]/actions.ts` (Fase 5), `web/components/cadastro/PartHeader.tsx` + `web/lib/offline/draft-store.ts` (Fase 3/4), `web/supabase/migrations/0003_businesses.sql` + `0008_interests.sql` usage (Fase 3/9), `web/lib/cron/expiration.ts` (Fase 11), `web/e2e/perf-producer.spec.ts` (Fase 12).

| Principle | Status |
| --- | --- |
| Minimum code | ✅ Server Actions are small and single-purpose; pure domain modules are isolated (AD-003) |
| Surgical changes | ✅ |
| No scope creep | ⚠️ The opposite problem: `lib/offline/draft-store.ts` is dead code (fully tested, never wired), so an abstraction ships without its feature |
| Matches patterns | ✅ Consistent `{ok,error}` results, `assertTransition` before writes, admin client + manual ownership checks as documented |
| Spec-anchored outcome check (asserted values match spec) | ❌ See the 15 gaps; several tests assert less than their title claims (`produtor-interesses.spec.ts:34` "grava o evento de conexão"; `verificacao-suspensao.spec.ts:18` "CA-13.2" never asserts "Negócio indisponível no momento") |
| Per-layer Coverage Expectation met (domain 1:1 ACs; routes happy+edge+error) | ❌ Domain branches uncovered (score neighbor band, cron boundaries); RF-30 observations, queue ordering and CA-20.1 have no route test |
| Every test maps to a spec requirement, no unclaimed tests | ✅ Tests are tagged with CA/RN/T ids |
| Documented guidelines followed | ✅ `tasks.md` Test Coverage Matrix + `web/AGENTS.md`; strong defaults otherwise |

Additional quality notes:
- `web/e2e/perf-producer.spec.ts:51-64`: every part reports `JS=0KB` and an identical LCP (~762ms) in the gate log. For a Next.js page the script `transferSize` can't really be 0, so the RNF-02 "JS inicial ≤ 200KB" assertion is effectively vacuous. Likely a Lighthouse cache/session artifact; needs investigation.
- Gate command order: `npm run lint && npm run typecheck && npm run build` fails on a fresh clone. `typecheck` errors with `TS2304 Cannot find name 'PageProps'/'LayoutProps'` because those global types are generated into `.next/types` by `next build`. It passes once `build` has run. Fix by running `next typegen` before `tsc`, or by reordering the gate.

---

## Edge Cases

- [ ] CNPJ duplicate (rascunho/análise/verificado) blocked: DB index only, drafts not covered, no test (CA-05.3)
- [x] City outside Amazônia Legal → pilot notice: `web/e2e/produtor-parte2.spec.ts:33`
- [x] Decimal or out-of-range grade rejected: `approve.test.ts:89,105`; `notas.test.ts:11-23`
- [~] Signed URL unusable after 5 min: unit with mocked Storage only (`signed-url.test.ts:26`); Storage disabled locally (`[storage] enabled = false`)
- [x] Direct API Rascunho → Verificado rejected: `web/lib/business/__tests__/state-machine.test.ts:50`
- [~] Public signup with verifier role → **403**: authenticated gets 403 (`web/e2e/rls-profiles.spec.ts:96`), but the anonymous request gets **401** (`:72`), not the 403 the spec states
- [~] Suspended/Rejected by direct URL → "Negócio indisponível no momento": implemented (`negocios/[slug]/page.tsx:143`), but no test asserts the text
- [~] 35% business excluded from results but visible in vitrine: 35% number asserted (`score.test.ts:69-70`), but the results-page exclusion and vitrine visibility are untested
- [x] Refused document request → "A produtora optou por não liberar", no reason: `web/e2e/produtor-pedidos.spec.ts:53-54`

---

## Gate Check

- **Gate command**: `npm run lint && npm run typecheck && npm run build && npm run test` (Build) + `npm run test:e2e` (Full), `cwd=web/`
- **Result**:
  - lint ✅ exit 0
  - typecheck ❌ exit 2 on first run (fresh worktree, before `build`); ✅ exit 0 after `build`. Classified as a gate-ordering defect, not a type error
  - build ✅ exit 0
  - unit ✅ **221 passed / 0 failed / 0 skipped** (36 files)
  - e2e ✅ **96 passed / 0 failed / 0 skipped** (41 spec files), 2 runs:
    - Run 1 used the real worktree after `supabase db reset`. Playwright's `reuseExistingServer` most likely reused a `next-server` already listening on :3000 from the main checkout (`startup-one/web`, same commit `355ac38`).
    - Run 2 was an independent build of the same commit on :3100 in the scratch worktree: 96/96 again.
- **Test count before feature**: 0 (greenfield repo)
- **Test count after feature**: 317 (221 unit + 96 e2e)
- **Delta**: +317
- **Skipped tests**: none (`test.skip`/`fixme`/`only` absent)
- **Failures**: none
- **Environment incident (Verifier-caused, recovered)**: the first sensor scratch copied `node_modules` into `/private/tmp` on the system volume, which had under 1.5 GiB free. That filled the disk and crashed Docker Desktop. Recovery: deleted the copy, restarted Docker per the STATE.md gotcha, ran `supabase stop && supabase start`, and moved the scratch to the SSD volume. The system volume still has only about 650 MiB free, and that low headroom predates this run.

---

## Fix Plans

### Fix 1: Wire the offline draft into the cadastro UI (CA-07.1, CA-07.2) - Blocker
- **Root cause**: `lib/offline/draft-store.ts` was built and unit-tested (T15), but the `useDraftSync` hook it depends on was never created. `PartHeader` renders a hard-coded "Salvo".
- **Fix task**: Create `useDraftSync(businessId, part)` that calls `saveLocalDraft` on every change, listens to `online`/`offline`, and calls `flushWhenOnline(businessId, saveDraftPart)`. Make `PartHeader` show "Salvo no celular" while offline or unsynced and "Salvo" after flush. Use it in parts 1–5.
- **Verify**: e2e with `context.setOffline(true)` on part 3: fill, assert "Salvo no celular"; go online, assert "Salvo" and the `business_revisions` row exists.
- **Priority**: Blocker (spec "Independent Test" for the story requires an offline drop on part 3)

### Fix 2: Ajuste solicitado edits only the flagged fields (CA-14.1) - Major
- **Root cause**: Deferred in T24 ("chega junto da tabela verifications") and never picked up in Fase 5.
- **Fix task**: Store flagged fields + comment per field on the `pedir_ajuste` verification. The producer's review/part screens lock the unflagged fields and show each comment.
- **Verify**: e2e: verifier flags `cidade` with a comment; the producer sees only `cidade` editable, with the comment.
- **Priority**: Major

### Fix 3: OTP validity 10 minutes (RN-02) - Major
- **Fix task**: Set `otp_expiry = 600` in `web/supabase/config.toml` `[auth.email]` and document the same value for the hosted project. Add a check (config assertion test or e2e) that pins it.
- **Priority**: Major (security-relevant)

### Fix 4: CNPJ uniqueness across draft/análise/verificado (CA-05.3) - Major
- **Fix task**: Persist `businesses.cnpj` when Part 1 is saved (so drafts reserve it), check before advancing, and map unique violation `23505` to an explicit message. Add unit and e2e tests.
- **Priority**: Major

### Fix 5: Missing notifications (CA-07.3 warning at 7 days, CA-19.2 warning at 30 days, CA-21.1 suspension notice) - Major
- **Fix task**: Add the notification types (product decision for the template), enqueue from `daily`/`expire-seals` and `suspend()`, and remove the `TODO(T53)` markers. Test with pinned dates.
- **Priority**: Major

### Fix 6: Verifier sees referring partner (CA-11.2) - Minor (P2)
- **Fix task**: Show `partners.nome` from `businesses.indicado_por` on `/verificacao/[id]`. Assert it is shown to the verifier and absent on `/negocios/[slug]`.

### Fix 7: Strengthen non-discriminating tests (sensor survivors) - Major
- `lib/cron/__tests__/expiration.test.ts`: boundary fixtures N−1/N+1 days for 90/7/10-day cutoffs (kills M5, M6, M10)
- `lib/matching/__tests__/score.test.ts`: case where the business is in the neighboring value band → +10 (kills M1)
- `e2e/produtor-interesses.spec.ts:34`: assert the `connection_events` "aceita" row and the queued `interesse_aceito` event for the investor (kills M13, makes the test title true)

### Fix 8: Missing evidence for implemented behavior - Minor
- Tests for:
  - `/produtor` "Quem vê o quê"
  - focus on the first invalid field (`toBeFocused`)
  - verifier queue ordering and columns
  - CA-20.1 with a `conferido:false` certification
  - the 40% cutoff exclusion on results (and vitrine visibility)
  - "Negócio indisponível no momento" text
  - RF-30 observation
  - the "5 dias úteis" confirmation text
  - CA-09.2 upload resume (when Storage is available)

### Fix 9: Gate hygiene - Minor
- Run `next typegen` before `tsc` in `typecheck`, or reorder the Build gate.
- Fix `perf-producer.spec.ts` so it measures real script bytes; `JS=0KB` is vacuous.
- Tick `tasks.md:1226`.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| --- | --- | --- |
| RF-01, RF-03, RF-04 | Pending | ✅ Verified |
| RF-02 (OTP 10 min) | Pending | ❌ Needs Fix |
| RF-05, RF-06, RF-07, RF-08, RF-09, RF-10 | Pending | ⚠️ Verified with gaps (CA-05.3, CA-09.2 no evidence) |
| RF-11 (offline "Salvo no celular") | Pending | ❌ Needs Fix |
| RF-12 | Pending | ✅ Verified (weak text assertion) |
| RF-13 (ajuste por campo / indicação) | Pending | ❌ Needs Fix |
| RF-14 (fila) | Pending | ⚠️ Needs evidence (ordering) |
| RF-15 | Pending | ✅ Verified |
| RF-16 (suspensão + aviso) | Pending | ❌ Needs Fix (notification) |
| RF-17 – RF-20 | Pending | ✅ Verified (M1 survivor → test fix) |
| RF-21 – RF-25 | Pending | ✅ Verified |
| RF-26 – RF-29 | Pending | ✅ Verified (M13 survivor → test fix) |
| RF-30 | Pending | ⚠️ Needs evidence (observações) |
| RF-31 (avisos) | Pending | ❌ Needs Fix (7d/30d/suspensão missing) |
| RF-32 | Pending | ✅ Verified (unit: `submit-business.test.ts:179`, `descobrir/__tests__/actions.test.ts:119`) |

---

## Summary

**Overall**: ❌ Not Ready

**Spec-anchored check**: 59/77 ACs matched spec outcome; 15 gaps + 3 partial; 2 spec-precision gaps
**Sensor**: 8/13 mutations killed (5 survived)
**Gate**: lint ✅, build ✅, typecheck ✅ after build (fails before it on a fresh clone), 221/221 unit, 96/96 e2e (×2)

**What works**:
- Entry/OTP flow except expiry
- Matching formula and ranking
- Vitrine/search/filters
- Business page tabs and PII protection
- Controlled documents: request, release, revoke, expire, watermark
- Interest lifecycle end to end, including partner presentation
- Checklist/grades/seal approval
- State machine
- RLS on the 5 sensitive tables

**Issues found**:
- The offline cadastro (RN-07 core promise) is not wired to the UI
- Adjust-only-flagged-fields (CA-14.1) is not implemented
- OTP expiry is 60 min instead of 10
- CNPJ uniqueness does not cover drafts and has no user feedback
- Three required notifications are missing
- CA-11.2 is not implemented
- The cron cutoff tests and one matching branch are non-discriminating

**Next steps**: Route Fixes 1–7 as fix tasks (Blocker/Major first), then re-run the Verifier (iteration 1 of 3).
