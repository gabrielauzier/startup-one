# Análise Financeira — Amazon Capital

Sep 26, 2026 · @Gabriel

## Resumo executivo

A Amazon Capital deve cobrar pela **confiança que produz**, não pelo dinheiro que passa: verificação com selo, assinatura do investidor e uma participação na receita do parceiro financeiro que formaliza os aportes. Com essas fontes, a projeção chega a **R$ 2,8 milhões de receita no ano 3**, com ponto de equilíbrio nesse mesmo ano e necessidade de caixa de cerca de **R$ 500 mil** até lá.

- **Sete oportunidades** foram mapeadas; quatro entram na operação até o fim do ano 1 e três ficam para os anos 2 e 3.
- **Maior fonte no ano 3:** verificação e selo (25%), seguida de assinaturas de investidores (28% somando Pro e family offices).
- **Maior risco:** regulatório. Qualquer receita atrelada ao valor investido precisa ser paga pelo parceiro autorizado pela CVM, nunca cobrada direto do investidor pela plataforma.
- **Piloto de 90 dias sem cobrança**, como já previsto no escopo do MVP, para medir disposição a pagar antes de fixar preços.

A atividade de viabilidade financeira (Fase 5, Cap. 9) estava marcada como não entregue; este relatório parte do canvas, das entrevistas e do escopo do MVP. Todos os números são estimativas a validar no piloto.

## Premissas

O modelo respeita a decisão de 26/09/2026: no MVP a plataforma só conecta, e o dinheiro não passa por ela. As demais premissas vêm das atividades anteriores.

| Premissa | Valor usado | Origem |
| --- | --- | --- |
| Necessidade de capital por produtor | R$ 50 mil a R$ 200 mil (média de R$ 120 mil no ano 1, subindo para R$ 140 mil no ano 3) | Entrevistas com 5 produtores (Fase 2, Cap. 15) |
| Quem paga | Principalmente investidores e cooperativas; o pequeno produtor tem pouca capacidade de pagamento | Canvas, seção Cliente (Fase 3, Cap. 10) |
| Retorno exigido pelo investidor | Igual ou acima da Selic; impacto não substitui retorno | Hipótese invalidada nas entrevistas |
| O que o investidor mais valoriza | Dado verificado por terceiro e selo de impacto (unanimidade) | Validação da solução (Fase 5, Cap. 8) |
| Formalização do aporte | Parceiro autorizado (plataforma CVM 88, SCD ou banco), ainda não escolhido | Escopo do MVP, ponto em aberto 1 |
| Mercado endereçável imediato (SOM) | R$ 5 bilhões por ano em crédito para PMEs da bioeconomia | BNDES/BID, citado na Fase 2 |
| Metas do piloto de 90 dias | 10 produtores verificados, 30 investidores, 3 negociações | Escopo do MVP, seção 6 |

A participação projetada no ano 3 (R$ 16,8 milhões em aportes conectados) equivale a 0,34% do SOM, o que torna a meta conservadora do lado do mercado e agressiva do lado da execução.

## Oportunidades de monetização

Sete fontes de receita cabem no modelo sem a plataforma movimentar dinheiro. A tabela resume; cada uma é detalhada em seguida.

| # | Oportunidade | Quem paga | Preço de referência | Quando entra | Receita no ano 3 |
| --- | --- | --- | --- | --- | --- |
| 1 | Verificação e selo | Cooperativa, ONG ou patrocinador (produtor só em parte) | R$ 1.500 a R$ 1.800 por projeto por ano | Mês 4 | R$ 720 mil |
| 2 | Assinatura do investidor | Investidor PF qualificado e family office | R$ 149/mês (Pro) e R$ 990/mês (family office) | Mês 4 | R$ 804 mil |
| 3 | Participação na receita do parceiro financeiro | Plataforma CVM 88, SCD ou banco parceiro | 2% a 2,5% do valor formalizado | Ano 1, após contrato com o parceiro | R$ 420 mil |
| 4 | Assinatura corporativa | Empresas com cadeia de fornecimento amazônica | R$ 4.000 a R$ 5.000/mês | Ano 2 | R$ 600 mil |
| 5 | Fomento e parcerias institucionais | Fundos, bancos de desenvolvimento, fundações, mídia parceira | Editais de R$ 150 mil a R$ 250 mil por ano | Ano 1 | R$ 200 mil |
| 6 | Dados e inteligência de mercado | Bancos, fintechs de crédito rural, pesquisadores | Relatórios e acesso via API | Ano 3 | R$ 100 mil |
| 7 | Estruturação do produtor | Produtor, geralmente com subsídio | Pacote de R$ 3.000 a R$ 8.000 | Opcional, ano 2 | Fora da projeção |

### 1. Verificação e selo "Verificado"

**Como funciona:** cada projeto que entra na vitrine passa pela checagem de documentos e evidências e recebe o selo e o score ambiental, social e de governança. A verificação é anual, o que gera renovação recorrente.

**Por que tem valor:** é a funcionalidade que ataca o gargalo validado (dado confiável), e todos os investidores entrevistados consideraram o selo muito importante.

**Quem paga:** o produtor pediu ajuda e não tem caixa, então o pagador ideal é a cooperativa (preço por associado), uma ONG parceira ou um patrocinador de programa. O custo estimado por verificação é de R$ 600 a R$ 800 (um dia de analista mais checagem remota), com margem de cerca de 50%.

**Riscos:**

- **Conflito de interesse:** quem paga pelo selo pode pressionar pela aprovação. Mitigação: preço igual para aprovados e reprovados, critérios públicos e verificação feita por quem não vende.
- **Custo logístico:** visitas de campo na Amazônia são caras. Mitigação: evidência por celular (fotos georreferenciadas) e verificadores credenciados em cooperativas.
- **Credibilidade:** um selo próprio vale menos que certificações conhecidas. Mitigação: aceitar e exibir selos existentes (Orgânico Brasil, Fair Trade, Rainforest Alliance) ao lado do score.

### 2. Assinatura do investidor

**Como funciona:** modelo freemium. A vitrine com dados básicos fica aberta; o plano **Pro** (R$ 149/mês) libera a descoberta guiada completa, a área de documentos, alertas de novos projetos e manifestações de interesse ilimitadas. O plano **Family Office** (R$ 990/mês) soma vários usuários, relatório de tese e atendimento consultivo.

**Por que tem valor:** o canvas aponta o investidor como o lado com disposição a pagar, e a descoberta guiada foi aprovada no teste de usabilidade.

**Riscos:**

- **Vitrine vazia:** ninguém assina para ver 10 projetos. Mitigação: só cobrar com 30 ou mais projetos verificados; até lá, gratuito.
- **Base pequena:** investidores de impacto qualificados são poucos no Brasil. Mitigação: canal com o site Opinião Amazônia, eventos ESG e plano anual com desconto.
- **Cancelamento:** investidor que já aportou pode cancelar. Mitigação: acompanhamento do portfólio e relatórios de impacto (fora do MVP) como motivo para ficar.

### 3. Participação na receita do parceiro financeiro

**Como funciona:** a Amazon Capital origina o negócio e o parceiro autorizado formaliza o aporte. Plataformas de investimento coletivo cobram em geral uma taxa de sucesso do captador; a Amazon Capital recebe uma parte dela por contrato de originação. Usamos 2% do valor formalizado no ano 1 e 2,5% no ano 3. Cada aporte médio de R$ 120 mil rende cerca de R$ 2.400.

**Por que tem valor:** é a receita que cresce com o volume conectado, e alinha o ganho da plataforma ao objetivo do produtor.

**Riscos:**

- **Regulatório:** cobrar do investidor ou do produtor uma comissão sobre a oferta pode caracterizar intermediação irregular. Mitigação: receita paga só pelo parceiro, contrato revisado por advogado de mercado de capitais e nenhuma promessa de retorno nas telas.
- **Dependência de um parceiro:** ele define preço e ritmo. Mitigação: ter ao menos dois parceiros (um de equity ou dívida CVM 88 e um de crédito, SCD ou cooperativa de crédito).
- **Ciclo longo:** do interesse ao dinheiro podem passar meses. Mitigação: não contar com essa receita para o caixa do ano 1.
- **Retorno abaixo da Selic:** se os projetos não entregarem retorno de mercado, o volume não acontece. Mitigação: exibir retorno e prazo propostos pelo parceiro, não pela plataforma.

### 4. Assinatura corporativa

**Como funciona:** empresas que compram de cadeias amazônicas (cosméticos, alimentos, chocolates) pagam para monitorar fornecedores verificados, receber dados de rastreabilidade e relatórios ESG. Preço de referência de R$ 4.000 a R$ 5.000 por mês.

**Por que tem valor:** um dos investidores entrevistados era corporativo e citou justamente a dificuldade de integrar dados produtivos à cadeia de suprimentos.

**Riscos:**

- **Depende de funcionalidades fora do MVP** (dashboard de impacto, relatórios). Mitigação: só vender a partir do ano 2, depois de construí-las.
- **Venda longa e concentrada:** poucos clientes grandes. Mitigação: meta modesta de 3 clientes no ano 2 e 10 no ano 3.

### 5. Fomento e parcerias institucionais

**Como funciona:** receita não dilutiva de editais e programas ligados à bioeconomia (Fundo Amazônia, BNDES, BID, fundações, aceleradoras) e patrocínio de verificações. A parceria com o Opinião Amazônia pode render destaque editorial de projetos, desde que marcado como conteúdo patrocinado.

**Riscos:**

- **Receita incerta e não recorrente.** Mitigação: nunca passar de 30% da receita a partir do ano 2.
- **Conflito com a curadoria:** projeto patrocinado não pode aparecer como mais bem avaliado. Mitigação: patrocínio só em espaço editorial, nunca no ranking da vitrine.

### 6. Dados e inteligência de mercado

**Como funciona:** com centenas de produtores verificados, a base vira um ativo: relatórios setoriais anonimizados e, mais adiante, um score de produtor para bancos e fintechs de crédito rural.

**Riscos:**

- **LGPD e confiança do produtor:** produtores entrevistados já demonstraram receio de compartilhar dados. Mitigação: apenas dados agregados, ou individuais com consentimento expresso e ganho claro para o produtor.
- **Precisa de escala:** sem volume, o dado não vale. Por isso fica para o ano 3.

### 7. Estruturação do produtor (opcional)

**Como funciona:** pacote para preparar o produtor para receber investimento, como organização financeira, formalização de CNPJ e montagem de documentos. Pode ser vendido com subsídio de ONGs ou como serviço de parceiros.

**Riscos:** baixa capacidade de pagamento do produtor, pouca escalabilidade (é consultoria) e conflito com a verificação se a mesma equipe preparar e avaliar. Por isso não entra na projeção e, se existir, deve ser feito por parceiros.

## Projeção de 3 anos

A receita sai de R$ 247 mil no ano 1 para R$ 2,84 milhões no ano 3, e o resultado fica positivo no ano 3 (R$ 530 mil). O prejuízo acumulado nos dois primeiros anos é de R$ 119 mil; sem os editais de fomento, sobe para cerca de R$ 520 mil, que é a necessidade de capital recomendada.

| Linha (R$ mil) | Ano 1 | Ano 2 | Ano 3 |
| --- | --- | --- | --- |
| Verificação e selo | 60 | 270 | 720 |
| Assinatura Pro | 18 | 215 | 626 |
| Assinatura Family Office | 0 | 59 | 178 |
| Participação na receita do parceiro | 19 | 104 | 420 |
| Assinatura corporativa | 0 | 144 | 600 |
| Dados e inteligência | 0 | 0 | 100 |
| Fomento e parcerias | 150 | 250 | 200 |
| **Receita total** | **247** | **1.042** | **2.844** |
| Pessoal | 180 | 720 | 1.500 |
| Infraestrutura em nuvem (AWS) | 12 | 36 | 84 |
| Operação de verificação (campo e viagens) | 40 | 120 | 240 |
| Jurídico e regulatório | 30 | 60 | 90 |
| Marketing e eventos | 25 | 120 | 300 |
| Outros | 15 | 50 | 100 |
| **Custo total** | **302** | **1.106** | **2.314** |
| **Resultado** | **−55** | **−64** | **+530** |

**Volumes por trás dos números:**

| Indicador | Ano 1 | Ano 2 | Ano 3 |
| --- | --- | --- | --- |
| Produtores verificados | 40 | 150 | 400 |
| Aportes formalizados | 8 | 40 | 120 |
| Ticket médio | R$ 120 mil | R$ 130 mil | R$ 140 mil |
| Volume conectado | R$ 0,96 milhão | R$ 5,2 milhões | R$ 16,8 milhões |
| Investidores Pro (média no ano) | 20 (6 meses pagos) | 120 | 350 |
| Family offices | 0 | 5 | 15 |
| Clientes corporativos | 0 | 3 | 10 |
| Pessoas na equipe | 3 | 6 | 12 |

**Leitura dos números:**

- A receita recorrente (sem fomento) vai de 39% do total no ano 1 para 93% no ano 3, o que reduz a dependência de editais.
- A participação no parceiro é só 15% da receita do ano 3. O negócio fica de pé mesmo se o volume de aportes demorar, porque verificação e assinaturas não dependem da formalização.
- A infraestrutura é barata (menos de 4% do custo): o custo real está em pessoas e na verificação em campo.
- No ano 1 os três primeiros meses são de piloto sem cobrança, por isso as assinaturas contam só seis meses pagos.

**Sensibilidade:** se os produtores verificados ficarem em metade do previsto em todos os anos, a verificação e a participação no parceiro caem pela metade e o resultado do ano 3 fica perto de zero (cerca de −R$ 40 mil). A variável que mais pesa é o ritmo de verificação, não o volume de dinheiro investido.

## Riscos do negócio

Além dos riscos de cada fonte, seis riscos afetam o modelo inteiro. O regulatório é o único que pode encerrar a operação e por isso vem primeiro.

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Regulatório: a CVM entender que a plataforma faz oferta ou intermediação sem autorização | Média | Alto | Nada de "investir agora", retorno ou valor captado nas telas; toda formalização e cobrança atrelada ao aporte com o parceiro; parecer jurídico antes de lançar |
| Ovo e galinha: poucos projetos afastam investidores, e vice-versa | Alta | Alto | Começar pela oferta via cooperativas e ONGs; cobrar do investidor só com vitrine mínima de 30 projetos |
| Retorno dos projetos abaixo da Selic | Média | Alto | Curadoria prioriza negócios com receita e contrato de venda; parceiro define a estrutura (dívida com garantia de recebíveis, por exemplo) |
| Reputacional: projeto verificado envolvido em desmatamento ou conflito fundiário | Baixa | Alto | Checar CAR e área desmatada no cadastro; reverificação anual; direito de suspender o selo |
| Custo e tempo de verificação maiores que o previsto | Média | Médio | Meta de até 5 dias úteis por projeto já no piloto; verificadores credenciados nas cooperativas |
| Proteção de dados (LGPD) e segurança dos documentos | Média | Médio | Documentos sensíveis só em visualização na área logada, acesso liberado pelo produtor, registro de quem viu |

## Roadmap de monetização

A cobrança entra em ondas, cada uma liberada por um sinal medido na anterior.

| Fase | Período | O que cobra | Sinal para avançar |
| --- | --- | --- | --- |
| Piloto | Meses 1 a 3 | Nada; testa disposição a pagar com o investidor | 10 produtores verificados, 10 manifestações de interesse, 3 negociações com parceiro |
| Primeira receita | Meses 4 a 12 | Verificação paga, plano Pro, contrato de originação com o parceiro, primeiro edital | 30 projetos na vitrine e 20 investidores pagantes |
| Escala | Ano 2 | Family Office, assinatura corporativa, segundo parceiro financeiro | 150 produtores verificados e 3 clientes corporativos |
| Dados | Ano 3 | Relatórios e score para crédito | 400 produtores com histórico de 2 anos |

**Próximos passos:**

- [ ] Escolher e contatar dois parceiros financeiros (uma plataforma CVM 88 e uma SCD ou cooperativa de crédito) e perguntar a taxa de sucesso que cobram
- [ ] Colocar no piloto a pergunta de disposição a pagar para investidores (R$ 99, R$ 149 ou R$ 249 por mês)
- [ ] Medir o custo real de 10 verificações para confirmar a margem de 50%
- [ ] Levantar editais abertos de bioeconomia para o ano 1
- [ ] Pedir parecer jurídico sobre o contrato de originação

**Para o slide Financeiro do pitch:** receita de R$ 2,8 milhões e lucro no ano 3, quatro fontes que não dependem de movimentar dinheiro, e necessidade de R$ 500 mil para chegar lá.
