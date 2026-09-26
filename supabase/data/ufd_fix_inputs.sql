-- scripts/ufd-fix-inputs.mjs 가 만든 파일: 가져온 커맨드의 입력을 고친 변환 규칙으로 바꾼다 (8개)
-- 손으로 고친 입력은 그대로 둔다 (예전 입력과 같을 때만 바꾼다)

update moves set input_classic = '214K → LPLK'
where character_id = (select id from characters where slug = 'marisa')
  and name->>'en' = 'Scutum > Enfold' and input_classic = 'Down, Down-Back, Back + K > LP+LK';

update moves set input_classic = '236LKMK'
where character_id = (select id from characters where slug = 'juri')
  and name->>'en' = 'Saihasho (Overdrive)' and input_classic = 'Down, Down-Forward, Forward + LK+MK';

update moves set input_classic = '236LKHK'
where character_id = (select id from characters where slug = 'juri')
  and name->>'en' = 'Ankensatsu (Overdrive)' and input_classic = 'Down, Down-Forward, Forward + LK+HK';

update moves set input_classic = '236MKHK'
where character_id = (select id from characters where slug = 'juri')
  and name->>'en' = 'Go Ohsatsu (Overdrive)' and input_classic = 'Down, Down-Forward, Forward + MK+HK';

update moves set input_classic = '214LPMP'
where character_id = (select id from characters where slug = 'terry')
  and name->>'en' = 'Quick Burn (Overdrive)' and input_classic = 'Down, Down-Back, Back + LP+MP';

update moves set input_classic = '214MPHP'
where character_id = (select id from characters where slug = 'terry')
  and name->>'en' = 'Burning Knuckle (Overdrive)' and input_classic = 'Down, Down-Back, Back + MP+HP (or LP+HP)';

update moves set input_classic = '236LPMP'
where character_id = (select id from characters where slug = 'sagat')
  and name->>'en' = 'Low Tiger Shot (Overdrive)' and input_classic = 'Down, Down-Forward, Forward + LP+MP (or LP+HP)';

update moves set input_classic = '236MPHP'
where character_id = (select id from characters where slug = 'sagat')
  and name->>'en' = 'High Tiger Shot (Overdrive)' and input_classic = 'Down, Down-Forward, Forward + MP+HP';
