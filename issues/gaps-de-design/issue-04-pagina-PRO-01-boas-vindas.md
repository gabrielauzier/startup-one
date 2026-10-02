# Issue 04 - PRO-01 · Boas-vindas - Relatório de Gaps e Divergências (Design vs. MVP Final)

Com base na comparação entre a primeira imagem (**Design Esperado**) e a segunda imagem (**MVP Final**), elaborei o **Relatório de Gaps e Divergências** e a **Estrutura de Layout XML Modelo** fiel ao Design.

### 1. Cabeçalho e Títulos

- **Identidade Visual e Logo:**
- **Design:** Exibe o logo da Îasy (ícone de lua crescente e texto) no canto superior esquerdo.

- **MVP:** O logo e a barra superior foram totalmente omitidos.

- **Badge Inicial:**
- **Design:** Possui uma tag com fundo laranja claro e texto `Gratuito para produtores` acima do título.

- **MVP:** A tag foi removida/não implementada.

- **Título Principal (Copywriting):**
- **Design:** O título é `Mostre o que você produz e seja encontrado por quem quer investir.` na cor preta.

- **MVP:** O título foi alterado para `Seja bem-vinda à Îasy` na cor verde, e foi adicionado um subtítulo não previsto no design original (`Um cadastro simples, pelo celular...`).

### 2. Lista de Benefícios

- **Ícones e Formatação:**
- **Design:** Utiliza ícones de _check_ (✓) na cor verde ao lado de cada item da lista.

- **MVP:** Adicionou um cabeçalho não previsto (`O que você ganha`) na cor verde e substituiu os ícones de check por _bullet points_ (bolinhas pretas) padrão.

- **Divergência de Texto:**
- **Design:** Textos curtos e diretos (ex: `Perfil verificado, que transmite confiança`, `Cerca de 10 minutos, pelo celular`, `Tudo fica salvo a cada passo`).

- **MVP:** Os textos foram reescritos e alongados (ex: `Um perfil verificado que mostra seus dados de forma organizada`, `Visibilidade para investidores...`, `Nenhum custo para se cadastrar...`).

### 3. Seção "Quem vê o quê" (Card de Informação)

- **Estrutura Visual e Componente:**
- **Design:** Construído como um _Card_ destacado (fundo branco, bordas arredondadas com linha cinza) contendo o título internamente.

- **MVP:** O Card foi desconstruído. O título virou um cabeçalho solto na página e não há bordas ou fundo destacado.

- **Organização da Informação:**
- **Design:** Dividido em três blocos hierárquicos com rótulos coloridos indicando o nível de privacidade: `Quem investe vê` (verde), `Apenas com sua autorização` (azul) e `Ninguém vê` (vermelho).

- **MVP:** A separação visual e as cores foram removidas. O texto foi aglutinado em um único parágrafo corrido, dificultando a leitura dinâmica.

### 4. Formulário e Interação

- **Botões de Seleção (Radio Buttons):**
- **Design:** Os botões "Sim" e "Não" são _Cards selecionáveis_ largos. O item selecionado ("Sim") ganha preenchimento verde claro e borda verde escura, com o círculo de seleção (radio) à esquerda.

- **MVP:** Os botões foram transformados em pequenas pílulas (pill buttons) brancas com bordas arredondadas simples, perdendo o estado de destaque planejado para a seleção ativa.

- **Campo Condicional (Dropdown):**
- **Design:** Ao marcar "Sim" para a cooperativa, exibe um rótulo `Qual?` seguido de um campo de seleção (Dropdown) com o placeholder `[Nome da cooperativa ou ONG]` e uma seta indicativa.

- **MVP:** O campo condicional e seu respectivo rótulo estão **ausentes** da interface.

---

# 📐 Estrutura de Layout do Design em XML

Abaixo está o modelo XML estruturado que reflete rigorosamente a arquitetura do **Design esperado** (Imagem 1):

```xml
<Screen name="OnboardingProdutor">
    <Container padding="large" backgroundColor="beige-light">

        <!-- Cabeçalho -->
        <Header>
            <Logo icon="moon" text="Îasy" />
        </Header>

        <!-- Seção de Título e Chamada -->
        <HeroSection>
            <Badge variant="light-orange">Gratuito para produtores</Badge>
            <Title size="h1" color="black">
                Mostre o que você produz e seja encontrado por quem quer investir.
            </Title>
        </HeroSection>

        <!-- Lista de Benefícios -->
        <BenefitsList>
            <ListItem icon="check-green">Perfil verificado, que transmite confiança</ListItem>
            <ListItem icon="check-green">Cerca de 10 minutos, pelo celular</ListItem>
            <ListItem icon="check-green">Tudo fica salvo a cada passo</ListItem>
        </BenefitsList>

        <!-- Card de Privacidade "Quem vê o quê" -->
        <Card variant="outlined" borderColor="gray-light" backgroundColor="white">
            <CardHeader>
                <Title size="h3">Quem vê o quê</Title>
            </CardHeader>
            <CardBody>
                <InfoBlock>
                    <Label color="green">Quem investe vê</Label>
                    <Description>Nome do negócio, cidade, o que você produz, fotos e quanto precisa.</Description>
                </InfoBlock>

                <InfoBlock>
                    <Label color="blue">Apenas com sua autorização</Label>
                    <Description>Documentos da terra (CAR, DAP), laudos e certificados.</Description>
                </InfoBlock>

                <InfoBlock>
                    <Label color="red">Ninguém vê</Label>
                    <Description>Seu CPF, telefone e e-mail.</Description>
                </InfoBlock>
            </CardBody>
        </Card>

        <!-- Formulário Condicional -->
        <FormSection>
            <Label>Chegou até nós por uma cooperativa ou ONG?</Label>
            <RadioCardGroup name="origem_cooperativa">
                <RadioCard value="sim" selected="true" activeColor="green-light">Sim</RadioCard>
                <RadioCard value="nao" selected="false">Não</RadioCard>
            </RadioCardGroup>

            <!-- Renderizado condicionalmente se value == "sim" -->
            <ConditionalField condition="origem_cooperativa == 'sim'">
                <Label>Qual?</Label>
                <SelectDropdown placeholder="[Nome da cooperativa ou ONG]" icon="chevron-down" />
            </ConditionalField>
        </FormSection>

        <!-- Rodapé / CTA -->
        <Footer fixed="bottom">
            <Button variant="primary-green" fullWidth="true" size="large">
                Começar cadastro
            </Button>
        </Footer>

    </Container>
</Screen>

```
