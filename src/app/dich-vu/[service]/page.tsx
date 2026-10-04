import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getServices,getService,getProducts,isTestContent } from "@/server/content";
import { ProductCard } from "@/components/ProductCard";
import { Empty } from "@/components/Empty";
import { InquiryForm } from "@/features/checkout/InquiryForm";
type Props={params:Promise<{service:string}>};
export const dynamicParams = false;
export function generateStaticParams(){return getServices().map(s=>({service:s.id}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {service}=await params;const s=getService(service);return s ? {title:s.name,description:s.description,alternates:{canonical:"/dich-vu/"+s.id}} : {title:"Dịch vụ không khả dụng"};
}
export default async function ServicePage({params}:Props){
  const {service}=await params;const s=getService(service);if(!s)notFound();
  const products=getProducts().filter(p=>p.serviceType===s.id),test=isTestContent();
  return <div className="container"><div className="breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><Link href="/san-pham">Dịch vụ</Link><span>/</span><span>{s.name}</span></div>
    <div className="service-page-top"><div className="page-heading"><span className="eyebrow">/ {s.number} — {s.name}</span><h1>{s.subtitle}</h1><p>{s.description}</p></div>
      <div className="service-art"><Image src={s.image || (test ? "/images/preview/"+(s.id==="hoa-thoi" ? "peonies.jpg" : s.id==="hoa-tam" ? "bouquet.jpg" : "roses.jpg") : "/images/floral-mark.svg")} alt={test ? "Ảnh minh họa dịch vụ trên bản test" : s.name} fill sizes="(max-width: 700px) 90vw, 45vw" preload unoptimized={test}/></div>
    </div>
    <div className="section-heading"><h2>Mẫu hoa tham khảo</h2><a href="#tu-van" className="text-link">Chưa chọn mẫu? Kể Hòe nghe</a></div>
    {products.length ? <div className="product-grid">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div> : <Empty title="Các mẫu hoa đang được chuẩn bị" body="Bạn có thể tìm hiểu dịch vụ và mô tả mong muốn ở phần bên dưới."/>}
    <section className="inquiry-section" id="tu-van"><h2>Một ý tưởng bắt đầu từ bạn</h2><p>Chưa chọn mẫu? Hãy gửi nhu cầu để shop tư vấn. {s.id==="hoa-thoi" ? "Hoa Thời hiện chưa có gói định kỳ hoặc lịch giao được cam kết trên website." : "Nếu chọn một mẫu ở trên, bạn sẽ cấu hình mẫu và gửi qua giỏ hoa."}</p><InquiryForm serviceType={s.id}/></section>
  </div>;
}
