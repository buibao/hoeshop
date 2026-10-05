import { DataTable } from "@/components/ui/DataTable";
import { ActionLink } from "@/components/ui/ActionLink";
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
      <div className="admin-order-mobile grid grid-cols-1 gap-4 md:hidden">
        {rows.map((row) => {
          const total = totalLabel(
            row.totals as Parameters<typeof totalLabel>[0],
          );
          return (
            <article className="admin-order-card rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary" key={String(row.id)}>
              <div className="admin-order-card-heading mb-3 flex items-center justify-between gap-3">
                <strong>
                  #
                  {String(row.requestId || row.id)
                    .slice(0, 8)
                    .toUpperCase()}
                </strong>
                <StatusBadge value={String(row.businessStatus)} />
              </div>
              <p>{String((row.buyer as AdminRow)?.name || "Khách đặt hoa")}</p>
              <p className="admin-hint text-sm text-tertiary">
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
              <div className="admin-order-card-footer mt-4 flex items-end justify-between gap-3">
                <div>
                  <strong>{total.value}</strong>
                  <span className="admin-cell-secondary block text-sm text-tertiary">{total.label}</span>
                </div>
                <ActionLink
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
                </ActionLink>
              </div>
            </article>
          );
        })}
      </div>
      <div className="admin-table-wrap admin-orders-desktop hidden md:block">
        <DataTable className="admin-table admin-order-table">
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
                <tr key={String(row.id)} data-row-id={String(row.id)}>
                  <td>
                    <strong>
                      #
                      {String(row.requestId || row.id)
                        .slice(0, 8)
                        .toUpperCase()}
                    </strong>
                    <span className="admin-cell-secondary block text-sm text-tertiary">
                      {String(buyer.name || "Khách đặt hoa")}
                    </span>
                  </td>
                  <td>
                    {new Date(String(row.createdAt)).toLocaleDateString(
                      "vi-VN",
                      { timeZone: "Asia/Ho_Chi_Minh" },
                    )}
                    <span className="admin-cell-secondary block text-sm text-tertiary">
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
                    <span className="admin-cell-secondary block text-sm text-tertiary">{total.label}</span>
                  </td>
                  <td>
                    <ActionLink
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
                    </ActionLink>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </div>
      {!rows.length && (
        <div className="admin-empty rounded-xl bg-secondary p-8 text-center">
          <h3>Chưa có đơn hoa</h3>
          <p>Đơn mới sẽ xuất hiện ở đây sau khi được lưu thành công.</p>
        </div>
      )}
    </>
  );
}
