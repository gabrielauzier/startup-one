# Issue 09 - Erro ao Subir Imagens

## Descrição

Na tela do questionário do produtor, etapa 4 de 5, ocorre um erro ao tentar subir qualquer um dos arquivos do questionário, seja uma foto ou um documento.

## Passos para Reproduzir

1. Acesse a tela do questionário do produtor `http://localhost:3000/produtor/cadastro/4`.

2. Tente subir qualquer arquivo de imagem (.png) no campo "Fotos de onde vocês produzem".

3. Observe que a tela atualiza com erro na UI com mensagem "Não foi possível preparar o envio. Tente de novo.".

4. Após o erro, a aplicação crasha ou reinicia. Ao tentar atualizar a página, ocorre ERR_INTERNET_DISCONNECTED.

## Investigação (2026-10-02)

Três causas distintas, encontradas reproduzindo o fluxo (login real via OTP + navegação até `/produtor/cadastro/4`) e inspecionando logs do servidor dev e chamadas diretas à API de Storage:

1. **Causa raiz da mensagem de erro (passo 3)**: o Supabase Storage está desabilitado neste ambiente local (`web/supabase/config.toml`, `[storage] enabled = false`), decisão já documentada antes desta issue por falha de healthcheck do container `supabase_storage_web`. Reproduzido via `curl` direto na API de Storage: `{"message":"name resolution failed"}` (503) — o Kong não acha o serviço porque ele não está rodando. `createUploadUrl` (`app/(producer)/produtor/cadastro/4/actions.ts`) trata esse erro corretamente (sem lançar exceção) e devolve exatamente a mensagem "Não foi possível preparar o envio. Tente de novo." — a UI está se comportando como esperado dado que o Storage está fora do ar; não é um bug de código.

2. **Bug real encontrado no caminho, corrigido**: um *hydration mismatch* real em `components/cadastro/PartHeader.tsx`/`lib/offline/use-draft-sync.ts` — `useDraftSync` inicializava o status checando `navigator.onLine` dentro do `useState`, uma API que não existe no servidor. O HTML gerado no servidor sempre assumia "Salvo", mas se o cliente já estiver offline no primeiro render, o React descartava a árvore renderizada no servidor e re-renderizava do zero no cliente (erro "Hydration failed..." visível no console, confirmado em `preview_logs` do dev server). Corrigido: o estado sempre começa em `"salvo"` (igual ao servidor); o `flush()` já agendado no mount corrige para `"salvo_no_celular"` no próximo tick se o cliente estiver de fato offline — mesmo comportamento final, sem divergência entre servidor e cliente no primeiro render.

3. **2º bug represado, documentado para quando o Storage puder ser testado de verdade**: mesmo com o serviço de Storage saudável, o upload ainda falharia — nenhuma migration/seed deste projeto cria os buckets que o código espera (`evidences` em `cadastro/4/actions.ts`, `documentos` em `lib/documents/signed-url.ts`). Adicionados blocos `[storage.buckets.evidences]`/`[storage.buckets.documentos]` em `supabase/config.toml` (comentados, junto com `enabled = true`) para o CLI criar os dois buckets automaticamente da próxima vez que o Storage for religado.

**Sobre o passo 4 (app "crasha"/`ERR_INTERNET_DISCONNECTED`)**: não foi possível reproduzir diretamente (sem um jeito de simular seleção real de arquivo no ambiente de teste usado). A hipótese mais provável é chamadas repetidas falhando contra o Storage fora do ar, somada à fragilidade de rede do Docker local já documentada nesta sessão em outros contextos (exaustão de portas efêmeras sob carga). Mitigação aplicada preventivamente: os botões "Tirar foto"/"Escolher arquivo"/"Trocar" em `components/upload/PhotoUploader.tsx` agora ficam desabilitados enquanto um envio está em andamento, evitando empilhar tentativas concorrentes se o usuário clicar várias vezes durante uma falha.

**Tentativa de religar o Storage para confirmar a correção de ponta a ponta**: `supabase stop && supabase start` com `enabled = true` foi tentado. Desta vez o problema não foi o healthcheck do storage — o próprio containerd do Docker Desktop deste host estava com erro de leitura/escrita na sua metadata interna (`read-only file system`, `input/output error`), impedindo qualquer pull de imagem e derrubando a stack inteira (não só o storage). `docker info` parou de responder. Revertido `enabled` para `false` para não deixar o ambiente pior do que estava. **Ação pendente do lado do usuário**: reiniciar o Docker Desktop manualmente; depois disso, religar `[storage] enabled = true` e descomentar os blocos de bucket em `supabase/config.toml` para validar o upload real.

### Resumo
- [x] Mensagem de erro do passo 3: comportamento esperado dado o Storage desabilitado, não é bug.
- [x] Hydration mismatch no indicador de status: corrigido (`lib/offline/use-draft-sync.ts`).
- [x] Bucket ausente (bloquearia o upload mesmo com Storage saudável): corrigido, pronto para ativar (`supabase/config.toml`).
- [x] Botões de upload desabilitados durante envio em andamento, para não empilhar tentativas.
- [ ] Confirmar upload real de ponta a ponta — bloqueado pelo Docker Desktop deste host precisar de reinício manual.