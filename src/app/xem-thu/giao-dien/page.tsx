import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { OrderTable } from "@/features/admin/OrderTable";
import { OrderSummary } from "@/features/admin/AdminEditor";
import {
  ProductDesignPreview,
  ControlDesignPreview,
} from "@/features/admin/DesignPreview";
import { AdminNav } from "@/features/admin/AdminNav";
import { StatusBadge } from "@/components/ui/StatusBadge";
import "@/styles/admin.css";
export const metadata: Metadata = {
  title: "Duyệt thiết kế phase 3",
  robots: { index: false, follow: false },
};
const sampleOrders = [
  {
    id: "sample-quote",
    requestId: "DEMO0001",
    createdAt: "2026-10-05T02:30:00Z",
    businessStatus: "received",
    buyer: { name: "Khách mẫu A" },
    totals: { min: 0, max: 0, pricedCount: 0, quoteCount: 1 },
    serviceTypes: ["hoa-thoi"],
  },
  {
    id: "sample-mixed",
    requestId: "DEMO0002",
    createdAt: "2026-10-05T03:00:00Z",
    businessStatus: "contacted",
    buyer: { name: "Khách mẫu B" },
    totals: { min: 500000, max: 500000, pricedCount: 1, quoteCount: 1 },
    serviceTypes: ["hoa-y", "hoa-tam"],
  },
  {
    id: "sample-range",
    requestId: "DEMO0003",
    createdAt: "2026-10-05T03:15:00Z",
    businessStatus: "confirmed",
    buyer: { name: "Khách mẫu C" },
    totals: { min: 350000, max: 500000, pricedCount: 1, quoteCount: 0 },
    serviceTypes: ["hoa-tam"],
  },
];
const detail = {
  ...sampleOrders[1],
  recipient: { name: "Người nhận mẫu" },
  address: "Địa chỉ mẫu để duyệt bố cục",
  items: [
    {
      snapshot: {
        productId: "preview-hoa-y",
        name: "Mẫu hoa minh họa",
        quantity: 1,
        price: { mode: "fixed", amount: 500000, unit: "mẫu" },
        configuration: {
          serviceType: "hoa-y",
          shape: "bo",
          color: "Hồng",
          desiredDate: "2026-10-10",
          desiredTime: "14:30",
          message: "Một chút dịu dàng dành cho bạn.",
        },
      },
    },
    {
      snapshot: {
        productId: "preview-thoi",
        name: "Nhu cầu hoa định kỳ",
        quantity: 1,
        price: { mode: "quote" },
        configuration: {
          serviceType: "hoa-thoi",
          recurringNeeds: "Hoa cho không gian mỗi tuần",
        },
      },
    },
  ],
};
export default function Phase3Preview() {
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.CONTENT_MODE !== "test"
  )
    notFound();
  return (
    <main id="main-content" className="container">
      <header className="phase3-preview-heading">
        <Link className="brand" href="/">
          hòe
        </Link>
        <span className="eyebrow">PHASE 3 · CHECKPOINT B</span>
        <h1>
          Một diện mạo mới,
          <br />
          <em>vẫn là Hòe.</em>
        </h1>
        <p>
          Home và trang sản phẩm theo hướng Foglia + Orphic. Admin theo hướng
          Untitled UI. Đây là bản duyệt bố cục với ảnh và giá test; các màn
          admin bên dưới dùng dữ liệu mẫu cố định, không đọc đơn thật hoặc lưu
          dữ liệu.
        </p>
        <nav className="phase3-preview-nav" aria-label="Duyệt thiết kế">
          <Link className="button" href="/">
            Xem Home
          </Link>
          <Link className="button secondary" href="/san-pham/mau-test-nang">
            Chi tiết sản phẩm
          </Link>
          <Link className="button secondary" href="/xem-thu/widgets">
            Calendar & giờ
          </Link>
          <a className="text-link" href="#admin-mau">
            Admin mẫu
          </a>
          <a className="text-link" href="#editor-mau">
            Editor sản phẩm
          </a>
        </nav>
      </header>
      <div className="phase3-preview-banner">
        Ảnh tạm cho Preview. Chờ shop duyệt checkpoint B trước khi áp dụng thiết
        kế rộng sang các trang còn lại.
      </div>
      <section className="phase3-preview-section" aria-label="Màu thương hiệu">
        <h2>Màu sắc và trạng thái</h2>
        <div className="phase3-token-grid">
          {[
            ["Berry", "#D6306E"],
            ["Pink", "#FF92C1"],
            ["Blush", "#FCDFE1"],
            ["Caramel", "#EFB17E"],
            ["Jasmine", "#EFD47B"],
          ].map(([name, color]) => (
            <div key={name}>
              <span style={{ background: color }} />
              <p>
                {name}
                <br />
                {color}
              </p>
            </div>
          ))}
        </div>
        <div className="phase3-statuses">
          {[
            "received",
            "contacted",
            "confirmed",
            "completed",
            "cancelled",
            "draft",
            "published",
            "hidden",
          ].map((value) => (
            <StatusBadge value={value} key={value} />
          ))}
        </div>
      </section>
      <section id="admin-mau" className="phase3-preview-section admin-preview">
        <h2>Góc của shop</h2>
        <div className="admin-shell admin-sample-frame">
          <AdminNav />
          <div className="admin-main">
            <div className="admin-page-heading">
              <h3>Đơn hoa</h3>
              <span className="admin-hint">Dữ liệu mẫu</span>
            </div>
            <OrderTable rows={sampleOrders} demo />
            <OrderSummary row={detail} />
          </div>
        </div>
      </section>
      <section id="editor-mau" className="phase3-preview-section admin-preview">
        <h2>Editor sản phẩm</h2>
        <ProductDesignPreview />
      </section>
      <section className="phase3-preview-section admin-preview">
        <h2>Các trạng thái tương tác</h2>
        <ControlDesignPreview />
      </section>
    </main>
  );
}
