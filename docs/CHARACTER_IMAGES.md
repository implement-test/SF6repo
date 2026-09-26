# 캐릭터 원본 이미지 주소

공식 사이트(https://www.streetfighter.com/6/ko-kr/character) 의 이미지.
서버에서 직접 내려받는 것은 막혀 있어서(403), 브라우저에서 주소를 열어 "다른 이름으로 저장" 한다.

## 사이트에 넣는 방법

1. 원본을 `image-src/` 에 저장한다 (git 에 올리지 않음)
   - `image-src/{폴더}/bg_{폴더}.jpg`, `image-src/{폴더}/{폴더}.png` (폴더 = 공식 폴더 이름, 예: `gouki_akuma`)
   - `image-src/select_characters/{slug}.png` (목록 카드, 우리 slug 이름, 예: `akuma.png`)
2. `node scripts/crop-banners.mjs` — 배너에 보이는 부분만 잘라 `public/characters/` 에 WebP 로 저장하고 `src/lib/banner-assets.ts` 를 다시 만든다
3. 잘라 둔 파일이 없는 캐릭터는 아래 공식 주소를 그대로 불러온다

공식 사이트가 이미지를 바꾸면 원본을 다시 받아 2번을 실행한다. 배치값이 바뀌었으면 `src/lib/roster.ts` 의 `FIGURE` 도 다시 잰다.

| 종류 | 주소 규칙 | 크기 | 쓰는 곳 |
|---|---|---|---|
| 목록 카드 (컬러) | `https://www.streetfighter.com/6/assets/images/character/select_character{번호}_over.png` | 575×625, 약 0.1~0.5MB | 홈 캐릭터 목록, Vs 가이드 상대 선택 |
| 배너 배경 | `https://www.streetfighter.com/6/assets/images/character/{폴더}/bg_{폴더}.jpg` | 2304×1296, 약 0.1~1.6MB | 캐릭터 페이지 상단 |
| 배너 캐릭터 | `https://www.streetfighter.com/6/assets/images/character/{폴더}/{폴더}.png` | 약 1178×1722, 약 0.3~4.1MB | 캐릭터 페이지 상단 |

(흑백 실루엣 버전은 `select_character{번호}.png` — 쓰지 않음)


## 초기 로스터

| 캐릭터 | 목록 카드 | 배너 배경 | 배너 캐릭터 |
|---|---|---|---|
| 가일 (Guile, `guile`) | [select_character5_over.png](https://www.streetfighter.com/6/assets/images/character/select_character5_over.png) | [bg_guile.jpg](https://www.streetfighter.com/6/assets/images/character/guile/bg_guile.jpg) | [guile.png](https://www.streetfighter.com/6/assets/images/character/guile/guile.png) |
| 달심 (Dhalsim, `dhalsim`) | [select_character10_over.png](https://www.streetfighter.com/6/assets/images/character/select_character10_over.png) | [bg_dhalsim.jpg](https://www.streetfighter.com/6/assets/images/character/dhalsim/bg_dhalsim.jpg) | [dhalsim.png](https://www.streetfighter.com/6/assets/images/character/dhalsim/dhalsim.png) |
| 디제이 (Dee Jay, `deejay`) | [select_character12_over.png](https://www.streetfighter.com/6/assets/images/character/select_character12_over.png) | [bg_deejay.jpg](https://www.streetfighter.com/6/assets/images/character/deejay/bg_deejay.jpg) | [deejay.png](https://www.streetfighter.com/6/assets/images/character/deejay/deejay.png) |
| 루크 (Luke, `luke`) | [select_character2_over.png](https://www.streetfighter.com/6/assets/images/character/select_character2_over.png) | [bg_luke.jpg](https://www.streetfighter.com/6/assets/images/character/luke/bg_luke.jpg) | [luke.png](https://www.streetfighter.com/6/assets/images/character/luke/luke.png) |
| 류 (Ryu, `ryu`) | [select_character1_over.png](https://www.streetfighter.com/6/assets/images/character/select_character1_over.png) | [bg_ryu.jpg](https://www.streetfighter.com/6/assets/images/character/ryu/bg_ryu.jpg) | [ryu.png](https://www.streetfighter.com/6/assets/images/character/ryu/ryu.png) |
| 릴리 (Lily, `lily`) | [select_character17_over.png](https://www.streetfighter.com/6/assets/images/character/select_character17_over.png) | [bg_lily.jpg](https://www.streetfighter.com/6/assets/images/character/lily/bg_lily.jpg) | [lily.png](https://www.streetfighter.com/6/assets/images/character/lily/lily.png) |
| 마농 (Manon, `manon`) | [select_character13_over.png](https://www.streetfighter.com/6/assets/images/character/select_character13_over.png) | [bg_manon.jpg](https://www.streetfighter.com/6/assets/images/character/manon/bg_manon.jpg) | [manon.png](https://www.streetfighter.com/6/assets/images/character/manon/manon.png) |
| 마리사 (Marisa, `marisa`) | [select_character14_over.png](https://www.streetfighter.com/6/assets/images/character/select_character14_over.png) | [bg_marisa.jpg](https://www.streetfighter.com/6/assets/images/character/marisa/bg_marisa.jpg) | [marisa.png](https://www.streetfighter.com/6/assets/images/character/marisa/marisa.png) |
| 블랑카 (Blanka, `blanka`) | [select_character9_over.png](https://www.streetfighter.com/6/assets/images/character/select_character9_over.png) | [bg_blanka.jpg](https://www.streetfighter.com/6/assets/images/character/blanka/bg_blanka.jpg) | [blanka.png](https://www.streetfighter.com/6/assets/images/character/blanka/blanka.png) |
| E.혼다 (E. Honda, `ehonda`) | [select_character11_over.png](https://www.streetfighter.com/6/assets/images/character/select_character11_over.png) | [bg_ehonda.jpg](https://www.streetfighter.com/6/assets/images/character/ehonda/bg_ehonda.jpg) | [ehonda.png](https://www.streetfighter.com/6/assets/images/character/ehonda/ehonda.png) |
| 장기에프 (Zangief, `zangief`) | [select_character16_over.png](https://www.streetfighter.com/6/assets/images/character/select_character16_over.png) | [bg_zangief.jpg](https://www.streetfighter.com/6/assets/images/character/zangief/bg_zangief.jpg) | [zangief.png](https://www.streetfighter.com/6/assets/images/character/zangief/zangief.png) |
| 제이미 (Jamie, `jamie`) | [select_character3_over.png](https://www.streetfighter.com/6/assets/images/character/select_character3_over.png) | [bg_jamie.jpg](https://www.streetfighter.com/6/assets/images/character/jamie/bg_jamie.jpg) | [jamie.png](https://www.streetfighter.com/6/assets/images/character/jamie/jamie.png) |
| JP (JP, `jp`) | [select_character15_over.png](https://www.streetfighter.com/6/assets/images/character/select_character15_over.png) | [bg_jp.jpg](https://www.streetfighter.com/6/assets/images/character/jp/bg_jp.jpg) | [jp.png](https://www.streetfighter.com/6/assets/images/character/jp/jp.png) |
| 주리 (Juri, `juri`) | [select_character7_over.png](https://www.streetfighter.com/6/assets/images/character/select_character7_over.png) | [bg_juri.jpg](https://www.streetfighter.com/6/assets/images/character/juri/bg_juri.jpg) | [juri.png](https://www.streetfighter.com/6/assets/images/character/juri/juri.png) |
| 춘리 (Chun-Li, `chunli`) | [select_character4_over.png](https://www.streetfighter.com/6/assets/images/character/select_character4_over.png) | [bg_chunli.jpg](https://www.streetfighter.com/6/assets/images/character/chunli/bg_chunli.jpg) | [chunli.png](https://www.streetfighter.com/6/assets/images/character/chunli/chunli.png) |
| 캐미 (Cammy, `cammy`) | [select_character18_over.png](https://www.streetfighter.com/6/assets/images/character/select_character18_over.png) | [bg_cammy.jpg](https://www.streetfighter.com/6/assets/images/character/cammy/bg_cammy.jpg) | [cammy.png](https://www.streetfighter.com/6/assets/images/character/cammy/cammy.png) |
| 켄 (Ken, `ken`) | [select_character8_over.png](https://www.streetfighter.com/6/assets/images/character/select_character8_over.png) | [bg_ken.jpg](https://www.streetfighter.com/6/assets/images/character/ken/bg_ken.jpg) | [ken.png](https://www.streetfighter.com/6/assets/images/character/ken/ken.png) |
| 킴벌리 (Kimberly, `kimberly`) | [select_character6_over.png](https://www.streetfighter.com/6/assets/images/character/select_character6_over.png) | [bg_kimberly.jpg](https://www.streetfighter.com/6/assets/images/character/kimberly/bg_kimberly.jpg) | [kimberly.png](https://www.streetfighter.com/6/assets/images/character/kimberly/kimberly.png) |

## 시즌 1

| 캐릭터 | 목록 카드 | 배너 배경 | 배너 캐릭터 |
|---|---|---|---|
| 라시드 (Rashid, `rashid`) | [select_character19_over.png](https://www.streetfighter.com/6/assets/images/character/select_character19_over.png) | [bg_rashid.jpg](https://www.streetfighter.com/6/assets/images/character/rashid/bg_rashid.jpg) | [rashid.png](https://www.streetfighter.com/6/assets/images/character/rashid/rashid.png) |
| A.K.I. (A.K.I., `aki`) | [select_character20_over.png](https://www.streetfighter.com/6/assets/images/character/select_character20_over.png) | [bg_aki.jpg](https://www.streetfighter.com/6/assets/images/character/aki/bg_aki.jpg) | [aki.png](https://www.streetfighter.com/6/assets/images/character/aki/aki.png) |
| 에드 (Ed, `ed`) | [select_character21_over.png](https://www.streetfighter.com/6/assets/images/character/select_character21_over.png) | [bg_ed.jpg](https://www.streetfighter.com/6/assets/images/character/ed/bg_ed.jpg) | [ed.png](https://www.streetfighter.com/6/assets/images/character/ed/ed.png) |
| 고우키 (Akuma, `akuma`) | [select_character22_over.png](https://www.streetfighter.com/6/assets/images/character/select_character22_over.png) | [bg_gouki_akuma.jpg](https://www.streetfighter.com/6/assets/images/character/gouki_akuma/bg_gouki_akuma.jpg) | [gouki_akuma.png](https://www.streetfighter.com/6/assets/images/character/gouki_akuma/gouki_akuma.png) |

## 시즌 2

| 캐릭터 | 목록 카드 | 배너 배경 | 배너 캐릭터 |
|---|---|---|---|
| 베가 (M. Bison, `mbison`) | [select_character23_over.png](https://www.streetfighter.com/6/assets/images/character/select_character23_over.png) | [bg_vega_mbison.jpg](https://www.streetfighter.com/6/assets/images/character/vega_mbison/bg_vega_mbison.jpg) | [vega_mbison.png](https://www.streetfighter.com/6/assets/images/character/vega_mbison/vega_mbison.png) |
| 테리 (Terry, `terry`) | [select_character24_over.png](https://www.streetfighter.com/6/assets/images/character/select_character24_over.png) | [bg_terry.jpg](https://www.streetfighter.com/6/assets/images/character/terry/bg_terry.jpg) | [terry.png](https://www.streetfighter.com/6/assets/images/character/terry/terry.png) |
| 마이 (Mai, `mai`) | [select_character25_over.png](https://www.streetfighter.com/6/assets/images/character/select_character25_over.png) | [bg_mai.jpg](https://www.streetfighter.com/6/assets/images/character/mai/bg_mai.jpg) | [mai.png](https://www.streetfighter.com/6/assets/images/character/mai/mai.png) |
| 엘레나 (Elena, `elena`) | [select_character26_over.png](https://www.streetfighter.com/6/assets/images/character/select_character26_over.png) | [bg_elena.jpg](https://www.streetfighter.com/6/assets/images/character/elena/bg_elena.jpg) | [elena.png](https://www.streetfighter.com/6/assets/images/character/elena/elena.png) |

## 시즌 3

| 캐릭터 | 목록 카드 | 배너 배경 | 배너 캐릭터 |
|---|---|---|---|
| 사가트 (Sagat, `sagat`) | [select_character27_over.png](https://www.streetfighter.com/6/assets/images/character/select_character27_over.png) | [bg_sagat.jpg](https://www.streetfighter.com/6/assets/images/character/sagat/bg_sagat.jpg) | [sagat.png](https://www.streetfighter.com/6/assets/images/character/sagat/sagat.png) |
| C.바이퍼 (C. Viper, `cviper`) | [select_character28_over.png](https://www.streetfighter.com/6/assets/images/character/select_character28_over.png) | [bg_cviper.jpg](https://www.streetfighter.com/6/assets/images/character/cviper/bg_cviper.jpg) | [cviper.png](https://www.streetfighter.com/6/assets/images/character/cviper/cviper.png) |
| 알렉스 (Alex, `alex`) | [select_character29_over.png](https://www.streetfighter.com/6/assets/images/character/select_character29_over.png) | [bg_alex.jpg](https://www.streetfighter.com/6/assets/images/character/alex/bg_alex.jpg) | [alex.png](https://www.streetfighter.com/6/assets/images/character/alex/alex.png) |
| 잉그리드 (Ingrid, `ingrid`) | [select_character30_over.png](https://www.streetfighter.com/6/assets/images/character/select_character30_over.png) | [bg_ingrid.jpg](https://www.streetfighter.com/6/assets/images/character/ingrid/bg_ingrid.jpg) | [ingrid.png](https://www.streetfighter.com/6/assets/images/character/ingrid/ingrid.png) |

## 시즌 4

| 캐릭터 | 목록 카드 | 배너 배경 | 배너 캐릭터 |
|---|---|---|---|
| 야스민 (Yasmine, `yasmine`) | [select_character31_over.png](https://www.streetfighter.com/6/assets/images/character/select_character31_over.png) | [bg_yasmine.jpg](https://www.streetfighter.com/6/assets/images/character/yasmine/bg_yasmine.jpg) | [yasmine.png](https://www.streetfighter.com/6/assets/images/character/yasmine/yasmine.png) |
| 아르준 (Arjun, `arjun`) | [select_character32_over.png](https://www.streetfighter.com/6/assets/images/character/select_character32_over.png) | [bg_arjun.jpg](https://www.streetfighter.com/6/assets/images/character/arjun/bg_arjun.jpg) | [arjun.png](https://www.streetfighter.com/6/assets/images/character/arjun/arjun.png) |
