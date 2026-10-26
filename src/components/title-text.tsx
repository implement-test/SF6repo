import { Fragment } from "react";
import { splitTitle } from "@/lib/title";
import { Notation } from "./notation";

/**
 * 카드 제목. `236HK` 처럼 백틱으로 감싼 부분은 콤보 표기로 그린다 (방문자의 이미지/텍스트 설정을 따른다).
 */
export function TitleText({ text }: { text: string }) {
  const parts = splitTitle(text);
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="title-nt">
            <Notation notation={part} />
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
