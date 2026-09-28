-- RN-01: cada usuario so' le e edita o proprio profile; o papel
-- verificador nunca pode ser definido por uma insercao/atualizacao do
-- proprio usuario (CA-01.3) - so' a equipe Iasy cria esse papel,
-- diretamente com a service-role key, que ignora RLS.

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id and role <> 'verificador');

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and role <> 'verificador');
