import { StoreTextRevealGroup } from "@/components/ui/StoreTextReveal";
import { StoreHeading } from "@/components/StoreHeading";
import type { Metadata } from "next";
import { getProducts } from "@/server/content";
import { CheckoutForm } from "@/features/checkout/CheckoutForm";
export const metadata: Metadata = {
  title: "Gửi yêu cầu đặt hoa",
  robots: { index: false, follow: false },
};
export default async function CheckoutPage() {
  return (
    <>
      <StoreHeading>
        <StoreTextRevealGroup initial className="page-heading">
          <span className="eyebrow">HÒE LẮNG NGHE ĐIỀU BẠN MUỐN GỬI</span>
          <h1>Gửi yêu cầu đặt hoa</h1>
          <p>
            Thông tin nhận hoa dùng chung cho giỏ này. Shop sẽ liên hệ xác nhận
            giá, phí giao và lịch nhận.
          </p>
        </StoreTextRevealGroup>
      </StoreHeading>
      <div className="container">
        <div style={{ paddingBottom: 70 }}>
          <CheckoutForm products={await getProducts()} />
        </div>
      </div>
    </>
  );
}
