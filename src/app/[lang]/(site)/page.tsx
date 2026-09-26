import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharacters } from "@/lib/data";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { SectionTitle } from "@/components/headings";
import { rosterImage } from "@/lib/roster";

export const revalidate = 3600;

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const characters = (await getCharacters()).filter((c) => c.is_published);

  return (
    <div className="flex flex-col gap-10">
      <section className="stripes relative overflow-hidden border border-border bg-surface px-6 py-10 sm:px-10 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-40 size-72 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent-2), transparent 70%)" }}
        />
        <div className="relative flex flex-col gap-4">
          <p className="eyebrow text-accent!">{dict.home.tagline}</p>
          <h1 className="display text-5xl uppercase sm:text-7xl">
            SF6 <span className="text-accent">Repository</span>
          </h1>
          <p className="max-w-xl text-muted">{dict.home.description}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {dict.home.features.map((f) => (
              <li key={f} className="skew border border-border-strong bg-bg/60 px-3 py-1 text-sm font-semibold">
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle eyebrow="Select character" title={dict.selectCharacter} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {characters.map((c, i) => {
            const name = pickLocalized(c.name, lang).text;
            // 따로 정한 이미지가 없으면 공식 캐릭터 목록의 컬러 이미지
            const portrait = c.portrait_url ?? rosterImage(c.slug);
            return (
              <li key={c.id}>
                <Link
                  href={`/${c.slug}`}
                  className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden border border-border bg-surface-2 transition hover:-translate-y-0.5 hover:border-accent"
                >
                  {portrait ? (
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
                      style={{ backgroundImage: `url(${portrait})` }}
                    />
                  ) : (
                    <div aria-hidden className="stripes absolute inset-0" />
                  )}
                  {/* 이미지에 이름이 새겨져 있어서, 이미지가 있으면 이름 글자·어두운 그라데이션을 빼고 번호만 둔다 */}
                  {!portrait && (
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-bg-deep via-bg-deep/40 to-transparent" />
                  )}
                  <span className="display absolute left-3 top-2 text-sm text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="relative p-3">
                    <span className={portrait ? "sr-only" : "display block text-3xl uppercase group-hover:text-accent"}>{name}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
