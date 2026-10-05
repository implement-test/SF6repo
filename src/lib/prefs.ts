import { TARGET_LEVELS, type TargetLevel } from "./types";

/**
 * 방문자 개인 설정. localStorage 에 저장하고 <html> 의 data-* 속성으로 반영한다.
 * 화면 전환은 CSS(globals.css)가 담당하므로 페이지는 정적으로 생성된 그대로 쓸 수 있다.
 *
 *   data-theme="light|dark"
 *   data-notation="image|text"
 *   data-control="classic|modern"
 *   data-hide-beginner / data-hide-advanced  (해당 대상 숨김)
 */

export type Prefs = {
  theme: "light" | "dark";
  notation: "image" | "text";
  control: "classic" | "modern";
  hidden: TargetLevel[];
};

export const PREFS_KEY = "sf6r:prefs";

export const DEFAULT_PREFS: Prefs = {
  // SF6 UI 에 맞춰 다크를 기본으로 한다.
  theme: "dark",
  notation: "image",
  control: "classic",
  hidden: [],
};

/** <head> 에서 첫 페인트 전에 실행되는 스크립트. applyPrefs 와 같은 일을 한다. */
export const PREFS_INLINE_SCRIPT = `(function(){try{
var d=document.documentElement,p={};
try{p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_KEY)})||"{}")||{}}catch(e){}
d.setAttribute("data-theme",p.theme||"dark");
d.setAttribute("data-notation",p.notation||"image");
d.setAttribute("data-control",p.control||"classic");
(p.hidden||[]).forEach(function(l){d.setAttribute("data-hide-"+l,"")});
}catch(e){}})()`;

export function applyPrefs(prefs: Prefs) {
  const d = document.documentElement;
  d.setAttribute("data-theme", prefs.theme);
  d.setAttribute("data-notation", prefs.notation);
  d.setAttribute("data-control", prefs.control);
  for (const level of TARGET_LEVELS) {
    if (prefs.hidden.includes(level)) d.setAttribute(`data-hide-${level}`, "");
    else d.removeAttribute(`data-hide-${level}`);
  }
}

export function readPrefs(): Prefs {
  let stored: Partial<Prefs> = {};
  try {
    stored = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") || {};
  } catch {}
  // 예전 단계(중급 등)로 저장된 숨김은 버린다
  const hidden = Array.isArray(stored.hidden) ? stored.hidden.filter((l) => TARGET_LEVELS.includes(l)) : [];
  return { ...DEFAULT_PREFS, ...stored, hidden };
}

export function writePrefs(prefs: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
  applyPrefs(prefs);
}
