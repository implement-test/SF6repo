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
    date: "2026-09-26",
    items: [
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
