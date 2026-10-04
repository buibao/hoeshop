import Link from "next/link";
import { notFound } from "next/navigation";
import { adminPageActor } from "@/server/admin/auth";
import { resourceSchema } from "@/server/admin/schemas";
import { adminList } from "@/server/admin/repository";
import { MediaLibrary } from "@/features/admin/MediaLibrary";
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
      <div className="admin-page-heading">
        <h1 className="admin-title">{labels[resource]}</h1>
        {["products", "posts", "policies"].includes(resource) && (
          <Link className="button" href={`/admin/${resource}/moi`}>
            Thêm mới
          </Link>
        )}
      </div>
      {resource === "media" ? (
        <MediaLibrary />
      ) : (
        <>
          <p className="muted">
            50 bản ghi mỗi trang. Nội dung lưu trữ vẫn giữ lịch sử.
          </p>
          {["orders", "inquiries"].includes(resource) && (
            <form method="get" className="admin-filter">
              <label className="field">
                <span>Trạng thái</span>
                <select name="status" defaultValue={status || ""}>
                  <option value="">Tất cả</option>
                  {(resource === "orders"
                    ? [
                        "received",
                        "contacted",
                        "confirmed",
                        "completed",
                        "cancelled",
                      ]
                    : ["received", "contacted", "resolved", "cancelled"]
                  ).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button">Lọc danh sách</button>
            </form>
          )}
          <div className="admin-table-wrap">
            <table className="admin-table">
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
                    <tr key={id}>
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
                          <p className="small">
                            {String(r.body).slice(0, 150)}
                          </p>
                        ) : null}
                      </td>
                      <td>
                        {String(
                          r.publicationStatus ||
                            r.businessStatus ||
                            r.visibility ||
                            "—",
                        )}
                      </td>
                      <td>
                        {new Date(
                          String(r.updatedAt || r.createdAt),
                        ).toLocaleDateString("vi-VN", {
                          timeZone: "Asia/Ho_Chi_Minh",
                        })}
                      </td>
                      <td>
                        <Link
                          className="text-link"
                          href={`/admin/${resource}/${encodeURIComponent(id)}`}
                        >
                          Mở chi tiết
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!rows.length && <p>Chưa có nội dung.</p>}
          </div>
          <nav className="admin-pagination" aria-label="Phân trang">
            {page > 0 && (
              <Link
                className="button secondary"
                href={`/admin/${resource}?${new URLSearchParams({ page: String(page - 1), ...(status ? { status } : {}) })}`}
              >
                Trang trước
              </Link>
            )}
            <span>Trang {page + 1}</span>
            {result.length > 50 && (
              <Link
                className="button secondary"
                href={`/admin/${resource}?${new URLSearchParams({ page: String(page + 1), ...(status ? { status } : {}) })}`}
              >
                Trang sau
              </Link>
            )}
          </nav>
        </>
      )}
    </>
  );
}
