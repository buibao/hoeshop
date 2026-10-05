import { DataTable } from "@/components/ui/DataTable";
import { Form } from "@/components/ui/Form";
import { ActionLink } from "@/components/ui/ActionLink";
import { Action } from "@/components/ui/Action";
import { SelectField } from "@/components/ui/SelectField";
import { notFound } from "next/navigation";
import { adminPageActor } from "@/server/admin/auth";
import { resourceSchema } from "@/server/admin/schemas";
import { adminList } from "@/server/admin/repository";
import { MediaLibrary } from "@/features/admin/MediaLibrary";
import { OrderTable } from "@/features/admin/OrderTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { valueLabel } from "@/domain/labels";
const labels: Record<string, string> = {
  orders: "Đơn hoa",
  inquiries: "Tư vấn",
  products: "Sản phẩm",
  posts: "Chuyện hoa",
  policies: "Chính sách",
  services: "Dịch vụ",
  settings: "Website",
  comments: "Bình luận",
  media: "Thư viện ảnh",
};
export default async function ListPage({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  if (!(await adminPageActor())) return null;
  const parsed = resourceSchema.safeParse((await params).resource);
  if (!parsed.success) notFound();
  const query = await searchParams,
    page = Math.floor(Math.max(0, Math.min(10000, Number(query.page) || 0))),
    status = query.status;
  const resource = parsed.data,
    result = await adminList(resource, undefined, page, status),
    rows = result.slice(0, 50);
  return (
    <>
      <div className="admin-page-heading mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="admin-title font-body text-display-xs font-semibold">{labels[resource]}</h1>
        {["products", "posts", "policies"].includes(resource) && (
          <ActionLink className="button" href={`/admin/${resource}/moi`}>
            Thêm mới
          </ActionLink>
        )}
      </div>
      {resource === "media" ? (
        <MediaLibrary />
      ) : (
        <>
          <p className="muted text-tertiary">
            50 bản ghi mỗi trang. Nội dung lưu trữ vẫn giữ lịch sử.
          </p>
          {["orders", "inquiries"].includes(resource) && (
            <Form method="get" className="admin-filter flex flex-wrap items-end gap-3">
              <SelectField name="status" label="Trạng thái" defaultValue={status || ""} options={[{value:"", label:"Tất cả"}, ...(resource === "orders"
                    ? [
                        "received",
                        "contacted",
                        "confirmed",
                        "completed",
                        "cancelled",
                      ]
                    : ["received", "contacted", "resolved", "cancelled"]
                  ).map(value => ({value, label:valueLabel(value)}))]} />
              <Action className="button">Lọc danh sách</Action>
            </Form>
          )}
          {resource === "orders" ? (
            <OrderTable rows={rows as Record<string, unknown>[]} />
          ) : (
            <div className="admin-table-wrap">
              <DataTable className="admin-table">
                <thead>
                  <tr>
                    <th>Nội dung</th>
                    <th>Trạng thái</th>
                    <th>Cập nhật</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const r = row as Record<string, unknown>,
                      id = String(r.id || r.key);
                    return (
                      <tr key={id} data-row-id={id}>
                        <td>
                          {String(
                            r.name ||
                              r.title ||
                              r.displayName ||
                              r.key ||
                              r.requestId ||
                              r.id,
                          )}
                          {r.body ? (
                            <p className="small text-sm">
                              {String(r.body).slice(0, 150)}
                            </p>
                          ) : null}
                        </td>
                        <td>
                          <StatusBadge
                            value={String(
                              r.publicationStatus ||
                                r.businessStatus ||
                                r.visibility ||
                                "—",
                            )}
                          />
                        </td>
                        <td>
                          {new Date(
                            String(r.updatedAt || r.createdAt),
                          ).toLocaleDateString("vi-VN", {
                            timeZone: "Asia/Ho_Chi_Minh",
                          })}
                        </td>
                        <td>
                          <ActionLink
                            className="text-link"
                            href={`/admin/${resource}/${encodeURIComponent(id)}`}
                          >
                            Mở chi tiết
                          </ActionLink>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </DataTable>
              {!rows.length && <p>Chưa có nội dung.</p>}
            </div>
          )}
          <nav className="admin-pagination mt-6 flex items-center justify-between gap-3" aria-label="Phân trang">
            {page > 0 && (
              <ActionLink
                className="button secondary"
                href={`/admin/${resource}?${new URLSearchParams({ page: String(page - 1), ...(status ? { status } : {}) })}`}
              >
                Trang trước
              </ActionLink>
            )}
            <span>Trang {page + 1}</span>
            {result.length > 50 && (
              <ActionLink
                className="button secondary"
                href={`/admin/${resource}?${new URLSearchParams({ page: String(page + 1), ...(status ? { status } : {}) })}`}
              >
                Trang sau
              </ActionLink>
            )}
          </nav>
        </>
      )}
    </>
  );
}
