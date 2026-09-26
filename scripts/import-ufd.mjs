// Ultimate Frame Data(https://ultimateframedata.com/sf6/) 의 커맨드·프레임 데이터를 받아
// 커맨드 리스트(moves)에 넣는 SQL 을 만든다.
//
//   node scripts/import-ufd.mjs            → supabase/data/ufd_moves.sql
//
// - 사이트에 있는 값만 넣는다 (이름·입력·데미지·발생·지속·경직·히트·가드·판정·설명). 캔슬은 넣지 않는다
// - 이미 커맨드가 있는 캐릭터는 건너뛴다 (SQL 이 확인한다). 비공개로 등록하고 최신 패치 기준으로 둔다
// - 기본기 이름은 한국어로 옮기고, 나머지 이름·설명은 영어 그대로 (ko 와 en 에 같은 글)
// - 요청 사이에 1초씩 쉰다

import fs from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "supabase", "data", "ufd_moves.sql");
const BASE = "https://ultimateframedata.com/sf6/";

// 우리 slug (roster.ts) — 사이트 주소도 같다. 사이트에 없는 캐릭터는 건너뛴다
const roster = fs.readFileSync(path.join(ROOT, "src/lib/roster.ts"), "utf8");
const SLUGS = [...roster.matchAll(/c\("(\w+)", "\w+", /g)].map((m) => m[1]);

const CATEGORY = {
  normalattacks: "normal",
  uniqueattacks: "unique",
  targetcombos: "target_combo",
  jumpattacks: "normal",
  specialmoves: "special",
  superarts: "super",
};

const DIRS = {
  down: "2",
  "down-forward": "3",
  "down forward": "3",
  forward: "6",
  "up-forward": "9",
  "up forward": "9",
  up: "8",
  "up-back": "7",
  "up back": "7",
  back: "4",
  "down-back": "1",
  "down back": "1",
  neutral: "5",
};

const BUTTONS = {
  "light punch": "LP",
  "medium punch": "MP",
  "heavy punch": "HP",
  "light kick": "LK",
  "medium kick": "MK",
  "heavy kick": "HK",
  "hard punch": "HP",
  "hard kick": "HK",
  punch: "P",
  kick: "K",
  p: "P",
  k: "K",
  pp: "PP",
  kk: "KK",
  lp: "LP",
  mp: "MP",
  hp: "HP",
  lk: "LK",
  mk: "MK",
  hk: "HK",
  "two punches": "PP",
  "two kicks": "KK",
  "punch x2": "PP",
  "kick x2": "KK",
};

const KO_STANCE = { standing: "서서", crouching: "앉아", jumping: "점프", "neutral jumping": "제자리 점프" };
const KO_BUTTON = {
  LP: "약펀치",
  MP: "중펀치",
  HP: "강펀치",
  LK: "약킥",
  MK: "중킥",
  HK: "강킥",
};
const KO_LEVEL = { high: "상단", mid: "상단", low: "하단", overhead: "중단", throw: "잡기", unblockable: "가드 불능" };

const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const value = (s) => {
  const v = clean(s);
  return v && v !== "--" && v !== "-" ? v : null;
};

/** "Light Punch" · "LP" 같은 버튼 이름 → 기호 (여러 개는 + 로: "Light Punch + Light Kick") */
function buttons(text) {
  const parts = clean(text)
    .toLowerCase()
    .split(/\s*(?:\+|&|\band\b)\s*/)
    .filter(Boolean);
  const out = parts.map((p) => BUTTONS[p]);
  return out.every(Boolean) ? out.join("") : null;
}

/** "Down, Down-Forward, Forward + Light Punch" → "236LP" (모르는 말이 있으면 null) */
function inputSequence(text) {
  const t = clean(text);
  const plus = t.lastIndexOf("+");
  const dirPart = plus >= 0 ? t.slice(0, plus) : "";
  const btnPart = plus >= 0 ? t.slice(plus + 1) : t;
  const btn = buttons(btnPart);
  if (!btn) return null;
  if (!dirPart.trim()) return btn;
  const dirs = dirPart
    .toLowerCase()
    .split(/\s*,\s*/)
    .filter(Boolean)
    .map((d) => DIRS[d.trim()]);
  return dirs.every(Boolean) ? dirs.join("") + btn : null;
}

/** "Standing Light Punch" → { notation: "5LP", ko: "서서 약펀치" } */
function normalByName(name) {
  const m = clean(name).match(/^(standing|crouching|neutral jumping|jumping)\s+(.+)$/i);
  if (!m) return null;
  const stance = m[1].toLowerCase();
  const btn = buttons(m[2]);
  if (!btn) return null;
  // 점프 공격은 우리 표기의 앞쪽 메모로: "(점프) HP"
  const prefix = stance === "standing" ? "5" : stance === "crouching" ? "2" : `(${KO_STANCE[stance]}) `;
  const ko = KO_BUTTON[btn] ? `${KO_STANCE[stance]} ${KO_BUTTON[btn]}` : null;
  return { notation: prefix + btn, ko };
}

/**
 * 입력 한 단계: "Forward + Heavy Punch" / "Crouching Medium Kick" / "Back Charge, Forward + LP" / "Jump, Down, Down-Back, Back + K"
 * 모으기와 점프는 앞쪽 메모로 쓴다: "(4 모으기) 6LP", "(점프) 214K"
 */
function oneInput(text, jumpBefore = false) {
  let s = clean(text);
  let jump = jumpBefore;
  const jm =
    s.match(/^\((?:forward |neutral )?jump only\)\s*/i) ??
    s.match(/^(?:neutral or forward jump|forward jump|neutral jump|jump)\s*,\s*/i);
  if (jm) {
    jump = true;
    s = s.slice(jm[0].length);
  }
  let charge = null;
  const cm = s.match(/^(back|down|down-back)\s+charge\s*,\s*/i);
  if (cm) {
    charge = DIRS[cm[1].toLowerCase()];
    s = s.slice(cm[0].length);
  }
  const core = normalByName(s)?.notation ?? inputSequence(s);
  if (!core) return null;
  const notes = [jump && "점프", charge && `${charge} 모으기`].filter(Boolean);
  return (notes.length && !core.startsWith("(") ? `(${notes.join(", ")}) ` : "") + core;
}

/** 입력 전체: 파생기(">")와 쉼표로 이은 버튼 목록까지. 모르는 말이 있으면 null */
function sequence(text) {
  const t = clean(text).replace(/\s*\((?:or |chargeless|early|after )[^)]*\)/gi, "");
  const steps = t.includes("+") ? t.split(/\s*>\s*/) : t.split(/\s*[,>]\s*/);
  const out = [];
  let jump = false;
  for (const step of steps) {
    if (/^(?:neutral |forward )?jump$/i.test(step.trim())) {
      jump = true;
      continue;
    }
    const n = oneInput(step, jump);
    if (!n) return null;
    out.push(n);
    jump = false;
  }
  return out.length ? out.join(" → ") : null;
}

/** 기술 하나 → moves 행 (또는 null) */
function toMove(category, el) {
  const get = (cls) => el.querySelector(`.${cls}`)?.text ?? "";
  const fullName = clean(get("movename"));
  if (!fullName || fullName === "Stats") return null;

  const paren = fullName.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  const base = paren ? paren[1] : fullName;
  const inside = paren ? paren[2] : "";
  const seq = value(get("inputsequence"));

  let cat = category;
  let notation = null;
  let ko = null;

  if (category === "misc") {
    if (/forward throw/i.test(fullName)) notation = "f.throw";
    else if (/back throw/i.test(fullName)) notation = "b.throw";
    else if (/throw/i.test(fullName)) notation = "throw";
    cat = /throw/i.test(fullName) ? "throw" : /drive/i.test(fullName) ? "drive" : null;
    if (!cat) return null;
  } else if (category === "normal" && !inside) {
    const n = normalByName(fullName);
    notation = n?.notation ?? null;
    ko = n?.ko ?? null;
  } else if (category === "target_combo" && inside) {
    notation = sequence(inside.replace(/,/g, " >"));
  } else if (seq) {
    notation = sequence(seq);
  } else if (inside) {
    notation = sequence(inside);
  }
  // 알아보지 못한 입력은 원문 그대로 (표기 경고로 보인다)
  if (!notation) notation = seq ?? inside ?? base;

  // 이름: 필살기 강도 등 괄호는 기호로 줄여서 ("Power Wave (LP)")
  const insideShort = inside && buttons(inside);
  const enName = insideShort ? `${base} (${insideShort})` : fullName;

  // 설명: 판정 + 사이트 설명
  const level = value(get("attacktype"));
  const notes = value(get("notes"));
  const koLevel = level ? KO_LEVEL[level.toLowerCase()] ?? level : null;
  const koNotes = [koLevel && `판정: ${koLevel}`, notes].filter(Boolean).join("\n");
  const enNotes = [level && `Hit level: ${level}`, notes].filter(Boolean).join("\n");

  return {
    category: cat,
    name: { ko: ko ?? enName, en: enName },
    input_classic: notation,
    damage: value(get("basedamage")),
    startup: value(get("startup")),
    active: value(get("activeframes")),
    recovery: value(get("recovery")),
    on_hit: value(get("onhit")),
    on_block: value(get("onblock")),
    notes: koNotes ? { ko: koNotes, en: enNotes } : null,
  };
}

function parsePage(html) {
  const root = parse(html);
  const container = root.querySelector("#contentcontainer");
  if (!container) return [];
  const moves = [];
  let category = null;
  // 분류 제목(h2.movecategory)과 기술(div.movecontainer)을 문서 순서대로
  for (const el of container.querySelectorAll("h2.movecategory, div.movecontainer")) {
    if (el.tagName === "H2") {
      const id = el.getAttribute("id") ?? "";
      category = CATEGORY[id] ?? (id === "misc" ? "misc" : null);
      continue;
    }
    if (!category || el.classList.contains("plain")) continue;
    const move = toMove(category, el);
    if (move) moves.push(move);
  }
  return moves;
}

const sql = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const json = (v) => (v ? `${sql(JSON.stringify(v))}::jsonb` : "null");

const blocks = [];
const summary = [];
for (const slug of SLUGS) {
  const res = await fetch(BASE + slug);
  if (!res.ok) {
    summary.push(`${slug}: 없음 (${res.status})`);
    await new Promise((r) => setTimeout(r, 1000));
    continue;
  }
  const moves = parsePage(await res.text());
  const unknown = moves.filter((m) => /[a-z]{3,}/i.test(m.input_classic.replace(/throw/g, ""))).length;
  summary.push(`${slug}: ${moves.length}개${unknown ? ` (입력 원문 그대로 ${unknown}개)` : ""}`);
  if (moves.length) {
    const rows = moves.map(
      (m, i) =>
        `  (${sql(m.category)}, ${json(m.name)}, ${sql(m.input_classic)}, ${sql(m.damage)}, ${sql(m.startup)}, ${sql(m.active)}, ${sql(m.recovery)}, ${sql(m.on_hit)}, ${sql(m.on_block)}, ${json(m.notes)}, ${i})`,
    );
    blocks.push(`-- ${slug}
insert into moves (character_id, category, name, input_classic, damage, startup, active, recovery, on_hit, on_block, notes, patch_id, is_published, sort_order)
select c.id, v.category::move_category, v.name, v.input_classic, v.damage, v.startup, v.active, v.recovery, v.on_hit, v.on_block, v.notes,
       (select id from patches order by released_on desc limit 1), false, v.ord
from characters c, (values
${rows.join(",\n")}
) as v(category, name, input_classic, damage, startup, active, recovery, on_hit, on_block, notes, ord)
where c.slug = ${sql(slug)} and not exists (select 1 from moves m where m.character_id = c.id);
`);
  }
  await new Promise((r) => setTimeout(r, 1000));
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(
  OUT,
  `-- scripts/import-ufd.mjs 가 만든 파일 (${new Date().toISOString().slice(0, 10)})
-- 출처: Ultimate Frame Data (https://ultimateframedata.com/sf6/)
-- 캐릭터별로 커맨드 리스트를 넣는다. 이미 커맨드가 있는 캐릭터는 건너뛴다. 모두 비공개로 등록된다.
--
${summary.map((s) => `--   ${s}`).join("\n")}

${blocks.join("\n")}`,
);
console.log(summary.join("\n"));
console.log(`\n→ ${path.relative(ROOT, OUT)}`);
