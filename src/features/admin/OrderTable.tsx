import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { totalLabel } from "@/domain/pricing";
import { valueLabel } from "@/domain/labels";
import type { AdminRow } from "./form-model";
export function OrderTable({
  rows,
  demo = false,
}: {
  rows: AdminRow[];
  demo?: boolean;
}) {
  return (
    <>
      <div className="admin-order-mobile">
        {rows.map((row) => {
          const total = totalLabel(
            row.totals as Parameters<typeof totalLabel>[0],
          );
          return (
            <article className="admin-order-card" key={String(row.id)}>
              <div className="admin-order-card-heading">
                <strong>
                  #
                  {String(row.requestId || row.id)
                    .slice(0, 8)
                    .toUpperCase()}
                </strong>
                <StatusBadge value={String(row.businessStatus)} />
              </div>
              <p>{String((row.buyer as AdminRow)?.name || "Khách đặt hoa")}</p>
              <p className="admin-hint">
                {new Date(String(row.createdAt)).toLocaleString("vi-VN", {
                  timeZone: "Asia/Ho_Chi_Minh",
                  dateStyle: "short",
                  timeStyle: "short",
                })}{" "}
                ·{" "}
                {((row.serviceTypes || []) as string[])
                  .map(valueLabel)
                  .join(", ")}
              </p>
              <div className="admin-order-card-footer">
                <div>
                  <strong>{total.value}</strong>
                  <span className="admin-cell-secondary">{total.label}</span>
                </div>
                <Link
                  className="button secondary"
                  href={
                    demo
                      ? "#chi-tiet-don"
                      : `/admin/orders/${encodeURIComponent(String(row.id))}`
                  }
                >
                  Chi tiết
                  <span className="sr-only">
                    {" "}
                    đơn {String(row.requestId || row.id).slice(0, 8)}
                  </span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      <div className="admin-table-wrap admin-orders-desktop">
        <table className="admin-table admin-order-table">
          <caption className="sr-only">
            Danh sách đơn hoa và trạng thái xử lý
          </caption>
          <thead>
            <tr>
              <th>Đơn hoa / Khách</th>
              <th>Tiếp nhận</th>
              <th>Dịch vụ</th>
              <th>Trạng thái</th>
              <th>Tổng / Báo giá</th>
              <th>
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const buyer = (row.buyer || {}) as AdminRow;
              const total = totalLabel(
                row.totals as Parameters<typeof totalLabel>[0],
              );
              return (
                <tr key={String(row.id)}>
                  <td>
                    <strong>
                      #
                      {String(row.requestId || row.id)
                        .slice(0, 8)
                        .toUpperCase()}
                    </strong>
                    <span className="admin-cell-secondary">
                      {String(buyer.name || "Khách đặt hoa")}
                    </span>
                  </td>
                  <td>
                    {new Date(String(row.createdAt)).toLocaleDateString(
                      "vi-VN",
                      { timeZone: "Asia/Ho_Chi_Minh" },
                    )}
                    <span className="admin-cell-secondary">
                      {new Date(String(row.createdAt)).toLocaleTimeString(
                        "vi-VN",
                        {
                          timeZone: "Asia/Ho_Chi_Minh",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </td>
                  <td>
                    {((row.serviceTypes || []) as string[])
                      .map(valueLabel)
                      .join(", ") || "—"}
                  </td>
                  <td>
                    <StatusBadge value={String(row.businessStatus)} />
                  </td>
                  <td>
                    <strong>{total.value}</strong>
                    <span className="admin-cell-secondary">{total.label}</span>
                  </td>
                  <td>
                    <Link
                      className="text-link"
                      href={
                        demo
                          ? "#chi-tiet-don"
                          : `/admin/orders/${encodeURIComponent(String(row.id))}`
                      }
                    >
                      Chi tiết
                      <span className="sr-only">
                        {" "}
                        đơn {String(row.requestId || row.id).slice(0, 8)}
                      </span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <div className="admin-empty">
          <h3>Chưa có đơn hoa</h3>
          <p>Đơn mới sẽ xuất hiện ở đây sau khi được lưu thành công.</p>
        </div>
      )}
    </>
  );
}
