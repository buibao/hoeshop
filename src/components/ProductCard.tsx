import { ActionLink } from "@/components/ui/ActionLink";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { priceLabel } from "@/domain/pricing";
import { valueLabel } from "@/domain/labels";
import type { Product } from "@/domain/schemas";
export function ProductCard({ product }: { product: Product }) {
  const href = "/san-pham/" + product.slug;
  return (
    <article className="product-card flex h-full flex-col gap-3 hoe-product-card">
      <Link href={href} aria-label={`Xem ${product.name}`}>
        <div className="product-image relative aspect-[4/5] overflow-hidden rounded-xl">
          <Image
            src={product.image || "/images/floral-mark.svg"}
            alt={product.imageAlt || product.name}
            fill
            sizes="(max-width: 700px) 45vw, 30vw"
          />
        </div>
      </Link>
      <span className="category text-sm font-medium text-brand-secondary">{valueLabel(product.serviceType)}</span>
      <h3>
        <Link href={href}>{product.name}</Link>
      </h3>
      <div className="product-price text-md text-brand-secondary">{priceLabel(product.price)}</div>
      <div className="product-link mt-auto">
        <ActionLink href={href} className="text-link">
          Khám phá mẫu hoa <ArrowUpRight size={15} />
        </ActionLink>
      </div>
    </article>
  );
}
