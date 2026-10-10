-- 점프 입력 "(점프) 214K" → "j.214K", 제자리 점프는 "nj." (scripts/ufd-fix-inputs.mjs 로 만듦, 아래 개수)
-- scripts/ufd-fix-inputs.mjs 가 만든 파일: 가져온 커맨드의 입력을 고친 변환 규칙으로 바꾼다 (27개)
-- 손으로 고친 입력은 그대로 둔다 (예전 입력과 같을 때만 바꾼다)

update moves set input_classic = 'j.63214P'
where character_id = (select id from characters where slug = 'dhalsim')
  and name->>'en' = 'Yoga Comet' and input_classic = '(점프) 63214P';

update moves set input_classic = 'j.63214PP'
where character_id = (select id from characters where slug = 'dhalsim')
  and name->>'en' = 'Yoga Comet (Overdrive)' and input_classic = '(점프) 63214PP';

update moves set input_classic = 'j.214K'
where character_id = (select id from characters where slug = 'ryu')
  and name->>'en' = 'Aerial Tatsumaki Senpu-kyaku' and input_classic = '(점프) 214K';

update moves set input_classic = 'nj.2HP'
where character_id = (select id from characters where slug = 'marisa')
  and name->>'en' = 'Caelum Arc (Neutral Jump > Down + Heavy Punch)' and input_classic = '(점프) 2HP';

update moves set input_classic = '(4 모으기) j.6P'
where character_id = (select id from characters where slug = 'blanka')
  and name->>'en' = 'Aerial Rolling Attack' and input_classic = '(점프, 4 모으기) 6P';

update moves set input_classic = '(4 모으기) j.6P'
where character_id = (select id from characters where slug = 'blanka')
  and name->>'en' = 'Aerial Rolling Attack (Overdrive)' and input_classic = '(점프, 4 모으기) 6P';

update moves set input_classic = 'j.214K'
where character_id = (select id from characters where slug = 'jamie')
  and name->>'en' = 'Luminous Dive Kick' and input_classic = '(점프) 214K';

update moves set input_classic = 'j.214K'
where character_id = (select id from characters where slug = 'juri')
  and name->>'en' = 'Shiku-sen' and input_classic = '(점프) 214K';

update moves set input_classic = 'j.214KK'
where character_id = (select id from characters where slug = 'juri')
  and name->>'en' = 'Shiku-sen (Overdrive)' and input_classic = '(점프) 214KK';

update moves set input_classic = 'j.236LK'
where character_id = (select id from characters where slug = 'chunli')
  and name->>'en' = 'Aerial Hundred Lightning Kicks (LK)' and input_classic = '(점프) 236LK';

update moves set input_classic = 'j.236MK'
where character_id = (select id from characters where slug = 'chunli')
  and name->>'en' = 'Aerial Hundred Lightning Kicks (MK)' and input_classic = '(점프) 236MK';

update moves set input_classic = 'j.236HK'
where character_id = (select id from characters where slug = 'chunli')
  and name->>'en' = 'Aerial Hundred Lightning Kicks (HK)' and input_classic = '(점프) 236HK';

update moves set input_classic = 'j.214K'
where character_id = (select id from characters where slug = 'cammy')
  and name->>'en' = 'Cannon Strike' and input_classic = '(점프) 214K';

update moves set input_classic = 'j.214KK'
where character_id = (select id from characters where slug = 'cammy')
  and name->>'en' = 'Cannon Strike (Overdrive)' and input_classic = '(점프) 214KK';

update moves set input_classic = 'j.214K'
where character_id = (select id from characters where slug = 'ken')
  and name->>'en' = 'Aerial Tatsumaki Senpu-kyaku' and input_classic = '(점프) 214K';

update moves set input_classic = 'j.214KK'
where character_id = (select id from characters where slug = 'ken')
  and name->>'en' = 'Aerial Tatsumaki Senpu-kyaku (Overdrive)' and input_classic = '(점프) 214KK';

update moves set input_classic = 'j.214K'
where character_id = (select id from characters where slug = 'kimberly')
  and name->>'en' = 'Aerial Bushin Senpukyaku' and input_classic = '(점프) 214K';

update moves set input_classic = 'j.214KK'
where character_id = (select id from characters where slug = 'kimberly')
  and name->>'en' = 'Aerial Bushin Senpukyaku (Overdrive)' and input_classic = '(점프) 214KK';

update moves set input_classic = 'j.214LK'
where character_id = (select id from characters where slug = 'rashid')
  and name->>'en' = 'Arabian Skyhigh (LK)' and input_classic = '(점프) 214LK';

update moves set input_classic = 'j.214MK'
where character_id = (select id from characters where slug = 'rashid')
  and name->>'en' = 'Arabian Skyhigh (MK)' and input_classic = '(점프) 214MK';

update moves set input_classic = 'j.214HK'
where character_id = (select id from characters where slug = 'rashid')
  and name->>'en' = 'Arabian Skyhigh (HK)' and input_classic = '(점프) 214HK';

update moves set input_classic = 'j.214HK'
where character_id = (select id from characters where slug = 'rashid')
  and name->>'en' = 'Arabian Skyhigh (HK)' and input_classic = '(점프) 214HK';

update moves set input_classic = 'j.214K'
where character_id = (select id from characters where slug = 'akuma')
  and name->>'en' = 'Aerial Tatsumaki Senpu-kyaku' and input_classic = '(점프) 214K';

update moves set input_classic = 'j.214P'
where character_id = (select id from characters where slug = 'mai')
  and name->>'en' = 'Musasabi no Mai (During Forward Jump Only)' and input_classic = '(점프) 214P';

update moves set input_classic = 'j.LP → j.MK'
where character_id = (select id from characters where slug = 'elena')
  and name->>'en' = 'Soaring Raid (Jump, Light Punch, Medium Kick)' and input_classic = '(점프) LP → MK';

update moves set input_classic = 'j.MP → j.HP'
where character_id = (select id from characters where slug = 'elena')
  and name->>'en' = 'Raptor Range (Jump, Medium Punch, Heavy Punch)' and input_classic = '(점프) MP → HP';

update moves set input_classic = 'j.2HP'
where character_id = (select id from characters where slug = 'alex')
  and name->>'en' = 'Flying Cross Chop (Forward Jump > Down + Heavy Punch)' and input_classic = '(점프) 2HP';
