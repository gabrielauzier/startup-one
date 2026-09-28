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

Migrações ficam em `supabase/migrations/`. Depois de editar uma migração ou puxar uma nova:

```bash
npx supabase db reset   # recria o banco local e reaplica todas as migrações
npx supabase test db    # roda os testes pgTAP em supabase/tests/
```

Parar os containers do Supabase local quando não precisar mais deles:

```bash
npx supabase stop
```

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
