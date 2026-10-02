# issue-06 - PRO-03 · Seu negócio - Relatório de Gaps e Divergências (Design vs. MVP Final)

Com base na análise comparativa entre o **Design Esperado** e o **MVP Final**, detalho abaixo as divergências estruturais, de texto e de componentes, além do layout em XML correspondente à versão correta.

### 1. Cabeçalho e Navegação

- **Botão de Voltar e Barra de Progresso:**
- **Design:** Apresenta um botão circular `<` no canto superior esquerdo e uma barra de progresso horizontal em 5 partes, com duas preenchidas em verde.

- **MVP:** A barra de progresso visual e o botão circular foram omitidos. O botão de voltar foi movido para o rodapé em formato de link de texto.

- **Indicador de Status:**
- **Design:** O texto `Parte 2 de 5` é centralizado, com o status `✓ Salvo` (ícone de check e texto em verde) alinhado à direita.

- **MVP:** Agrupado em texto contínuo no canto esquerdo como `Parte 2 de 5 · Salvo`, sem ícones ou alinhamento separado.

### 2. Tipografia e Título Principal

- **Design:** O título `Seu negócio` utiliza a cor preta/cinza escuro.

- **MVP:** O título foi renderizado na cor verde.

### 3. Campos de Formulário (Rótulos e Componentes)

- **Nome do Negócio:**
- **Design:** O rótulo é `Nome da cooperativa ou negócio`.

- **MVP:** Rótulo simplificado para `Nome do negócio`.

- **Tipo de Organização:**
- **Design:** Rótulo `Vocês são` acompanhado de um grupo de opções em formato de _Radio Cards/Pills_ visíveis na tela (`Cooperativa`, `Associação`, `Pequena empresa`), com destaque visual (borda e fundo verde) para o item selecionado.

- **MVP:** Alterado para um rótulo `Tipo de organização` acompanhado de um componente _Dropdown/Select_ ocultando as opções.

- **Disposição em Grid (Lado a Lado):**
- **Design:** Os campos `Cidade` e `Estado` estão dispostos lado a lado na mesma linha. O mesmo ocorre para `Quantas famílias` e `Há quanto tempo`.

- **MVP:** Todos os campos estão empilhados verticalmente, ocupando a largura total da tela.

- **Campo Estado:**
- **Design:** O campo `Estado` é um _Dropdown_ de seleção.

- **MVP:** Alterado para um campo de texto livre com rótulo `Estado (UF)`.

- **Rótulos de Métricas:**
- **Design:** Utiliza as perguntas diretas `Quantas famílias` e `Há quanto tempo`.

- **MVP:** Substituídos por termos técnicos: `Número de famílias` e `Tempo de atividade (anos)`.

### 4. Elementos Inseridos Incorretamente

- **MVP:** Inclui um checkbox `Recebemos visitas de investidores` acima do rodapé. Este elemento **não existe** no fluxo desta tela no Design.

### 5. Área de Ação (Rodapé)

- **Design:** O botão `Continuar` é grande, centralizado e ocupa toda a largura (full-width) da área de conteúdo do formulário.

- **MVP:** O botão `Continuar` foi reduzido de tamanho e alinhado apenas ao canto inferior direito da tela.

---

# 📐 Estrutura de Layout do Design em XML

```xml
<Screen name="SeuNegocio">
    <Container padding="large" backgroundColor="beige-light" layout="mobile-constrained">

        <!-- Navegação Superior -->
        <Header>
            <BackButton icon="chevron-left" shape="circular" />
            <StepIndicator text="Parte 2 de 5" align="center" />
            <StatusBadge icon="check" text="Salvo" color="green" align="right" />
        </Header>

        <!-- Barra de Progresso Visual -->
        <ProgressBar totalSteps="5" currentStep="2" activeColor="green" inactiveColor="beige-dark" />

        <!-- Título Principal -->
        <Title size="h2" color="black">Seu negócio</Title>

        <!-- Formulário -->
        <Form>
            <InputGroup>
                <Label>Nome da cooperativa ou negócio</Label>
                <TextInput value="Cooperativa de Açaí do Mujuú" />
            </InputGroup>

            <!-- Seleção com Radio Cards/Pills -->
            <InputGroup>
                <Label>Vocês são</Label>
                <RadioCardGroup name="tipo_organizacao" layout="wrap">
                    <RadioCard value="cooperativa" selected="true">Cooperativa</RadioCard>
                    <RadioCard value="associacao">Associação</RadioCard>
                    <RadioCard value="pequena_empresa">Pequena empresa</RadioCard>
                </RadioCardGroup>
            </InputGroup>

            <!-- Linha Dupla 1: Cidade e Estado -->
            <FormRow columns="2">
                <InputGroup>
                    <Label>Cidade</Label>
                    <TextInput value="Cametá" />
                </InputGroup>
                <InputGroup>
                    <Label>Estado</Label>
                    <SelectDropdown value="PA" />
                </InputGroup>
            </FormRow>

            <!-- Linha Dupla 2: Famílias e Tempo -->
            <FormRow columns="2">
                <InputGroup>
                    <Label>Quantas famílias</Label>
                    <TextInput value="30" type="number" />
                </InputGroup>
                <InputGroup>
                    <Label>Há quanto tempo</Label>
                    <TextInput value="8 anos" />
                </InputGroup>
            </FormRow>
        </Form>

        <!-- Rodapé de Ação -->
        <Footer fixed="bottom">
            <Button variant="primary-green" fullWidth="true" size="large">
                Continuar
            </Button>
        </Footer>

    </Container>
</Screen>

```
