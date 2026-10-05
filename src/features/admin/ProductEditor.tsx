"use client";
import { Checkbox } from "@/components/untitled/base/checkbox/checkbox";

import { Action } from "@/components/ui/Action";

import Image from "next/image";
import { shapeChoices, valueLabel } from "@/domain/labels";
import { priceLabel, effectivePrice } from "@/domain/pricing";
import { productSchema, structuralConfigurationSchema } from "@/domain/schemas";
import { AdminField } from "./AdminField";
import type { AdminRow } from "./form-model";
export function ProductEditor({
  data,
  change,
  errors,
  creating,
  selectImage,
}: {
  data: AdminRow;
  change: (path: string, value: unknown) => void;
  errors: Record<string, string>;
  creating: boolean;
  selectImage: (path: string) => void;
}) {
  const p = data.product as AdminRow,
    price = p.price as AdminRow,
    defaults = p.defaultDesign as Record<string, string>,
    options = p.pricedOptions as Record<string, string[]>;
  const fields =
    p.serviceType === "hoa-y"
      ? ["color", "style", "flowerType", "size", "requirements", "referenceUrl"]
      : p.serviceType === "hoa-tam"
        ? ["color", "style", "dislikedFlowers"]
        : ["color", "style"];
  const labels: Record<string, string> = {
    color: "Màu sắc",
    style: "Phong cách",
    flowerType: "Loài hoa",
    size: "Kích thước",
    requirements: "Yêu cầu thiết kế",
    referenceUrl: "Link ảnh tham khảo",
    dislikedFlowers: "Hoa không dùng",
  };
  const field = (
    path: string,
    label: string,
    value: unknown,
    props: Partial<React.ComponentProps<typeof AdminField>> = {},
  ) => (
    <AdminField
      key={path}
      path={path}
      label={label}
      value={value}
      change={change}
      errors={errors}
      {...props}
    />
  );
  const product = productSchema.safeParse(p),
    configuration = structuralConfigurationSchema.safeParse({
      serviceType: p.serviceType,
      ...defaults,
      ...(p.serviceType === "hoa-tam" ? { emotion: "Xem thiết kế" } : {}),
    });
  const previewPrice =
    product.success && configuration.success
      ? priceLabel(
          effectivePrice(
            { ...product.data, revision: "preview" },
            configuration.data,
          ),
        )
      : "Hoàn thiện thiết kế để xem giá";
  return (
    <div className="product-editor-layout grid grid-cols-1 items-start gap-8 xl:grid-cols-3">
      <div>
        <section className="admin-panel rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
          <div className="admin-panel-heading mb-4 flex flex-col gap-3">
            <h2>Thông tin mẫu hoa</h2>
            <p>Những gì khách nhìn thấy khi chọn mẫu.</p>
          </div>
          {field("product.name", "Tên mẫu hoa", p.name)}
          <div className="admin-field-grid grid grid-cols-1 gap-4 md:grid-cols-2">
            {field("product.id", "ID cố định", p.id, {
              readOnly: !creating,
              hint: "Chữ thường, số và dấu gạch ngang. Giữ nguyên sau khi tạo.",
            })}
            {field("product.slug", "Đường dẫn", p.slug)}
          </div>
          {field("product.serviceType", "Dịch vụ", p.serviceType, {
            type: "select",
            options: ["hoa-tam", "hoa-y", "hoa-thoi"],
          })}
          {field("product.description", "Mô tả mẫu hoa", p.description, {
            type: "textarea",
          })}
        </section>
        <section className="admin-panel rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
          <div className="admin-panel-heading mb-4 flex flex-col gap-3">
            <h2>Thiết kế và giá</h2>
            <p>
              Giá áp dụng cho mẫu mặc định và những lựa chọn shop đánh dấu đã
              bao gồm.
            </p>
          </div>
          {field("product.price.mode", "Cách tính giá", price.mode, {
            type: "select",
            options:
              p.serviceType === "hoa-thoi"
                ? ["quote"]
                : ["quote", "fixed", "range"],
          })}
          <div className="admin-field-grid grid grid-cols-1 gap-4 md:grid-cols-2">
            {price.mode === "fixed" &&
              field(
                "product.price.amount",
                "Giá cố định (đồng)",
                price.amount,
                { type: "number" },
              )}
            {price.mode === "range" && (
              <>
                {field("product.price.min", "Giá thấp nhất (đồng)", price.min, {
                  type: "number",
                })}
                {field("product.price.max", "Giá cao nhất (đồng)", price.max, {
                  type: "number",
                })}
              </>
            )}
            {price.mode !== "quote" &&
              field("product.price.unit", "Đơn vị", price.unit)}
          </div>
          {p.serviceType === "hoa-y" && (
            <>
              {field(
                "product.defaultDesign.shape",
                "Hình thức mặc định",
                defaults.shape || "",
                { type: "select", options: ["", ...shapeChoices] },
              )}
              {price.mode !== "quote" && !defaults.shape && (
                <p className="admin-warning rounded-xl bg-secondary p-4 text-warning-primary">
                  Chưa có hình thức mặc định. Bạn có thể lưu nháp; cần chọn
                  trước khi công khai mẫu có giá.
                </p>
              )}
              <fieldset
                id="product.pricedOptions.shape"
                data-field-name="product.pricedOptions.shape"
                className="admin-choice-group flex flex-col gap-3"
                tabIndex={-1}
                aria-invalid={Boolean(errors["product.pricedOptions.shape"])}
                aria-describedby={
                  errors["product.pricedOptions.shape"]
                    ? "shape-options-error"
                    : "shape-options-hint"
                }
              >
                <legend>Hình thức khác đã bao gồm trong giá</legend>
                <p id="shape-options-hint" className="admin-hint text-sm text-tertiary">
                  Không chọn nghĩa là khách cần shop báo giá khi đổi sang hình
                  thức đó.
                </p>
                <div className="admin-shape-choices flex flex-wrap gap-3">
                  {shapeChoices.map((shape) => (
                    <Checkbox key={shape} size="sm" label={valueLabel(shape)} isSelected={(options.shape || []).includes(shape)} onChange={selected => change("product.pricedOptions.shape", selected ? [...(options.shape || []), shape] : (options.shape || []).filter(v => v !== shape))} />
                  ))}
                </div>
                {errors["product.pricedOptions.shape"] && (
                  <p id="shape-options-error" className="admin-field-error text-sm text-error-primary">
                    {errors["product.pricedOptions.shape"]}
                  </p>
                )}
              </fieldset>
            </>
          )}
          {fields.map((key) => (
            <div className="admin-field-grid grid grid-cols-1 gap-4 md:grid-cols-2" key={key}>
              {field(
                `product.defaultDesign.${key}`,
                `${labels[key]} mặc định`,
                defaults[key] || "",
              )}
              {field(
                `product.pricedOptions.${key}`,
                `${labels[key]} khác có giá`,
                (options[key] || []).join("\n"),
                {
                  type: "textarea",
                  rows: 2,
                  hint: "Mỗi dòng một lựa chọn.",
                  change: (path, value) =>
                    change(
                      path,
                      String(value)
                        .split("\n")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    ),
                },
              )}
            </div>
          ))}
        </section>
      </div>
      <aside className="product-editor-aside flex flex-col gap-8">
        <section className="admin-panel rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
          <div className="admin-panel-heading mb-4 flex flex-col gap-3">
            <h2>Xuất bản</h2>
            <p>Giữ bản nháp đến khi thông tin đã sẵn sàng.</p>
          </div>
          {field("publicationStatus", "Hiển thị", data.publicationStatus, {
            type: "select",
            options: ["draft", "published", "archived"],
          })}
          {field("sortOrder", "Thứ tự", data.sortOrder, { type: "number" })}
          <div className="admin-price-preview flex flex-col gap-3 rounded-xl bg-brand-primary p-4">
            <span>Giá theo thiết kế mặc định</span>
            <strong>{previewPrice}</strong>
            <small>Thay đổi ngoài phạm vi có giá cần shop báo giá.</small>
          </div>
        </section>
        <section className="admin-panel rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
          <div className="admin-panel-heading mb-4 flex flex-col gap-3">
            <h2>Hình ảnh</h2>
            <p>Ảnh từ thư viện đã được xác minh.</p>
          </div>
          {p.image ? (
            <div className="admin-product-image relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src={String(p.image)}
                alt={String(p.imageAlt || p.name || "Mẫu hoa")}
                fill
                sizes="320px"
              />
            </div>
          ) : (
            <div className="admin-image-empty rounded-xl bg-secondary p-6 text-tertiary">Chưa chọn ảnh mẫu hoa</div>
          )}
          <div className="admin-image-actions mt-4 flex flex-wrap gap-3">
            <Action
              className="button secondary"
              type="button"
              onClick={() => selectImage("product.image")}
            >
              Chọn ảnh thư viện
            </Action>
            {Boolean(p.image) && (
              <Action
                className="text-link"
                type="button"
                onClick={() => change("product.image", null)}
              >
                Gỡ ảnh
              </Action>
            )}
          </div>
          {errors["product.image"] && (
            <p className="admin-field-error text-sm text-error-primary">{errors["product.image"]}</p>
          )}
          {field("product.imageAlt", "Mô tả ảnh", p.imageAlt)}
        </section>
      </aside>
    </div>
  );
}
