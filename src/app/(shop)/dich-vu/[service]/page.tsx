import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getService, getProducts, isTestContent } from "@/server/content";
import { ProductCard } from "@/components/ProductCard";
import { Empty } from "@/components/Empty";
import { InquiryForm } from "@/features/checkout/InquiryForm";
type Props = { params: Promise<{ service: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service } = await params;
  const s = await getService(service);
  return s
    ? {
        title: s.name,
        description: s.description,
        alternates: { canonical: "/dich-vu/" + s.id },
      }
    : { title: "Dịch vụ không khả dụng" };
}
export default async function ServicePage({ params }: Props) {
  const { service } = await params;
  const s = await getService(service);
  if (!s) notFound();
  const products = (await getProducts()).filter((p) => p.serviceType === s.id),
    test = isTestContent();
  return (
    <div className="container mx-auto w-full max-w-container px-4 md:px-8">
      <div className="breadcrumb flex flex-wrap items-center gap-3 py-6 text-sm text-tertiary">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <Link href="/san-pham">Dịch vụ</Link>
        <span>/</span>
        <span>{s.name}</span>
      </div>
      <div className="service-page-top grid grid-cols-1 items-center gap-8 py-8 md:grid-cols-2">
        <div className="page-heading flex flex-col gap-4 py-8 md:py-12">
          <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">
            / {s.number} — {s.name}
          </span>
          <h1>{s.subtitle}</h1>
          <p>{s.description}</p>
        </div>
        <div className="service-art relative aspect-[4/5] overflow-hidden rounded-xl">
          <Image
            src={
              s.image ||
              (test
                ? "/images/preview/" +
                  (s.id === "hoa-thoi"
                    ? "peonies.jpg"
                    : s.id === "hoa-tam"
                      ? "bouquet.jpg"
                      : "roses.jpg")
                : "/images/floral-mark.svg")
            }
            alt={test ? "Ảnh minh họa dịch vụ trên bản test" : s.name}
            fill
            sizes="(max-width: 700px) 90vw, 45vw"
            preload
          />
        </div>
      </div>
      <div className="section-heading mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2>Mẫu hoa tham khảo</h2>
        <a href="#tu-van" className="text-link">
          Chưa chọn mẫu? Kể Hòe nghe
        </a>
      </div>
      {products.length ? (
        <div className="product-grid grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <Empty
          title="Các mẫu hoa đang được chuẩn bị"
          body="Bạn có thể tìm hiểu dịch vụ và mô tả mong muốn ở phần bên dưới."
        />
      )}
      <section className="inquiry-section flex flex-col gap-4 py-12" id="tu-van">
        <h2>Một ý tưởng bắt đầu từ bạn</h2>
        <p>
          Chưa chọn mẫu? Hãy gửi nhu cầu để shop tư vấn.{" "}
          {s.id === "hoa-thoi"
            ? "Hoa Thời hiện chưa có gói định kỳ hoặc lịch giao được cam kết trên website."
            : "Nếu chọn một mẫu ở trên, bạn sẽ cấu hình mẫu và gửi qua giỏ hoa."}
        </p>
        <InquiryForm serviceType={s.id} guidance={s} />
      </section>
    </div>
  );
}
