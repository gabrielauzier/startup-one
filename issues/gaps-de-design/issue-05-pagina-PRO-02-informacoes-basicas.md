# 📋 issue-05 - PRO-02 · Informações básicas - Relatório de Gaps e Divergências (Design vs. MVP Final)

### 1. Estrutura Global e Layout

- **Proporção da Tela:** O Design apresenta um layout contido (estilo mobile-first) com margens laterais definidas e fundo bege claro. O MVP expande os elementos para ocupar a largura total da tela em um formato widescreen longo.

### 2. Cabeçalho e Barra de Progresso

- **Botão de Voltar:** No Design, há um botão circular com o ícone `<` (voltar) posicionado no cabeçalho superior esquerdo. No MVP, esse botão superior desapareceu e foi substituído por um link textual `Voltar` no rodapé da página.

- **Indicador de Status:** O Design centraliza o texto `Parte 1 de 5` e posiciona à direita a tag de sucesso `✓ Salvo` (com ícone e cor verde). O MVP juntou as duas informações em um texto contínuo e sem ícone no canto esquerdo: `Parte 1 de 5 · Salvo`.

- **Barra de Progresso (Steps):** O Design exibe uma barra de progresso horizontal dividida em 5 segmentos, sendo o primeiro destacado em verde. O MVP não implementou este componente visual.

### 3. Título Principal

- A cor da tipografia do título `Sobre você` difere entre as versões: no Design é aplicada a cor preta/cinza escuro, enquanto no MVP o título foi renderizado na cor verde.

### 4. Campos de Formulário e Formatação (Máscaras)

- **Comportamento e Máscaras:** O Design evidencia o uso de máscaras de formatação nos inputs, como demonstrado no campo "Telefone com WhatsApp" preenchido com o padrão `(91) 90000-0000`. O MVP carece dessa formatação visual, permitindo a entrada contínua de números sem formatação, como `99999999999999`.

### 5. Bloco de Autorização (Termo de Consentimento)

- **Estrutura Visual:** O Design encapsula o checkbox e o texto legal ("Autorizo a Îasy a usar estes dados...") dentro de um componente de _Card_ branco com bordas arredondadas e contorno sutil, destacando a área de aceite. No MVP, o bloco delimitador foi removido e os elementos (checkbox e texto) flutuam soltos sobre o fundo da tela.

### 6. Área de Ação (CTA)

- **Botão Continuar:** O Design utiliza um botão verde grande que ocupa a largura total (full-width) da área de conteúdo. No MVP, o botão foi significativamente reduzido e alinhado apenas à extremidade direita da tela.

---

# 📐 Estrutura de Layout do Design em XML

Abaixo está a representação estrutural em XML baseada estritamente no **Design esperado**:

```xml
<Screen name="InformacoesBasicas">
    <Container padding="large" backgroundColor="beige-light" layout="mobile-constrained">

        <!-- Contexto da Tela -->
        <OverlineText color="gray">PRO-02 · Informações básicas</OverlineText>

        <!-- Navegação Superior -->
        <Header>
            <BackButton icon="chevron-left" shape="circular" />
            <StepIndicator text="Parte 1 de 5" align="center" />
            <StatusBadge icon="check" text="Salvo" color="green" align="right" />
        </Header>

        <!-- Barra de Progresso Visual -->
        <ProgressBar totalSteps="5" currentStep="1" activeColor="green" inactiveColor="beige-dark" />

        <!-- Título -->
        <Title size="h2" color="black">Sobre você</Title>

        <!-- Formulário de Dados -->
        <Form>
            <InputGroup>
                <Label>Seu nome</Label>
                <TextInput value="Raimunda" />
            </InputGroup>

            <InputGroup>
                <Label>Telefone com WhatsApp</Label>
                <TextInput value="(91) 90000-0000" mask="phone" />
            </InputGroup>

            <InputGroup>
                <Label>E-mail (opcional)</Label>
                <TextInput placeholder="seu@email.com" type="email" />
            </InputGroup>

            <InputGroup>
                <Label>CNPJ</Label>
                <TextInput value="00.000.000/0001-00" mask="cnpj" />
            </InputGroup>
        </Form>

        <!-- Termo de Consentimento -->
        <AuthorizationCard border="true" borderColor="gray-light" backgroundColor="white" radius="medium">
            <Checkbox checked="false" />
            <LegalText>
                Autorizo a Îasy a usar estes dados para montar meu perfil e apresentá-lo a investidores. Posso pedir a exclusão quando quiser.
            </LegalText>
        </AuthorizationCard>

        <!-- Rodapé de Ação -->
        <Footer fixed="bottom">
            <Button variant="primary-green" fullWidth="true" size="large">
                Continuar
            </Button>
        </Footer>

    </Container>
</Screen>

```
