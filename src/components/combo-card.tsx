import type { Combo, ComboRoute } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { pickLocalized } from "@/lib/i18n/localized";
import { parseYouTube } from "@/lib/youtube";
import { damageBasisIndex, flattenStarters } from "@/lib/starters";
import { comboRoutes } from "@/lib/combo-routes";
import { ControlNotation } from "./notation";
import { RouteList, RoutePanels, RouteRow, RouteScope } from "./combo-route-switch";
import { FinishBadge, SetupChips } from "./combo-finish";
import type { LinkedSetup } from "@/lib/setup-links";
import { LevelBadge, NotTranslatedBadge, OutdatedBadge, PositionBadge, Tag } from "./badges";
import { CardShell } from "./card-shell";
import { ItemMedia } from "./media";
import { EditButton } from "./admin/admin-context";
import { ShareButton } from "./share-button";
import { FavoriteButton } from "./favorite-button";

export function ComboCard({
  combo,
  locale,
  dict,
  latestPatchId,
  authors,
  characterSlug,
  linkedSetups = [],
  embedded = false,
}: {
  combo: Combo;
  locale: Locale;
  dict: Dictionary;
  latestPatchId: number | null;
  authors: Record<string, string>;
  characterSlug: string;
  /** 이 콤보의 루트(마무리)에서 이어지는 셋업. preview 는 마우스를 올렸을 때 보여 줄 텍스트 */
  linkedSetups?: LinkedSetup[];
  /** 다른 사이트에 퍼간 화면: 펼친 채로 보여 주고, 퍼가기·수정 버튼을 빼고, 방문자의 대상 수준 숨김 설정도 무시한다 */
  embedded?: boolean;
}) {
  const createdBy = combo.created_by ? authors[combo.created_by] : undefined;
  const updatedBy = combo.updated_by ? authors[combo.updated_by] : undefined;
  const title = combo.title ? pickLocalized(combo.title, locale) : null;
  const notes = combo.notes ? pickLocalized(combo.notes, locale) : null;
  const outdated = latestPatchId !== null && combo.patch_id !== latestPatchId;
  const position = dict.position[combo.position_start] ?? combo.position_start;
  const groups = (combo.starters ?? []).filter((g) => g.starters.length > 0);
  const starters = flattenStarters(groups);
  // 그룹마다 앞 그룹들의 시동기 수 (번호를 이어 매기기 위해)
  const groupOffsets = groups.map((_, g) => groups.slice(0, g).reduce((sum, x) => sum + x.starters.length, 0));
  // 데미지 기준 시동기 (관리자가 고른 것, 없으면 첫 번째)
  const basisIndex = damageBasisIndex(groups);
  const routes = comboRoutes(combo);
  const multiRoute = routes.length > 1;
  const damages = routes.flatMap((r) => [r.damage, ...r.finishes.map((f) => f.damage)]);
  const hasDamage = damages.some((d) => d !== null);
  // 직접 고른 기준은 데미지가 아직 비어 있어도 강조한다 (고르지 않았으면 데미지가 있을 때만 첫 번째를 강조)
  const basisChosen = starters.some((s) => s.damage_basis);
  const basisNote = dict.combo.damageBasis.replace("{n}", String(basisIndex + 1));
  const hasMedia = !!combo.media_url || !!parseYouTube(combo.youtube_url);

  // 셋업 연결을 루트별로. 콤보를 고쳐서 없어진 루트 · 마무리를 가리키면 루트 1 · 마무리 없음으로
  const setupsByRoute = routes.map((_, r) =>
    linkedSetups
      .map((s) => {
        const routeIndex = s.routeIndex < routes.length ? s.routeIndex : 0;
        const finishIndex = s.finishIndex !== null && s.finishIndex < routes[routeIndex].finishes.length ? s.finishIndex : null;
        return { ...s, routeIndex, finishIndex };
      })
      .filter((s) => s.routeIndex === r),
  );

  // 루트 표기 + 마무리 배지(마무리별 셋업은 팝업 안) + 루트 전체에서 이어지는 셋업
  const routeNotation = (route: ComboRoute, r: number) => (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <ControlNotation classic={route.classic} modern={route.modern} classicOnlyLabel={dict.combo.classicOnly} />
        <FinishBadge finishes={route.finishes} setups={setupsByRoute[r]} characterSlug={characterSlug} dict={dict} />
      </div>
      <SetupChips
        setups={setupsByRoute[r].filter((s) => s.finishIndex === null)}
        characterSlug={characterSlug}
        dict={dict}
      />
    </div>
  );

  return (
    <CardShell
      id={`combo-${combo.id}`}
      level={combo.target_level}
      dataLevel={embedded ? undefined : combo.target_level}
      open={embedded}
      header={
        <>
          <LevelBadge level={combo.target_level} label={dict.level[combo.target_level]} />
          <PositionBadge label={position} />
          {title && <h2 className="font-bold">{title.text}</h2>}
          {title && !title.translated && <NotTranslatedBadge label={dict.notTranslated} />}
          {outdated && <OutdatedBadge label={dict.patch.outdated} />}
        </>
      }
      actions={
        embedded ? null : (
          <>
            <FavoriteButton kind="combo" id={combo.id} labels={dict.favorite} />
            <ShareButton kind="combo" id={combo.id} labels={dict.share} />
            <EditButton entity="combo" id={combo.id} scope={combo.character_id} />
          </>
        )
      }
    >
      <RouteScope>
        <div className="grid md:grid-cols-[1fr_15rem]">
          <div className="flex min-w-0 flex-col gap-3 py-4 pl-5 pr-4">
            <div className="flex flex-col border-l-2 border-accent bg-inset">
              {starters.length > 0 && (
                <div className="grid gap-2 px-3 py-3 sm:grid-cols-[4.5rem_1fr]">
                  <span className="eyebrow pt-1.5">{dict.combo.starter}</span>
                  <div className="flex flex-col gap-3">
                    {groups.map((group, g) => (
                      <div key={g} className="flex flex-col gap-2">
                        {/* 그룹 이름 (프리셋 이름 등). 이름 없는 그룹은 제목 없이 */}
                        {group.name && (
                          <span className="flex items-center gap-2 text-xs font-bold text-muted">
                            <span aria-hidden className="h-px w-3 bg-border-strong" />
                            {group.name}
                          </span>
                        )}
                        <ol className="flex flex-col gap-2">
                          {group.starters.map((s, i) => {
                            // 번호는 그룹을 넘어 이어진다. 데미지 기준 시동기는 강조한다
                            const n = groupOffsets[g] + i + 1;
                            const isBasis = (hasDamage || basisChosen) && n - 1 === basisIndex;
                            return (
                              <li
                                key={i}
                                className={`flex items-start gap-2.5 ${isBasis ? "-mx-2 border-l-2 border-highlight bg-highlight/10 px-2 py-1" : ""}`}
                              >
                                <span
                                  className={`display w-4 pt-1 text-right text-base ${isBasis ? "text-highlight-text" : "text-muted"}`}
                                  title={isBasis ? basisNote : undefined}
                                >
                                  {n}
                                </span>
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                  <ControlNotation classic={s.classic} modern={s.modern} classicOnlyLabel={dict.combo.classicOnly} />
                                  {isBasis && (
                                    <span className="border border-highlight/60 px-1.5 py-0.5 text-[0.65rem] font-bold text-highlight-text">
                                      {dict.combo.damageBasisTag}
                                    </span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div
                className={`grid gap-2 px-3 py-3 ${starters.length > 0 || multiRoute ? "sm:grid-cols-[4.5rem_1fr]" : ""} ${starters.length > 0 ? "border-t border-border" : ""}`}
              >
                {(starters.length > 0 || multiRoute) && <span className="eyebrow pt-1.5">{dict.combo.route}</span>}
                {multiRoute ? (
                  // 루트가 여러 개: 마우스를 올린 루트의 수치를 오른쪽에 보여 준다
                  <RouteList className="flex flex-col gap-1">
                    {routes.map((route, r) => (
                      <RouteRow
                        key={r}
                        index={r}
                        className="group/route -mx-2 flex cursor-default items-start gap-2.5 border-l-2 border-transparent px-2 py-1 transition-colors data-[active=true]:border-accent data-[active=true]:bg-surface-2"
                      >
                        <span className="display w-4 pt-1 text-right text-base text-muted group-data-[active=true]/route:text-accent">
                          {r + 1}
                        </span>
                        {starters.length > 0 && <span className="pt-1 text-muted">→</span>}
                        {routeNotation(route, r)}
                      </RouteRow>
                    ))}
                  </RouteList>
                ) : (
                  <div className="flex min-w-0 items-start gap-2">
                    {starters.length > 0 && <span className="pt-1 text-muted">→</span>}
                    {routeNotation(routes[0], 0)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {combo.hit_states.map((h) => (
                <Tag key={h} tone={h === "normal" ? "default" : "accent"}>
                  {dict.hitState[h] ?? h}
                </Tag>
              ))}
            </div>

            {notes && (
              <p className="text-sm whitespace-pre-line text-muted">
                {notes.text} {!notes.translated && <NotTranslatedBadge label={dict.notTranslated} />}
              </p>
            )}
            {/* 루트별 메모: 지금 고른 루트의 것만 (루트 수치와 함께 바뀐다) */}
            {routes.some((r) => r.note) && (
              <RoutePanels
                panels={routes.map((route, r) => {
                  if (!route.note) return null;
                  const note = pickLocalized(route.note, locale);
                  return (
                    // 라벨과 본문을 나눠, 여러 줄이어도 본문 들여쓰기가 맞고 라벨은 본문 높이의 가운데에 온다
                    <div key={r} className="flex items-center gap-2 border-l-2 border-accent pl-2 text-sm text-muted">
                      {multiRoute && (
                        <span className="shrink-0 text-xs font-bold whitespace-nowrap text-accent">
                          {dict.combo.route} {r + 1}
                        </span>
                      )}
                      <p className="min-w-0 whitespace-pre-line">
                        {note.text} {!note.translated && <NotTranslatedBadge label={dict.notTranslated} />}
                      </p>
                    </div>
                  );
                })}
              />
            )}
          </div>

          <aside className="flex flex-col justify-between gap-3 border-t border-border bg-surface-2/60 px-4 py-4 md:border-l md:border-t-0">
            <RoutePanels
              panels={routes.map((route, r) => (
                <div key={r} className="flex flex-col gap-3">
                  {route.finishes.length > 0 ? (
                    // 마무리가 있는 루트: 마무리마다 데미지 · 후상황
                    <div className="flex flex-col gap-2">
                      <p className="eyebrow">
                        {dict.combo.finish}
                        {multiRoute && (
                          <span className="ml-1.5 text-accent">
                            · {dict.combo.route} {r + 1}
                          </span>
                        )}
                      </p>
                      <ol className="flex flex-col gap-1.5">
                        {route.finishes.map((f, i) => (
                          <li key={i} className="flex items-baseline gap-2">
                            <span className="display w-3 text-sm text-highlight-text">{i + 1}</span>
                            <span className="display text-2xl tabular-nums text-highlight-text">
                              {f.damage !== null ? f.damage.toLocaleString() : "—"}
                            </span>
                            {f.frame_after && <span className="display ml-auto text-sm tabular-nums">{f.frame_after}</span>}
                          </li>
                        ))}
                      </ol>
                      {starters.length > 0 && route.finishes.some((f) => f.damage !== null) && (
                        <p className="text-xs text-muted">* {basisNote}</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="eyebrow">
                          {dict.combo.damage}
                          {multiRoute && (
                            <span className="ml-1.5 text-accent">
                              · {dict.combo.route} {r + 1}
                            </span>
                          )}
                        </p>
                        <p className="display text-4xl tabular-nums text-highlight-text">
                          {route.damage !== null ? route.damage.toLocaleString() : "—"}
                        </p>
                        {starters.length > 0 && route.damage !== null && <p className="mt-1 text-xs text-muted">* {basisNote}</p>}
                      </div>
                      {route.frame_after && (
                        <div>
                          <p className="eyebrow">{dict.combo.frameAfter}</p>
                          <p className="display text-2xl tabular-nums">{route.frame_after}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            />
            <p className="text-right text-xs text-muted">{combo.created_date}</p>
            {(createdBy || updatedBy) && (
              <p className="text-xs text-muted">
                {createdBy && (
                  <>
                    {dict.author.created} <b className="font-semibold text-fg">{createdBy}</b>
                  </>
                )}
                {updatedBy && updatedBy !== createdBy && (
                  <>
                    {createdBy && " · "}
                    {dict.author.updated} <b className="font-semibold text-fg">{updatedBy}</b>
                  </>
                )}
              </p>
            )}
          </aside>
        </div>

        {hasMedia && (
          <div className="border-t border-border py-4 pl-5 pr-4">
            <ItemMedia
              youtubeUrl={combo.youtube_url}
              youtubeStart={combo.youtube_start}
              youtubeEnd={combo.youtube_end}
              youtubeLoop={combo.youtube_loop}
              mediaUrl={combo.media_url}
              title={title?.text ?? combo.notation_classic}
              labels={dict.video}
            />
          </div>
        )}
      </RouteScope>
    </CardShell>
  );
}
