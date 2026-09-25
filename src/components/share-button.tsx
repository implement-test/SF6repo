"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * 셋업 퍼가기: 단독 페이지 링크와 <iframe> 임베드 코드를 복사할 수 있는 팝업.
 * 주소는 지금 접속한 주소(origin) 기준이라, 배포하면 실제 도메인으로 만들어진다.
 * 임베드 높이는 지금 화면에 그려진 카드 높이로 채운다.
 */
export function ShareButton({ kind, id, labels }: { kind: "setup"; id: number; labels: Dictionary["share"] }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function openDialog() {
    const url = `${window.location.origin}/embed/${kind}/${id}`;
    // 카드 높이 + 퍼가기 페이지 여백·하단 링크
    const card = document.getElementById(`${kind}-${id}`);
    const height = Math.max(240, Math.ceil((card?.offsetHeight ?? 560) + 72));
    setLink(url);
    setCode(
      `<iframe src="${url}" width="100%" height="${height}" style="border:0;max-width:1100px" loading="lazy" title="SF6 Repository"></iframe>`,
    );
    setCopied(null);
    setOpen(true);
  }

  async function copy(text: string, which: "link" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
    } catch {
      setCopied(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        title={labels.button}
        className="inline-flex h-7 items-center gap-1.5 border border-border-strong px-2 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M6 10 14 2M9 2h5v5M12 9v4.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5H7" strokeLinecap="round" />
        </svg>
        {labels.button}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
          <section
            role="dialog"
            aria-modal="true"
            aria-label={labels.title}
            className="relative flex w-full max-w-xl flex-col border border-accent bg-surface shadow-2xl"
          >
            <div className="brand-bar h-[3px]" />
            <header className="flex items-center gap-3 border-b border-border px-5 py-3">
              <span className="eyebrow text-accent!">Share</span>
              <h2 className="display text-2xl">{labels.title}</h2>
              <button type="button" onClick={() => setOpen(false)} className="ml-auto text-2xl leading-none text-muted hover:text-fg" aria-label="Close">
                ×
              </button>
            </header>
            <div className="flex flex-col gap-4 px-5 py-4">
              <p className="text-sm text-muted">{labels.note}</p>
              <CopyField label={labels.link} value={link} copied={copied === "link"} onCopy={() => copy(link, "link")} labels={labels} />
              <CopyField label={labels.embed} value={code} copied={copied === "code"} onCopy={() => copy(code, "code")} labels={labels} multiline />
              <a href={link} target="_blank" rel="noopener" className="self-start text-sm font-semibold text-accent hover:underline">
                {labels.preview} ↗
              </a>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function CopyField({
  label,
  value,
  copied,
  onCopy,
  labels,
  multiline = false,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  labels: Dictionary["share"];
  multiline?: boolean;
}) {
  const field =
    "w-full border border-border-strong bg-inset px-2.5 py-1.5 font-mono text-xs outline-none focus:border-accent";
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <div className="flex items-start gap-2">
        {multiline ? (
          <textarea readOnly rows={3} value={value} onFocus={(e) => e.target.select()} className={`${field} resize-none`} />
        ) : (
          <input readOnly value={value} onFocus={(e) => e.target.select()} className={field} />
        )}
        <button
          type="button"
          onClick={onCopy}
          className="skew shrink-0 bg-accent px-3 py-1.5 text-xs font-bold text-accent-fg"
        >
          <span>{copied ? labels.copied : labels.copy}</span>
        </button>
      </div>
    </div>
  );
}
