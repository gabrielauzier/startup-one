# Gaps de design — histórico consolidado

Registro único de todo gap encontrado entre o design original (protótipo/Figma) e o MVP construído, as decisões tomadas para cada um e as correções aplicadas. Cada lote de trabalho vira uma seção datada, anexada ao final — este documento **nunca reescreve o histórico de lotes anteriores**, só acrescenta.

Convenção por lote: fonte do relatório de gaps → lista de telas/áreas cobertas → decisões de produto (quando um "gap" não era puramente visual) → correções aplicadas → testes afetados.

---

## Lote 1 — 2026-09-30 — Home, Descobrir, Negócios (listagem e detalhe)

**Fonte:** `mvp/relatorio-gaps-design-e-mvp-final.md` (seções "Gaps de layout geral", "1. Página Inicial", "2. Página de Descobrir", "3. Página de detalhamento do Negócio", "4. Página de listagem de Negócios").

### Gaps de layout geral
- Cabeçalho/navegação ausente (desktop + mobile bottom nav, diferenciado por papel) → criado `SiteHeader` + `MobileBottomNav` + `AppChrome`.
- Banner legal rolava com o scroll em vez de fixo → `FixedLegalBanner` (fixo em desktop, em fluxo normal no mobile por causa do bottom nav).
- Commits: `c672bc4`.

### Página inicial
- Card de negócio em destaque ausente no hero → `BusinessCard` consultando o negócio mais recentemente verificado.
- Botões: variante outline sem borda (bug de merge de classes Tailwind, `buttonVariants` usado sem `cn()`) → corrigido em 4 call sites. Commit `ae89231`.
- Cards com fundo transparente (`--card`/`--popover` iguais a `--background`) → corrigido em `globals.css`. Commit `03bdd0c`.
- Inputs/selects com fundo transparente → `bg-white` em `Input` + 9 controles brutos. Commit `0d80102`.

### Descobrir
- Questionário sem multistep wizard visual → `DiscoveryProgress` (barra de 5 segmentos) + cards de opção estilizados, mantendo a mesma lógica de rota por pergunta (sem adotar o componente `Questionnaire` do shadcn — incompatível com a arquitetura de rota-por-pergunta já existente).

### Componente Typography
- Textos do app usavam combinações soltas de classes Tailwind repetidas; criado `components/ui/typography.tsx` (props `as`/`variant`/`size`/`weight`/`color`) e migrada uma amostra representativa (`SiteHeader`, home, `FourSteps`, `BusinessCard`, `entrar-form`, `codigo-form`). Resto do app não migrado neste lote (decisão explícita, só amostra). Commits `ce2a9c6`, `398cc55`.

### `/negocios` (listagem) e `/negocios/:slug` (detalhe)
- Badges de certificadora: texto plano → badge circular (`CertificationBadge`).
- Imagem "Sem foto": **sem dado de foto real no banco** (`businesses` não tem coluna de foto, `evidences` não resolve URL pública) → placeholder de cor determinística por negócio (`BusinessTonePlaceholder`), decisão validada com o usuário. Galeria de fotos do protótipo não implementada (sem dado).
- Nome completo da certificadora (ex. "Orgânico Brasil"): **não implementado** — `certifications.certificadora` é um único campo de texto livre no schema, sem separação sigla/nome completo; badge fica só com a sigla real.
- Métricas financeiras (Busca/Prazo/Retorno): linha corrida → grid de 3 colunas (`FinancialMetricsGrid`, reusado no card e no detalhe).
- Notas Îasy: texto corrido → `ScoreBars` (barras horizontais) no detalhe; reespaçado (sem virar barra) no card, para não quebrar teste unitário existente.
- Abas do detalhe: pill verde → ARIA tabs reais (`role="tablist"/"tab"/"tabpanel"`, estilo underline) — também uma melhoria de acessibilidade.
- Breadcrumb "Negócios / {nome}" adicionado ao detalhe.
- Sidebar do detalhe: `<aside>` solto → `Card` branco.
- Grid da listagem: 2 colunas → 3 colunas (`lg:grid-cols-3`), `<main>` alargado para acomodar.
- **Bug corrigido (não só visual)**: a listagem nunca calculava `interesseSomado` por negócio — toda barra de interesse aparecia zerada mesmo com interesses reais registrados. Corrigido com uma query batched em `interests` + `sumInterests()` (mesma função já usada no detalhe).
- Busca "ao vivo" (sem botão) e renomear o label do campo: **não implementado** — exigiria reescrever a página como client component com debounce, fora do escopo de um fix visual; e2e depende do texto exato do label e do botão "Buscar".
- Commit: `5a95c27`.

---

## Lote 2 — 2026-10-01 — Cadastro do produtor (PRO-01 a PRO-05)

**Fonte:** `issues/gaps-de-design/issue-04-pagina-PRO-01-boas-vindas.md` até `issue-08-pagina-PRO-05-fotos-e-documentos.md`.

### Decisões de produto (gaps que não eram só visuais)

- **PRO-04 "Impactos gerados"**: o relatório pedia para remover a seção inteira (não existe no protótipo). Mantida funcionalmente, só com restyle (`CheckboxPill variant="card"`) — a seção alimenta 15 dos 100 pontos do score de alinhamento investidor-negócio (`lib/matching/score.ts`) e a pergunta 5 do questionário do investidor (`/descobrir`) foi desenhada para usar o mesmo vocabulário. Remover teria degradado o matching silenciosamente.
- **PRO-03 "Recebemos visitas de investidores"**: o relatório marcava o checkbox como elemento fora do design desta tela. Mantido nesta tela — é o único lugar do cadastro onde o produtor define `recebe_visitas`, já exibido na página pública do negócio (Lote 1).
- **PRO-01 "Qual?" (cooperativa/ONG)**: o relatório reportava esse campo condicional como ausente. Constatação: já existe e funciona (`boas-vindas-form.tsx`), condicionado a `indicado === "sim"`. Relatório desatualizado nesse ponto — não alterado.
- **PRO-04 opções de "Como cuidam da floresta"**: o relatório pedia reduzir de 7 para 4 opções com texto diferente. Não aprovado — são dados reais usados em matching/verificação, mudar exigiria decisão de produto separada. Mantidas as mesmas 7 opções (`PRACTICE_OPTIONS`), só o componente visual mudou.
- **PRO-01 copy**: título/bullets atuais ("Seja bem-vinda à Îasy" etc.) mantidos — são copy já revisada do produto, não a do protótipo do relatório. Só estrutura/componentes corrigidos.

### Componentes novos (`web/components/cadastro/`)
- `StepProgress` — barra de 5 segmentos.
- `PartHeader` (reescrito) — botão circular de voltar (`backHref` explícito por tela, não calculado — PRO-02 volta para `/produtor`, as demais para `cadastro/{N-1}`), "Parte N de 5" centralizado, badge "✓ Salvo" separado (antes concatenado com `·`), `StepProgress`, título em cor neutra (antes verde).
- `RadioCard` — extrai o padrão ad-hoc já usado em `boas-vindas-form`/`parte5-form` (`role="radio"` sobre `Button`) para componente reutilizável. Usado em Sim/Não (PRO-01) e Tipo de organização (PRO-03, no lugar de um `<select>`).
- `CheckboxPill` — wrapper visual (`variant="pill"|"card"`) sobre o `Checkbox` existente, mantém `<input type=checkbox>` real por baixo.
- `CadastroFooter` — CTA "Continuar" full-width (o "Voltar" migrou para o `PartHeader`).
- `web/lib/format/masks.ts` — `formatPhoneBR`/`unformat` (funções puras, sem lib nova); CNPJ reaproveita `formatCnpj`/`isValidCnpj` já existentes em `lib/validation/cnpj.ts`. **Valor mascarado só no input visível** — o valor submetido ao servidor é sempre o unformat()ado, via `<input type="hidden">` paralelo, para não mudar o formato gravado no banco (telefone/CNPJ continuam salvos como antes).
- `PhotoUploader` redesenhado (mesmo contrato de props, reusado também em `produtor/painel/documentos-adicionais`): dois botões ("Tirar foto"/"Escolher arquivo") disparando dois inputs ocultos (um com `capture="environment"`), miniatura via `URL.createObjectURL`, card de sucesso "Enviado · N fotos" + "Trocar".
- `lib/validation/amazonia-legal.ts` ganhou `BRAZIL_UFS` (27 UFs) — **desvio do plano original**: o plano previa reusar `AMAZONIA_LEGAL_UFS` (só as 9 UFs do piloto) no dropdown de Estado, mas isso tornaria impossível selecionar um estado fora da Amazônia Legal, quebrando o teste (e o comportamento real) que mostra o aviso "fora do piloto" para esses casos.

### Correções por tela
- **PRO-01**: logo no cabeçalho, "Quem vê o quê" virou `Card` com 3 blocos coloridos (verde/azul/vermelho), Sim/Não como `RadioCard`.
- **PRO-02**: máscaras de telefone/CNPJ, bloco de autorização em `Card`, header/footer novos.
- **PRO-03**: Tipo de organização como `RadioCard` (com `<input type="hidden">` próprio, coexistindo com `LockedHiddenValue` do fluxo de ajuste — este último só emite quando o campo está travado, sem duplicar valor), Estado como `<select>` (`BRAZIL_UFS`, com `LockedHiddenValue` adicionado — um `<select disabled>` não entra no `FormData`, diferente do `readOnly` do input de texto anterior), Cidade+Estado e Famílias+Tempo em grid de 2 colunas, header/footer novos.
- **PRO-04**: produtos como `CheckboxPill` pill, práticas e impactos como `CheckboxPill` card (mesmas opções/dados), sufixo "kg" visual no input de produção mensal + texto de ajuda, header/footer novos.
- **PRO-05**: subtítulo de instrução, `PhotoUploader` redesenhado nos 4 grupos, texto de exemplos de selos, header/footer novos.
- **PRO-06 "Quanto vocês precisam"** (fora de escopo, sem issue própria): só recebeu o `backHref` obrigatório no `PartHeader` para continuar compilando — nenhuma outra mudança.

### Testes e2e atualizados (consequência direta das mudanças estruturais)
- `produtor-parte2.spec.ts`, `produtor-parte3.spec.ts`, `produtor-parte4.spec.ts`, `produtor-parte5.spec.ts`, `cadastro-offline-sync.spec.ts`, `flow-cadastro.spec.ts`, `produtor-cadastro-completo.spec.ts`: `getByLabel("Tipo de organização").selectOption(...)` → `getByRole("radio", {name:...}).click()`; `getByLabel("Estado (UF)").fill(...)` → `.selectOption(...)`; `"Produção mensal aproximada (kg)"` → `"Produção mensal aproximada"` (label encurtado, "kg" virou sufixo visual).
- `cadastro-offline.spec.ts`, `cadastro-offline-sync.spec.ts`: texto concatenado `"Parte N de 5 · Salvo"` → duas asserções separadas. Achado no caminho: a asserção original de `cadastro-offline.spec.ts` fazia *match por substring* (sem `exact:true`) contra `"Parte 1 de 5 · Salvo"`, que por acaso também batia como prefixo de `"Parte 1 de 5 · Salvo no celular"` — o estado real da tela logo após reload offline. Corrigido para asserção exata contra o texto real (`"Salvo no celular"`), não o texto que o teste antigo mascarava por imprecisão.
- `ajuste-por-campo.spec.ts`: sem mudança de asserção, mas pegou 2 bugs reais introduzidos durante a implementação (ver abaixo) — ambos corrigidos antes do commit.

### Bugs pegos pelos próprios testes durante a implementação (corrigidos, não chegaram a ser commitados quebrados)
1. `uf` virou `<select disabled={isFieldLocked(...)}>` sem `LockedHiddenValue` — um select desabilitado não entra no `FormData`, então o formulário travava ao tentar avançar com o campo bloqueado pelo verificador. Corrigido adicionando `LockedHiddenValue` para "uf", igual ao que já existia para "tipoOrg".
2. Telefone mascarado sendo submetido formatado (`"(91) 9999-1234"`) em vez de dígitos puros (`"9199991234"`) — quebrava o teste que verifica o valor gravado na revisão. Corrigido: o input visível mostra o valor mascarado, mas o `name="telefone"` migrou para um `<input type="hidden">` paralelo com o valor `unformat()`ado.

### Gate
- `npm run lint && npm run typecheck && npm run build && npm run test` (265 testes unitários, incluindo 8 novos para `formatPhoneBR`/`unformat`).
- E2e direcionados: `produtor-boas-vindas`, `produtor-parte1..5`, `cadastro-offline`, `cadastro-offline-sync`, `flow-cadastro`, `produtor-cadastro-completo`, `produtor-documentos-adicionais`, `ajuste-por-campo` — 17 passando.
- Checagem visual em largura mobile (390px) das 5 telas, via screenshots de um fluxo completo de cadastro.
