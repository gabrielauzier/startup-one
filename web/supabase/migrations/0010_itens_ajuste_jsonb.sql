-- CA-14.1 (Fix 3, rodada 1 do Verifier): "Ajuste solicitado" precisa
-- editar so' os campos marcados pelo verificador, cada um com um
-- comentario especifico - uma lista `text[]` de nomes de campo nao
-- carrega o comentario. Menor esforco que resolve: trocar o tipo da
-- coluna para `jsonb`, guardando um array de
-- `{ "campo": string, "comentario": string }`. `to_jsonb` sobre o
-- array antigo de texto vira um array jsonb de strings simples (sem
-- comentario) - aceitavel, pois nenhuma decisao de ajuste com itens
-- foi tirada em producao ainda (feature ainda nao lancada).
alter table public.verifications
  alter column itens_ajuste drop default;

alter table public.verifications
  alter column itens_ajuste type jsonb using to_jsonb(itens_ajuste);

alter table public.verifications
  alter column itens_ajuste set default '[]'::jsonb;
