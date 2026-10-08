import localFont from "next/font/local";

export const termes = localFont({
  src: [
    { path: "./texgyretermes-regular.woff2", weight: "400", style: "normal" },
    { path: "./texgyretermes-bold.woff2", weight: "700", style: "normal" },
    { path: "./texgyretermes-italic.woff2", weight: "400", style: "italic" },
    { path: "./texgyretermes-bolditalic.woff2", weight: "700", style: "italic" },
  ],
  display: "swap", variable: "--font-store-body", preload: false,
  fallback: ["Times New Roman", "serif"], adjustFontFallback: "Times New Roman",
});

export const cormorant = localFont({
  src: [
    { path: "./cormorant-garamond-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./cormorant-garamond-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./cormorant-garamond-500-italic.woff2", weight: "500", style: "italic" },
  ],
  display: "swap", variable: "--font-store-heading", preload: false,
  fallback: ["Georgia", "serif"], adjustFontFallback: "Times New Roman",
});
