import { describe, it, expect, vi, afterEach } from "vitest";
import {
  fingerprint,
  pendingFor,
  completePending,
  PENDING_TTL,
  type StoragePort,
} from "@/features/checkout/pending";
import { reconcileSubmitted } from "@/domain/cart";
import {
  structuralOrderSchema,
  orderSchema,
  vietnamToday,
  type CartItem,
} from "@/domain/schemas";
import {
  displayDate,
  parseDisplayDate,
  calendarDate,
  calendarIso,
} from "@/domain/date-time";
import { assertAdminId } from "@/server/admin/auth";
import { pricingRevision } from "@/server/db/mappers";
import { verifyImage } from "@/server/admin/media";
import sharp from "sharp";
function storage(): StoragePort {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) || null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}
const item: CartItem = {
  lineId: crypto.randomUUID(),
  productId: "flower",
  expectedRevision: "rev1",
  quantity: 2,
  configuration: {
    serviceType: "hoa-tam",
    emotion: "Thương",
    relationship: "",
    occasion: "",
    dislikedFlowers: "",
    message: "",
    desiredDate: "2026-10-06",
    desiredTime: "23:59",
    style: "",
    color: "",
    budget: "",
  },
};
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
describe("pending requests and cart reconciliation", () => {
  it("normalizes before hashing and reuses IDs after reload, with no PII in storage", async () => {
    const raw = {
      requestId: crypto.randomUUID(),
      buyer: { name: "  Người test ", phone: "0901234567" },
      recipient: { name: "Người nhận" },
      address: "  Nơi test  ",
      items: [item],
    };
    const { requestId: _id, ...normalized } = structuralOrderSchema.parse(raw);
    void _id;
    const hash = await fingerprint(normalized),
      port = storage(),
      first = pendingFor(port, "/api/orders", hash);
    expect(
      pendingFor(
        port,
        "/api/orders",
        await fingerprint({ ...normalized, address: "Nơi test" }),
      ).requestId,
    ).toBe(first.requestId);
    const persisted = port.getItem("hoe.pending.v1")!;
    expect(persisted).not.toContain("0901234567");
    expect(persisted).not.toContain("Người test");
    expect(persisted).not.toContain("Nơi test");
    completePending(port, "/api/orders", first.requestId);
    expect(pendingFor(port, "/api/orders", hash).requestId).not.toBe(
      first.requestId,
    );
  });
  it("creates a new ID after payload edits or seven days", () => {
    const port = storage(),
      hash = "a".repeat(64),
      first = pendingFor(port, "orders", hash, 1000);
    expect(pendingFor(port, "orders", "b".repeat(64), 1000).requestId).not.toBe(
      first.requestId,
    );
    expect(
      pendingFor(port, "orders", hash, 1000 + PENDING_TTL).requestId,
    ).not.toBe(first.requestId);
  });
  it("keeps changes from another tab and subtracts only the quantity actually sent", () => {
    const added = { ...item, lineId: crypto.randomUUID(), quantity: 1 },
      edited = {
        ...item,
        configuration: { ...item.configuration, color: "hồng" },
      };
    expect(
      reconcileSubmitted([{ ...item, quantity: 5 }, added], [item]),
    ).toEqual([{ ...item, quantity: 3 }, added]);
    expect(reconcileSubmitted([edited, added], [item])).toEqual([
      edited,
      added,
    ]);
    expect(
      reconcileSubmitted([{ ...item, expectedRevision: "rev2" }], [item]),
    ).toHaveLength(1);
  });
  it("parses an old pending date structurally while rejecting it for a new request", () => {
    const raw = {
      requestId: crypto.randomUUID(),
      buyer: { name: "Test", phone: "0901234567" },
      recipient: { name: "Test" },
      address: "Test",
      items: [
        {
          ...item,
          configuration: { ...item.configuration, desiredDate: "2020-01-01" },
        },
      ],
    };
    expect(structuralOrderSchema.safeParse(raw).success).toBe(true);
    expect(orderSchema.safeParse(raw).success).toBe(false);
  });
});
describe("Vietnamese date/time contract", () => {
  it("round trips a leap day and rejects impossible dates", () => {
    expect(displayDate("2028-02-29")).toBe("29/02/2028");
    expect(parseDisplayDate("29/02/2028")).toBe("2028-02-29");
    expect(parseDisplayDate("29/02/2027")).toBeNull();
    expect(parseDisplayDate("31/04/2028")).toBeNull();
    expect(parseDisplayDate("")).toBeNull();
    expect(displayDate("")).toBe("");
    expect(calendarIso(calendarDate("2028-02-29"))).toBe("2028-02-29");
  });
  it("uses Vietnam's midnight rather than UTC's date", () => {
    expect(vietnamToday(new Date("2026-10-05T16:59:59Z"))).toBe("2026-10-05");
    expect(vietnamToday(new Date("2026-10-05T17:00:00Z"))).toBe("2026-10-06");
  });
  it.each(["00:00", "23:59", "", "12:01"])(
    "accepts each-minute time %s",
    (desiredTime) => {
      expect(
        structuralOrderSchema.safeParse({
          requestId: crypto.randomUUID(),
          buyer: { name: "Test", phone: "0901234567" },
          recipient: { name: "Test" },
          address: "Test",
          items: [
            { ...item, configuration: { ...item.configuration, desiredTime } },
          ],
        }).success,
      ).toBe(true);
    },
  );
  it.each(["24:00", "23:60", "1:01"])(
    "rejects invalid time %s",
    (desiredTime) => {
      expect(
        structuralOrderSchema.safeParse({
          requestId: crypto.randomUUID(),
          buyer: { name: "Test", phone: "0901234567" },
          recipient: { name: "Test" },
          address: "Test",
          items: [
            { ...item, configuration: { ...item.configuration, desiredTime } },
          ],
        }).success,
      ).toBe(false);
    },
  );
});
describe("admin and verified media", () => {
  it.each(["jpeg", "webp", "avif"] as const)(
    "decodes and verifies supported %s bytes",
    async (format) => {
      const bytes = await sharp({
        create: { width: 8, height: 8, channels: 3, background: "pink" },
      })
        .toFormat(format)
        .toBuffer();
      expect(await verifyImage(bytes, `image/${format}`)).toMatchObject({
        mime: `image/${format}`,
        width: 8,
        height: 8,
        bytes: bytes.length,
      });
    },
  );
  it("requires an explicit Clerk ID, never an email-only match", () => {
    vi.stubEnv("ADMIN_CLERK_USER_IDS", "user_allowed");
    expect(() => assertAdminId(null)).toThrow();
    expect(() => assertAdminId("user_other")).toThrow();
    expect(assertAdminId("user_allowed")).toBe("user_allowed");
  });
  it("keeps pricing revision stable for editorial updates", () => {
    const product = {
      serviceType: "hoa-tam" as const,
      price: { mode: "fixed" as const, amount: 100, unit: "bó" },
      defaultDesign: {},
      pricedOptions: {},
    };
    expect(pricingRevision(product)).toBe(
      pricingRevision({ ...product, name: "Ảnh mới" } as typeof product),
    );
    expect(pricingRevision(product)).not.toBe(
      pricingRevision({ ...product, price: { ...product.price, amount: 101 } }),
    );
  });
  it("checks actual image bytes instead of trusting extensions or MIME", async () => {
    const bytes = await sharp({
      create: { width: 4, height: 4, channels: 3, background: "pink" },
    })
      .png()
      .toBuffer();
    expect((await verifyImage(bytes, "image/png")).width).toBe(4);
    await expect(verifyImage(bytes, "image/jpeg")).rejects.toThrow();
    await expect(
      verifyImage(Buffer.from("=HYPERLINK(1)"), "image/png"),
    ).rejects.toThrow();
    await expect(
      verifyImage(Buffer.alloc(5242881), "image/png"),
    ).rejects.toThrow();
  });
});
