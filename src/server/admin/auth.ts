import { auth } from "@clerk/nextjs/server";
import { DomainError } from "@/domain/schemas";
import { redirect } from "next/navigation";
export const authConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
  );
export function assertAdminId(userId: string | null) {
  if (!userId)
    throw new DomainError(
      401,
      "UNAUTHENTICATED",
      "Vui lòng đăng nhập để tiếp tục.",
    );
  const allowed = (process.env.ADMIN_CLERK_USER_IDS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!allowed.includes(userId))
    throw new DomainError(
      403,
      "FORBIDDEN",
      "Tài khoản chưa được cấp quyền quản trị Hòe.",
    );
  return userId;
}
export async function requireAdmin() {
  if (!authConfigured())
    throw new DomainError(
      401,
      "UNAUTHENTICATED",
      "Đăng nhập quản trị chưa được kết nối.",
    );
  const session = await auth();
  return assertAdminId(session.userId);
}
export async function adminPageActor() {
  if (!authConfigured()) return null;
  try {
    return await requireAdmin();
  } catch (e) {
    if (e instanceof DomainError && e.status === 401) redirect("/dang-nhap");
    if (e instanceof DomainError && e.status === 403) return null;
    throw e;
  }
}
