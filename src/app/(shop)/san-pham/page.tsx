import type { Metadata } from "next";
import { getProducts } from "@/server/content";
import { ServiceCards } from "@/components/ServiceCards";
import { ProductCard } from "@/components/ProductCard";
import { Empty } from "@/components/Empty";
export const metadata: Metadata = {
  title: "Các mẫu hoa",
  description: "Khám phá Hoa Thời, Hoa Tâm, Hoa Ý và các mẫu hoa của Hòe.",
};
export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <div className="container mx-auto w-full max-w-container px-4 md:px-8">
      <div className="page-heading flex flex-col gap-4 py-8 md:py-12">
        <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">CHỌN HOA TỪ ĐIỀU BẠN MUỐN GỬI</span>
        <h1>
          Những đóa hoa,
          <br />
          những câu chuyện.
        </h1>
        <p>
          Một chút cảm hứng cho ngày hôm nay. Chọn mẫu hoa, kể mong muốn, Hòe sẽ
          liên hệ xác nhận giá và lịch nhận.
        </p>
      </div>
      <ServiceCards />
      <section className="section py-12 md:py-16">
        <div className="section-heading mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2>Các mẫu hoa</h2>
          <p>Thay đổi thiết kế ngoài mẫu sẽ cần shop báo giá.</p>
        </div>
        {products.length ? (
          <div className="product-grid grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <Empty
            title="Mẫu hoa đang được chuẩn bị"
            body="Hòe sẽ giới thiệu những mẫu hoa khi hình ảnh và thông tin đã sẵn sàng."
            href="/lien-he"
            action="Đến trang liên hệ"
          />
        )}
      </section>
    </div>
  );
}
