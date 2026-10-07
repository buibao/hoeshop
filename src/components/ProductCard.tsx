import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { priceLabel } from "@/domain/pricing";
import { valueLabel } from "@/domain/labels";
import type { Product } from "@/domain/schemas";
export function ProductCard({ product, variant = "default" }: { product: Product; variant?: "default" | "home" }) {
  const href = "/san-pham/" + product.slug;
  const placeholder = variant === "home" && product.fixture && product.image === "/images/preview/peonies.jpg";
  return (
    <article className={variant === "home" ? "olf-product-card hoe-product-card" : "product-card hoe-product-card"}>
      <Link href={href} aria-label={`Xem ${product.name}`}>
        <div className="product-image">
          <Image
            src={placeholder ? "/images/floral-mark.svg" : product.image || "/images/floral-mark.svg"}
            alt={placeholder ? `Hoa minh họa tạm cho ${product.name}` : product.imageAlt || product.name}
            fill
            sizes={variant === "home" ? "(max-width: 767px) 75vw, (max-width: 1279px) 30vw, 18vw" : "(max-width: 700px) 45vw, 30vw"}
          />
        </div>
      </Link>
      <span className="category">{valueLabel(product.serviceType)}</span>
      <h3>
        <Link href={href}>{product.name}</Link>
      </h3>
      <div className="product-price">{priceLabel(product.price)}</div>
      <div className="product-link">
        <Link href={href} className="text-link">
          {variant === "home" ? "Xem mẫu hoa" : "Khám phá mẫu hoa"} <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
