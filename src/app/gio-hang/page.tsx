import type { Metadata } from "next";
import { getProducts } from "@/server/content";
import { CartView } from "@/features/cart/CartView";
export const metadata:Metadata={title:"Giỏ hoa",robots:{index:false,follow:false}};
export default function CartPage(){return <div className="container"><div className="page-heading"><span className="eyebrow">MỘT CHÚT DỊU DÀNG SẮP ĐƯỢC GỬI ĐI</span><h1>Giỏ hoa của bạn</h1><p>Xem lại từng mẫu, lời nhắn và ngày nhận mong muốn trước khi gửi yêu cầu.</p></div><CartView products={getProducts()}/></div>;}
