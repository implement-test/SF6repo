import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { NotationImage } from "@/components/notation";
import { NotationPlayground } from "@/components/notation-playground";
import { PageHeader, SectionTitle } from "@/components/headings";

const LEGEND: { notation: string; ko: string; en: string; ja: string }[] = [
  { notation: "2MK", ko: "방향 + 버튼 (5는 생략)", en: "Direction + button (5 omitted)", ja: "方向 + ボタン (5は省略)" },
  { notation: "1 → 3 → 7 → 8 → 9", ko: "방향 (키보드 숫자 패드 배치)", en: "Directions (numpad layout)", ja: "方向 (テンキー配置)" },
  { notation: "236HP → 214LK → 623MP", ko: "커맨드 입력", en: "Motion inputs", ja: "コマンド入力" },
  { notation: "236PP → 214KK", ko: "펀치/킥 버튼 2개 (약중강 무관)", en: "Any two punches / kicks", ja: "パンチ/キック2つ同時押し" },
  { notation: "2MK → 5HP", ko: "→ 연결·캔슬", en: "→ link / cancel", ja: "→ つなぎ・キャンセル" },
  { notation: "MP..HP", ko: ".. 타겟 콤보 (마침표 2개)", en: ".. target combo (two periods)", ja: ".. ターゲットコンボ（ピリオド2つ）" },
  {
    notation: "counter 5HP → punish 2MP → air HP → guard 2LK",
    ko: "상황: counter 카운터 / punish 퍼니시 카운터 / air 공중 / guard 가드시킴 (커맨드 앞에)",
    en: "Situation before a command: counter / punish (punish counter) / air / guard (blocked)",
    ja: "状況（コマンドの前）：counter カウンター / punish パニッシュカウンター / air 空中 / guard ガードさせる",
  },
  { notation: "delay 5HP", ko: "delay 딜레이 입력", en: "delay = delayed input", ja: "delay ディレイ入力" },
  { notation: "66 → 44", ko: "앞대쉬 / 뒷대쉬", en: "Forward dash / back dash", ja: "前ステップ / バックステップ" },
  { notation: "f.throw → b.throw", ko: "앞잡기 / 뒤잡기", en: "Forward throw / back throw", ja: "前投げ / 後ろ投げ" },
  { notation: "DR → DRC → DI", ko: "생 드라이브 러시 / 캔슬 드라이브 러시 / 드라이브 임팩트", en: "Raw Drive Rush / Drive Rush cancel / Drive Impact", ja: "生ドライブラッシュ / キャンセルラッシュ / ドライブインパクト" },
  { notation: "DRC 5HP → DR 5MP", ko: "DR · DRC 는 기술 앞에 붙여서도 쓴다", en: "DR / DRC can also prefix a move", ja: "DR・DRC は技の前に付けても書ける" },
  { notation: "2MP → 5HP :: 2HP :: 2MK → 236HP", ko: ":: 는 이 중 하나 (세로로 쌓아 표시)", en: ":: means any one of these (stacked)", ja: ":: はこの中のどれか（縦に並べて表示）" },
  { notation: "2MP → {DRC 5HP} → 236HP", ko: "{ } 안은 통째로 생략 가능", en: "{ } marks a part you can skip", ja: "{ } の中は省略可能" },
  { notation: "2MP → 236HP → etc", ko: "etc 이후는 자유롭게 이어 간다", en: "etc: continue however you like", ja: "etc 以降は自由につなぐ" },
  { notation: "SA1 → SA2 → SA3", ko: "sa1 · sa2 · sa3 슈퍼 아츠", en: "sa1 / sa2 / sa3: Super Arts", ja: "sa1・sa2・sa3 スーパーアーツ" },
  { notation: "parry → 5HP", ko: "parry 저스트 패리", en: "parry: Perfect Parry", ja: "parry ジャストパリィ" },
  { notation: "L → M → H → SP → A+M → ANY", ko: "모던 버튼 (A = 어시스트)", en: "Modern buttons (A = assist)", ja: "モダンボタン (A = アシスト)" },
];

export default async function NotationPage({ params }: PageProps<"/[lang]/notation">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader eyebrow="Notation" title={dict.notationPage.title}>
        {dict.notationPage.intro}
      </PageHeader>

      <section className="flex flex-col gap-4">
        <SectionTitle eyebrow="Try it" title={dict.notationPage.tryIt} />
        <NotationPlayground initial="2MP → DRC 5HP → MP..HP → sa3" unknownLabel={dict.notationPage.unknown} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle eyebrow="Legend" title={dict.notationPage.legend} />
        <div className="overflow-hidden border border-border bg-surface">
          <div className="hidden grid-cols-[15rem_1fr_1fr] gap-4 border-b border-border bg-surface-2 px-4 py-2 sm:grid">
            <span className="eyebrow">Text</span>
            <span className="eyebrow">Image</span>
            <span className="eyebrow">Meaning</span>
          </div>
          <ul className="divide-y divide-border">
            {LEGEND.map((row) => (
              <li
                key={row.notation}
                className="grid gap-2 px-4 py-3 transition-colors hover:bg-surface-2 sm:grid-cols-[15rem_1fr_1fr] sm:items-center sm:gap-4"
              >
                <code className="font-mono text-sm text-highlight-text">{row.notation}</code>
                <NotationImage notation={row.notation} />
                <span className="text-sm text-muted">{row[lang]}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
