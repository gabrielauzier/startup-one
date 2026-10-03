# Login com e-mail e senha, magic link e reset de senha - Validation (final re-verification, round 2)

**Date**: 2026-10-02
**Spec**: `.specs/features/login-e-reset-de-senha/spec.md` (amended in `9c2ad9f`, Independent Test line refreshed in `aa1a0fb`)
**Diff range**: `21f89e8^..aa1a0fb` (spec docs, implementation `cc7b052..f83c9c2`, fix round 1 `f83c9c2..9c2ad9f`, fix round 2 `9c2ad9f..aa1a0fb`)
**Verifier**: independent sub-agent (author != verifier); evidence re-derived from the files at HEAD, not from the previous report
**Verdict**: **PASS (with notes)**: every AC has a located assertion matching the (amended) spec outcome; no non-equivalent mutant survives; remaining items are optional weak rows and owner confirmation of three scope-lowering amendments

---

## Gate Check (HEAD `aa1a0fb`)

- lint `npm run lint`: exit 0
- typecheck `npm run typecheck`: exit 0
- unit `npm run test`: 70 files, **548 passed, 0 failed**
- e2e full suite `E2E_PORT=3100 npx playwright test --workers=3`: **194 passed, 0 failed, 0 skipped**, 1.6 min (+1 vs round 1: `web/e2e/entrar.spec.ts:114` "redirect repetido")
- Isolation: `git status --porcelain` identical before and after the sensor (UNCHANGED); scratch worktree removed and pruned.
- Tasks: all 43 checked; D9 added.

---

## Round-2 gaps (from round 1): re-check

| Gap | Evidence now | Status |
| --- | --- | --- |
| N3g `signup.signUp` log unpinned | `web/app/(marketing)/cadastro/__tests__/actions.test.ts:119-123` `errorLog toHaveBeenCalledWith("[auth] signup.signUp",{code:"unexpected_failure",status:500})` and no "Database" in log calls; mutant killed | Closed |
| N3f `signup.resend` log in `resendConfirmation` | `web/app/(marketing)/entrar/__tests__/magic-link-actions.test.ts:220-221` `toHaveBeenCalledWith("[auth] signup.resend",{code:undefined,status:500})`; mutant killed | Closed |
| N4b `firstParam` wiring on `/entrar` | `web/e2e/entrar.spec.ts:114-125`: `/entrar?redirect=/produtor/pedidos&redirect=/x` shows "Entre para continuar", logs in, `waitForURL("**/produtor/pedidos")`. Mutant (page reverted to `typeof === "string"`) run in scratch with the e2e on port 3101: the test FAILS at `entrar.spec.ts:119` (killed). Unit-only runs still pass, as expected | Closed |
| N5 paste `preventDefault` | `web/app/(marketing)/esqueci-senha/codigo/__tests__/codigo-form.test.tsx:25-27` asserts `fireEvent.paste` returned `false` (default prevented); mutant now killed | Closed |
| Stale "Independent Test" (AUTH-13) | `spec.md:245` now compares action results (destination screen and returned state) | Closed |

## Round-0 gaps: re-check (carried from round 1)

| # | Round-0 gap | Evidence now | Status |
| --- | --- | --- | --- |
| 1 | AUTH-01.7 `/api/*` 403 untested, M21 survived | `web/__tests__/proxy.test.ts:178-186` forces a wrong-role result for `/api/restrita` and asserts `status 403`, JSON `{error:"Sem permissão"}`, no `location`; pages never JSON. Mutants N1 (403->401) and N2 (branch removed) killed. The test needs a `resolveAccess` mock because no real route rule matches `/api/*`: the branch is still dead in production | Closed (dead branch remains, acceptable) |
| 2 | AUTH-03.7a notice without reset link | `web/app/(marketing)/cadastro/actions.ts:79-86` body now has `${origin}/entrar` and `${origin}/esqueci-senha`; `cadastro/__tests__/actions.test.ts:139-140` asserts both URLs; mutant N6 killed | Closed |
| 3 | AUTH-10.5 no server logging | `web/lib/auth/messages.ts:23-33` `logAuthError` (code/status only) wired at 6 send sites. Asserted for `magic-link.signInWithOtp` (`magic-link-actions.test.ts:97`), `reset.resetPasswordForEmail` (`esqueci-senha/__tests__/actions.test.ts:90`), `reset.resend` (`esqueci-senha/codigo/__tests__/actions.test.ts:148`), `signup.resend` from `signUpAction` (`cadastro/__tests__/actions.test.ts:189`). **Not asserted**: `signup.resend` in `resendConfirmation` (N3f survived) and `signup.signUp` (N3g survived) | Partly closed (2 of 6 sites unpinned) |
| 4 | AUTH-10.1 `config.toml` kept 1000, unrecorded | Spec amended (see below); `web/lib/auth/__tests__/deploy-doc.test.ts:10-27` checks `DEPLOY.md` values (100/h, 30 per 5 min, 30 per 5 min, `max_frequency`, `AUTH_COOKIE_SECRET`), the "1000 only for local E2E" warning, and the comment in `config.toml:236,248`; D9 recorded | Closed by amendment (see legitimacy) |
| 5 | AUTH-07.6 and .9 no evidence | `web/e2e/magic-link.spec.ts:113-130` passwordless user opens link in a clean context and lands on `/produtor`; `:132-157` unconfirmed user gets the link, lands on `/produtor` with an `-auth-token` cookie and can then log in with the password | Closed |
| 6 | AUTH-05.5 and .14 untested | `web/app/(marketing)/entrar/__tests__/entrar-form.test.tsx:86-98` pending state: `getByRole("button",{name:"Entrando…"}).disabled === true` (N8 killed); `:100-112` asserts class `h-11`/`min-h-11`/`min-w-11` on fields and buttons (class-name proxy, no computed size) | Closed (44 px is a class assertion: WEAK) |
| 7 | Edge "redirect as list" | `web/lib/auth/redirect.ts:71-78` `firstParam`; used in `entrar/page.tsx`, `cadastro/page.tsx`, `completar-perfil/page.tsx`, `termos/page.tsx`; unit `redirect.test.ts:140-150` (N4 killed). Page wiring has no test (N4b survived: reverting `entrar/page.tsx` to `typeof === "string"` keeps all 50 related tests green; no e2e sends `?redirect=a&redirect=b`) | Partly closed |
| 8a | AUTH-01.9 `/esqueci-senha` | `web/e2e/esqueci-senha.spec.ts:53-65` `waitForURL("**/produtor")` | Closed |
| 8b | Sair wiring in mobile/producer nav | `components/shared/__tests__/MobileBottomNav.test.tsx:24`, `components/producer/__tests__/BottomNav.test.tsx:31` submit the form and expect `signOutAction` once (N7 killed) | Closed |
| 8c | AUTH-15.4 failure test for `verifyResetCode`, `requestMagicLink` | `esqueci-senha/codigo/__tests__/actions.test.ts:102-110`, `entrar/__tests__/magic-link-actions.test.ts:125-131`; N9 killed | Closed |
| 8d | AUTH-01.6 state not asserted; "Enviamos outro e-mail/link/código" strings unasserted; 429 mapping-only | unchanged | Still WEAK (accepted: 429 not reproducible locally) |
| SP | AUTH-08.9 paste vs `maxLength` | `codigo-form.tsx:30-37` `onPaste` keeps the first 6 digits; `codigo/__tests__/codigo-form.test.tsx:21-40` pasting `"123 456"` gives `"123456"`, `"código: 12345678"` gives `"123456"`, `"abc"` leaves the field empty (N5b killed). N5 (drop `preventDefault`) survived but is probably an equivalent mutant: with the field already holding 6 chars the browser default paste is truncated by `maxLength`; jsdom cannot observe it and there is no e2e paste test | Closed (jsdom only) |

---

## Spec amendments: legitimacy review

| Amendment | Judgment | Reasoning |
| --- | --- | --- |
| AUTH-04.12 invalid `type` -> `/entrar?erro=link-expirado` | Legitimate | The old text pointed to criterion 11, which only makes sense for a signup link; an invalid `type` carries no signup context. The code and tests (`route.test.ts:78-84`, `auth-confirm.spec.ts:98-101`) already did this and the amendment documents the observable outcome. User outcome unchanged. |
| AUTH-14.10 "nenhuma sessão (nem de recuperação nem de usuário autenticado)" | Legitimate | Resolves an ambiguity (original reading was self-contradictory); matches `redefinir-senha.spec.ts:11-15`. |
| AUTH-14.16 also allows `/esqueci-senha*` | Legitimate, small relaxation | Needed so a user in a recovery session can ask for another code; `/esqueci-senha` redirects logged users back to a restricted destination, so no private route opens. Pinned by `proxy.test.ts` (N10 killed). Product owner should confirm (assumption "Confirmed? n" style). |
| AUTH-10.1 production values only in `DEPLOY.md`, doc checked by a test | Legitimate but it **lowers the bar**: the original AC demanded production values in `config.toml`. `config.toml` only configures local, the E2E suite needs 1000, and the cloud project is set in the panel, so the change is technically sound; yet it was made by the implementer, not the spec owner. Flag for owner confirmation (D9 says so only implicitly). |
| AUTH-13.2 "same action result" instead of "same HTTP code" | Legitimate | Server actions have no meaningful per-flow HTTP code; the new wording matches what the tests assert (`esqueci-senha/__tests__/actions.test.ts:48-62`, `cadastro/__tests__/actions.test.ts:151-164`, `magic-link-actions.test.ts:67-74`). The "Independent Test" line still says "resposta HTTP e o corpo" (stale text). |
| AUTH-12.3 duplicate-signup notice built by the app, not a template | Legitimate but lowers the bar | Matches the implementation and `DEPLOY.md` section 0.3 (`sendEmail` is still a console stub). Legal review (assumption Q10) of the text is untouched. |
| AUTH-12.4 prod URLs documented in `DEPLOY.md`, `config.toml` local only | Legitimate | Production domains are unknown at this stage; prior AC could not be met by anyone. Test covers local origins only (`auth-config.test.ts:27-33`). |
| AUTH-18.1 trigger = logged user with profile, without `has_password`, on a chrome screen | Legitimate | Aligns the AC with what a passwordless MVP account is; `current-role.test.ts:25-30`, `aviso-senha.spec.ts:5-20`. |

None looks like goalpost-moving to hide a failing test: each change either removes a contradiction or matches behavior that was already tested before the round, and the three that reduce scope (AUTH-10.1, AUTH-12.3, AUTH-12.4) are justified by environment limits. They should still be confirmed by the spec owner (all assumptions are "Confirmed? n").

---

## Spec-Anchored Acceptance Criteria (full re-derivation)

Legend: PASS, WEAK (partial assertion), GAP, SPEC-GAP. Paths relative to `web/` unless noted.

### AUTH-01, 11, 16, 17

| AC | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| 01.1 | investidor/empresa + `/produtor/painel` -> `/negocios` or `/descobrir/1` | `lib/auth/__tests__/post-auth.test.ts:76-82` `toBe("/negocios")`; `e2e/auth-redirect.spec.ts:21` | PASS |
| 01.2 | produtor + `/interesses` -> `/produtor/painel` or `/produtor` | `post-auth.test.ts:84-90`; `auth-redirect.spec.ts:32` | PASS |
| 01.3 | safe + allowed redirect honored | `post-auth.test.ts:68-74`; `e2e/entrar.spec.ts:42` | PASS |
| 01.4 | unsafe list ignored | `lib/auth/__tests__/redirect.test.ts:75-97`; `post-auth.test.ts:92-98`; `auth-redirect.spec.ts:36-47` | PASS |
| 01.5 | no terms -> `/termos` first, then validated destination | `post-auth.test.ts:35-51`; `auth-redirect.spec.ts:18-21`; `app/(marketing)/termos/__tests__/actions.test.ts:96-104` | PASS |
| 01.6 | answers migrated before any redirect | `post-auth.test.ts:44,65` (call order of a mock; M14 killed); no `investor_answers` row asserted in any e2e | WEAK |
| 01.7 | wrong role on page -> role home + aviso; JSON 403 only for `/api/*` | `__tests__/proxy.test.ts:98-120` and `:178-186` (403 JSON via forced rule) | PASS |
| 01.7a | role homes; aviso only with global chrome | `proxy.test.ts:98-120`; `redirect.test.ts:139-146`; `components/shared/__tests__/AppChrome.test.tsx:69-77,96-99`; `auth-redirect.spec.ts:49-69` | PASS |
| 01.8 / 11 | profile-less user -> "Complete seu perfil" | `proxy.test.ts:78-86`; `e2e/completar-perfil.spec.ts:16-24` | PASS |
| 01.9 | logged user on `/entrar`, `/cadastro`, `/esqueci-senha` -> role default | `entrar.spec.ts:87`; `e2e/cadastro.spec.ts:58`; `e2e/esqueci-senha.spec.ts:53-65` | PASS |
| 01.10 / 16 | Sair in header, mobile nav, producer chrome | `components/shared/__tests__/SiteHeader.test.tsx:35`; `MobileBottomNav.test.tsx:24`; `BottomNav.test.tsx:31`; `lib/auth/__tests__/sign-out.test.ts:27-34`; `auth-redirect.spec.ts:77-83` | PASS |
| 01.11 / 17.11 | visitor sees producer welcome | `e2e/produtor-boas-vindas.spec.ts:9-15`; `lib/auth/__tests__/roles.test.ts:81-84` | PASS |
| 01.12 / 17.12 | visitor on work routes -> `/entrar?redirect=` | `roles.test.ts:86-96`; `auth-redirect.spec.ts:90-93` | PASS |

### AUTH-02, 03, 04, 09, 11, 12 (signup)

| AC | Spec outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| S2.1-2.2 | form fields, `?perfil=` | `app/(marketing)/cadastro/__tests__/cadastro-form.test.tsx:13-35`; `e2e/cadastro.spec.ts:5-14` | PASS |
| S2.3-2.5 | password/confirm/nome validation, no Supabase call | `cadastro-form.test.tsx:44-69`; `cadastro/__tests__/actions.test.ts:54-67` | PASS |
| S2.6 | `signUp` with `data{role,nome}`, redirect | `actions.test.ts:79-90`; `e2e/cadastro-confirmacao.spec.ts:41-62` | PASS |
| S2.7 / 7b | duplicate: same screen, no new user; unconfirmed resend under cooldown | `actions.test.ts:127-149,151-164,167-176`; `cadastro-confirmacao.spec.ts:117` | PASS |
| S2.7a | notice with links to enter and reset | `actions.test.ts:139-140` `toContain("https://iasy.test/entrar")`, `toContain("https://iasy.test/esqueci-senha")` (N6 killed); transport is a stub (WHERE-scoped) | PASS |
| S2.8, 9, 9a | trigger role rules | `cadastro-confirmacao.spec.ts:127-138`; `e2e/rls-auth-trigger.spec.ts:40-75` | PASS |
| S2.10 | confirm link in clean browser | `cadastro-confirmacao.spec.ts:41-77`; `e2e/auth-confirm.spec.ts:13-38` | PASS |
| S2.11 | invalid/used link -> `?erro=expirado` | `app/auth/confirm/__tests__/route.test.ts:63-70`; `auth-confirm.spec.ts:59`; `e2e/cadastro-confirmar-email.spec.ts:39-56` | PASS |
| S2.12 | bad `type` -> `/entrar?erro=link-expirado`; unsafe `next` ignored | `route.test.ts:52-61,78-84`; `auth-confirm.spec.ts:98-101` (matches amended text) | PASS |
| S2.13 | resend, "Enviamos outro e-mail", 60 s countdown | `components/auth/__tests__/ResendForm.test.tsx:11-38`; literal string (`cadastro/confirmar-email/page.tsx:38`) never asserted | WEAK |
| S2.14 | cap -> "Muitos pedidos..." | `entrar/__tests__/magic-link-actions.test.ts:187-195`; `cadastro-confirmar-email.spec.ts:76-89` | PASS |
| S2.15 | provider failure message, screen kept | `magic-link-actions.test.ts:197-204`; "resend enabled" not asserted | WEAK |
| S2.16 | config values locked | `lib/auth/__tests__/auth-config.test.ts:20-42` | PASS |

### AUTH-05 (password login)

| AC | `file:line` + assertion | Result |
| --- | --- | --- |
| S3.1 | `entrar-form.test.tsx:13-31`; `entrar.spec.ts:5-18` | PASS |
| S3.2 | `entrar/__tests__/sign-in-password.test.ts:35-42`; `entrar.spec.ts:20-30` | PASS |
| S3.3 | `sign-in-password.test.ts:53-54`; `entrar.spec.ts:56,62`; `e2e/auth-gotrue-contract.spec.ts:171-178` | PASS |
| S3.4 | `sign-in-password.test.ts:77-81`; `entrar.spec.ts:74-77` | PASS |
| S3.5 | `entrar-form.test.tsx:86-98` (disabled + "Entrando…") | PASS |
| S3.6 | `entrar.spec.ts:55-58`; `e2e/a11y-auth.spec.ts:45-47` | PASS |
| S3.7-3.10 | `entrar-form.test.tsx:50-69`; `entrar.spec.ts:37,92,95` | PASS |
| S3.11 | `AppChrome.test.tsx:30-50`; `entrar.spec.ts:17` | PASS |
| S3.12 | `e2e/reset-senha.spec.ts:63-66`; `sign-in-password.test.ts:58-67` | PASS |
| S3.13 / 10.13 | `sign-in-password.test.ts:84-93` (mapping only; GoTrue 429 not reproducible locally) | WEAK |
| S3.14 | autocomplete: `entrar-form.test.tsx:33-38`, `cadastro-form.test.tsx:80-85`; 44 px: class-name assertions only (`entrar-form.test.tsx:100-112`) | WEAK |

### AUTH-06, 07, 09 (magic link)

| AC | `file:line` + assertion | Result |
| --- | --- | --- |
| S4.1 | `magic-link-actions.test.ts:48-54`; `e2e/magic-link.spec.ts:9,22` | PASS |
| S4.2 | `magic-link-actions.test.ts:67-74`; `magic-link.spec.ts:42-65`; `auth-gotrue-contract.spec.ts:81-92` | PASS |
| S4.3 | `lib/auth/__tests__/email-templates.test.ts:18-25`; `magic-link.spec.ts:26-28` | PASS |
| S4.4 | `magic-link.spec.ts:31-38`; `auth-confirm.spec.ts:62-80` | PASS |
| S4.5 | `magic-link.spec.ts:83-84`; `route.test.ts:72-76` | PASS |
| S4.6 | `magic-link.spec.ts:132-157` (unconfirmed user: session cookie, destination, password login works) | PASS |
| S4.7 | e-mail not in URL `entrar.spec.ts:109-111`; "Enviamos outro link." (`link-enviado/page.tsx:27`) not asserted | WEAK |
| S4.8 | `magic-link-actions.test.ts:139-150`; `magic-link.spec.ts:100-104` | PASS |
| S4.9 | `magic-link.spec.ts:113-130` (passwordless user) | PASS |

### AUTH-08, 14, 10 (reset)

| AC | `file:line` + assertion | Result |
| --- | --- | --- |
| S5.1-5.3 | `esqueci-senha/__tests__/actions.test.ts:38-62`; `e2e/esqueci-senha.spec.ts:17-35`; `auth-gotrue-contract.spec.ts:152-159` | PASS |
| S5.2 | `email-templates.test.ts:31-38`; `esqueci-senha.spec.ts:21-22` | PASS |
| S5.4 | `lib/auth/__tests__/auth-context-cookie.test.ts:54-98`; `esqueci-senha.spec.ts:18` | PASS |
| S5.5 | `esqueci-senha/codigo/__tests__/actions.test.ts:49-54`; `e2e/esqueci-senha-codigo.spec.ts:36-39` | PASS |
| S5.6 | `codigo/__tests__/actions.test.ts:63-73`; `esqueci-senha-codigo.spec.ts:51,60-93` | PASS |
| S5.7 | `codigo/__tests__/actions.test.ts:111-115`; `esqueci-senha-codigo.spec.ts:60-93`; "Enviamos outro código." (`codigo/page.tsx:30`) not asserted | WEAK |
| S5.8 / 10.8 | `codigo/__tests__/actions.test.ts:83-92` (mapping only) | WEAK |
| S5.9 | attributes `codigo-form.test.tsx:12-19`, `esqueci-senha-codigo.spec.ts:30-32`; paste `codigo-form.test.tsx:21-40`; server strip `codigo/__tests__/actions.test.ts:57-61` | PASS (jsdom) |
| S5.10 | `e2e/redefinir-senha.spec.ts:11-15` (amended wording: no session) | PASS |
| S5.11-5.13 | `redefinir-senha.spec.ts:17-47`; `redefinir-senha/__tests__/actions.test.ts:63-92` | PASS |
| S5.14 | `redefinir-senha/__tests__/actions.test.ts:46-52`; `reset-senha.spec.ts:49-53`; `redefinir-senha.spec.ts:64` | PASS |
| S5.15 | `redefinir-senha.spec.ts:66-67`; `email-templates.test.ts:40-44` | PASS |
| S5.16 | `proxy.test.ts:137-152`; `reset-senha.spec.ts:13-16` (matches amended allow-list) | PASS |
| S5.17 | `reset-senha.spec.ts:57-79` | PASS |

### P2 / P3

| AC | `file:line` + assertion | Result |
| --- | --- | --- |
| 10.1 (amended) | `lib/auth/__tests__/deploy-doc.test.ts:10-27`; `auth-config.test.ts:39-42` | PASS (amended) |
| 13.2 (amended) | per-flow equality `esqueci-senha/__tests__/actions.test.ts:48-62`, `magic-link-actions.test.ts:67-74`, `cadastro/__tests__/actions.test.ts:151-164` | PASS |
| 12.3 (amended) | `email-templates.test.ts:10-64` | PASS |
| 12.4 (amended) | `auth-config.test.ts:27-33`; docs `DEPLOY.md` section 1.3 | PASS (docs; no prod URLs yet) |
| 10.5 / 09 | no leak: `magic-link-actions.test.ts:84-94`, `esqueci-senha/__tests__/actions.test.ts:81-93`, `cadastro/__tests__/actions.test.ts:178-191`; logging asserted at all 6 send-error sites (`cadastro/__tests__/actions.test.ts:119`, `:189`; `magic-link-actions.test.ts:97`, `:220`; `esqueci-senha/__tests__/actions.test.ts:90`; `codigo/__tests__/actions.test.ts:148`) | PASS |
| 15.1 | `e2e/auth-eventos.spec.ts:117-119` (each of 11 types incremented) | PASS |
| 15.2 | `auth-eventos.spec.ts:129-136`; `sign-in-password.test.ts:115-124` | PASS |
| 15.3 | `e2e/events-auth-types.spec.ts:21-28`; `lib/analytics/__tests__/track-auth-types.test.ts:33-46` | PASS |
| 15.4 | failure tolerance asserted at all 8 call sites now (`sign-out.test.ts:46-51`, `sign-in-password.test.ts:127-133`, `route.test.ts:107-111`, `esqueci-senha/__tests__/actions.test.ts:104-108`, `redefinir-senha/__tests__/actions.test.ts:120-124`, `cadastro/__tests__/actions.test.ts:101-105`, `magic-link-actions.test.ts:125-131`, `codigo/__tests__/actions.test.ts:102-110`) | PASS |
| 18.1 (amended) | `SetPasswordNotice.test.tsx:20-27,41-50`; `current-role.test.ts:25-30`; `aviso-senha.spec.ts:5-20` | PASS |
| 18.2 | `SetPasswordNotice.test.tsx:29-38`; `aviso-senha.spec.ts:22-25` | PASS |

### Edge cases

| Edge | `file:line` | Result |
| --- | --- | --- |
| Other-browser confirm; original tab unchanged | `cadastro-confirmacao.spec.ts:50-53` (clean context; original tab not asserted) | WEAK |
| Scanner consumes link | `magic-link.spec.ts:67-85`; `auth-confirm.spec.ts:82-96` | PASS |
| Logged in other tab | `entrar.spec.ts:80-88` | PASS |
| `redirect`/`next` list -> first value | `next`: `redirect.test.ts:127-130`; helper `redirect.test.ts:140-150`; page wiring pinned by `e2e/entrar.spec.ts:114-125` | PASS |
| E-mail normalized | `sign-in-password.test.ts:37-41`; `magic-link-actions.test.ts:43-50` | PASS |
| Orphan account | `proxy.test.ts:78-86`; `completar-perfil.spec.ts:6-25` | PASS |
| Pasted code with spaces | `codigo-form.test.tsx:21-28`; `codigo/__tests__/actions.test.ts:57-61` | PASS |

**Tally**: PASS 68 rows, WEAK 8 (S2.13, S2.15, S3.13, S3.14, S4.7, S5.7, S5.8, 01.6; plus the edge "original tab unchanged"), GAP 0, SPEC-GAP 0 after amendments. All remaining WEAK items are partial assertions, not unmet outcomes.

---

## Discrimination Sensor

Scratch: `git worktree add --detach <scratchpad>/sensor HEAD` (`9c2ad9f`), `web/node_modules` symlinked, `.env.local` copied; one mutation at a time on one file, covering vitest files run, file restored.

| # | File | Mutation | Result |
| --- | --- | --- | --- |
| N1 | `web/proxy.ts:86` | `/api` 403 -> 401 | Killed |
| N2 | `web/proxy.ts:85` | `/api` branch always taken (JSON for pages) | Killed (5 failed) |
| N3 | `web/lib/auth/messages.ts:32` | `logAuthError` body removed | Killed |
| N3b | same | log the whole error object (message leak) | Killed |
| N3c | `entrar/magic-link-actions.ts:50` | drop `logAuthError("magic-link.signInWithOtp")` | Killed |
| N3d | `esqueci-senha/actions.ts` | drop `logAuthError("reset.resetPasswordForEmail")` | Killed |
| N3e | `esqueci-senha/codigo/actions.ts` | drop `logAuthError("reset.resend")` | Killed |
| N3f | `entrar/magic-link-actions.ts:108` | drop `logAuthError("signup.resend")` in `resendConfirmation` | Killed (round 2) |
| N3g | `cadastro/actions.ts:98` | drop `logAuthError("signup.signUp")` | Killed (round 2) |
| N4 | `web/lib/auth/redirect.ts:74` | `firstParam` ignores lists | Killed |
| N4b | `entrar/page.tsx:24` | page reverts to `typeof === "string"` | Killed by e2e `entrar.spec.ts:114` (unit files alone still pass; the pin is the e2e) |
| N5 | `esqueci-senha/codigo/codigo-form.tsx:33` | drop `preventDefault` in `onPaste` | Killed (round 2, `defaultPrevented` asserted) |
| N5b | same `:31` | `slice(0,7)` | Killed |
| N6 | `cadastro/actions.ts:83` | duplicate notice drops the reset link | Killed |
| N7 | `components/shared/MobileBottomNav.tsx:46` | Sair form not wired to `signOutAction` | Killed |
| N8 | `entrar/entrar-form.tsx:144` | button not disabled while pending | Killed |
| N9 | `esqueci-senha/codigo/actions.ts:27` | event failure not swallowed | Killed |
| N10 | `web/proxy.ts:46` | recovery allow-list drops `/esqueci-senha` | Killed |
| M1 | `lib/auth/redirect.ts:21` | accept `/\evil.com` | Killed |
| M2 | `lib/auth/post-auth.ts:56` | skip `resolveAccess` | Killed |
| M4 | `lib/auth/throttle.ts:7` | cap 3 -> 4 | Killed |
| M5 | `lib/auth/throttle.ts:49` | cooldown removed | Killed |
| M7 | `entrar/magic-link-actions.ts` | `shouldCreateUser:true` | Killed |
| M8a | `esqueci-senha/codigo/actions.ts:54` | `type:"recovery"` -> `"email"` | Killed |
| M9 | `redefinir-senha/actions.ts:54` | drop `signOut({scope:"others"})` | Killed |
| M10 | `app/auth/confirm/route.ts:27` | accept `type=recovery` | Killed |
| M11 | `lib/auth/password.ts:1` | min 8 -> 6 | Killed |
| M12 | `lib/auth/roles.ts:22` | `/produtor/painel` public | Killed |
| M13 | `cadastro/actions.ts:78` | `signUp` also for confirmed accounts | Killed |
| M14 | `lib/auth/post-auth.ts:48` | skip `migrateAnswers` | Killed |
| M16 | `web/proxy.ts:56` | recovery flag ignored | Killed |
| M17 | `esqueci-senha/actions.ts:34` | surface GoTrue 429 | Killed |

**Sensor depth**: P0-full manual injection, 31 distinct mutations over the two rounds; round 2 re-ran N3f, N3g, N4b, N5 plus 17 carried (N1, N2, N3c, N4, N5b, N6, N10, M1, M2, M8a, M9, M10, M11, M12, M13, M14, M16, M17), all killed (N4b via e2e). Real worktree porcelain UNCHANGED, scratch removed.
**Result**: 31/31 killed. PASS.

---

## Deviations Assessment

D1-D8 unchanged and acceptable (see round 0: resolved or transient). **D9** (spec amendments + `/esqueci-senha*` in recovery): acceptable on the merits (see legitimacy table), but the row sits before D5 in the table and only says "ver validation.md"; owner confirmation of AUTH-10.1/12.3/12.4 is still pending.

---

## Remaining notes (non-blocking)

1. Optional weak rows: literal "Enviamos outro e-mail/link/código" strings unasserted (`cadastro/confirmar-email/page.tsx:38`, `link-enviado/page.tsx:27`, `codigo/page.tsx:30`); 429 cases mapping-only (not reproducible on local GoTrue); 44 px asserted as class names; AUTH-01.6 asserts call order, not an `investor_answers` row; S2.15 "resend enabled" not asserted; edge "original tab unchanged" not asserted.
2. Owner confirmation pending for the three scope-lowering amendments (AUTH-10.1, 12.3, 12.4) and for D9.
3. The `/api/*` 403 branch is still unreachable in production (no route rule matches `/api/*`); it is pinned only through a mocked rule.

**Why PASS-with-notes rather than FAIL**: validate.md makes surviving mutants and unmet or uncovered ACs the FAIL criteria. Neither exists now: each AC has a located assertion on the spec-defined outcome, the sensor kills 31/31, and the gates are green (548 unit, 194 e2e). The residual items are partial assertions on outcomes that cannot be exercised locally or that are cosmetic, plus a product decision (spec owner sign-off) that no test can resolve.

---

## Requirement Traceability Update

| Requirement | Previous | New |
| --- | --- | --- |
| AUTH-01, 02, 03, 04, 05, 06, 07, 08, 11, 12, 13, 14, 15, 16, 17, 18 | Needs Fix / Verified | Verified |
| AUTH-09 / AUTH-10 (logging, rate-limit docs) | Needs Fix | Verified |

---

## Summary

**Overall**: PASS with notes (final iteration, 3 of 3 used).

**Spec-anchored check**: 68 rows matched the spec outcome (as amended), 9 weak (partial assertions, listed above), 0 unmet, 0 unresolved spec-precision gaps
**Sensor**: 31/31 mutations killed
**Gate**: lint 0, typecheck 0, unit 548/548, e2e 194/194

**What works**: all round-0 and round-1 gaps closed with real assertions; no regression across full suites.

**Next steps**: spec owner confirms AUTH-10.1, 12.3, 12.4 and D9.
