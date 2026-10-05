import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProducts, getService } from "@/server/content";
import { priceLabel } from "@/domain/pricing";
import { ProductForm } from "@/features/cart/ProductForm";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getProducts()).find((p) => p.slug === slug);
  return p
    ? {
        title: p.name,
        description: p.description,
        alternates: { canonical: "/san-pham/" + p.slug },
      }
    : { title: "Mẫu hoa không khả dụng" };
}
export default async function ProductDetail({ params }: Props) {
  const { slug } = await params;
  const product = (await getProducts()).find((p) => p.slug === slug);
  if (!product) notFound();
  const service = (await getService(product.serviceType))!;
  return (
    <div className="container mx-auto w-full max-w-container px-4 md:px-8 hoe-editorial-detail">
      <div className="breadcrumb flex flex-wrap items-center gap-3 py-6 text-sm text-tertiary">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <Link href="/san-pham">Sản phẩm</Link>
        <span>/</span>
        <Link href={`/dich-vu/${service.id}`}>{service.name}</Link>
      </div>
      <div className="detail-grid grid grid-cols-1 items-start gap-8 py-8 lg:grid-cols-2">
        <div className="detail-image relative aspect-[4/5] overflow-hidden rounded-xl">
          <div className="editorial-detail-photo absolute inset-0">
            <Image
              src={product.image || "/images/floral-mark.svg"}
              alt={product.imageAlt || product.name}
              fill
              sizes="(max-width: 700px) 90vw, 45vw"
              loading="eager"
              fetchPriority="high"
              unoptimized={product.fixture}
            />
          </div>
        </div>
        <div className="detail-copy flex min-w-0 flex-col gap-4">
          <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">{service.name}</span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="detail-price text-display-xs text-brand-secondary">{priceLabel(product.price)}</div>
          <p className="editorial-price-note text-sm text-tertiary">
            Thiết kế, giá cuối và lịch nhận được Hòe xác nhận khi liên hệ.
          </p>
          {product.fixture ? (
            <p className="form-note text-sm text-tertiary">
              Mẫu test — không phải sản phẩm đang bán.
            </p>
          ) : null}
          <hr className="divider my-4 border-secondary" />
          <ProductForm product={product} guidance={service} />
        </div>
      </div>
    </div>
  );
}
