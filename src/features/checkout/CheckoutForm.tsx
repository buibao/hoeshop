"use client";
import { Form } from "@/components/ui/Form";
import { Action } from "@/components/ui/Action";

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
export function CheckoutForm({ products }: { products: Product[] }) {
  const cart = useCart();
  const submission = useSubmission<Receipt>("/api/orders");
  if (submission.result)
    return (
      <div className="success rounded-xl bg-primary p-4 text-success-primary ring-1 ring-success_secondary" role="status">
        <strong>Hòe đã nhận yêu cầu {submission.result.requestId}.</strong>Shop
        sẽ liên hệ xác nhận giá và thời gian giao. Mã tiếp nhận chưa phải xác
        nhận đơn hoặc giao hàng.
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
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
    <div className="cart-layout grid grid-cols-1 items-start gap-8 py-8 lg:grid-cols-2">
      <Form onSubmit={handleSubmit} noValidate className="card rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
        <fieldset disabled={submission.phase === "submitting"}>
          <legend>Thông tin người đặt</legend>
          <div className="form-grid grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <hr className="divider my-4 border-secondary" />
          <legend>Thông tin nhận hoa chung</legend>
          <div className="form-grid grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <p className="form-note text-sm text-tertiary">
            Ngày/giờ mong muốn nằm trong từng mẫu ở giỏ. Shop sẽ xác nhận giá
            cuối, phí giao và lịch nhận. Website chưa thu tiền.
          </p>
          <Action className="button" type="submit" isLoading={submission.phase === "submitting"}>
            {submission.phase === "submitting"
              ? "Đang gửi yêu cầu…"
              : "Gửi yêu cầu đặt hoa"}
          </Action>
        </fieldset>
        {blocked ? (
          <div className="error rounded-xl bg-primary p-4 text-error-primary ring-1 ring-error_subtle" role="alert">
            Giỏ có mẫu không khả dụng hoặc thông tin đã thay đổi. Hãy quay lại
            giỏ và kiểm tra cấu hình.
          </div>
        ) : null}
        {submission.error ? (
          <div className="error rounded-xl bg-primary p-4 text-error-primary ring-1 ring-error_subtle" role="alert">
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
      </Form>
      <CartSummary products={products} checkout />
    </div>
  );
}
