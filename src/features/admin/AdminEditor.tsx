"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { MediaLibrary } from "./MediaLibrary";
import Modal from "react-bootstrap/Modal";
import { displayDate } from "@/domain/date-time";
import { totalLabel, priceLabel } from "@/domain/pricing";
import { priceSchema } from "@/domain/schemas";
import { valueLabels } from "@/domain/labels";
import { productEditorData, issueMap, type FieldIssue } from "./form-model";
import { ProductEditor } from "./ProductEditor";
import { AdminField } from "./AdminField";
import { adminProductSchema, articleSchema } from "@/server/admin/schemas";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { homeSchema, homeDefaults } from "@/domain/content";
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
  status: "Trạng thái",
  note: "Ghi chú",
  notes: "Lời nhắn của khách",
  createdAt: "Tiếp nhận",
  updatedAt: "Cập nhật",
  editVersion: "Phiên bản",
  displayName: "Tên",
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
const choices = valueLabels;
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
export function ReadOnly({
  value,
  field = "",
}: {
  value: unknown;
  field?: string;
}) {
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
    if (row.pricedCount !== undefined) {
      const total = totalLabel({
        min: Number(row.min),
        max: Number(row.max),
        pricedCount: Number(row.pricedCount),
        quoteCount: Number(row.quoteCount),
      });
      return (
        <p>
          <span className="admin-hint">{total.label}</span>
          <br />
          <strong>{total.value}</strong>
        </p>
      );
    }
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
export function OrderSummary({ row }: { row: Row }) {
  return (
    <section className="admin-order-detail" id="chi-tiet-don">
      <div className="admin-detail-heading">
        <div>
          <span className="eyebrow">ĐƠN HOA</span>
          <h2>
            #
            {String(row.requestId || row.id)
              .slice(0, 8)
              .toUpperCase()}
          </h2>
        </div>
        <StatusBadge value={String(row.businessStatus || "received")} />
      </div>
      <div className="admin-field-grid">
        <section className="admin-panel">
          <h3>Người đặt</h3>
          <ReadOnly value={row.buyer} />
        </section>
        <section className="admin-panel">
          <h3>Người nhận & địa chỉ</h3>
          <ReadOnly value={row.recipient} />
          <p>{String(row.address || "")}</p>
        </section>
      </div>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h3>Hoa và mong muốn</h3>
          <p>
            Ngày, giờ theo từng mẫu là mong muốn của khách, cần shop xác nhận.
          </p>
        </div>
        <ReadOnly value={row.items || []} />
        {Boolean(row.notes) && <p>{String(row.notes)}</p>}
      </section>
      <section className="admin-panel admin-detail-total">
        <div>
          <h3>Giá & lịch nhận</h3>
          <p className="admin-hint">
            Phí giao, thiết kế và lịch nhận được shop xác nhận khi liên hệ.
          </p>
        </div>
        <ReadOnly value={row.totals} />
      </section>
    </section>
  );
}
function initial(resource: string, row: Row | null): Row {
  if (resource === "settings" && row?.key === "home")
    return homeSchema.parse({ ...homeDefaults, ...(row.data as Row) });
  if (resource === "products") return productEditorData(row);
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
  errors,
}: {
  data: Row;
  change: (key: string, value: unknown) => void;
  path?: string;
  creating: boolean;
  resource: string;
  selectImage: (key: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <>
      {Object.entries(data)
        .filter(
          ([key]) =>
            key !== "published" && key !== "fixture" && key !== "publishedAt" &&
            !(resource === "settings" && ["heroProductIds", "featuredProductIds", "featuredLimit"].includes(key)),
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
                  errors={errors}
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
                <AdminField
                  key={full}
                  path={full}
                  label={label}
                  value={value.join("\n")}
                  type="textarea"
                  hint="Mỗi dòng một lựa chọn."
                  errors={errors}
                  change={(path, next) =>
                    change(path, String(next).split("\n").filter(Boolean))
                  }
                />
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
                      errors={errors}
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
                <input
                  id={full}
                  value={String(value || "")}
                  readOnly
                  aria-invalid={Boolean(errors[full])}
                  aria-describedby={errors[full] ? `${full}-error` : undefined}
                />
                {errors[full] && (
                  <small id={`${full}-error`} className="admin-field-error">
                    {errors[full]}
                  </small>
                )}
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
          if (typeof value !== "boolean")
            return (
              <AdminField
                key={full}
                path={full}
                label={label}
                value={value}
                errors={errors}
                change={change}
                options={options}
                readOnly={(key === "id" && !creating) || (resource === "settings" && full === "primaryCta.href")}
                hint={resource === "settings" && full === "primaryCta.href" ? "Nút chính cuộn đến Những đóa hoa của Hòe." : resource === "settings" && full === "title" ? "Xuống dòng để tách các dòng tiêu đề trên trang chủ." : undefined}
                type={
                  options
                    ? "select"
                    : typeof value === "number"
                      ? "number"
                      : (resource === "settings" && full === "title") || [
                            "bodyMarkdown",
                            "description",
                            "body",
                            "answer",
                            "internalNote",
                          ].includes(key)
                        ? "textarea"
                        : "text"
                }
                rows={key === "bodyMarkdown" ? 16 : resource === "settings" && full === "title" ? 2 : 4}
              />
            );
          return (
            <label className="field" key={full}>
              <span>{label}</span>
              <input
                id={full}
                type="checkbox"
                checked={value}
                aria-invalid={Boolean(errors[full])}
                aria-describedby={errors[full] ? `${full}-error` : undefined}
                onChange={(e) => change(full, e.target.checked)}
              />
              {errors[full] && (
                <small id={`${full}-error`} className="admin-field-error">
                  {errors[full]}
                </small>
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
  demo = false,
}: {
  resource: string;
  row: Row | null;
  demo?: boolean;
}) {
  const router = useRouter(),
    [data, setData] = useState(() => initial(resource, row)),
    [message, setMessage] = useState(""),
    [saving, setSaving] = useState(false),
    [imageField, setImageField] = useState<string | null>(null),
    [preview, setPreview] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [version, setVersion] = useState(Number(row?.editVersion || 0)),
    [baseline, setBaseline] = useState(() =>
      JSON.stringify(initial(resource, row)),
    ),
    [conflict, setConflict] = useState(false),
    [latest, setLatest] = useState<Row | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const Heading = demo ? "h3" : "h1";
  const dirty = JSON.stringify(data) !== baseline;
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const navigate = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.origin !== location.origin ||
        anchor.pathname + anchor.search === location.pathname + location.search
      )
        return;
      if (
        !window.confirm(
          "Bạn có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?",
        )
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty]);
  function showErrors(issues: FieldIssue[]) {
    const mapped = issueMap(issues);
    setErrors(mapped);
    requestAnimationFrame(() => {
      const input = document.getElementById(Object.keys(mapped)[0]);
      for (
        let parent = input?.parentElement;
        parent;
        parent = parent.parentElement
      )
        if (parent instanceof HTMLDetailsElement) parent.open = true;
      input?.focus();
    });
  }
  function change(path: string, value: unknown) {
    setData((previous) => {
      const next = structuredClone(previous),
        parts = path.split(".");
      let target: Row = next;
      for (const part of parts.slice(0, -1)) target = target[part] as Row;
      target[parts.at(-1)!] = value;
      if (path === "product.serviceType") {
        const product = next.product as Row;
        const allowed =
          value === "hoa-y"
            ? [
                "color",
                "style",
                "shape",
                "flowerType",
                "size",
                "requirements",
                "referenceUrl",
              ]
            : value === "hoa-tam"
              ? ["color", "style", "dislikedFlowers"]
              : ["color", "style"];
        for (const key of ["defaultDesign", "pricedOptions"])
          product[key] = Object.fromEntries(
            Object.entries(product[key] as Row).filter(([key]) =>
              allowed.includes(key),
            ),
          );
        if (value === "hoa-thoi") product.price = { mode: "quote" };
      }
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
    setErrors((previous) => {
      const next = { ...previous };
      delete next[path];
      return next;
    });
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setErrors({});
    const id = String(
      row?.id || row?.key || (data.product as Row)?.id || data.id || "",
    );
    try {
      const schema =
        resource === "products"
          ? adminProductSchema
          : ["posts", "policies"].includes(resource)
            ? articleSchema
            : null;
      const checked = schema?.safeParse(data);
      if (checked && !checked.success) {
        setMessage("Vui lòng kiểm tra các trường thông tin.");
        showErrors(
          checked.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        );
        return;
      }
      if (demo) {
        const parsed = adminProductSchema.safeParse(data);
        if (!parsed.success) {
          setMessage("Vui lòng kiểm tra các trường thông tin.");
          showErrors(
            parsed.error.issues.map((i) => ({
              path: i.path.join("."),
              message: i.message,
            })),
          );
        } else {
          setMessage(
            "Cấu hình hợp lệ. Đây là mẫu giao diện, chưa ghi dữ liệu.",
          );
          setBaseline(JSON.stringify(data));
        }
        return;
      }
      const response = await fetch(
        `/api/admin/${resource}/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            editVersion: version,
            data,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error.message);
        showErrors(result.error.fields || []);
        setConflict(response.status === 409);
        return;
      }
      setMessage("Đã lưu nội dung.");
      // PUT returns SQL column names; keep the entered model and use its receipt version.
      setBaseline(JSON.stringify(data));
      setVersion(Number(result.row.editVersion ?? result.row.edit_version));
      setConflict(false);
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
      <Heading className="admin-title">
        {row ? "Chi tiết & chỉnh sửa" : "Thêm nội dung mới"}
      </Heading>
      {resource === "orders" && row && <OrderSummary row={row} />}
      {["inquiries", "comments"].includes(resource) && row && (
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
                <strong>{labels[k] || k}: </strong>
                <ReadOnly value={v} field={k} />
              </div>
            ))}
        </div>
      )}
      <AuditHistory rows={row?.audit} />
      <form ref={formRef} onSubmit={save} className="admin-editor" noValidate>
        {Object.keys(errors).length > 0 && (
          <div className="admin-error-summary" role="alert">
            <strong>Cần kiểm tra trước khi lưu</strong>
            <ul>
              {Object.entries(errors).map(([path, error]) => (
                <li key={path}>
                  <a
                    href={`#${path}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(path)?.focus();
                    }}
                  >
                    {error}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <fieldset disabled={saving}>
          {resource === "products" ? (
            <ProductEditor
              data={data}
              change={change}
              errors={errors}
              creating={!row}
              selectImage={setImageField}
            />
          ) : (
            <Fields
              data={data}
              change={change}
              creating={!row}
              resource={resource}
              selectImage={setImageField}
              errors={errors}
            />
          )}
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
              {saving
                ? "Đang lưu…"
                : demo
                  ? "Kiểm tra mẫu giao diện"
                  : "Lưu thay đổi"}
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
          {dirty && <p className="admin-hint">Có thay đổi chưa lưu.</p>}
        </fieldset>
        <p role="status" aria-live="polite">
          {message}
        </p>
        {conflict && (
          <div className="admin-warning">
            <p>
              Bản ghi có thể đã thay đổi. Nội dung đang nhập được giữ nguyên.
            </p>
            <button
              type="button"
              className="button secondary"
              onClick={async () => {
                try {
                  const id = String(
                    row?.id || row?.key || (data.product as Row)?.id || data.id,
                  );
                  const response = await fetch(
                    `/api/admin/${resource}/${encodeURIComponent(id)}`,
                    { cache: "no-store" },
                  );
                  const body = await response.json();
                  if (!response.ok) throw new Error(body.error.message);
                  setLatest(body.rows[0] || null);
                } catch {
                  setMessage(
                    "Chưa tải được bản mới. Nội dung đang nhập vẫn được giữ.",
                  );
                }
              }}
            >
              Xem bản mới nhất
            </button>
            {latest && (
              <>
                <ReadOnly value={latest} />
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Thay nội dung đang nhập bằng bản mới nhất?",
                      )
                    ) {
                      const next = initial(resource, latest);
                      setData(next);
                      setBaseline(JSON.stringify(next));
                      setVersion(Number(latest.editVersion));
                      setLatest(null);
                      setConflict(false);
                      setErrors({});
                      setMessage("Đã tải bản mới nhất.");
                    }
                  }}
                >
                  Dùng bản mới nhất
                </button>
              </>
            )}
          </div>
        )}
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
          {demo ? (
            <p>
              Chọn ảnh từ thư viện chỉ khả dụng trong vùng admin đã đăng nhập.
              Mẫu này không gọi API quản trị.
            </p>
          ) : (
            <MediaLibrary
              onSelect={(url) => {
                if (imageField) change(imageField, url);
                setImageField(null);
              }}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
