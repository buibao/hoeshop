import type { Metadata } from "next";
import { getProducts, getServices } from "@/server/content";
import { CartView } from "@/features/cart/CartView";
export const metadata: Metadata = {
  title: "Giỏ hoa",
  robots: { index: false, follow: false },
};
export default async function CartPage() {
  const [products, services] = await Promise.all([
    getProducts(),
    getServices(),
  ]);
  return (
    <div className="container mx-auto w-full max-w-container px-4 md:px-8">
      <div className="page-heading flex flex-col gap-4 py-8 md:py-12">
        <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">MỘT CHÚT DỊU DÀNG SẮP ĐƯỢC GỬI ĐI</span>
        <h1>Giỏ hoa của bạn</h1>
        <p>
          Xem lại từng mẫu, lời nhắn và ngày nhận mong muốn trước khi gửi yêu
          cầu.
        </p>
      </div>
      <CartView products={products} services={services} />
    </div>
  );
}
