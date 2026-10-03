# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Test time-based cutoffs with fixtures at N-1 and N+1 days so the cutoff constant is actually pinned.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `cron` · harmful: 0
- features: website-mvp
- evidence: M5,M6,M10 web/lib/cron/expiration.ts:28,48,91 (cron)
- last seen: 2026-09-29T02:22:53Z

### L-002 - Assert every side effect an AC names (events, notifications), not just the primary status change, and make test titles match their assertions.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `server-actions` · harmful: 0
- features: website-mvp
- evidence: M13 web/app/(producer)/produtor/interesses/actions.ts:96; M11 caught only by flow-interesse (server-actions)
- last seen: 2026-09-29T02:22:53Z

### L-003 - Give every branch of a scoring function its own case with a hand-computed expected value.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `domain` · harmful: 0
- features: website-mvp
- evidence: M1 web/lib/matching/score.ts:97 (domain)
- last seen: 2026-09-29T02:22:53Z

### L-004 - A library built for a UI behavior is not done until a caller wires it; require an e2e of the behavior, not only unit tests of the module.
- signal: `ac_gap` · recurrence: 1 feature(s) · harmful: 0
- features: website-mvp
- evidence: CA-07.1/CA-07.2 web/lib/offline/draft-store.ts:34 has no caller
- last seen: 2026-09-29T02:22:53Z

### L-005 - Any part of an AC deferred with a TODO to a later task must become an explicit task line, or the AC stays open.
- signal: `ac_gap` · recurrence: 1 feature(s) · harmful: 0
- features: website-mvp
- evidence: CA-07.3 expire-drafts/route.ts:12, CA-19.2 expire-seals/route.ts:12, CA-14.1 revisar/page.tsx:8
- last seen: 2026-09-29T02:22:54Z

### L-006 - Copy formula sub-rules and notification type/channel from the PRD into the spec ACs so tests have an oracle.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: website-mvp
- evidence: RN-24 sub-scores; CA-21.1 notification channel (spec)
- last seen: 2026-09-29T02:22:54Z

### L-007 - Run framework type generation before tsc so the typecheck gate passes on a fresh clone.
- signal: `gate_fail` · recurrence: 1 feature(s) · scope: `gate` · harmful: 0
- features: website-mvp
- evidence: npm run typecheck TS2304 PageProps before next build (gate)
- last seen: 2026-09-29T02:22:54Z

### L-008 - Test the AC's verb end to end (submit, then assert the persisted result), not just the UI state that allows it; HTML-disabled inputs are omitted from form posts.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `forms/e2e` · harmful: 0
- features: website-mvp
- evidence: CA-14.1 web/app/(producer)/produtor/cadastro/2/parte2-form.tsx:119 + cadastro/2/actions.ts:52 (forms/e2e)
- last seen: 2026-09-29T03:53:12Z

### L-009 - Before closing a behavior fix, grep for every entry point that performs the same effect (duplicate routes/crons) and fix or remove each one, starting with the one the design schedules.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `cron/fixes` · harmful: 0
- features: website-mvp
- evidence: CA-07.3 web/app/api/cron/daily/route.ts:73-75 vs design.md:91 (cron/fixes)
- last seen: 2026-09-29T03:53:12Z

### L-010 - A 'warn N days before' notice fired by a recurring job needs an idempotency key or a single-day trigger, or it repeats on every run inside the window.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `cron/notifications` · harmful: 0
- features: website-mvp
- evidence: CA-07.3/CA-19.2 web/lib/cron/expiration.ts:46,135 + lib/notifications/queue.ts (no dedup) (cron/notifications)
- last seen: 2026-09-29T03:53:13Z

### L-011 - When a query-builder chain is mocked, capture and assert the filter arguments (time window, type, id), not just the returned row; otherwise the filter logic is untested.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `tests/supabase-mocks` · harmful: 0
- features: website-mvp
- evidence: S4 web/lib/notifications/queue.ts:214 (tests/supabase-mocks)
- last seen: 2026-09-29T15:01:48Z

### L-012 - Pin every spec-mandated error status and body with a test that reaches the branch, and delete branches no route can reach
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `routes` · harmful: 0
- features: login-e-reset-de-senha
- evidence: M21 web/proxy.ts:86 (validation.md sensor table) (routes)
- last seen: 2026-10-03T01:11:35Z

### L-013 - Assert every link or element an acceptance criterion lists, not only the first one, in notification bodies
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `notifications` · harmful: 0
- features: login-e-reset-de-senha
- evidence: AUTH-03 AC7a web/app/(marketing)/cadastro/actions.ts:82 (notifications)
- last seen: 2026-10-03T01:11:35Z

### L-014 - When a criterion requires logging an error, assert the logger call as well as the absence of the leak
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `observability` · harmful: 0
- features: login-e-reset-de-senha
- evidence: AUTH-10 AC5 (no server logging in app/(marketing)) validation.md P2.5 (observability)
- last seen: 2026-10-03T01:11:35Z

### L-015 - Record a deviation whenever a config value required by an acceptance criterion is kept at a dev value, and lock it with a test
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `config` · harmful: 0
- features: login-e-reset-de-senha
- evidence: AUTH-10 AC1 web/supabase/config.toml:238 validation.md P2.1 (config)
- last seen: 2026-10-03T01:11:35Z

### L-016 - Cover each user-state variant a criterion names (unconfirmed, passwordless, legacy) with at least one end to end test
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `auth` · harmful: 0
- features: login-e-reset-de-senha
- evidence: AUTH-07 AC6 and AC9 (no test with unconfirmed or passwordless user) validation.md S4.6 S4.9 (auth)
- last seen: 2026-10-03T01:11:36Z

### L-017 - Apply the first-value rule for duplicated query params to every param read, not only the one with a unit test
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `routes` · harmful: 0
- features: login-e-reset-de-senha
- evidence: Edge case redirect list web/app/(marketing)/entrar/page.tsx:20 (routes)
- last seen: 2026-10-03T01:11:36Z

### L-018 - Name the exact target URL when a criterion says treat as invalid so tests and code cannot diverge silently
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: login-e-reset-de-senha
- evidence: AUTH-04 AC12 web/app/auth/confirm/__tests__/route.test.ts:78 (spec)
- last seen: 2026-10-03T01:11:36Z

### L-019 - Resolve conflicts between input length limits and paste normalization rules before writing the criteria
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: login-e-reset-de-senha
- evidence: AUTH-08 AC9 web/app/(marketing)/esqueci-senha/codigo/codigo-form.tsx:26 (spec)
- last seen: 2026-10-03T01:11:36Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
