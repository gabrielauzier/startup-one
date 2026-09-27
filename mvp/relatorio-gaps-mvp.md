# Relatório de gaps do MVP · Îasy

26/09/2026 · @Gabriel · versão 2, comparando o protótipo do pitch (mvp/prototipo.html, 24 telas) com o PRD 2.0

O protótipo do pitch fechou a maior parte dos gaps da versão anterior: a página do negócio, o formulário de interesse, os documentos com liberação, o visualizador, o cadastro do começo ao envio e o painel do produtor agora existem, com a marca Îasy. Faltam 7 telas (verificador, código de acesso, termos, revisão do cadastro e lista de interesses) e alguns comportamentos, e o protótipo é só visual: nenhum campo, filtro ou aba funciona.

## O que o protótipo resolveu

| Gap da versão 1 | Como está agora |
| --- | --- |
| Página do projeto só existia como modal | T10 é uma página completa, com cabeçalho, abas e lateral de interesse |
| Sem modal de interesse | T13 com valor, mensagem e confirmação de que não é investimento |
| Cadastro sem início (T14) nem confirmação (T19) | Boas-vindas com "Quem vê o quê" (T15), parte "Sobre você" com CNPJ (T16) e "Cadastro enviado" (T21) |
| Sem visualizador de documento | T12 com marca d'água, sem download e acesso registrado |
| Sem solicitação e liberação de documentos | T11 mostra as 5 situações; T23 deixa a produtora liberar ou recusar |
| Sem aceite do produtor | T24 com "Aceitar e seguir" |
| Sem painel do produtor | T22 com selo, notas, visitas, pedidos e interesses |
| Sem login | T02 com escolha de perfil e e-mail sem senha |
| Marca BioRaiz, "Investir agora", "captado" | Marca Îasy em tudo; nenhuma ocorrência de BioRaiz, "Investir agora" ou "captado" |
| Menu do investidor com dashboard e auditoria | Menu "Descobrir · Negócios · Meus interesses" |
| Descoberta sem Voltar e com progresso errado | Todas as perguntas têm "Pergunta N de 5" e Voltar |
| Tipo de organização sem opções | Cooperativa, Associação e Pequena empresa |
| Selos de certificadoras sem origem | O produtor envia os selos na parte 4 e eles aparecem "conferidos pela Îasy" |

## Telas que faltam

| Tela | Perfil | O que precisa ter | Para quando |
| --- | --- | --- | --- |
| T25 Código de acesso | Todos | Campo de 6 dígitos e "Reenviar código"; hoje "Entrar" leva direto para a descoberta | Fase 1 |
| T27 Revisar e corrigir (PRO-07) | Produtor | Resumo antes de enviar e, em ajuste pedido, só os campos marcados com o comentário da equipe; o código PRO-07 está vago no protótipo | Fase 1 |
| T29 Fila de verificação | Verificador | Negócios por data de entrada, dias úteis em verde, amarelo ou vermelho, responsável | Fase 1 |
| T30 Análise do negócio | Verificador | Dados e evidências lado a lado, checklist, conferência dos selos, notas A/S/G, Aprovar, Pedir ajuste, Reprovar, histórico | Fase 1 |
| T26 Termos e privacidade | Todos | Termos de Uso, Política de Privacidade e aceite do investidor no primeiro acesso | Antes do piloto |
| T28 Meus interesses | Investidor | Todos os interesses e pedidos de documento com situação, editar e cancelar; o menu já tem o item, mas só existe a tela de um interesse enviado | Fase 2 |
| T31 Conexões | Verificador | Interesses aceitos, "Apresentar ao parceiro", etapa e observações | Fase 2 |

## Comportamentos sem desenho

| Comportamento | Regra no PRD | O que falta no protótipo |
| --- | --- | --- |
| Impactos do negócio | RN-24, RF-08 | A parte 3 do cadastro não pergunta os impactos, mas o alinhamento compara os impactos da pergunta 5 do investidor. Incluir as 7 opções em T18 |
| Recebe visitas | RN-25 | Os resultados filtram por "Recebe visitas" e a página mostra a etiqueta, mas o cadastro não pergunta. Incluir em T17 |
| Recusar interesse | RN-39 | T24 só tem "Aceitar e seguir" |
| Retirar acesso a documento | RN-33 | O visualizador diz que a produtora pode retirar o acesso, mas T23 não tem essa opção para pedidos já liberados |
| Laudo e certificado completo | RF-25 | A aba Documentos lista laudo ambiental e certificado completo, mas o cadastro só recebe fotos, documento da terra e selos. Falta onde a produtora envia documentos adicionais |
| Resumo do negócio | RN-32 | Aparece como "Aberto a todos", mas não está definido se é um PDF gerado ou a própria aba |
| Abas O negócio, Quem cuida e O dinheiro | RN-30 | Só "A produção" tem conteúdo |
| Documento da terra enviado depois | RN-08 | T19 aceita mandar depois, mas o painel não mostra essa pendência |
| Indicador sem conexão | RN-07 | O cabeçalho mostra "Salvo", mas não há estado "Salvo no celular" nem faixa de sem internet |
| Editar ou cancelar interesse | RN-37 | Sem "Ver meu interesse" na página depois do envio |
| Suspensão e ajuste pedido | RN-14, RN-21 | Nenhuma tela mostra os estados Em análise, Ajuste solicitado, Suspenso ou Expirado |
| Estados de tela | PRD 6.5 | Nenhuma tela tem carregando, vazio, erro ou sem permissão |
| Avisos | RN-41 | Os modelos de e-mail e de WhatsApp não existem |

## Correções nas telas existentes

| Tela | O que está hoje | O que ajustar |
| --- | --- | --- |
| T01 Página inicial | Título do bloco final "Ajudamos a mostrar produtores de confiança e aos nossos investidores." | Frase truncada; sugestão: "Ajudamos produtores de confiança a serem encontrados por investidores." |
| T15 Boas-vindas | "Ninguém vê: seu CPF, telefone e e-mail" | O cadastro não pede CPF; trocar para "seu telefone e e-mail" ou incluir o CPF em T16 |
| T18 e T10 | T18 marca só "Colhemos sem derrubar a mata", mas T10 mostra as 4 práticas | Alinhar os dados de exemplo |
| T03 a T10 | Canto direito mostra "Entrar" mesmo depois da descoberta; de T11 em diante aparece "Helena · Investidora" | Na demo, mostrar o avatar a partir de T08, ou deixar claro que a entrada acontece antes de T11 |
| T06 Pergunta 4 | "Qual prazo de retorno faz sentido para você?" | "Em quanto tempo o negócio pode devolver?" evita repetir "retorno" (RN-04) |
| T08 e T09 | Todos os cards levam ao mesmo negócio | Aceitável na demo; no produto cada card abre o seu negócio |
| Todas as telas | Barra "Visualizar como Investidor/Produtor" | Só para a demo; sai do produto |
| Selects | Produto, Estado, UF, Prazo e "Qual?" têm uma opção só | Preencher as opções para a demo não travar |

A soma de interesses está coerente: o investidor vê R$ 15 mil antes de enviar (só o interesse aceito do Marcos) e a produtora vê R$ 95 mil depois (R$ 15 mil + R$ 80 mil da Helena), o que segue a regra RN-29.

## Ponto de atenção: retorno proposto

O PRD 1.0 proibia mostrar retorno. O protótipo mostra "Retorno proposto 14,8% ao ano" em todos os cards e na página do negócio, aberta a visitantes, e o PRD 2.0 adotou isso com o rótulo "proposto" e a explicação de que o valor final é definido com o parceiro. Um advogado precisa confirmar que isso não caracteriza oferta pública; se não passar, a alternativa é mostrar o retorno só na aba O dinheiro, com login.

## Prioridade

Para o pitch de 28/09 o protótipo já basta. Ajustes rápidos que melhoram a demo:

1. Corrigir a frase truncada de T01 e o "CPF" de T15.
2. Alinhar as práticas de T18 com T10.
3. Preencher as opções dos selects.

Depois do pitch, na ordem da Fase 1:

1. Desenhar T29 e T30, porque a verificação é o diferencial da proposta de valor e ainda não tem tela.
2. Desenhar T25 e T27 para fechar entrada e cadastro.
3. Incluir impactos e "Recebe visitas" no cadastro, e "Recusar" e "Retirar acesso" nas telas da produtora.

## Fontes

- Protótipo do pitch: mvp/prototipo.html (24 telas, códigos COM, INV e PRO)
- Lista de telas: mvp/telas.md (T01 a T24)
- PRD 2.0: mvp/prd-mvp.md
- Escopo v2: mvp/escopo-mvp.md
- Validação da solução: startup-one/atividades/Fase5-Cap8-atividade-validando-a-solucao.md
