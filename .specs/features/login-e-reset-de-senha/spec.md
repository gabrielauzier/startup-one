# Login com e-mail e senha, magic link e reset de senha — Specification

Fonte: [prd.md](./prd.md) v1.0 (esta pasta). IDs `AUTH-NN` rastreiam os requisitos; a PRD usa RF/RN/G para origem e gargalos, citados em "Origem". Esta spec substitui a RN-02 do MVP (entrada só por e-mail e código) e mantém AD-004 (Supabase Auth + `@supabase/ssr`).

## Problem Statement

O MVP só permite entrar por código de 6 dígitos enviado ao e-mail: não há senha, cadastro, confirmação de e-mail, logout nem recuperação de acesso. O link do e-mail não funciona (não existe rota que troque o token por sessão), o perfil só é criado dentro da action de OTP, e o redirect pós-login ignora o papel do usuário e leva a uma resposta JSON 403. Investidor, empresa e produtor precisam de um login convencional, de um magic link que funcione e de recuperação de senha, sem cair em telas de erro.

## Goals

- [ ] Quem tem conta confirmada entra com e-mail e senha em um único envio de formulário, sem abrir o e-mail.
- [ ] Todo cadastro novo só acessa área privada depois de confirmar o e-mail pelo link.
- [ ] Quem esquece a senha a redefine sozinho por OTP de 6 dígitos e nova senha com confirmação.
- [ ] Nenhum usuário autenticado recebe JSON 403 ou página de erro por causa de redirect (0 ocorrências nos testes E2E de redirect cruzado de papel).
- [ ] O usuário consegue encerrar a sessão em um clique a partir de qualquer tela com cabeçalho.
- [ ] Métricas da PRD §12 (cadastro concluído ≥ 80%, reset concluído ≥ 70%) ficam medíveis por eventos.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Login social (Google, Apple, LinkedIn) | Outra PRD; adiciona consentimento OAuth |
| MFA, TOTP, passkeys | Risco do piloto não justifica |
| Login por SMS/telefone/WhatsApp | O WhatsApp é canal de avisos, não de auth |
| Login por OTP de e-mail (fluxo do MVP) | Substituído pelo magic link; OTP fica só no reset |
| Troca de e-mail, exclusão de conta, tela "Minha conta" | Fora do necessário para o ciclo |
| Criação de verificador pela interface | Segue manual, com service role (RN-01, CA-01.3) |
| Checagem de senha vazada (HIBP) | Exige plano Pro do Supabase |
| Dois perfis no mesmo e-mail | Um e-mail = um perfil, como hoje |
| Mudança do conteúdo de avisos/WhatsApp (T53) | Escopo do módulo de avisos |

---

## Assumptions & Open Questions

As recomendações da PRD §15 viram defaults aqui. "Confirmed? n" significa que o autor da PRD ainda não as validou explicitamente; mudam o comportamento se revertidas.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Login por OTP no `/entrar` (Q1) | Removido; `/entrar/codigo` redireciona (308) para `/entrar` | O magic link cobre o mesmo caso; OTP só no reset | n |
| Política de senha (Q2) | 8 a 72 caracteres, ao menos 1 letra e 1 número (`letters_digits`) | Mais regras reduzem adoção do produtor | n |
| `/produtor` (boas-vindas) público (Q3) | Público; "Começar cadastro" leva visitante a `/cadastro?perfil=produtor` | A página só lê `partners` via admin; `createBusiness` já exige sessão | n |
| Contador de tentativas do OTP (Q4) | Usar os limites nativos do GoTrue (`token_verifications`) com valores de produção versionados; a contagem na interface é só visual; nenhuma tabela própria neste ciclo | Evita infra nova; reavaliar se o piloto mostrar abuso | n |
| Checagem HIBP (Q5) | Não implementada | Depende de plano Pro | n |
| Papel inválido no cadastro (Q6) | O trigger de perfil falha o cadastro (sem papel padrão silencioso); órfãos entram em "Complete seu perfil" | Papel desconhecido é erro, não dado a adivinhar | n |
| Validade do magic link (Q7) | 10 min, igual ao OTP (`otp_expiry = 600`, único para e-mail no GoTrue) | Curto e seguro; subir só se virar reclamação | n |
| Campo "nome" no cadastro (Q8) | Obrigatório no cadastro, 2 a 80 caracteres; preenche `profiles.nome` | Hoje é o prefixo do e-mail; melhora telas do verificador | n |
| Um e-mail, um perfil (Q9) | Mantido | Sem demanda do piloto | n |
| Aviso ao titular em cadastro duplicado (Q10) | Enviado; texto passa por revisão jurídica antes de produção | Evita enumeração e avisa o titular | n |
| Usuário sem `role` no metadado (seed, criado pela equipe) | O trigger não cria perfil nem falha; o usuário cai em "Complete seu perfil" | Compatível com seed e contas do verificador criadas por service role | n |
| Verificador entra por `/entrar` (Q11) | Sim, por senha ou link; sem cadastro | Conta criada pela equipe | n |
| Expiração do código de reset | 10 min, uso único, 6 dígitos | Reaproveita RN-02/otp_expiry do MVP | y (já no `config.toml`) |
| Cooldown de reenvio | 60 s por e-mail e tipo (cadastro, magic link, reset), no máximo 3 envios por hora; contado também para e-mail inexistente (tabela `auth_throttle`) | Evita abuso e duplo clique | n |
| Sessão | 30 dias, cookies `@supabase/ssr` como hoje | RN-02 do MVP | y |
| Metas de métricas (PRD §12) | Propostas, sem linha de base; linha de base coletada nas 2 semanas antes do lançamento | Sem dados históricos | n |
| Rate limits de produção (PRD §12.3) | Valores iniciais da PRD, a validar com infraestrutura | Hoje só existem valores de dev (1000) | n |
| Mensagens neutras (RN-54) | Mesma resposta para e-mail existente/inexistente em reset, magic link e cadastro | Evita enumeração de contas | y |
| Retirar `verifyOtp` de login quebra a suíte E2E | Um helper único de login de teste por senha substitui o login por OTP/Mailpit nos specs que não testam auth | Troca em um só lugar | n |

**Open questions:** none - all resolved or logged above.

---

## Implicit-Requirement Dimensions (sweep)

| Dimension | Resolução |
| --- | --- |
| Input validation & bounds | AUTH-02, AUTH-05, AUTH-12 (senha 8–72, nome 2–80, e-mail, `redirect`/`next`) |
| Failure / partial-failure states | AUTH-04 (link expirado), AUTH-09 (reenvio), AUTH-11 (trigger falha visível) |
| Idempotency / retry / duplicate handling | AUTH-03 (cadastro duplicado), AUTH-09 (cooldown), AUTH-07 (link de uso único) |
| Auth boundaries & rate limits | AUTH-10, AUTH-12, AUTH-13 |
| Concurrency / ordering | AUTH-08 (novo código invalida o anterior); demais: N/A because cada fluxo é uma sequência de uma requisição por vez do mesmo usuário |
| Data lifecycle / expiry | AUTH-04, AUTH-07, AUTH-08 (10 min), AUTH-10 (30 dias de sessão) |
| Observability | AUTH-15 (eventos de produto sem PII) |
| External-dependency failure | AUTH-09 (falha de envio de e-mail mostra erro e permite novo envio) |
| State-transition integrity | AUTH-04 (não confirmado → confirmado), AUTH-14 (sessão de recuperação restrita) |

---

## User Stories

### P1: Destino pós-login seguro, perfil garantido e logout ⭐ MVP

**User Story**: Como usuário autenticado, quero cair na tela certa depois de entrar e poder sair da conta, para nunca ver erro por redirect nem deixar a conta aberta em aparelho compartilhado.

**Why P1**: corrige G1, G3, G4, G7, G8 e é pré-requisito de todos os outros caminhos de entrada. Entrega valor sozinho (corrige o login atual).

**Origem**: PRD RF-05, RF-13 a RF-18, RN-55, RN-56, G1/G3/G4/G7/G8.

**Acceptance Criteria**:

1. WHEN um investidor ou empresa entra com `redirect=/produtor/painel` THEN o sistema SHALL ignorar o `redirect` e levá-lo a `/negocios` (se já respondeu a descoberta) ou `/descobrir/1`. <!-- AUTH-01 -->
2. WHEN um produtor entra com `redirect=/interesses` THEN o sistema SHALL ignorar o `redirect` e levá-lo a `/produtor/painel` (se tem negócio) ou `/produtor`. <!-- AUTH-01 -->
3. WHEN um usuário entra com `redirect` interno, seguro e permitido para o papel dele (por `resolveAccess`) THEN o sistema SHALL levá-lo a esse caminho. <!-- AUTH-01 -->
4. IF o `redirect` for `//evil.com`, `/\evil.com`, `https://evil.com`, um caminho com caractere de controle, `/%5Cevil.com` ou começar com `/entrar`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha` ou `/auth/` THEN o sistema SHALL ignorá-lo e usar o destino padrão do papel. <!-- AUTH-01 -->
5. WHEN um investidor ou empresa sem termos aceitos entra por qualquer caminho THEN o sistema SHALL levá-lo a `/termos` antes de qualquer outro destino e, após o aceite, ao destino validado pelo critério 3 ou ao padrão. <!-- AUTH-01 -->
6. WHEN um investidor ou empresa entra THEN o sistema SHALL migrar as respostas do cookie de visitante para `investor_answers` antes de qualquer `redirect()`. <!-- AUTH-01 -->
7. WHEN um usuário autenticado sem papel permitido acessa uma rota de página privada por URL direta THEN o sistema SHALL redirecioná-lo ao destino padrão do papel com `?aviso=sem-permissao`, e SHALL manter a resposta JSON 403 apenas para rotas `/api/*`. <!-- AUTH-01 -->
7a. WHEN o papel errado é redirecionado THEN o destino SHALL ser a página inicial do papel (`/verificacao` para verificador, `/produtor` para produtor, `/negocios` para investidor e empresa), e o aviso `?aviso=sem-permissao` SHALL ser exibido apenas nas rotas que têm chrome global. <!-- AUTH-01 -->
8. WHEN um usuário autenticado sem linha em `profiles` (por exemplo, criado sem `role` no metadado) abre qualquer rota privada ou `/entrar` THEN o sistema SHALL levá-lo a uma tela "Complete seu perfil" com a escolha de perfil (`investidor`, `empresa`, `produtor`) antes de qualquer outra rota. <!-- AUTH-11 -->
9. WHEN um usuário autenticado e com perfil abre `/entrar`, `/cadastro` ou `/esqueci-senha` THEN o sistema SHALL redirecioná-lo ao destino padrão do papel. <!-- AUTH-01 -->
10. WHEN um usuário logado aciona "Sair" no cabeçalho, na navegação inferior móvel ou na chrome do produtor THEN o sistema SHALL encerrar a sessão, redirecionar para `/` e exibir "Entrar" no cabeçalho. <!-- AUTH-16 -->
11. WHEN um visitante sem sessão abre `/produtor` THEN o sistema SHALL exibir as boas-vindas do produtor sem exigir login. <!-- AUTH-17 -->
12. WHEN um visitante sem sessão abre `/produtor/cadastro`, `/produtor/painel`, `/produtor/pedidos` ou `/produtor/interesses` THEN o sistema SHALL redirecioná-lo a `/entrar?redirect=<caminho>`. <!-- AUTH-17 -->

**Independent Test**: com o login atual (OTP) ainda ativo, testar os critérios 1 a 5, 7, 9 a 12 pela troca de `resolvePostLoginRedirect`/`isSafeRedirect` e do `proxy`; o critério 8 e o trigger entram em AUTH-11.

---

### P1: Cadastro de investidor, empresa e produtor com confirmação de e-mail ⭐ MVP

**User Story**: Como visitante, quero criar minha conta com perfil, nome, e-mail e senha e confirmar meu e-mail por um link, para provar que o endereço é meu e começar a usar a plataforma.

**Why P1**: sem conta com senha não existe login por senha; a confirmação é pedido explícito.

**Origem**: PRD RF-01 a RF-08b, RN-50 a RN-52, HU-A1, HU-A2.

**Acceptance Criteria**:

1. WHEN o visitante abre `/cadastro` THEN o sistema SHALL exibir escolha de perfil ("Quero investir", "Represento uma empresa", "Produzo na Amazônia"), nome, e-mail, senha e confirmação de senha. <!-- AUTH-02 -->
2. WHEN o visitante abre `/cadastro?perfil=produtor` (ou `investidor`, `empresa`) THEN o sistema SHALL exibir o perfil correspondente já marcado. <!-- AUTH-02 -->
3. IF a senha tiver menos de 8 ou mais de 72 caracteres, ou não contiver ao menos 1 letra e 1 número THEN o sistema SHALL bloquear o envio, indicar o requisito não cumprido no campo e não chamar o Supabase. <!-- AUTH-02 -->
4. IF a confirmação de senha diferir da senha THEN o sistema SHALL bloquear o envio e indicar o erro no campo de confirmação. <!-- AUTH-02 -->
5. IF o nome tiver menos de 2 ou mais de 80 caracteres (após `trim`) THEN o sistema SHALL bloquear o envio e indicar o erro no campo. <!-- AUTH-02 -->
6. WHEN o visitante envia um cadastro válido com e-mail novo THEN o sistema SHALL criar o usuário com `data: { role, nome }`, enviar o e-mail de confirmação e redirecionar a `/cadastro/confirmar-email`. <!-- AUTH-03 -->
7. WHEN o visitante envia um cadastro com e-mail já existente THEN o sistema SHALL exibir a mesma tela de sucesso do critério 6 e SHALL NOT criar outro usuário. <!-- AUTH-03 -->
7a. WHERE o envio de e-mail do app tem transporte real configurado, WHEN o visitante envia um cadastro com e-mail já confirmado THEN o sistema SHALL enviar ao titular um e-mail de aviso com links para entrar e redefinir a senha. <!-- AUTH-03 -->
7b. WHEN o visitante envia um cadastro com e-mail existente e ainda não confirmado THEN o sistema SHALL reenviar o e-mail de confirmação, sujeito ao cooldown e ao teto do AUTH-09. <!-- AUTH-03 -->
8. IF o cadastro for enviado com `role` diferente de `investidor`, `empresa` ou `produtor` (inclusive `verificador`) THEN o sistema SHALL recusar o cadastro e não criar linha em `profiles`. <!-- AUTH-11 -->
9. WHEN um usuário é inserido em `auth.users` sem `raw_user_meta_data.role` THEN o banco SHALL NOT criar linha em `profiles` nem recusar a inserção. <!-- AUTH-11 -->
9a. WHEN um usuário é inserido em `auth.users` com `raw_user_meta_data.role` válido THEN o banco SHALL criar a linha em `profiles` com `role` e `nome` do metadado, na mesma transação. <!-- AUTH-11 -->
10. WHEN o usuário abre o link de confirmação válido (`/auth/confirm?token_hash=…&type=signup`) em qualquer navegador THEN o sistema SHALL confirmar o e-mail, criar a sessão nesse navegador e seguir o destino da primeira história. <!-- AUTH-04 -->
11. IF o link de confirmação estiver vencido (mais de 10 minutos), já usado ou inválido THEN o sistema SHALL redirecionar a `/cadastro/confirmar-email?erro=expirado` com o botão "Enviar novo link". <!-- AUTH-04 -->
12. IF o parâmetro `type` de `/auth/confirm` não for `signup` ou `email`, ou o `next` for inseguro THEN o sistema SHALL tratar o `type` como inválido (critério 11) e ignorar o `next`. <!-- AUTH-04 -->
13. WHEN o usuário aciona "Reenviar e-mail" THEN o sistema SHALL reenviar a confirmação, exibir "Enviamos outro e-mail" e desabilitar o botão por 60 s com contagem visível. <!-- AUTH-09 -->
14. IF o reenvio for acionado mais de 3 vezes na hora para o mesmo e-mail THEN o sistema SHALL recusar o envio e exibir "Muitos pedidos. Tente de novo em alguns minutos." <!-- AUTH-09 -->
15. IF o envio de e-mail pelo provedor falhar THEN o sistema SHALL exibir erro "Não foi possível enviar o e-mail. Tente de novo." e manter a tela com o botão de reenvio habilitado. <!-- AUTH-09 -->
16. The sistema SHALL ter `enable_confirmations = true`, `minimum_password_length = 8`, `password_requirements = "letters_digits"` e `max_frequency = "60s"` em `config.toml`, travados por teste. <!-- AUTH-12 -->

**Independent Test**: cadastrar um e-mail novo no Mailpit, abrir o link de confirmação em um contexto de navegador limpo e verificar sessão, `profiles.role` e destino.

---

### P1: Login com e-mail e senha ⭐ MVP

**User Story**: Como usuário com conta, quero entrar com e-mail e senha, para acessar rápido sem abrir o e-mail.

**Why P1**: objetivo central da PRD.

**Origem**: PRD RF-09, RF-10 a RF-10c, RN-02′, RN-57, HU-B1, E1 a E12.

**Acceptance Criteria**:

1. WHEN o visitante abre `/entrar` THEN o sistema SHALL exibir e-mail, senha com botão "Mostrar", botão "Entrar", links "Esqueci minha senha", "Receber link de acesso por e-mail" e "Criar conta", e SHALL NOT exibir seleção de perfil. <!-- AUTH-05 -->
2. WHEN o visitante envia e-mail e senha corretos de conta confirmada THEN o sistema SHALL autenticar com `signInWithPassword` e aplicar o destino pós-login (AUTH-01). <!-- AUTH-05 -->
3. IF as credenciais forem inválidas (senha errada ou e-mail inexistente) THEN o sistema SHALL exibir a mesma mensagem "E-mail ou senha incorretos." nos dois casos. <!-- AUTH-05 -->
4. IF a conta existir e não estiver confirmada THEN o sistema SHALL exibir "Confirme seu e-mail para entrar" com o botão "Reenviar e-mail de confirmação". <!-- AUTH-05 -->
5. WHILE o envio do formulário estiver em andamento o sistema SHALL manter o botão "Entrar" desabilitado e exibir estado de carregamento. <!-- AUTH-05 -->
6. WHEN a tentativa de login falha THEN o sistema SHALL anunciar o erro em região `role="alert"`, marcar os campos com `aria-invalid="true"` e levar o foco ao primeiro campo com erro. <!-- AUTH-05 -->
7. The sistema SHALL exibir em `/entrar` o texto "Primeiro acesso depois da atualização? Use o link por e-mail ou redefina sua senha." <!-- AUTH-05 -->
8. WHERE `redirect` aponta para rota privada, WHEN `/entrar` abre THEN o sistema SHALL exibir "Entre para continuar". <!-- AUTH-05 -->
9. WHERE a URL contém `?aviso=sem-permissao`, WHEN `/entrar` abre THEN o sistema SHALL exibir "Essa área é de outro perfil. Entre com a conta certa ou volte." <!-- AUTH-05 -->
10. WHERE a URL contém `?aviso=senha-alterada`, WHEN `/entrar` abre THEN o sistema SHALL exibir "Senha alterada. Entre com a nova senha." <!-- AUTH-05 -->
11. WHEN `/entrar`, `/cadastro`, `/esqueci-senha*`, `/redefinir-senha` ou `/auth/*` renderiza THEN o sistema SHALL omitir `MobileBottomNav` e `FixedLegalBanner`, e exibir apenas o logo com link para `/`. <!-- AUTH-05 -->
12. WHEN um usuário do MVP sem senha tenta entrar com qualquer senha THEN o sistema SHALL exibir a mesma mensagem do critério 3 (sem revelar que a conta não tem senha). <!-- AUTH-05 -->
13. IF o usuário errar a senha em excesso (limite de `sign_in_sign_ups`/rate limit do GoTrue) THEN o sistema SHALL exibir "Muitas tentativas. Aguarde alguns minutos e tente de novo." <!-- AUTH-10 -->
14. The sistema SHALL usar `autocomplete="email"`, `autocomplete="current-password"` (login) e `autocomplete="new-password"` (cadastro e redefinição), e controles interativos SHALL ter área de toque de ao menos 44 px. <!-- AUTH-05 -->

**Independent Test**: criar um usuário confirmado, entrar com a senha correta e depois com a errada e comparar as mensagens.

---

### P1: Login com magic link ⭐ MVP

**User Story**: Como usuário com conta, quero receber no e-mail um link que me loga com um clique, para entrar sem lembrar a senha.

**Why P1**: pedido explícito; é a porta de entrada das contas do MVP sem senha e a alternativa do produtor.

**Origem**: PRD RF-11 a RF-12b, G3, G5, RN-54, RN-57, HU-B2.

**Acceptance Criteria**:

1. WHEN o usuário aciona "Receber link de acesso por e-mail" com um e-mail THEN o sistema SHALL chamar `signInWithOtp` com `shouldCreateUser: false` e redirecionar a `/entrar/link-enviado`. <!-- AUTH-06 -->
2. WHEN o e-mail informado não tem conta THEN o sistema SHALL exibir a mesma tela de `/entrar/link-enviado`, SHALL NOT enviar e-mail e SHALL NOT criar linha em `auth.users`. <!-- AUTH-06 -->
3. The e-mail do magic link SHALL conter apenas um botão/link "Entrar na Îasy" apontando para `/auth/confirm?token_hash=…&type=email&next=…`, sem código de 6 dígitos. <!-- AUTH-06 -->
4. WHEN o usuário abre o link válido em qualquer navegador THEN o sistema SHALL criar a sessão nesse navegador e aplicar o destino pós-login (AUTH-01). <!-- AUTH-07 -->
5. IF o link estiver vencido (mais de 10 minutos) ou já usado THEN o sistema SHALL redirecionar a `/entrar?erro=link-expirado` com a mensagem "Esse link já foi usado ou venceu. Peça outro." <!-- AUTH-07 -->
6. WHEN o link é aberto por usuário com e-mail ainda não confirmado THEN o sistema SHALL confirmar o e-mail e criar a sessão. <!-- AUTH-07 -->
7. The `/entrar/link-enviado` SHALL exibir o e-mail sem colocá-lo na URL e oferecer "Reenviar" com cooldown de 60 s e confirmação "Enviamos outro link". <!-- AUTH-09 -->
8. WHEN o botão de reenvio é acionado duas vezes dentro do cooldown THEN o sistema SHALL enviar apenas um e-mail. <!-- AUTH-09 -->
9. WHEN um usuário do MVP (sem senha, com perfil) entra pelo link THEN o sistema SHALL autenticá-lo e aplicar o destino pós-login. <!-- AUTH-07 -->

**Independent Test**: pedir o link para um usuário existente, abrir a URL do e-mail em um navegador diferente do que pediu e verificar a sessão.

---

### P1: Reset de senha com OTP e nova senha com confirmação ⭐ MVP

**User Story**: Como usuário que esqueceu a senha, quero receber um código por e-mail e usá-lo para criar outra senha, para voltar a entrar sozinho.

**Why P1**: pedido explícito; também é o caminho das contas do MVP para definir a primeira senha.

**Origem**: PRD RF-13r a RF-23r, RN-53, RN-54, RN-57, HU-C1, HU-C2.

**Acceptance Criteria**:

1. WHEN o usuário envia um e-mail em `/esqueci-senha` THEN o sistema SHALL chamar `resetPasswordForEmail` e redirecionar a `/esqueci-senha/codigo`, com a mesma resposta para e-mail existente e inexistente. <!-- AUTH-08 -->
2. WHEN o e-mail tem conta THEN o e-mail de recuperação SHALL conter o código de 6 dígitos e a validade de 10 minutos, e SHALL NOT conter link de acesso. <!-- AUTH-08 -->
3. WHEN o e-mail não tem conta THEN o sistema SHALL NOT enviar e-mail. <!-- AUTH-08 -->
4. The `/esqueci-senha/codigo` SHALL guardar o e-mail em cookie httpOnly assinado com validade de 15 min e SHALL NOT colocar e-mail na URL. <!-- AUTH-08 -->
5. WHEN o usuário digita o código correto em até 10 minutos THEN o sistema SHALL chamar `verifyOtp` com `type: "recovery"`, criar a sessão de recuperação e redirecionar a `/redefinir-senha`. <!-- AUTH-08 -->
6. IF o código estiver errado, vencido, já usado ou substituído por reenvio THEN o sistema SHALL exibir "Código inválido ou vencido." sem diferenciar o motivo. <!-- AUTH-08 -->
7. WHEN o usuário aciona "Reenviar código" THEN o sistema SHALL enviar um novo código que invalida o anterior, aplicar o cooldown de 60 s e exibir "Enviamos outro código". <!-- AUTH-09 -->
8. IF o limite de verificações do GoTrue for atingido THEN o sistema SHALL exibir "Muitas tentativas. Peça um novo código." e SHALL NOT aceitar novo código por esse pedido. <!-- AUTH-10 -->
9. The campo do código SHALL usar `inputmode="numeric"`, `autocomplete="one-time-code"`, `maxLength` 6 e aceitar colar. <!-- AUTH-08 -->
10. IF o usuário abre `/redefinir-senha` sem sessão de recuperação ou autenticada THEN o sistema SHALL redirecioná-lo a `/esqueci-senha`. <!-- AUTH-14 -->
11. WHEN o usuário abre `/redefinir-senha` com sessão de recuperação THEN o sistema SHALL exibir "Nova senha" e "Confirmar nova senha", com mostrar/ocultar e os requisitos da senha. <!-- AUTH-14 -->
12. IF as duas senhas diferirem, ou a nova senha não cumprir 8 a 72 caracteres com 1 letra e 1 número, THEN o sistema SHALL bloquear o envio e indicar o requisito no campo. <!-- AUTH-14 -->
13. IF a nova senha for igual à atual THEN o sistema SHALL exibir "Escolha uma senha diferente da atual." <!-- AUTH-14 -->
14. WHEN o usuário envia senhas válidas e iguais THEN o sistema SHALL chamar `updateUser({ password })`, encerrar as demais sessões do usuário (`signOut({ scope: "others" })`), manter a sessão atual e aplicar o destino pós-login com aviso "Senha alterada". <!-- AUTH-14 -->
15. WHEN a senha é alterada THEN o sistema SHALL enviar ao titular o e-mail "Sua senha foi alterada" com orientação caso não tenha sido ele. <!-- AUTH-14 -->
16. WHILE a sessão é de recuperação, o sistema SHALL permitir apenas `/redefinir-senha` e `/auth/*`; qualquer outra rota privada SHALL redirecionar a `/redefinir-senha`. <!-- AUTH-14 -->
17. WHEN um usuário do MVP sem senha conclui o reset THEN o sistema SHALL definir a primeira senha dele e permitir o login por senha. <!-- AUTH-14 -->

**Independent Test**: pedir o código no Mailpit, validá-lo, definir senha nova e entrar com ela; entrar com a antiga deve falhar.

---

### P2: Limites, antienumeração e templates de e-mail em produção

**User Story**: Como operação, quero rate limits de produção, SMTP próprio e mensagens neutras, para evitar abuso e vazamento de quais e-mails têm conta.

**Why P2**: não muda o fluxo do usuário, mas é pré-requisito de produção.

**Origem**: PRD RNF-02, RNF-03, RNF-09, G10, G12, Q4.

**Acceptance Criteria**:

1. The sistema SHALL ter em `config.toml` e em `DEPLOY.md` os valores de produção de `email_sent`, `sign_in_sign_ups`, `token_verifications` e `max_frequency`, sem o valor 1000 de dev como padrão de produção. <!-- AUTH-10 -->
2. WHEN o mesmo e-mail é usado em reset, magic link e cadastro, existindo ou não conta, THEN o sistema SHALL responder com o mesmo texto e o mesmo código HTTP. <!-- AUTH-13 -->
3. The templates `confirmation`, `magic_link`, `recovery`, `password_changed` e o aviso de cadastro duplicado SHALL estar em pt-BR em `supabase/templates/` e configurados em `config.toml`. <!-- AUTH-12 -->
4. The `site_url` e `additional_redirect_urls` SHALL conter as URLs de produção e de preview, documentadas em `DEPLOY.md`. <!-- AUTH-12 -->
5. IF o envio de e-mail pelo provedor retornar erro THEN o sistema SHALL registrar o erro no servidor sem expor a mensagem interna ao usuário. <!-- AUTH-09 -->

**Independent Test**: comparar a resposta HTTP e o corpo para e-mail existente e inexistente nos três fluxos.

---

### P2: Métricas dos fluxos de auth

**User Story**: Como produto, quero eventos dos fluxos de auth, para medir as metas da PRD.

**Why P2**: sem eventos a PRD §12 não é medível.

**Origem**: PRD §12.2.

**Acceptance Criteria**:

1. WHEN ocorre cadastro enviado, e-mail confirmado, login por senha (ok ou erro), magic link pedido, magic link ok, reset pedido, código de reset (ok ou erro), senha alterada ou logout THEN o sistema SHALL registrar um evento `kind='produto'` com o tipo correspondente em `events`. <!-- AUTH-15 -->
2. The payload dos eventos SHALL NOT conter e-mail, senha, token ou código. <!-- AUTH-15 -->
3. The migração SHALL estender o CHECK de `events.type` com os novos tipos sem alterar os existentes. <!-- AUTH-15 -->
4. IF o registro do evento falhar THEN o sistema SHALL concluir o fluxo de auth normalmente. <!-- AUTH-15 -->

**Independent Test**: executar cada fluxo e consultar `events` por tipo.

---

### P3: Incentivo a definir senha após magic link

**User Story**: Como usuário do MVP que entrou por link, quero ser lembrado de definir uma senha, para entrar mais rápido na próxima vez.

**Why P3**: conveniência; não bloqueia nada.

**Acceptance Criteria**:

1. WHEN um usuário entra por magic link e nunca definiu senha THEN o sistema SHALL exibir uma vez por sessão um aviso "Defina uma senha para entrar mais rápido" com link a `/redefinir-senha`. <!-- AUTH-18 -->
2. WHEN o usuário dispensa o aviso THEN o sistema SHALL não exibi-lo de novo na mesma sessão. <!-- AUTH-18 -->

**Independent Test**: entrar por link com usuário sem senha e ver o aviso uma única vez.

---

## Edge Cases

- IF o usuário abre o link de confirmação em um navegador e a aba original está em `/cadastro/confirmar-email` THEN o sistema SHALL manter a aba original sem mudança e a sessão SHALL existir só no navegador do clique.
- IF o link do magic link for aberto por um scanner de e-mail antes do usuário (uso único consumido) THEN o sistema SHALL exibir a mensagem de link já usado do AUTH-07 critério 5 e oferecer pedir outro.
- WHEN o usuário tem aba aberta em `/entrar` e já logou em outra aba THEN o sistema SHALL redirecioná-lo ao destino do papel no próximo carregamento.
- IF `redirect` e `next` chegarem duplicados ou como lista THEN o sistema SHALL usar o primeiro valor e validá-lo como os demais.
- IF o e-mail tiver maiúsculas ou espaços nas pontas THEN o sistema SHALL aplicar `trim` e normalizar para minúsculas antes de qualquer chamada.
- IF uma conta do MVP sem perfil (órfã de `signInWithOtp` nunca confirmado) tentar entrar THEN o sistema SHALL aplicar a tela "Complete seu perfil" (AUTH-11).
- WHEN o usuário colar o código de 6 dígitos com espaços THEN o sistema SHALL remover os espaços antes de validar.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| AUTH-01 | P1: Destino pós-login, redirect e papel errado | In Tasks | Pending |
| AUTH-02 | P1: Cadastro (formulário e validação) | In Tasks | Pending |
| AUTH-03 | P1: Cadastro (envio e e-mail duplicado) | In Tasks | Pending |
| AUTH-04 | P1: Confirmação de e-mail (`/auth/confirm`) | In Tasks | Pending |
| AUTH-05 | P1: Login com e-mail e senha / `/entrar` | In Tasks | Pending |
| AUTH-06 | P1: Magic link (envio) | In Tasks | Pending |
| AUTH-07 | P1: Magic link (verificação) | In Tasks | Pending |
| AUTH-08 | P1: Reset de senha (OTP) | In Tasks | Pending |
| AUTH-09 | P1: Reenvio com cooldown e falha de envio | In Tasks | Pending |
| AUTH-10 | P1/P2: Rate limits e limite de tentativas | In Tasks | Pending |
| AUTH-11 | P1: Perfil por trigger e "Complete seu perfil" | In Tasks | Pending |
| AUTH-12 | P1/P2: Configuração (`config.toml`, templates, URLs) | In Tasks | Pending |
| AUTH-13 | P2: Antienumeração (respostas iguais) | In Tasks | Pending |
| AUTH-14 | P1: Nova senha com confirmação e sessão de recuperação | In Tasks | Pending |
| AUTH-15 | P2: Eventos de produto | In Tasks | Pending |
| AUTH-16 | P1: Logout | In Tasks | Pending |
| AUTH-17 | P1: `/produtor` público e rotas privadas do produtor | In Tasks | Pending |
| AUTH-18 | P3: Aviso "defina uma senha" | In Tasks | Pending |

**Coverage:** 18 total, 18 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Em E2E, um cadastro novo conclui confirmação por link, entra e cai no destino do papel em menos de 3 minutos de relógio de teste, sem tela de erro.
- [ ] Em E2E, login por senha, magic link aberto em outro contexto de navegador e reset completo concluem com sucesso.
- [ ] Zero respostas JSON 403 em navegação de página nos testes de redirect cruzado de papel (investidor↔produtor).
- [ ] Os casos de `isSafeRedirect` do AUTH-01 critério 4 passam em teste unitário.
- [ ] Nenhum e-mail, senha, token ou código aparece em URLs, logs de aplicação ou payload de `events` (verificado por teste).
- [ ] Medição pós-lançamento (PRD §12): conclusão de cadastro ≥ 80%, reset concluído ≥ 70%, sucesso de login por senha ≥ 90%.
