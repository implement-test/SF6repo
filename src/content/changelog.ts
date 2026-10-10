import type { Localized } from "@/lib/types";

/**
 * 사이트 업데이트 내역. 헤더의 '업데이트 내역' 버튼에서 보여 준다.
 * 기능을 추가·수정·삭제할 때마다 맨 위에 적는다 (날짜는 연/월/일만, 내용은 한 줄로 대략).
 * adminOnly 항목은 관리자로 로그인했을 때만 보인다.
 */

export type ChangeKind = "added" | "changed" | "removed";

export type ChangelogItem = { kind: ChangeKind; text: Localized; adminOnly?: boolean };
export type ChangelogEntry = { date: string; items: ChangelogItem[] };

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-10-10",
    items: [
      {
        kind: "changed",
        text: {
          ko: "Vs 가이드: 상단 필터(대상 · 콤보 표시 · 조작) 제거, 상대 캐릭터는 이름 드롭다운으로 바로 선택",
          en: "Vs guides: removed the top filters (level / display / controls); pick the opponent from a name dropdown",
          ja: "Vs ガイド：上部フィルター（対象・コンボ表示・操作）を削除、対戦相手は名前のドロップダウンで選択",
        },
      },
    ],
  },
  {
    date: "2026-10-09",
    items: [
      {
        kind: "added",
        text: {
          ko: "콤보 표기에 etc 추가 (이후 자유롭게 이어 감, ETC 배지로 표시)",
          en: "Added etc to combo notation (continue however you like, shown as an ETC badge)",
          ja: "コンボ表記に etc を追加（以降は自由につなぐ、ETC バッジで表示）",
        },
      },
      {
        kind: "changed",
        adminOnly: true,
        text: {
          ko: "연달아 저장했을 때 일부 내용(새 콤보 등)이 사이트에 늦게 반영되던 문제 수정",
          en: "Fixed some changes (e.g. a new combo) showing up late after saving several times in a row",
          ja: "続けて保存したときに一部の内容（新しいコンボなど）の反映が遅れる問題を修正",
        },
      },
    ],
  },
  {
    date: "2026-10-08",
    items: [
      {
        kind: "changed",
        text: {
          ko: "즐겨찾기를 상단 메뉴에서 캐릭터 탭(개요 왼쪽)으로 옮김: 그 캐릭터의 즐겨찾기를 보고, 링크로 전체 모아보기",
          en: "Favorites moved from the header to a character tab (left of Overview), showing that character with a link to all favorites",
          ja: "お気に入りをヘッダーからキャラのタブ（概要の左）へ移動：そのキャラの項目を表示し、全体一覧へのリンク付き",
        },
      },
      {
        kind: "added",
        text: {
          ko: "콤보 표기: 5HP :: 2HP 처럼 :: 로 '이 중 하나'를 적으면 세로로 쌓아 표시",
          en: "Notation: write alternatives with :: (5HP :: 2HP); they are shown stacked",
          ja: "表記：5HP :: 2HP のように :: で「どれか一つ」を書くと縦に並べて表示",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "캐릭터 · 아이콘 이미지를 브라우저에 저장해 Vs 상대 선택 등이 빨리 뜨도록",
          en: "Character and icon images are now cached by the browser, so the Vs opponent picker loads faster",
          ja: "キャラ・アイコン画像をブラウザに保存し、対戦相手の選択などを高速化",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "Vs 가이드: 한 포스트에 상대 패턴 여러 개와 패턴마다 대응 여러 개, 프레임 범위(가드 시 -8 ~ -12 등), 확정 / 거리 한정 표시, 패턴별 영상",
          en: "Vs guides: several opponent patterns per post with multiple responses each, frame ranges, guaranteed / range-dependent tags and a video per pattern",
          ja: "キャラ対策：1つの投稿に相手の行動を複数、行動ごとに対応を複数、フレーム範囲、確定 / 距離次第の表示、行動ごとの動画",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "Vs 가이드 주제 이름을 짧게: 윕퍼 / 딜캐 / 끼어들기 / 패턴 대응",
          en: "Shorter Vs guide topic names: Whiff punish / Block punish / Interrupts / Pattern counters",
          ja: "キャラ対策のテーマ名を短く：差し返し / 確定反撃 / 割り込み / パターン対策",
        },
      },
      {
        kind: "added",
        text: {
          ko: "영상 칸에 X(트위터) 게시물 링크를 넣으면 게시물 카드로 영상 표시",
          en: "X (Twitter) post links in the video field now show the post with its video",
          ja: "動画欄に X（Twitter）の投稿リンクを入れると投稿カードで動画を表示",
        },
      },
    ],
  },
  {
    date: "2026-10-05",
    items: [
      {
        kind: "added",
        adminOnly: true,
        text: {
          ko: "관리 페이지에 캐릭터 공개 On/Off (최고 관리자만, 여러 명을 고른 뒤 한 번에 적용)",
          en: "Character visibility switches on the admin page (super admin only)",
          ja: "管理ページにキャラクター公開 On/Off（最高管理者のみ）",
        },
      },
      {
        kind: "removed",
        text: {
          ko: "초급 / 숙련 옆의 티어 표기",
          en: "Rank tier hints next to Beginner / Skilled",
          ja: "初級 / 熟練 の横のランク表記",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "짧은 영상 칸에 YouTube 링크가 들어간 항목도 영상이 나오도록 수정",
          en: "Fixed videos not showing when a YouTube link was saved in the short-clip field",
          ja: "短い動画欄に YouTube リンクが入っている項目でも動画が表示されるよう修正",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "셋업을 엔더(콤보를 끝낸 기술)별로 연결: 같은 기술로 끝나는 콤보에는 셋업이 자동으로 붙고, 셋업에서 그 기술로 끝나는 콤보를 바로 볼 수 있음",
          en: "Setups now link to enders (the move that ends a combo): every combo ending with that move shows the setup, and setups link to those combos",
          ja: "セットプレイを締め技ごとに紐付け：同じ技で終わるコンボに自動で表示され、セットプレイからそのコンボ一覧へ移動可能",
        },
      },
      {
        kind: "added",
        text: {
          ko: "콤보 탭에 엔더 필터 추가",
          en: "Ender filter on the combo tab",
          ja: "コンボタブに締め技フィルターを追加",
        },
      },
      {
        kind: "added",
        adminOnly: true,
        text: {
          ko: "엔더 관리 창 (콤보에서 찾아 추가, 후상황 기본값), 콤보 루트 · 마무리별 엔더 선택",
          en: "Ender manager (find from combos, default frame advantage) and per-route/finisher ender choice",
          ja: "締め技の管理画面（コンボから追加、状況の既定値）、ルート・締めごとの締め技選択",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "셋업을 콤보의 루트 · 마무리별로 연결: 콤보 카드에서 해당 루트 옆(마무리는 FINISH 팝업 안)에 셋업 표시",
          en: "Setups now link to a specific route or finisher; they appear next to that route (or inside the FINISH popup)",
          ja: "セットプレイをコンボのルート・締めごとに紐付け、該当ルートの横（締めは FINISH ポップアップ内）に表示",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "FINISH 팝업이 마우스를 옮기는 동안 닫히지 않도록",
          en: "The FINISH popup no longer closes while moving the mouse into it",
          ja: "FINISH ポップアップにマウスを移動しても閉じないように",
        },
      },
      {
        kind: "removed",
        adminOnly: true,
        text: {
          ko: "콤보 목록의 카드 옆 순서 변경 버튼 (순서 · 그룹 창에서만 변경)",
          en: "Inline reorder rails on the combo list (use the Order & Groups dialog)",
          ja: "コンボ一覧のカード横の並べ替えボタン（順序・グループ画面でのみ変更）",
        },
      },
      {
        kind: "changed",
        adminOnly: true,
        text: {
          ko: "관리자 도구(순서 변경 버튼 등)가 페이지를 열자마자 보이도록",
          en: "Admin tools (reorder rails etc.) show up right away when a page opens",
          ja: "管理者ツール（並べ替えボタンなど）をページを開いてすぐ表示",
        },
      },
      {
        kind: "added",
        text: {
          ko: "콤보 표기: { } 로 감싼 부분은 생략 가능 구간으로 점선 상자에 표시",
          en: "Notation: parts wrapped in { } are shown in a dashed box as optional",
          ja: "表記：{ } で囲んだ部分は省略可能として点線の枠で表示",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "접힌 카드의 제목 줄을 더 크게",
          en: "Collapsed cards have a taller title row",
          ja: "閉じたカードのタイトル行を大きく",
        },
      },
      {
        kind: "added",
        text: {
          ko: "상단 메뉴에 관리자 페이지 버튼",
          en: "Admin page button in the header",
          ja: "ヘッダーに管理者ページボタン",
        },
      },
      {
        kind: "added",
        text: {
          ko: "추천 연습 탭 추가 (셋업과 같은 구성, 상황을 글로 설명)",
          en: "New Practice tab (same layout as setups, with a written situation)",
          ja: "おすすめ練習タブを追加（セットプレイと同じ構成、状況を文章で説明）",
        },
      },
      {
        kind: "added",
        text: {
          ko: "개인 홈: 헤더의 ☆ 즐겨찾기에서 모든 캐릭터의 즐겨찾기를 모아 보기",
          en: "Personal home: see all your favorites across characters from ☆ Favorites in the header",
          ja: "マイページ：ヘッダーの ☆ お気に入りから全キャラのお気に入りをまとめて表示",
        },
      },
      {
        kind: "added",
        text: {
          ko: "콤보 마무리: 루트 끝의 FINISH 배지에 마우스를 올리면 마무리별 데미지 · 후상황 표시",
          en: "Combo finishers: hover the FINISH badge at the end of a route to see each finisher's damage and frame advantage",
          ja: "コンボの締め：ルート末尾の FINISH に触れると締めごとのダメージ・状況を表示",
        },
      },
      {
        kind: "added",
        text: {
          ko: "콤보를 그룹으로 묶어 보기 (그룹도 접고 펼 수 있음)",
          en: "Combos can be grouped (groups collapse too)",
          ja: "コンボをグループでまとめて表示（グループも開閉可能）",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "콤보 · 셋업 카드는 기본으로 접혀서 제목만 표시 (모두 펼치기 버튼)",
          en: "Combo and setup cards start collapsed to their titles (with an Expand all button)",
          ja: "コンボ・セットプレイのカードは最初はタイトルのみ表示（すべて開くボタンあり）",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "대상 수준을 초급 / 숙련 2단계로 (중급 · 상급은 숙련으로), 콤보 태그에 기타 추가",
          en: "Levels are now Beginner / Skilled (Intermediate and Advanced merged); added Other combo tag",
          ja: "対象レベルを初級 / 熟練の2段階に（中級・上級は熟練へ）、コンボタグに「その他」を追加",
        },
      },
      {
        kind: "removed",
        text: {
          ko: "콤보의 드라이브 · SA 게이지 표시",
          en: "Drive / SA gauge display on combos",
          ja: "コンボのドライブ・SAゲージ表示",
        },
      },
      {
        kind: "changed",
        adminOnly: true,
        text: {
          ko: "편집 · 순서 변경 창을 화면 가운데에 크게, 콤보 '순서 · 그룹' 창에서 그룹 관리, 콤보 제목 필수",
          en: "Editor and reorder dialogs are centered and larger; manage combo groups in the Order & Groups dialog; combo titles required",
          ja: "編集・並べ替えウィンドウを中央に大きく表示、コンボの「順序・グループ」でグループ管理、コンボのタイトル必須",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "콤보 표기: 타겟 콤보는 MP..HP (마침표 2개), DRC 5HP 처럼 DR·DRC 를 기술 앞에 붙여 쓰기, SA1~3 아이콘 추가",
          en: "Notation: target combos as MP..HP, DR/DRC can prefix a move (DRC 5HP), new SA1–3 icons",
          ja: "表記：ターゲットコンボは MP..HP、DR・DRC を技の前に付けて書ける（DRC 5HP）、SA1〜3 アイコン追加",
        },
      },
      {
        kind: "changed",
        adminOnly: true,
        text: {
          ko: "콤보·셋업 등을 저장한 뒤 바로 화면에 반영되지 않던 문제 수정",
          en: "Fixed saved combos/setups not showing up right away",
          ja: "コンボ・セットアップ保存後にすぐ反映されない問題を修正",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "사이트 주소를 sf6.nogamenogain.com 으로 변경",
          en: "Site moved to sf6.nogamenogain.com",
          ja: "サイトのアドレスを sf6.nogamenogain.com に変更",
        },
      },
    ],
  },
  {
    date: "2026-10-02",
    items: [
      {
        kind: "added",
        text: {
          ko: "사이트 공개 (Cloudflare 배포)",
          en: "Site launched on Cloudflare",
          ja: "サイト公開（Cloudflare）",
        },
      },
    ],
  },
  {
    date: "2026-09-26",
    items: [
      {
        kind: "added",
        text: {
          ko: "콤보 표기에 parry(저스트 패리) 아이콘 추가",
          en: "Added a parry (Perfect Parry) icon to combo notation",
          ja: "コンボ表記に parry（ジャストパリィ）アイコンを追加",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "YouTube 영상 기본 화질을 1080p 로 요청하고 플레이어를 더 크게",
          en: "YouTube videos request 1080p by default with a larger player",
          ja: "YouTube 動画の既定画質を1080pに、プレーヤーを大きく",
        },
      },
      {
        kind: "added",
        text: {
          ko: "캐릭터별 추천 영상 탭 (썸네일을 누르면 재생, 영상 언어로 거르기, 상단 필터 없음)",
          en: "Recommended videos tab per character (click a thumbnail to play, filter by language)",
          ja: "キャラ別のおすすめ動画タブ（サムネイルで再生、言語で絞り込み）",
        },
      },
      {
        kind: "added",
        adminOnly: true,
        text: {
          ko: "Vs 가이드를 다른 캐릭터로 복사, 다른 캐릭터의 Vs 가이드를 검색해서 가져오기",
          en: "Copy a Vs guide to another character, and search other characters' guides to import",
          ja: "Vsガイドを別キャラへコピー、他キャラのVsガイドを検索して取り込み",
        },
      },
      {
        kind: "added",
        adminOnly: true,
        text: {
          ko: "커맨드·콤보·셋업·Vs 가이드의 비공개 목록에서 하나씩 또는 모두 한 번에 공개",
          en: "Publish drafts one by one or all at once from the draft list on moves, combos, setups and Vs guides",
          ja: "コマンド・コンボ・セットプレイ・Vsガイドの非公開一覧から個別または一括で公開",
        },
      },
      {
        kind: "added",
        adminOnly: true,
        text: {
          ko: "Ultimate Frame Data 에서 31명의 커맨드·프레임 데이터를 가져오는 SQL (비공개 등록)",
          en: "SQL to import moves and frame data for 31 characters from Ultimate Frame Data (unpublished)",
          ja: "Ultimate Frame Data から31キャラの技・フレームデータを取り込むSQL（非公開で登録）",
        },
      },
      {
        kind: "added",
        adminOnly: true,
        text: {
          ko: "커맨드 리스트 '표 붙여넣기': 엑셀·시트·웹 표를 붙여 넣고 미리 본 뒤 한 번에 등록",
          en: "Command list 'Paste table': paste from Excel, Sheets or web tables, preview, and import in bulk",
          ja: "コマンドリスト「表を貼り付け」：Excel・シート・Webの表を貼り付けてプレビュー後に一括登録",
        },
      },
      {
        kind: "changed",
        adminOnly: true,
        text: {
          ko: "관리 페이지 '확인 필요': 이전 패치 · 번역 누락(EN/JA) · 비공개 항목을 모아 바로 처리",
          en: "Admin 'Review' section: items on older patches, missing EN/JA translations, and unpublished items",
          ja: "管理ページ「要確認」：旧パッチ・翻訳漏れ（EN/JA）・非公開の項目をまとめて処理",
        },
      },
      {
        kind: "added",
        adminOnly: true,
        text: {
          ko: "관리 페이지에 패치 갱신: 이전 패치 기준 항목을 모아 보고 '변경 없음' 으로 한 번에 최신 패치로",
          en: "Patch review in the admin page: list items on older patches and mark them current in bulk",
          ja: "管理ページにパッチ更新：旧パッチ基準の項目を一覧で確認し、まとめて最新パッチに",
        },
      },
      {
        kind: "changed",
        adminOnly: true,
        text: {
          ko: "편집 창에 작성 중인 내용을 브라우저에 저장 — 새로 고치거나 페이지를 옮겨도 다시 열면 복원 (7일 보관)",
          en: "Unsaved editor input is kept in the browser and restored after a refresh or navigation (kept 7 days)",
          ja: "編集中の内容をブラウザに保存し、再読み込みやページ移動後も復元（7日間保持）",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "Vs 가이드 주제 변경: 윕퍼 노릴 동작 · 가드 후 딜캐 · 압박 사이 끼어들기 · 날먹/무뇌패턴 파해 · 주요 셋업",
          en: "Vs guide topics: whiff punishes, punishes on block, gaps in pressure, beating cheap patterns, key setups",
          ja: "Vsガイドのトピック変更：差し返し・ガード後の確定反撃・攻めの割り込み・安易なパターン対策・主要なセットプレイ",
        },
      },
      {
        kind: "added",
        text: {
          ko: "콤보 표기에 guard(가드시킴) 배지 추가",
          en: "Added a guard (blocked) badge to combo notation",
          ja: "コンボ表記に guard（ガードさせる）バッジを追加",
        },
      },
      {
        kind: "changed",
        adminOnly: true,
        text: {
          ko: "편집 창을 저장 없이 닫아도 같은 페이지에 있는 동안은 작성하던 내용을 다시 불러옴",
          en: "Closing the editor without saving keeps your unsaved input while you stay on the page",
          ja: "編集パネルを保存せずに閉じても、同じページにいる間は入力内容を復元",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "텍스트 표시에서 버튼 기호(LP·MP·HP…, DR·DRC·DI)를 대문자로",
          en: "Text display shows button notation (LP, MP, HP…, DR, DRC, DI) in uppercase",
          ja: "テキスト表示でボタン表記（LP・MP・HP…、DR・DRC・DI）を大文字に",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "Vs 가이드: 공용 내용 + 관련 동작·대응을 여러 선택지로, 선택지마다 설명",
          en: "Vs guides: shared text plus multiple related moves/responses, each with its own note",
          ja: "Vsガイド：共通の内容＋複数の関連技・対応（選択肢ごとに説明）",
        },
      },
      {
        kind: "added",
        text: {
          ko: "개요(소개 · 장점 · 단점 · 클래식/모던 차이) 와 커맨드 리스트(분류별 기술 카드 + 프레임 데이터)",
          en: "Overview (summary, strengths, weaknesses, classic/modern differences) and command list (moves by category with frame data)",
          ja: "概要（紹介・長所・短所・クラシック/モダンの違い）とコマンドリスト（分類別の技カード＋フレームデータ）",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "개요·커맨드 리스트 탭에서는 상단 필터(대상·표시·조작) 숨김",
          en: "Hide the level/display/controls filters on the Overview and Command list tabs",
          ja: "概要・コマンドリストのタブでは上部のフィルター（対象・表示・操作）を非表示",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "캐릭터 배너·목록 이미지를 보이는 부분만 잘라 가볍게 (페이지당 수 MB → 수백 KB)",
          en: "Character banner and roster images cropped and compressed (MBs → a few hundred KB per page)",
          ja: "キャラのバナー・一覧画像を表示部分だけ切り出して軽量化（1ページ数MB→数百KB）",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "Vs 가이드 상대 선택: 초기 로스터 한 줄 6명, 시즌별 한 줄 4명, 이미지·이름 크게",
          en: "Vs opponent picker: 6 per row for the launch roster, 4 per row per season, larger images and names",
          ja: "Vs相手選択：初期ロスターは1行6人、シーズンは1行4人、画像と名前を大きく",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "캐릭터 상단 배너를 공식 캐릭터 페이지 첫 화면과 같은 구도로",
          en: "Character banners now match the official character page layout",
          ja: "キャラクターのバナーを公式キャラページのファーストビューと同じ構図に",
        },
      },
      {
        kind: "added",
        text: {
          ko: "32명 전원의 캐릭터 페이지, 공식 이미지로 만든 상단 배너와 캐릭터 목록 이미지",
          en: "Pages for all 32 characters, with official-art banners and roster images",
          ja: "全32キャラのページ、公式イラストのバナーとキャラ一覧画像",
        },
      },
      {
        kind: "added",
        text: {
          ko: "Vs 가이드: 상대 캐릭터 선택(32명, 분류별) 과 주제 태그 5가지 (운영 팁 · 윕퍼 · 확정 딜캐 · 끼어들기 · 기타)",
          en: "Vs guides: pick an opponent (32 characters by release group) and filter by 5 topics",
          ja: "Vsガイド：対戦相手の選択（32キャラ、区分別）と5つのトピック",
        },
      },
      {
        kind: "removed",
        text: {
          ko: "프랙티스 세팅 탭 삭제 (셋업 안의 프랙티스 설정으로 통합)",
          en: "Removed the Training settings tab (now part of each setup)",
          ja: "トレーニング設定タブを削除（各セットプレイ内の設定に統合）",
        },
      },
      {
        kind: "added",
        text: {
          ko: "셋업 옵션의 결과에 '기타' 추가 (히트 · 가드 · 헛침 · 기타)",
          en: "Setup option results now include 'Other' (hit / block / whiff / other)",
          ja: "セットプレイのオプション結果に「その他」を追加（ヒット・ガード・空振り・その他）",
        },
      },
      {
        kind: "added",
        text: {
          ko: "콤보·셋업 즐겨찾기 (☆, 로그인 없이 이 브라우저에 저장) 와 '즐겨찾기만' 필터",
          en: "Favorite combos and setups (☆, saved in this browser, no login) with a 'Favorites only' filter",
          ja: "コンボ・セットプレイのお気に入り（☆、ログイン不要でこのブラウザに保存）と「お気に入りのみ」フィルター",
        },
      },
      {
        kind: "removed",
        text: {
          ko: "콤보·셋업의 입력 난이도 표시 삭제 (대상 수준으로 충분)",
          en: "Removed execution difficulty from combos and setups (target level covers it)",
          ja: "コンボ・セットプレイの入力難度表示を削除（対象レベルで十分）",
        },
      },
      {
        kind: "changed",
        adminOnly: true,
        text: {
          ko: "콤보·셋업 목록 아래에도 추가·순서 변경 버튼",
          en: "Add and Reorder buttons also at the bottom of combo and setup lists",
          ja: "コンボ・セットプレイ一覧の下にも追加・並び替えボタン",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "콤보 시작 위치를 대상 수준 배지 바로 옆에 표시",
          en: "Combo start position now shows right next to the level badge",
          ja: "コンボの開始位置を対象レベルのバッジのすぐ横に表示",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "루트를 바꿀 때 카드 높이가 변해 화면이 떨리던 문제 수정",
          en: "Fixed flickering when switching routes changed the card height",
          ja: "ルート切り替えでカードの高さが変わり画面がちらつく問題を修正",
        },
      },
      {
        kind: "added",
        text: {
          ko: "콤보 메모를 공용·루트별로 나눔. 마지막에 고른 루트의 정보를 계속 표시",
          en: "Combo notes split into shared and per-route; the last hovered route stays shown",
          ja: "コンボのメモを共通・ルート別に分割。最後に選んだルートの情報を表示し続ける",
        },
      },
      {
        kind: "added",
        text: {
          ko: "한 콤보에 루트 여러 개. 루트에 마우스를 올리면 데미지·프레임 등이 그 루트로 바뀜",
          en: "Combos can hold multiple routes; hover a route to see its damage, frames and gauge cost",
          ja: "1つのコンボに複数ルート。ルートにマウスを重ねるとダメージ・フレームなどがそのルートに切り替わる",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "콤보·셋업 건수에 대상 수준 숨김도 반영",
          en: "Combo and setup counts now reflect hidden target levels",
          ja: "コンボ・セットプレイの件数に対象レベルの非表示も反映",
        },
      },
      {
        kind: "changed",
        adminOnly: true,
        text: {
          ko: "대상 수준을 숨기면 순서 변경 버튼도 함께 숨김",
          en: "Reorder controls now hide along with hidden target levels",
          ja: "対象レベルを非表示にすると並び替えボタンも非表示に",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "데미지를 아직 적지 않은 콤보도 고른 데미지 기준 시동기를 강조",
          en: "The chosen damage-basis starter is highlighted even before damage is filled in",
          ja: "ダメージ未入力のコンボでも選んだダメージ基準始動技を強調",
        },
      },
      {
        kind: "changed",
        adminOnly: true,
        text: {
          ko: "새 콤보·셋업 저장 시 '구간 반복' 오류 수정",
          en: "Fixed a 'segment loop' error when saving new combos and setups",
          ja: "新規コンボ・セットプレイ保存時の「区間リピート」エラーを修正",
        },
      },
      {
        kind: "added",
        adminOnly: true,
        text: {
          ko: "콤보·셋업 목록에서 카드 왼쪽 ▲ ⠿ ▼ 로 바로 순서 변경 (자동 저장)",
          en: "Reorder combos and setups right in the list with ▲ ⠿ ▼ beside each card (auto-saved)",
          ja: "コンボ・セットプレイ一覧でカード左の ▲ ⠿ ▼ から直接並び替え（自動保存）",
        },
      },
      {
        kind: "changed",
        adminOnly: true,
        text: {
          ko: "콤보·셋업 순서를 숫자 대신 '순서 변경' 창에서 끌어서 또는 ▲▼로 변경",
          en: "Reorder combos and setups by dragging or ▲▼ in a 'Reorder' dialog instead of numbers",
          ja: "コンボ・セットプレイの並び順を数字ではなく「並び替え」画面でドラッグや▲▼で変更",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "콤보 데미지 기준 시동기를 직접 골라 강조 표시",
          en: "Combos now highlight a chosen damage-basis starter",
          ja: "コンボのダメージ基準始動技を選んで強調表示",
        },
      },
      {
        kind: "changed",
        adminOnly: true,
        text: {
          ko: "시동기 프리셋도 그룹으로 구성 (불러오면 그룹 그대로 추가)",
          en: "Starter presets hold groups too (loaded as-is into combos)",
          ja: "始動技プリセットもグループ構成に（読み込むとグループのまま追加）",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "콤보 시동기를 그룹으로 묶어 표시 (프리셋을 불러오면 그룹으로)",
          en: "Combo starters grouped (loading a preset adds it as a group)",
          ja: "コンボの始動技をグループ表示（プリセットを読み込むとグループに）",
        },
      },
      {
        kind: "added",
        text: {
          ko: "콤보 퍼가기 (링크 · 블로그용 임베드 코드)",
          en: "Share combos (link and embed code for blogs)",
          ja: "コンボの共有（リンク・ブログ用埋め込みコード）",
        },
      },
      {
        kind: "added",
        text: {
          ko: "셋업 퍼가기 (링크 · 블로그용 임베드 코드)",
          en: "Share setups (link and embed code for blogs)",
          ja: "セットプレイの共有（リンク・ブログ用埋め込みコード）",
        },
      },
      {
        kind: "added",
        text: {
          ko: "YouTube 영상 구간 반복 (구간 밖으로 옮기면 반복 멈춤)",
          en: "YouTube segment looping (stops when you seek outside it)",
          ja: "YouTube 動画の区間リピート（区間外へ移動すると停止）",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "YouTube 영상 기본 화질 720p (플레이어 확대)",
          en: "YouTube videos default to 720p (larger player)",
          ja: "YouTube 動画の標準画質を 720p に（プレーヤー拡大）",
        },
      },
      {
        kind: "added",
        adminOnly: true,
        text: { ko: "콤보 · 셋업 복사하기", en: "Duplicate combos and setups", ja: "コンボ・セットプレイの複製" },
      },
      {
        kind: "changed",
        text: {
          ko: "드라이브 리버설(랜덤): 항목별 확률 0~10 (실행하지 않음 · 가드 발동 · 일어서기 발동)",
          en: "Drive Reversal (Random): per-option odds 0–10 (off / on block / on wake-up)",
          ja: "ドライブリバーサル（ランダム）：項目別の確率 0〜10（しない・ガード時・起き上がり時）",
        },
      },
      {
        kind: "added",
        text: {
          ko: "프랙티스 설정에 가드 · 가드 전환 · 드라이브 리버설 설정",
          en: "Training settings: guard, switch guard and Drive Reversal",
          ja: "トレーニング設定にガード・ガード切り替え・ドライブリバーサル",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "셋업 옵션: 옵션 이름과 결과(히트 · 가드 · 헛침) 줄을 들여쓰기로 구분",
          en: "Setup options: result rows (hit / block / whiff) indented under the option name",
          ja: "セットプレイの択：結果（ヒット・ガード・空振り）の行を択名の下にインデント",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "셋업의 '셋업' 항목 이름을 '셋업 초반 공통 루트'로",
          en: "Setup field renamed to 'Common opening route'",
          ja: "セットプレイの項目名を「序盤の共通ルート」に",
        },
      },
      {
        kind: "added",
        text: { ko: "딜레이 아이콘 (delay)", en: "Delay icon (delay)", ja: "ディレイのアイコン（delay）" },
      },
      {
        kind: "changed",
        text: {
          ko: "셋업의 이어지는 콤보: 줄 전체를 눌러 콤보로 이동",
          en: "Setups: click anywhere on a leading combo row to open it",
          ja: "セットプレイ：つながるコンボの行全体をクリックしてコンボへ移動",
        },
      },
      {
        kind: "removed",
        text: { ko: "콤보 후 위치 표시", en: "Position after combo", ja: "コンボ後の位置の表示" },
      },
      {
        kind: "changed",
        text: {
          ko: "셋업 옵션 이름을 입력한 그대로 표시",
          en: "Setup option names shown as entered",
          ja: "セットプレイの択名を入力どおりに表示",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "설명 · 메모의 줄바꿈이 화면에도 그대로 표시",
          en: "Line breaks in descriptions and notes are kept on the page",
          ja: "説明・メモの改行をそのまま表示",
        },
      },
    ],
  },
  {
    date: "2026-09-25",
    items: [
      {
        kind: "changed",
        text: {
          ko: "셋업 프랙티스 설정을 표로 (다운 · 가드 · 데미지 복귀 리버설, 커맨드는 글자로)",
          en: "Setup training settings as tables (wake-up / guard / hit recovery reversal, commands as text)",
          ja: "セットプレイのトレーニング設定を表に（ダウン・ガード・ダメージ復帰リバーサル、コマンドは文字で）",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "셋업 옵션에 결과별(히트 · 가드 · 헛침) 루트와 메모",
          en: "Setup options with routes and notes per result (hit / block / whiff)",
          ja: "セットプレイの択に結果別（ヒット・ガード・空振り）のルートとメモ",
        },
      },
      {
        kind: "added",
        text: {
          ko: "콤보 표기: 몇 번째 타격 5HP(2), 조각 앞뒤 괄호 메모",
          en: "Notation: hit number like 5HP(2), inline notes in parentheses",
          ja: "コンボ表記：5HP(2) のような段数、前後の括弧メモ",
        },
      },
      {
        kind: "added",
        text: { ko: "앞대쉬 · 뒷대쉬 아이콘 (66 / 44)", en: "Forward / back dash icons (66 / 44)", ja: "前ステップ・バックステップのアイコン（66 / 44）" },
      },
      {
        kind: "added",
        text: {
          ko: "앞잡기 · 뒤잡기 아이콘 (f.throw / b.throw)",
          en: "Forward / back throw icons (f.throw / b.throw)",
          ja: "前投げ・後ろ投げアイコン（f.throw / b.throw）",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "셋업 상황 선택지: 거리 무관 · 필드 · 코너",
          en: "Setup situations: any range, midscreen, corner",
          ja: "セットプレイの状況：距離不問・画面中央・画面端",
        },
      },
      {
        kind: "added",
        text: {
          ko: "셋업 페이지: 이어지는 콤보, 프랙티스 설정, 옵션 A/B",
          en: "Setups page: leading combos, training settings, options A/B",
          ja: "セットプレイページ：つながるコンボ、トレーニング設定、択A/B",
        },
      },
      {
        kind: "added",
        text: {
          ko: "콤보에서 연결된 셋업 바로가기 (미리보기 포함), 콤보 후 위치 표시",
          en: "Links from combos to their setups (with preview), position after combo",
          ja: "コンボから関連セットプレイへのリンク（プレビュー付き）、コンボ後の位置表示",
        },
      },
      {
        kind: "added",
        text: {
          ko: "콤보 표기에 히트 상황 배지 (air · counter · punish)",
          en: "Hit situation badges in combo notation (air, counter, punish)",
          ja: "コンボ表記にヒット状況バッジ（air・counter・punish）",
        },
      },
      {
        kind: "added",
        text: { ko: "콤보 후 프레임 표시", en: "Frame advantage after combo", ja: "コンボ後の有利フレーム表示" },
      },
      {
        kind: "changed",
        text: {
          ko: "콤보 태그 정리: 히트 상태(노멀 · 퍼니시 카운터 · 구석 임팩트 가드/스턴), 시작 위치(거리 무관 · 필드 · 코너 근처 · 코너 · 기타)",
          en: "Combo tags: hit states (normal, punish counter, corner DI blocked/stun) and starting position (any, midscreen, near corner, corner, other)",
          ja: "コンボタグ整理：ヒット状況（ノーマル・パニッシュカウンター・画面端インパクト ガード/スタン）、開始位置（距離不問・画面中央・画面端付近・画面端・その他）",
        },
      },
      {
        kind: "removed",
        text: { ko: "콤보 종료 위치", en: "Combo ending position", ja: "コンボ終了位置" },
      },
      {
        kind: "added",
        text: { ko: "업데이트 내역 버튼", en: "Update history button", ja: "更新履歴ボタン" },
      },
      {
        kind: "added",
        adminOnly: true,
        text: {
          ko: "캐릭터별 시동기 프리셋 (콤보 작성 시 불러오기)",
          en: "Per-character starter presets, loadable when writing combos",
          ja: "キャラ別の始動技プリセット（コンボ作成時に読み込み）",
        },
      },
      {
        kind: "added",
        adminOnly: true,
        text: {
          ko: "관리자 3계층 (최고 / 부 / 캐릭터 관리자)",
          en: "Three admin tiers (super / sub / character)",
          ja: "管理者の3階層（最高 / 副 / キャラ担当）",
        },
      },
      {
        kind: "added",
        adminOnly: true,
        text: {
          ko: "변경 이력, 삭제 항목 복구, 동시 편집 경고",
          en: "Change history, restoring deleted items, concurrent edit warning",
          ja: "変更履歴、削除項目の復元、同時編集の警告",
        },
      },
      {
        kind: "added",
        text: { ko: "작성자 · 수정자 표시", en: "Author and editor credits", ja: "作成者・更新者の表示" },
      },
      {
        kind: "added",
        text: {
          ko: "콤보 영상 보기 (YouTube, 펼치기/접기)",
          en: "Combo videos (YouTube, show/hide)",
          ja: "コンボ動画（YouTube、開く/閉じる）",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "콤보를 시동기 + 루트로 구분, 데미지는 첫 번째 시동기 기준",
          en: "Combos split into starters + route; damage based on the first starter",
          ja: "コンボを始動技＋ルートに分割、ダメージは1つ目の始動技基準",
        },
      },
      {
        kind: "removed",
        text: { ko: "콤보 번호(#001) 표시", en: "Combo number (#001) label", ja: "コンボ番号（#001）の表示" },
      },
      {
        kind: "added",
        adminOnly: true,
        text: {
          ko: "관리자 로그인과 콤보 · 패치 편집",
          en: "Admin login and combo / patch editing",
          ja: "管理者ログインとコンボ・パッチ編集",
        },
      },
      {
        kind: "changed",
        text: {
          ko: "SF6 스타일로 전체 디자인 개편 (다크 테마 기본)",
          en: "Redesign in SF6 style (dark theme by default)",
          ja: "SF6風に全体デザインを刷新（ダークテーマが標準）",
        },
      },
      {
        kind: "added",
        text: { ko: "콤보 표기법 안내 페이지", en: "Combo notation guide", ja: "コンボ表記の案内ページ" },
      },
      {
        kind: "added",
        text: {
          ko: "콤보 목록: 대상 수준 · 히트 상태 · 위치 필터, 이미지/텍스트 · 클래식/모던 전환",
          en: "Combo list: level / hit state / position filters, image/text and classic/modern toggles",
          ja: "コンボ一覧：対象・ヒット状況・位置フィルター、画像/テキスト・クラシック/モダン切替",
        },
      },
      {
        kind: "added",
        text: {
          ko: "사이트 공개 준비: 테리 페이지, 한국어 · 영어 · 일본어, 다크/라이트 테마",
          en: "Site foundation: Terry page, Korean / English / Japanese, dark/light theme",
          ja: "サイト基盤：テリーのページ、日本語・英語・韓国語、ダーク/ライトテーマ",
        },
      },
    ],
  },
];
