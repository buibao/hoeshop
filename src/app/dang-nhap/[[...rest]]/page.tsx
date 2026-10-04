import { ClerkProvider, SignIn } from "@clerk/nextjs";
import { authConfigured } from "@/server/admin/auth";
export const metadata = {
  title: "Đăng nhập shop",
  robots: { index: false, follow: false },
};
export default function SignInPage() {
  return (
    <main className="container section" style={{ maxWidth: 520 }}>
      <span className="brand">hòe</span>
      <h1 style={{ fontSize: 32, marginBlock: 24 }}>Góc nhỏ của shop</h1>
      {authConfigured() ? (
        <ClerkProvider>
          <SignIn
            withSignUp={false}
            transferable={false}
            appearance={{ elements: { footerAction: { display: "none" } } }}
            routing="path"
            path="/dang-nhap"
            forceRedirectUrl="/admin"
          />
        </ClerkProvider>
      ) : (
        <p>Đăng nhập Google đang được kết nối.</p>
      )}
    </main>
  );
}
