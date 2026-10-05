import { ActionLink } from "@/components/ui/ActionLink";
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

export const metadata: Metadata = {
  title: "Untitled UI — gallery Hòe",
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
export default async function UntitledPreview({searchParams}:{searchParams:Promise<{panel?:string}>}) {
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.CONTENT_MODE !== "test"
  )
    notFound();
  if ((await searchParams).panel === "admin") return <main className="flex min-h-dvh flex-col lg:flex-row"><AdminNav /><div className="min-w-0 flex-1 px-4 py-8 md:px-8"><h1 className="mb-8 font-body text-display-xs">Đơn hoa — dữ liệu mẫu</h1><OrderTable rows={sampleOrders} demo/><OrderSummary row={detail}/></div></main>;
  return (
    <main id="main-content" className="container mx-auto w-full max-w-container px-4 md:px-8">
      <header className="phase3-preview-heading flex flex-col gap-4 py-8">
        <Link className="brand font-display text-display-xs text-brand-secondary" href="/">
          hòe
        </Link>
        <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">UNTITLED UI · CHECKPOINT A</span>
        <h1 className="font-display">
          Một diện mạo mới,
          <br />
          <em>vẫn là Hòe.</em>
        </h1>
        <p>
          Component Untitled UI miễn phí từ source đã khóa; các layout được compose cho Hòe. Đây là bản duyệt bố cục với ảnh và giá test; các màn
          admin bên dưới dùng dữ liệu mẫu cố định, không đọc đơn thật hoặc lưu
          dữ liệu.
        </p>
        <nav className="phase3-preview-nav flex flex-wrap gap-3" aria-label="Duyệt thiết kế">
          <ActionLink className="button" href="/">
            Xem Home
          </ActionLink>
          <ActionLink className="button secondary" href="/san-pham/mau-test-nang">
            Chi tiết sản phẩm
          </ActionLink>
          <ActionLink className="button secondary" href="/xem-thu/widgets">
            Calendar & giờ
          </ActionLink>
          <a className="text-link" href="#admin-mau">
            Admin mẫu
          </a>
          <a className="text-link" href="#editor-mau">
            Editor sản phẩm
          </a>
        </nav>
      </header>
      <div className="phase3-preview-banner rounded-xl bg-brand-primary p-4">
        Ảnh và nội dung minh họa. Gallery không đọc hoặc ghi dữ liệu quản trị thật.
      </div>
      <section className="phase3-preview-section my-8 flex flex-col gap-4" aria-label="Màu thương hiệu">
        <h2>Màu sắc và trạng thái</h2>
        <div className="phase3-token-grid grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            ["Berry", "#D6306E"],
            ["Pink", "#FF92C1"],
            ["Blush", "#FCDFE1"],
            ["Caramel", "#EFB17E"],
            ["Jasmine", "#EFD47B"],
          ].map(([name, color]) => (
            <div key={name}>
              <span className="block h-16 rounded-lg" style={{ background: color }} />
              <p>
                {name}
                <br />
                {color}
              </p>
            </div>
          ))}
        </div>
        <div className="phase3-statuses flex flex-wrap gap-3">
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
      <section id="admin-mau" className="phase3-preview-section my-8 flex flex-col gap-4 admin-preview min-w-0 flex-1">
        <h2>Góc của shop</h2>
        <ActionLink href="/xem-thu/giao-dien?panel=admin" className="button secondary">Xem sidebar quản trị mẫu</ActionLink>
        <OrderTable rows={sampleOrders} demo />
        <OrderSummary row={detail} />
      </section>
      <section id="editor-mau" className="phase3-preview-section my-8 flex flex-col gap-4 admin-preview min-w-0 flex-1">
        <h2>Editor sản phẩm</h2>
        <ProductDesignPreview />
      </section>
      <section className="phase3-preview-section my-8 flex flex-col gap-4 admin-preview min-w-0 flex-1">
        <h2>Các trạng thái tương tác</h2>
        <ControlDesignPreview />
      </section>
    </main>
  );
}
