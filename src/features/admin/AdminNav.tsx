"use client";
import { usePathname } from "next/navigation";
import { SidebarNavigationSimple } from "@/components/untitled/application/app-navigation/sidebar-navigation/sidebar-simple";
const links = [
  ["", "Tổng quan"],
  ["/orders", "Đơn hoa"],
  ["/inquiries", "Tư vấn"],
  ["/products", "Sản phẩm"],
  ["/posts", "Chuyện hoa"],
  ["/policies", "Chính sách"],
  ["/services", "Dịch vụ"],
  ["/settings", "Website"],
  ["/comments", "Bình luận"],
  ["/media", "Thư viện ảnh"],
];
export function AdminNav({ children }: { children?: React.ReactNode }) {
  const path = usePathname();
  return (
    <SidebarNavigationSimple
      key={path}
      activeUrl={path}
      items={links.map(([suffix, label]) => ({
        href: "/admin" + suffix,
        label,
      }))}
      footerItems={[{ label: "Xem website", href: "/" }]}
      showAccountCard={false}
      featureCard={children}
    />
  );
}
