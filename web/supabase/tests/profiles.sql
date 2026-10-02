begin;
select plan(5);

-- Migracao aplica sem erro (RF-02): tabela e enums existem.
select has_table('public', 'profiles', 'a tabela profiles deve existir');
select has_enum('public', 'role', 'o enum role deve existir');
select has_enum('public', 'business_status', 'o enum business_status deve existir');
select enum_has_labels(
  'public', 'role',
  array['investidor', 'empresa', 'produtor', 'verificador'],
  'o enum role deve ter os 4 papeis da RN-01'
);

-- RNF-04: RLS habilitada em profiles desde a criacao.
select ok(
  (select relrowsecurity from pg_class where relname = 'profiles' and relnamespace = 'public'::regnamespace),
  'RLS deve estar habilitada em profiles (RNF-04)'
);

select * from finish();
rollback;
