import type { Metadata } from "next";
import { getProducts } from "@/server/content";
import { CheckoutForm } from "@/features/checkout/CheckoutForm";
export const metadata:Metadata={title:"Gửi yêu cầu đặt hoa",robots:{index:false,follow:false}};
export default function CheckoutPage(){return <div className="container"><div className="page-heading"><span className="eyebrow">HÒE LẮNG NGHE ĐIỀU BẠN MUỐN GỬI</span><h1>Gửi yêu cầu đặt hoa</h1><p>Thông tin nhận hoa dùng chung cho giỏ này. Shop sẽ liên hệ xác nhận giá, phí giao và lịch nhận.</p></div><div style={{paddingBottom:70}}><CheckoutForm products={getProducts()}/></div></div>;}
