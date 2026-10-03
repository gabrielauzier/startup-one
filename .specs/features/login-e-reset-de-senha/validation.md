# Login com e-mail e senha, magic link e reset de senha - Validation

**Date**: 2026-10-02
**Spec**: `.specs/features/login-e-reset-de-senha/spec.md`
**Diff range**: `21f89e8^..f83c9c2` (50 commits: spec docs `21f89e8` + implementation `cc7b052..f83c9c2`), branch `claude/prd-login-reset-senha-87c5db`
**Verifier**: independent sub-agent (author != verifier)
**Verdict**: **FAIL** (genuine gaps in 4 ACs, 1 surviving mutant, 17 weakly-covered or spec-precision rows; gates all green)

---

## Task Completion

All 43 tasks in `tasks.md` are checked (`grep -c "\[ \]"` returns 0). Deviations D1..D8 assessed below.

---

## Gate Check

- **lint** (`npm run lint`): exit 0
- **typecheck** (`npm run typecheck`): exit 0
- **unit** (`npm run test`): 68 files, **533 passed, 0 failed**
- **e2e** (`E2E_PORT=3100 npx playwright test --workers=3`, full suite): **190 passed, 0 failed, 0 skipped**, 1.5 min (slow spec `esqueci-senha-codigo.spec.ts:60` 1.0 min, expected)
- Isolation: `git status --porcelain` of the real worktree was empty before and after the sensor (UNCHANGED); scratch worktree removed and pruned.

---

## Spec-Anchored Acceptance Criteria

Legend: PASS = assertion located and matches the spec outcome; WEAK = located but asserts only part of the outcome (mock call order, mapping only, or text not asserted); GAP = no evidence or the outcome is not met; SPEC-GAP = the spec is vague/self-conflicting and the author's choice is unverifiable.

### P1: Destino pos-login, perfil, logout, `/produtor` (AUTH-01, 11, 16, 17)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AUTH-01.1 | investidor/empresa + `redirect=/produtor/painel` -> `/negocios` or `/descobrir/1` | `web/lib/auth/__tests__/post-auth.test.ts:76-82` `toBe("/negocios")`; `web/e2e/auth-redirect.spec.ts:21` `waitForURL("**/descobrir/1")` | PASS |
| AUTH-01.2 | produtor + `redirect=/interesses` -> `/produtor/painel` or `/produtor` | `post-auth.test.ts:84-90` `toBe("/produtor/painel")`; `auth-redirect.spec.ts:32` `waitForURL("**/produtor")` | PASS |
| AUTH-01.3 | safe + allowed redirect honored | `post-auth.test.ts:68-74` `toBe("/negocios/abc/documentos?x=1")`; `web/e2e/entrar.spec.ts:42` `waitForURL("**/produtor/pedidos")` | PASS |
| AUTH-01.4 | `//evil.com`, `/\evil.com`, `https://evil.com`, control char, `/%5Cevil.com`, `/entrar`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha`, `/auth/` ignored | `web/lib/auth/__tests__/redirect.test.ts:75-97` `isSafeRedirect(path)` `toBe(false)` for all; `post-auth.test.ts:92-98`; `auth-redirect.spec.ts:36-47` | PASS |
| AUTH-01.5 | investidor/empresa without terms -> `/termos` first, then validated destination | `post-auth.test.ts:35-51` `toBe("/termos?redirect=%2Fnegocios%2Fx%2Fdocumentos")`, `toBe("/termos")`; `auth-redirect.spec.ts:18-21`; `web/app/(marketing)/termos/__tests__/actions.test.ts:96-104` (delegation, mocked) | PASS |
| AUTH-01.6 | answers migrated to `investor_answers` before any `redirect()` | `post-auth.test.ts:44` `expect(calls).toEqual(["migrate"])`, `:65` `toEqual(["migrate","default"])` (call order of a mock). No test asserts a resulting `investor_answers` row after login (grep of `web/e2e` finds none) | WEAK |
| AUTH-01.7 | wrong role on page -> role home + `?aviso=sem-permissao`; **JSON 403 kept only for `/api/*`** | Pages: `web/__tests__/proxy.test.ts:98-120` `toBe("/negocios?aviso=sem-permissao")` etc. `/api/*` 403 half: `proxy.test.ts:161-167` only asserts a *public* `/api` path returns 200; sensor M21 (403->401) **survived**; no `ROUTE_ACCESS` rule matches `/api/*` so `proxy.ts:85-87` is unreachable | GAP (second half) |
| AUTH-01.7a | home: `/verificacao`, `/produtor`, `/negocios`; aviso only on routes with global chrome | `proxy.test.ts:98-120`; `redirect.test.ts:139-146` `roleHome`; `web/components/shared/__tests__/AppChrome.test.tsx:69-77,96-99`; `auth-redirect.spec.ts:49-69` | PASS |
| AUTH-01.8 | logged user without `profiles` row on private route or `/entrar` -> "Complete seu perfil" | `proxy.test.ts:78-86` `toBe("/completar-perfil")` for `/produtor/painel`,`/interesses`,`/entrar`,`/cadastro`,`/esqueci-senha`; `web/e2e/completar-perfil.spec.ts:16,22-24` | PASS |
| AUTH-01.9 | logged user with profile on `/entrar`, `/cadastro`, `/esqueci-senha` -> role default | `entrar.spec.ts:87` and `web/e2e/cadastro.spec.ts:58` `waitForURL("**/produtor")`. `/esqueci-senha` (`web/app/(marketing)/esqueci-senha/page.tsx:10-12`) has no test | WEAK |
| AUTH-01.10 | "Sair" in header, mobile bottom nav, producer chrome -> end session, `/`, header shows "Entrar" | Header: `web/components/shared/__tests__/SiteHeader.test.tsx:28-35`; `sign-out.test.ts:27-34` (`signOut` once, `redirect("/")`); `auth-redirect.spec.ts:77-83`. Mobile/producer nav: `MobileBottomNav.test.tsx:9-15`, `web/components/producer/__tests__/BottomNav.test.tsx:21` only assert the button exists/has `min-h-11`, not that it submits `signOutAction` | WEAK |
| AUTH-01.11 / AUTH-17.11 | visitor sees producer welcome | `web/e2e/produtor-boas-vindas.spec.ts:9-15`; `roles.test.ts:81-84`; `auth-redirect.spec.ts:87-88` | PASS |
| AUTH-01.12 / AUTH-17.12 | visitor on `/produtor/cadastro|painel|pedidos|interesses` -> `/entrar?redirect=` | `web/lib/auth/__tests__/roles.test.ts:86-96`; `auth-redirect.spec.ts:90-93`; `produtor-boas-vindas.spec.ts:25` | PASS |

### P1: Cadastro (AUTH-02, 03, 04, 09 sub-ACs, 11, 12)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| S2.1 | form shows 3 profiles, nome, e-mail, senha, confirmacao | `web/app/(marketing)/cadastro/__tests__/cadastro-form.test.tsx:13-24` | PASS |
| S2.2 | `?perfil=` pre-selects | `cadastro-form.test.tsx:26-35`; `cadastro.spec.ts:5-14` | PASS |
| S2.3 | senha <8, >72, no letter/digit blocks and does not call Supabase | `cadastro-form.test.tsx:44-53`; `web/app/(marketing)/cadastro/__tests__/actions.test.ts:54-67` `expect(signUp).not.toHaveBeenCalled()`; `cadastro.spec.ts:23-25` | PASS |
| S2.4 | confirmation mismatch blocks, error on confirm field | `cadastro-form.test.tsx:61-69`; `actions.test.ts:56` `confirmError` `"As senhas não são iguais."` | PASS |
| S2.5 | nome 2..80 | `actions.test.ts:57-58` (`"A"`, 81 chars) `"Informe seu nome com 2 a 80 caracteres."` (server side only) | PASS |
| S2.6 | valid new signup: `signUp` with `data {role,nome}`, redirect `/cadastro/confirmar-email` | `actions.test.ts:79-90` `toHaveBeenCalledWith({... options:{data:{role,nome,has_password:true}}})`; `web/e2e/cadastro-confirmacao.spec.ts:41-62` | PASS (extra `has_password` metadata is additive) |
| S2.7 | existing e-mail: same screen, no duplicate user | `actions.test.ts:127-139,151-164`; `cadastro-confirmacao.spec.ts:117` `usersWithEmail(email) toBe(1)` | PASS |
| S2.7a | confirmed e-mail: owner receives notice **with links to enter and to reset the password** | `actions.test.ts:128-139` asserts `mail.to`, `body` contains `"https://iasy.test/entrar"` and the plain text `"Esqueci minha senha"`; implementation `web/app/(marketing)/cadastro/actions.ts:82` has no reset link at all. `sendEmail` is a `console.log` stub (`web/lib/notifications/send-email.ts:36-38`), documented in `DEPLOY.md` section 0.3 | GAP (no reset link; stub transport is "WHERE" scoped, acceptable) |
| S2.7b | unconfirmed existing e-mail: re-send confirmation, subject to cooldown/cap | `actions.test.ts:141-149` `resend` called with `{type:"signup",email}`; `:167-176` throttle runs first | PASS |
| S2.8 | role outside the 3 (incl. `verificador`) refused, no `profiles` row | `actions.test.ts:60`; `cadastro-confirmacao.spec.ts:127-138` (GoTrue refuses, 0 users); `web/e2e/rls-auth-trigger.spec.ts:59-67` | PASS |
| S2.9 | no role in metadata: no profile, no failure | `rls-auth-trigger.spec.ts:69-75` `status 200`, profile length 0 | PASS |
| S2.9a | valid role: profile with role+nome | `rls-auth-trigger.spec.ts:40-49` | PASS |
| S2.10 | valid confirm link opens in clean browser: confirms, session, destination | `cadastro-confirmacao.spec.ts:41-77`; `web/e2e/auth-confirm.spec.ts:13-38` | PASS |
| S2.11 | expired/used/invalid confirm link -> `/cadastro/confirmar-email?erro=expirado` with "Enviar novo link" | `web/app/auth/confirm/__tests__/route.test.ts:63-70`; `auth-confirm.spec.ts:59`; `web/e2e/cadastro-confirmar-email.spec.ts:39-56` | PASS (10-minute expiry itself not reproducible; maps to same verifyOtp error) |
| S2.12 | `type` not `signup`/`email` or insecure `next` -> treated as invalid (criterion 11), `next` ignored | `route.test.ts:52-61` insecure `next` ignored; `route.test.ts:78-84` and `auth-confirm.spec.ts:98-101` assert bad type goes to `/entrar?erro=link-expirado`, whereas criterion 11 names `/cadastro/confirmar-email?erro=expirado` | SPEC-GAP (literal text says criterion 11; author chose `/entrar`, not recorded as a deviation) |
| S2.13 | resend: re-send, show "Enviamos outro e-mail", button disabled 60 s with count | `web/components/auth/__tests__/ResendForm.test.tsx:11-38` (countdown, generic `sentText`); `magic-link-actions.test.ts:162-170`. The literal `"Enviamos outro e-mail."` lives in `cadastro/confirmar-email/page.tsx:38` and is never asserted | WEAK |
| S2.14 | >3 resends/h refused with "Muitos pedidos. Tente de novo em alguns minutos." | `magic-link-actions.test.ts:187-195`; `cadastro-confirmar-email.spec.ts:76-89` | PASS |
| S2.15 | provider failure: "Não foi possível enviar o e-mail. Tente de novo.", screen kept, resend enabled | `magic-link-actions.test.ts:197-204`, `actions.test.ts:178-186` (message, no leak); "resend enabled" not asserted | WEAK |
| S2.16 | config.toml values locked by test | `web/lib/auth/__tests__/auth-config.test.ts:20-42` (`"8"`, `'"letters_digits"'`, `"true"`, `'"60s"'`) | PASS |

### P1: Login com senha (AUTH-05, AUTH-10.13)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| S3.1 | e-mail, senha+Mostrar, Entrar, 3 links, no profile choice | `web/app/(marketing)/entrar/__tests__/entrar-form.test.tsx:13-31`; `entrar.spec.ts:5-18` | PASS |
| S3.2 | correct credentials: `signInWithPassword` + post-auth destination | `web/app/(marketing)/entrar/__tests__/sign-in-password.test.ts:35-42`; `entrar.spec.ts:20-30` | PASS |
| S3.3 | same message `"E-mail ou senha incorretos."` both cases | `sign-in-password.test.ts:53-54`; `entrar.spec.ts:56,62`; `web/e2e/auth-gotrue-contract.spec.ts:171-178` | PASS |
| S3.4 | unconfirmed: "Confirme seu e-mail para entrar" + "Reenviar e-mail de confirmação" | `sign-in-password.test.ts:77-81`; `entrar.spec.ts:74-77` | PASS |
| S3.5 | while submitting: button disabled + loading state | implementation `entrar-form.tsx:144-145` (`disabled={pending}`, `"Entrando…"`); **no test** | GAP |
| S3.6 | `role="alert"`, `aria-invalid="true"`, focus on first invalid field | `entrar.spec.ts:55-58`; `entrar-form.test.tsx:85-89`; `web/e2e/a11y-auth.spec.ts:45-47` | PASS |
| S3.7 | MVP first-access text | `entrar-form.test.tsx:50-58` | PASS |
| S3.8 | private `redirect` -> "Entre para continuar" | `entrar.spec.ts:37`; `entrar-form.test.tsx:60-69` | PASS |
| S3.9 | `?aviso=sem-permissao` text | `entrar.spec.ts:92`; `entrar-form.test.tsx:62` | PASS |
| S3.10 | `?aviso=senha-alterada` text | `entrar.spec.ts:95` | PASS |
| S3.11 | auth routes: no bottom nav, no legal banner, logo only | `AppChrome.test.tsx:30-50` (`queryByRole("navigation")`/`contentinfo` null for 9 auth paths incl. `/auth/confirm`); `entrar.spec.ts:17` | PASS |
| S3.12 | MVP user without password gets the generic message | `reset-senha.spec.ts:63-66`; `sign-in-password.test.ts:58-67` | PASS |
| S3.13 / AUTH-10.13 | rate limit -> "Muitas tentativas. Aguarde alguns minutos e tente de novo." | `sign-in-password.test.ts:84-93` (status 429 / `over_request_rate_limit` mapping only; GoTrue limit not reproducible locally, `config.toml:238-252` are 1000) | WEAK (mapping only) |
| S3.14 | autocomplete values; 44 px touch targets | autocomplete: `entrar-form.test.tsx:33-38`, `cadastro-form.test.tsx:80-85`, `web/e2e/redefinir-senha.spec.ts:24-25`; 44 px: only `MobileBottomNav.test.tsx:13-14`; auth forms (`entrar-form.tsx:99,115,144`) have `h-11` classes but no assertion (axe `wcag21aa` has no target-size rule) | WEAK |

### P1: Magic link (AUTH-06, 07, 09)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| S4.1 | `signInWithOtp` `shouldCreateUser:false`, redirect `/entrar/link-enviado` | `web/app/(marketing)/entrar/__tests__/magic-link-actions.test.ts:48-54`; `web/e2e/magic-link.spec.ts:9,22` | PASS |
| S4.2 | unknown e-mail: same screen, no mail, no `auth.users` row | `magic-link-actions.test.ts:67-74`; `magic-link.spec.ts:48-51`; `auth-gotrue-contract.spec.ts:81-92` (the admin-API check at `magic-link.spec.ts:61` is guarded by `if (admin.ok)` and silently skips if the env key is absent; the contract spec covers it robustly) | PASS |
| S4.3 | mail only link "Entrar na Îasy" to `/auth/confirm?...type=email&next=`, no 6-digit code | `web/lib/auth/__tests__/email-templates.test.ts:18-25` (`not.toContain("{{ .Token }}")`); `magic-link.spec.ts:26-28` | PASS |
| S4.4 | valid link in any browser: session there, post-auth destination | `magic-link.spec.ts:31-38`; `auth-confirm.spec.ts:62-80` | PASS |
| S4.5 | expired/used -> `/entrar?erro=link-expirado` + message | `magic-link.spec.ts:83-84`; `route.test.ts:72-76`; `auth-confirm.spec.ts:95` | PASS |
| S4.6 | link opened by user with unconfirmed e-mail: confirms + session | no test (all magic-link e2e users are `createConfirmedUser` with `confirmed` default true, `web/e2e/helpers/session.ts:27`) | GAP |
| S4.7 | link-enviado shows e-mail not in URL; "Reenviar" 60 s; "Enviamos outro link" | `entrar.spec.ts:109-111`; `magic-link.spec.ts:23,97-99`; literal `"Enviamos outro link."` in `link-enviado/page.tsx:27` not asserted | WEAK |
| S4.8 | double click in cooldown sends one e-mail | `magic-link-actions.test.ts:139-150`; `magic-link.spec.ts:100-104` `countMails toBe(1)` | PASS |
| S4.9 | passwordless MVP user (with profile) enters by link | no test: `magic-link.spec.ts:19` uses a user with a password; the only passwordless user (`reset-senha.spec.ts:63`) goes via reset | GAP |

### P1: Reset de senha (AUTH-08, 14, 09, 10)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| S5.1 | `resetPasswordForEmail`, redirect to `/esqueci-senha/codigo`, same answer existing/non-existing | `web/app/(marketing)/esqueci-senha/__tests__/actions.test.ts:38-62`; `web/e2e/esqueci-senha.spec.ts:17,32` | PASS |
| S5.2 | recovery mail has 6-digit code + 10 minutes, no link | `email-templates.test.ts:31-38`; `esqueci-senha.spec.ts:21-22` `mail.Text toMatch(/\b\d{6}\b/)`, `mail.HTML not.toContain("href=")` | PASS |
| S5.3 | no e-mail for non-existing | `esqueci-senha.spec.ts:34`; `auth-gotrue-contract.spec.ts:152-159` | PASS |
| S5.4 | e-mail in signed httpOnly cookie, 15 min, not in URL | `web/lib/auth/__tests__/auth-context-cookie.test.ts:54-62,71-98` (tamper, expiry, httpOnly, `maxAge`); `esqueci-senha.spec.ts:18` | PASS |
| S5.5 | correct code: `verifyOtp type:"recovery"`, session, `/redefinir-senha` | `web/app/(marketing)/esqueci-senha/codigo/__tests__/actions.test.ts:49-54` (sensor M8a killed); `web/e2e/esqueci-senha-codigo.spec.ts:36-39` | PASS |
| S5.6 | wrong/expired/used/replaced: "Código inválido ou vencido." without reason | `codigo/__tests__/actions.test.ts:63-73`; `esqueci-senha-codigo.spec.ts:51,60-93` (replaced + used); 10-minute expiry only via mock | PASS |
| S5.7 | resend: new code invalidates previous, 60 s cooldown, "Enviamos outro código" | `codigo/__tests__/actions.test.ts:111-115`; `esqueci-senha-codigo.spec.ts:60-93,102-104`; literal `"Enviamos outro código."` (`codigo/page.tsx:30`) not asserted | WEAK |
| S5.8 / AUTH-10.8 | verification limit: "Muitas tentativas. Peça um novo código." and no new code accepted | `codigo/__tests__/actions.test.ts:83-92` (mapping only; "no new code accepted" is GoTrue-side, not testable locally) | WEAK (mapping only) |
| S5.9 | `inputmode=numeric`, `autocomplete=one-time-code`, `maxLength 6`, accepts paste | attributes: `esqueci-senha-codigo.spec.ts:30-32`; space stripping server-side only: `codigo/__tests__/actions.test.ts:57-61`. `maxLength=6` (`codigo-form.tsx:26`) makes a browser truncate a pasted `"123 456"` to `"123 45"` before the server strips spaces; no paste test | SPEC-GAP (AC9 `maxLength 6` conflicts with the edge case "paste with spaces") |
| S5.10 | `/redefinir-senha` without recovery session or authenticated -> `/esqueci-senha` | `web/e2e/redefinir-senha.spec.ts:11-15` (no session only); AC wording "sem sessão de recuperação ou autenticada" is ambiguous | SPEC-GAP |
| S5.11 | "Nova senha"/"Confirmar nova senha", show/hide, requirements | `redefinir-senha.spec.ts:24-25` | PASS |
| S5.12 | mismatch or weak blocks | `web/app/(marketing)/redefinir-senha/__tests__/actions.test.ts:63-82`; `redefinir-senha.spec.ts:27-34` | PASS |
| S5.13 | same password: "Escolha uma senha diferente da atual." | `redefinir-senha/__tests__/actions.test.ts:84-92`; `redefinir-senha.spec.ts:46` (real GoTrue) | PASS |
| S5.14 | `updateUser`, `signOut({scope:"others"})`, keep session, destination + aviso | `redefinir-senha/__tests__/actions.test.ts:46-52` `toHaveBeenCalledWith({scope:"others"})`; `web/e2e/reset-senha.spec.ts:49-53` (other session loses access); `redefinir-senha.spec.ts:64` | PASS |
| S5.15 | "Sua senha foi alterada" mail | `redefinir-senha.spec.ts:66-67`; `email-templates.test.ts:40-44,61-64` | PASS |
| S5.16 | recovery session: only `/redefinir-senha` and `/auth/*` | `proxy.test.ts:137-143` `toBe("/redefinir-senha")`; `reset-senha.spec.ts:13-16`. Implementation also lets `/esqueci-senha*` through (`proxy.ts:46`, asserted at `proxy.test.ts:149`): wider than the AC text, unrecorded | PASS (note) |
| S5.17 | passwordless MVP user sets first password | `reset-senha.spec.ts:57-79` | PASS |

### P2: Limites, antienumeracao, templates (AUTH-10, 12, 13, 09)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| P2.1 | `config.toml` **and** `DEPLOY.md` hold production values for `email_sent`, `sign_in_sign_ups`, `token_verifications`, `max_frequency`, "sem o valor 1000 de dev como padrão de produção" | `max_frequency` ok (`config.toml:269`, `auth-config.test.ts:39-42`). `config.toml:238,250,252` keep `1000` (dev, needed by e2e); production values only in `DEPLOY.md` section 1.4 (100/h, 30/5 min, 30/5 min). No automated check; not in the Deviations table | GAP / unrecorded deviation |
| P2.2 | same text and **same HTTP code** for reset/magic link/signup, existing or not | per-flow equality: `esqueci-senha/__tests__/actions.test.ts:48-62`, `magic-link-actions.test.ts:67-74`, `cadastro/__tests__/actions.test.ts:151-164`; e2e `esqueci-senha.spec.ts:25-35`, `magic-link.spec.ts:42-51`. No HTTP-level cross-flow comparison | WEAK / SPEC-GAP ("HTTP code" has no defined meaning for server actions) |
| P2.3 | templates `confirmation`, `magic_link`, `recovery`, `password_changed` **and the duplicate-signup notice** in pt-BR under `supabase/templates/` and wired in `config.toml` | four templates: `email-templates.test.ts:10-64`; the duplicate-signup notice is an inline string (`cadastro/actions.ts:79-83`), not a template file | PARTIAL GAP |
| P2.4 | `site_url` / `additional_redirect_urls` contain production and preview URLs, documented in `DEPLOY.md` | `config.toml:187,194-198` local only (`auth-config.test.ts:27-33`); `DEPLOY.md` section 1.3 uses placeholders (`https://<dominio-final>/**`) | SPEC-GAP (prod URLs unknown; documentation only) |
| P2.5 | provider error is **logged on the server** and the internal message not exposed | no leak: `magic-link-actions.test.ts:84-94`, `esqueci-senha/__tests__/actions.test.ts:81-88`, `cadastro/__tests__/actions.test.ts:178-186`. Server logging: no `console.*`/logger call exists in `app/(marketing)` or `lib/auth` (grep) | GAP (logging absent, untested) |

### P2: Eventos (AUTH-15)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| E.1 | each of 11 flows records `kind='produto'` event of its type | `web/e2e/auth-eventos.spec.ts:117-119` `expect(after[type]).toBeGreaterThan(before[type])` for all 11; `kind='produto'` set in `web/lib/analytics/track.ts:56` (not asserted explicitly) | PASS |
| E.2 | payload has no e-mail/password/token/code | `auth-eventos.spec.ts:129-136` (`not.toContain("@")`, secrets, regex); unit `sign-in-password.test.ts:115-124` `payload:{}`; URLs `auth-eventos.spec.ts:140-146` | PASS |
| E.3 | CHECK extended without changing existing types | `web/lib/analytics/__tests__/track-auth-types.test.ts:33-46`; `web/e2e/events-auth-types.spec.ts:21-28` | PASS |
| E.4 | event failure does not break the flow | `sign-out.test.ts:46-51`; `sign-in-password.test.ts:127-133`; `route.test.ts:107-111`; `esqueci-senha/__tests__/actions.test.ts:104-108`; `redefinir-senha/__tests__/actions.test.ts:120-124`; `cadastro/__tests__/actions.test.ts:101-105`. No failure test for `verifyResetCode` or `requestMagicLink` | WEAK (6 of 8 call sites) |

### P3: Aviso de senha (AUTH-18)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| P3.1 | notice once per session "Defina uma senha para entrar mais rápido" linking `/redefinir-senha` | `web/components/shared/__tests__/SetPasswordNotice.test.tsx:20-27,41-50`; `web/lib/auth/__tests__/current-role.test.ts:25-30`; `web/e2e/aviso-senha.spec.ts:15-20`. Implementation shows it to any logged user without `has_password`, not only "entra por magic link" | PASS (SPEC-GAP: trigger wording narrower than behavior) |
| P3.2 | dismissed: not shown again in the same session | `SetPasswordNotice.test.tsx:29-38`; `aviso-senha.spec.ts:22-25` | PASS |

### Edge cases

| Edge case | `file:line` | Result |
| --- | --- | --- |
| Confirm link in another browser; original tab unchanged | `cadastro-confirmacao.spec.ts:50-53` uses a clean context; original tab not asserted | WEAK |
| Scanner consumes link | `magic-link.spec.ts:67-85`, `auth-confirm.spec.ts:82-96` | PASS |
| Other tab already logged in -> role destination | `entrar.spec.ts:80-88` | PASS |
| `redirect`/`next` duplicated or list -> first value | `next`: `redirect.test.ts:127-130`. `redirect` on `/entrar`: `web/app/(marketing)/entrar/page.tsx:20-21` keeps only `typeof === "string"` and treats an array as `""` (not the first value); no test | GAP |
| E-mail with caps/spaces normalized | `sign-in-password.test.ts:37-41`; `magic-link-actions.test.ts:43-50`; `esqueci-senha/__tests__/actions.test.ts:38-46` | PASS |
| Orphan MVP account -> "Complete seu perfil" | `proxy.test.ts:78-86`; `completar-perfil.spec.ts:6-25` | PASS |
| Pasted code with spaces stripped | `codigo/__tests__/actions.test.ts:57-61` (server only; see S5.9) | PASS (server) |

**Tally** (90 result rows: the ACs of spec.md plus 7 edge cases; AUTH-01.11/12 share rows with AUTH-17): PASS 64, WEAK 13, SPEC-GAP 4 (S2.12, S5.9, S5.10, P2.4), GAP 9 (AUTH-01.7 `/api` half, S2.7a, S3.5, S4.6, S4.9, P2.1, P2.3, P2.5, edge "redirect list").
**Status**: GAPS PRESENT.

---

## Discrimination Sensor

Isolated scratch: `git worktree add --detach <scratchpad>/sensor HEAD` with `web/node_modules` symlinked and `.env.local` copied; each mutation applied to one file, the covering vitest files run, file restored. Real worktree `git status --porcelain` unchanged (empty before/after). Worktree removed and pruned. First pass of M8a matched a JSDoc comment (harness error), re-run on the real call site.

| # | File | Mutation | Tests run | Result |
| --- | --- | --- | --- | --- |
| M1 | `web/lib/auth/redirect.ts:21` | `isSafePath` no longer rejects `/\evil.com` | `redirect.test.ts` | Killed (2 failed) |
| M2 | `web/lib/auth/post-auth.ts:56` | skip `resolveAccess` check | `post-auth.test.ts` | Killed (2 failed) |
| M3 | `web/proxy.ts:85` | JSON 403 for wrong role on pages | `proxy.test.ts` | Killed (4 failed) |
| M4 | `web/lib/auth/throttle.ts:7` | hourly cap 3 -> 4 | `throttle.test.ts` | Killed |
| M5 | `web/lib/auth/throttle.ts:49` | cooldown removed | `throttle.test.ts` | Killed |
| M6 | `web/app/(marketing)/entrar/actions.ts:57` | different message for invalid credentials | `sign-in-password.test.ts` | Killed (2 failed) |
| M7 | `web/app/(marketing)/entrar/magic-link-actions.ts` | `shouldCreateUser: true` | `magic-link-actions.test.ts` | Killed |
| M8a | `web/app/(marketing)/esqueci-senha/codigo/actions.ts:54` | `type:"recovery"` -> `"email"` | `codigo/__tests__/actions.test.ts` | Killed |
| M8b | same file `:66` | drop `setRecoveryFlag()` | same | Killed |
| M9 | `web/app/(marketing)/redefinir-senha/actions.ts:54` | drop `signOut({scope:"others"})` | `redefinir-senha/__tests__/actions.test.ts` | Killed |
| M10 | `web/app/auth/confirm/route.ts:27` | accept `type=recovery` | `route.test.ts` | Killed |
| M11 | `web/lib/auth/password.ts:1` | min 8 -> 6 | `password.test.ts`, `cadastro/__tests__/actions.test.ts` | Killed |
| M12 | `web/lib/auth/roles.ts:22` | `/produtor/painel` public | `roles.test.ts`, `proxy.test.ts` | Killed |
| M13 | `web/app/(marketing)/cadastro/actions.ts:78` | `signUp` also for confirmed accounts | `cadastro/__tests__/actions.test.ts` | Killed |
| M14 | `web/lib/auth/post-auth.ts:48` | skip `migrateAnswers` | `post-auth.test.ts` | Killed |
| M15 | `web/lib/auth/auth-context-cookie.ts:37` | MAC verification disabled | `auth-context-cookie.test.ts` | Killed |
| M16 | `web/proxy.ts:56` | recovery flag ignored | `proxy.test.ts` | Killed |
| M17 | `web/app/(marketing)/esqueci-senha/actions.ts:34` | surface GoTrue 429 (enumeration leak) | `esqueci-senha/__tests__/actions.test.ts` | Killed |
| M18 | `web/lib/auth/redirect.ts:62` | `normalizeNext` ignores origin | `redirect.test.ts`, `route.test.ts` | Killed |
| M19 | `web/lib/auth/sign-out.ts` | skip `clearRecoveryFlag` | `sign-out.test.ts` | Killed |
| M20 | `web/lib/auth/role-options.ts:11` | `verificador` accepted as signup role | `completar-perfil/__tests__/actions.test.ts` | Killed |
| M21 | `web/proxy.ts:86` | `/api/*` wrong-role JSON status 403 -> 401 | `proxy.test.ts` | **SURVIVED** |
| M22 | `web/app/(marketing)/entrar/actions.ts:26` | track failure no longer swallowed | `sign-in-password.test.ts` | Killed |
| M23 | `web/lib/auth/post-auth.ts:45` | `empresa` dropped from terms/migration side | `post-auth.test.ts` | Killed |
| M24 | `web/lib/auth/auth-context-cookie.ts:43` | cookie expiry ignored | `auth-context-cookie.test.ts` | Killed |
| M25 | `web/app/auth/confirm/route.ts:28` | invalid type -> signup-expired URL | `route.test.ts` | Killed (5 failed): confirms the test locks the `/entrar` outcome, which differs from the literal AUTH-04.12 text |
| M26 | `web/proxy.ts:70` | orphan user not sent to `/completar-perfil` | `proxy.test.ts` | Killed |
| M27 | `web/lib/auth/password.ts:2` | max 72 -> 100 | `password.test.ts`, `redefinir-senha/__tests__/actions.test.ts` | Killed |

**Sensor depth**: P0-full manual fault injection (27 mutations over auth boundary, redirect safety, enumeration, session/recovery, throttle, password policy).
**Result**: 26/27 killed, 1 survived (M21) -> FAIL until a test pins the `/api/*` 403 (or the dead branch/AC is removed from the spec).

---

## Deviations Assessment (tasks.md D1..D8)

| # | Verdict | Reasoning |
| --- | --- | --- |
| D1 `E2E_PORT` | Acceptable | Test infra only; `playwright.config.ts` and `auth-config.test.ts:32` (3100 in redirect list) agree. |
| D2 `max_frequency` deferred to T27 | Acceptable, resolved | Final `config.toml:269` = `"60s"`, locked by `auth-config.test.ts:39-42`; AC S2.16 met. |
| D3 template registration in T5 | Acceptable | Final state wired and tested (`email-templates.test.ts:46-64`). |
| D4 templates code+link until T27 | Acceptable, resolved | Final `magic_link.html` and `confirmation.html` have no `{{ .Token }}` (`email-templates.test.ts:24,28`). |
| D5 gate = unit + touched e2e per task | Acceptable | Full e2e was run here once: 190/190. |
| D6 `/entrar` OTP removed before helper swap | Acceptable | Transient ordering; final suite green. |
| D7 home CTAs unchanged ("Sou investidor" -> `/descobrir/1`) | Acceptable | No AC requires changing the home CTAs; AUTH-17 only needs the producer welcome public (`home.spec.ts:35-51`). Flagged by the author for product confirmation. |
| D8 `acceptTerms` uses `postAuthDestination` | Acceptable, improves AC S1.5 | Pinned by `termos/__tests__/actions.test.ts:96-104`. |

**Unrecorded deviations found by this verification** (not in the table): (a) P2.1 `config.toml` keeps 1000 rate limits; (b) S2.12 bad `type` redirects to `/entrar?erro=link-expirado`; (c) S5.16 recovery allow-list also admits `/esqueci-senha*`; (d) P2.3 duplicate-signup notice is code, not a template file; (e) S2.7a notice lacks a reset link.

---

## Code Quality / Payload-Conjunction Spot Check

| Check | Status |
| --- | --- |
| Tests map to ACs (spot-check stories 1, 2, 4, 5) | Yes, `describe` titles cite AUTH ids |
| Payload/conjunction rule | Mostly met: `toHaveBeenCalledWith({email, token, type})` (`codigo/__tests__/actions.test.ts:49-53`), `signUp` payload (`cadastro/__tests__/actions.test.ts:82-86`), `trackEvent` payloads. Exceptions: AUTH-01.6 asserts call order only (`post-auth.test.ts:44`); Sair in mobile/producer nav asserts presence only |
| Per-layer coverage (domain 1:1 ACs; routes happy+edge+error) | Met for actions/lib; UI strings for resend confirmations and loading states unasserted |
| Documented guidelines | none - strong defaults applied |

---

## Fix Plans

1. **Pin or remove the `/api/*` 403** (AUTH-01.7, M21): add a `ROUTE_ACCESS`/`proxy` test with a wrong-role `/api/...` request asserting `status 403` and JSON body, or drop the unreachable branch and adjust the AC. Priority: Major.
2. **Add the reset-password link to the duplicate-signup notice** and assert it (`cadastro/actions.ts:82`, S2.7a); consider moving the text to a pt-BR template under `supabase/templates/` (P2.3). Priority: Major.
3. **Log provider errors on the server** in the send paths (`magic-link-actions.ts`, `esqueci-senha/actions.ts`, `esqueci-senha/codigo/actions.ts`, `cadastro/actions.ts`) and assert it (P2.5). Priority: Major.
4. **Resolve P2.1**: either record a Deviation for the `1000` dev values in `config.toml` or add a test/CI check that production values exist (DEPLOY.md), and decide how "valores de produção em config.toml" is satisfied. Priority: Major.
5. **Add tests**: S3.5 (pending state), S4.6 and S4.9 (magic link for unconfirmed and passwordless users), edge "redirect as list" (and fix `entrar/page.tsx:20-21` to take the first value), AUTH-01.9 for `/esqueci-senha`, AUTH-01.10 wiring for mobile/producer nav, S3.14 44 px on auth forms. Priority: Minor.
6. **Clarify the spec** (S2.12 target for invalid `type`; S5.9 `maxLength 6` vs paste with spaces; S5.10 "ou autenticada"; S5.16 `/esqueci-senha*`; P2.2 "mesmo código HTTP"; P2.4 prod URLs; P3.1 trigger) and assert the literal confirmation strings ("Enviamos outro e-mail/link/código"). Priority: Minor.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| --- | --- | --- |
| AUTH-02, AUTH-04 (except S2.12 precision), AUTH-06, AUTH-08, AUTH-14, AUTH-16 (header), AUTH-17, AUTH-18, AUTH-11 | Pending | Verified |
| AUTH-01 | Pending | Needs Fix (7 `/api`, 6 weak) |
| AUTH-03 | Pending | Needs Fix (7a) |
| AUTH-05 | Pending | Needs Fix (5, 14 weak) |
| AUTH-07 | Pending | Needs Fix (6, 9) |
| AUTH-09 | Pending | Needs Fix (P2.5 logging) |
| AUTH-10 | Pending | Needs Fix (P2.1) |
| AUTH-12 | Pending | Needs Fix (P2.3 notice, P2.4) |
| AUTH-13 | Pending | Weak (P2.2) |
| AUTH-15 | Pending | Verified (4 weak) |

---

## Summary

**Overall**: FAIL - Not ready until Fix Plans 1-4 are done.

**Spec-anchored check**: 64/90 rows matched the spec outcome with located assertions; 13 weak; 4 spec-precision gaps (plus 2 PASS rows annotated); 9 gaps (no evidence or outcome not met)
**Sensor**: 26/27 mutations killed (M21 survived)
**Gate**: lint 0, typecheck 0, unit 533 passed / 0 failed, e2e 190 passed / 0 failed

**What works**: redirect safety and destination resolution, anti-enumeration in all three flows, recovery-session restriction, throttle, password policy, trigger and RLS-level behavior, event capture without PII. All gates are green and all but one injected fault were caught.

**Issues found**: see Fix Plans.

**Next steps**: route Fix Plans 1-4 to an implementer, then re-dispatch the Verifier (fix -> re-verify iteration 1 of 3).
