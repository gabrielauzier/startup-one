# ATIVIDADE - VALIDANDO A SOLUÇÃO (STARTUP ONE)

## 1. Em uma linha, descreva seu projeto de startup incluindo o problema e a solução:

Uma plataforma digital que traz visibilidade e autonomia aos produtores da
Amazônia, garantindo a confiabilidade no aporte e impacto socioambiental.

## 2. Documente as evidências e aprendizados do experimento com seu MVP.

### Tela de Mapeamento da busca

Feedback:

A tela de Mapeamento da busca por passos se provou intuitiva
Insight:

A experiência da busca de investimentos por parte do investidor está
adequada e pode seguir do jeito que planejamos.

Imagem - Fluxo de busca com matching

```xml
<Screen title="Descoberta Inteligente" step="Passo 1 de 5">
  <Header>
    <Title>Qual é a sua tese de investimento?</Title>
    <Subtitle>Isso vai direcionar sua curadoria personalizada de projetos.</Subtitle>
  </Header>

  <Grid columns="2">
    <OptionCard icon="folha">
      <Title>Impacto Primeiro</Title>
      <Description>Prioriza o máximo de preservação e benefício social, com retorno secundário</Description>
    </OptionCard>

    <OptionCard icon="grafico-alta">
      <Title>Retorno Primeiro</Title>
      <Description>Busca a melhor rentabilidade com responsabilidade ambiental</Description>
    </OptionCard>

    <OptionCard icon="pessoas">
      <Title>Foco Social</Title>
      <Description>O que mais importa é o número de famílias e comunidades beneficiadas</Description>
    </OptionCard>

    <OptionCard icon="balanca">
      <Title>ESG Balanceado</Title>
      <Description>Busca equilíbrio ideal entre retorno financeiro e impacto sustentável</Description>
    </OptionCard>
  </Grid>
</Screen>
```

---

### Aporte no Projeto

Feedback:

O projeto precisa ser mais claro quanto a sua função e ao público alvo.
Não ficou claro se os aportes feitos seriam equivalentes a investimentos
ou a financiamento aos produtores.

Insight:

Precisamos elaborar mais profundamente quais são as
responsabilidades da plataforma e quais responsabilidades são
delegadas às entidades parceiras, como bancos e fintechs.

---

### Selos de Impacto Ambiental

Para viabilizar o investimento na plataforma, é importante a parceria com
bancos de investimento que possibilitem intermediar as transferências
financeiras e o controle do retorno.
Selos de Impacto Ambiental

Feedback:

Seria interessante visualizar selos oficiais por projetos para garantir a
sustentabilidade. Os investidores entrevistados, em sua unanimidade
consideram muito importante os projetos possuírem selos de impacto
ambiental.

Insight:

Atualmente já temos os selos de verificação dentro do detalhamento do
investimento, porém cabe facilitar o acesso a essa informação nas
páginas de indexação dos projetos.
Investigar a possibilidade de integrar e utilizar selos de sustentabilidade
existentes no mercado.
Imagem - Detalhamento com os selos de verificação

```xml
<Modal closeButton="true">
  <HeaderImage alt="Chocolate e cacau">
    <Tags>
      <Tag>CACAU NATIVO</Tag>
      <Tag>BIODIVERSIDADE</Tag>
      <Tag>COMÉRCIO JUSTO</Tag>
    </Tags>
  </HeaderImage>

  <KeyMetricsGrid columns="3">
    <MetricCard highlight="true">
      <Value>16.2%</Value>
      <Unit>ao ano</Unit>
      <Label>Retorno</Label>
    </MetricCard>

    <MetricCard>
      <Value>24</Value>
      <Unit>meses</Unit>
      <Label>Prazo</Label>
    </MetricCard>

    <MetricCard>
      <Value>91</Value>
      <Unit>/ 100</Unit>
      <Label>ESG Score</Label>
    </MetricCard>
  </KeyMetricsGrid>

  <Section title="COMPOSIÇÃO ESG">
    <ProgressBar label="Ambiental" value="96" max="100" color="green" />
    <ProgressBar label="Social" value="92" max="100" color="purple" />
    <ProgressBar label="Governança" value="85" max="100" color="orange" />
  </Section>

  <Section title="IMPACTO ACUMULADO">
    <LineChart timespan="Fev - Jun" color="green" />
  </Section>

  <Section title="SELOS DE VERIFICAÇÃO">
    <Grid columns="2">
      <VerificationBadge icon="escudo">
        <Title>Zero Desmatamento</Title>
        <Subtitle>PRODES/INPE monitorado</Subtitle>
      </VerificationBadge>

      <VerificationBadge icon="check-circulo">
        <Title>Cadeia Auditada</Title>
        <Subtitle>Origem rastreada</Subtitle>
      </VerificationBadge>

      <VerificationBadge icon="grafico-linha">
        <Title>Score BioRaiz</Title>
        <Subtitle>91/100</Subtitle>
      </VerificationBadge>

      <VerificationBadge icon="medalha">
        <Title>Impacto Certificado</Title>
        <Subtitle>Relatório trimestral</Subtitle>
      </VerificationBadge>
    </Grid>
  </Section>

  <Actions>
    <Button type="primary" color="orange">INVESTIR AGORA →</Button>
    <Button type="secondary" icon="download">RELATÓRIO ESG COMPLETO</Button>
  </Actions>
</Modal>
```
Imagem - Exemplos de Selos de Impacto Ambiental

```xml
<VerificationBadgesCatalog>
  <Section title="SELOS AMBIENTAIS">
    <Grid columns="4">
      <BadgeCard icon="globo-folha">
        <Title>ISO 14001</Title>
        <Description>Gestão ambiental e redução de impactos ecológicos</Description>
      </BadgeCard>

      <BadgeCard icon="tres-folhas">
        <Title>Selo Verde</Title>
        <Description>Reconhece práticas empresariais sustentáveis</Description>
      </BadgeCard>

      <BadgeCard icon="carbono-o2">
        <Title>Carbono Neutro</Title>
        <Description>Compensação total das emissões de C₂</Description>
      </BadgeCard>

      <BadgeCard icon="folhas-carvalho">
        <Title>LEED</Title>
        <Description>Construções com alta eficiência energética e ambiental</Description>
      </BadgeCard>
    </Grid>
  </Section>

  <Section title="SELOS SOCIAIS E ÉTICOS">
    <Grid columns="4">
      <BadgeCard icon="b-corp">
        <Title>B Corp</Title>
        <Description>Empresas que equilibram lucro e propósito social</Description>
      </BadgeCard>

      <BadgeCard icon="fair-trade">
        <Title>Fair Trade</Title>
        <Description>Comércio justo e respeito aos produtores locais</Description>
      </BadgeCard>

      <BadgeCard icon="amiga-da-crianca">
        <Title>Empresa Amiga da Criança</Title>
        <Description>Combate ao trabalho infantil e apoio à infância</Description>
      </BadgeCard>

      <BadgeCard icon="ethos">
        <Title>Ethos</Title>
        <Description>Compromisso com ética, transparência e responsabilidade social</Description>
      </BadgeCard>
    </Grid>
  </Section>

  <Section title="SELOS DE GOVERNANÇA E TRANSPARÊNCIA">
    <Grid columns="4">
      <BadgeCard icon="organico-brasil">
        <Title>Orgânico Brasil</Title>
        <Description>Produção sem agrotóxicos e transgênicos</Description>
      </BadgeCard>

      <BadgeCard icon="gri">
        <Title>GRI</Title>
        <Description>Padrão internacional de relatórios de sustentabilidade</Description>
      </BadgeCard>

      <BadgeCard icon="pacto-global-onu">
        <Title>Pacto Global da ONU</Title>
        <Description>Compromisso com direitos humanos, meio ambiente</Description>
      </BadgeCard>

      <BadgeCard icon="rainforest-alliance">
        <Title>Rainforest Alliance</Title>
        <Description>Respeito à biodiversidade e ao bem-estar dos trabalhadores</Description>
      </BadgeCard>
    </Grid>
  </Section>
</VerificationBadgesCatalog>
```

--- 

### Acompanhamento de métricas ESG

Feedback:

A plataforma poderia ter o acompanhamento de ESG e métricas da
empresa com o tempo.

Insight:

Vamos estudar a possibilidade de mapeamento de métricas financeiras
e ESG da empresa demonstrar a evolução positiva ou negativa dos
dados para o investidor.

Imagem - Tela de métricas atual (visualização geral do usuário)

```xml
<Dashboard>
  <TopNavigation activeTab="INVESTIDOR">
    <Tab>VISUALIZAR COMO</Tab>
    <Tab active="true">INVESTIDOR</Tab>
    <Tab>PRODUTOR</Tab>
  </TopNavigation>

  <HeaderMetricsBar>
    <MetricSummary icon="arvore" value="94.320 ha" label="Floresta Preservada" change="+2.124 este mês" color="green" />
    <MetricSummary icon="pessoas" value="1.847" label="Famílias Beneficiadas" change="+47 este mês" color="purple" />
    <MetricSummary icon="folha/co2" value="12.450 t" label="CO2 Evitado" change="+120t este mês" color="orange" />
  </HeaderMetricsBar>

  <MetricsGrid columns="4">
    <MetricCard icon="arvore" value="94.320" unit="ha" label="Floresta Preservada" />
    <MetricCard icon="pessoas" value="1.847" unit="Fam." label="Famílias Beneficiadas" />
    <MetricCard icon="folha" value="12.450" unit="ton." label="CO2 Evitado" />
    <MetricCard icon="globo" value="6" unit="Projetos" label="Projetos Ativos" />
  </MetricsGrid>

  <ChartSection title="HECTARES PRESERVADOS - EVOLUÇÃO MENSAL" badge="+18% no período">
    <Subtitle>Crescimento consistente desde janeiro</Subtitle>

    <LineChart timespan="Jan - Jun">
      <DataPoint month="Jan" value="82.200 ha" selected="true" />
      <DataPoint month="Fev" />
      <DataPoint month="Mar" />
      <DataPoint month="Abr" />
      <DataPoint month="Mai" />
      <DataPoint month="Jun" />
    </LineChart>
  </ChartSection>

  <Grid columns="2">
    <ChartCard title="FAMÍLIAS BENEFICIADAS - EVOLUÇÃO">
      <Subtitle>Crescimento mensal</Subtitle>
      <BarChart timespan="Jan - Jun" highlight="Jun" color="purple" />
    </ChartCard>

    <ChartCard title="CO2 EVITADO - TONELADAS">
      <Subtitle>Carbono mantido na floresta</Subtitle>

      <AreaChart timespan="Jan - Jun" color="orange" />
    </ChartCard>
  </Grid>

  <Footer>
    <ActionLink icon="download">BAIXAR RELATÓRIO ESG COMPLETO - JUN 2026</ActionLink>
  </Footer>
</Dashboard>
```

--- 

### Detalhamento do Investimento

Feedback:

Na parte de detalhamento do investimento, é importante haver seções
diversas sobre a operação e a empresa responsável.

Insight:

Vamos adicionar as seguintes abas na página do investimento:
operação, empresa, empreendedores, finanças, documentos e
investidores.

Imagem - Novas seções de informações do projeto

```xml
<ProjectDetailView>
  <Tabs active="Operação">
    <Tab active="true">Operação</Tab>
    <Tab>Empresa</Tab>
    <Tab>Empreendedores</Tab>
    <Tab>Finanças</Tab>
    <Tab>Documentos</Tab>
    <Tab>Investidores</Tab>
  </Tabs>

  <TabContent>
    <Section title="Sobre a Operação">
      <Paragraph>
        O investimento em Açaí Premium Pará visa expandir a capacidade de processamento e exportação de açaí orgânico certificado. Os recursos serão utilizados para modernização de equipamentos, ampliação da área de cultivo e obtenção de novas certificações internacionais.
      </Paragraph>
    </Section>

    <Section title="Estrutura">
      <Paragraph>
        Os investidores receberão pagamentos mensais compostos por amortização e juros, com garantia real sobre os equipamentos adquiridos e contrato de compra e venda com tradings internacionais.
      </Paragraph>
    </Section>
  </TabContent>
</ProjectDetailView>
```

--- 

### Documentos Sensíveis

Feedback:

Os documentos sensíveis do projeto não podem ser visíveis
publicamente para qualquer pessoa. Deve haver uma área logada onde
apenas o usuário que demonstrar interesse vai poder visualizar os
documentos. Outro ponto é que também não deve ser possível o
copia/cola das informações, nem o download do PDF. A visualização
deve ser estritamente pela plataforma.

Insight:

Vamos desabilitar o download de documentos e criar a área logada da
plataforma. Para visualizar um documento, o usuário deve
obrigatoriamente estar logado e solicitar acesso por parte do
responsável da empresa.

Imagem - Visualização de documentos do projeto

```xml
<ProjectDetailView>
  <Tabs active="Documentos">
    <Tab>Operação</Tab>
    <Tab>Empresa</Tab>
    <Tab>Empreendedores</Tab>
    <Tab>Finanças</Tab>
    <Tab active="true">Documentos</Tab>
    <Tab>Investidores</Tab>
  </Tabs>

  <TabContent>
    <DocumentList>
      <DocumentCard icon="pdf" externalLink="true">
        <Title>Apresentação Institucional</Title>
        <Format>PDF</Format>
      </DocumentCard>

      <DocumentCard icon="pdf" externalLink="true">
        <Title>Demonstrações Financeiras 2024</Title>
        <Format>PDF</Format>
      </DocumentCard>

      <DocumentCard icon="pdf" externalLink="true">
        <Title>Contrato de Investimento (Minuta)</Title>
        <Format>PDF</Format>
      </DocumentCard>

      <DocumentCard icon="pdf" externalLink="true">
        <Title>Laudo de Avaliação</Title>
        <Format>PDF</Format>
      </DocumentCard>
    </DocumentList>
  </TabContent>
</ProjectDetailView>
```

--- 

### 

### Parceiros

Opiniao Amazônia - https://opiniaoamazonia.com.br/

Feedback:

Em conversas com possíveis parceiros, conseguimos encaminhar uma
parceria com um site de notícias focado em economia e geopolítica da
amazônia. O dono do site gostaria de integrar a plataforma de
investimentos ao seu blog, aproveitando o alcance para a publicidade
dos projetos de investimento.

Insight:

Pretendemos construir uma seção no site parceiro para investimentos
através da nossa plataforma.
Imagem - Protótipo de Integração com site parceiro

--- 

### Projeto Sementes do Território

Feedback:

Em conversa com parceiros que têm interesse na divulgação dos
projetos, apareceu este projeto cuja área de atuação se dá fora da
região amazônica. Atualmente, está sendo administrado pela empresa
SYNERGY PARTNERS LTDA com sede no estado da Bahia.

Insight:

Vamos analisar a possibilidade de incluir empresas/projetos situados em
outras regiões para além da Amazônia.
Imagem - Capa de Apresentação do Projeto Sementes do Território

--- 

### Tema Claro/Escuro

Feedback:

As telas estão bonitas, porém o tema escuro dificultou a visualização em
alguns aspectos.

Insight:

Vamos criar o tema claro da aplicação.