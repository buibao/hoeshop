"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import Offcanvas from "react-bootstrap/Offcanvas";
import { useCart } from "@/features/cart/store";
import { ProductNavigation } from "@/components/ProductNavigation";
const navigation = [
  ["/", "Trang chủ"],
  ["/san-pham", "Sản phẩm"],
  ["/ve-hoe", "Về Hòe"],
  ["/blog", "Chuyện Hòe (Blog)"],
  ["/lien-he", "Liên hệ"],
];
export function Header({
  logo,
}: {
  logo: { src: string; alt: string; width: number; height: number } | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { items } = useCart();
  const count = items.reduce((n, item) => n + item.quantity, 0);
  return (
    <header className="header hoe-store-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Hòe — Trang chủ">
          {logo ? (
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              style={{ maxWidth: 130, maxHeight: 65, objectFit: "contain" }}
            />
          ) : (
            <>
              hòe<small>hoa & những điều dịu dàng</small>
            </>
          )}
        </Link>
        <nav id="main-nav" className="nav" aria-label="Điều hướng chính">
          {navigation.map(([href, title]) =>
            href === "/san-pham" ? (
              <ProductNavigation key={href} />
            ) : (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {title}
              </Link>
            ),
          )}
        </nav>
        <div className="header-actions">
          <Link
            href="/gio-hang"
            className="cart-link"
            aria-label={`Giỏ hàng, ${count} mẫu hoa`}
          >
            <ShoppingBag size={20} strokeWidth={1.4} />
            <span>Giỏ hoa</span>
            <span className="cart-count">{count}</span>
          </Link>
          <button
            className="menu-button"
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <Offcanvas
        show={open}
        onHide={() => setOpen(false)}
        placement="end"
        restoreFocusOptions={{ preventScroll: true }}
        className="hoe-menu hoe-store-menu"
        id="mobile-navigation"
        aria-labelledby="mobile-menu-title"
      >
        <Offcanvas.Header>
          <Offcanvas.Title id="mobile-menu-title">
            Một chút hoa, một chút dịu dàng.
          </Offcanvas.Title>
          <button
            className="icon-button"
            aria-label="Đóng menu"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <nav aria-label="Điều hướng trên điện thoại">
            {navigation.map(([href, title]) =>
              href === "/san-pham" ? (
                <ProductNavigation
                  key={href}
                  mobile
                  onNavigate={() => setOpen(false)}
                />
              ) : (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {title}
                </Link>
              ),
            )}
          </nav>
          <Link
            className="button"
            href="/gio-hang"
            onClick={() => setOpen(false)}
          >
            Giỏ hoa · {count}
          </Link>
        </Offcanvas.Body>
      </Offcanvas>
    </header>
  );
}
