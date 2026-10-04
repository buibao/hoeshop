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
    <div className="container">
      <div className="breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <Link href="/san-pham">Sản phẩm</Link>
        <span>/</span>
        <Link href={`/dich-vu/${service.id}`}>{service.name}</Link>
      </div>
      <div className="detail-grid">
        <div className="detail-image">
          <Image
            src={product.image || "/images/floral-mark.svg"}
            alt={product.imageAlt || product.name}
            fill
            sizes="(max-width: 700px) 90vw, 45vw"
            preload
            unoptimized={product.fixture}
          />
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{service.name}</span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="detail-price">{priceLabel(product.price)}</div>
          {product.fixture ? (
            <p className="form-note">
              Mẫu test — không phải sản phẩm đang bán.
            </p>
          ) : null}
          <hr className="divider" />
          <ProductForm product={product} guidance={service} />
        </div>
      </div>
    </div>
  );
}
