import { displayNotation } from "./notation/parse";

/**
 * 제목 안의 표기: `236HK` 처럼 백틱으로 감싼 부분은 콤보 표기로 읽는다 (카드 제목에서 아이콘으로 그린다).
 * 글자만 쓰는 곳(툴팁 · 페이지 제목 · 셋업 미리보기)에서는 백틱을 떼고 텍스트 표기로.
 *
 * 제목을 글자와 표기 조각으로 나눈다. 홀수 번째가 표기
 */
export function splitTitle(text: string): string[] {
  return text.split(/`([^`]+)`/);
}

export function plainTitle(text: string): string {
  return splitTitle(text)
    .map((part, i) => (i % 2 === 1 ? displayNotation(part) : part))
    .join("");
}
