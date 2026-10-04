"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { MediaLibrary } from "./MediaLibrary";
import Modal from "react-bootstrap/Modal";
import { displayDate } from "@/domain/date-time";
import { money, priceLabel } from "@/domain/pricing";
import { priceSchema } from "@/domain/schemas";
type Row = Record<string, unknown>;
const labels: Record<string, string> = {
  id: "ID cố định",
  slug: "Đường dẫn",
  name: "Tên",
  title: "Tiêu đề",
  excerpt: "Mô tả ngắn",
  bodyMarkdown: "Nội dung Markdown",
  category: "Chủ đề",
  publicationStatus: "Xuất bản",
  image: "Ảnh",
  imageAlt: "Mô tả ảnh",
  description: "Mô tả",
  serviceType: "Dịch vụ",
  price: "Giá",
  amount: "Giá cố định (đồng)",
  min: "Giá thấp nhất (đồng)",
  max: "Giá cao nhất (đồng)",
  unit: "Đơn vị",
  defaultDesign: "Thiết kế mặc định",
  pricedOptions: "Lựa chọn đã bao gồm trong giá",
  style: "Phong cách",
  color: "Màu sắc",
  fixture: "Dữ liệu test",
  sortOrder: "Thứ tự",
  businessStatus: "Trạng thái xử lý",
  internalNote: "Ghi chú nội bộ",
  visibility: "Hiển thị",
  data: "Nội dung",
  primaryCta: "Nút chính",
  secondaryCta: "Nút phụ",
  label: "Nhãn",
  href: "Liên kết",
  body: "Nội dung",
  question: "Câu hỏi",
  answer: "Trả lời",
  phone: "Điện thoại",
  email: "Email",
  address: "Địa chỉ",
  hours: "Giờ liên hệ",
  contact: "Liên hệ",
  tagline: "Thông điệp",
  social: "Mạng xã hội",
  faq: "Câu hỏi thường gặp",
  hero: "Ảnh đầu trang",
  story: "Ảnh câu chuyện",
  logo: "Logo",
  src: "Ảnh",
  alt: "Mô tả ảnh",
  width: "Chiều rộng",
  height: "Chiều cao",
  benefits: "Lợi ích",
  process: "Quy trình",
  intro: "Giới thiệu",
  eyebrow: "Dòng dẫn",
  featuredLimit: "Số sản phẩm nổi bật",
  featuredProductIds: "ID sản phẩm nổi bật",
  storySlug: "Slug bài câu chuyện",
  hints: "Gợi ý điền form",
  colorPresets: "Gợi ý màu",
  stylePresets: "Gợi ý phong cách",
  shortName: "Tên ngắn",
  subtitle: "Thông điệp dịch vụ",
  number: "Số thứ tự",
  footnote: "Chú thích",
  imageNote: "Lời nhắn trên ảnh",
  processTitle: "Tiêu đề quy trình",
  faqTitle: "Tiêu đề FAQ",
  publishedAt: "Thời điểm xuất bản",
};
const enums: Record<string, string[]> = {
  publicationStatus: ["draft", "published", "archived"],
  businessStatus: [
    "received",
    "contacted",
    "confirmed",
    "completed",
    "cancelled",
  ],
  visibility: ["visible", "hidden"],
  serviceType: ["hoa-thoi", "hoa-tam", "hoa-y"],
  mode: ["quote", "fixed", "range"],
};
const choices: Record<string, string> = {
  draft: "Bản nháp",
  published: "Công khai",
  archived: "Lưu trữ",
  received: "Mới nhận",
  contacted: "Đã liên hệ",
  confirmed: "Đã xác nhận",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  resolved: "Đã giải quyết",
  visible: "Công khai",
  hidden: "Đã ẩn",
  quote: "Chờ báo giá",
  fixed: "Giá cố định",
  range: "Khoảng giá",
};
const entryTemplates: Record<string, Row> = {
  benefits: { title: "", body: "" },
  process: { title: "", body: "" },
  faq: { question: "", answer: "" },
  social: { label: "", url: "" },
};
function AuditHistory({ rows }: { rows: unknown }) {
  if (!Array.isArray(rows) || !rows.length) return null;
  return (
    <details className="hoe-optional">
      <summary>Lịch sử xử lý</summary>
      {rows.map((entry: Row) => (
        <div className="admin-list-entry" key={String(entry.id)}>
          <p className="small muted">
            {new Date(String(entry.createdAt)).toLocaleString("vi-VN", {
              timeZone: "Asia/Ho_Chi_Minh",
            })}{" "}
            · {String(entry.actorId)}
          </p>
          <ReadOnly value={(entry.metadata as Row)?.after || entry.metadata} />
        </div>
      ))}
    </details>
  );
}
Object.assign(labels, {
  buyer: "Người đặt",
  recipient: "Người nhận",
  totals: "Tạm tính",
  items: "Các mẫu hoa",
  requestId: "Mã tiếp nhận",
  configuration: "Mong muốn",
  emotion: "Cảm xúc muốn gửi",
  relationship: "Mối quan hệ",
  occasion: "Dịp tặng",
  dislikedFlowers: "Hoa không thích",
  message: "Lời nhắn",
  desiredDate: "Ngày mong muốn",
  desiredTime: "Giờ mong muốn",
  budget: "Ngân sách",
  shape: "Hình thức",
  flowerType: "Loài hoa",
  size: "Kích thước",
  requirements: "Yêu cầu riêng",
  referenceUrl: "Ảnh tham khảo",
  recurringNeeds: "Nhu cầu định kỳ",
  benefitEyebrow: "Dòng dẫn lợi ích",
  benefitTitle: "Tiêu đề lợi ích",
  benefitIntro: "Giới thiệu lợi ích",
  servicesEyebrow: "Dòng dẫn dịch vụ",
  servicesTitle: "Tiêu đề dịch vụ",
  servicesIntro: "Giới thiệu dịch vụ",
  featuredEyebrow: "Dòng dẫn nổi bật",
  featuredTitle: "Tiêu đề sản phẩm nổi bật",
  featuredCta: "Nút xem sản phẩm",
  storyEyebrow: "Dòng dẫn câu chuyện",
  storyTitle: "Tiêu đề câu chuyện",
  storyBody: "Nội dung câu chuyện",
  storyCtaLabel: "Nhãn nút câu chuyện",
  ctaEyebrow: "Dòng dẫn cuối trang",
  ctaTitle: "Tiêu đề cuối trang",
  ctaBody: "Nội dung cuối trang",
});
function ReadOnly({ value, field = "" }: { value: unknown; field?: string }) {
  if (Array.isArray(value))
    return (
      <div>
        {value.map((v, i) => (
          <div key={i} className="admin-list-entry">
            <ReadOnly value={v} />
          </div>
        ))}
      </div>
    );
  if (value && typeof value === "object") {
    const row = value as Row;
    if (row.snapshot) return <ReadOnly value={row.snapshot} />;
    if (row.pricedCount !== undefined)
      return (
        <p>
          {Number(row.min) === Number(row.max)
            ? money(Number(row.min))
            : `${money(Number(row.min))} – ${money(Number(row.max))}`}
          {Number(row.quoteCount) > 0 ? " · Chưa gồm phần chờ báo giá" : ""}
        </p>
      );
    if (row.productId && row.configuration) {
      const price = priceSchema.safeParse(row.price);
      return (
        <div>
          <h3>
            {Number(row.quantity)} × {String(row.name)}
          </h3>
          <p>{price.success ? priceLabel(price.data) : "Chờ báo giá"}</p>
          <ReadOnly value={row.configuration} />
        </div>
      );
    }
    return (
      <dl className="admin-readonly">
        {Object.entries(row)
          .filter(([, v]) => v !== "" && v !== null && v !== undefined)
          .map(([k, v]) => (
            <div key={k}>
              <dt>{labels[k] || k}</dt>
              <dd>
                <ReadOnly value={v} field={k} />
              </dd>
            </div>
          ))}
      </dl>
    );
  }
  return (
    <span>
      {field === "desiredDate"
        ? displayDate(String(value))
        : choices[String(value)] || String(value ?? "")}
    </span>
  );
}
function initial(resource: string, row: Row | null): Row {
  if (resource === "products") {
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
          ...((r.defaultDesign as Row) || {}),
        },
        pricedOptions: {
          color: [],
          style: [],
          ...((r.pricedOptions as Row) || {}),
        },
      },
      publicationStatus: r.publicationStatus || "draft",
      sortOrder: r.sortOrder || 0,
    };
  }
  if (resource === "posts" || resource === "policies")
    return Object.fromEntries(
      [
        "id",
        "slug",
        "title",
        "excerpt",
        "bodyMarkdown",
        "category",
        "image",
        "publicationStatus",
        "publishedAt",
      ].map((key) => [
        key,
        row?.[key] ??
          (key === "image" || key === "publishedAt"
            ? null
            : key === "publicationStatus"
              ? "draft"
              : ""),
      ]),
    );
  if (resource === "orders" || resource === "inquiries")
    return {
      businessStatus: row?.businessStatus,
      internalNote: row?.internalNote,
    };
  if (resource === "comments") return { visibility: row?.visibility };
  if (resource === "services") {
    const data = (row?.data as Row) || {};
    return {
      ...data,
      hints: {
        emotion: "",
        color: "",
        style: "",
        budget: "",
        desiredDate: "",
        desiredTime: "",
        requirements: "",
        ...((data.hints as Row) || {}),
      },
    };
  }
  return (row?.data as Row) || {};
}
function Fields({
  data,
  change,
  path = "",
  creating,
  resource,
  selectImage,
}: {
  data: Row;
  change: (key: string, value: unknown) => void;
  path?: string;
  creating: boolean;
  resource: string;
  selectImage: (key: string) => void;
}) {
  return (
    <>
      {Object.entries(data)
        .filter(
          ([key]) =>
            key !== "published" && key !== "fixture" && key !== "publishedAt",
        )
        .map(([key, value]) => {
          const full = path ? `${path}.${key}` : key,
            label = labels[key] || key.replace(/([A-Z])/g, " $1");
          if (value === null && ["logo", "hero", "story"].includes(key))
            return (
              <div key={full} className="field">
                <span>{label}</span>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    change(full, {
                      src: "",
                      alt: "",
                      ...(key === "logo" ? { width: 120, height: 60 } : {}),
                    })
                  }
                >
                  Thêm ảnh
                </button>
              </div>
            );
          if (value && typeof value === "object" && !Array.isArray(value))
            return (
              <fieldset className="admin-fieldset" key={full}>
                <legend>{label}</legend>
                <Fields
                  data={value as Row}
                  change={change}
                  path={full}
                  creating={creating}
                  resource={resource}
                  selectImage={selectImage}
                />
                {["logo", "hero", "story"].includes(key) && (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => change(full, null)}
                  >
                    Gỡ ảnh này
                  </button>
                )}
              </fieldset>
            );
          if (Array.isArray(value)) {
            if (
              !entryTemplates[key] &&
              (!value.length || typeof value[0] === "string")
            )
              return (
                <label className="field" key={full}>
                  <span>
                    {label} <small>(mỗi dòng một lựa chọn)</small>
                  </span>
                  <textarea
                    value={value.join("\n")}
                    onChange={(e) =>
                      change(full, e.target.value.split("\n").filter(Boolean))
                    }
                  />
                </label>
              );
            return (
              <fieldset className="admin-fieldset" key={full}>
                <legend>{label}</legend>
                {value.map((v, i) => (
                  <div key={i} className="admin-list-entry">
                    <Fields
                      data={v as Row}
                      change={change}
                      path={`${full}.${i}`}
                      creating={creating}
                      resource={resource}
                      selectImage={selectImage}
                    />
                    <button
                      type="button"
                      className="text-link"
                      onClick={() =>
                        change(
                          full,
                          value.filter((_, n) => n !== i),
                        )
                      }
                    >
                      Bỏ mục
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    change(full, [
                      ...value,
                      Object.fromEntries(
                        Object.keys(
                          entryTemplates[key] || (value[0] as Row),
                        ).map((k) => [k, ""]),
                      ),
                    ])
                  }
                >
                  Thêm mục
                </button>
              </fieldset>
            );
          }
          if (["image", "src"].includes(key))
            return (
              <div className="field" key={full}>
                <label htmlFor={full}>{label}</label>
                <input id={full} value={String(value || "")} readOnly />
                <div className="hero-actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => selectImage(full)}
                  >
                    Chọn ảnh thư viện
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => change(full, key === "image" ? null : "")}
                  >
                    Gỡ ảnh
                  </button>
                </div>
              </div>
            );
          const options =
            key === "businessStatus" && resource === "inquiries"
              ? ["received", "contacted", "resolved", "cancelled"]
              : enums[key];
          return (
            <label className="field" key={full}>
              <span>{label}</span>
              {options ? (
                <select
                  value={String(value)}
                  onChange={(e) => change(full, e.target.value)}
                >
                  {options.map((v) => (
                    <option key={v} value={v}>
                      {choices[v] || v}
                    </option>
                  ))}
                </select>
              ) : typeof value === "boolean" ? (
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => change(full, e.target.checked)}
                />
              ) : typeof value === "number" ? (
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => change(full, Number(e.target.value))}
                />
              ) : (
                <textarea
                  rows={
                    key === "bodyMarkdown"
                      ? 16
                      : String(value || "").length > 150
                        ? 4
                        : 1
                  }
                  readOnly={key === "id" && !creating}
                  value={String(value || "")}
                  onChange={(e) => change(full, e.target.value)}
                />
              )}
            </label>
          );
        })}
    </>
  );
}
export function AdminEditor({
  resource,
  row,
}: {
  resource: string;
  row: Row | null;
}) {
  const router = useRouter(),
    [data, setData] = useState(() => initial(resource, row)),
    [message, setMessage] = useState(""),
    [saving, setSaving] = useState(false),
    [imageField, setImageField] = useState<string | null>(null),
    [preview, setPreview] = useState(false);
  function change(path: string, value: unknown) {
    setData((previous) => {
      const next = structuredClone(previous),
        parts = path.split(".");
      let target: Row = next;
      for (const part of parts.slice(0, -1)) target = target[part] as Row;
      target[parts.at(-1)!] = value;
      if (path === "product.price.mode") {
        const p = (next.product as Row).price as Row;
        (next.product as Row).price =
          value === "fixed"
            ? {
                mode: value,
                amount: typeof p.amount === "number" ? p.amount : 0,
                unit: p.unit || "mẫu",
              }
            : value === "range"
              ? {
                  mode: value,
                  min: p.min || 0,
                  max: p.max || 0,
                  unit: p.unit || "mẫu",
                }
              : { mode: "quote" };
      }
      return next;
    });
    setMessage("");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const id = String(
      row?.id || row?.key || (data.product as Row)?.id || data.id || "",
    );
    try {
      const response = await fetch(
        `/api/admin/${resource}/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            editVersion: Number(row?.editVersion || 0),
            data,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        setMessage(
          result.error.message +
            (result.error.fields
              ?.map((v: { message: string }) => " " + v.message)
              .join("") || ""),
        );
        return;
      }
      setMessage("Đã lưu nội dung.");
      if (!row) router.replace(`/admin/${resource}/${encodeURIComponent(id)}`);
      router.refresh();
    } catch {
      setMessage("Chưa lưu được. Nội dung bạn nhập vẫn được giữ.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <Link className="text-link" href={`/admin/${resource}`}>
        ← Quay lại danh sách
      </Link>
      <h1 className="admin-title">
        {row ? "Chi tiết & chỉnh sửa" : "Thêm nội dung mới"}
      </h1>
      {["orders", "inquiries", "comments"].includes(resource) && row && (
        <div className="admin-request-summary">
          {Object.entries(row)
            .filter(([k]) =>
              [
                "buyer",
                "recipient",
                "address",
                "contact",
                "body",
                "configuration",
                "totals",
                "items",
                "displayName",
                "requestId",
              ].includes(k),
            )
            .map(([k, v]) => (
              <div key={k}>
                <strong>{labels[k] || k}</strong>
                <ReadOnly value={v} field={k} />
              </div>
            ))}
        </div>
      )}
      <AuditHistory rows={row?.audit} />
      <form onSubmit={save} className="admin-editor">
        <fieldset disabled={saving}>
          <Fields
            data={data}
            change={change}
            creating={!row}
            resource={resource}
            selectImage={setImageField}
          />
          {["posts", "policies"].includes(resource) && (
            <>
              <button
                type="button"
                className="button secondary"
                onClick={() => setPreview(!preview)}
              >
                {preview ? "Đóng" : "Xem thử"} nội dung
              </button>
              {preview && (
                <article className="prose">
                  <ReactMarkdown skipHtml>
                    {String(data.bodyMarkdown)}
                  </ReactMarkdown>
                </article>
              )}
            </>
          )}
          <div className="admin-save">
            <button className="button" type="submit">
              {saving ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
            {row && ["products", "posts", "policies"].includes(resource) && (
              <button
                className="text-link"
                type="button"
                onClick={() => change("publicationStatus", "archived")}
              >
                Chuyển sang lưu trữ
              </button>
            )}
          </div>
        </fieldset>
        <p role="status" aria-live="polite">
          {message}
        </p>
      </form>
      <Modal
        show={Boolean(imageField)}
        onHide={() => setImageField(null)}
        className="hoe-library"
        aria-labelledby="media-library-title"
      >
        <Modal.Header>
          <Modal.Title id="media-library-title">Thư viện ảnh Hòe</Modal.Title>
          <button
            className="button secondary"
            onClick={() => setImageField(null)}
          >
            Đóng thư viện
          </button>
        </Modal.Header>
        <Modal.Body>
          <MediaLibrary
            onSelect={(url) => {
              if (imageField) change(imageField, url);
              setImageField(null);
            }}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}
