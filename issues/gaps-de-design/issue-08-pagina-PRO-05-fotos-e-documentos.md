# Issue 08 - Página PRO-05 · Fotos e documentos - 📋 Relatório de Gaps e Divergências (Design vs. MVP Final)

### 1. Cabeçalho e Navegação

- **Barra de Progresso e Voltar:** O Design exibe um botão circular de voltar e uma barra de progresso horizontal com 4 de 5 partes preenchidas. No MVP, a barra de progresso foi removida e o botão de voltar foi movido para o rodapé como um link de texto simples.

- **Indicador de Status:** O Design apresenta o texto `Parte 4 de 5` centralizado e a tag `✓ Salvo` (verde, com ícone) à direita. O MVP os unifica no canto superior esquerdo como `Parte 4 de 5 · Salvo`, sem o uso de ícones.

### 2. Título e Texto de Apoio

- **Cores e Tipografia:** O título `Fotos e documentos` no Design é escuro, mas no MVP foi alterado para a cor verde.

- **Subtítulo Ausente:** O Design inclui um texto de instrução essencial logo abaixo do título: `Use a câmera do celular. Fotos do caderno ou da planilha também valem.`. Este texto foi completamente omitido no MVP.

### 3. Componentes de Upload (Design Rico vs. HTML Padrão)

- **Arquivos Enviados (Estado Preenchido):**
- **Design:** Os cards "Onde vocês produzem" e "O produto ou a colheita" demonstram um estado de sucesso, exibindo uma miniatura da foto (thumbnail), uma mensagem de sucesso em verde (`✓ Enviado · 2 fotos`) e um botão `Trocar` alinhado à direita, tudo encapsulado em um card com borda sólida.

- **MVP:** Não há interface de estado preenchido ou miniaturas. O sistema utiliza um input nativo de HTML que exibe apenas `Escolher arquivos Nenhum arquivo escolhido`.

- **Ações de Upload (Estado Vazio):**
- **Design:** Os cards de envio pendente (Documento da terra e Selos) possuem borda tracejada e oferecem dois botões de ação distintos dentro do card: `Tirar foto` (com ícone de câmera) e `Escolher arquivo` (com ícone de upload). O card "Documento da terra" destaca o botão de foto com preenchimento verde.

- **MVP:** Os cards tracejados, ícones e a opção específica de "Tirar foto" desapareceram, restando apenas o texto padrão do navegador para input de arquivos.

### 4. Textos de Rótulos e Ajuda (Helper Texts)

- **Documento da terra:** O Design separa o título do texto de ajuda `CAR ou DAP. Se não tiver agora, envie depois.`. No MVP, tudo foi aglutinado em uma única linha de rótulo: `Documento da terra (CAR ou DAP) — pode enviar depois (opcional)`.

- **Selos de Certificadoras:** O Design inclui exemplos abaixo do título: `Orgânico Brasil, Fair Trade, Rainforest Alliance e outros.`. O MVP removeu esses exemplos do layout.

### 5. Área de Ação (Rodapé)

- **Botão Continuar:** O Design utiliza um botão verde, largo (full-width) e centralizado no contêiner do formulário. O MVP reduziu o botão e o posicionou isolado no canto inferior direito da tela larga.

---

# 📐 Estrutura de Layout do Design em XML

Abaixo está o modelo XML estruturado referente fielmente à tela **Fotos e documentos (Design Esperado)**:

```xml
<Screen name="FotosDocumentos">
    <Container padding="large" backgroundColor="beige-light" layout="mobile-constrained">

        <!-- Navegação Superior -->
        <Header>
            <BackButton icon="chevron-left" shape="circular" />
            <StepIndicator text="Parte 4 de 5" align="center" />
            <StatusBadge icon="check" text="Salvo" color="green" align="right" />
        </Header>

        <!-- Barra de Progresso Visual -->
        <ProgressBar totalSteps="5" currentStep="4" activeColor="green" inactiveColor="beige-dark" />

        <!-- Cabeçalho da Tela -->
        <SectionHeader>
            <Title size="h2" color="black">Fotos e documentos</Title>
            <Subtitle color="gray">
                Use a câmera do celular. Fotos do caderno ou da planilha também valem.
            </Subtitle>
        </SectionHeader>

        <!-- Lista de Uploads -->
        <UploadList gap="medium">

            <!-- Item 1: Estado Preenchido -->
            <UploadCard status="success" border="solid" radius="medium" backgroundColor="white">
                <Thumbnail src="img_acai_tree.jpg" />
                <Content>
                    <Label font="bold">Onde vocês produzem</Label>
                    <StatusText color="green" icon="check">Enviado · 2 fotos</StatusText>
                </Content>
                <ActionLink color="green-dark">Trocar</ActionLink>
            </UploadCard>

            <!-- Item 2: Estado Preenchido -->
            <UploadCard status="success" border="solid" radius="medium" backgroundColor="white">
                <Thumbnail src="img_acai_baskets.jpg" />
                <Content>
                    <Label font="bold">O produto ou a colheita</Label>
                    <StatusText color="green" icon="check">Enviado · 1 foto</StatusText>
                </Content>
                <ActionLink color="green-dark">Trocar</ActionLink>
            </UploadCard>

            <!-- Item 3: Estado Vazio com Ações (Borda Tracejada) -->
            <UploadCard status="empty" border="dashed" radius="medium" backgroundColor="transparent">
                <Header>
                    <Label font="bold">Documento da terra</Label>
                    <HelperText color="gray">CAR ou DAP. Se não tiver agora, envie depois.</HelperText>
                </Header>
                <ButtonGroup layout="row" gap="small">
                    <Button variant="primary-green" icon="camera">Tirar foto</Button>
                    <Button variant="outline-gray" icon="upload">Escolher arquivo</Button>
                </ButtonGroup>
            </UploadCard>

            <!-- Item 4: Estado Vazio com Ações (Borda Tracejada) -->
            <UploadCard status="empty" border="dashed" radius="medium" backgroundColor="transparent">
                <Header>
                    <Label font="bold">Selos que vocês já têm <Span font="regular" color="gray">(opcional)</Span></Label>
                    <HelperText color="gray">Orgânico Brasil, Fair Trade, Rainforest Alliance e outros.</HelperText>
                </Header>
                <ButtonGroup layout="row" gap="small">
                    <Button variant="outline-gray">Tirar foto</Button>
                    <Button variant="outline-gray">Escolher arquivo</Button>
                </ButtonGroup>
            </UploadCard>

        </UploadList>

        <!-- Rodapé de Ação -->
        <Footer fixed="bottom">
            <Button variant="primary-green" fullWidth="true" size="large">
                Continuar
            </Button>
        </Footer>

    </Container>
</Screen>

```
