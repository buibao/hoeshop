"use client";
import { Form } from "@/components/ui/Form";
import { ActionLink } from "@/components/ui/ActionLink";
import { Action } from "@/components/ui/Action";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useCart } from "./store";
import type { CartItem, Product } from "@/domain/schemas";
import { configurationSchema } from "@/domain/schemas";
import {
  effectivePrice,
  priceLabel,
  summarize,
  totalLabel,
} from "@/domain/pricing";
import {
  ConfigurationFields,
  configurationInput,
  type Guidance,
} from "@/features/checkout/configuration";
import { Empty } from "@/components/Empty";
import { focusError } from "@/components/Fields";
import { displayDate } from "@/domain/date-time";
import { QuantityField } from "@/components/ui/QuantityField";
export function CartSummary({
  products,
  checkout = false,
}: {
  products: Product[];
  checkout?: boolean;
}) {
  const { items } = useCart();
  const lines = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      quantity: item.quantity,
      price: product
        ? effectivePrice(product, item.configuration)
        : { mode: "quote" as const },
    };
  });
  const totals = summarize(lines),
    display = totalLabel(totals);
  return (
    <aside className="card rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary cart-summary flex flex-col gap-4 rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
      <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">GIỎ HOA CỦA BẠN</span>
      <h3>{display.label}</h3>
      <div className="total flex flex-col gap-3 border-t border-secondary pt-4">{display.value}</div>
      {totals.quoteCount ? (
        <p className="small text-sm muted text-tertiary">
          {totals.quoteCount} dòng cần shop báo giá; phần này chưa nằm trong tạm
          tính.
        </p>
      ) : null}
      <hr className="divider my-4 border-secondary" />
      {items.map((item) => {
        const p = products.find((p) => p.id === item.productId);
        return (
          <p className="small text-sm" key={item.lineId}>
            {item.quantity} × {p?.name || "Mẫu không còn khả dụng"}
          </p>
        );
      })}
      <p className="form-note text-sm text-tertiary">
        Phí giao: chờ shop xác nhận.
        <br />
        Gửi yêu cầu chưa phải xác nhận đơn hoặc thanh toán.
      </p>
      {!checkout ? (
        <ActionLink href="/dat-hoa" className="button">
          Gửi yêu cầu đặt hoa
        </ActionLink>
      ) : (
        <ActionLink href="/gio-hang" className="text-link">
          Chỉnh sửa giỏ hoa
        </ActionLink>
      )}
    </aside>
  );
}
function CartRow({
  item,
  product,
  guidance,
}: {
  item: CartItem;
  product?: Product;
  guidance?: Guidance;
}) {
  const cart = useCart();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = configurationSchema.safeParse(
      configurationInput(
        new FormData(e.currentTarget),
        item.configuration.serviceType,
      ),
    );
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join("."), i.message]),
        ),
      );
      focusError(e.currentTarget, parsed.error.issues[0].path.join("."));
      return;
    }
    try {
      cart.update(item.lineId, {
        ...item,
        configuration: parsed.data,
        expectedRevision: product?.revision || item.expectedRevision,
      });
      setEditing(false);
      setError("");
    } catch {
      setError("Chưa lưu được cấu hình. Vui lòng kiểm tra lại.");
    }
  }
  const changed = product && product.revision !== item.expectedRevision;
  return (
    <article className="cart-row flex flex-col gap-4 border-b border-secondary py-6">
      <div className="cart-row-top flex items-start gap-4">
        <div className="cart-thumbnail aspect-[4/5] relative w-20 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={product?.image || "/images/floral-mark.svg"}
            alt={product?.name || "Mẫu hoa"}
            fill
            sizes="85px"
          />
        </div>
        <div className="cart-row-main flex min-w-0 flex-1 flex-col gap-3">
          <h3>
            {product ? (
              <Link href={`/san-pham/${product.slug}`}>{product.name}</Link>
            ) : (
              "Mẫu không còn khả dụng"
            )}
          </h3>
          <p>
            {product
              ? priceLabel(effectivePrice(product, item.configuration))
              : "Vui lòng xóa mẫu này khỏi giỏ."}
          </p>
          {item.configuration.serviceType === "hoa-tam" ? (
            <p>Cảm xúc: {item.configuration.emotion}</p>
          ) : null}
          {item.configuration.desiredDate ? (
            <p>
              Ngày mong muốn: {displayDate(item.configuration.desiredDate)}
              {item.configuration.desiredTime
                ? " · " + item.configuration.desiredTime
                : ""}
            </p>
          ) : null}
          {changed ? (
            <div className="error rounded-xl bg-primary p-4 text-error-primary ring-1 ring-error_subtle" role="alert">
              Thông tin mẫu đã thay đổi. Hãy xem cấu hình và lưu lại để chấp
              nhận giá hiện tại.
            </div>
          ) : null}
          <div className="cart-row-controls flex flex-wrap gap-3">
            <QuantityField
              value={item.quantity}
              onChange={(value) => {
                try {
                  cart.update(item.lineId, { ...item, quantity: value });
                  setError("");
                } catch {
                  setError("Chưa cập nhật được số lượng.");
                }
              }}
            />
            {product ? (
              <Action
                className="link-button"
                onClick={() => setEditing(!editing)}
                aria-expanded={editing}
              >
                {editing ? "Đóng cấu hình" : "Sửa cấu hình"}
              </Action>
            ) : null}
            <Action
              className="icon-button"
              aria-label={`Xóa ${product?.name || "mẫu"}`}
              onClick={() => cart.remove(item.lineId)}
            >
              <Trash2 size={16} />
            </Action>
          </div>
          {error ? (
            <div role="alert" className="error rounded-xl bg-primary p-4 text-error-primary ring-1 ring-error_subtle">
              {error}
            </div>
          ) : null}
        </div>
      </div>
      {editing ? (
        <Form className="edit-form mt-4 flex flex-col gap-4 rounded-xl bg-secondary p-6" onSubmit={save} noValidate>
          <ConfigurationFields
            serviceType={item.configuration.serviceType}
            initial={item.configuration}
            errors={errors}
            guidance={guidance}
          />
          <Action className="button" type="submit">
            Lưu cấu hình
          </Action>
        </Form>
      ) : null}
    </article>
  );
}
export function CartView({
  products,
  services = [],
}: {
  products: Product[];
  services?: Array<Guidance & { id: string }>;
}) {
  const cart = useCart();
  if (!cart.ready)
    return (
      <p role="status" className="section py-12 md:py-16">
        Đang mở giỏ hoa…
      </p>
    );
  if (!cart.items.length)
    return (
      <div >
        <Empty
          title="Giỏ hoa đang chờ một chút dịu dàng"
          body="Hãy chọn một mẫu hoa và kể điều bạn muốn gửi."
          href="/san-pham"
          action="Khám phá các mẫu hoa"
        />
      </div>
    );
  return (
    <>
      <p className="form-note text-sm text-tertiary">
        Các dịch vụ có thể ở cùng một giỏ. Mỗi yêu cầu dùng một người nhận và
        địa chỉ chung; nhiều địa chỉ cần gửi riêng.
      </p>
      {cart.notice ? (
        <div className="error rounded-xl bg-primary p-4 text-error-primary ring-1 ring-error_subtle" role="status">
          {cart.notice}
        </div>
      ) : null}
      <div className="cart-layout grid grid-cols-1 items-start gap-8 py-8 lg:grid-cols-2">
        <div>
          {cart.items.map((item) => (
            <CartRow
              key={item.lineId}
              item={item}
              product={products.find((p) => p.id === item.productId)}
              guidance={services.find(
                (s) => s.id === item.configuration.serviceType,
              )}
            />
          ))}
        </div>
        <CartSummary products={products} />
      </div>
    </>
  );
}
