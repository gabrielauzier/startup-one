-- AUTH-09 / AD-010: limite de envio de e-mail de auth (cadastro, magic
-- link, reset) - cooldown de 60 s e teto de 3/hora por e-mail e tipo.
-- O GoTrue nao oferece esse teto e `max_frequency` so' cobre e-mail com
-- conta; a chave e' o hash do e-mail normalizado, entao e-mail
-- inexistente e' limitado igual (antienumeracao).
--
-- RNF-04: RLS habilitada e nenhuma policy - so' o service role le/escreve.

create table public.auth_throttle (
  id bigint generated always as identity primary key,
  key_hash text not null,
  kind text not null check (kind in ('signup', 'magic', 'reset')),
  created_at timestamptz not null default now()
);

create index auth_throttle_lookup_idx
  on public.auth_throttle (key_hash, kind, created_at desc);

alter table public.auth_throttle enable row level security;

-- AUTH-03: o app precisa saber se o e-mail ja tem conta (e se esta
-- confirmado) sem expor `auth.users` ao cliente. Somente service role.
create function public.email_account_status(p_email text)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when u.id is null then 'none'
    when u.email_confirmed_at is null then 'unconfirmed'
    else 'confirmed'
  end
  from (select 1) s
  left join auth.users u on lower(u.email) = lower(p_email)
$$;

revoke all on function public.email_account_status(text) from public, anon, authenticated;
grant execute on function public.email_account_status(text) to service_role;
