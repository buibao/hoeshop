export type AdminRow = Record<string, unknown>;
export type FieldIssue = { path: string; message: string };
export function issueMap(issues: FieldIssue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    // Zod array refinements may point at a choice within a single multi-value field.
    const raw = issue.path.replace(
      /\.(defaultDesign|pricedOptions)\.([^.]+)\.\d+$/,
      ".$1.$2",
    );
    const path =
      raw === "product.price"
        ? "product.price.max"
        : raw === "product"
          ? "product.price.mode"
          : raw;
    if (!errors[path]) errors[path] = issue.message;
  }
  return errors;
}
export function productEditorData(row: AdminRow | null): AdminRow {
  const r = row || {};
  return {
    product: {
      id: r.id || "",
      slug: r.slug || "",
      name: r.name || "",
      description: r.description || "",
      serviceType: r.serviceType || "hoa-tam",
      image: r.image || null,
      imageAlt: r.imageAlt || "",
      published: r.publicationStatus === "published",
      fixture: Boolean(r.fixture),
      price:
        r.priceMode === "fixed"
          ? { mode: "fixed", amount: r.amount, unit: r.unit }
          : r.priceMode === "range"
            ? { mode: "range", min: r.min, max: r.max, unit: r.unit }
            : { mode: "quote" },
      defaultDesign: {
        color: "",
        style: "",
        ...((r.defaultDesign as AdminRow) || {}),
      },
      pricedOptions: {
        color: [],
        style: [],
        ...((r.pricedOptions as AdminRow) || {}),
      },
    },
    publicationStatus: r.publicationStatus || "draft",
    sortOrder: r.sortOrder || 0,
  };
}
