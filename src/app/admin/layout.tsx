import { ActionLink } from "@/components/ui/ActionLink";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { viVN } from "@clerk/localizations";
import { redirect } from "next/navigation";
import { requireAdmin, authConfigured } from "@/server/admin/auth";
import { DomainError } from "@/domain/schemas";

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
      <main className="container mx-auto w-full max-w-container px-4 md:px-8 section py-12 md:py-16">
        <span className="brand font-display text-display-xs text-brand-secondary">hòe</span>
        <h1 className="admin-title font-body text-display-xs font-semibold">Quản trị đang được kết nối</h1>
        <p>
          Đăng nhập Google chưa được thiết lập. Khu vực quản trị chỉ mở cho tài
          khoản được shop cấp quyền.
        </p>
        <ActionLink className="text-link" href="/xem-thu/widgets">
          Xem thử widget Hòe
        </ActionLink>
      </main>
    );
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof DomainError && e.status === 401) redirect("/dang-nhap");
    if (e instanceof DomainError && e.status === 403)
      return (
        <main className="container mx-auto w-full max-w-container px-4 md:px-8 section py-12 md:py-16">
          <h1 className="admin-title font-body text-display-xs font-semibold">Chưa có quyền quản trị</h1>
          <p>Shop cần cấp quyền cho tài khoản Google của bạn.</p>
          <ClerkProvider localization={viVN} appearance={{variables:{colorPrimary:"#D6306E",fontFamily:"var(--font-body)"}}}>
            <UserButton />
          </ClerkProvider>
        </main>
      );
    throw e;
  }
  return (
    <ClerkProvider localization={viVN} appearance={{variables:{colorPrimary:"#D6306E",fontFamily:"var(--font-body)"}}}>
      <div className="admin-shell flex min-h-dvh flex-col lg:flex-row">
        <AdminNav>
          <UserButton />
        </AdminNav>
        <main className="admin-main min-w-0 flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </ClerkProvider>
  );
}
