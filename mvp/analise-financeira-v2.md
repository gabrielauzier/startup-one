# Análise Financeira v2 — Îasy

Sep 27, 2026 · @Gabriel · recorte de [analise-financeira.md](analise-financeira.md) (v1) com 4 das 7 oportunidades de monetização originais

**Errata (27/09/2026):** a primeira versão deste arquivo tinha excluído "Verificação e selo" por engano. Esta versão corrige isso e volta a incluir essa fonte.

## O que mudou em relação à v1

A pedido do Gabriel, esta versão projeta a receita considerando **quatro fontes**: verificação e selo "Verificado", assinatura do investidor, participação na receita do parceiro financeiro e assinatura corporativa. Saem da projeção apenas: fomento e parcerias institucionais, dados e inteligência de mercado e estruturação do produtor (as oportunidades 5, 6 e 7 da v1).

Como a verificação volta a ser cobrada, o custo de campo dela (que na versão anterior deste arquivo ficava sem contrapartida) volta a ter uma receita dedicada, igual na v1 — só o fomento e as duas fontes mais distantes do MVP (dados e estruturação do produtor) ficam de fora.

## Resumo executivo

Com as quatro fontes ligadas diretamente ao MVP — verificação e selo, assinatura do investidor, participação na receita do parceiro financeiro e assinatura corporativa —, a receita do ano 3 cai de R$ 2,84 milhões (v1, 7 fontes) para **R$ 2,54 milhões**, uma redução pequena, porque as três fontes removidas (fomento, dados, estruturação do produtor) juntas somavam pouco no ano 3. O ano 3 **continua positivo**, em **+R$ 230 mil** (ante +R$ 530 mil na v1).

- A necessidade de caixa não é mais linear: o ponto mais negativo do caixa acumulado acontece no fim do ano 2, em cerca de **−R$ 519 mil**, e melhora para **−R$ 289 mil** acumulado ao fim do ano 3, já que o ano 3 sozinho é lucrativo.
- O ano 1 fica com **R$ 97 mil** de receita (ante R$ 247 mil na v1) — a maior queda percentual vem de tirar o fomento, que respondia por R$ 150 mil dos R$ 247 mil originais do ano 1.
- Verificação e selo continua sendo a maior fonte isolada no ano 1 e ano 2 (62% e 34% da receita, respectivamente); as assinaturas (investidor + corporativa) ultrapassam a verificação só no ano 3, somando 55% da receita.
- Com 4 fontes em vez de 7, o modelo fica mais concentrado que a v1, mas menos frágil que o recorte anterior de 3 fontes (que zerava a receita da verificação e não fechava nenhum dos 3 anos no positivo).

Todos os números mantêm as mesmas premissas de volume da v1 (produtores verificados, aportes formalizados, assinantes) — só a lista de linhas de receita mudou.

## Premissas (herdadas da v1, sem alteração)

| Premissa | Valor usado | Origem |
| --- | --- | --- |
| Necessidade de capital por produtor | R$ 50 mil a R$ 200 mil (média de R$ 120 mil no ano 1, subindo para R$ 140 mil no ano 3) | Entrevistas com 5 produtores (Fase 2, Cap. 15) |
| Retorno exigido pelo investidor | Igual ou acima da Selic; impacto não substitui retorno | Hipótese invalidada nas entrevistas |
| O que o investidor mais valoriza | Dado verificado por terceiro e selo de impacto (unanimidade) | Validação da solução (Fase 5, Cap. 8) |
| Formalização do aporte | Parceiro autorizado (plataforma CVM 88, SCD ou banco), ainda não escolhido | Escopo do MVP, ponto em aberto |
| Mercado endereçável imediato (SOM) | R$ 5 bilhões por ano em crédito para PMEs da bioeconomia | BNDES/BID |
| Metas do piloto de 90 dias | 10 produtores verificados, 30 investidores, 3 negociações | Escopo do MVP |

## As quatro fontes de receita consideradas

### 1. Verificação e selo "Verificado"

**Como funciona:** igual à v1 — cada negócio que entra na vitrine passa pela checagem de documentos e evidências e recebe o selo Verificado Îasy e as notas Ambiental, Social e Gestão. A verificação é anual, o que gera renovação recorrente. Quem paga é a cooperativa, ONG parceira ou patrocinador de programa (o produtor sozinho não tem caixa para isso), a um preço de referência de R$ 1.500 a R$ 1.800 por negócio por ano.

**Por que continua na lista:** é a funcionalidade que ataca o gargalo validado nas entrevistas (dado confiável), e os investidores entrevistados consideraram o selo muito importante por unanimidade — é também o que sustenta o valor das outras três fontes, já que sem selo não há o que assinar nem o que comissionar.

### 2. Assinatura do investidor

**Como funciona:** igual à v1 — modelo freemium. A vitrine com dados básicos fica aberta; o plano **Pro** (R$ 149/mês) libera a descoberta guiada completa, a área de documentos e manifestações de interesse ilimitadas; o plano **Family Office** (R$ 990/mês) soma vários usuários e atendimento consultivo. Só passa a cobrar depois de 30 negócios verificados na vitrine.

**Por que continua na lista:** é a fonte mais alinhada à disposição a pagar validada nas entrevistas — o investidor é quem tem caixa e quem mais valoriza o dado verificado.

### 3. Participação na receita do parceiro financeiro

**Como funciona:** igual à v1 — a Îasy origina o negócio, o parceiro autorizado formaliza o aporte, e a Îasy recebe 2% (ano 1) a 2,5% (ano 3) do valor formalizado por contrato de originação.

**Risco que fica mais visível nesta versão:** depois que a Îasy apresenta as partes ao parceiro, nada no modelo impede que produtor, investidor e parceiro sigam direto nas rodadas seguintes sem passar pela Îasy de novo — o mesmo risco de *bypass* de um marketplace. Na v1 esse risco diluía-se entre 7 fontes; aqui ele pesa mais porque é a segunda maior linha de receita.

### 4. Assinatura corporativa

**Como funciona:** igual à v1 — empresas que compram de cadeias amazônicas pagam de R$ 4.000 a R$ 5.000/mês para monitorar fornecedores verificados e receber dados de rastreabilidade. Só entra a partir do ano 2 (depende de funcionalidades de dashboard/relatório fora do MVP).

## Projeção de 3 anos (v2 — 4 fontes)

| Linha (R$ mil) | Ano 1 | Ano 2 | Ano 3 |
| --- | --- | --- | --- |
| Verificação e selo | 60 | 270 | 720 |
| Assinatura do investidor (Pro + Family Office) | 18 | 274 | 804 |
| Participação na receita do parceiro | 19 | 104 | 420 |
| Assinatura corporativa | 0 | 144 | 600 |
| **Receita total** | **97** | **792** | **2.544** |
| Pessoal | 180 | 720 | 1.500 |
| Infraestrutura em nuvem (AWS) | 12 | 36 | 84 |
| Operação de verificação (campo e viagens) | 40 | 120 | 240 |
| Jurídico e regulatório | 30 | 60 | 90 |
| Marketing e eventos | 25 | 120 | 300 |
| Outros | 15 | 50 | 100 |
| **Custo total** | **302** | **1.106** | **2.314** |
| **Resultado** | **−205** | **−314** | **+230** |
| **Resultado acumulado** | **−205** | **−519** | **−289** |

**Volumes por trás dos números** (idênticos à v1 — só a monetização mudou, não o tamanho da operação):

| Indicador | Ano 1 | Ano 2 | Ano 3 |
| --- | --- | --- | --- |
| Produtores verificados (custeados, não cobrados) | 40 | 150 | 400 |
| Aportes formalizados | 8 | 40 | 120 |
| Ticket médio | R$ 120 mil | R$ 130 mil | R$ 140 mil |
| Volume conectado | R$ 0,96 milhão | R$ 5,2 milhões | R$ 16,8 milhões |
| Investidores Pro (média no ano) | 20 (6 meses pagos) | 120 | 350 |
| Family offices | 0 | 5 | 15 |
| Clientes corporativos | 0 | 3 | 10 |
| Pessoas na equipe | 3 | 6 | 12 |

**Leitura dos números:**

- A receita cai menos do que se poderia esperar (R$ 97 mil vs. R$ 247 mil no ano 1; R$ 2,54 milhões vs. R$ 2,84 milhões no ano 3) porque verificação e selo — a fonte mais defensável, ligada ao núcleo do produto — permanece na projeção; a queda vem quase toda do fomento (R$ 150 mil só no ano 1) e, em menor medida, de dados e estruturação do produtor.
- Verificação e selo é a maior fonte isolada nos anos 1 e 2 (62% e 34% da receita); só no ano 3 as assinaturas (investidor + corporativa) ultrapassam, somando 55% da receita contra 28% da verificação.
- A participação no parceiro financeiro responde por 20% (ano1) a 16% (ano3) da receita — proporção parecida com a v1 (14,8% no ano 3), já que essa fonte não mudou de tamanho, só o denominador mudou um pouco.
- **O ano 3 volta a ser positivo** (+R$ 230 mil, ante +R$ 530 mil na v1), mas o caminho até lá é mais fundo: o caixa acumulado chega a −R$ 519 mil no fim do ano 2 antes de melhorar para −R$ 289 mil ao fim do ano 3. A necessidade de capital de giro deste recorte é, portanto, de cerca de **R$ 520 mil** no pior momento — muito próxima da v1 (~R$ 500 mil), mesmo com 3 fontes a menos, porque a fonte removida com mais peso relativo (fomento) era justamente a que ajudava o caixa nos anos iniciais.

**Sensibilidade:** se os aportes formalizados pelo parceiro caírem pela metade em todos os anos (mesmo cenário de estresse da v1), a participação cai proporcionalmente e o resultado do ano 3 fica em torno de +R$ 20 mil — ainda positivo, mas por uma margem mínima. Com 4 fontes em vez de 3, o modelo já é mais resiliente a esse estresse do que o recorte anterior (que ficava negativo mesmo sem estresse), mas ainda mais sensível que a v1 de 7 fontes.

## Riscos específicos deste recorte (além dos já listados na v1)

| Risco | Por que aparece nesta versão | Mitigação |
| --- | --- | --- |
| Sem fomento, o ano 1 perde o principal colchão não dilutivo (R$ 150 mil na v1) | A operação precisa de capital externo já no início, mesmo com verificação e assinaturas rodando | Buscar capital-ponte dimensionado para cobrir o pico de caixa negativo (~R$ 520 mil no ano 2), não só o piloto |
| Concentração maior em cada uma das 4 fontes do que na v1 (7 fontes) | Menos linhas para diluir um atraso ou queda em qualquer uma delas | Priorizar o fechamento do parceiro financeiro cedo, já que é a fonte mais sujeita a atraso fora do controle da Îasy |
| Risco de *bypass* na comissão do parceiro | Com só 4 fontes, essa é proporcionalmente mais relevante que na v1 — e nenhum documento-fonte (PRD, v1) documenta uma mitigação específica para isso | `[Ponto em aberto]` — definir com o parceiro financeiro um mecanismo contratual (ex.: exclusividade por período, ou taxa de originação recorrente) antes de assinar |

## Próximos passos

- [ ] Levar a necessidade de capital de giro de ~R$ 520 mil (pico no ano 2 deste recorte) para qualquer conversa de captação que use esta versão como base
- [ ] Perguntar ao(s) parceiro(s) financeiro(s) sobre um mecanismo contra bypass antes de assinar o contrato de originação
- [ ] Repetir a pergunta de disposição a pagar do piloto (R$ 99, R$ 149 ou R$ 249/mês) para o plano Pro, e também testar a disposição a pagar pela verificação com cooperativas/ONGs parceiras
- [ ] Se o fomento institucional (editais, parcerias) se mostrar acessível no piloto, reavaliar se ele deve voltar à projeção — esta versão só o excluiu por pedido explícito, não porque a oportunidade tenha deixado de existir
