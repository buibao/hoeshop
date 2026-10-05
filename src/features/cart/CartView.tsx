"use client";
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
    <aside className="card cart-summary">
      <span className="eyebrow">GIỎ HOA CỦA BẠN</span>
      <h3>{display.label}</h3>
      <div className="total">{display.value}</div>
      {totals.quoteCount ? (
        <p className="small muted">
          {totals.quoteCount} dòng cần shop báo giá; phần này chưa nằm trong tạm
          tính.
        </p>
      ) : null}
      <hr className="divider" />
      {items.map((item) => {
        const p = products.find((p) => p.id === item.productId);
        return (
          <p className="small" key={item.lineId}>
            {item.quantity} × {p?.name || "Mẫu không còn khả dụng"}
          </p>
        );
      })}
      <p className="form-note">
        Phí giao: chờ shop xác nhận.
        <br />
        Gửi yêu cầu chưa phải xác nhận đơn hoặc thanh toán.
      </p>
      {!checkout ? (
        <Link href="/dat-hoa" className="button">
          Gửi yêu cầu đặt hoa
        </Link>
      ) : (
        <Link href="/gio-hang" className="text-link">
          Chỉnh sửa giỏ hoa
        </Link>
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
    <article className="cart-row">
      <div className="cart-row-top">
        <div className="cart-thumbnail">
          <Image
            src={product?.image || "/images/floral-mark.svg"}
            alt={product?.name || "Mẫu hoa"}
            fill
            sizes="85px"
          />
        </div>
        <div className="cart-row-main">
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
            <div className="error" role="alert">
              Thông tin mẫu đã thay đổi. Hãy xem cấu hình và lưu lại để chấp
              nhận giá hiện tại.
            </div>
          ) : null}
          <div className="cart-row-controls">
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
              <button
                className="link-button"
                onClick={() => setEditing(!editing)}
                aria-expanded={editing}
              >
                {editing ? "Đóng cấu hình" : "Sửa cấu hình"}
              </button>
            ) : null}
            <button
              className="icon-button"
              aria-label={`Xóa ${product?.name || "mẫu"}`}
              onClick={() => cart.remove(item.lineId)}
            >
              <Trash2 size={16} />
            </button>
          </div>
          {error ? (
            <div role="alert" className="error">
              {error}
            </div>
          ) : null}
        </div>
      </div>
      {editing ? (
        <form className="edit-form" onSubmit={save} noValidate>
          <ConfigurationFields
            serviceType={item.configuration.serviceType}
            initial={item.configuration}
            errors={errors}
            guidance={guidance}
          />
          <button className="button" type="submit">
            Lưu cấu hình
          </button>
        </form>
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
      <p role="status" className="section">
        Đang mở giỏ hoa…
      </p>
    );
  if (!cart.items.length)
    return (
      <div style={{ paddingBottom: 80 }}>
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
      <p className="form-note">
        Các dịch vụ có thể ở cùng một giỏ. Mỗi yêu cầu dùng một người nhận và
        địa chỉ chung; nhiều địa chỉ cần gửi riêng.
      </p>
      {cart.notice ? (
        <div className="error" role="status">
          {cart.notice}
        </div>
      ) : null}
      <div className="cart-layout">
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
