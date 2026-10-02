# Issue 07 - Página PRO-04 · Sua produção - 📋 Relatório de Gaps e Divergências (Design vs. MVP Final)

Com base na análise comparativa entre o **Design Esperado** e o **MVP Final**, detalho abaixo as divergências encontradas na tela "Sua produção" e a estrutura XML do layout correto.

### 1. Cabeçalho e Título

- **Navegação e Progresso:**
- **Design:** Apresenta botão circular de voltar (`<`), indicador centralizado `Parte 3 de 5`, status `✓ Salvo` (verde e com ícone) e uma barra de progresso visual com 3 de 5 segmentos preenchidos.

- **MVP:** A barra de progresso visual foi removida. O texto de status foi agrupado no canto superior esquerdo como `Parte 3 de 5 · Salvo`, sem ícone. O botão de voltar foi movido para o rodapé em formato de texto simples.

- **Título Principal:**
- **Design:** O título `Sua produção` está na cor preta/cinza escuro.

- **MVP:** O título foi modificado para a cor verde.

### 2. Seção "O que você produz?"

- **Rótulos (Labels):**
- **Design:** Utiliza a pergunta `O que você produz?` em negrito, acompanhada da instrução `Marque um ou mais`.

- **MVP:** O rótulo foi simplificado drasticamente para apenas `Produtos`.

- **Componente de Seleção:**
- **Design:** As opções são _Pills/Cards_ (caixas arredondadas) organizados lado a lado (em grid/wrap). O item selecionado ("Açaí") ganha destaque com borda verde escuro e fundo verde claro.

- **MVP:** Substituído por uma lista vertical simples de checkboxes padrão, sem caixas envolventes ou organização em grid.

### 3. Seção "Produção mensal aproximada"

- **Sufixo e Formatação:**
- **Design:** O indicador de unidade `kg` está posicionado dentro do campo de input, como um sufixo visual ao lado direito do valor numérico (ex: `8.000` `kg`).

- **MVP:** O sufixo foi removido do input e movido para o rótulo da pergunta: `Produção mensal aproximada (kg)`.

- **Texto de Ajuda (Helper Text):**
- **Design:** Abaixo do input existe a instrução de apoio `Uma estimativa basta. Conferimos depois.`.

- **MVP:** O texto de ajuda foi completamente omitido.

### 4. Seção "Como vocês cuidam da floresta?"

- **Componente Visual:**
- **Design:** As opções são exibidas como _Cards_ (caixas retangulares brancas com bordas arredondadas e contorno cinza) ocupando a largura do contêiner, com o checkbox internamente alinhado à esquerda.

- **MVP:** Convertido em uma lista vertical de checkboxes simples de texto, sem delimitadores visuais (cards).

- **Divergência nas Opções (Dados):**
- **Design:** Possui 4 opções diretas: `Colhemos sem derrubar a mata`, `Não usamos fogo`, `Não usamos agrotóxico`, `Reaproveitamos o que sobra`.

- **MVP:** As opções foram alteradas e expandidas para 7 itens diferentes (incluindo `Recuperamos áreas degradadas`, `Protegemos nascentes e rios`, etc.) que não constam no layout original da tela.

### 5. Elementos Inseridos Incorretamente (Não previstos)

- **MVP:** Uma seção inteira chamada `Impactos gerados (opcional)` com 7 opções de checkboxes foi adicionada à tela. Esta seção **não existe** no Design aprovado para esta etapa.

### 6. Área de Ação (Rodapé)

- **Design:** Botão `Continuar` grande (full-width), na cor verde, centralizado e preenchendo toda a largura da área do formulário.

- **MVP:** O botão `Continuar` foi encolhido e alinhado ao canto inferior direito da tela larga.

---

# 📐 Estrutura de Layout do Design em XML

Abaixo está o modelo XML estruturado referente fielmente à tela de **Sua Produção (Design Esperado)**:

```xml
<Screen name="SuaProducao">
    <Container padding="large" backgroundColor="beige-light" layout="mobile-constrained">

        <!-- Navegação Superior -->
        <Header>
            <BackButton icon="chevron-left" shape="circular" />
            <StepIndicator text="Parte 3 de 5" align="center" />
            <StatusBadge icon="check" text="Salvo" color="green" align="right" />
        </Header>

        <!-- Barra de Progresso Visual -->
        <ProgressBar totalSteps="5" currentStep="3" activeColor="green" inactiveColor="beige-dark" />

        <!-- Título Principal -->
        <Title size="h2" color="black">Sua produção</Title>

        <!-- Formulário -->
        <Form>

            <!-- Produtos (Pills / Cards Checkboxes) -->
            <InputGroup>
                <Label font="bold">
                    O que você produz? <Span font="regular" color="gray">Marque um ou mais</Span>
                </Label>
                <CheckboxPillGroup layout="wrap">
                    <CheckboxPill value="acai" selected="true" activeColor="green-light" borderColor="green-dark">Açaí</CheckboxPill>
                    <CheckboxPill value="cacau" selected="false">Cacau</CheckboxPill>
                    <CheckboxPill value="castanha" selected="false">Castanha</CheckboxPill>
                    <CheckboxPill value="cupuacu" selected="false">Cupuaçu</CheckboxPill>
                    <CheckboxPill value="andiroba" selected="false">Andiroba</CheckboxPill>
                    <CheckboxPill value="copaiba" selected="false">Copaíba</CheckboxPill>
                    <CheckboxPill value="outro" selected="false">Outro</CheckboxPill>
                </CheckboxPillGroup>
            </InputGroup>

            <!-- Produção Mensal com Sufixo -->
            <InputGroup>
                <Label font="bold">Produção mensal aproximada</Label>
                <TextInput value="8.000" suffix="kg" textAlign="left" />
                <HelperText color="gray">Uma estimativa basta. Conferimos depois.</HelperText>
            </InputGroup>

            <!-- Práticas de Manejo (Checkboxes em formato de Card) -->
            <InputGroup>
                <Label font="bold">
                    Como vocês cuidam da floresta? <Span font="regular" color="gray">Marque apenas o que praticam</Span>
                </Label>
                <CheckboxCardList gap="small">
                    <CheckboxCard selected="false">Colhemos sem derrubar a mata</CheckboxCard>
                    <CheckboxCard selected="false">Não usamos fogo</CheckboxCard>
                    <CheckboxCard selected="false">Não usamos agrotóxico</CheckboxCard>
                    <CheckboxCard selected="false">Reaproveitamos o que sobra</CheckboxCard>
                </CheckboxCardList>
            </InputGroup>

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
