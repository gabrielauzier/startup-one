-- AUTH-11: o perfil nasce no banco, junto com o usuario, para qualquer
-- caminho de entrada (confirmacao de e-mail, magic link, admin) - antes
-- so' o `verifyOtp` criava o profile.
--   - sem `role` no metadado: nao cria (usuario "orfao" cai em
--     /completar-perfil; seed e contas do verificador criadas pela
--     equipe seguem funcionando);
--   - `role` invalido (inclui 'verificador', RN-01/CA-01.3): o insert em
--     auth.users falha e o cadastro nao acontece;
--   - `role` valido: cria o profile com o `nome` do metadado (ou o
--     prefixo do e-mail).

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := new.raw_user_meta_data ->> 'role';
  v_nome text := nullif(btrim(new.raw_user_meta_data ->> 'nome'), '');
begin
  if v_role is null then
    return new;
  end if;

  if v_role not in ('investidor', 'empresa', 'produtor') then
    raise exception 'role invalido: %', v_role;
  end if;

  insert into public.profiles (id, role, nome)
  values (
    new.id,
    v_role::public.role,
    coalesce(v_nome, split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
