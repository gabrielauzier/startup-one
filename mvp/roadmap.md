# Roadmap do MVP · Îasy

*27/09/2026 · @Gabriel · versão 1. Baseado em [escopo-mvp.md](escopo-mvp.md) (v2), [prd-mvp.md](prd-mvp.md) (2.0), [relatorio-gaps-mvp.md](relatorio-gaps-mvp.md) (v2), na Análise Financeira de 26/09/2026 e nas atividades do Startup One. Datas depois do pitch são propostas e partem do cronograma da seção 8.4 da PRD.*

## Resumo

A Îasy terminou a fase de descoberta e desenho: o problema foi validado com 10 entrevistas, a solução foi testada com um protótipo e o protótipo do pitch (24 telas) já reflete o que aprendemos. Nada foi construído ainda em código. O caminho proposto é:

| Etapa | Período | Resultado esperado |
| --- | --- | --- |
| **Pitch** | até 28/09/2026 | Demo com o protótipo navegável e este roadmap no slide de Roadmap |
| **Preparação** | 29/09 a 04/10/2026 | Repositório, banco e telas que faltam desenhadas; advogado e parceiro financeiro em conversa |
| **Fase 1: oferta** | 05/10 a 01/11/2026 | Produtor se cadastra pelo celular e a equipe verifica e dá o selo |
| **Fase 2: demanda e conexão** | 02/11 a 15/11/2026 | Investidor descobre, vê documentos com liberação e manda interesse |
| **Piloto** | 16/11/2026 a 13/02/2027 | 90 dias com produtores e investidores reais, sem cobrança |
| **Decisão pós-piloto** | fevereiro de 2027 | Seguir, ajustar ou pivotar, com base nas métricas da seção 4 |
| **Escala e receita** | 2027 | Cobrança, verificadores parceiros e automações |

A métrica norte é o **número de interesses enviados em negócios verificados**.

## 1. O que já foi feito

### 1.1 Linha do tempo

| Etapa do Startup One | O que produzimos | Principal aprendizado |
| --- | --- | --- |
| Fase 2 · Identificando oportunidades | Escolha do problema entre 3 candidatos: acesso a investimento para pequenos produtores da Amazônia | O problema tem dor dos dois lados (produtor e investidor) |
| Fase 2 · Validando o problema | TAM/SAM/SOM, matriz CSD e entrevistas com 5 produtores e 5 investidores | O gargalo é **informação confiável**, não dinheiro. Investidores não aceitam retorno abaixo da Selic. Produtores usam celular e WhatsApp, mas não sistemas complexos. Tickets de R$ 50 mil a R$ 200 mil |
| Fase 3 · Canvas | Canvas de proposta de valor e Business Model Canvas | Receita por assinatura, verificação, intermediação e parcerias |
| Fase 4 · Prototipação | Primeiro protótipo (T01 a T18, marca BioRaiz) | Descoberta guiada em 5 passos, vitrine, cadastro do produtor pelo celular |
| Fase 5 · Validando a solução | Testes do protótipo com usuários | Descoberta foi intuitiva; selos muito valorizados; não ficou claro se o aporte era investimento ou financiamento; documentos sensíveis só em área logada e sem download |
| Fase 5 · Viabilidade financeira | Análise Financeira com 7 fontes de receita e projeção de 3 anos | Piloto sem cobrança; receita estimada de R$ 247 mil no ano 1, equilíbrio no ano 3; necessidade de capital de cerca de R$ 500 mil |
| Documentação do MVP (26/09) | Escopo v2, PRD 2.0 e relatório de gaps v2 | 30 histórias (24 obrigatórias), regras de negócio com critérios de aceite, handoff de design, modelo de dados e cronograma |
| Protótipo do pitch | 24 telas navegáveis com a marca Îasy | Fechou a maior parte dos gaps do primeiro protótipo |

### 1.2 Decisões já tomadas

| Decisão | Por quê |
| --- | --- |
| A Îasy **só faz a conexão**; contrato e pagamento ficam com um parceiro financeiro autorizado | Movimentar dinheiro exige autorização CVM 88 ou SCD; responde à confusão "investimento ou financiamento" da validação |
| Marca Îasy, selo "Verificado Îasy" e notas Ambiental, Social e Gestão | Confirmado pelo Gabriel em 26/09/2026 |
| Perfis investidor, empresa compradora (mesmo fluxo) e produtor | Empresas que compram ingredientes amazônicos são demanda natural |
| Entrada só com e-mail e código, sem senha | Menos atrito para os dois lados |
| Stack Next.js + Supabase + Vercel | Velocidade e custo zero até o piloto |
| Verificação manual pela equipe no piloto | Não há volume que justifique automação; o selo é o diferencial |
| Piloto de 90 dias sem cobrança | Primeiro provar valor, depois testar disposição a pagar |

### 1.3 Situação por módulo

O protótipo é só visual: nenhum campo, filtro ou aba funciona. "Desenhado" quer dizer que a tela existe no protótipo; "especificado" quer dizer que há regras e critérios de aceite na PRD.

| Módulo (PRD) | Desenhado | Especificado | Construído | O que falta desenhar |
| --- | --- | --- | --- | --- |
| M1 · Entrada e acesso | Parcial | Sim | Não | T25 Código de acesso, T26 Termos |
| M2 · Cadastro do produtor | Quase tudo | Sim | Não | T27 Revisar e corrigir; impactos e "Recebe visitas" |
| M3 · Verificação e selo | **Não** | Sim | Não | T29 Fila e T30 Análise do verificador |
| M4 · Descoberta e vitrine | Sim | Sim | Não | Opções dos selects |
| M5 · Página do negócio e documentos | Parcial | Sim | Não | Abas O negócio, Quem cuida e O dinheiro; retirar acesso |
| M6 · Interesse | Parcial | Sim | Não | T28 Meus interesses; recusar interesse |
| M7 · Conexão com o parceiro | Parcial | Sim | Não | T31 Conexões |

O ponto mais frágil é a verificação: é o diferencial da proposta de valor e ainda não tem tela.

## 2. Próximos passos

### 2.1 Até o pitch (28/09/2026)

O protótipo já basta para a demo. Ajustes rápidos, do relatório de gaps:

- [ ] Corrigir a frase truncada da página inicial (T01) e o "CPF" das boas-vindas (T15).
- [ ] Alinhar as práticas de T18 com as de T10.
- [ ] Preencher as opções dos selects para a demo não travar.
- [ ] Usar a seção 5 deste documento no slide de Roadmap.

### 2.2 Preparação (29/09 a 04/10/2026)

| Frente | Entrega | Por que antes da Fase 1 |
| --- | --- | --- |
| Produto | Desenhar T25, T26, T27, T29 e T30; incluir impactos e "Recebe visitas" no cadastro | A Fase 1 constrói exatamente essas telas |
| Tecnologia | Repositório, projeto Supabase, migração inicial das tabelas da PRD 7.3, RLS básico, deploy na Vercel | Evita perder a primeira semana com infraestrutura |
| Jurídico | Levar ao advogado o "Retorno proposto" em página aberta, o rodapé de conexão e o rascunho dos termos | A resposta muda a página do negócio (Fase 2) |
| Parceiro financeiro | Listar e contatar 3 a 5 candidatos (plataformas CVM 88, fintechs de crédito rural, bancos de fomento) | É o elo que transforma interesse em contrato |
| Oferta | Contatar cooperativas e ONGs para indicar os 10 a 15 primeiros produtores | O cadastro precisa de gente real no dia 16/11 |

### 2.3 Fase 1: oferta verificada (05/10 a 01/11/2026)

Objetivo: um produtor real consegue se cadastrar pelo celular e sair com o selo Verificado Îasy.

| Semana | Entrega | Telas |
| --- | --- | --- |
| 05/10 a 11/10 | Entrada com código por e-mail, perfis, termos com aceite, esqueleto das telas e tokens visuais | T02, T25, T26 |
| 12/10 a 18/10 | Cadastro do produtor em 5 partes, salvo a cada passo, com fotos e documentos no Storage privado | T15 a T21 |
| 19/10 a 25/10 | Revisão antes de enviar, estados do negócio (Em análise, Ajuste solicitado, Verificado), fila do verificador | T27, T29 |
| 26/10 a 01/11 | Análise do verificador com checklist, notas A/S/G e selo; painel do produtor básico; e-mails de aviso; testes ponta a ponta | T30, T22 |

**Pronto quando:** 3 negócios de teste passam do cadastro ao selo sem ajuda da equipe no celular, e os critérios de aceite de RN-01 a RN-21 passam.

### 2.4 Fase 2: demanda e conexão (02/11 a 15/11/2026)

Objetivo: um investidor encontra um negócio verificado, vê os documentos com liberação e manda interesse; a produtora aceita e a equipe apresenta ao parceiro.

| Semana | Entrega | Telas |
| --- | --- | --- |
| 02/11 a 08/11 | Descoberta com cálculo de alinhamento, vitrine com busca e filtros, página do negócio com as 5 abas, pedido e liberação de documentos, visualizador com marca d'água | T01, T03 a T12, T23 |
| 09/11 a 15/11 | "Tenho interesse", aceitar ou recusar, meus interesses, conexões do verificador, rotinas diárias (expiração e lembretes), modelos de WhatsApp | T13, T14, T24, T28, T31 |

**Pronto quando:** o fluxo completo roda ponta a ponta com dados reais e os critérios de aceite de RN-22 a RN-41 passam.

A Fase 2 tem só duas semanas e é o trecho mais apertado. Se atrasar, estes itens saem do piloto e viram tarefa manual da equipe, nesta ordem:

1. Editar e cancelar interesse (o investidor pede por e-mail).
2. Expiração e suspensão automáticas (a equipe faz pelo painel).
3. Filtro "Com selo de certificadora" e "Recebe visitas".
4. Aba O dinheiro detalhada (fica o resumo).

Não saem: verificação com selo, liberação de documentos, "Tenho interesse" e o aviso de que a Îasy não movimenta dinheiro.

### 2.5 Piloto (16/11/2026 a 13/02/2027)

**Critérios para abrir o piloto:**

- Parecer do advogado sobre o "Retorno proposto" (se vetar, o retorno vai para a aba O dinheiro, só com login).
- Termos de Uso e Política de Privacidade publicados.
- Pelo menos 5 produtores indicados e prontos para cadastrar.
- Parceiro financeiro fechado, ou o plano B assumido: a Îasy entrega o contato entre as partes e registra a conversa.

**Pontos de controle:**

| Marco | Data | O que olhar | Se estiver abaixo |
| --- | --- | --- | --- |
| Dia 30 | 16/12/2026 | Cadastros iniciados e concluídos, tempo de verificação, primeiros investidores na descoberta | Mais indicação via cooperativas; simplificar a parte do cadastro onde mais se desiste |
| Dia 60 | 14/01/2027 | Negócios verificados na vitrine, pedidos de documento, primeiros interesses | Rodada de divulgação com investidores (Opinião Amazônia, redes de impacto); rever o cálculo de alinhamento |
| Dia 90 | 13/02/2027 | Todas as metas da seção 4.2 e entrevistas de disposição a pagar | Decisão pós-piloto (seção 3.1) |

Dezembro e janeiro têm festas e férias, o que tende a baixar a atividade de investidores. Vale concentrar a captação de investidores em novembro e na segunda metade de janeiro.

### 2.6 Rotina durante o piloto

- **Semanal:** reunião curta com o painel de métricas, fila de verificação e interesses parados.
- **Quinzenal:** 2 a 3 conversas com produtores e investidores ativos sobre o que travou.
- **Mensal:** atualização do roadmap e dos documentos do MVP.

## 3. Planejamento futuro

### 3.1 Decisão pós-piloto (fevereiro de 2027)

| Cenário | Sinal | Próximo passo |
| --- | --- | --- |
| **Seguir** | Metas da seção 4.2 batidas e pelo menos 1 negociação com o parceiro | Começar a cobrança (seção 3.3) e buscar capital de cerca de R$ 500 mil |
| **Ajustar** | Oferta forte, mas pouco interesse (ou o contrário) | Dobrar a aposta no lado fraco: mais investidores e empresas compradoras, ou mais cooperativas |
| **Pivotar** | Interesse existe, mas nenhum vira negociação | Testar a Îasy como ferramenta de verificação vendida a quem já financia (bancos, fintechs, compradores), sem vitrine |

### 3.2 Evolução do produto em 2027

| Período | Tema | Entregas | Origem |
| --- | --- | --- | --- |
| 1º trimestre | Estabilizar | Corrigir o que o piloto mostrou; automação dos avisos por WhatsApp; indicador sem conexão no cadastro | PRD 7.2, gaps |
| 2º trimestre | Escalar a verificação | Credenciar cooperativas e ONGs como verificadoras; checklist por produto | PRD 8.5, risco "verificação não escala" |
| 2º trimestre | Receita | Cobrança da verificação e da assinatura Pro (seção 3.3) | Análise Financeira |
| 3º trimestre | Investidor que já investiu | Acompanhamento do negócio depois da conexão: dashboard de impacto, relatórios ESG, portfólio | Protótipo da Fase 4 (T08 a T13 antigas), feedback da validação |
| 3º trimestre | Empresas compradoras | Plano corporativo, rastreabilidade dos fornecedores | Análise Financeira (ano 2) |
| 4º trimestre | Dados e integrações | Monitoramento por satélite (PRODES/INPE), integração com certificadoras, integração com o parceiro financeiro | Escopo v2, seção 5 |
| 2028 em diante | Ampliar o público | Produtor sem CNPJ, fundos institucionais, app nativo com modo offline, produtos de dados | Escopo v2, seção 5 |

Continua fora do roadmap, até decisão contrária: a Îasy movimentar dinheiro diretamente. Se um dia fizer sentido, o caminho é virar ou se associar a uma plataforma CVM 88.

### 3.3 Monetização

Pela Análise Financeira, a ordem proposta é:

1. **Verificação e selo** (R$ 1.500 a R$ 1.800 por negócio ao ano), pago pelo produtor ou subsidiado por cooperativas e fomento.
2. **Assinatura Pro** para investidores (R$ 149 por mês) e **Family Office** (R$ 990 por mês).
3. **Participação de 2% a 2,5%** paga pelo parceiro financeiro sobre contratos fechados, nunca cobrada do investidor pela Îasy.
4. **Plano corporativo** para empresas compradoras (R$ 4 mil a R$ 5 mil por mês), a partir do ano 2.

Esses valores são estimativas. O piloto precisa testar a disposição a pagar nas entrevistas do dia 90 antes de qualquer cobrança.

## 4. Métricas de sucesso e indicadores de progresso

### 4.1 Métrica norte

**Interesses enviados em negócios verificados.** Ela só cresce quando os dois lados funcionam: existe oferta verificada (produtor) e ela desperta interesse real (investidor).

### 4.2 Metas do piloto (90 dias)

As metas vêm do escopo v2 e da PRD 8.1. Os eventos já estão nomeados na PRD.

| Etapa do funil | Métrica | Meta | Como medir |
| --- | --- | --- | --- |
| Oferta | Produtores com cadastro verificado | 10 | `businesses` com status Verificado |
| Oferta | Conclusão do cadastro | ≥ 60% | `cadastro_enviado` ÷ `cadastro_iniciado` |
| Oferta | Tempo de verificação por negócio | ≤ 5 dias úteis | Média de RN-16 |
| Demanda | Investidores que concluem as 5 perguntas | 30 | `descoberta_concluida` com login |
| Conexão | Interesses enviados (**norte**) | ≥ 10 | `interests` criados |
| Resultado | Interesses que chegam a negociação com o parceiro | ≥ 3 | `connection_events` em Em negociação |

### 4.3 Indicadores de acompanhamento

São sinais antecipados: mostram se o funil está no caminho antes das metas finais. As metas marcadas "proposta" não constam da PRD e devem ser calibradas no dia 30.

| Indicador | O que revela | Meta (proposta) |
| --- | --- | --- |
| Parte do cadastro onde mais se desiste | Onde simplificar o cadastro | Nenhuma parte com mais de 20% de abandono |
| Negócios devolvidos com ajuste pedido | Clareza do cadastro e do checklist | ≤ 50% na primeira análise |
| Visitas a páginas de negócio por investidor ativo | Se a vitrine desperta curiosidade | ≥ 3 |
| Pedidos de documento por negócio verificado | Interesse sério antes do "Tenho interesse" | ≥ 2 |
| Pedidos de documento liberados pela produtora | Confiança do produtor na plataforma | ≥ 70% |
| Tempo até a produtora responder a um interesse | Se os avisos por WhatsApp funcionam | ≤ 3 dias |
| Interesses aceitos pela produtora | Qualidade do alinhamento | ≥ 50% |
| Investidores que voltam em 30 dias | Se há valor além da primeira visita | ≥ 30% |
| Participantes que pagariam pelo serviço | Viabilidade da receita | Medido nas entrevistas do dia 90 |

### 4.4 Indicadores de progresso da construção

Para as Fases 1 e 2, o avanço se mede pelo que funciona, não pelo que foi codado.

| Indicador | Hoje | Fim da Fase 1 | Fim da Fase 2 |
| --- | --- | --- | --- |
| Telas desenhadas (de 31) | 24 | 31 | 31 |
| Telas funcionando (de 31) | 0 | 14 (M1 a M3) | 31 |
| Histórias obrigatórias entregues (de 24) | 0 | as de M1 a M3 | 24 |
| Regras de negócio com critérios de aceite passando | 0 | RN-01 a RN-21 | RN-01 a RN-41 |
| Fluxos ponta a ponta automatizados | 0 | Cadastro até selo | Cadastro até conexão |
| Negócios reais cadastrados | 0 | 3 de teste | 5 prontos para o piloto |

Os números por fase são estimativas a partir do inventário de telas da PRD 6.2.

### 4.5 Metas do negócio (anos 1 a 3)

Da Análise Financeira, como referência para investidores e bancas. Todas são estimativas a validar no piloto.

| Ano | Receita | Resultado |
| --- | --- | --- |
| 1 | R$ 247 mil | −R$ 55 mil |
| 2 | R$ 1,04 milhão | −R$ 64 mil |
| 3 | R$ 2,84 milhões | +R$ 530 mil |

## 5. Versão para o slide de Roadmap

> **Hoje:** problema validado com 10 entrevistas, solução testada, protótipo com 24 telas.
> **Out a nov/2026:** construção do MVP (cadastro e verificação, depois vitrine e conexão).
> **Nov/2026 a fev/2027:** piloto de 90 dias com 10 negócios verificados e 30 investidores.
> **2027:** cobrança da verificação e da assinatura, verificadores parceiros, acompanhamento de impacto.
> **Depois:** satélite, certificadoras integradas e produtos de dados.
> **Métrica norte:** interesses enviados em negócios verificados.

## 6. Riscos que podem mudar o roadmap

| Risco | Efeito no roadmap | Resposta |
| --- | --- | --- |
| Advogado vetar o "Retorno proposto" em página aberta | Muda a página do negócio na Fase 2 | Retorno só na aba O dinheiro, com login |
| Nenhum parceiro financeiro até o piloto | Conexões param em "Aceita" | Plano B: troca de contato registrada; continuar buscando em paralelo |
| Poucos produtores indicados | Vitrine vazia no piloto | Começar a captação na preparação, não na Fase 2 |
| Uma pessoa só construindo | Fase 2 atrasa | Lista de cortes da seção 2.4 |
| Verificação manual lenta | Promessa de 5 dias úteis quebrada | Checklist fechado e limite de negócios por semana |

## 7. Decisões pendentes

| Decisão | Até quando | Quem |
| --- | --- | --- |
| Parecer sobre "Retorno proposto", rodapé e termos | 01/11/2026 | Advogado |
| Parceiro financeiro | 15/11/2026 | Gabriel |
| "Resumo do negócio" é PDF ou a própria aba | 01/11/2026 | Gabriel |
| Quando credenciar cooperativas e ONGs como verificadoras | Decisão pós-piloto | Gabriel |
| Preço da verificação e da assinatura | Decisão pós-piloto | Gabriel |
