"use client";
import { useCart } from "@/features/cart/store";
import { useSubmission } from "./useSubmission";
import {
  structuralOrderSchema,
  type Product,
  type Receipt,
} from "@/domain/schemas";
import Link from "next/link";
import { Field, Honeypot } from "@/components/Fields";
import { CartSummary } from "@/features/cart/CartView";
import { Empty } from "@/components/Empty";
import { RecurrenceSummary } from "./RecurrenceSummary";
import { isCalendarRecurrence } from "@/domain/delivery-schedule";
export function CheckoutForm({ products }: { products: Product[] }) {
  const cart = useCart();
  const submission = useSubmission<Receipt>("/api/orders");
  if (submission.result)
    return (
      <div className="success" role="status">
        <strong>Hòe đã nhận yêu cầu {submission.result.requestId}.</strong>Shop
        sẽ liên hệ xác nhận giá và thời gian giao. Mã tiếp nhận chưa phải xác
        nhận đơn hoặc giao hàng.
        {submission.result.recurringItems?.map((item, index) => <div key={index}>
          <h3>{item.quantity} × {item.name}</h3>
          {item.configuration.serviceType === "hoa-thoi" ? <RecurrenceSummary recurrence={item.configuration.recurrence} snapshot={item.configuration.recurrenceSnapshot} /> : null}
        </div>)}
        {cart.items.length ? (
          <p>
            Giỏ vẫn còn những mẫu chưa gửi.{" "}
            <Link href="/gio-hang">Quay lại giỏ hoa</Link>
          </p>
        ) : null}
      </div>
    );
  if (!cart.ready) return <p role="status">Đang mở giỏ hoa…</p>;
  if (!cart.items.length)
    return (
      <Empty
        title="Chọn hoa trước khi gửi yêu cầu"
        body="Giỏ hoa của bạn đang trống."
        href="/san-pham"
        action="Khám phá các mẫu hoa"
      />
    );
  const blocked = cart.items.some(
    (item) =>
      !products.some(
        (p) => p.id === item.productId && p.revision === item.expectedRevision,
      ),
  );
  const legacy = cart.items.some((item) => item.configuration.serviceType === "hoa-thoi" && !isCalendarRecurrence(item.configuration.recurrence));
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (legacy) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const value = (key: string) => String(data.get(key) || "");
    const submitted = structuredClone(cart.items);
    const result = await submission.submit(
      {
        buyer: {
          name: value("buyer.name"),
          phone: value("buyer.phone"),
          email: value("buyer.email"),
        },
        recipient: {
          name: value("recipient.name"),
          phone: value("recipient.phone"),
        },
        address: value("address"),
        notes: value("notes"),
        items: submitted,
        honeypot: value("honeypot"),
      },
      structuralOrderSchema,
      form,
    );
    if (result) cart.complete(submitted);
  }
  return (
    <div className="cart-layout">
      <form onSubmit={handleSubmit} noValidate className="card">
        {legacy ? <p className="error" role="alert">Vui lòng chọn lại gói và các ngày nhận theo calendar. <Link href="/gio-hang?edit=hoa-thoi">Mở giỏ để sửa lịch nhận</Link></p> : null}
        <fieldset disabled={submission.phase === "submitting"}>
          <legend>Thông tin người đặt</legend>
          <div className="form-grid">
            <Field
              name="buyer.name"
              label="Họ tên người đặt"
              required
              autoComplete="name"
              maxLength={120}
              errors={submission.errors}
            />
            <Field
              name="buyer.phone"
              label="Số điện thoại"
              type="tel"
              required
              autoComplete="tel"
              maxLength={30}
              errors={submission.errors}
            />
            <Field
              name="buyer.email"
              label="Email"
              type="email"
              autoComplete="email"
              maxLength={254}
              full
              errors={submission.errors}
            />
          </div>
          <hr className="divider" />
          <legend>Thông tin nhận hoa chung</legend>
          <div className="form-grid">
            <Field
              name="recipient.name"
              label="Tên người nhận"
              required
              maxLength={120}
              errors={submission.errors}
            />
            <Field
              name="recipient.phone"
              label="SĐT người nhận"
              type="tel"
              maxLength={30}
              hint="Nếu để trống, Hòe liên hệ qua số người đặt."
              errors={submission.errors}
            />
            <Field
              name="address"
              label="Địa chỉ nhận hoa"
              required
              multiline
              full
              maxLength={1000}
              errors={submission.errors}
            />
            <Field
              name="notes"
              label="Ghi chú giao"
              multiline
              full
              errors={submission.errors}
            />
          </div>
          <Honeypot />
          <p className="form-note">
            Ngày/giờ mong muốn nằm trong từng mẫu ở giỏ. Shop sẽ xác nhận giá
            cuối, phí giao và lịch nhận. Website chưa thu tiền.
          </p>
          <button className="button" type="submit" disabled={legacy}>
            {submission.phase === "submitting"
              ? "Đang gửi yêu cầu…"
              : "Gửi yêu cầu đặt hoa"}
          </button>
        </fieldset>
        {blocked ? (
          <div className="error" role="alert">
            Giỏ có mẫu không khả dụng hoặc thông tin đã thay đổi. Hãy quay lại
            giỏ và kiểm tra cấu hình.
          </div>
        ) : null}
        {submission.error ? (
          <div className="error" role="alert">
            {submission.error}
            {Object.entries(submission.errors)
              .filter(([key]) => key.startsWith("items."))
              .map(([key, message]) => (
                <p key={key}>
                  Cấu hình dòng {Number(key.split(".")[1]) + 1}: {message}. Sửa
                  tại giỏ hoa.
                </p>
              ))}
          </div>
        ) : null}
      </form>
      <CartSummary products={products} checkout />
    </div>
  );
}
