# DEPLOY.md — próximos passos para deploy e testes em ambiente real (Vercel + Supabase)

Estado de partida: o app (`web/`) está completo no ambiente local (Next.js 16, Supabase local), com lint/typecheck/build e a suíte de testes unitários e e2e passando (login por e-mail e senha incluído). **Nada foi publicado ainda.** Este documento lista, em ordem, o que falta para subir e validar em produção/staging — incluindo os pontos em que o código atual **não funciona como está** fora do ambiente local.

Convenção: **[BLOQUEIA]** = o recurso não funciona em produção sem esta ação; **[ATENÇÃO]** = funciona, mas com risco/limitação; **[OPCIONAL]**.

---

## 0. Antes de tudo: decisões e pendências de código

Estes itens exigem alteração de código (ou decisão) *antes* do deploy. Estão no início porque os passos seguintes dependem deles.

### 0.1 ~~[BLOQUEIA]~~ [RESOLVIDO] Cron da Vercel não batia com as rotas
- `web/app/api/cron/daily/route.ts` (e `expire-drafts`, `expire-seals`) só exportam `POST` e autenticam pelo header `x-cron-secret`.
- A Vercel Cron **chama via `GET`** e envia `Authorization: Bearer <CRON_SECRET>` (usa a env `CRON_SECRET` automaticamente). Hoje a chamada agendada receberia `405` e nada expiraria (rascunhos, selos, pedidos, interesses).
- **Feito**: `daily` agora aceita `GET` + `Authorization: Bearer $CRON_SECRET` (e mantém `POST` + `x-cron-secret`), com teste, e `web/vercel.json` foi criado. Descrição original do problema:
- Ação (já aplicada): fazer `daily` aceitar `GET` e validar `Authorization: Bearer ${CRON_SECRET}` (mantendo `POST` + `x-cron-secret` para chamada manual/testes), e atualizar `app/api/cron/daily/__tests__`.
- Criar `web/vercel.json` (não existe):
  ```json
  { "crons": [{ "path": "/api/cron/daily", "schedule": "0 9 * * *" }] }
  ```
  (`0 9 * * *` = 09:00 UTC ≈ 06:00 BRT. No plano Hobby a Vercel permite cron 1x/dia e **não garante o minuto exato** — ok para expirações diárias.)
- Só `daily` precisa ser agendada; `expire-drafts`/`expire-seals` são redundantes (decisão registrada no próprio código). Considere protegê-las igual ou removê-las para não deixar rotas públicas dependentes só de um header.

### 0.2 [BLOQUEIA] E-mail transacional é um stub
- `web/lib/notifications/send-email.ts` só faz `console.log` e retorna `{ ok: true }`. Em produção **nenhum e-mail de aviso é enviado** (interesse aceito, documento liberado, apresentação ao parceiro financeiro etc.), embora o app registre `events` como se tivesse enviado.
- Ação: escolher um provedor (Resend, SendGrid, Postmark, SES), implementar `sendEmail` mantendo a assinatura (`{ to, subject, body }` → `{ ok }`), retornar `ok: false` em falha (para a fila não marcar como enviado) e adicionar a chave nas env vars (§2).
- O e-mail ao **parceiro financeiro** (`presentToPartner`, RN-40) usa a mesma função — é o passo crítico do negócio ("a Îasy não movimenta dinheiro, o parceiro cuida do contrato").
- Avisos ao produtor são `canal='whatsapp_manual'`: **não há automação de WhatsApp** (decisão aceita). Definir quem da equipe consulta `events` (`canal='whatsapp_manual'`, `enviado_em is null`) e envia à mão; sem um processo/painel para isso, esses avisos não chegam ao produtor. [ATENÇÃO]

### 0.3 [BLOQUEIA] Cadastro, link de acesso e reset de senha precisam de SMTP real
- O acesso é por e-mail e senha (feature `login-e-reset-de-senha`): o **cadastro envia e-mail de confirmação**, o **magic link** é um e-mail com link e o **reset de senha** envia um código de 6 dígitos. Localmente os e-mails caem no Mailpit; na nuvem, o SMTP embutido do Supabase é limitado a **poucos e-mails por hora** e restrito a membros da organização no plano gratuito — inviável para usuários reais.
- Ação: configurar SMTP próprio no projeto Supabase (§1.4).
- O aviso ao titular quando alguém tenta se cadastrar com um e-mail já existente usa o `sendEmail` do app (hoje só `console.log`, ver §0.2): enquanto não houver transporte real, esse aviso **não chega** (o cadastro duplicado continua mostrando a mesma tela e não cria usuário).

### 0.4 [ATENÇÃO] Registrar no repo o que hoje só vale localmente
- `web/supabase/config.toml` define `site_url = "http://127.0.0.1:3000"`, `enable_confirmations`, política de senha, `max_frequency`, templates de e-mail de auth, `otp_expiry = 600` (10 min, vale para link e código) e Storage `enabled = false`. **`config.toml` só afeta o ambiente local** — na nuvem tudo isso precisa ser reconfigurado no painel (ou via `supabase config push`, ver §1.6).
- Os buckets `evidences` e `documentos` nunca são criados por migration/seed (ver issue-09). Criar no projeto de nuvem (§1.5) e, para dev local, descomentar os blocos `[storage.buckets.*]` em `config.toml`.

### 0.5 [ATENÇÃO] Verificador (equipe Îasy) não se cadastra pela interface
- O cadastro (`/cadastro`) aceita só `investidor`, `empresa` e `produtor` (o `/entrar` não pede perfil); `role='verificador'` é bloqueado no banco. Os primeiros verificadores precisam ser criados manualmente (§3.3).
- A tabela `partners` precisa ser populada (cooperativas/ONGs indicadoras na tela de boas-vindas; parceiros financeiros usados na apresentação) — hoje só existe seed local.

---

## 1. Supabase (projeto de nuvem)

### 1.1 Criar o projeto
1. Criar um projeto **de staging** primeiro (separado do de produção). Região próxima aos usuários (Brasil: `sa-east-1`) e à região das Functions da Vercel (§2.3), para reduzir latência entre o app e o Postgres.
2. Guardar: **Project URL**, **anon key**, **service_role key**, **database password**, **project ref**.

### 1.2 Aplicar o schema
- Instalar/usar o CLI e vincular: `cd web && npx supabase login && npx supabase link --project-ref <ref>`.
- Aplicar as migrations `0001`–`0014` (`0012` trigger de perfil, `0013` `auth_throttle` e `email_account_status`, `0014` tipos de evento de auth): `npx supabase db push`.
- **Não rodar `supabase/seed.sql` em produção** — ele cria 3 usuários com senha conhecida (`iasy123456`) e um negócio de teste. Em staging, só rodar se for explicitamente para testes (e remover depois).
- Conferir no painel (Table Editor/Auth → Policies) que **RLS está ativa** em todas as tabelas (as migrations já habilitam; validar `0002`, `0004`, `0007`, `0008`).

### 1.3 Auth — URLs
Authentication → URL Configuration:
- **Site URL**: URL final do app (ex.: `https://iasy.vercel.app` ou domínio próprio).
- **Redirect URLs**: o app envia `emailRedirectTo` como um caminho do próprio site, então libere o padrão `/**` de cada origem: `https://<dominio-final>/**`, o domínio de *preview* da Vercel (`https://*-<time>.vercel.app/**`) e, se desejado, `http://localhost:3000/**`. Uma URL fora da lista faz o GoTrue cair no **Site URL** (o usuário perde o destino pedido, mas o link continua funcionando).
- O Site URL precisa ser o domínio final de cada ambiente: os templates montam o link como `{{ .SiteURL }}/auth/confirm?token_hash=…`.

### 1.4 Auth — e-mail e senha, link de acesso e reset por código
Authentication → Providers → Email (espelha `web/supabase/config.toml`, que só vale no ambiente local):
- **Enable email provider** e **Confirm email = ligado** (`enable_confirmations = true`): conta nova só acessa área privada depois de confirmar o e-mail.
- **Minimum password length = 8** e **Password requirements = Letters and digits** (`minimum_password_length = 8`, `password_requirements = "letters_digits"`). O app valida 8 a 72 caracteres, com letra e número, antes de chamar o Supabase.
- **Minimum interval between emails = 60 s** (`max_frequency = "60s"`) e **OTP length = 6**, **OTP expiry = 600 s** (vale para o link do e-mail e para o código de reset; há testes em `lib/auth/__tests__/` que conferem só o arquivo, **não** o projeto de nuvem).
- Authentication → Emails → **SMTP Settings**: ativar SMTP próprio (mesmo provedor do §0.2/0.3), remetente com domínio verificado (SPF/DKIM/DMARC) para não cair em spam.
- Authentication → Emails → **Templates** (colar o conteúdo dos arquivos de `web/supabase/templates/`):

| Template do Supabase | Arquivo | Assunto |
|---|---|---|
| Confirm signup | `confirmation.html` | `Confirme seu e-mail na Îasy` |
| Magic Link | `magic_link.html` (só o link, sem código) | `Seu acesso à Îasy` |
| Reset Password | `recovery.html` (só o código de 6 dígitos, sem link) | `Seu código para redefinir a senha da Îasy` |
| Notificação "Password changed" (ativar) | `password_changed.html` | `Sua senha da Îasy foi alterada` |

  **Sem os templates** o e-mail sai no padrão do Supabase, em inglês e com `{{ .ConfirmationURL }}`: o link não passa pelo `/auth/confirm` e o reset mostraria link em vez do código.
- Authentication → **Rate Limits** (valores iniciais de produção; os `1000` do `config.toml` são **só para a suíte E2E local**): e-mails de auth por hora conforme o plano do SMTP (começar em 100/h), tentativas de login/cadastro por IP 30 a cada 5 min, verificações de token/OTP por IP 30 a cada 5 min. O app ainda limita **por e-mail** o envio de cadastro, link e reset (60 s entre envios e no máximo 3 por hora, tabela `auth_throttle`), e o limite de tentativas do código de reset é o de verificações de token do Supabase.
- **Contas do MVP**: usuários criados pelo login por código não têm senha. Eles entram por **link de acesso** ou definem a senha em **Esqueci minha senha**. Antes de ligar `Confirm email` em produção, conferir que nenhum usuário existente ficaria bloqueado:

```sql
select count(*) from auth.users where email_confirmed_at is null;  -- esperado: 0 (ou só cadastros abandonados)
select u.id from auth.users u left join public.profiles p on p.id = u.id where p.id is null;  -- usuários sem perfil caem em /completar-perfil
```

### 1.5 Storage
- Criar buckets **privados** `evidences` e `documentos` (nomes exatos usados em `cadastro/4/actions.ts` e `lib/documents/signed-url.ts`).
- Limite sugerido: 10 MB por arquivo; tipos `image/jpeg`, `image/png`, `image/heic`, `image/heif`, `application/pdf` (o app valida 10 MB e esses formatos no cliente).
- Acesso é sempre via URL assinada gerada no servidor com a service role; **não** criar policies públicas. Documentos sensíveis usam URL assinada com TTL de 5 min.
- Testar CORS do upload direto do navegador por URL assinada (PUT) — o app envia o arquivo do cliente direto ao Storage.

### 1.6 (Opcional) Config como código
`npx supabase config push` pode aplicar parte do `config.toml` ao projeto vinculado. Revisar o diff antes: o `config.toml` atual aponta `site_url` para localhost e tem `[storage] enabled = false`. Se for usar, criar um `config.toml` de produção separado ou ajustar os valores.

### 1.7 Backups e segurança
- Ativar backups (PITR em plano pago; no mínimo backups diários) antes de receber dados reais — há dados pessoais (CPF/CNPJ, telefone, documentos de terra).
- Guardar a service role key **somente** em variável de ambiente de servidor (nunca `NEXT_PUBLIC_*`).
- LGPD: o app registra autorização de uso de dados e termos (`termos_versao`, `termos_aceitos_em`); validar com o jurídico o texto dos Termos e a política de exclusão ("posso pedir a exclusão quando quiser" — definir o processo operacional).

---

## 2. Vercel

### 2.1 Projeto
- Importar o repositório e definir **Root Directory = `web`** (o app não está na raiz do repo).
- Framework: Next.js (detecção automática). Build: `next build`; Node 22.
- Branch de produção: definir (hoje o trabalho está em `feature/website-mvp`, com PR #1 em rascunho). Preview Deployments automáticos nos PRs.

### 2.2 Variáveis de ambiente
Definir por ambiente (Production / Preview / Development):

| Variável | Valor | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | pública |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key | **segredo**, só servidor; marcar como *Sensitive* |
| `CRON_SECRET` | string aleatória longa (≥32 chars) | segredo; a Vercel Cron a envia como `Authorization: Bearer` (ver §0.1) |
| `AUTH_COOKIE_SECRET` | string aleatória longa (≥32 chars), **diferente por ambiente** | segredo; assina os cookies `iasy_auth_ctx` (e-mail entre telas de cadastro/link/reset) e `iasy_recovery`. **Sem ela, o app falha ao assinar em produção** |
| chave do provedor de e-mail | ex.: `RESEND_API_KEY` | depende do §0.2 |

- Usar **projetos Supabase distintos** para Preview (staging) e Production; nunca apontar Preview para o banco de produção.
- Após cadastrar as variáveis, **redeploy** (variáveis só valem em builds novos).

### 2.3 Região das Functions
Definir a região das Serverless Functions próxima ao Supabase (ex.: `gru1` São Paulo), em `vercel.json` (`"regions": ["gru1"]`) ou nas configurações do projeto.

### 2.4 Domínio
- Adicionar o domínio, configurar DNS e HTTPS.
- Atualizar a **Site URL** / **Redirect URLs** do Supabase (§1.3) com o domínio final.

### 2.5 Service Worker do cadastro
O cadastro offline usa `public/sw-cadastro.js` com escopo `/produtor/cadastro/`. Em produção:
- Confirmar que a Vercel serve `/sw-cadastro.js` com `Content-Type: text/javascript` e que o header `Service-Worker-Allowed` não é necessário (escopo igual ao diretório lógico) — testar o registro em HTTPS.
- Se o SW cacheia o shell por versão, definir uma estratégia de invalidação a cada deploy (evitar produtor preso em build antigo).

---

## 3. Primeiro deploy (staging) — roteiro

1. Criar projeto Supabase de staging (§1.1), aplicar migrations (§1.2), configurar Auth/SMTP/template (§1.3–1.4), criar buckets (§1.5).
2. Implementar as pendências de código do §0 (cron GET + `vercel.json`, `sendEmail` real) em PR próprio.
3. Criar o projeto na Vercel, definir env vars (§2.2), fazer o deploy do branch.
4. Criar os usuários internos (§3.3) e popular `partners` (§3.4).
5. Rodar o **checklist de smoke** (§4) em staging.
6. Só depois repetir 1–5 para produção.

### 3.3 Criar verificadores (equipe)
1. A pessoa faz login normalmente por `/entrar` escolhendo qualquer perfil (cria `auth.users` + `profiles`).
2. No SQL Editor do Supabase, com a service role, promover o papel:
   ```sql
   update public.profiles set role = 'verificador' where id = (select id from auth.users where email = 'pessoa@iasy.com.br');
   ```
   (O banco bloqueia `role='verificador'` vindo do app; a promoção manual é o caminho previsto. Conferir o gatilho/policy em `0002_profiles_rls.sql` — pode exigir executar como `postgres`.)
3. Fazer logout/login para a sessão refletir o novo papel.

### 3.4 Popular `partners`
Cadastrar via SQL/Table Editor, com o `tipo` correto:
- `tipo = 'indicador'` e `ativo = true` → aparecem na pergunta "Chegou até nós por uma cooperativa ou ONG?" (`/produtor`).
- `tipo = 'financeiro'` → destino do e-mail de apresentação (RN-40). **`email_contato` é obrigatório**: sem ele a apresentação falha (`presentToPartner` rejeita parceiro sem e-mail).
  ```sql
  insert into public.partners (nome, tipo, email_contato) values
    ('Cooperativa X', 'indicador', null),
    ('Banco/Fundo Y', 'financeiro', 'contato@parceiro.com.br');
  ```

---

## 4. Checklist de teste em ambiente real (staging)

Rodar manualmente (e anotar resultado) antes de liberar. Usar e-mails reais de teste, em dispositivo móvel real para o fluxo do produtor.

**Autenticação**
- [ ] `/cadastro` → e-mail de confirmação em **< 1 min**, em português, fora do spam; o link abre em **outro aparelho** e entra logado.
- [ ] `/entrar` com e-mail e senha; "Receber link de acesso por e-mail" envia só o link; o link vale 10 min e só funciona uma vez.
- [ ] `/esqueci-senha` → e-mail com o **código de 6 dígitos** (sem link); o código expira em 10 min; reenviar respeita 60 s; a nova senha com confirmação encerra as outras sessões e envia o aviso "senha alterada".
- [ ] "Sair" encerra a sessão em desktop e em celular.
- [ ] Rotas protegidas: visitante em `/produtor`, `/verificacao`, `/interesses` é redirecionado para `/entrar`; papel errado é barrado.

**Produtor (celular, rede 3G/instável)**
- [ ] Cadastro das 5 partes, com máscaras (telefone/CNPJ), salvando a cada passo.
- [ ] **Offline**: desligar a rede na Parte 3 → "Salvo no celular" → religar → sincroniza e volta a "Salvo".
- [ ] Upload de fotos/documento da terra: **câmera real** ("Tirar foto") e "Escolher arquivo", miniatura, "Enviado · N fotos"; arquivo >10 MB e formato inválido recusados; falha de rede mostra erro e permite reenviar.
- [ ] Parte 5 → revisar → enviar para análise → status `em_analise`.

**Verificador**
- [ ] Fila de verificação; abrir um cadastro, ver evidências (URLs assinadas funcionam), conceder selo / pedir ajuste por campo / reprovar.
- [ ] Ajuste solicitado: produtor só edita os campos marcados e reenvia.

**Investidor**
- [ ] `/descobrir` (5 perguntas) → resultados ordenados por alinhamento.
- [ ] `/negocios` e `/negocios/:slug` (abas públicas vs. privadas, barra de interesse com valores reais, "Recebe visitas").
- [ ] Demonstrar interesse (valor mín. R$ 1.000, confirmação) → produtor recebe aviso; produtor aceita → investidor recebe e-mail.
- [ ] Pedido de documento sensível → liberação → investidor vê por URL assinada (TTL 5 min).
- [ ] Verificador apresenta ao parceiro financeiro → **e-mail chega ao parceiro** (§0.2).

**Cron**
- [ ] Disparar manualmente: `curl -X POST https://<app>/api/cron/daily -H "x-cron-secret: $CRON_SECRET"` → `200` e resumo; sem header/errado → `401`.
- [ ] Na Vercel (Settings → Cron Jobs), conferir que o job aparece e rodar "Run" uma vez; ver o log da execução (200, não 405).
- [ ] Idempotência: duas execuções seguidas não duplicam avisos.

**Transversais**
- [ ] Banner legal fixo visível; nenhum termo proibido (ex.: "rendimento", "retorno garantido") em nenhuma tela.
- [ ] Acessibilidade e desempenho: rodar Lighthouse (mobile) em `/`, `/negocios`, `/produtor/cadastro/1`. **LCP do cadastro/1 está marginal (~2,4 s contra limite de 2,5 s) em ambiente local** — medir em produção real e otimizar se passar (fontes, JS inicial 165 KB).
- [ ] Sem erro de hidratação no console (corrigido o do `PartHeader`; revisar outras telas em build de produção).

---

## 5. Testes automatizados contra staging

Os e2e hoje assumem o stack **local** (URLs `127.0.0.1:54321` e Mailpit `127.0.0.1:54324` fixas em `web/e2e/helpers/*`, service role local, login por senha com usuários criados pela API admin e e-mails lidos do Mailpit). **Não rodam contra a nuvem como estão.** Opções:

1. **Manter e2e no local/CI** (recomendado): subir `supabase start` + `next build && next start` num job de CI (GitHub Actions) a cada PR. Rodar do diretório `web/` (projeto `web`) e fazer `supabase db reset` antes — foi a causa de uma falha em massa de e2e ao rodar o stack da raiz do repo com banco vazio. Usar `--workers=1` ou `2`: com mais paralelismo há flakiness por contenção de recursos (Docker/Supabase), já observada.
2. **Smoke e2e em staging** (opcional): criar uma suíte pequena e separada que leia `BASE_URL`, `SUPABASE_URL` e a service key de staging por env var, e substitua a leitura de e-mails do Mailpit (links de confirmação e link de acesso, código de reset) por uma caixa de e-mail de teste com API (ex.: Mailosaur/Mailtrap) — ou autentique via API admin do Supabase. Cobrir só: login, cadastro até `em_analise`, listagem pública.

### CI sugerido
- `lint`, `typecheck`, `test` (unitários) e `build` em todo PR.
- e2e com Supabase local no CI (ver acima), ou rodar sob demanda/nightly se for pesado.
- Bloquear merge na branch de produção se algum falhar.

---

## 6. Observabilidade e operação

- **Logs**: Vercel Logs (Functions) e Supabase Logs (API/Auth/Postgres). Como `sendEmail` hoje só loga, trocar logs com dados pessoais por identificadores (evitar PII em log).
- **Erros**: integrar Sentry (ou equivalente) — o app não tem rastreamento de erro em produção.
- **Alertas**: falha do cron diário (Vercel notifica execuções com erro), taxa de erro de login e de código de reset, fila de `events` com `canal='whatsapp_manual'` e `enviado_em is null` envelhecendo.
- **Eventos de produto**: há `trackEvent`; confirmar para onde vão e se há painel de métricas (PRD).
- **Rotina da equipe**: definir responsável pela fila de WhatsApp manual e pelo painel de verificação (SLA para análise de cadastros).

---

## 7. Segurança — revisão final antes de abrir ao público

- [ ] Service role só em servidor; nenhuma `NEXT_PUBLIC_` com segredo.
- [ ] RLS revisada tabela a tabela (acesso do investidor só a negócios `verificado`; documentos só com liberação; `profiles` só do próprio usuário) — rodar os testes SQL em `web/supabase/tests/` contra o staging.
- [ ] Buckets privados; URLs assinadas com TTL curto; nada de `getPublicUrl`.
- [ ] Rate limits de auth do Supabase (§1.4) e proteção contra abuso dos endpoints de Server Actions; `AUTH_COOKIE_SECRET` definida e diferente em cada ambiente.
- [ ] Headers de segurança (CSP, `X-Frame-Options`, HSTS pela Vercel) — avaliar adicionar em `next.config.ts` (hoje vazio).
- [ ] Remover/trocar qualquer credencial de teste (`iasy123456`, `produtor@teste.iasy.local`) — garantir que o seed **nunca** rodou em produção.
- [ ] Domínio de e-mail com SPF/DKIM/DMARC.

---

## 8. Ordem recomendada (resumo)

1. PR de pendências de código: cron `GET` + `vercel.json` (§0.1) e `sendEmail` real (§0.2).
2. Supabase staging: migrations, Auth (URLs, confirmação de e-mail, política de senha, 4 templates, OTP 6 dígitos/600 s, SMTP, rate limits), buckets (§1).
3. Vercel staging: root `web`, env vars, região, deploy (§2).
4. Usuários internos + `partners` (§3.3–3.4).
5. Checklist manual completo em celular real (§4).
6. CI com e2e local (§5) e observabilidade mínima (§6).
7. Revisão de segurança/LGPD (§7).
8. Repetir para produção com projeto Supabase e variáveis separados; domínio final.
