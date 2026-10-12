import { StoreTextReveal } from "@/components/ui/StoreTextReveal";
import Link from "next/link";
import { StoreFallbackScope } from "@/components/StoreFallbackScope";
import { termes, cormorant } from "@/fonts/store-fonts";
import "@/styles/store-typography.css";
import "@/styles/store-gradients.css";
import "@/styles/store-text-reveal.css";

export default function NotFound() {
  return <StoreFallbackScope className={`hoe-store-scope ${termes.variable} ${cormorant.variable}`}>
    <div className="container section empty"><StoreTextReveal as="span" role="eyebrow" className="eyebrow">404</StoreTextReveal><StoreTextReveal as="h1" role="page" initial>Chưa tìm thấy đóa hoa này</StoreTextReveal><StoreTextReveal as="p" role="body">Trang bạn tìm chưa được xuất bản hoặc không còn khả dụng.</StoreTextReveal><Link href="/" className="button">Về trang chủ</Link></div>
  </StoreFallbackScope>;
}
