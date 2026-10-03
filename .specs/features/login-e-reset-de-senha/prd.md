# PRD — Login com e-mail e senha, magic link e reset de senha

| | |
| --- | --- |
| **Feature** | Autenticação pós-MVP: cadastro com senha, confirmação de e-mail, login por senha, login por magic link, reset de senha por OTP |
| **Status** | Draft (para revisão) |
| **Autor** | Gabriel Auzier (com apoio do Claude) |
| **Criado em** | 2026-10-02 |
| **Versão** | 1.0 |
| **Fonte** | Código em `web/app/(marketing)/entrar/**`, `web/proxy.ts`, `web/lib/auth/**`, `web/supabase/config.toml`, `mvp/prd-mvp.md` (RN-02, RF-02, RF-03, RF-04), `.specs/STATE.md` (AD-004) |
| **Nome da pasta** | `.specs/features/login-e-reset-de-senha/` |

---

## 1. Resumo executivo

**Em uma frase:** trocar a entrada "só e-mail + código" do MVP por um login convencional (e-mail e senha), mantendo o link mágico como alternativa e adicionando recuperação de senha por código (OTP), para investidores, empresas e produtores.

O MVP entregou uma única forma de entrar: o usuário escolhe um perfil, informa o e-mail e digita um código de 6 dígitos (RN-02, "entrada sem senha"). Não existe senha, cadastro separado de login, confirmação de e-mail por link, botão de sair nem recuperação de acesso além de pedir outro código. Isso funcionou para o piloto, mas tem três limites: (1) cada acesso depende de abrir o e-mail, o que é lento para quem volta todo dia; (2) o produtor, que usa celular com conectividade ruim, perde a sessão e precisa do e-mail de novo; (3) a tela `/entrar` mistura "criar conta" e "entrar" num mesmo formulário que exige escolher perfil mesmo para quem já tem conta.

Esta feature entrega seis fluxos: cadastro (investidor/empresa e produtor), confirmação de e-mail, login com senha, login com magic link (link clicável, não OTP), reset de senha com OTP e definição de nova senha com confirmação. Também corrige os gargalos de login encontrados na leitura do código (seção 3.3): redirect errado após logar, `/produtor` exigindo login para ver as boas-vindas, ausência de logout, perfil só criado no fluxo de OTP (o que quebraria o magic link) e a tela `/entrar` em si.

**Quick facts**

- **Usuários:** investidor (PF qualificada, family office), empresa, produtor. O verificador entra pelo mesmo `/entrar`, mas não se cadastra pela interface (RN-01, CA-01.3).
- **Problema:** entrada lenta e frágil, sem recuperação de acesso, com redirect incorreto e sem logout.
- **Métrica principal:** taxa de cadastro concluído (e-mail confirmado + primeiro login) ≥ 80% dos cadastros iniciados.
- **Stack:** continua Supabase Auth + `@supabase/ssr` (AD-004). Nenhuma biblioteca de auth nova.

---

## 2. Problema

### 2.1 O problema

Quem já tem conta na Îasy precisa pedir e digitar um código por e-mail a cada novo acesso. Quem perde o acesso ao e-mail ou erra o código 5 vezes não tem outro caminho. Quem é novo não sabe se está criando conta ou entrando, e precisa declarar um perfil antes de qualquer outra coisa.

### 2.2 Estado atual (o que o MVP entregou)

Mapeado do código, não da documentação.

**Fluxo de entrada hoje**

```
/entrar (escolhe perfil + e-mail)
   └─ sendOtp → supabase.auth.signInWithOtp({ shouldCreateUser: true, data:{role} })
        └─ redirect /entrar/codigo?email=…&role=…&redirect=…
             └─ verifyOtp({type:"email"})  (contador de 5 tentativas no estado do React)
                  ├─ upsert em profiles (cria o perfil só aqui, ignoreDuplicates)
                  ├─ migra respostas do cookie de visitante (investidor/empresa)
                  ├─ investidor/empresa sem termos aceitos → /termos?redirect=…
                  ├─ redirect seguro informado → vai direto para ele
                  └─ senão resolvePostLoginRedirect:
                       verificador → /verificacao
                       produtor    → /produtor/painel (tem negócio) ou /produtor
                       investidor  → /negocios (já respondeu) ou /descobrir/1
```

| Peça | Onde | Observação |
| --- | --- | --- |
| Tela de entrada | `app/(marketing)/entrar/entrar-form.tsx` | 3 botões de perfil (radio) + e-mail. "Sem senha: enviamos um código de acesso." |
| Tela do código | `app/(marketing)/entrar/codigo/codigo-form.tsx` | Campo de 6 dígitos, "Reenviar código" sem cooldown |
| Server actions | `app/(marketing)/entrar/actions.ts` | `sendOtp`, `verifyOtp` |
| Destino pós-login | `app/(marketing)/entrar/redirect.ts` | `isSafeRedirect`, `resolvePostLoginRedirect` |
| Guard de rotas | `proxy.ts` + `lib/auth/roles.ts` | Sem sessão → `/entrar?redirect=…`; papel errado → JSON 403 |
| Aceite de termos | `app/(marketing)/termos/actions.ts` | Investidor/empresa, versão `2026-09-28` |
| E-mail | `supabase/templates/magic_link.html` | Mostra o código **e** um link `{{ .ConfirmationURL }}` |
| Config | `supabase/config.toml` | `enable_confirmations=false`, `minimum_password_length=6`, `otp_expiry=600`, rate limits em 1000 (só dev) |
| Perfil | `profiles(id, role, nome, termos_*)` + RLS própria | Insert permitido ao próprio usuário, nunca `verificador` |
| Sessão | cookies via `@supabase/ssr` | 30 dias (RN-02) |

**Não existe hoje:** senha, tela de cadastro, confirmação de e-mail por link, rota de callback (`/auth/*`), botão de sair (nenhum `signOut` no repositório), esqueci a senha, troca de senha, ou qualquer teste do link do e-mail.

### 2.3 Impacto

- **Usuário:** acesso a cada visita depende do e-mail; sem plano B se o código não chegar; produtor em campo perde tempo.
- **Negócio:** fricção no retorno do investidor derruba a métrica de interesses enviados do piloto (PRD MVP §8.1); sem logout, uso em aparelho compartilhado (cooperativa, associação) deixa a conta aberta.
- **Segurança:** o link do e-mail hoje cai no `site_url` sem rota que troque o token por sessão, então é uma promessa que o produto não cumpre.

### 2.4 Por que agora

O MVP está no ar para o piloto e o RN-02 foi declarado como decisão do MVP, não permanente (`mvp/escopo-mvp.md` previa "login com senha ou link mágico" e o MVP simplificou). Os gargalos da seção 3.3 já afetam quem testa o piloto.

---

## 3. Diagnóstico do login atual

### 3.1 Mapa de rotas (atual → alvo)

| Rota | Hoje | Alvo |
| --- | --- | --- |
| `/entrar` | Perfil + e-mail → código | Só login: e-mail + senha, link mágico, esqueci a senha |
| `/entrar/codigo` | Digitar OTP de login | **Removida** (login por OTP sai; OTP fica só no reset). Redirect 308 para `/entrar` |
| `/cadastro` | Não existe | Criar conta (perfil, nome, e-mail, senha) |
| `/cadastro/confirmar-email` | Não existe | "Confira seu e-mail" + reenviar com cooldown |
| `/auth/confirm` | Não existe | Route handler: troca `token_hash` por sessão (confirmação e magic link) |
| `/entrar/link-enviado` | Não existe | Aviso "enviamos o link" + reenviar |
| `/esqueci-senha` | Não existe | Pede o e-mail |
| `/esqueci-senha/codigo` | Não existe | Digita o OTP |
| `/redefinir-senha` | Não existe | Nova senha + confirmação (exige sessão de recuperação) |

### 3.2 Decisões já tomadas e o que muda

- **AD-004 permanece:** Supabase Auth + `@supabase/ssr`. Esta feature não é motivo para trocar de provedor.
- **RN-02 é substituída.** Nova redação proposta na seção 6.
- **O login por OTP deixa de existir.** O usuário pediu magic link "clicável, e não OTP". OTP fica restrito ao reset de senha.
- **RN-03 (termos) e RN-23 (migrar respostas do visitante) são preservadas**, mas hoje vivem dentro de `verifyOtp`. Precisam migrar para um ponto único que todos os caminhos de login atravessem (senha, magic link, confirmação de e-mail).

### 3.3 Gargalos e bugs encontrados

Ordenados por gravidade. Cada item tem um requisito ou critério de aceite correspondente.

| # | Gargalo | Evidência | Efeito | Tratado em |
| --- | --- | --- | --- | --- |
| G1 | **Redirect para rota que o papel não pode acessar.** `verifyOtp` honra `?redirect=` antes de olhar o papel. Investidor que cai em `/entrar?redirect=/produtor/painel` (ou o contrário) é mandado direto para a rota e recebe o JSON `{"error":"Sem permissão"}` do `proxy.ts`. | `entrar/actions.ts` (`isSafeRedirect` antes de `resolvePostLoginRedirect`), `proxy.ts` (retorna `NextResponse.json` 403) | Tela de erro crua, usuário preso | RF-14, RF-15 |
| G2 | **CTA "Sou produtor" leva a um login.** `/produtor` (boas-vindas) casa com a regra `^/produtor(/|$)` de `roles.ts`, então visitante é jogado em `/entrar?redirect=/produtor`. A tela `/entrar` então exige escolher perfil; se o visitante escolher "Quero investir" por engano, vira G1. | `lib/auth/roles.ts`, `page.tsx` da home, `SiteHeader` ("Para produtores") | A principal porta de entrada do produtor é uma tela de login confusa | RF-16 |
| G3 | **Perfil só nasce em `verifyOtp`.** O upsert em `profiles` está na server action de OTP. Magic link e confirmação de e-mail não passam por ela, então criariam usuário sem perfil: `getCurrentRole()` retorna `null`, o `proxy` trata como sem papel e o usuário entra num limbo. Além disso, `signInWithOtp({shouldCreateUser:true})` já cria o usuário no `auth.users` antes de o código ser confirmado, deixando usuários órfãos. | `entrar/actions.ts` linhas do upsert; `current-role.ts` | Bloqueia magic link e confirmação de e-mail | RF-05, RF-17 |
| G4 | **Não existe logout.** Nenhum `signOut` no repositório. O `SiteHeader` mostra "Entrar" mesmo logado. | busca por `signOut` retorna vazio; `SiteHeader.tsx` | Aparelho compartilhado fica logado por 30 dias; usuário logado vê "Entrar" | RF-13 |
| G5 | **Link do e-mail não funciona.** O template tem `{{ .ConfirmationURL }}`, mas não há rota `/auth/*` nem `exchangeCodeForSession`/`verifyOtp({token_hash})` | `templates/magic_link.html`; ausência de callback | Quem clica no link não ganha sessão | RF-07, RF-12a |
| G6 | **Perfil é escolhido a cada login e ignorado para quem já tem conta.** `upsert(..., ignoreDuplicates: true)` descarta o papel informado; o destino vem do papel gravado. Quem é produtor e marca "Quero investir" não recebe aviso, só cai em outra tela. | `verifyOtp`, `entrar-form.tsx` | Etapa obrigatória e inútil para quem já é cadastrado | RF-02, `/entrar` |
| G7 | **Usuário logado abre `/entrar` e vê o formulário.** Não há redirecionamento. | `entrar/page.tsx` | Confusão; pode gerar segundo login | RF-18 |
| G8 | **`isSafeRedirect` é frouxo.** Só checa `startsWith("/")` e `!startsWith("//")`. Aceita `/\evil.com` (navegadores tratam `\` como `/`), `/entrar` (loop) e caracteres de controle. | `entrar/redirect.ts` | Open redirect residual e loops | RF-15 |
| G9 | **E-mail, perfil e redirect viajam na URL.** `/entrar/codigo?email=…&role=…&redirect=…`. | `sendOtp` monta `URLSearchParams` | E-mail em histórico, logs e referer | RNF-06 |
| G10 | **Limite de tentativas é cosmético.** O contador de 5 tentativas vive no `useActionState`: recarregar a página zera. O limite real é o do GoTrue (`token_verifications`), que em dev está em 1000. | `codigo-form.tsx`, `config.toml` | Força bruta de OTP depende só de config do servidor | RF-16r, RNF-02 |
| G11 | **"Reenviar código" sem cooldown nem feedback de sucesso.** | `codigo-form.tsx` | Duplo clique gera vários e-mails; usuário não sabe se reenviou | RF-04, RF-12, RF-17r |
| G12 | **Rate limits de produção não versionados.** `email_sent = 1000` e `sign_in_sign_ups = 1000` são só para e2e local. Não há registro dos valores de produção. | `config.toml`, `DEPLOY.md` | Risco de abuso de envio de e-mail e de custo | RNF-02, Q4 |
| G13 | **Chrome de login incompleto.** `/entrar` herda `SiteHeader` e `MobileBottomNav` (navegação para outras áreas durante o login) e o banner legal fixo; só o fluxo do produtor (`/produtor/**`) é sem chrome. | `AppChrome.tsx` | Distração e ruído numa tela de decisão | Seção 7 |

---

## 4. Objetivos e não objetivos

### 4.1 Objetivos

1. Quem já tem conta entra em menos de 15 segundos sem abrir o e-mail (login por senha).
2. Quem esquece a senha recupera o acesso sozinho em menos de 3 minutos.
3. Quem prefere não usar senha continua podendo entrar por link no e-mail.
4. O e-mail de todo novo cadastro é confirmado antes do primeiro acesso à área privada.
5. Nenhum usuário autenticado cai numa tela de erro por causa de redirect.
6. O usuário consegue sair da conta.

### 4.2 Não objetivos (fora de escopo)

| Item | Motivo |
| --- | --- |
| Login social (Google, Apple, LinkedIn) | Outra PRD; adiciona consentimento OAuth e provedores |
| MFA / TOTP / passkeys | Pode vir depois; o risco do piloto não justifica |
| Login por telefone/SMS/WhatsApp | O produtor usa WhatsApp para avisos manuais, não para auth |
| Troca de e-mail, exclusão de conta, tela "Minha conta" completa | Só o necessário: sair e (opcional) trocar senha logado |
| Criação de verificador pela interface | Continua feito pela equipe com service role (RN-01, CA-01.3) |
| Migrar de provedor de auth | AD-004 |
| Verificação de senha vazada (HIBP) | Depende de plano Pro do Supabase; ver Q5 |
| Novo conteúdo de e-mail transacional fora de auth (avisos, WhatsApp) | Escopo do módulo de avisos (T53) |

---

## 5. Personas

| Persona | Contexto | O que importa neste fluxo |
| --- | --- | --- |
| **Helena, investidora (PF qualificada)** | Desktop, volta várias vezes à vitrine, e-mail pessoal | Entrar rápido; não repetir "qual é meu perfil"; voltar ao negócio que estava vendo |
| **Família/empresa investidora** | Mais de uma pessoa pode usar o mesmo e-mail corporativo; política de senha interna | Senha forte e recuperável; aceite de termos |
| **Dona Raimunda, produtora** | Celular Android, sinal intermitente, pouca prática com senhas, às vezes aparelho compartilhado | Texto simples; link no e-mail como alternativa à senha; botão de sair; mensagens sem jargão |
| **Verificador (equipe Îasy)** | Conta criada pela equipe; só usa `/verificacao` | Entrar por senha ou link; nunca ver opção de se cadastrar como verificador |

---

## 6. Regras de negócio (novas e alteradas)

| ID | Regra | Relação com o MVP |
| --- | --- | --- |
| **RN-02′ · Entrada com e-mail e senha** | O acesso é por e-mail e senha. Alternativas: link mágico por e-mail e recuperação de senha por código de 6 dígitos. A sessão dura 30 dias no aparelho. Toda área privada exige sessão. | **Substitui** RN-02 ("entrada só por e-mail e código, sem senha") |
| **RN-50 · Cadastro e perfil** | O perfil (`investidor`, `empresa`, `produtor`) é escolhido **uma vez**, no cadastro. No login não se escolhe perfil. `verificador` nunca é aceito pela interface. | Ajusta RN-01 |
| **RN-51 · E-mail confirmado** | Conta nova só acessa área privada depois de confirmar o e-mail pelo link. Link vale 10 minutos. Pode reenviar. | Novo |
| **RN-52 · Senha** | Mínimo 8 caracteres, com ao menos 1 letra e 1 número. Máximo 72 (limite do bcrypt). Sem regras de rotação. | Novo; `config.toml` hoje aceita 6 |
| **RN-53 · Reset por OTP** | O código tem 6 dígitos, vale 10 minutos e é de uso único. Após validar, o usuário tem uma sessão de recuperação restrita a definir a nova senha. | Novo |
| **RN-54 · Mensagens neutras** | "Esqueci a senha" e "link por e-mail" respondem igual para e-mail existente e inexistente (evita enumeração de contas). | Novo |
| **RN-55 · Termos no primeiro acesso** | Continua valendo para investidor/empresa em **qualquer** caminho de entrada (senha, link, confirmação). | Mantém RN-03; muda onde é aplicada |
| **RN-56 · Redirect** | O destino pedido só é honrado se for interno, seguro e permitido para o papel do usuário. Senão, vale o destino padrão do papel. | Substitui o comportamento de CA-02.3 |
| **RN-57 · Contas do MVP** | Usuários criados pelo fluxo OTP não têm senha. Eles entram por link mágico ou definem uma senha em "Esqueci minha senha". | Novo |

---

## 7. Requisitos funcionais

Prioridade: **M** = Must, **S** = Should, **C** = Could.

### 7.1 Cadastro (investidor, empresa, produtor)

**HU-A1 · Criar conta com e-mail e senha** (M)

> Como **visitante**, quero criar uma conta dizendo como uso a Îasy e definindo minha senha, para voltar a entrar sem depender de código.

| ID | Requisito |
| --- | --- |
| RF-01 | Rota `/cadastro` com: escolha de perfil (3 opções, as mesmas do MVP), nome, e-mail, senha e confirmação de senha. |
| RF-02 | O perfil pode vir pré-selecionado por `?perfil=produtor|investidor|empresa` (usado pelos CTAs da home e pelo `SiteHeader`). Se vier da home do produtor, o campo já aparece marcado. |
| RF-03 | Validação no cliente e no servidor da RN-52. Mensagem indica o que falta ("Falta 1 número"). Senhas diferentes bloqueiam o envio. |
| RF-04 | Após enviar, redireciona para `/cadastro/confirmar-email` com mensagem neutra (RN-54). Botão "Reenviar e-mail" com cooldown visível de 60 s. |
| RF-05 | O perfil (`profiles`) é criado no banco por **trigger em `auth.users`** a partir de `raw_user_meta_data.role` e `nome`, validando contra a lista `investidor|empresa|produtor`. Qualquer outro valor (incluindo `verificador`) faz o cadastro falhar (Q6). Isso substitui o `upsert` de `verifyOtp` (G3). |
| RF-05a | Se o e-mail já existe, a resposta ao usuário é a mesma de sucesso; o e-mail enviado ao dono da conta informa que alguém tentou se cadastrar e sugere entrar ou redefinir a senha. |

**Critérios de aceite**
- **CA-A1.1** Dado um visitante em `/cadastro`, quando preenche perfil, nome, e-mail válido, senha válida e confirmação igual e envia, então vê `/cadastro/confirmar-email` e recebe um e-mail de confirmação.
- **CA-A1.2** Dado senha com 7 caracteres ou sem número, quando envia, então vê o erro no campo e nenhuma chamada ao Supabase é feita.
- **CA-A1.3** Dado um e-mail já cadastrado, quando envia, então vê a mesma tela de sucesso do CA-A1.1, e o dono do e-mail recebe o aviso do RF-05a.
- **CA-A1.4** Dado um cadastro com `role=verificador` forjado na requisição, então a conta não é criada com esse papel.
- **CA-A1.5** Dado `/cadastro?perfil=produtor`, então o perfil "Produzo na Amazônia" já vem marcado.

### 7.2 Confirmação de e-mail

**HU-A2 · Confirmar meu e-mail** (M)

> Como **usuário recém-cadastrado**, quero confirmar meu e-mail por um link, para provar que o endereço é meu e começar a usar a plataforma.

| ID | Requisito |
| --- | --- |
| RF-06 | `enable_confirmations = true` em `config.toml` e no projeto Supabase de produção. |
| RF-07 | Rota `/auth/confirm` (route handler) recebe `token_hash`, `type` e `next`, chama `verifyOtp({ token_hash, type })` no servidor, grava os cookies de sessão e redireciona. Aceita `type=signup`, `email` e `recovery` apenas (lista fechada). |
| RF-08 | Template de e-mail de confirmação em português, com o link e o aviso de validade (10 min). O link usa `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=…`, em vez de `{{ .ConfirmationURL }}`, para funcionar mesmo se o usuário abrir o e-mail em outro aparelho (fluxo PKCE por `code` exige o mesmo navegador). |
| RF-08a | Link expirado, usado ou inválido leva a `/cadastro/confirmar-email?erro=expirado`, com botão "Enviar novo link". |
| RF-08b | Depois de confirmar, o usuário já fica logado e segue o fluxo da seção 7.7 (termos → destino). |

**Critérios de aceite**
- **CA-A2.1** Dado um cadastro novo não confirmado, quando tenta entrar com senha, então vê "Confirme seu e-mail para entrar" com o botão "Reenviar e-mail de confirmação" (não "senha incorreta").
- **CA-A2.2** Dado o link válido aberto em outro navegador/aparelho, então a sessão é criada nesse navegador.
- **CA-A2.3** Dado link com mais de 10 minutos ou já usado, então vê a tela de link expirado com opção de novo envio.
- **CA-A2.4** Dado `type` fora da lista fechada ou `next` inseguro, então o handler ignora o `next` e usa o destino padrão.

### 7.3 Login com e-mail e senha

**HU-B1 · Entrar com e-mail e senha** (M)

> Como **usuário com conta**, quero entrar com e-mail e senha, para acessar rápido sem abrir o e-mail.

| ID | Requisito |
| --- | --- |
| RF-09 | `/entrar` passa a ter: e-mail, senha (com mostrar/ocultar), botão "Entrar", link "Esqueci minha senha", link "Receber link de acesso por e-mail" e link "Criar conta". **Sem seleção de perfil.** |
| RF-10 | Server action chama `signInWithPassword`. Erro de credenciais mostra mensagem única ("E-mail ou senha incorretos."), sem dizer qual está errado. |
| RF-10a | E-mail não confirmado mostra a mensagem do CA-A2.1. |
| RF-10b | Conta do MVP sem senha (RN-57) recebe o mesmo erro genérico; o texto da tela inclui "Primeiro acesso depois da atualização? Use o link por e-mail ou redefina sua senha." |
| RF-10c | Depois de sucesso, executa o fluxo da seção 7.7. |

**Critérios de aceite**
- **CA-B1.1** Dado e-mail e senha corretos de conta confirmada, quando envia, então entra e cai no destino do papel (7.7).
- **CA-B1.2** Dado senha incorreta ou e-mail inexistente, então a mensagem é idêntica nos dois casos.
- **CA-B1.3** Dado `?redirect=/negocios/abc/documentos`, quando investidor entra, então vai para esse caminho (após termos, se pendentes).
- **CA-B1.4** Dado o botão Entrar, quando enviando, então fica desabilitado e mostra estado de carregamento.

### 7.4 Login com magic link

**HU-B2 · Entrar por link no e-mail** (M)

> Como **usuário com conta**, quero receber um link no e-mail que me loga com um clique, para entrar sem lembrar a senha.

| ID | Requisito |
| --- | --- |
| RF-11 | Na tela `/entrar`, "Receber link de acesso" abre campo de e-mail (reaproveita o e-mail já digitado) e dispara `signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo } })`. **Não cria conta**: só quem já se cadastrou (G3). |
| RF-11a | Resposta sempre neutra (RN-54): "Se existir uma conta com esse e-mail, enviamos um link." |
| RF-12 | `/entrar/link-enviado` mostra o e-mail (nunca na URL; ver RNF-06), instrução simples e "Reenviar" com cooldown de 60 s e confirmação visual de reenvio. |
| RF-12a | O e-mail do magic link contém **só o link** (botão "Entrar na Îasy"), sem código. O link aponta para `/auth/confirm?token_hash=…&type=email&next=…`. |
| RF-12b | Link com validade de 10 minutos e uso único. Reabrir o link já usado leva a `/entrar?erro=link-expirado`, com a mensagem "Esse link já foi usado ou venceu. Peça outro." |

**Critérios de aceite**
- **CA-B2.1** Dado um e-mail de conta existente, quando pede o link e clica nele no mesmo aparelho, então entra e segue 7.7.
- **CA-B2.2** Dado um e-mail inexistente, então a tela de "link enviado" é idêntica e nenhum usuário é criado em `auth.users`.
- **CA-B2.3** Dado o link aberto em outro navegador, então a sessão é criada nesse navegador (sem depender de cookie PKCE).
- **CA-B2.4** Dado clique duplo no botão de reenviar, então apenas um e-mail sai dentro do cooldown.
- **CA-B2.5** Dado um e-mail com conta mas não confirmada, o link também confirma o e-mail e loga (o clique prova a posse).

### 7.5 Reset de senha com OTP

**HU-C1 · Recuperar o acesso** (M)

> Como **usuário que esqueceu a senha**, quero receber um código por e-mail e usá-lo para criar outra senha, para voltar a entrar sozinho.

| ID | Requisito |
| --- | --- |
| RF-13r | `/esqueci-senha` pede o e-mail e chama `resetPasswordForEmail`. Resposta neutra (RN-54) e redireciona para `/esqueci-senha/codigo`. |
| RF-14r | O e-mail de recuperação (template `recovery`) mostra o **código de 6 dígitos** (`{{ .Token }}`) e a validade, **sem link**. |
| RF-15r | `/esqueci-senha/codigo` recebe os 6 dígitos (`inputmode=numeric`, `autocomplete=one-time-code`, aceita colar) e chama `verifyOtp({ email, token, type: "recovery" })`. Sucesso cria uma sessão de recuperação e leva a `/redefinir-senha`. |
| RF-16r | Máximo de 5 tentativas por código, controlado **no servidor** (G10), com bloqueio de 15 min e mensagem "Muitas tentativas. Peça um novo código." O contador no estado do React é só para a interface. |
| RF-17r | "Reenviar código" com cooldown de 60 s, feedback "Enviamos outro código" e limite de 3 reenvios por hora por e-mail. Novo código invalida o anterior. |
| RF-18r | O e-mail do usuário fica fora da URL (RNF-06); o fluxo guarda o e-mail num cookie httpOnly assinado de curta duração (15 min) para a tela do código. |

**Critérios de aceite**
- **CA-C1.1** Dado e-mail existente, quando pede o reset, então recebe e-mail com 6 dígitos e sem link.
- **CA-C1.2** Dado e-mail inexistente, então a tela é idêntica, e nenhum e-mail é enviado.
- **CA-C1.3** Dado o código correto em até 10 minutos, então chega em `/redefinir-senha`.
- **CA-C1.4** Dado código errado, então o erro é "Código inválido ou vencido." (sem diferenciar), e o contador do servidor avança, mesmo recarregando a página.
- **CA-C1.5** Dado o 5º erro, então bloqueia novas tentativas por 15 min e oferece pedir um novo código.
- **CA-C1.6** Dado código usado ou substituído por reenvio, então falha com o erro do CA-C1.4.
- **CA-C1.7** Dado conta do MVP sem senha, o fluxo funciona igual e a primeira senha é definida por ele (RN-57).

### 7.6 Definir nova senha com confirmação

**HU-C2 · Criar nova senha** (M)

| ID | Requisito |
| --- | --- |
| RF-19r | `/redefinir-senha` exige sessão de recuperação (ou sessão válida, se vier do aviso "defina uma senha"). Sem sessão, redireciona para `/esqueci-senha`. |
| RF-20r | Campos "Nova senha" e "Confirmar nova senha", com mostrar/ocultar, indicador de requisitos da RN-52 e `autocomplete=new-password`. |
| RF-21r | Salvar chama `updateUser({ password })`. Em sucesso, **encerra as demais sessões** (`signOut({ scope: "others" })`), mantém a atual e leva ao destino do papel (7.7) com um aviso "Senha alterada". |
| RF-22r | Enviar e-mail de notificação "Sua senha foi alterada" (`auth.email.notification.password_changed`), com orientação caso não tenha sido o usuário. |
| RF-23r | Se a nova senha for igual à atual, mostra erro específico. |

**Critérios de aceite**
- **CA-C2.1** Dado sessão de recuperação, quando as duas senhas coincidem e cumprem a RN-52, então a senha é alterada e o usuário segue logado.
- **CA-C2.2** Dado senhas diferentes, então o botão fica bloqueado e o campo de confirmação indica o erro.
- **CA-C2.3** Dado acesso direto a `/redefinir-senha` sem sessão, então vai para `/esqueci-senha`.
- **CA-C2.4** Dado a mudança concluída, então outras sessões do mesmo usuário deixam de ser válidas.
- **CA-C2.5** Dado a mudança concluída, então o e-mail de aviso é enviado.

### 7.7 Destino pós-login (corrige G1, G7, G8)

**HU-D1 · Cair na tela certa depois de entrar** (M)

> Como **usuário autenticado**, quero ser levado ao lugar que eu estava tentando abrir ou, se isso não for possível, à minha área, para nunca ver uma tela de erro depois de entrar.

Função única `resolvePostAuthDestination({ user, profile, requested })`, usada pelos quatro caminhos (senha, magic link, confirmação de e-mail, redefinição de senha). Ordem fixa:

1. **Aceite de termos** pendente (investidor/empresa) → `/termos?redirect=…` (RN-55).
2. **Migração do cookie de respostas** (RN-23) para investidor/empresa, executada antes de qualquer `redirect()`.
3. **Destino pedido** (`redirect`/`next`), se passar em `isSafeRedirect` **e** em `resolveAccess(path, role)`.
4. **Destino padrão do papel** (`resolvePostLoginRedirect`, inalterado): verificador → `/verificacao`; produtor → `/produtor/painel` ou `/produtor`; investidor/empresa → `/negocios` ou `/descobrir/1`.

| ID | Requisito |
| --- | --- |
| RF-13 | Botão **Sair** no `SiteHeader` (menu da conta quando logado, substitui o "Entrar") e na `MobileBottomNav` e na chrome do produtor. Chama `signOut()` e leva a `/`. |
| RF-14 | `resolveAccess` é reutilizado para validar o destino pedido. Se o papel não pode acessá-lo, ignora o destino e usa o padrão. |
| RF-15 | `isSafeRedirect` passa a: exigir `/` seguido de caractere que não seja `/` nem `\`; decodificar uma vez e revalidar; rejeitar caracteres de controle; rejeitar `/entrar*`, `/cadastro*`, `/esqueci-senha*`, `/redefinir-senha*`, `/auth/*` (evita loop). |
| RF-15a | `proxy.ts` passa a responder papel errado em rotas de página com um redirect para o destino padrão do papel e `?aviso=sem-permissao` (a resposta JSON 403 fica só para `/api/*`). |
| RF-16 | `/produtor` (boas-vindas) deixa de exigir sessão, ficando público. O botão "Começar cadastro" leva a `/cadastro?perfil=produtor` para visitante (ou executa `createBusiness` se já logado como produtor). A regra de produtor em `roles.ts` passa a cobrir `/produtor/cadastro`, `/produtor/painel`, `/produtor/pedidos`, `/produtor/interesses` e subrotas, **exceto** `/produtor` exato (ver Q3). |
| RF-17 | Perfil criado por trigger (RF-05) garante que todo usuário autenticado tem `profiles`. Rotina de reparo: quem entra sem perfil (conta órfã do MVP, G3) é enviado para uma tela mínima "Complete seu perfil" (escolha de perfil) antes de qualquer outra rota. |
| RF-18 | `/entrar`, `/cadastro`, `/esqueci-senha` redirecionam usuário já logado (e confirmado) para o destino padrão do papel. `/redefinir-senha` só abre com sessão de recuperação ou logado. |

**Critérios de aceite**
- **CA-D1.1** Dado investidor com `?redirect=/produtor/painel`, quando entra, então cai em `/negocios` ou `/descobrir/1` (nunca em JSON 403).
- **CA-D1.2** Dado produtor com `?redirect=/interesses`, quando entra, então cai em `/produtor/painel` ou `/produtor`.
- **CA-D1.3** Dado `?redirect=/\evil.com`, `?redirect=//evil.com`, `?redirect=https://evil.com`, `?redirect=/entrar`, quando entra, então o parâmetro é ignorado.
- **CA-D1.4** Dado investidor sem termos e com `?redirect=/negocios/x/documentos`, quando entra, então vai a `/termos`, aceita, e é levado a `/negocios/x/documentos`.
- **CA-D1.5** Dado visitante em `/produtor`, quando abre a página, então vê as boas-vindas sem passar por login.
- **CA-D1.6** Dado usuário logado, quando abre `/entrar`, então é redirecionado ao destino padrão do papel.
- **CA-D1.7** Dado usuário que clica em Sair, então a sessão acaba, o cabeçalho volta a mostrar "Entrar" e uma rota privada pede login de novo.
- **CA-D1.8** Dado login por link mágico de conta sem perfil (órfã), então vê "Complete seu perfil" e não um erro.
- **CA-D1.9** Dado papel errado em rota privada de página (acesso direto por URL), então é redirecionado com aviso, não recebe JSON.

---

## 8. Redesenho da página `/entrar`

Mudanças propostas, em ordem de impacto. O texto deve manter o tom do MVP (simples, sem jargão, pensado para o produtor).

| # | Mudança | Por quê |
| --- | --- | --- |
| E1 | **Remover a seleção de perfil do login** e movê-la para `/cadastro`. Link "Não tem conta? Criar conta" abaixo do formulário. | G6. Quem entra já tem perfil; a pergunta é ruído |
| E2 | **Campos:** e-mail (`autocomplete=email`, `inputmode=email`, `autofocus`), senha (`autocomplete=current-password`) com botão "Mostrar", "Esqueci minha senha" à direita do rótulo da senha. | Gerenciadores de senha, teclado correto no celular |
| E3 | **Ação secundária** "Receber link de acesso por e-mail", em botão `outline` abaixo do principal, com o e-mail já digitado reaproveitado. | Atende RF-11 e produtor que esquece senha |
| E4 | **Texto de apoio** muda de "Sem senha: enviamos um código de acesso." para "Entre com seu e-mail e senha." e uma linha para contas do MVP (RF-10b). | O texto atual passa a ser falso |
| E5 | **Erros** no campo (`aria-invalid`, `aria-describedby`) e resumo em `role="alert"`. Mensagem genérica de credenciais (RF-10). Estado de carregamento e botão desabilitado ao enviar. | Acessibilidade e G11 |
| E6 | **Mostrar contexto do redirect:** se veio de `?redirect=` para uma rota privada, exibir "Entre para continuar" (e não a tela fria). Para `?aviso=sem-permissao`, exibir "Essa área é de outro perfil. Entre com a conta certa ou volte". | Reduz o "por que estou aqui" e G1 |
| E7 | **Sem chrome de navegação:** `/entrar`, `/cadastro`, `/esqueci-senha*`, `/redefinir-senha`, `/auth/*` entram em `NO_CHROME_PATTERNS` do `AppChrome` (só logo + voltar), ou mantêm só o header mínimo. Sem `MobileBottomNav`. | G13; mesmo padrão que o produtor já usa |
| E8 | **Layout:** card único de largura `max-w-md`, logo Îasy no topo; abas "Entrar / Criar conta" no topo do card (navegação entre `/entrar` e `/cadastro`), a aba atual com `aria-current`. | Deixa claro em qual dos dois o visitante está |
| E9 | **CTAs da home e do header** passam a levar a `/cadastro?perfil=produtor` ("Sou produtor") e `/cadastro?perfil=investidor` ("Sou investidor"), em vez de `/produtor` protegido e `/descobrir/1`. O "Entrar" do header continua em `/entrar`. | G2 |
| E10 | **Dados fora da URL** (RNF-06). | G9 |
| E11 | **Touch targets** ≥ 44 px no celular; botões de ação em largura total; foco visível. | Produtor em celular (RNF-09 do MVP) |
| E12 | **Aviso após reset:** `?aviso=senha-alterada` mostra "Senha alterada. Entre com a nova senha." | Fecha o fluxo C2 se o usuário cair em `/entrar` |

**Esboço**

```
┌───────────────────────────────┐
│  🌙 Îasy                       │
│  [ Entrar ] [ Criar conta ]    │
│                                │
│  Entre para continuar          │  ← E6, só quando há redirect
│  E-mail                        │
│  [ seu@email.com           ]   │
│  Senha          Esqueci minha senha
│  [ ••••••••            👁 ]    │
│  [        Entrar          ]    │
│  ──────────  ou  ──────────    │
│  [ Receber link por e-mail ]   │
│                                │
│  Primeiro acesso depois da     │
│  atualização? Use o link ou    │
│  redefina sua senha.           │
└───────────────────────────────┘
```

---

## 9. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | **Sessão:** 30 dias, mantida via cookies do `@supabase/ssr` (como hoje). Cookies `httpOnly`, `secure`, `sameSite=lax`. |
| RNF-02 | **Rate limits de produção documentados e versionados** (G12): envio de e-mail, tentativas de login por IP/e-mail, verificações de token. Valores iniciais propostos na seção 12.3. |
| RNF-03 | **Antienumeração:** respostas e tempos equivalentes para e-mail existente/inexistente em reset, magic link e cadastro (RN-54). |
| RNF-04 | **Segurança de senha:** hash no Supabase (bcrypt). Nenhuma senha em log, query string, evento de analytics ou estado persistido. |
| RNF-05 | **CSRF/open redirect:** `next`/`redirect` validados no servidor (RF-15); tipos aceitos no `/auth/confirm` em lista fechada. |
| RNF-06 | **PII fora da URL:** e-mail e perfil não viajam em query string. Usar cookie httpOnly assinado de curta duração ou estado de servidor. |
| RNF-07 | **Acessibilidade:** WCAG 2.1 AA — rótulos, `aria-invalid`, `role="alert"`, foco no primeiro erro, `autocomplete` correto, navegação por teclado, contraste. |
| RNF-08 | **Performance:** envio de formulário de login responde em até 1 s no p95, desconsiderando o provedor de e-mail. |
| RNF-09 | **Entregabilidade:** produção envia por SMTP próprio com domínio autenticado (SPF, DKIM, DMARC), não pelo SMTP padrão do Supabase. |
| RNF-10 | **i18n:** textos em português (pt-BR) em tela e em todos os templates de e-mail. |
| RNF-11 | **LGPD:** e-mail e nome são dados pessoais; manter base legal e política de privacidade atualizadas se houver mudança de finalidade. |

---

## 10. Considerações técnicas

> A PRD descreve o **o quê**; esta seção só registra o que é inevitável e o que o código atual impõe.

### 10.1 Arquitetura

- **Supabase Auth** continua como único provedor (AD-004). Nenhuma tabela de usuário nova.
- **Route handler `/auth/confirm`** (`app/auth/confirm/route.ts`): usa `verifyOtp({ token_hash, type })` no servidor. É o padrão recomendado para SSR (não depende do code verifier PKCE guardado no navegador de origem, essencial quando o produtor pede o link no celular e abre no outro aparelho).
- **Trigger no banco** `on auth.users insert` cria `profiles` a partir de `raw_user_meta_data` (RF-05). `SECURITY DEFINER`, com lista fechada de papéis. A policy `profiles_insert_own` continua valendo, mas deixa de ser o caminho principal.
- **`resolvePostAuthDestination`** em `lib/auth/` como função pura + testável (mesmo estilo de `redirect.ts`, com testes em `__tests__`).
- **Limite de tentativas do OTP no servidor** (RF-16r): tabela leve `auth_attempts(email_hash, kind, count, locked_until)` ou, alternativamente, depender dos limites nativos do GoTrue. Ver Q4.
- **E-mails:** templates em `supabase/templates/` para `confirmation`, `magic_link` (agora só link), `recovery` (só código), `email_changed`/`password_changed`. Configurar em `config.toml` (`[auth.email.template.*]` e `[auth.email.notification.password_changed]`).

### 10.2 Alterações previstas em `config.toml`

| Chave | Hoje | Alvo |
| --- | --- | --- |
| `auth.minimum_password_length` | 6 | 8 |
| `auth.password_requirements` | `""` | `"lower_upper_letters_digits"` ou `"letters_digits"` (ver Q2) |
| `auth.email.enable_confirmations` | false | true |
| `auth.email.max_frequency` | 1s | 60s |
| `auth.email.otp_expiry` | 600 | 600 (mantém; vale para link e OTP, ver Q7) |
| `auth.email.template.magic_link` | código + link | só link |
| `auth.email.template.confirmation` | padrão | novo, pt-BR |
| `auth.email.template.recovery` | padrão | novo, só código |
| `auth.site_url` / `additional_redirect_urls` | `127.0.0.1:3000` | URLs de produção e preview da Vercel |
| `auth.rate_limit.*` | 1000 (só dev) | valores de produção (12.2) |

O teste `lib/auth/__tests__/otp-config.test.ts` que trava `otp_expiry = 600` continua valendo; novos testes de config devem travar `enable_confirmations`, `minimum_password_length` e `max_frequency`.

### 10.3 Migração de contas do MVP

- Usuários existentes têm `auth.users` sem senha e já têm `profiles`. Nenhuma migração de dados é necessária.
- Todos podem entrar por link mágico ou redefinir a senha (RN-57). O `auth.users.email_confirmed_at` deles já está preenchido pelo OTP, então não são bloqueados por RN-51.
- Usuários órfãos (criados por `signInWithOtp` e que nunca completaram o código, G3) ficam sem perfil: tratados pelo RF-17 ou limpos por script de manutenção (Q6).
- Opcional (C): depois de um login por link, mostrar um aviso discreto "Defina uma senha para entrar mais rápido" que leva a `/redefinir-senha`.

### 10.4 Testes

- **Unitários (Vitest):** `isSafeRedirect` (tabela de casos de G8), `resolvePostAuthDestination` (papel × redirect × termos), validação de senha, trigger de perfil (SQL).
- **E2E (Playwright + Mailpit):** reutilizar os helpers de leitura do Mailpit já usados em `e2e/entrar-codigo.spec.ts`. Cenários mínimos: cadastro → confirmação → destino; login senha; magic link em contexto de navegador diferente; reset completo; redirect cruzado de papel; Sair.
- **RLS:** `e2e/rls-full.spec.ts` deve cobrir que o trigger não permite `verificador`.
- **Testes existentes** em `entrar/__tests__` e `entrar/codigo/__tests__` e `e2e/entrar*.spec.ts` serão reescritos, pois testam o fluxo OTP de login que sai.

### 10.5 Dependências

- Projeto Supabase de produção com SMTP configurado (RNF-09).
- Domínio com SPF/DKIM/DMARC.
- Vercel: variáveis de ambiente e `site_url` corretos por ambiente (Preview, Production). Hoje o `site_url` só tem o valor local.
- Revisão jurídica rápida do texto do e-mail e do aviso de "tentativa de cadastro" (RF-05a).

---

## 11. Escopo

### 11.1 Dentro

- Cadastro com senha, confirmação de e-mail, login por senha, magic link, reset por OTP, nova senha com confirmação (RF-01 a RF-23r).
- Destino pós-login unificado e correções G1 a G13.
- Redesenho de `/entrar` (E1 a E12) e novas telas listadas em 3.1.
- Botão Sair.
- Templates de e-mail em pt-BR.
- Testes unitários e E2E dos fluxos.
- Atualização de `mvp/prd-mvp.md` (RN-02, RF-02, T02) e `.specs/STATE.md` (nova decisão AD) ao fechar a feature.

### 11.2 Fora

Ver 4.2. Também fora: tela "Minha conta" completa, troca de e-mail, exclusão de conta, bloqueio por dispositivo.

### 11.3 Priorização

| Prioridade | Itens |
| --- | --- |
| **Must** | RF-01 a RF-12a, RF-13 a RF-18, reset (7.5 e 7.6), RN-51 a RN-56, G1, G3, G4, G5, G8 |
| **Should** | RF-05a, RF-22r, RF-15a, E6, E9, E12, limite de tentativas no servidor (RF-16r), cooldown de reenvio |
| **Could** | Aviso "Defina uma senha" pós link, `nome` obrigatório no cadastro (ver Q8), indicador visual de força de senha |

---

## 12. Métricas de sucesso

Framework: **AARRR (Activation + Retention)** e **HEART (Task success)**. Sem base de medição hoje, a linha de base deve ser coletada nas 2 semanas anteriores ao lançamento usando a tabela `events` (kind `produto`, migração `0009`). Os alvos abaixo são **propostas** para validação.

### 12.1 Indicadores

| Métrica | Definição | Alvo inicial | Tipo |
| --- | --- | --- | --- |
| Conclusão de cadastro | Cadastros com e-mail confirmado e primeiro login / cadastros iniciados | ≥ 80% | Ativação |
| Tempo até primeiro login | Do envio do formulário de cadastro ao primeiro acesso | Mediana ≤ 3 min | Ativação |
| Sucesso de login por senha | Logins com sucesso / tentativas | ≥ 90% | Task success |
| Adoção de senha | % dos logins feitos por senha (vs. link) após 30 dias | ≥ 60% | Adoção |
| Recuperação concluída | Resets iniciados que chegam a "senha alterada" | ≥ 70% | Task success |
| Tempo de reset | Do pedido de código à senha alterada | Mediana ≤ 3 min | Task success |
| Erros de redirect | Eventos de acesso a rota negada (403) vindos de login | 0 | Qualidade |
| Chamados de acesso | Pedidos de ajuda por "não consigo entrar" | −50% vs. piloto | Negócio |
| Abandono em `/entrar` | Visitas a `/entrar` sem login nem cadastro | −20% vs. linha de base | Engajamento |

### 12.2 Eventos a registrar (via `lib/analytics/track.ts`)

`cadastro_enviado`, `email_confirmado`, `login_senha_ok`, `login_senha_erro`, `magic_link_pedido`, `magic_link_ok`, `reset_pedido`, `reset_codigo_ok`, `reset_codigo_erro`, `senha_alterada`, `logout`. Sem PII e sem senha no payload. O CHECK de `events.type` em `0009_events.sql` exige uma migração para aceitar os novos tipos.

### 12.3 Rate limits de produção (proposta inicial, validar com infraestrutura)

| Limite | Valor |
| --- | --- |
| E-mails de auth por hora (total do projeto) | alinhar ao plano do SMTP; começar com 100/h |
| Reenvio de OTP/link por e-mail | 1 por 60 s, 3 por hora |
| Tentativas de login por IP | 30 por 5 min (padrão do GoTrue) |
| Verificações de token por IP | 30 por 5 min |
| Tentativas de OTP por código | 5, com bloqueio de 15 min |

---

## 13. Marcos e fases

Sem datas inventadas: dimensione com o time. Ordem proposta, cada fase entregável sozinha.

| Fase | Entrega | Tamanho (estimativa relativa) |
| --- | --- | --- |
| **F0** | Decisões em aberto (seção 15) fechadas; `site_url`/SMTP/domínio de e-mail prontos | P |
| **F1 · Base** | Trigger de perfil, `/auth/confirm`, `resolvePostAuthDestination`, novo `isSafeRedirect`, guard do `proxy`, Sair. Corrige G1, G3, G4, G5, G8 e já melhora o login atual | M |
| **F2 · Senha** | `/cadastro`, `/cadastro/confirmar-email`, `/entrar` redesenhada, `enable_confirmations`, templates | M |
| **F3 · Link e reset** | Magic link (só link), `/esqueci-senha`, `/esqueci-senha/codigo`, `/redefinir-senha`, notificação de senha alterada, limite no servidor | M |
| **F4 · Fechamento** | Métricas e eventos, E2E completos, rate limits de produção, atualização de `mvp/prd-mvp.md` e STATE, remover `/entrar/codigo` | P |

**Corte seguro:** F1 sozinha já elimina os bugs de redirect e logout sem mudar o jeito de entrar.

---

## 14. Riscos e mitigação

| Risco | Prob. | Impacto | Mitigação |
| --- | --- | --- | --- |
| Produtora de baixa familiaridade digital desiste com a exigência de senha + confirmação de e-mail | Média | Alto | Manter o link mágico como alternativa de destaque; linguagem simples; confirmação pelo próprio link já loga; testar com 2 produtores do piloto |
| E-mails de auth caem em spam ou atrasam, quebrando cadastro, link e reset | Média | Alto | SMTP próprio com SPF/DKIM/DMARC (RNF-09); reenvio com cooldown; aviso "olhe o spam" |
| Contas do MVP sem senha ficam confusas ("minha conta sumiu?") | Média | Médio | Texto explícito em `/entrar` (RF-10b); comunicação do piloto; link mágico funciona de cara |
| Enumeração de e-mails pelo cadastro/reset | Média | Médio | RN-54, RF-05a, tempos de resposta equivalentes |
| Força bruta em senha ou OTP | Baixa | Alto | Rate limits de produção, bloqueio no servidor (RF-16r), senha mínima 8 |
| `enable_confirmations=true` bloqueia contas do MVP | Baixa | Alto | Contas existentes já têm `email_confirmed_at` (verificar por query antes do deploy) |
| Divergência entre dev (Mailpit) e produção (SMTP real) quebra E2E ou deixa o link com host errado | Média | Médio | `site_url` por ambiente; teste de fumaça em preview antes de produção |
| Trigger de perfil com bug impede qualquer cadastro | Baixa | Alto | Teste de SQL + E2E; trigger com `EXCEPTION` registrando erro e falhando de forma visível |
| Regressão do cookie de visitante (RN-23) ao mudar onde ele é migrado | Média | Médio | Teste que cobre os 4 caminhos de login |
| Perda de `verifyOtp` quebra a suíte E2E atual (dezenas de specs fazem login por OTP/Mailpit) | Alta | Médio | Helper de login de teste único (ex.: `signInWithPassword` via API) atualizado em um lugar só; ver `e2e/helpers` |

---

## 15. Perguntas em aberto

| # | Pergunta | Recomendação | Responsável |
| --- | --- | --- | --- |
| Q1 | O login por OTP some de vez ou fica como terceira opção para o produtor? | Sumir. Link mágico cobre o mesmo caso e OTP fica só para reset | Produto |
| Q2 | Política de senha: `letters_digits` (≥8) ou exigir maiúscula e símbolo? | `letters_digits`, mínimo 8. Mais regra piora a adoção do produtor | Produto + Segurança |
| Q3 | `/produtor` (boas-vindas) fica público? O `createBusiness` exige sessão e hoje a página lê `partners` via admin. | Sim, público, com "Começar cadastro" levando ao cadastro para visitante | Produto |
| Q4 | Contador de tentativas do OTP: tabela própria ou confiar nos limites do GoTrue? | Começar nos limites do GoTrue (G12) e só criar tabela se o piloto mostrar abuso | Eng. |
| Q5 | Ativar checagem de senha vazada (HIBP) exige plano Pro do Supabase. Vale? | Adiar. Registrar como melhoria | Eng. |
| Q6 | O que fazer com usuários órfãos e com `role` inválido no trigger? | Papel desconhecido falha o cadastro (sem padrão silencioso). Órfãos: tela "Complete seu perfil" (RF-17) e, se sobrarem, script único de limpeza | Eng. |
| Q7 | A validade do magic link (10 min) pode ser diferente da do OTP? O GoTrue tem um único `otp_expiry` para e-mail. | Aceitar 10 min para os dois (curto, mas seguro); se virar reclamação, subir para 1 h e aceitar a janela maior do OTP | Eng. |
| Q8 | Pedir **nome** no cadastro? Hoje `profiles.nome` é o prefixo do e-mail. | Sim, campo simples; melhora avisos e a tela do verificador. Could | Produto |
| Q9 | Um mesmo e-mail pode ter dois perfis (investidor e produtor)? | Não neste ciclo; um e-mail = um perfil (como hoje) | Produto |
| Q10 | Notificar por e-mail a tentativa de cadastro duplicado (RF-05a) é aceitável para jurídico/LGPD? | Sim, é aviso ao titular; revisar texto | Jurídico |
| Q11 | O verificador entra pelo mesmo `/entrar`? | Sim, sem cadastro; criação continua pela equipe | Produto |

---

## 16. Premissas

- A Îasy continua em Supabase Auth hospedado e Next.js na Vercel.
- O volume do piloto (dezenas de usuários) dispensa infraestrutura de auth própria.
- Existe ou será criado um remetente de e-mail com domínio próprio.
- As ~11 tabelas e as RLS do MVP não mudam, exceto o trigger e a migração do CHECK de `events.type`.
- Os usuários do piloto aceitam uma comunicação única explicando a mudança.

---

## 17. Rastreabilidade

| Origem (MVP) | Efeito nesta PRD |
| --- | --- |
| RN-02 Entrada sem senha | Substituída por RN-02′ |
| RN-01 / CA-01.3 Papéis, verificador fora do cadastro | Mantidos; reforçados pelo trigger (RF-05, CA-A1.4) |
| RN-03 Termos no primeiro acesso | Mantida, aplicada em todos os caminhos (RN-55, 7.7) |
| RN-23 Respostas do visitante migram ao entrar | Mantida; muda de lugar (7.7 passo 2) |
| RF-02 Tela Entrar com perfil + código | Substituída pelos RF-01 a RF-12a |
| RF-03 Destino por perfil | Mantido; ganha validação de papel (RF-14) |
| RF-04 Termos | Mantido |
| AD-004 Supabase Auth + `@supabase/ssr` | Mantida |
| T02 (`/entrar`) | Redesenhada na seção 8; novas telas na seção 3.1 |

## 18. Aprovação

| Papel | Nome | Status |
| --- | --- | --- |
| Produto | Gabriel Auzier | Pendente |
| Engenharia | — | Pendente |
| Design | — | Pendente |
| Jurídico/LGPD (RF-05a, e-mails) | — | Pendente |
