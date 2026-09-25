/** 패치 버전 표시. 입력값에 이미 "Ver" 가 들어 있으면 앞에 붙이지 않는다. */
export function formatPatchVersion(version: string): string {
  const v = version.trim();
  return /ver/i.test(v) ? v : `Ver. ${v}`;
}
