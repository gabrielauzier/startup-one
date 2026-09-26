# Escopo do MVP — Amazon Capital

*Versão 1 · 26/09/2026 · nome definido: Amazon Capital (o protótipo usa "BioRaiz" e deve ser renomeado) · aprovado pelo Gabriel em 26/09/2026*

Baseado nas atividades do Startup One (canvas, entrevistas com 5 produtores e 5 investidores, protótipo T01–T18 e feedback da validação da solução).

## 1. Problema

Pequenos e médios produtores da bioeconomia amazônica (açaí, cacau nativo, castanha, óleos) têm demanda e capacidade produtiva, mas não conseguem capital porque não têm garantias reais nem dados organizados que comprovem produção e impacto. Do outro lado, investidores de impacto querem esses negócios, mas desistem por falta de dados confiáveis, padronizados e verificados.

O gargalo validado nas entrevistas não é falta de dinheiro: é falta de **informação confiável** entre as duas pontas.

## 2. Público-alvo do MVP

- **Oferta (produtores):** cooperativas e pequenas agroindústrias da Amazônia Legal com necessidade de R$ 50 mil a R$ 200 mil, acesso a internet pelo celular (mesmo intermitente) e algum registro de produção, mesmo em papel. Entrada via cooperativas e ONGs parceiras.
- **Demanda (investidores):** investidores de impacto pessoa física qualificados, family offices e empresas com cadeias de fornecimento amazônicas, que querem retorno de mercado **com** impacto comprovado.

Produtor individual sem CNPJ e fundos institucionais grandes ficam para depois: o primeiro ainda não gera o dado mínimo e o segundo exige auditoria que o MVP não entrega.

## 3. Proposta de valor

> Transformar a produção de negócios amazônicos em um perfil de investimento padronizado e verificado, para que o investidor confie e o produtor seja encontrado.

- **Para o produtor:** um cadastro simples pelo celular que organiza seus dados e o coloca na frente de investidores.
- **Para o investidor:** uma vitrine curada de projetos com dados verificados, selos de impacto e documentos acessíveis com segurança, filtrada pela sua tese.

## 4. Funcionalidades essenciais

| # | Funcionalidade | O que resolve | Telas do protótipo |
|---|---|---|---|
| 1 | **Cadastro do produtor mobile-first** em 4 etapas (negócio, produção, fotos e evidências, meta de captação), leve e tolerante a conexão instável | Produtor não tem ferramenta para gerar o dado que o investidor exige | T14–T18 |
| 2 | **Verificação e selo** feitos pela equipe ou por cooperativa/ONG parceira: checagem de documentos e evidências, selo "Verificado" e score simples (ambiental, social, governança) | Investidor não confia em dado autodeclarado | Selos do detalhe do projeto |
| 3 | **Vitrine com descoberta guiada**: marketplace de projetos verificados + questionário de tese em 5 passos que ordena os projetos por aderência | Investidor não encontra projetos que batem com sua tese | T01–T07 |
| 4 | **Página do projeto com área logada**: abas (operação, empresa, empreendedores, finanças, documentos) e documentos sensíveis só em visualização, liberados pelo produtor sob solicitação | Proteção de dados e confiança dos dois lados | Detalhe do projeto |
| 5 | **Manifestação de interesse e conexão**: investidor sinaliza interesse com valor pretendido; a plataforma apresenta as partes e encaminha a formalização a um parceiro financeiro | Aproximar as partes sem a plataforma movimentar dinheiro | Botão "Investir" |

## 5. O que fica de fora

- **Movimentar dinheiro na plataforma** (pagamento, custódia, contratos, retorno). Exige autorização regulatória (plataforma de crowdfunding CVM 88 ou SCD) e responde ao feedback de que não estava claro se era investimento ou financiamento. No MVP, a formalização fica com um parceiro (decidido pelo Gabriel em 26/09/2026).
- Dashboard de impacto consolidado, portfólio e relatórios ESG do investidor (T08–T10).
- Módulo de auditoria com linha do tempo e relatórios (T11–T13).
- Monitoramento por satélite (PRODES/INPE) e integração automática com certificadoras.
- Modo offline completo / app nativo (fica só o formulário leve que salva o progresso).
- Integração com o site parceiro Opinião Amazônia (um link para a vitrine já basta).
- Projetos fora da Amazônia, créditos de carbono e tema escuro.

## 6. Métricas de sucesso

Metas propostas para os primeiros 90 dias de piloto (a calibrar com você):

| Métrica | Meta | Por quê |
|---|---|---|
| Produtores com cadastro completo e verificado | 10 | Vitrine mínima com oferta real |
| Taxa de conclusão do cadastro do produtor | ≥ 60% | Valida que o celular resolve a coleta de dados |
| Investidores cadastrados que concluem a descoberta | 30 | Demanda real para a vitrine |
| Manifestações de interesse | ≥ 10 | Sinal central de valor para o investidor |
| Conexões que viram negociação com parceiro | ≥ 3 | Prova de que a informação destrava o capital |
| Tempo da verificação por projeto | ≤ 5 dias úteis | Mostra que validar é barato e escalável |

**Métrica norte:** número de manifestações de interesse em projetos verificados.

## 7. Pontos em aberto

1. **Parceiro financeiro:** qual banco, fintech ou plataforma CVM 88 formaliza os aportes.
2. **Quem verifica:** equipe interna no início ou cooperativas/ONGs credenciadas.
3. **Receita no MVP:** o canvas prevê assinatura e taxa de intermediação; a sugestão é não cobrar no piloto e testar a disposição a pagar do investidor.
