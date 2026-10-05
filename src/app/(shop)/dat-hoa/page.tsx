import type { Metadata } from "next";
import { getProducts } from "@/server/content";
import { CheckoutForm } from "@/features/checkout/CheckoutForm";
export const metadata: Metadata = {
  title: "Gửi yêu cầu đặt hoa",
  robots: { index: false, follow: false },
};
export default async function CheckoutPage() {
  return (
    <div className="container mx-auto w-full max-w-container px-4 md:px-8">
      <div className="page-heading flex flex-col gap-4 py-8 md:py-12">
        <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">HÒE LẮNG NGHE ĐIỀU BẠN MUỐN GỬI</span>
        <h1>Gửi yêu cầu đặt hoa</h1>
        <p>
          Thông tin nhận hoa dùng chung cho giỏ này. Shop sẽ liên hệ xác nhận
          giá, phí giao và lịch nhận.
        </p>
      </div>
      <div >
        <CheckoutForm products={await getProducts()} />
      </div>
    </div>
  );
}
