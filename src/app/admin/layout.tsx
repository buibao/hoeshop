import Link from "next/link";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { requireAdmin, authConfigured } from "@/server/admin/auth";
import { DomainError } from "@/domain/schemas";
import "@/styles/admin.css";
import { AdminNav } from "@/features/admin/AdminNav";
export const metadata = {
  title: "Quản trị Hòe",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!authConfigured())
    return (
      <main className="container section">
        <span className="brand">hòe</span>
        <h1 className="admin-title">Quản trị đang được kết nối</h1>
        <p>
          Đăng nhập Google chưa được thiết lập. Khu vực quản trị chỉ mở cho tài
          khoản được shop cấp quyền.
        </p>
        <Link className="text-link" href="/xem-thu/widgets">
          Xem thử widget Hòe
        </Link>
      </main>
    );
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof DomainError && e.status === 401) redirect("/dang-nhap");
    if (e instanceof DomainError && e.status === 403)
      return (
        <main className="container section">
          <h1 className="admin-title">Chưa có quyền quản trị</h1>
          <p>Shop cần cấp quyền cho tài khoản Google của bạn.</p>
          <ClerkProvider>
            <UserButton />
          </ClerkProvider>
        </main>
      );
    throw e;
  }
  return (
    <ClerkProvider>
      <div className="admin-shell">
        <AdminNav>
          <UserButton />
        </AdminNav>
        <main className="admin-main">{children}</main>
      </div>
    </ClerkProvider>
  );
}
