# Relatório de gaps entre o design e o MVP final

30/09/2026 · @Gabriel · versão 1, comparando o protótipo do pitch (mvp/prototipo.html, 24 telas) com o MVP final construído (mvp/index.html, 24 telas)

O MVP final apresenta algumas diferenças em relação ao protótipo do pitch, tanto em termos de layout quanto de funcionalidades implementadas. A seguir, detalhamos os principais gaps identificados.

## Gaps de layout geral

Gaps que afetam todo o site.

1. **Cabeçalho/navegação**: No protótipo, o cabeçalho incluía um menu de navegação completo com logo, links para todas as seções principais e botão de entrar. No MVP final, o cabeçalho está completamente ausente, o que não permite navegação nem acesso rápido ao login.

A visão para cada um dos perfis é diferente. 
- **Anônimo/público:** Como funciona, Negócios verificados e Para produtores.
- **Investidor:** Descobrir, Negócios verificados e Meus interesses.
- **Produtor:** Início, Pedidos, Interesses.

A visão mobile possui uma navegação diferente da versão desktop, com um menu inferior fixo, sempre visível, permitindo acesso rápido às principais seções do site.

2. **Banner/aviso legal**: No protótipo, havia um banner de aviso legal visível na parte inferior  da página, com texto "A Îasy não recebe nem movimenta dinheiro. O contrato e o pagamento são feitos por um parceiro financeiro autorizado.". O banner deve ser fixo na tela, sempre visível independentemente do scroll. No MVP final, a mensagem existe, porém, em formato de texto como rodapé, se movimentando de acordo com o scroll.

## Gaps por página

### 1. Página Inicial

- **Card de Negócio:** No design do protótipo, a página inicial exibia um card de projeto em destaque, ao lado das informações no hero. No MVP final, esse card não está presente, deixando o hero como único elemento de destaque na página inicial.

### 2. Página de Descobrir

- **Questionário:** O layout do questionário no MVP final está completamente simplificado. Não apresenta o multistep wizard como no protótipo (ex: Pergunta 1 de 5) com componente de progress multistep. Além disso, o questionário está com radio buttons e checkboxes simples, sem estilização. 

Analise viabilidade de uso do componente Questionnaire da shadcnui. 

https://ui.shadcn.com/docs/components/base/questionnaire

