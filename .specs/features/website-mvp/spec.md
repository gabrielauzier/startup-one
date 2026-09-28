# Website MVP Îasy (Next.js) Specification

Fonte: [mvp/prd-mvp.md](../../../mvp/prd-mvp.md) v2.0, [mvp/escopo-mvp.md](../../../mvp/escopo-mvp.md) v2, [mvp/telas.md](../../../mvp/telas.md), [mvp/relatorio-gaps-mvp.md](../../../mvp/relatorio-gaps-mvp.md) e o protótipo navegável `mvp/prototipo.html` (24 telas, marca Îasy). Esta spec traduz esses documentos, já aprovados pelo Gabriel em 26/09/2026, para o formato rastreável desta skill — reaproveita os IDs existentes (HU-xx, RF-xx, RN-xx, CA-xx) em vez de recriá-los.

## Problem Statement

Pequenos e médios produtores da bioeconomia amazônica têm produção e demanda de capital, mas não têm dados organizados e verificáveis para provar isso a investidores; investidores de impacto querem esses negócios mas desistem por falta de confiança nos dados. O MVP web resolve isso conectando as duas pontas em torno de um dado verificado, sem a plataforma movimentar dinheiro (RN-04).

## Goals

- [ ] Produtor consegue gerar pelo celular, em até 5 partes salvas a cada passo, o dado mínimo que um investidor exige (M2).
- [ ] Dado verificado com o selo "Verificado Îasy" e notas A/S/G gera interesse real e mensurável de investidores (M3, M4, M6).
- [ ] Interesse aceito pelas duas partes chega a um parceiro financeiro para negociação, sem a Îasy custodiar ou transferir dinheiro (M6, RN-04).
- [ ] Metas de piloto (PRD §8.1): 10 produtores verificados, ≥60% conclusão de cadastro, 30 investidores com descoberta concluída, ≥10 interesses enviados, ≥3 interesses que viram negociação, verificação ≤5 dias úteis.

## Out of Scope

Direto da PRD §2.3 / escopo §5 — reaproveitado, não redecidido:

| Feature | Reason |
| --- | --- |
| Movimentar dinheiro (pagamento, custódia, contrato, retorno) | Exige CVM 88 ou SCD; fica com parceiro financeiro autorizado |
| Dashboard de impacto, portfólio, relatório ESG, auditoria do investidor | Escopo do protótipo antigo da Fase 4, descartado |
| Monitoramento por satélite e integração automática com certificadoras | Selos conferidos manualmente pela equipe no piloto |
| App nativo e modo offline completo | Cadastro salvo no aparelho (IndexedDB) já cobre a conectividade intermitente |
| Integração com o site Opinião Amazônia | Um link para a vitrine já basta |
| Projetos fora da Amazônia Legal, créditos de carbono, tema escuro, qualquer tarifa no piloto | Fora do público-alvo e da monetização do piloto |
| Barra "Visualizar como Investidor/Produtor" do protótipo | Existe só para a demo do pitch; perfil real vem da conta logada |
| Automação de WhatsApp | No piloto os avisos ao produtor são enviados manualmente pela equipe a partir de modelos prontos |

## Assumptions & Open Questions

Herdadas da PRD §2.4 (decisões já tomadas) e §8.5 (questões em aberto) — registradas aqui para rastreabilidade, não redebatidas nesta sessão de planejamento.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Retorno proposto em página aberta a visitantes | Exibir "Retorno proposto X% ao ano" com explicação e rótulo "proposto" | Decisão do protótipo (P), adotada na PRD; precisa validação jurídica antes do piloto — ver risco em PRD §8.2 | n (pendente advogado) |
| Quem verifica os cadastros | Equipe interna da Îasy no piloto; parceiros credenciados depois | Escala limitada aceitável para 10 negócios no piloto (PRD §2.4.5) | y |
| Cobrança no MVP | Nenhuma cobrança no piloto | Testar disposição a pagar depois (analise-financeira.md) | y |
| Canal de apresentação ao parceiro financeiro | E-mail manual disparado pelo verificador | Sem integração automatizada até fechar parceiro | y |
| Avisos ao produtor | WhatsApp manual da equipe a partir de modelos; e-mail quando informado | Automação fica para depois do piloto (PRD RN-41) | y |
| Qual parceiro financeiro formaliza os contratos | Em aberto — cadastro de parceiro fica genérico e configurável (`partners`) | Ainda não fechado; não bloqueia o desenvolvimento do produto | n |
| "Resumo do negócio" aberto a todos (RN-32) | Tratar como a própria aba "A produção", sem gerar PDF | Menor esforço de implementação; revisar se o parceiro exigir um artefato formal | n |
| Quando credenciar cooperativas/ONGs como verificadoras | Fora do MVP; papel verificador só para a equipe interna no piloto | Adiado para pós-piloto (PRD §8.5) | y |

**Open questions:** none — the three rows marked "n" (retorno proposto, parceiro financeiro, resumo do negócio) are resolved above with a chosen default and rationale, to be revisited with legal/partner in parallel to Fase 1; none blocks Design/Tasks.

---

## User Stories

Organizadas pelos módulos M1–M7 da PRD §2.2. Prioridade herdada da coluna "Prioridade" da PRD §3 (Must → P1, Should → P2). Cada ID de história (HU-xx) e critério (RN-xx/CA-xx) já existe na PRD; os ACs abaixo são a tradução EARS desses critérios, não uma redefinição.

### P1: Entrada sem senha e escolha de perfil (HU-01, HU-02, HU-03) ⭐ MVP

**User Story**: Como visitante, quero entender o que a Îasy faz, escolher meu caminho (produzir ou investir) e entrar só com e-mail, sem senha.

**Why P1**: Sem entrada funcional nenhum outro módulo é alcançável.

**Acceptance Criteria**:

1. WHEN o visitante abre `/` THEN o sistema SHALL exibir a frase principal, os 4 passos do ciclo e dois botões de caminho (produtor / investidor) (RF-01).
2. WHEN o visitante escolhe um perfil em `/entrar` e informa e-mail sem marcar um dos três perfis THEN o sistema SHALL manter o botão "Entrar" desabilitado (RN-01, CA-01.1).
3. WHEN um e-mail válido é enviado THEN o sistema SHALL enviar um código de 6 dígitos por e-mail via Supabase Auth OTP, válido por 10 minutos, com até 5 tentativas (RN-02, RF-02).
4. IF o código está vencido ou errado 5 vezes THEN o sistema SHALL exigir um novo código (CA-02.1).
5. WHEN o código é confirmado para um e-mail sem conta THEN o sistema SHALL criar a conta com o perfil escolhido (CA-02.2).
6. WHEN a autenticação é concluída THEN o sistema SHALL redirecionar por perfil: investidor/empresa para a descoberta (ou vitrine, se já respondida), produtor para boas-vindas ou painel, verificador para a fila (RF-03).
7. WHEN um produtor autenticado acessa uma rota de investidor ou verificador THEN o sistema SHALL retornar "Sem permissão" e a API SHALL não retornar dados dessas áreas (CA-01.2).
8. WHEN o produtor avança da parte 1 do cadastro sem marcar a autorização de uso de dados THEN o sistema SHALL impedir o avanço (RN-03, CA-03.1).
9. WHEN o investidor acessa a plataforma pela primeira vez THEN o sistema SHALL exigir o aceite dos Termos de Uso e Política de Privacidade antes de liberar a descoberta (RF-04).

**Independent Test**: Entrar como cada um dos três perfis com e-mail real, receber e confirmar o código, e cair na tela correta por perfil.

---

### P1: Cadastro do produtor em 5 partes (HU-04 a HU-10) ⭐ MVP

**User Story**: Como produtora, quero preencher meu cadastro em 5 partes curtas pelo celular, com tudo salvo a cada passo, para não perder meu progresso mesmo com internet ruim.

**Why P1**: É a origem de todo o dado que vira oferta na vitrine — sem isso não há negócio para verificar ou mostrar.

**Acceptance Criteria**:

1. WHEN o produtor abre `/produtor` THEN o sistema SHALL mostrar o que ganha e "Quem vê o quê" antes de iniciar (RF-05, HU-04).
2. WHEN o produtor está em qualquer parte do cadastro THEN o sistema SHALL mostrar o indicador "Parte N de 5 · Salvo" (RF-11, RN-07).
3. WHEN um campo obrigatório de uma parte está vazio e o produtor toca em "Continuar" THEN o sistema SHALL manter o foco no primeiro campo inválido com mensagem de erro e SHALL não avançar a parte (RN-06, CA-06.1).
4. WHEN o produtor volta a uma parte já preenchida e retorna à parte seguinte THEN o sistema SHALL preservar os dados e fotos já enviados (CA-06.2).
5. IF a produção mensal informada é zero, negativa ou não numérica THEN o sistema SHALL rejeitar o valor (CA-06.3).
6. WHILE o produtor está sem conexão THEN o sistema SHALL salvar as alterações em IndexedDB local e mostrar "Salvo no celular" (RN-07, CA-07.1).
7. WHEN a conexão volta após edição offline THEN o sistema SHALL sincronizar o rascunho automaticamente e voltar o indicador para "Salvo" (CA-07.2).
8. IF um rascunho fica 90 dias sem atividade THEN o sistema SHALL apagá-lo, avisando o produtor 7 dias antes (CA-07.3).
9. WHEN o produtor envia ao menos 1 foto do local de produção e 1 do produto/colheita THEN o sistema SHALL aceitar o grupo de fotos como completo; IF o grupo obrigatório está vazio THEN o sistema SHALL destacá-lo e não avançar (RN-08, CA-08.1).
10. IF um arquivo excede 10 MB ou não é JPG/PNG/HEIC/PDF THEN o sistema SHALL recusá-lo com a mensagem do limite ou formato (CA-08.3).
11. WHEN uma foto maior que 1.600px no lado maior é enviada THEN o sistema SHALL comprimi-la no aparelho antes do upload (RN-09, CA-09.1).
12. IF um upload é interrompido THEN o sistema SHALL retomá-lo quando a conexão voltar, sem duplicar o arquivo (CA-09.2).
13. WHEN o CNPJ informado tem dígito verificador inválido THEN o sistema SHALL exibir "CNPJ inválido" e não avançar a parte (RN-05, CA-05.1).
14. IF o CNPJ já tem outro negócio em rascunho, em análise ou verificado THEN o sistema SHALL bloquear o envio (CA-05.3).
15. WHEN o produtor informa valor, finalidade, prazo e retorno na parte 5 THEN o sistema SHALL validar valor entre R$ 50 mil e R$ 200 mil (passos de R$ 5 mil), prazo em {12,18,24,36} meses e retorno entre 0% e 30% com 1 casa decimal (RN-10, CA-10.1).
16. WHEN o cadastro é enviado THEN o sistema SHALL exibir a confirmação com prazo de até 5 dias úteis e os 3 próximos passos (RF-12, HU-09).
17. WHEN um cadastro em Ajuste solicitado é reaberto pelo produtor THEN o sistema SHALL permitir editar somente os campos marcados pelo verificador, cada um com o comentário recebido (RN-14, CA-14.1).

**Independent Test**: Completar as 5 partes de um cadastro no celular (simulado em viewport 390px), incluindo uma queda de conexão simulada na parte 3, e ver o cadastro chegar à fila de verificação com status "Em análise".

---

### P1: Verificação, selo e notas A/S/G (HU-12, HU-13, HU-14) ⭐ MVP

**User Story**: Como verificador, quero uma fila ordenada de cadastros e uma tela de análise com checklist para aprovar, pedir ajuste ou reprovar, dando as notas Ambiental, Social e Gestão.

**Why P1**: É o diferencial de valor da Îasy (dado confiável) — sem selo não há vitrine.

**Acceptance Criteria**:

1. WHEN o verificador abre a fila THEN o sistema SHALL ordenar os negócios do mais antigo para o mais novo, mostrando data de entrada, dias úteis decorridos e responsável (RF-14, RN-17).
2. WHILE um item está há mais de 3 dias úteis na fila THEN o sistema SHALL destacá-lo em amarelo; WHILE está há mais de 5 dias úteis THEN o sistema SHALL destacá-lo em vermelho (RN-16, CA-16.1).
3. WHEN o verificador abre um item da fila THEN o sistema SHALL atribuí-lo a ele por 24 horas; IF outro verificador tenta decidir o mesmo item nesse período THEN o sistema SHALL bloquear a ação e mostrar quem está analisando (RN-17, CA-17.1).
4. IF algum item do checklist (CNPJ ativo e compatível, documento da terra legível e compatível, fotos compatíveis, produção coerente, práticas plausíveis) não está conferido THEN o sistema SHALL manter "Aprovar" desabilitado (RN-18, CA-18.1).
5. IF o cadastro não tem documento da terra (CAR/DAP) THEN o sistema SHALL bloquear "Aprovar", permitindo somente "Pedir ajuste" (RN-08, CA-08.2).
6. WHEN o verificador aprova THEN o sistema SHALL exigir notas inteiras de 0 a 100 para Ambiental, Social e Gestão, exibidas separadas sem média, e SHALL conceder o selo "Verificado Îasy" válido por 12 meses (RN-19, CA-19.1).
7. WHEN o verificador pede ajuste ou reprova THEN o sistema SHALL exigir um motivo com ao menos 20 caracteres e SHALL registrar a decisão com autor, data e hora, sem permitir edição posterior (RN-18, CA-18.2).
8. WHEN um selo de certificadora enviado pelo produtor ainda não foi conferido THEN o sistema SHALL não exibi-lo no card nem na página do negócio (RN-20, CA-20.1).
9. WHEN o verificador suspende um negócio Verificado com motivo THEN o sistema SHALL removê-lo da vitrine, bloquear novos interesses e pedidos de documento, e avisar produtor e interessados em aberto (RN-21, CA-21.1).
10. IF um selo concedido completa 12 meses sem renovação THEN o sistema SHALL mover o negócio para Expirado e removê-lo da vitrine, avisando o produtor 30 dias antes (CA-19.2).

**Independent Test**: Levar um cadastro de "Em análise" até "Verificado" pela tela de análise, conferindo o checklist, dando notas A/S/G, e ver o negócio aparecer na vitrine com o selo e as notas.

---

### P1: Descoberta guiada e vitrine (HU-16 a HU-20) ⭐ MVP

**User Story**: Como investidora, quero responder 5 perguntas rápidas e ver os negócios verificados ordenados por alinhamento com meu perfil, ou navegar livremente pela vitrine.

**Why P1**: É como o investidor encontra oferta relevante — sem isso a vitrine é uma lista genérica.

**Acceptance Criteria**:

1. WHEN o investidor está em qualquer uma das 5 perguntas THEN o sistema SHALL mostrar "Pergunta N de 5" e os botões Voltar e Continuar (RF-17, RN-22).
2. IF a pergunta 3 (produtos) não tem nenhuma opção marcada THEN o sistema SHALL manter "Continuar" desabilitado (CA-22.1).
3. WHEN o investidor marca "Todos" na pergunta 3 THEN o sistema SHALL desmarcar as demais opções (CA-22.2).
4. WHEN o investidor toca em "Pular esta pergunta" na pergunta 5 THEN o sistema SHALL calcular os resultados sem o critério de impacto (CA-22.3).
5. WHEN o investidor conclui as 5 perguntas THEN o sistema SHALL calcular o alinhamento de 0 a 100% por negócio verificado usando os pesos Produto=30, Valor=25, Prazo=20, Impacto=15, Prioridade=10 definidos em RN-24, SHALL arredondar para inteiro, e SHALL exibir somente negócios com 40% ou mais, ordenados por alinhamento (RN-24, CA-24.1).
6. The system SHALL produzir o mesmo alinhamento para os mesmos dados de entrada em execuções repetidas (função pura) (CA-24.3).
7. WHEN um visitante sem conta responde as 5 perguntas THEN o sistema SHALL guardar as respostas no navegador e migrá-las para o perfil ao entrar (RN-23, CA-23.1).
8. WHEN o investidor toca em "Alterar respostas" THEN o sistema SHALL reabrir a pergunta 1 com as respostas atuais marcadas, e a nova resposta SHALL substituir a anterior (RN-23, CA-23.2).
9. WHEN o investidor aplica o filtro "Com selo de certificadora" nos resultados THEN o sistema SHALL ocultar negócios sem nenhum selo conferido (RN-25, CA-25.1).
10. WHEN qualquer usuário busca na vitrine `/negocios` por nome ou cidade THEN o sistema SHALL ignorar maiúsculas e acentos e SHALL combinar com os filtros de produto e estado mantidos na URL (RN-27, CA-27.1).
11. IF a busca não retorna resultados THEN o sistema SHALL exibir "Nenhum negócio encontrado" com a ação "Limpar filtros" (CA-27.2).
12. WHEN um negócio Verificado é exibido em card THEN o sistema SHALL mostrar selo Verificado Îasy, selos de certificadoras conferidos, nome, produto, cidade/UF, "Busca R$ X", "Prazo N meses", "Retorno proposto X% ao ano", Nota Îasy (A/S/G) e a barra de interesse somado (RN-28, RF-20).
13. The system SHALL exibir na vitrine, nos resultados e na busca somente negócios com status Verificado (RN-13, CA-13.1).

**Independent Test**: Responder as 5 perguntas com um perfil conhecido, conferir manualmente o cálculo de alinhamento de um negócio de teste contra a fórmula de RN-24, e ver a ordenação correta nos resultados.

---

### P1: Página do negócio e documentos controlados (HU-22 a HU-25) ⭐ MVP

**User Story**: Como investidora, quero ver todas as informações públicas do negócio em abas e pedir acesso a documentos sensíveis que só a produtora pode liberar.

**Why P1**: É onde a decisão de demonstrar interesse é tomada, e onde a confiança dos dois lados (produtor decide o que libera) é sustentada.

**Acceptance Criteria**:

1. WHEN qualquer visitante abre `/negocios/[slug]` THEN o sistema SHALL exibir publicamente a aba "A produção"; WHEN um investidor sem sessão tenta abrir as abas "O negócio", "Quem cuida", "O dinheiro" ou "Documentos" THEN o sistema SHALL convidá-lo a entrar (RN-26, RN-30, CA-26.1).
2. WHILE a aba "A produção" está aberta THEN o sistema SHALL mostrar somente as práticas de cuidado com a floresta que o produtor marcou (RN-30, CA-30.1).
3. WHEN a aba "Quem cuida" é exibida THEN o sistema SHALL mostrar nome e função das pessoas, e SHALL nunca exibir telefone, e-mail ou CPF do produtor (RN-31, CA-31.1).
4. WHEN um investidor solicita acesso a um documento sensível (CAR, DAP, laudo, certificado completo) THEN o sistema SHALL mudar a situação para "Pedido enviado" e SHALL notificar a produtora (RN-32, CA-32.1).
5. IF a produtora não responde a um pedido em 7 dias THEN o sistema SHALL expirar o pedido e permitir refazê-lo (RN-32).
6. WHEN a produtora libera um pedido THEN o sistema SHALL conceder acesso por 30 dias e permitir que ela o retire a qualquer momento, com efeito imediato (RN-33, CA-33.2).
7. IF um acesso liberado passa de 30 dias THEN o sistema SHALL exibir "Acesso expirado, solicite novamente" (CA-33.1).
8. WHEN um investidor com acesso abre um documento sensível THEN o sistema SHALL exibi-lo somente na tela, sem opção de download, impressão ou cópia, com marca d'água "Visualizado por [nome] em [data]", servido por URL assinada de até 5 minutos (RN-34, CA-34.1, CA-34.2).
9. WHEN um documento é aberto THEN o sistema SHALL registrar investidor, documento, data e hora, visível no painel da produtora (RN-35, CA-35.1).
10. WHEN a mesma pessoa visita a página do negócio múltiplas vezes no mesmo dia THEN o sistema SHALL contar 1 única visita no indicador da produtora (RN-35, CA-35.1).

**Independent Test**: Como investidor, pedir acesso a um documento sensível; como produtor, liberar o pedido; como investidor, abrir o documento e confirmar ausência de download e presença da marca d'água.

---

### P1: Demonstrar interesse e conexão com o parceiro financeiro (HU-26 a HU-30) ⭐ MVP

**User Story**: Como investidora, quero demonstrar interesse com um valor e mensagem, deixando claro que ainda não é investimento, e acompanhar as etapas até a apresentação ao parceiro financeiro.

**Why P1**: É a métrica norte do MVP (RF-32, PRD §8.1) — sem isso não há prova de que dado verificado gera interesse real.

**Acceptance Criteria**:

1. WHEN um visitante sem sessão toca em "Tenho interesse" THEN o sistema SHALL levá-lo à tela Entrar e SHALL retornar ao formulário depois da autenticação (RN-36, CA-36.1).
2. IF um produtor logado abre a página de um negócio THEN o sistema SHALL não exibir o botão "Tenho interesse" (CA-36.3).
3. WHEN o investidor informa um valor maior que o "Busca R$ X" do negócio THEN o sistema SHALL impedir o envio com a mensagem "O valor não pode passar do que o negócio busca" (RN-36, CA-36.2).
4. IF a caixa de confirmação "Entendo que estou demonstrando interesse, e não investindo agora" não está marcada THEN o sistema SHALL manter "Enviar interesse" desabilitado (RN-38, CA-38.1).
5. The system SHALL permitir no máximo um interesse Pendente ou Aceito por investidor por negócio; WHILE um interesse está Pendente THEN o sistema SHALL trocar o botão da página do negócio para "Ver meu interesse" (RN-37, CA-37.1).
6. WHEN o interesse é enviado THEN o sistema SHALL registrar o texto de confirmação aceito e o horário, e SHALL exibir uma linha do tempo de 4 etapas (Interesse enviado, A produtora responde, Apresentamos as partes, Contrato com o parceiro) (RN-38, RN-40, CA-38.2).
7. WHEN a produtora toca em "Aceitar e seguir" em um interesse Novo THEN o sistema SHALL mudar a situação para Aceito, avançar a etapa para "Apresentação ao parceiro financeiro" e avisar o investidor (RN-39, CA-39.1).
8. WHEN a produtora recusa um interesse THEN o sistema SHALL exibir "Não aceito pela produtora" ao investidor sem revelar nenhum contato (RN-39, CA-39.2).
9. IF um interesse Novo fica 10 dias sem resposta da produtora THEN o sistema SHALL expirá-lo (RN-39).
10. WHEN o verificador apresenta as partes de um interesse Aceito ao parceiro financeiro THEN o sistema SHALL enviar e-mail ao parceiro com os dados das duas partes e SHALL mudar a etapa para "Apresentamos as partes"; IF o interesse ainda está Pendente THEN a ação de apresentar SHALL não estar disponível (RN-40, CA-40.1, CA-40.2).
11. WHEN o card ou a página de um negócio é exibido THEN o sistema SHALL somar os valores de interesses Pendentes e Aceitos em "Interesse de investidores: R$ X de R$ Y", limitando a barra a 100% mesmo que a soma exceda o valor buscado (RN-29, CA-29.1).
12. WHEN um interesse é recusado ou cancelado THEN o sistema SHALL removê-lo da soma de interesse do negócio (CA-29.2).
13. WHEN o produtor abre o painel `/produtor/painel` THEN o sistema SHALL exibir selo e data, notas A/S/G, visitas ao perfil, pedidos aguardando resposta e investidores interessados (RF-29, RN-35, RN-41).

**Independent Test**: Enviar um interesse como investidor, aceitar como produtor, e confirmar que o verificador consegue apresentar as partes ao parceiro e que a linha do tempo do investidor avança corretamente.

---

### P2: Indicação por parceiro e correção de ajuste (HU-11, HU-10)

**User Story**: Como produtora, quero dizer se vim indicada por uma cooperativa/ONG e corrigir só o que a equipe pediu.

**Why P2**: Melhora a atribuição de canal e a experiência de reenvio, mas o cadastro funciona sem isso no piloto inicial.

**Acceptance Criteria**:

1. WHEN o produtor marca "Sim" na indicação sem escolher o parceiro THEN o sistema SHALL destacar o campo "Qual?" (RN-11, CA-11.1).
2. WHEN o verificador abre a análise de um negócio indicado THEN o sistema SHALL exibir o nome do parceiro que indicou, sem mostrá-lo ao investidor (RN-11, CA-11.2).

---

### P2: Filtros avançados e edição de respostas (HU-18, HU-21, HU-15)

**User Story**: Como investidora, quero filtrar por "Recebe visitas" e alterar minhas respostas; como verificador, quero suspender selos quando necessário.

**Why P2**: Refina a experiência mas o P1 de descoberta e verificação já entrega o valor central.

**Acceptance Criteria**:

1. WHEN o investidor aplica o filtro "Recebe visitas" THEN o sistema SHALL exibir somente negócios marcados como tal (RN-25).
2. WHEN o verificador identifica uma irregularidade em um negócio Verificado THEN o sistema SHALL permitir suspendê-lo com motivo registrado (RN-21, CA-21.1).

---

### P2: Apresentação ao parceiro pelo verificador (HU-30)

**User Story**: Como verificador, quero um painel de conexões para apresentar interesses aceitos ao parceiro e acompanhar a etapa.

**Why P2**: A apresentação por e-mail manual (P1, RN-40) já viabiliza o fluxo; o painel dedicado é conveniência operacional.

**Acceptance Criteria**:

1. WHEN o verificador abre `/verificacao/conexoes` THEN o sistema SHALL listar interesses Aceitos com etapa atual e permitir registrar observações (RF-30, RN-40).

---

## Edge Cases

Direto das regras de negócio da PRD (seção 5), organizados por tipo:

- IF um CNPJ já tem negócio em rascunho, em análise ou verificado THEN o sistema SHALL bloquear novo cadastro para o mesmo CNPJ (RN-05, CA-05.3).
- IF a cidade informada está fora da Amazônia Legal THEN o sistema SHALL explicar que o piloto atende só a Amazônia Legal e oferecer deixar contato (CA-05.2).
- IF uma nota de verificação é decimal ou fora de 0–100 THEN o sistema SHALL rejeitá-la (CA-19.1).
- IF uma URL assinada de documento é usada após 5 minutos THEN o Storage SHALL negar o acesso (CA-34.2).
- IF uma requisição direta à API tenta mudar um negócio Rascunho para Verificado (pulando o fluxo) THEN o sistema SHALL rejeitar a operação (RN-12, CA-12.1).
- IF uma requisição pública de cadastro tenta o papel verificador THEN o servidor SHALL responder 403 (CA-01.3).
- WHEN um negócio Suspenso ou Reprovado é acessado por URL direta THEN o sistema SHALL exibir "Negócio indisponível no momento" (RN-13, CA-13.2).
- IF um negócio tem 35% de alinhamento (abaixo do corte de 40%) THEN o sistema SHALL mantê-lo fora dos resultados de descoberta mas visível na vitrine geral (CA-24.2).
- IF um pedido de acesso a documento é recusado THEN o sistema SHALL exibir "A produtora optou por não liberar", sem motivo (CA-32.3).

---

## Requirement Traceability

IDs reaproveitados da PRD (RF-xx cobre requisitos funcionais; RN-xx as regras de negócio testadas via CA-xx acima). Fase alvo conforme cronograma PRD §8.4.

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| RF-01 | P1: Entrada sem senha | Design | Pending |
| RF-02 | P1: Entrada sem senha | Design | Pending |
| RF-03 | P1: Entrada sem senha | Design | Pending |
| RF-04 | P1: Entrada sem senha | Design | Pending |
| RF-05 | P1: Cadastro do produtor | Design | Pending |
| RF-06 | P1: Cadastro do produtor | Design | Pending |
| RF-07 | P1: Cadastro do produtor | Design | Pending |
| RF-08 | P1: Cadastro do produtor | Design | Pending |
| RF-09 | P1: Cadastro do produtor | Design | Pending |
| RF-10 | P1: Cadastro do produtor | Design | Pending |
| RF-11 | P1: Cadastro do produtor | Design | Pending |
| RF-12 | P1: Cadastro do produtor | Design | Pending |
| RF-13 | P2: Indicação por parceiro e correção de ajuste | Design | Pending |
| RF-14 | P1: Verificação e selo | Design | Pending |
| RF-15 | P1: Verificação e selo | Design | Pending |
| RF-16 | P2: Filtros avançados e edição de respostas | Design | Pending |
| RF-17 | P1: Descoberta e vitrine | Design | Pending |
| RF-18 | P1: Descoberta e vitrine | Design | Pending |
| RF-19 | P1: Descoberta e vitrine | Design | Pending |
| RF-20 | P1: Descoberta e vitrine | Design | Pending |
| RF-21 | P1: Página do negócio e documentos | Design | Pending |
| RF-22 | P1: Página do negócio e documentos | Design | Pending |
| RF-23 | P1: Página do negócio e documentos | Design | Pending |
| RF-24 | P1: Página do negócio e documentos | Design | Pending |
| RF-25 | P1: Página do negócio e documentos | Design | Pending |
| RF-26 | P1: Interesse e conexão | Design | Pending |
| RF-27 | P1: Interesse e conexão | Design | Pending |
| RF-28 | P1: Interesse e conexão | Design | Pending |
| RF-29 | P1: Interesse e conexão | Design | Pending |
| RF-30 | P2: Apresentação ao parceiro pelo verificador | Design | Pending |
| RF-31 | Transversal: avisos | Design | Pending |
| RF-32 | Transversal: eventos de produto | Design | Pending |

**ID format:** reaproveita `RF-NN` (requisito funcional) e `RN-NN`/`CA-NN.N` (regra de negócio / critério de aceite) da PRD; nenhum ID novo foi criado nesta spec.

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 32 requisitos funcionais (RF-01 a RF-32), todos mapeados às 6 fases acima; 41 regras de negócio (RN-01 a RN-41) referenciadas nos ACs; 0 sem mapeamento.

---

## Success Criteria

Direto da PRD §8.1 (metas do piloto de 90 dias) e §7.1 (RNFs), medíveis via `events`:

- [ ] 10 produtores com cadastro completo e status Verificado.
- [ ] Taxa de conclusão do cadastro do produtor ≥ 60% (`cadastro_enviado` ÷ `cadastro_iniciado`).
- [ ] 30 investidores concluem as 5 perguntas da descoberta.
- [ ] ≥ 10 interesses enviados (métrica norte).
- [ ] ≥ 3 interesses aceitos chegam à etapa "Em negociação" com o parceiro financeiro.
- [ ] Tempo médio de verificação ≤ 5 dias úteis por negócio.
- [ ] LCP ≤ 2,5s em 4G nas telas do produtor (RNF-02); nenhuma tela pede dados bancários, cartão ou Pix (CA-04.3).
