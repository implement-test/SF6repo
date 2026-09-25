/** 퍼간 화면 아래의 "SF6 Repository에서 보기" 링크 */
export function EmbedFooter({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="flex items-center justify-end gap-2 px-1 text-xs text-muted hover:text-accent"
    >
      <span className="display text-sm not-italic text-fg">
        SF6 <span className="text-accent">REPOSITORY</span>
      </span>
      {label} ↗
    </a>
  );
}
