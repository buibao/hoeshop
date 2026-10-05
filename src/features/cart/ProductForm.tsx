"use client";
import { Form } from "@/components/ui/Form";
import { ActionLink } from "@/components/ui/ActionLink";
import { Action } from "@/components/ui/Action";

import { useState } from "react";
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
    <Form
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
        <div className="mt-4 max-w-xs">
          <QuantityField name="quantity" />
        </div>
      </fieldset>
      <p className="form-note text-sm text-tertiary">
        Theo cấu hình hiện tại: <strong>{label}</strong>. Thay đổi thiết kế
        ngoài mẫu cần shop báo giá. Giá cuối, phí giao và lịch nhận được xác
        nhận sau.
      </p>
      {error ? (
        <div className="error rounded-xl bg-primary p-4 text-error-primary ring-1 ring-error_subtle" role="alert">
          {error}
        </div>
      ) : null}
      {added ? (
        <div className="success rounded-xl bg-primary p-4 text-success-primary ring-1 ring-success_secondary" role="status">
          <strong>Đã thêm vào giỏ hoa.</strong>
          <ActionLink href="/gio-hang" className="text-link">
            Xem giỏ & gửi yêu cầu <ArrowRight size={15} />
          </ActionLink>
        </div>
      ) : null}
      <Action className="button" type="submit">
        Thêm vào giỏ hoa <ArrowRight size={15} />
      </Action>
    </Form>
  );
}
