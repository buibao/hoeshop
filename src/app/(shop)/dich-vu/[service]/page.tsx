import { StoreTextRevealGroup, StoreTextReveal } from "@/components/ui/StoreTextReveal";
import { StoreHeading } from "@/components/StoreHeading";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getService, getProducts, isTestContent } from "@/server/content";
import { ProductCard } from "@/components/ProductCard";
import { Empty } from "@/components/Empty";
import { InquiryForm } from "@/features/checkout/InquiryForm";
import { HoaThoiServiceFlow } from "@/features/checkout/HoaThoiServiceFlow";
import { HoaThoiAnchor } from "@/features/checkout/HoaThoiAnchor";
import { ScrollAnchor } from "@/components/ui/ScrollAnchor";
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
  const samples = (
    <section
      id="mau-hoa"
      tabIndex={s.id === "hoa-thoi" ? -1 : undefined}
      className={s.id === "hoa-thoi" ? "ht-service-section" : undefined}
    >
      <StoreTextRevealGroup className="section-heading">
        <h2>Mẫu hoa tham khảo</h2>
        {s.id === "hoa-thoi" ? (
          <HoaThoiAnchor href="#tu-van" className="text-link">
            Chưa chọn mẫu? Kể Hòe nghe
          </HoaThoiAnchor>
        ) : (
          <ScrollAnchor href="#tu-van" className="text-link">
            Chưa chọn mẫu? Kể Hòe nghe
          </ScrollAnchor>
        )}
      </StoreTextRevealGroup>
      {products.length ? (
        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} revealText />)}
        </div>
      ) : (
        <Empty
          title="Các mẫu hoa đang được chuẩn bị"
          body="Bạn có thể tìm hiểu dịch vụ và mô tả mong muốn ở phần bên dưới."
        />
      )}
    </section>
  );
  return (
    <div className={s.id === "hoa-thoi" ? "ht-service-page" : undefined}>
      <StoreHeading>
        <div className="breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span>/</span>
          <Link href="/san-pham">Dịch vụ</Link>
          <span>/</span>
          <span>{s.name}</span>
        </div>
        <div className="service-page-top">
          <StoreTextRevealGroup initial className="page-heading">
            <span className="eyebrow">
              / {s.number} — {s.name}
            </span>
            <h1>{s.subtitle}</h1>
            <p>{s.description}</p>
          </StoreTextRevealGroup>
          <div className="service-art">
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
      </StoreHeading>
      <div className="container">
        {s.id === "hoa-thoi" ? (
          <HoaThoiServiceFlow guidance={s}>{samples}</HoaThoiServiceFlow>
        ) : (
          samples
        )}
        {s.id !== "hoa-thoi" ? (
          <section className="inquiry-section" id="tu-van">
            <StoreTextReveal as="h2" role="heading">Một ý tưởng bắt đầu từ bạn</StoreTextReveal>
            <StoreTextReveal as="p" role="body">
              Chưa chọn mẫu? Hãy gửi nhu cầu để shop tư vấn. Nếu chọn một mẫu ở
              trên, bạn sẽ cấu hình mẫu và gửi qua giỏ hoa.
            </StoreTextReveal>
            <InquiryForm serviceType={s.id} guidance={s} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
