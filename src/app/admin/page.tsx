import Link from "next/link";
import { adminPageActor } from "@/server/admin/auth";
import { dashboard } from "@/server/admin/repository";
export default async function AdminPage() {
  if (!(await adminPageActor())) return null;
  const data = await dashboard();
  return (
    <>
      <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">GÓC CỦA SHOP</span>
      <h1 className="admin-title font-body text-display-xs font-semibold">Một ngày cùng Hòe</h1>
      <p className="muted text-tertiary">
        {data.shopLive
          ? "Website đang mở nhận yêu cầu."
          : "Website đang đóng nhận khách, chờ nghiệm thu."}
      </p>
      <div className="admin-stats grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link href="/admin/orders">
          <strong>{data.received}</strong>
          <span>Đơn mới cần liên hệ</span>
        </Link>
        <Link href="/admin/inquiries">
          <strong>{data.inquiries}</strong>
          <span>Tư vấn mới</span>
        </Link>
        <div>
          <strong>{data.total}</strong>
          <span>Đơn đã tiếp nhận</span>
        </div>
      </div>
      <p>
        Shop xác nhận lịch nhận, thiết kế, giá và phí giao khi liên hệ khách.
        Đổi trạng thái ở đây không tự gửi thông báo.
      </p>
    </>
  );
}
