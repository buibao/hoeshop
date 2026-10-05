import type { Metadata } from "next";
import { Lora, Be_Vietnam_Pro } from "next/font/google";
import { connection } from "next/server";
import { UiProvider } from "@/components/ui/UiProvider";
import "./globals.css";


const heading = Lora({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-hoe-display",
});
const body = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-hoe-body",
});
export const metadata: Metadata = {
  title: { default: "Hòe — Hòe gửi hoa, chill ghé nhà.", template: "%s | Hòe" },
  robots: { index: false, follow: false },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  return (
    <html lang="vi" className={`${heading.variable} ${body.variable}`}>
      <body>
        <UiProvider>{children}</UiProvider>
      </body>
    </html>
  );
}
