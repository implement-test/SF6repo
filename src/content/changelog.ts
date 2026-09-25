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
    date: "2026-09-25",
    items: [
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
