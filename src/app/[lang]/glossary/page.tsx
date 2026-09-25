import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ComingSoon } from "@/components/coming-soon";

export default async function Page({ params }: PageProps<"/[lang]/glossary">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <ComingSoon message={getDictionary(lang).comingSoon} />;
}