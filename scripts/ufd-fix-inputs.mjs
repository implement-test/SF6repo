// 변환 규칙을 고친 뒤, 이미 넣은 커맨드의 입력만 새 규칙으로 바꾸는 SQL 을 만든다.
//
//   node scripts/ufd-fix-inputs.mjs <예전 ufd_moves.sql> [새 ufd_moves.sql]
//   → supabase/data/ufd_fix_inputs.sql
//
// 두 SQL 에서 같은 캐릭터·같은 순번(ord)·같은 영어 이름인 행의 입력이 달라진 것만 고친다.
// 관리자가 이미 손으로 고친 입력은 바꾸지 않는다 (예전 입력과 같을 때만 바꾼다).

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const [oldFile, newFile = path.join(ROOT, "supabase/data/ufd_moves.sql")] = process.argv.slice(2);
if (!oldFile) throw new Error("예전 ufd_moves.sql 경로를 주세요");

const ROW = /^\s+\('\w+', '((?:[^']|'')*)'::jsonb, '((?:[^']|'')*)',.*, (\d+)\),?$/;

function rows(file) {
  const out = new Map();
  let slug = null;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const head = line.match(/^-- (\w+)$/);
    if (head) slug = head[1];
    const m = line.match(ROW);
    if (m && slug) {
      const name = JSON.parse(m[1].replace(/''/g, "'")).en;
      out.set(`${slug}:${m[3]}:${name}`, { slug, name, input: m[2].replace(/''/g, "'") });
    }
  }
  return out;
}

const before = rows(oldFile);
const after = rows(newFile);
const sql = (v) => `'${String(v).replace(/'/g, "''")}'`;
const updates = [];
for (const [key, row] of after) {
  const prev = before.get(key);
  if (prev && prev.input !== row.input) {
    updates.push(
      `update moves set input_classic = ${sql(row.input)}
where character_id = (select id from characters where slug = ${sql(row.slug)})
  and name->>'en' = ${sql(row.name)} and input_classic = ${sql(prev.input)};`,
    );
  }
}

const out = path.join(ROOT, "supabase/data/ufd_fix_inputs.sql");
fs.writeFileSync(
  out,
  `-- scripts/ufd-fix-inputs.mjs 가 만든 파일: 가져온 커맨드의 입력을 고친 변환 규칙으로 바꾼다 (${updates.length}개)
-- 손으로 고친 입력은 그대로 둔다 (예전 입력과 같을 때만 바꾼다)

${updates.join("\n\n")}
`,
);
console.log(`${updates.length}개 → ${path.relative(ROOT, out)}`);
