"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Offcanvas from "react-bootstrap/Offcanvas";
import {
  LayoutDashboard,
  ClipboardList,
  MessageCircle,
  Flower2,
  NotebookText,
  ShieldCheck,
  Sprout,
  Settings,
  MessagesSquare,
  Images,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
const links = [
  { path: "", label: "Tổng quan", icon: LayoutDashboard },
  { path: "/orders", label: "Đơn hoa", icon: ClipboardList },
  { path: "/inquiries", label: "Tư vấn", icon: MessageCircle },
  { path: "/products", label: "Sản phẩm", icon: Flower2 },
  { path: "/posts", label: "Chuyện hoa", icon: NotebookText },
  { path: "/policies", label: "Chính sách", icon: ShieldCheck },
  { path: "/services", label: "Dịch vụ", icon: Sprout },
  { path: "/settings", label: "Website", icon: Settings },
  { path: "/comments", label: "Bình luận", icon: MessagesSquare },
  { path: "/media", label: "Thư viện ảnh", icon: Images },
];
function NavLinks({ path, close }: { path: string; close?: () => void }) {
  return (
    <nav aria-label="Quản trị">
      {links.map(({ path: suffix, label, icon: Icon }) => (
        <Link
          key={suffix}
          href={`/admin${suffix}`}
          onClick={close}
          aria-current={
            path === `/admin${suffix}` ||
            (suffix && path.startsWith(`/admin${suffix}/`))
              ? "page"
              : undefined
          }
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
export function AdminNav({ children }: { children?: React.ReactNode }) {
  const path = usePathname(),
    [open, setOpen] = useState(false);
  return (
    <>
      <aside className="admin-sidebar">
        <Link className="brand" href="/admin">
          hòe<small>góc của shop</small>
        </Link>
        <NavLinks path={path} />
        <div className="admin-account">
          {children}
          <Link href="/">
            Xem website <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </aside>
      <div className="admin-mobile-header">
        <Link className="brand" href="/admin">
          hòe
        </Link>
        <button
          type="button"
          className="icon-button"
          aria-label="Mở menu quản trị"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu size={22} />
        </button>
      </div>
      <Offcanvas
        show={open}
        onHide={() => setOpen(false)}
        placement="start"
        className="hoe-admin-menu"
        aria-labelledby="admin-menu-title"
      >
        <Offcanvas.Header>
          <Offcanvas.Title id="admin-menu-title">Góc của shop</Offcanvas.Title>
          <button
            className="icon-button"
            aria-label="Đóng menu quản trị"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <NavLinks path={path} close={() => setOpen(false)} />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
