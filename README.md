# Hòe

Website tiếng Việt dùng Next.js App Router, TypeScript, Tailwind CSS và Zod. Luồng chính: chọn mẫu → cấu hình theo dịch vụ → giỏ hoa → gửi yêu cầu → shop xác nhận giá/lịch sau.

## Chạy local

Cần Node.js 22 (từ 22.16), npm 11.6.2 và trình duyệt. Dự án khóa phiên bản trực tiếp và commit lockfile.

```powershell
npx --yes npm@11.6.2 ci
npm run dev:test
```

Mở http://localhost:3000. Chế độ này dùng fixtures được đánh dấu test và repository trong bộ nhớ của tiến trình local. Dữ liệu mất khi server khởi động lại; kết quả mock không chứng minh đã lưu vào Google Sheets.

Để dùng nội dung thật hoặc Sheet test, sao chép `.env.example` thành `.env.local`, điền cấu hình theo [SHEETS_RUNBOOK](docs/SHEETS_RUNBOOK.md), rồi chạy `npm run dev`. Secrets không được dùng tiền tố NEXT_PUBLIC, không commit file env.

## Kiểm tra

```powershell
npm run validate:content
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm audit --omit=dev
```

Playwright dùng port 3100 và cache riêng `.next-e2e`, gồm desktop và mobile. Chạy build/typecheck sau khi các server/test đã hoàn tất để tránh thay đổi đồng thời các file TypeScript do Next.js tự sinh. Typecheck chạy `next typegen` trước TypeScript.

## Cấu hình môi trường

| Biến | Mặc định / ý nghĩa |
| --- | --- |
| CONTENT_MODE | Nếu thiếu: test trên Vercel Preview, live ở local/production. Cấm test trên Vercel production. |
| DATA_ADAPTER | sheets; mock chỉ cho local với CONTENT_MODE=test. |
| SHEETS_GATEWAY_URL | URL /exec của Apps Script cho đúng môi trường. |
| SHEETS_GATEWAY_SECRET | Secret HMAC, giống GATEWAY_SECRET trong Script Properties. |
| RATE_LIMIT_SECRET | Secret khác để băm IP; không lưu IP thô. |
| SITE_URL | URL chuẩn của site; nếu thiếu trên Vercel dùng VERCEL_URL. |
| SHOP_LIVE | false; chỉ true sau khi nghiệm thu dữ liệu thật và Sheets production. |

## Deploy Vercel

Import repository `buibao/hoeshop`, framework Next.js, Node 22.x, build `npm run build`, install `npx --yes npm@11.6.2 ci` (được cấu hình sẵn trong vercel.json).

- Preview: CONTENT_MODE=test, DATA_ADAPTER=sheets, SHOP_LIVE=false. Cấu hình gateway/secret cho Sheet test riêng. Nếu thiếu kết nối, API trả 503 và giao diện giữ input/giỏ.
- Production: CONTENT_MODE=live, DATA_ADAPTER=sheets, gateway/secret cho Sheet production riêng. Cần catalog, ảnh, liên hệ và chính sách thật. Bật SHOP_LIVE=true chỉ khi đạt checklist trong runbook; prebuild từ chối thiếu dữ liệu/cấu hình cơ bản.
- Không promote artifact có fixtures sang production. Luôn build lại với cấu hình production.
- Có thể xem trước giao diện khi SHOP_LIVE=false; site có thông báo chuẩn bị mở và noindex.

## Tài liệu

- [CONTENT_GUIDE](docs/CONTENT_GUIDE.md): thay nội dung, ảnh và thứ tự Home.
- [SHEETS_RUNBOOK](docs/SHEETS_RUNBOOK.md): gateway, cột Sheet, trạng thái và khắc phục lỗi.
- [REQUIREMENTS](docs/REQUIREMENTS.md): baseline gốc và tiêu chí nghiệm thu.
- [BACKLOG](docs/BACKLOG.md): trạng thái thực tế, phần chưa nghiệm thu.
- [VERIFICATION](docs/VERIFICATION.md): kết quả kiểm tra và giới hạn bằng chứng.

Giá test không phải giá bán. Hoa Thời chỉ nhận nhu cầu/báo giá; chưa có gói, lịch tự động, thanh toán online, tài khoản, upload hay CMS.
