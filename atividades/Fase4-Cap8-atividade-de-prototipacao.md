# ATIVIDADE DE PROTOTIPAÇÃO (Startup One)

## 1. Em uma linha, descreva o seu projeto de startup, incluindo o problema e a solução:

Uma plataforma digital que conecta investidores a produtores da bioeconomia amazônica, superando o isolamento financeiro desses negócios por meio de um sistema inteligente de matchmaking de investimentos e relatórios de auditoria socioambiental que garantem a confiabilidade do aporte.

## 2. Coloque aqui os prints do seu protótipo e comentários, se julgar necessário.

### Matriz de Telas

| Id | Visão | Contexto | Tela | Caminho |
| :--- | :--- | :--- | :--- | :--- |
| T01 | Investidor | Descoberta | Descoberta Inteligente (Etapa 1) - Tese de Investimento | `/public/discovery/thesis` |
| T02 | Investidor | Descoberta | Descoberta Inteligente (Etapa 2) - Volume de Capital | `/public/discovery/capital` |
| T03 | Investidor | Descoberta | Descoberta Inteligente (Etapa 3) - Setores de Interesse | `/public/discovery/sectors` |
| T04 | Investidor | Descoberta | Descoberta Inteligente (Etapa 4) - Perfil de Risco | `/public/discovery/risk` |
| T05 | Investidor | Descoberta | Descoberta Inteligente (Etapa 5) - Impacto | `/public/discovery/impact` |
| T06 | Investidor | Descoberta | Descoberta Inteligente - Resultados | `/public/discovery/result` |
| T07 | Investidor | Projetos | Marketplace de Projetos | `/public/projects` |
| T08 | Investidor | Dashboard | Dashboard Principal | `/private/investor/dashboard` |
| T09 | Investidor | Portfolio | Portfolio de Investimentos | `/private/investor/portfolio` |
| T10 | Investidor | Impacto ESG | Relatório Impacto ESG | `/private/investor/esg/report` |
| T11 | Investidor | Auditoria | Visão Geral | `/private/investor/audit/overview`  |
| T12 | Investidor | Auditoria | Linha do tempo | `/private/investor/audit/timeline`   |
| T13 | Investidor | Auditoria | Relatórios | `/private/investor/audit/reports`  |
| T14 | Produtor | Formulário | Cadastro (Etapa 0) - Informações básicas | `/public/producer/signup/basic` | ❌ Ausente nesta prototipação |
| T15 | Produtor | Formulário | Cadastro (Etapa 1) - Seu Negócio | `/public/producer/signup/business` |
| T16 | Produtor | Formulário | Cadastro (Etapa 2) - Sua Produção | `/public/producer/signup/production` |
| T17 | Produtor | Formulário | Cadastro (Etapa 3) - Fotos e Evidências | `/public/producer/signup/evidence` |
| T18 | Produtor | Formulário | Cadastro (Etapa 4) - Meta de Financiamento | `/public/producer/signup/financial` |

---

⚠️ A tela T14 - Cadastro (Etapa 0) - Informações básicas está ausente nesta prototipação, pois foi idealizada posteriormente.

---

Telas:

### `T01` - Descoberta Inteligente (Etapa 1) - Tese de Investimento

```xml
<Screen name="Descoberta Inteligente - Passo 1">
  <Sidebar activeItem="Descoberta">
    <Brand name="BioRaiz" subtitle="BIOECONOMIA AMAZÔNICA" />
    <Navigation>
      <NavItem icon="dashboard">Dashboard</NavItem>
      <NavItem icon="descoberta" active="true">Descoberta</NavItem>
      <NavItem icon="projetos">Projetos</NavItem>
      <NavItem icon="portfolio">Portfólio</NavItem>
      <NavItem icon="impacto">Impacto ESG</NavItem>
      <NavItem icon="auditoria">Auditoria</NavItem>
      <NavItem icon="relatorios">Relatórios</NavItem>
    </Navigation>
    <UserProfile name="Grupo Floresta" role="Fundo ESG — Série B" />
  </Sidebar>

  <MainContent>
    <Header>
      <ViewToggle activeTab="INVESTIDOR">
        <Tab>VISUALIZAR COMO:</Tab>
        <Tab active="true">INVESTIDOR</Tab>
        <Tab>PRODUTOR</Tab>
      </ViewToggle>
      <MetricsSummaryBar>
        <Metric icon="arvore" value="94.320 ha" label="Floresta Preservada" change="+2.520 este mês" color="green" />
        <Metric icon="pessoas" value="1.847" label="Beneficiadas" change="+87 este mês" color="purple" />
        <Metric icon="co2" value="12.450 t CO2" label="Carbono Evitado" change="+750t este mês" color="yellow" />
      </MetricsSummaryBar>
    </Header>

    <WizardStep currentStep="1" totalSteps="5" title="DESCOBERTA INTELIGENTE">
      <ProgressBar value="20" max="100" />
      
      <StepContent>
        <Title>Qual é a sua tese de investimento?</Title>
        <Subtitle>Isso vai direcionar sua curadoria personalizada de projetos.</Subtitle>

        <OptionGrid columns="2">
          <OptionCard>
            <Icon name="folha" />
            <Title>Impacto Primeiro</Title>
            <Description>Priorizo o máximo de preservação e benefício social, com retorno secundário</Description>
          </OptionCard>

          <OptionCard>
            <Icon name="grafico-alta" />
            <Title>Retorno Primeiro</Title>
            <Description>Busco a melhor rentabilidade com responsabilidade ambiental</Description>
          </OptionCard>

          <OptionCard>
            <Icon name="pessoas" />
            <Title>Foco Social</Title>
            <Description>O que mais importa é o número de famílias e comunidades beneficiadas</Description>
          </OptionCard>

          <OptionCard>
            <Icon name="balanca" />
            <Title>ESG Balanceado</Title>
            <Description>Busco equilíbrio ideal entre retorno financeiro e impacto sustentável</Description>
          </OptionCard>
        </OptionGrid>
      </StepContent>

      <FooterNavigation>
        <Button type="secondary">← VOLTAR</Button>
        <Button type="primary">PRÓXIMO →</Button>
      </FooterNavigation>
    </WizardStep>
  </MainContent>
</Screen>
```

---

### `T02` - Descoberta Inteligente (Etapa 2) - Volume de Capital 

```xml
<Screen name="Descoberta Inteligente - Passo 2">
  <Sidebar activeItem="Descoberta">
    <Brand name="BioRaiz" subtitle="INVESTIMENTO SUSTENTÁVEL" />
    <Navigation>
      <NavItem icon="dashboard">Dashboard</NavItem>
      <NavItem icon="descoberta" active="true">Descoberta</NavItem>
      <NavItem icon="projetos">Projetos</NavItem>
      <NavItem icon="portfolio">Portfólio</NavItem>
      <NavItem icon="impacto">Impacto ESG</NavItem>
      <NavItem icon="auditoria">Auditoria</NavItem>
      <NavItem icon="configuracoes">Configurações</NavItem>
    </Navigation>
    <UserProfile name="Grupo Flamboyant" role="Investidor Institucional" />
  </Sidebar>

  <MainContent>
    <Header>
      <ViewToggle activeTab="INVESTIDOR">
        <Tab>VISUALIZAR COMO</Tab>
        <Tab active="true">INVESTIDOR</Tab>
        <Tab>PRODUTOR</Tab>
      </ViewToggle>
      <MetricsSummaryBar>
        <Metric icon="arvore" value="94.320 ha" label="Floresta Preservada" change="+2.124 ha este mês" color="green" />
        <Metric icon="pessoas" value="1.847" label="Famílias Beneficiadas" change="+47 este mês" color="purple" />
        <Metric icon="co2" value="12.450 t" label="CO2 Evitado" change="+120t este mês" color="orange" />
      </MetricsSummaryBar>
    </Header>

    <WizardStep currentStep="2" totalSteps="5" title="DESCOBERTA INTELIGENTE">
      <ProgressBar value="40" max="100" />
      
      <StepContent>
        <Title>Qual o volume de capital disponível?</Title>
        <Subtitle>Isso nos ajuda a filtrar projetos com suporte e liquidez adequados.</Subtitle>

        <OptionGrid columns="2">
          <OptionCard selected="true">
            <Value>Até R$ 50k</Value>
            <Description>INVESTIDOR ANJO</Description>
          </OptionCard>

          <OptionCard>
            <Value>R$ 50k - 200k</Value>
            <Description>FAMILY OFFICE</Description>
          </OptionCard>

          <OptionCard>
            <Value>R$ 200k - 1M</Value>
            <Description>FUNDO INSTITUCIONAL</Description>
          </OptionCard>

          <OptionCard>
            <Value>Acima de R$ 1M</Value>
            <Description>CAPITAL ESTRATÉGICO</Description>
          </OptionCard>
        </OptionGrid>
      </StepContent>

      <FooterNavigation>
        <Button type="primary">Próximo →</Button>
      </FooterNavigation>
    </WizardStep>
  </MainContent>
</Screen>
```

---

### `T03` - Descoberta Inteligente (Etapa 3) - Setores de Interesse

```xml
<Screen name="Descoberta Inteligente - Passo 3">
  <Sidebar activeItem="Descoberta">
    <Brand name="BioRaiz" subtitle="BIOECONOMIA AMAZÔNICA" />
    <Navigation>
      <NavItem icon="dashboard">Dashboard</NavItem>
      <NavItem icon="descoberta" active="true">Descoberta</NavItem>
      <NavItem icon="projetos">Projetos</NavItem>
      <NavItem icon="portfolio">Portfólio</NavItem>
      <NavItem icon="impacto">Impacto ESG</NavItem>
      <NavItem icon="auditoria">Auditoria</NavItem>
      <NavItem icon="relatorios">Relatórios</NavItem>
    </Navigation>
    <UserProfile name="Grupo Floresta" role="Fundo ESG — Série B" />
  </Sidebar>

  <MainContent>
    <Header>
      <ViewToggle activeTab="INVESTIDOR">
        <Tab>VISUALIZAR COMO:</Tab>
        <Tab active="true">INVESTIDOR</Tab>
        <Tab>PRODUTOR</Tab>
      </ViewToggle>
      <MetricsSummaryBar>
        <Metric icon="arvore" value="94.320 ha" label="Floresta Preservada" change="+2.520 este mês" color="green" />
        <Metric icon="pessoas" value="1.847" label="Beneficiadas" change="+87 este mês" color="purple" />
        <Metric icon="co2" value="12.450 t CO2" label="Carbono Evitado" change="+750t este mês" color="yellow" />
      </MetricsSummaryBar>
    </Header>

    <WizardStep currentStep="3" totalSteps="5" title="DESCOBERTA INTELIGENTE">
      <ProgressBar value="60" max="100" />
      
      <StepContent>
        <Title>Quais setores da bioeconomia te interessam?</Title>
        <Subtitle>Selecione um ou mais. Você pode mudar depois.</Subtitle>

        <OptionGrid columns="3">
          <OptionCard>
            <Icon name="laranja" />
            <Title>Alimentos</Title>
          </OptionCard>

          <OptionCard>
            <Icon name="flor" />
            <Title>Cosméticos</Title>
          </OptionCard>

          <OptionCard>
            <Icon name="gota" />
            <Title>Óleos Vegetais</Title>
          </OptionCard>

          <OptionCard>
            <Icon name="arvore" />
            <Title>Madeira Cert.</Title>
          </OptionCard>

          <OptionCard>
            <Icon name="castanha" />
            <Title>Castanha</Title>
          </OptionCard>

          <OptionCard>
            <Icon name="globo" />
            <Title>Todos os Setores</Title>
          </OptionCard>
        </OptionGrid>
      </StepContent>

      <FooterNavigation>
        <Button type="secondary">← VOLTAR</Button>
        <Button type="primary">PRÓXIMO →</Button>
      </FooterNavigation>
    </WizardStep>
  </MainContent>
</Screen>
```

---

### `T04` - Descoberta Inteligente (Etapa 4) - Perfil de Risco

```xml
<Screen name="Descoberta Inteligente - Passo 4">
  <Sidebar activeItem="Descoberta">
    <Brand name="BioRaiz" subtitle="INVESTIMENTO SUSTENTÁVEL" />
    <Navigation>
      <NavItem icon="dashboard">Dashboard</NavItem>
      <NavItem icon="descoberta" active="true">Descoberta</NavItem>
      <NavItem icon="projetos">Projetos</NavItem>
      <NavItem icon="portfolio">Portfólio</NavItem>
      <NavItem icon="impacto">Impacto ESG</NavItem>
      <NavItem icon="auditoria">Auditoria</NavItem>
      <NavItem icon="configuracoes">Configurações</NavItem>
    </Navigation>
    <UserProfile name="Grupo Flamboyant" role="Investidor Institucional" />
  </Sidebar>

  <MainContent>
    <Header>
      <ViewToggle activeTab="INVESTIDOR">
        <Tab>VISUALIZAR COMO</Tab>
        <Tab active="true">INVESTIDOR</Tab>
        <Tab>PRODUTOR</Tab>
      </ViewToggle>
      <MetricsSummaryBar>
        <Metric icon="arvore" value="94.320 ha" label="Floresta Preservada" change="+2.124 ha este mês" color="green" />
        <Metric icon="pessoas" value="1.847" label="Famílias Beneficiadas" change="+47 este mês" color="purple" />
        <Metric icon="co2" value="12.450 t" label="CO2 Evitado" change="+120t este mês" color="orange" />
      </MetricsSummaryBar>
    </Header>

    <WizardStep currentStep="3" totalSteps="5" title="DESCOBERTA INTELIGENTE">
      <ProgressBar value="60" max="100" />
      
      <StepContent>
        <Title>Qual é o seu perfil de risco?</Title>
        <Subtitle>Isso calibra a busca para selecionar a taxa de retorno e a segurança do projeto.</Subtitle>

        <OptionList>
          <OptionCard>
            <Header>
              <Title>Conservador</Title>
              <Badge color="green">Baixo Risco</Badge>
            </Header>
            <ProgressBar value="30" max="100" color="green" />
            <Description>Prioriza estabilidade e baixa volatilidade. Procura projetos consolidados, risco baixo, fluxo estável.</Description>
          </OptionCard>

          <OptionCard>
            <Header>
              <Title>Moderado</Title>
              <Badge color="green">Médio Risco</Badge>
            </Header>
            <ProgressBar value="60" max="100" color="green" />
            <Description>Busca equilíbrio entre retorno e segurança. Mix de projetos em crescimento com boa solidez.</Description>
          </OptionCard>

          <OptionCard>
            <Header>
              <Title>Arrojado</Title>
              <Badge color="green">Alto Risco</Badge>
            </Header>
            <ProgressBar value="90" max="100" color="green" />
            <Description>Aceita mais risco em busca de maior rentabilidade. Projetos de alto crescimento com maior volatilidade.</Description>
          </OptionCard>
        </OptionList>
      </StepContent>

      <FooterNavigation>
        <Button type="primary">Próximo →</Button>
      </FooterNavigation>
    </WizardStep>
  </MainContent>
</Screen>
```

---

### `T05` - Descoberta Inteligente (Etapa 5) - Impacto Desejado

```xml
<Screen name="Descoberta Inteligente - Passo 5">
  <Sidebar activeItem="Descoberta">
    <Brand name="BioRaiz" subtitle="BIOECONOMIA AMAZÔNICA" />
    <Navigation>
      <NavItem icon="dashboard">Dashboard</NavItem>
      <NavItem icon="descoberta" active="true">Descoberta</NavItem>
      <NavItem icon="projetos">Projetos</NavItem>
      <NavItem icon="portfolio">Portfólio</NavItem>
      <NavItem icon="impacto">Impacto ESG</NavItem>
      <NavItem icon="auditoria">Auditoria</NavItem>
      <NavItem icon="relatorios">Relatórios</NavItem>
    </Navigation>
    <UserProfile name="Grupo Floresta" role="Fundo ESG — Série B" />
  </Sidebar>

  <MainContent>
    <Header>
      <ViewToggle activeTab="INVESTIDOR">
        <Tab>VISUALIZAR COMO:</Tab>
        <Tab active="true">INVESTIDOR</Tab>
        <Tab>PRODUTOR</Tab>
      </ViewToggle>
      <MetricsSummaryBar>
        <Metric icon="arvore" value="94.320 ha" label="Floresta Preservada" change="+2.520 este mês" color="green" />
        <Metric icon="pessoas" value="1.847" label="Beneficiadas" change="+87 este mês" color="purple" />
        <Metric icon="co2" value="12.450 t CO2" label="Carbono Evitado" change="+750t este mês" color="yellow" />
      </MetricsSummaryBar>
    </Header>

    <WizardStep currentStep="5" totalSteps="5" title="DESCOBERTA INTELIGENTE">
      <ProgressBar value="100" max="100" />
      
      <StepContent>
        <Title>Que tipo de impacto você quer gerar?</Title>
        <Subtitle>Selecione todos que se alinham à sua visão. Pode pular se preferir.</Subtitle>

        <TagCloud>
          <Tag icon="feminino">Empoderamento Feminino</Tag>
          <Tag icon="pena">Povos Indígenas</Tag>
          <Tag icon="nuvem">Fixação de Carbono</Tag>
          <Tag icon="muda">Reflorestamento</Tag>
          <Tag icon="planta">Soberania Alimentar</Tag>
          <Tag icon="lampada">Geração de Renda</Tag>
          <Tag icon="borboleta">Biodiversidade</Tag>
          <Tag icon="gota">Proteção de Mananciais</Tag>
        </TagCloud>
      </StepContent>

      <FooterNavigation>
        <Button type="secondary">← VOLTAR</Button>
        <ActionGroup>
          <LinkButton>pular este passo →</LinkButton>
          <Button type="primary" color="purple">VER MEUS MATCHES ✨</Button>
        </ActionGroup>
      </FooterNavigation>
    </WizardStep>
  </MainContent>
</Screen>
```

---

### `T06` - Descoberta Inteligente - Resultados 

```xml
<Screen name="Projetos Encontrados - Matching">
  <Sidebar activeItem="Descoberta">
    <Brand name="BioRaiz" subtitle="INVESTIMENTO SUSTENTÁVEL" />
    <Navigation>
      <NavItem icon="dashboard">Dashboard</NavItem>
      <NavItem icon="descoberta" active="true">Descoberta</NavItem>
      <NavItem icon="projetos">Projetos</NavItem>
      <NavItem icon="portfolio">Portfólio</NavItem>
      <NavItem icon="impacto">Impacto ESG</NavItem>
      <NavItem icon="auditoria">Auditoria</NavItem>
      <NavItem icon="configuracoes">Configurações</NavItem>
    </Navigation>
    <UserProfile name="Grupo Flamboyant" role="Investidor Institucional" />
  </Sidebar>

  <MainContent>
    <Header>
      <ViewToggle activeTab="INVESTIDOR">
        <Tab>VISUALIZAR COMO</Tab>
        <Tab active="true">INVESTIDOR</Tab>
        <Tab>PRODUTOR</Tab>
      </ViewToggle>
      <MetricsSummaryBar>
        <Metric icon="arvore" value="94.320 ha" label="Floresta Preservada" change="+2.124 ha este mês" color="green" />
        <Metric icon="pessoas" value="1.847" label="Famílias Beneficiadas" change="+47 este mês" color="purple" />
        <Metric icon="co2" value="12.450 t" label="CO2 Evitado" change="+120t este mês" color="orange" />
      </MetricsSummaryBar>
    </Header>

    <SectionHeader>
      <Breadcrumb>← Voltar ao questionário</Breadcrumb>
      <Title>6 projetos encontrados para sua tese</Title>
      <Subtitle>Mostrando os de maior alinhamento</Subtitle>
      
      <FilterBar>
        <FilterPill active="true">Todos (6)</FilterPill>
        <FilterPill>Garantia Real</FilterPill>
        <FilterPill>Selo BioRaiz</FilterPill>
        <FilterPill>Auditados</FilterPill>
        <SortDropdown default="Ordenar" />
      </FilterBar>
    </SectionHeader>

    <ProjectGrid columns="3">
      <ProjectCard matchPercentage="82%">
        <CardImage src="chocolate.png" tag="CACAU NATIVO" />
        <Title>Chocolates Nativos do Pará</Title>
        <ProgressTrack label="Captado" percent="68%" />
        <ProgressTrack label="Objetivo" percent="100%" />
        <MetricsRow>
          <Metric label="Retorno" value="16.2%" />
          <Metric label="Prazo" value="24 mes" />
          <Metric label="ESG" value="91/100" />
        </MetricsRow>
        <Button type="primary" color="orange">VER DETALHES →</Button>
      </ProjectCard>

      <ProjectCard matchPercentage="82%">
        <CardImage src="pao.png" tag="AGRICULTURA FAMILIAR" />
        <Title>Castanha Solidária Xingu</Title>
        <ProgressTrack label="Captado" percent="68%" />
        <ProgressTrack label="Objetivo" percent="100%" />
        <MetricsRow>
          <Metric label="Retorno" value="15.8%" />
          <Metric label="Prazo" value="18 mes" />
          <Metric label="ESG" value="88/100" />
        </MetricsRow>
        <Button type="primary" color="orange">VER DETALHES →</Button>
      </ProjectCard>

      <ProjectCard matchPercentage="79%">
        <CardImage src="cosmeticos.png" tag="COSMÉTICOS" />
        <Title>EcorRaiz Viva Dermocosméticos</Title>
        <ProgressTrack label="Captado" percent="84%" />
        <ProgressTrack label="Objetivo" percent="100%" />
        <MetricsRow>
          <Metric label="Retorno" value="17.5%" />
          <Metric label="Prazo" value="36 mes" />
          <Metric label="ESG" value="94/100" />
        </MetricsRow>
        <Button type="primary" color="orange">VER DETALHES →</Button>
      </ProjectCard>
    </ProjectGrid>
  </MainContent>
</Screen>
```

---

### `T07` - Marketplace de Projetos

```xml
<Screen name="Marketplace de Projetos">
  <Sidebar activeItem="Projetos">
    <Brand name="BioRaiz" subtitle="INVESTIMENTO SUSTENTÁVEL" />
    <Navigation>
      <NavItem icon="dashboard">Dashboard</NavItem>
      <NavItem icon="descoberta">Descoberta</NavItem>
      <NavItem icon="projetos" active="true">Projetos</NavItem>
      <NavItem icon="portfolio">Portfólio</NavItem>
      <NavItem icon="impacto">Impacto ESG</NavItem>
      <NavItem icon="auditoria">Auditoria</NavItem>
      <NavItem icon="configuracoes">Configurações</NavItem>
    </Navigation>
    <UserProfile name="Grupo Flamboyant" role="Investidor Institucional" />
  </Sidebar>

  <MainContent>
    <Header>
      <Title>Navegue pelos Projetos</Title>
      <Subtitle>Explore oportunidades de investimento com impacto socioambiental</Subtitle>
      <ViewToggle activeTab="INVESTIDOR">
        <Tab>VISUALIZAR COMO</Tab>
        <Tab active="true">INVESTIDOR</Tab>
        <Tab>PRODUTOR</Tab>
      </ViewToggle>
      <Button type="secondary" icon="download">Exportar Relatório</Button>
    </Header>

    <MetricsSummaryBar>
      <Metric icon="arvore" value="94.320 ha" label="Floresta Preservada" change="+2.124 ha este mês" color="green" />
      <Metric icon="pessoas" value="1.847" label="Famílias Beneficiadas" change="+47 este mês" color="purple" />
      <Metric icon="co2" value="12.450 t" label="CO2 Evitado" change="+120t este mês" color="orange" />
    </MetricsSummaryBar>

    <FilterBar>
      <FilterTab active="true">Todos (12)</FilterTab>
      <FilterTab>Alimentos</FilterTab>
      <FilterTab>Cosméticos</FilterTab>
      <FilterTab>Florestal</FilterTab>
      <FilterTab>Moda</FilterTab>
      <SearchInput placeholder="Buscar por nome ou região..." />
    </FilterBar>

    <ProjectGrid columns="3">
      <ProjectCard>
        <CardImage src="acai.png" tag="AÇAÍ ORGÂNICO" status="Em captação" />
        <Title>Cooperativa de Açaí do Mujuú</Title>
        <ProgressBar value="82" max="100" color="orange" />
        <MetricsRow>
          <Metric label="Retorno" value="14.8%" />
          <Metric label="Prazo" value="24 mes" />
          <Metric label="ESG" value="91/100" />
        </MetricsRow>
      </ProjectCard>

      <ProjectCard>
        <CardImage src="cacau.png" tag="CACAU NATIVO" status="Em captação" />
        <Title>Chocolates Nativos do Pará</Title>
        <ProgressBar value="68" max="100" color="orange" />
        <MetricsRow>
          <Metric label="Retorno" value="16.2%" />
          <Metric label="Prazo" value="24 mes" />
          <Metric label="ESG" value="94/100" />
        </MetricsRow>
      </ProjectCard>

      <ProjectCard>
        <CardImage src="cosmeticos.png" tag="COSMÉTICOS" status="Em captação" />
        <Title>Arariba Viva Dermocosméticos</Title>
        <ProgressBar value="84" max="100" color="orange" />
        <MetricsRow>
          <Metric label="Retorno" value="17.5%" />
          <Metric label="Prazo" value="36 mes" />
          <Metric label="ESG" value="96/100" />
        </MetricsRow>
      </ProjectCard>

      <ProjectCard>
        <CardImage src="predio.png" tag="INFRAESTRUTURA" status="Fase Final" />
        <Title>Centro Logístico BioRaiz</Title>
        <ProgressBar value="95" max="100" color="orange" />
        <MetricsRow>
          <Metric label="Retorno" value="13.5%" />
          <Metric label="Prazo" value="48 mes" />
          <Metric label="ESG" value="89/100" />
        </MetricsRow>
      </ProjectCard>

      <ProjectCard>
        <CardImage src="pao.png" tag="ALIMENTOS" status="Em captação" />
        <Title>Castanha Solidária Xingu</Title>
        <ProgressBar value="52" max="100" color="orange" />
        <MetricsRow>
          <Metric label="Retorno" value="15.8%" />
          <Metric label="Prazo" value="18 mes" />
          <Metric label="ESG" value="88/100" />
        </MetricsRow>
      </ProjectCard>

      <ProjectCard>
        <CardImage src="cacto.png" tag="FLORESTAL" status="Em captação" />
        <Title>Reflorestamento Cactáceas</Title>
        <ProgressBar value="40" max="100" color="orange" />
        <MetricsRow>
          <Metric label="Retorno" value="18.0%" />
          <Metric label="Prazo" value="60 mes" />
          <Metric label="ESG" value="98/100" />
        </MetricsRow>
      </ProjectCard>
    </ProjectGrid>
  </MainContent>
</Screen>
```

---

### `T08` - Visão Geral do Dashboard

```xml
<Screen name="Dashboard - Visão Geral">
  <Sidebar activeItem="Dashboard">
    <Brand name="BioRaiz" subtitle="INVESTIMENTO SUSTENTÁVEL" />
    <Navigation>
      <NavItem icon="dashboard" active="true">Dashboard</NavItem>
      <NavItem icon="descoberta">Descoberta</NavItem>
      <NavItem icon="projetos">Projetos</NavItem>
      <NavItem icon="portfolio">Portfólio</NavItem>
      <NavItem icon="impacto">Impacto ESG</NavItem>
      <NavItem icon="auditoria">Auditoria</NavItem>
      <NavItem icon="configuracoes">Configurações</NavItem>
    </Navigation>
    <UserProfile name="Grupo Flamboyant" role="Investidor Institucional" />
  </Sidebar>

  <MainContent>
    <Header>
      <Title>Visão Geral</Title>
      <Subtitle>Acompanhe o impacto e desempenho da sua carteira</Subtitle>
      <ViewToggle activeTab="INVESTIDOR">
        <Tab>VISUALIZAR COMO</Tab>
        <Tab active="true">INVESTIDOR</Tab>
        <Tab>PRODUTOR</Tab>
      </ViewToggle>
      <Button type="secondary" icon="download">Exportar Relatório</Button>
    </Header>

    <MetricsSummaryBar>
      <Metric icon="arvore" value="94.320 ha" label="Floresta Preservada" change="+2.124 ha este mês" color="green" />
      <Metric icon="pessoas" value="1.847" label="Famílias Beneficiadas" change="+47 este mês" color="purple" />
      <Metric icon="co2" value="12.450 t" label="CO2 Evitado" change="+120t este mês" color="orange" />
    </MetricsSummaryBar>

    <HeroBanner>
      <Greeting>Bom dia, equipe.</Greeting>
      <Headline>Sua floresta cresceu esta semana.</Headline>
      <Description>Foram adicionados 2 novos projetos no Xingu e no Pará. Nova área protegida: 120 ha.</Description>
      <Actions>
        <Button type="primary" color="orange">VER PROJETOS →</Button>
        <Button type="secondary">RELATÓRIO DE IMPACTO</Button>
      </Actions>
    </HeroBanner>

    <KpiGrid columns="4">
      <KpiCard label="Patrimônio Total" value="R$ 352.000" subtext="+12.4% no último ano" />
      <KpiCard label="Projetos Ativos" value="4 projetos" subtext="Em 3 regiões" />
      <KpiCard label="ESG Score Médio" value="90.8 / 100" subtext="Acima da média" color="green" />
      <KpiCard label="Retorno Médio Estimado" value="16.4% a.a." subtext="Acima do benchmark" />
    </KpiGrid>

    <Grid columns="2">
      <ChartCard title="Evolução do Patrimônio" subtitle="Jan - Jun 2026">
        <AreaChart color="purple" />
      </ChartCard>

      <ChartCard title="Alocação por Categoria" subtitle="Distribuição atual">
        <DonutChart>
          <LegendItem label="Alimentos" value="42%" color="green" />
          <LegendItem label="Cosméticos" value="33%" color="purple" />
          <LegendItem label="Outros" value="25%" color="orange" />
        </DonutChart>
      </ChartCard>
    </Grid>
  </MainContent>
</Screen>
```

---


### `T09` - Portfolio de Investimentos

```xml
<Screen name="Meu Portfólio">
  <Sidebar activeItem="Portfólio">
    <Brand name="BioRaiz" subtitle="INVESTIMENTO SUSTENTÁVEL" />
    <Navigation>
      <NavItem icon="dashboard">Dashboard</NavItem>
      <NavItem icon="descoberta">Descoberta</NavItem>
      <NavItem icon="projetos">Projetos</NavItem>
      <NavItem icon="portfolio" active="true">Portfólio</NavItem>
      <NavItem icon="impacto">Impacto ESG</NavItem>
      <NavItem icon="auditoria">Auditoria</NavItem>
      <NavItem icon="configuracoes">Configurações</NavItem>
    </Navigation>
    <UserProfile name="Grupo Flamboyant" role="Investidor Institucional" />
  </Sidebar>

  <MainContent>
    <Header>
      <Title>Meu Portfólio</Title>
      <Subtitle>Gerencie seus investimentos e acompanhe o desempenho</Subtitle>
      <ViewToggle activeTab="INVESTIDOR">
        <Tab>VISUALIZAR COMO</Tab>
        <Tab active="true">INVESTIDOR</Tab>
        <Tab>PRODUTOR</Tab>
      </ViewToggle>
      <Button type="secondary" icon="download">Exportar Relatório</Button>
    </Header>

    <MetricsSummaryBar>
      <Metric icon="arvore" value="94.320 ha" label="Floresta Preservada" change="+2.124 ha este mês" color="green" />
      <Metric icon="pessoas" value="1.847" label="Famílias Beneficiadas" change="+47 este mês" color="purple" />
      <Metric icon="co2" value="12.450 t" label="CO2 Evitado" change="+120t este mês" color="orange" />
    </MetricsSummaryBar>

    <KpiGrid columns="4">
      <KpiCard label="Total Investido" value="R$ 352.000" />
      <KpiCard label="Valor Atual" value="R$ 395.500" color="green" />
      <KpiCard label="Rendimento Total" value="+R$ 43.500" color="green" />
      <KpiCard label="Rentabilidade Média" value="16.2% a.a." />
    </KpiGrid>

    <TableSection title="4 projetos em carteira">
      <Table>
        <TableHeader>
          <Column>PROJETO</Column>
          <Column>VALOR INVESTIDO</Column>
          <Column>VALOR ATUAL</Column>
          <Column>RETORNO</Column>
          <Column>ESG</Column>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cooperativa de Açaí do Mujuú</TableCell>
            <TableCell>R$ 100.000</TableCell>
            <TableCell>R$ 112.400</TableCell>
            <TableCell color="green">+ 12.4%</TableCell>
            <TableCell>91</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Chocolates Nativos do Pará</TableCell>
            <TableCell>R$ 120.000</TableCell>
            <TableCell>R$ 138.000</TableCell>
            <TableCell color="green">+ 15.0%</TableCell>
            <TableCell>94</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Castanha Solidária Xingu</TableCell>
            <TableCell>R$ 80.000</TableCell>
            <TableCell>R$ 89.400</TableCell>
            <TableCell color="green">+ 11.7%</TableCell>
            <TableCell>88</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Arariba Viva Dermocosméticos</TableCell>
            <TableCell>R$ 52.000</TableCell>
            <TableCell>R$ 55.700</TableCell>
            <TableCell color="green">+ 10.8%</TableCell>
            <TableCell>96</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableSection>

    <ChartSection title="EVOLUÇÃO DO PATRIMÔNIO">
      <Subtitle>Jan - Jun 2026</Subtitle>
      <LineChart color="purple" />
    </ChartSection>
  </MainContent>
</Screen>
```

---

### `T10` - Relatório de Impacto ESG

```xml
<Screen name="Relatório de Impacto ESG">
  <Sidebar activeItem="Impacto ESG">
    <Brand name="BioRaiz" subtitle="INVESTIMENTO SUSTENTÁVEL" />
    <Navigation>
      <NavItem icon="dashboard">Dashboard</NavItem>
      <NavItem icon="descoberta">Descoberta</NavItem>
      <NavItem icon="projetos">Projetos</NavItem>
      <NavItem icon="portfolio">Portfólio</NavItem>
      <NavItem icon="impacto" active="true">Impacto ESG</NavItem>
      <NavItem icon="auditoria">Auditoria</NavItem>
      <NavItem icon="configuracoes">Configurações</NavItem>
    </Navigation>
    <UserProfile name="Grupo Flamboyant" role="Investidor Institucional" />
  </Sidebar>

  <MainContent>
    <Header>
      <Title>Relatório de Impacto ESG</Title>
      <Subtitle>Métricas consolidadas do impacto ambiental e social gerado</Subtitle>
      <ViewToggle activeTab="INVESTIDOR">
        <Tab>VISUALIZAR COMO</Tab>
        <Tab active="true">INVESTIDOR</Tab>
        <Tab>PRODUTOR</Tab>
      </ViewToggle>
      <Button type="secondary" icon="download">Exportar Relatório</Button>
    </Header>

    <MetricsSummaryBar>
      <Metric icon="arvore" value="94.320 ha" label="Floresta Preservada" change="+2.124 ha este mês" color="green" />
      <Metric icon="pessoas" value="1.847" label="Famílias Beneficiadas" change="+47 este mês" color="purple" />
      <Metric icon="co2" value="12.450 t" label="CO2 Evitado" change="+120t este mês" color="orange" />
    </MetricsSummaryBar>

    <HeroBanner>
      <Headline>Seu capital preservou</Headline>
      <HighlightText>94.320 hectares de Amazônia</HighlightText>
      <Description>Impacto referente a 12 meses de investimento acumulado em 4 projetos na região de Altamira e Xingu.</Description>
    </HeroBanner>

    <ImpactMetricsGrid columns="4">
      <ImpactCard icon="arvore" value="94.320" unit="ha" label="Floresta Preservada" />
      <ImpactCard icon="pessoas" value="1.847" unit="Fam." label="Famílias Beneficiadas" />
      <ImpactCard icon="co2" value="12.450" unit="ton." label="CO2 Evitado" />
      <ImpactCard icon="globo" value="6" unit="Projetos" label="Projetos Ativos" />
    </ImpactMetricsGrid>

    <ChartSection title="HECTARES PRESERVADOS - EVOLUÇÃO MENSAL">
      <Subtitle>Crescimento consistente de cobertura florestal protegida</Subtitle>
      <LineChart color="green" />
    </ChartSection>
  </MainContent>
</Screen>
```

---

### `T11` - Auditoria - Visão Geral

```xml
<Screen name="Auditoria - Visão Geral">
  <Sidebar activeItem="Auditoria">
    <Brand name="BioRaiz" subtitle="BIOECONOMIA AMAZÔNICA" />
    <Navigation>
      <NavItem icon="dashboard">Dashboard</NavItem>
      <NavItem icon="descoberta">Descoberta</NavItem>
      <NavItem icon="projetos">Projetos</NavItem>
      <NavItem icon="portfolio">Portfólio</NavItem>
      <NavItem icon="impacto">Impacto ESG</NavItem>
      <NavItem icon="auditoria" active="true">Auditoria</NavItem>
      <NavItem icon="relatorios">Relatórios</NavItem>
    </Navigation>
    <UserProfile name="Grupo Floresta" role="Fundo ESG — Série B" />
  </Sidebar>

  <MainContent>
    <Header>
      <ViewToggle activeTab="INVESTIDOR">
        <Tab>VISUALIZAR COMO:</Tab>
        <Tab active="true">INVESTIDOR</Tab>
        <Tab>PRODUTOR</Tab>
      </ViewToggle>
      <MetricsSummaryBar>
        <Metric icon="arvore" value="94.320 ha" label="Floresta Preservada" change="+2.520 este mês" color="green" />
        <Metric icon="pessoas" value="1.847" label="Beneficiadas" change="+87 este mês" color="purple" />
        <Metric icon="co2" value="12.450 t CO2" label="Carbono Evitado" change="+750t este mês" color="yellow" />
      </MetricsSummaryBar>
    </Header>

    <SectionHeader category="CENTRAL DE AUDITORIA E CONFORMIDADE">
      <Title>Relatórios e Verificações</Title>
      <ProjectSelector default="Cooperativa Açaí do Marajó — Em Plena Conformidade" subtext="5/5 selos ativos · Última auditoria: Mai 2026 · Próxima: Ago 2026">
        <Badge color="green" icon="check">APTO PARA INVESTIMENTO</Badge>
      </ProjectSelector>
    </SectionHeader>

    <SubNavigation>
      <Tab icon="grafico" active="true">Visão Geral</Tab>
      <Tab icon="calendario">Linha do Tempo</Tab>
      <Tab icon="documento">Relatórios</Tab>
    </SubNavigation>

    <Section title="SELOS DE CERTIFICAÇÃO ATIVOS — PASSE O MOUSE PARA DETALHES">
      <BadgeCounter count="5 ATIVOS" />
      <CertificatesGrid columns="5">
        <CertificateCard status="active">
          <Icon name="folha" color="green" />
          <Title>Orgânico Brasil</Title>
          <Subtitle>MAPA</Subtitle>
          <Validity color="green">✔ Válido até Out 2026</Validity>
        </CertificateCard>

        <CertificateCard status="active">
          <Icon name="globo" color="green" />
          <Title>Rainforest Alliance</Title>
          <Subtitle>RA International</Subtitle>
          <Validity color="green">✔ Válido até Jan 2029</Validity>
        </CertificateCard>

        <CertificateCard status="active">
          <Icon name="ar" color="blue" />
          <Title>Carbono Neutro</Title>
          <Subtitle>Bureau Veritas</Subtitle>
          <Validity color="blue">✔ Válido até Dez 2026</Validity>
        </CertificateCard>

        <CertificateCard status="active">
          <Icon name="medalha" color="orange" />
          <Title>FLO Fair Trade</Title>
          <Subtitle>Fairtrade International</Subtitle>
          <Validity color="orange">✔ Válido até Jun 2027</Validity>
        </CertificateCard>

        <CertificateCard status="active">
          <Icon name="gota" color="blue" />
          <Title>Proteção de Mananciais</Title>
          <Subtitle>ANA / PNMA</Subtitle>
          <Validity color="blue">✔ Válido até Mar 2027</Validity>
        </CertificateCard>
      </CertificatesGrid>
    </Section>

    <Grid columns="2">
      <Card title="COMPOSIÇÃO DO SCORE ESG" score="Score geral: 87/100">
        <DonutChart value="87" />
        <ProgressBarList>
          <ProgressBar label="Ambiental" value="92/100" color="green" />
          <ProgressBar label="Social" value="88/100" color="purple" />
          <ProgressBar label="Governança" value="81/100" color="orange" />
        </ProgressBarList>
      </Card>

      <Card title="ÍNDICES DE CONFORMIDADE" subtitle="Por dimensão auditada">
        <HorizontalBarChart>
          <Bar label="Cobertura Florestal" value="96" color="green" />
          <Bar label="Condições de Trabalho" value="94" color="green" />
          <Bar label="Rastreabilidade" value="92" color="purple" />
          <Bar label="Governança Cooperativa" value="89" color="purple" />
          <Bar label="Gestão de Resíduos" value="78" color="orange" />
        </HorizontalBarChart>
      </Card>
    </Grid>

    <InfoAlert icon="info">
      <Title>Auditoria de satélite agendada para Agosto 2026</Title>
      <Description>O monitoramento semestral pelo INPE/MapBiomas está programado. Todas as auditorias anteriores foram aprovadas sem ressalvas.</Description>
    </InfoAlert>
  </MainContent>
</Screen>
```

---

### `T12` - Auditoria - Linha do tempo

```xml
<Screen name="Relatório de Verificação e Auditoria">
  <Sidebar activeItem="Auditoria">
    <Brand name="BioRaiz" subtitle="INVESTIMENTO SUSTENTÁVEL" />
    <Navigation>
      <NavItem icon="dashboard">Dashboard</NavItem>
      <NavItem icon="descoberta">Descoberta</NavItem>
      <NavItem icon="projetos">Projetos</NavItem>
      <NavItem icon="portfolio">Portfólio</NavItem>
      <NavItem icon="impacto">Impacto ESG</NavItem>
      <NavItem icon="auditoria" active="true">Auditoria</NavItem>
      <NavItem icon="configuracoes">Configurações</NavItem>
    </Navigation>
    <UserProfile name="Grupo Flamboyant" role="Investidor Institucional" />
  </Sidebar>

  <MainContent>
    <Header>
      <Title>Relatório de Verificação</Title>
      <Subtitle>Histórico de auditorias e validações dos projetos em carteira</Subtitle>
      <ViewToggle activeTab="INVESTIDOR">
        <Tab>VISUALIZAR COMO</Tab>
        <Tab active="true">INVESTIDOR</Tab>
        <Tab>PRODUTOR</Tab>
      </ViewToggle>
    </Header>

    <MetricsSummaryBar>
      <Metric icon="arvore" value="94.320 ha" label="Floresta Preservada" change="+2.124 ha este mês" color="green" />
      <Metric icon="pessoas" value="1.847" label="Famílias Beneficiadas" change="+47 este mês" color="purple" />
      <Metric icon="co2" value="12.450 t" label="CO2 Evitado" change="+120t este mês" color="orange" />
    </MetricsSummaryBar>

    <NoticeBanner status="verified">
      <Icon name="check-shield" color="green" />
      <Content>
        <Title>100% das métricas auditadas e validadas por terceiros</Title>
        <Subtitle>Última verificação presencial realizada em 15 de Maio de 2026 na região de Altamira - PA.</Subtitle>
      </Content>
      <Button type="secondary">BAIXAR LAUDO COMPLETO</Button>
    </NoticeBanner>

    <SubNavigation>
      <Tab active="true">Visão Geral</Tab>
      <Tab>Linha do Tempo</Tab>
      <Tab>Documentos</Tab>
    </SubNavigation>

    <TimelineSection title="Histórico de verificações">
      <TimelineFilter>
        <FilterOption active="true">Todas</FilterOption>
        <FilterOption>Aprovadas</FilterOption>
      </TimelineFilter>

      <TimelineList>
        <TimelineItem status="approved" date="15 Maio">
          <Badge color="green">Aprovada</Badge>
          <Title>Inspeção de Campo</Title>
          <Subtitle>Região Altamira - PA</Subtitle>
        </TimelineItem>

        <TimelineItem status="approved" date="02 Abr">
          <Badge color="green">Aprovada</Badge>
          <Title>Auditoria Florestal</Title>
          <Subtitle>PRODES / INPE</Subtitle>
        </TimelineItem>

        <TimelineItem status="approved" date="20 Fev">
          <Badge color="green">Aprovada</Badge>
          <Title>Exposição de Certificação</Title>
          <Subtitle>Selo BioRaiz Verificado</Subtitle>
        </TimelineItem>

        <TimelineItem status="approved" date="12 Jan">
          <Badge color="green">Aprovada</Badge>
          <Title>Certificados emitidos</Title>
          <Subtitle>IMAC / Orgânico Brasil</Subtitle>
        </TimelineItem>

        <TimelineItem status="approved" date="18 Dez">
          <Badge color="green">Aprovada</Badge>
          <Title>Auditoria Social e Trabalhista</Title>
          <Subtitle>Direitos Humanos</Subtitle>
        </TimelineItem>

        <TimelineItem status="approved" date="05 Nov">
          <Badge color="green">Aprovada</Badge>
          <Title>Monitoramento Satelital</Title>
          <Subtitle>MapBiomas Alertas</Subtitle>
        </TimelineItem>
      </TimelineList>
    </TimelineSection>
  </MainContent>
</Screen>
```

---

### T13 - Auditoria - Relatórios

```xml
<Screen name="Auditoria - Relatórios">
  <Sidebar activeItem="Auditoria">
    <Brand name="BioRaiz" subtitle="BIOECONOMIA AMAZÔNICA" />
    <Navigation>
      <NavItem icon="dashboard">Dashboard</NavItem>
      <NavItem icon="descoberta">Descoberta</NavItem>
      <NavItem icon="projetos">Projetos</NavItem>
      <NavItem icon="portfolio">Portfólio</NavItem>
      <NavItem icon="impacto">Impacto ESG</NavItem>
      <NavItem icon="auditoria" active="true">Auditoria</NavItem>
      <NavItem icon="relatorios">Relatórios</NavItem>
    </Navigation>
    <UserProfile name="Grupo Floresta" role="Fundo ESG — Série B" />
  </Sidebar>

  <MainContent>
    <Header>
      <ViewToggle activeTab="INVESTIDOR">
        <Tab>VISUALIZAR COMO:</Tab>
        <Tab active="true">INVESTIDOR</Tab>
        <Tab>PRODUTOR</Tab>
      </ViewToggle>
      <MetricsSummaryBar>
        <Metric icon="arvore" value="94.320 ha" label="Floresta Preservada" change="+2.520 este mês" color="green" />
        <Metric icon="pessoas" value="1.847" label="Beneficiadas" change="+87 este mês" color="purple" />
        <Metric icon="co2" value="12.450 t CO2" label="Carbono Evitado" change="+750t este mês" color="yellow" />
      </MetricsSummaryBar>
    </Header>

    <SectionHeader category="CENTRAL DE AUDITORIA E CONFORMIDADE">
      <Title>Relatórios e Verificações</Title>
      <ProjectSelector default="Cooperativa Açaí do Marajó — Em Plena Conformidade" subtext="5/5 selos ativos · Última auditoria: Mai 2026 · Próxima: Ago 2026">
        <Badge color="green" icon="check">APTO PARA INVESTIMENTO</Badge>
      </ProjectSelector>
    </SectionHeader>

    <SubNavigation>
      <Tab icon="grafico">Visão Geral</Tab>
      <Tab icon="calendario">Linha do Tempo</Tab>
      <Tab icon="documento" active="true">Relatórios</Tab>
    </SubNavigation>

    <SectionHeader category="CENTRAL DE DOCUMENTOS TÉCNICOS">
      <Title>5 relatórios disponíveis</Title>
      <Button type="secondary" icon="download">BAIXAR TODOS</Button>
    </SectionHeader>

    <DocumentList>
      <DocumentCard color="purple">
        <Header>
          <Icon name="documento" color="purple" />
          <Title>Relatório Anual ESG 2025</Title>
          <Actions>
            <Button type="icon" icon="external">VER</Button>
            <Button type="icon" icon="download">PDF</Button>
          </Actions>
        </Header>
        <MetaTags>
          <Tag color="purple">ESG Completo</Tag>
          <Meta>Jan 2026</Meta>
          <Meta>48 págs.</Meta>
          <Meta>4.2 MB</Meta>
        </MetaTags>
        <Footer>Resumo executivo disponível · Conformidade verificada por terceiros</Footer>
      </DocumentCard>

      <DocumentCard color="green">
        <Header>
          <Icon name="documento" color="green" />
          <Title>Auditoria Florestal — IBAMA Q1/2026</Title>
          <Actions>
            <Button type="icon" icon="external">VER</Button>
            <Button type="icon" icon="download">PDF</Button>
          </Actions>
        </Header>
        <MetaTags>
          <Tag color="green">Ambiental</Tag>
          <Meta>Mar 2026</Meta>
          <Meta>22 págs.</Meta>
          <Meta>1.8 MB</Meta>
        </MetaTags>
        <Footer>Resumo executivo disponível · Conformidade verificada por terceiros</Footer>
      </DocumentCard>

      <DocumentCard color="yellow">
        <Header>
          <Icon name="documento" color="yellow" />
          <Title>Laudo Social — Bureau Veritas 2025</Title>
          <Actions>
            <Button type="icon" icon="external">VER</Button>
            <Button type="icon" icon="download">PDF</Button>
          </Actions>
        </Header>
        <MetaTags>
          <Tag color="yellow">Social</Tag>
          <Meta>Jul 2025</Meta>
          <Meta>31 págs.</Meta>
          <Meta>2.1 MB</Meta>
        </MetaTags>
        <Footer>Resumo executivo disponível · Conformidade verificada por terceiros</Footer>
      </DocumentCard>

      <DocumentCard color="green">
        <Header>
          <Icon name="documento" color="green" />
          <Title>Certificação Orgânica — MAPA 2025</Title>
          <Actions>
            <Button type="icon" icon="external">VER</Button>
            <Button type="icon" icon="download">PDF</Button>
          </Actions>
        </Header>
        <MetaTags>
          <Tag color="green">Certificação</Tag>
          <Meta>Out 2025</Meta>
          <Meta>12 págs.</Meta>
          <Meta>0.9 MB</Meta>
        </MetaTags>
        <Footer>Resumo executivo disponível · Conformidade verificada por terceiros</Footer>
      </DocumentCard>
    </DocumentList>
  </MainContent>
</Screen>
```

---

### T15 - Cadastro Produtor (Etapa 1) - Seu Negócio

```xml
<MobileScreen name="Cadastro Produtor - Seu Negócio" url="/public/producer/signup/business">
  <TopBar>
    <ViewToggle activeTab="PRODUTOR">
      <Tab>VISUALIZAR COMO:</Tab>
      <Tab>INVESTIDOR</Tab>
      <Tab active="true">PRODUTOR</Tab>
    </ViewToggle>
  </TopBar>

  <SimulationBanner>
    <Title>SIMULAÇÃO MOBILE — INTERFACE DO PRODUTOR AMAZÔNICO</Title>
    <Subtitle>Otimizada para baixa conectividade · Salva dados offline · Funciona com 2G</Subtitle>
  </SimulationBanner>

  <MobileContainer>
    <MobileHeader time="9:41" connection="Online · 3G">
      <Brand name="BioRaiz" />
      <HeaderTitle>Cadastro Produtor</HeaderTitle>
    </MobileHeader>

    <WizardSteps currentStep="1" totalSteps="4">
      <Step icon="casa" label="Negócio" active="true" completed="true" />
      <Step icon="folha" label="Produção" />
      <Step icon="camera" label="Evidências" />
      <Step icon="moeda" label="Crédito" />
    </WizardSteps>

    <FormSection>
      <Title>Seu Negócio</Title>
      <Subtitle>Conte-nos sobre sua produção</Subtitle>

      <FormGroup label="NOME DA COOPERATIVA / NEGÓCIO">
        <Input placeholder="Ex: Cooperativa Verde do Rio" />
      </FormGroup>

      <FormGroup label="TIPO DE ORGANIZAÇÃO">
        <Select placeholder="" />
      </FormGroup>

      <FormGroup label="MUNICÍPIO E ESTADO">
        <Input placeholder="Ex: Santarém, PA" />
      </FormGroup>

      <FormGroup label="NÚMERO DE FAMÍLIAS / MEMBROS">
        <Input placeholder="Ex: 24" />
      </FormGroup>

      <FormGroup label="TEMPO DE ATIVIDADE">
        <ButtonToggleGroup columns="2">
          <OptionButton>Menos de 1 ano</OptionButton>
          <OptionButton>1-3 anos</OptionButton>
          <OptionButton>3-5 anos</OptionButton>
          <OptionButton>Mais de 5 anos</OptionButton>
        </ButtonToggleGroup>
      </FormGroup>

      <Button type="primary" fullWidth="true" color="purple">PRÓXIMO ›</Button>
    </FormSection>

    <SimulationControl>
      <Button type="outline" icon="wifi">Simular: Perder conexão</Button>
    </SimulationControl>
  </MobileContainer>
</MobileScreen>
```

---

### T16 - Cadastro Produtor (Etapa 2) - Sua Produção

```xml
<MobileScreen name="Cadastro Produtor - Sua Produção" url="/public/producer/signup/production">
  <TopBar>
    <ViewToggle activeTab="PRODUTOR">
      <Tab>VISUALIZAR COMO:</Tab>
      <Tab>INVESTIDOR</Tab>
      <Tab active="true">PRODUTOR</Tab>
    </ViewToggle>
  </TopBar>

  <SimulationBanner>
    <Title>SIMULAÇÃO MOBILE — INTERFACE DO PRODUTOR AMAZÔNICO</Title>
    <Subtitle>Otimizada para baixa conectividade · Salva dados offline · Funciona com 2G</Subtitle>
  </SimulationBanner>

  <MobileContainer>
    <MobileHeader time="9:41" connection="Online · 3G">
      <Brand name="BioRaiz" />
      <HeaderTitle>Cadastro Produtor</HeaderTitle>
    </MobileHeader>

    <WizardSteps currentStep="2" totalSteps="4">
      <Step icon="check" label="Negócio" completed="true" />
      <Step icon="folha" label="Produção" active="true" />
      <Step icon="camera" label="Evidências" />
      <Step icon="moeda" label="Crédito" />
    </WizardSteps>

    <FormSection>
      <Title>Sua Produção</Title>
      <Subtitle>O que você produz e como maneja</Subtitle>

      <FormGroup label="PRODUTOS (SELECIONE TODOS)">
        <Grid columns="2">
          <SelectableCard selected="true">Açaí</SelectableCard>
          <SelectableCard>Cacau Nativo</SelectableCard>
          <SelectableCard>Castanha do Pará</SelectableCard>
          <SelectableCard>Óleo de Buriti</SelectableCard>
          <SelectableCard>Andiroba</SelectableCard>
          <SelectableCard>Cupuaçu</SelectableCard>
          <SelectableCard>Copaíba</SelectableCard>
          <SelectableCard>Outros</SelectableCard>
        </Grid>
      </FormGroup>

      <FormGroup label="VOLUME MENSAL ESTIMADO (KG)">
        <Input placeholder="Ex: 500 kg/mês" />
      </FormGroup>

      <FormGroup label="PRÁTICAS SUSTENTÁVEIS">
        <CheckboxGroup>
          <Checkbox checked="true">Sem agrotóxicos</Checkbox>
          <Checkbox checked="true">Manejo certificado</Checkbox>
          <Checkbox checked="true">Coleta sazonal responsável</Checkbox>
          <Checkbox checked="true">Rastreabilidade de origem</Checkbox>
        </CheckboxGroup>
      </FormGroup>

      <ButtonGroup columns="2">
        <Button type="secondary">VOLTAR</Button>
        <Button type="primary" color="purple">PRÓXIMO ›</Button>
      </ButtonGroup>
    </FormSection>

    <SimulationControl>
      <Button type="outline" icon="wifi">Simular: Perder conexão</Button>
    </SimulationControl>
  </MobileContainer>
</MobileScreen>
```

---

### T17 - Cadastro Produtor (Etapa 3) - Fotos e Evidências

```xml
<MobileScreen name="Cadastro Produtor - Fotos e Evidências" url="/public/producer/signup/evidence">
  <TopBar>
    <ViewToggle activeTab="PRODUTOR">
      <Tab>VISUALIZAR COMO:</Tab>
      <Tab>INVESTIDOR</Tab>
      <Tab active="true">PRODUTOR</Tab>
    </ViewToggle>
  </TopBar>

  <SimulationBanner>
    <Title>SIMULAÇÃO MOBILE — INTERFACE DO PRODUTOR AMAZÔNICO</Title>
    <Subtitle>Otimizada para baixa conectividade · Salva dados offline · Funciona com 2G</Subtitle>
  </SimulationBanner>

  <MobileContainer>
    <MobileHeader time="9:41" connection="Online · 3G">
      <Brand name="BioRaiz" />
      <HeaderTitle>Cadastro Produtor</HeaderTitle>
    </MobileHeader>

    <WizardSteps currentStep="3" totalSteps="4">
      <Step icon="check" label="Negócio" completed="true" />
      <Step icon="check" label="Produção" completed="true" />
      <Step icon="camera" label="Evidências" active="true" />
      <Step icon="moeda" label="Crédito" />
    </WizardSteps>

    <FormSection>
      <Title>Fotos e Evidências</Title>
      <Subtitle>Mostre sua produção aos investidores</Subtitle>

      <UploadGroup label="LOCAL DE PRODUÇÃO">
        <UploadBox icon="camera">
          <Text>Floresta, roça ou unidade produtiva</Text>
          <ActionLink>TIRAR FOTO OU ENVIAR ARQUIVO</ActionLink>
        </UploadBox>
      </UploadGroup>

      <UploadGroup label="PRODUTO / COLHEITA">
        <UploadBox icon="camera">
          <Text>Frutos, óleos ou embalagens mezinhas</Text>
          <ActionLink>TIRAR FOTO OU ENVIAR ARQUIVO</ActionLink>
        </UploadBox>
      </UploadGroup>

      <UploadGroup label="DOCUMENTO DE ÁREA (DAP, CAR)">
        <UploadBox icon="camera">
          <Text>PDF ou foto legível do documento</Text>
          <ActionLink>TIRAR FOTO OU ENVIAR ARQUIVO</ActionLink>
        </UploadBox>
      </UploadGroup>

      <InfoNote icon="info">
        Fotos salvas localmente. Enviadas automaticamente ao...
      </InfoNote>

      <ButtonGroup columns="2">
        <Button type="secondary">VOLTAR</Button>
        <Button type="primary" color="purple">PRÓXIMO ›</Button>
      </ButtonGroup>
    </FormSection>

    <SimulationControl>
      <Button type="outline" icon="wifi">Simular: Perder conexão</Button>
    </SimulationControl>
  </MobileContainer>
</MobileScreen>
```

---

### T18 - Cadastro Produtor (Etapa 4) - Meta de Financiamento

```xml
<MobileScreen name="Cadastro Produtor - Meta de Financiamento" url="/public/producer/signup/financial">
  <TopBar>
    <ViewToggle activeTab="PRODUTOR">
      <Tab>VISUALIZAR COMO:</Tab>
      <Tab>INVESTIDOR</Tab>
      <Tab active="true">PRODUTOR</Tab>
    </ViewToggle>
  </TopBar>

  <SimulationBanner>
    <Title>SIMULAÇÃO MOBILE — INTERFACE DO PRODUTOR AMAZÔNICO</Title>
    <Subtitle>Otimizada para baixa conectividade · Salva dados offline · Funciona com 2G</Subtitle>
  </SimulationBanner>

  <MobileContainer>
    <MobileHeader time="9:41" connection="Online · 3G">
      <Brand name="BioRaiz" />
      <HeaderTitle>Cadastro Produtor</HeaderTitle>
    </MobileHeader>

    <WizardSteps currentStep="4" totalSteps="4">
      <Step icon="check" label="Negócio" completed="true" />
      <Step icon="check" label="Produção" completed="true" />
      <Step icon="check" label="Evidências" completed="true" />
      <Step icon="moeda" label="Crédito" active="true" />
    </WizardSteps>

    <FormSection>
      <Title>Meta de Financiamento</Title>
      <Subtitle>Quanto você precisa e para quê</Subtitle>

      <FormGroup label="FINALIDADE PRINCIPAL">
        <OptionList>
          <OptionCard icon="construcao">
            <Title>Infraestrutura</Title>
            <Subtitle>Construção ou reforma</Subtitle>
          </OptionCard>

          <OptionCard icon="caixa">
            <Title>Equipamentos</Title>
            <Subtitle>Máquinas e ferramentas</Subtitle>
          </OptionCard>

          <OptionCard icon="planta">
            <Title>Expansão de área</Title>
            <Subtitle>Novos plantios</Subtitle>
          </OptionCard>

          <OptionCard icon="saco-moeda">
            <Title>Capital de giro</Title>
            <Subtitle>Compra de insumos</Subtitle>
          </OptionCard>
        </OptionList>
      </FormGroup>

      <FormGroup label="VALOR NECESSÁRIO (R$)">
        <Input placeholder="Ex: 50.000" />
      </FormGroup>

      <FormGroup label="PRAZO DESEJADO (MESES)">
        <Input placeholder="Ex: 24" />
      </FormGroup>

      <BannerBadge icon="ribbon" color="green">
        PRÉ-ANÁLISE SEM CUSTO
      </BannerBadge>

      <ButtonGroup columns="2">
        <Button type="secondary">VOLTAR</Button>
        <Button type="primary" color="green">ENVIAR CADASTRO ›</Button>
      </ButtonGroup>
    </FormSection>

    <SimulationControl>
      <Button type="outline" icon="wifi">Simular: Perder conexão</Button>
    </SimulationControl>
  </MobileContainer>
</MobileScreen>
```