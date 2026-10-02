# Îasy — website (Next.js)

Aplicação web do MVP Îasy. Next.js 16 (App Router, TypeScript), Tailwind CSS v4 + shadcn/ui, Supabase (Postgres, Auth, Storage). O plano de implementação completo está em [`.specs/features/website-mvp/`](../.specs/features/website-mvp/) na raiz do repositório.

## Pré-requisitos

- Node.js 22+ e npm
- Docker Desktop rodando (o Supabase local sobe como containers)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) — não precisa instalar globalmente, `npx supabase` já baixa a versão certa

## Configuração inicial

```bash
cd web
npm install
```

### 1. Subir o Supabase local

```bash
npx supabase start
```

A primeira execução baixa as imagens do Docker e pode levar alguns minutos — deixe terminar sem cancelar. Ao final, o comando imprime as credenciais locais (URL, chaves, etc.).

> O bucket de Storage está desabilitado em `supabase/config.toml` (`[storage] enabled = false`) porque o container `supabase_storage_web` falha o healthcheck neste tipo de ambiente. Isso não afeta nenhuma tela ainda implementada; será reativado quando o upload de fotos do cadastro do produtor entrar (Fase 3).

Para ver as credenciais novamente a qualquer momento (o Supabase local usa sempre os mesmos valores fixos, então é seguro repetir):

```bash
npx supabase status -o env
```

### 2. Configurar as variáveis de ambiente

Copie o exemplo e preencha com os valores impressos por `supabase status -o env`:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
```

`.env.local` não é versionado. Sem ele, qualquer rota que toque Supabase (a maioria, a partir da Fase 2) quebra em runtime com "Your project's URL and Key are required".

### 3. Rodar o app

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Para testar o fluxo de entrada (código de acesso por e-mail), o e-mail não sai de verdade: ele fica no **Mailpit**, em [http://127.0.0.1:54324](http://127.0.0.1:54324). O código de 6 dígitos aparece no corpo do e-mail (o template local foi customizado para isso — veja `supabase/templates/magic_link.html`).

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Roda o build de produção (`npm run build` antes) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes e2e (Playwright) — builda e sobe o app automaticamente; precisa do Supabase local rodando |

Filtrar testes e2e por nome de arquivo/describe: `npm run test:e2e -- rls` (ex.: só os testes de RLS).

## Banco de dados e migrações

Migrações ficam em `supabase/migrations/`, aplicadas em ordem pelo número do prefixo (`0001_...` a `0011_...`). Depois de editar uma migração ou puxar uma nova:

```bash
npx supabase db reset   # recria o banco local do zero e reaplica todas as migrações
npx supabase test db    # roda os testes pgTAP em supabase/tests/
```

`db reset` também é a forma padrão de limpar dados de teste acumulados — o banco local não reseta sozinho entre execuções.

> Depois de um `db reset`, se o login por código parar de funcionar sem motivo aparente (Mailpit não recebe o e-mail), o Kong pode ter ficado servindo uma rota antiga para o template customizado de e-mail. Resolve com um restart completo: `npx supabase stop && npx supabase start`.

Parar os containers do Supabase local quando não precisar mais deles:

```bash
npx supabase stop
```

### Acesso ao banco

Com o Supabase local rodando (`npx supabase start`), três formas de acessar os dados:

| Como | Onde | Uso |
| --- | --- | --- |
| **Studio** (interface web) | [http://127.0.0.1:54323](http://127.0.0.1:54323) | Navegar tabelas, rodar SQL, inspecionar policies de RLS — melhor opção para explorar visualmente |
| **psql** | `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres` | Acesso direto ao Postgres, útil para queries ad-hoc ou depurar uma migração |
| **REST (PostgREST)** | `http://127.0.0.1:54321/rest/v1/<tabela>` com o header `apikey`/`Authorization: Bearer <SERVICE_ROLE_KEY>` | O mesmo caminho que os testes e2e usam para inserir dados direto, contornando RLS — ver `e2e/helpers/db.ts` para o padrão |

As credenciais (URL, chaves, string de conexão do Postgres) são sempre as mesmas localmente — reveja com `npx supabase status -o env` a qualquer momento.

### Tabelas importantes

| Tabela | O que guarda |
| --- | --- |
| `profiles` | Perfil de cada usuário (`role`: `investidor` \| `empresa` \| `produtor` \| `verificador`), estende `auth.users` |
| `businesses` | Negócio cadastrado pelo produtor — dados agregados, `status` (rascunho → em_analise → verificado → ...), notas A/S/G, validade do selo |
| `business_revisions` | Histórico de revisões do cadastro (uma linha por parte salva, nunca sobrescreve) |
| `evidences` | Fotos/evidências enviadas no cadastro (upload real desabilitado localmente, ver nota de Storage acima) |
| `certifications` | Selos de certificadoras enviados pelo produtor, conferidos ou não pelo verificador |
| `partners` | Parceiros financeiros/indicadores |
| `verifications` | Decisões de verificação (aprovar/pedir ajuste/reprovar), checklist, notas, campos marcados para ajuste (`itens_ajuste`) |
| `investor_answers` | Respostas da descoberta guiada (as 5 perguntas do investidor) |
| `documents` | Documentos sensíveis do negócio (CAR, DAP, laudo, certificado completo) |
| `document_requests` | Pedidos de acesso a um documento por um investidor, e a decisão da produtora |
| `document_views` | Registro de cada abertura de documento (quem, quando) |
| `profile_visits` | Visitas à página pública do negócio, deduplicadas por dia/pessoa |
| `interests` | Interesse de um investidor em um negócio, valor, mensagem, status |
| `connection_events` | Linha do tempo de um interesse (pendente → aceita → apresentada ao parceiro → ...) |
| `events` | Fila de avisos e eventos de produto (`kind`: `aviso` \| `produto`) — consumida por `lib/notifications/queue.ts` e `lib/analytics/track.ts` |

A maioria das tabelas tem RLS real (policies por papel — ver a migração correspondente para os detalhes). `business_revisions`, `evidences`, `certifications` e `partners` ainda não têm policy própria; o acesso a elas passa pelo cliente admin (`lib/supabase/admin.ts`) com checagem manual de posse no código.

### Seeds locais

`supabase/seed.sql` roda automaticamente a cada `npx supabase db reset` e deixa o banco com um usuário de teste por papel, já com senha definida (o app em si é passwordless — ver "Login e senha dos usuários de teste" abaixo para as duas formas de entrar):

| Papel | E-mail | Senha |
| --- | --- | --- |
| Produtor | `produtor@teste.iasy.local` | `iasy123456` |
| Investidor | `investidor@teste.iasy.local` | `iasy123456` |
| Verificador | `verificador@teste.iasy.local` | `iasy123456` |

O seed também cria um negócio (`Negócio de Teste`, slug `negocio-de-teste`) já com status `verificado`, de propriedade da produtora de teste — assim a vitrine, a descoberta guiada e a página do negócio têm algo pra mostrar sem precisar passar pelo cadastro e pela verificação inteiros.

Para editar o seed ou adicionar mais dados de teste, edite `supabase/seed.sql` diretamente e rode `npx supabase db reset` de novo (idempotente — pode rodar quantas vezes quiser). Ele segue o mesmo padrão que os helpers de `e2e/helpers/db.ts` (`createProfileWithAuth`, `createBusiness`, etc.) automatizam via REST para os testes e2e, só que via SQL direto contra `auth.users`/`auth.identities`/`public.profiles`.

#### Login e senha dos usuários de teste

O app **não tem login por senha na interface** — o fluxo real (RF-02) é sempre por código de 6 dígitos enviado por e-mail (ver seção "Rodar o app" acima). Duas formas de usar os usuários seedados:

1. **Pela UI, com o código de acesso** (fluxo real do produto): em [http://localhost:3000/entrar](http://localhost:3000/entrar), escolha o papel e digite o e-mail do usuário seedado (ex. `investidor@teste.iasy.local`). O código de 6 dígitos aparece no Mailpit, em [http://127.0.0.1:54324](http://127.0.0.1:54324) — não importa qual papel for marcado na tela, o perfil já existe no banco com o papel certo e não é sobrescrito. Para o verificador (que não tem opção própria na tela, RN-01), marque qualquer papel — o login segue redirecionando para `/verificacao` porque o profile já está com `role='verificador'`.
2. **Por senha, direto na API** (útil para DataGrip, curl, scripts, ou qualquer teste que não precise passar pela UI):

   ```bash
   curl -X POST "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
     -H "apikey: <ANON_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"email":"produtor@teste.iasy.local","password":"iasy123456"}'
   ```

   Devolve um `access_token` (JWT) utilizável em qualquer chamada à API REST/GraphQL do Supabase local como o usuário seedado.

## Estrutura

```
app/
  (marketing)/   rotas públicas: página inicial, entrar, termos
  (investor)/    rotas do investidor/empresa (a partir da Fase 3+)
  (producer)/    rotas do produtor
  (verifier)/    rotas do verificador
components/
  ui/            componentes base do shadcn/ui
  marketing/, shared/   componentes específicos por área
lib/
  supabase/      fábricas de cliente (server, client, middleware, admin)
  auth/          mapa de acesso por papel (resolveAccess)
e2e/             testes Playwright
supabase/        migrações, config local e templates de e-mail
```

Rotas privadas e o controle de acesso por papel ficam em `proxy.ts` na raiz (não `middleware.ts` — o Next.js 16 renomeou essa convenção).

## Referência

- Especificação, arquitetura e plano de tasks: [`.specs/features/website-mvp/`](../.specs/features/website-mvp/)
- Decisões de projeto e estado atual: [`.specs/STATE.md`](../.specs/STATE.md)
- PRD e protótipo do MVP: [`../mvp/`](../mvp/)
