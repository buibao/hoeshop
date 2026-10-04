import Link from "next/link";
export default function NotFound() { return <div className="container section empty"><span className="eyebrow">404</span><h1>Chưa tìm thấy đóa hoa này</h1><p>Trang bạn tìm chưa được xuất bản hoặc không còn khả dụng.</p><Link href="/" className="button">Về trang chủ</Link></div>; }
