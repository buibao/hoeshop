import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { priceLabel } from "@/domain/pricing";
import { valueLabel } from "@/domain/labels";
import type { Product } from "@/domain/schemas";
export function ProductCard({ product }: { product: Product }) {
  const href = "/san-pham/" + product.slug;
  return (
    <article className="product-card hoe-product-card">
      <Link href={href} aria-label={`Xem ${product.name}`}>
        <div className="product-image">
          <Image
            src={product.image || "/images/floral-mark.svg"}
            alt={product.imageAlt || product.name}
            fill
            sizes="(max-width: 700px) 45vw, 30vw"
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
          Khám phá mẫu hoa <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}
