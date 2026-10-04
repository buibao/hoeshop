"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/domain/schemas";
import { configurationSchema } from "@/domain/schemas";
import { defaultConfiguration } from "@/domain/cart";
import { effectivePrice, priceLabel } from "@/domain/pricing";
import {
  ConfigurationFields,
  configurationInput,
  type Guidance,
} from "@/features/checkout/configuration";
import { useCart } from "./store";
import { focusError } from "@/components/Fields";
import { QuantityField } from "@/components/ui/QuantityField";
export function ProductForm({
  product,
  guidance,
}: {
  product: Product;
  guidance?: Guidance;
}) {
  const cart = useCart();
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);
  const [label, setLabel] = useState(priceLabel(product.price));
  const initial = defaultConfiguration(product);
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setErrors({});
    const data = new FormData(e.currentTarget);
    const result = configurationSchema.safeParse(
      configurationInput(data, product.serviceType),
    );
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((i) => [i.path.join("."), i.message]),
        ),
      );
      setError("Vui lòng kiểm tra cấu hình mẫu hoa.");
      focusError(e.currentTarget, result.error.issues[0].path.join("."));
      return;
    }
    try {
      cart.add({
        lineId: crypto.randomUUID(),
        productId: product.id,
        expectedRevision: product.revision,
        quantity: Number(data.get("quantity")),
        configuration: result.data,
      });
      setAdded(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.includes("Giỏ")
            ? err.message
            : "Số lượng cần từ 1 đến 99."
          : "Chưa thêm được vào giỏ.",
      );
    }
  }
  function preview(form: HTMLFormElement) {
    const result = configurationSchema.safeParse(
      configurationInput(new FormData(form), product.serviceType),
    );
    if (result.success)
      setLabel(priceLabel(effectivePrice(product, result.data)));
    else if (product.serviceType !== "hoa-thoi") {
      const partial = configurationInput(
        new FormData(form),
        product.serviceType,
      );
      const parsed = configurationSchema.safeParse({
        ...partial,
        ...(product.serviceType === "hoa-tam" ? { emotion: "Xem giá" } : {}),
      });
      if (parsed.success)
        setLabel(priceLabel(effectivePrice(product, parsed.data)));
    }
    setAdded(false);
  }
  return (
    <form
      onSubmit={handleSubmit}
      onChange={(e) => preview(e.currentTarget)}
      noValidate
    >
      <fieldset>
        <legend>Điều bạn muốn gửi</legend>
        <ConfigurationFields
          serviceType={product.serviceType}
          initial={initial}
          errors={errors}
          guidance={guidance}
        />
        <div style={{ marginTop: 18, maxWidth: 180 }}>
          <QuantityField name="quantity" />
        </div>
      </fieldset>
      <p className="form-note">
        Theo cấu hình hiện tại: <strong>{label}</strong>. Thay đổi thiết kế
        ngoài mẫu cần shop báo giá. Giá cuối, phí giao và lịch nhận được xác
        nhận sau.
      </p>
      {error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : null}
      {added ? (
        <div className="success" role="status">
          <strong>Đã thêm vào giỏ hoa.</strong>
          <Link href="/gio-hang" className="text-link">
            Xem giỏ & gửi yêu cầu <ArrowRight size={15} />
          </Link>
        </div>
      ) : null}
      <button className="button" type="submit">
        Thêm vào giỏ hoa <ArrowRight size={15} />
      </button>
    </form>
  );
}
