// A small, auditable patch. Unknown keys and existing copy are deliberately preserved.
export function homeFeedbackMigration(data: Record<string, unknown>) {
  const primary = data.primaryCta as { label: string; href: string } | undefined;
  const ids = data.featuredProductIds as string[] | undefined;
  const patch: Record<string, unknown> = {};
  if (primary && primary.href !== "/#nhung-doa-hoa") patch.primaryCta = { ...primary, href: "/#nhung-doa-hoa" };
  if (ids && ids.length > 10) patch.featuredProductIds = ids.slice(0, 10);
  if (ids && ids.length >= 10 && data.featuredLimit !== 10) patch.featuredLimit = 10;
  return patch;
}
