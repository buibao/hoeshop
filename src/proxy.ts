import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
const clerk = clerkMiddleware();
export default function proxy(
  request: NextRequest,
  event: Parameters<typeof clerk>[1],
) {
  if (
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    !process.env.CLERK_SECRET_KEY
  )
    return NextResponse.next();
  return clerk(request, event);
}
export const config = {
  matcher: ["/admin/:path*", "/dang-nhap/:path*", "/api/admin/:path*"],
};
