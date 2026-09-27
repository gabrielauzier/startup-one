# Escopo do MVP · Îasy

*Versão 2 · 26/09/2026 · atualizado a partir do protótipo do pitch (mvp/prototipo.html, 24 telas) e de mvp/telas.md. A v1 (Amazon Capital) foi aprovada pelo Gabriel em 26/09/2026; a marca Îasy, usada em todas as telas do protótipo, foi confirmada por ele na mesma data.*

Baseado nas atividades do Startup One (canvas, entrevistas com 5 produtores e 5 investidores, protótipo e feedback da validação da solução). Detalhamento em [prd-mvp.md](prd-mvp.md); o que o protótipo ainda não cobre está em [relatorio-gaps-mvp.md](relatorio-gaps-mvp.md).

## 1. Problema

Pequenos e médios produtores da bioeconomia amazônica (açaí, cacau nativo, castanha, óleos) têm demanda e capacidade produtiva, mas não conseguem capital porque não têm garantias reais nem dados organizados que comprovem produção e impacto. Do outro lado, investidores de impacto querem esses negócios, mas desistem por falta de dados confiáveis, padronizados e verificados.

O gargalo validado nas entrevistas não é falta de dinheiro: é falta de **informação confiável** entre as duas pontas. A frase do protótipo resume: "O dinheiro para investir já existe. Faltava confiança entre quem produz e quem investe."

## 2. Público-alvo do MVP

- **Oferta (produtores):** cooperativas, associações e pequenas empresas da Amazônia Legal com CNPJ, que precisam de R$ 50 mil a R$ 200 mil, usam celular e WhatsApp (internet intermitente) e têm algum registro de produção, mesmo em caderno. Entrada via cooperativas e ONGs parceiras (o cadastro pergunta quem indicou).
- **Demanda (investidores):** pessoa física qualificada, family offices e **empresas que compram ingredientes da Amazônia**. As empresas usam o mesmo fluxo do investidor, com o tipo "Represento uma empresa".

Produtor individual sem CNPJ e fundos institucionais grandes ficam para depois.

## 3. Proposta de valor

> Conectamos quem produz a quem quer investir. Organizamos e conferimos as informações de negócios amazônicos: produtores ganham credibilidade e investidores encontram negócios em que podem confiar.

O ciclo tem 4 passos, como na página inicial do protótipo:

1. **Organizar:** o produtor registra pelo celular a produção, fotos e documentos da terra ("até a foto do caderno vale").
2. **Verificar:** a equipe Îasy confere cada informação e concede o selo **Verificado Îasy**, com notas Ambiental, Social e Gestão (0 a 100).
3. **Encontrar:** o investidor responde cinco perguntas e vê primeiro os negócios alinhados ao que busca.
4. **Conectar:** o produtor decide quem acessa seus documentos; com interesse dos dois lados, a Îasy apresenta um parceiro financeiro para o contrato.

## 4. Funcionalidades essenciais

| # | Funcionalidade | O que resolve | Telas do protótipo |
|---|---|---|---|
| 1 | **Entrada e cadastro do produtor pelo celular** em 5 partes (sobre você, seu negócio, sua produção, fotos e documentos, quanto precisam), salvo a cada passo, com "quem vê o quê" explicado antes de começar | Produtor não tem ferramenta para gerar o dado que o investidor exige | T15 a T21 (PRO-01 a PRO-08) |
| 2 | **Verificação e selo** pela equipe Îasy: confere fotos e documentos, confere selos de certificadoras (Orgânico Brasil, Fair Trade, Rainforest Alliance) e dá as notas Ambiental, Social e Gestão | Investidor não confia em dado autodeclarado | Só citada em texto; telas do verificador a criar |
| 3 | **Descoberta guiada e vitrine**: 5 perguntas (o que pesa mais, perfil e valor, produtos, prazo, impacto) que ordenam os negócios por % de alinhamento, e vitrine com busca e filtros por produto e estado | Investidor não encontra negócios que batem com sua tese | T01 a T09 (COM-01, COM-02, INV-01 a INV-07) |
| 4 | **Página do negócio e documentos controlados**: abas A produção, O negócio, Quem cuida, O dinheiro e Documentos; documentos sensíveis (CAR, DAP, laudo, certificado) só com liberação da produtora, abertos só para leitura, com nome marcado e acesso registrado | Proteção de dados e confiança dos dois lados | T10 a T12 (INV-08, INV-09) e T23 (PRO-10) |
| 5 | **"Tenho interesse" e conexão**: investidor informa o valor e manda mensagem; a produtora aceita e a Îasy apresenta as partes ao parceiro financeiro, que cuida do contrato e do pagamento | Aproximar as partes sem a plataforma movimentar dinheiro | T13, T14 (INV-10, INV-11) e T24 (PRO-11) |
| 6 | **Painel do produtor**: selo e notas, visitas ao perfil, pedidos de documento e interesses recebidos | Produtor acompanha o que acontece com o seu perfil | T22 (PRO-09) |

## 5. O que fica de fora

- **Movimentar dinheiro na plataforma** (pagamento, custódia, contrato, pagamento do retorno). Exige autorização regulatória (CVM 88 ou SCD). O aviso "A Îasy não recebe nem movimenta dinheiro. O contrato e o pagamento são feitos por um parceiro financeiro autorizado." aparece no rodapé das telas-chave.
- Dashboard de impacto, portfólio, relatórios ESG e auditoria do investidor (T08 a T13 do protótipo antigo da Fase 4).
- Monitoramento por satélite (PRODES/INPE) e integração automática com certificadoras (os selos são conferidos manualmente).
- App nativo e modo offline completo (fica o cadastro salvo a cada passo).
- Integração com o site parceiro Opinião Amazônia (um link para a vitrine já basta).
- Projetos fora da Amazônia Legal, créditos de carbono e tema escuro.

## 6. Mudanças em relação à v1

| Tema | v1 | v2 (protótipo) |
|---|---|---|
| Marca e selo | Amazon Capital; "Verificado Amazon Capital" | Îasy; "Verificado Îasy" e "Nota Îasy" |
| Entrada | Login com senha ou link mágico | Página inicial com dois caminhos e entrada só com e-mail e código, sem senha |
| Perfis | Produtor e investidor | Investidor, empresa (mesmo fluxo do investidor) e produtor |
| Cadastro | Etapa 0 + 4 etapas | 5 partes, com boas-vindas e confirmação de envio |
| Notas | Ambiental, Social e Governança, com média "ESG" | Ambiental, Social e Gestão, mostradas separadas |
| Retorno | Proibido exibir retorno | O produtor informa um **retorno proposto ao ano**, mostrado como ponto de partida; o valor final é definido com o parceiro |
| Progresso | Proibida barra de "captado" | Barra "Interesse de investidores: R$ X de R$ Y", que soma interesses, não dinheiro |
| Linguagem | "Projeto", "Manifestar interesse", "Meta de captação" | "Negócio", "Tenho interesse", "Busca R$ X" / "Quanto vocês precisam" |

## 7. Métricas de sucesso

Metas propostas para os primeiros 90 dias de piloto (a calibrar):

| Métrica | Meta | Por quê |
|---|---|---|
| Produtores com cadastro completo e verificado | 10 | Vitrine mínima com oferta real |
| Taxa de conclusão do cadastro do produtor | ≥ 60% | Valida que o celular resolve a coleta de dados |
| Investidores que concluem as 5 perguntas | 30 | Demanda real para a vitrine |
| Interesses enviados ("Tenho interesse") | ≥ 10 | Sinal central de valor para o investidor |
| Interesses aceitos que chegam ao parceiro financeiro | ≥ 3 | Prova de que a informação destrava o capital |
| Tempo da verificação por negócio | ≤ 5 dias úteis | Promessa feita ao produtor na tela "Cadastro enviado" |

**Métrica norte:** número de interesses enviados em negócios verificados.

## 8. Pontos em aberto

1. **Retorno proposto na vitrine:** validar com um advogado se exibir "Retorno proposto 14,8% ao ano" em página aberta caracteriza oferta pública.
2. **Parceiro financeiro:** qual banco, fintech ou plataforma CVM 88 formaliza os contratos.
3. **Quem verifica:** equipe interna no início; cooperativas e ONGs credenciadas depois.
4. **Receita no MVP:** não cobrar no piloto e testar a disposição a pagar (ver analise-financeira.md).
