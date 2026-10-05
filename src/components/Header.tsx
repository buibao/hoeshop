"use client";
import { usePathname } from "next/navigation";
import { HeaderNavigationBase } from "@/components/untitled/application/app-navigation/header-navigation";
import { LogoContext } from "@/components/untitled/foundations/logo/untitledui-logo";
import { Button } from "@/components/untitled/base/buttons/button";
import { useCart } from "@/features/cart/store";
export function Header({
  logo,
}: {
  logo: { src: string; alt: string; width: number; height: number } | null;
}) {
  const pathname = usePathname(),
    { items } = useCart();
  const count = items.reduce((n, item) => n + item.quantity, 0);
  const services = [
    { label: "Tất cả mẫu hoa", href: "/san-pham" },
    { label: "Hoa Thời", href: "/dich-vu/hoa-thoi" },
    { label: "Hoa Tâm", href: "/dich-vu/hoa-tam" },
    { label: "Hoa Ý", href: "/dich-vu/hoa-y" },
  ];
  const productActive =
    pathname.startsWith("/san-pham") || pathname.startsWith("/dich-vu/");
  const nav = [
    { label: "Trang chủ", href: "/", current: pathname === "/" },
    {
      label: "Sản phẩm",
      href: "/san-pham",
      current: productActive,
      items: services,
    },
    { label: "Về Hòe", href: "/ve-hoe" },
    { label: "Chuyện hoa", href: "/blog" },
    { label: "Liên hệ", href: "/lien-he" },
  ];
  return (
    <LogoContext.Provider value={logo}>
      <HeaderNavigationBase
        key={pathname}
        activeUrl={pathname}
        items={nav}
        actions={
          <Button
            size="md"
            color="secondary"
            href="/gio-hang"
            aria-label={`Giỏ hàng, ${count} mẫu hoa`}
          >
            Giỏ hoa · {count}
          </Button>
        }
      />
    </LogoContext.Provider>
  );
}
