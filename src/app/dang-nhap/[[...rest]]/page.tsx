import { ClerkProvider, SignIn } from "@clerk/nextjs";
import { viVN } from "@clerk/localizations";
import { authConfigured } from "@/server/admin/auth";
export const metadata = {
  title: "Đăng nhập shop",
  robots: { index: false, follow: false },
};
export default function SignInPage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-12 md:px-8 md:py-16">
      <span className="brand font-display text-display-xs text-brand-secondary">hòe</span>
      <h1 className="text-display-sm">Góc nhỏ của shop</h1>
      {authConfigured() ? (
        <ClerkProvider localization={viVN} appearance={{variables:{colorPrimary:"#D6306E", fontFamily:"var(--font-body)"}}}>
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
