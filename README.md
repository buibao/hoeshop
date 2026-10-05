# Hòe

Checkpoint Home theo Oh les Fleurs trên `feat/oh-les-fleurs-home`, bắt đầu từ phase 3 `0217f4d`: hero chữ trung tâm/ảnh collage, Home sections, menu/footer và card riêng. Xem [plan](docs/phase-3/oh-les-fleurs/PLAN.md), [mapping reference](docs/phase-3/oh-les-fleurs/REFERENCE_MAPPING.md), [kiểm chứng và Preview](docs/phase-3/oh-les-fleurs/VERIFICATION.md), [assets](docs/phase-3/oh-les-fleurs/ASSETS.md). Catalog/detail/forms/Admin giữ baseline; chờ shop duyệt Home, không mở production. Migration Untitled UI đã bị từ chối và hoàn tác; không có trong nhánh này.

Phase 3 đang ở checkpoint A/B trên nhánh `feat/phase3`: sửa Hoa Ý/giá/trạng thái/field errors và mẫu Home, chi tiết sản phẩm, admin. Xem [plan](docs/phase-3/PHASE3_PLAN.md), [UI spec](docs/phase-3/UI_SPEC.md), [bằng chứng](docs/phase-3/VERIFICATION_PHASE3.md). `/xem-thu/giao-dien` dùng admin mẫu cố định, không đọc đơn thật hoặc lưu dữ liệu; chỉ có trong chế độ test và không mở trên Vercel production. Chờ shop duyệt thiết kế trước C/D/E; `SHOP_LIVE=false`.

Revision checkpoint B: ghi chú hero bên dưới ảnh, khung card sản phẩm thống nhất, submenu Sản phẩm theo ba dịch vụ, fade/scroll/hover/click và reduced motion. Preview và bằng chứng desktop/mobile được ghi trong VERIFICATION_PHASE3; assets vẫn là ảnh test.

Website tiếng Việt với Next.js App Router/TypeScript/Tailwind/Zod. Phase 2 bổ sung Postgres/Drizzle, admin Clerk Google, thư viện Vercel Blob và calendar/time picker mang giao diện Hòe. Giữ Lora, Be Vietnam Pro, Tailwind Preflight và bảng màu hiện tại.

Luồng khách: mẫu hoa → cấu hình dịch vụ → giỏ → gửi yêu cầu → shop xác nhận giá/lịch. Không thanh toán online, tài khoản khách hoặc gói Hoa Thời.

## Chạy local

Node.js 22 và npm 11.6.2. Phiên bản dependencies và lockfile được khóa.

```powershell
npx --yes npm@11.6.2 ci
npm run dev:test
```

Mở `http://localhost:3000`, widget tại `/xem-thu/widgets`. Chế độ này có nhãn test và mock trong bộ nhớ local; mất dữ liệu khi restart. Không chứng minh lưu Postgres, Google login hay Blob thật. Mock bị cấm trên deployment.

Để dùng Postgres thật, sao chép `.env.example` thành `.env.local`, đặt pooled/direct URL, DB_ENV đúng DB riêng và DATA_ADAPTER=postgres. Chạy migration/seed theo [DATABASE](docs/phase-2/DATABASE.md), sau đó `npm run dev`. Secrets và browser session state không commit, không gửi vào chat. Live chỉ đọc DB; Sheets đã bỏ khỏi runtime phase 2.

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

Integration dùng Postgres **test riêng đã migrate/seed fixtures**, DATABASE_URL và DB_ENV=test: `npm run test:integration`. Admin UAT thật cần Preview nối dịch vụ và Google storageStates: [ADMIN_RUNBOOK](docs/phase-2/ADMIN_RUNBOOK.md). Không dùng production cho các test ghi dữ liệu.

Playwright public chạy mock local port 3100/cache `.next-e2e`, desktop và mobile. Chạy typecheck sau build/E2E để tránh file types sinh đồng thời. `db:readiness` kiểm tra dữ liệu/cấu hình production và exit 1 khi chưa sẵn sàng.

## Môi trường và Preview

| Biến                                                 | Ý nghĩa                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| DATABASE_URL                                         | Pooled Postgres URL server, không có NEXT_PUBLIC.          |
| DATABASE_URL_UNPOOLED                                | Direct URL cho migration/seed.                             |
| DB_ENV                                               | development/test/preview/production, phải trùng marker DB. |
| DATA_ADAPTER                                         | postgres; mock chỉ local với CONTENT_MODE=test.            |
| CONTENT_MODE                                         | Preview mặc định test; production phải live.               |
| RATE_LIMIT_SECRET                                    | Secret băm IP, không lưu IP thô.                           |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY | Clerk đúng môi trường.                                     |
| ADMIN_CLERK_USER_IDS                                 | Danh sách Clerk user ID được phép quản trị ở server.       |
| BLOB_READ_WRITE_TOKEN                                | Blob đúng môi trường, chỉ server.                          |
| SITE_URL                                             | Canonical URL; Vercel mặc định deployment URL khi thiếu.   |
| SHOP_LIVE                                            | false đến khi shop nghiệm thu dữ liệu/dịch vụ thật.        |

Preview disconnected có nhãn test và fixture giao diện để duyệt widget; API thiếu DB trả 503, không báo đã nhận. `/xem-thu/widgets` 404 production. Không promote artifact test sang production. Vercel dùng Node22, sin1 và npm11 ci theo vercel.json.

Ngày 05/10/2026 đã kết nối dịch vụ bằng Vercel CLI: Neon `hoe-preview` và `hoe-test` riêng ở Singapore, Clerk development và Blob `hoe-media-preview`. Preview đã nhận đơn/tư vấn/bình luận vào Neon; retry sau reload không tạo bản ghi trùng. Admin `buibao1997@gmail.com` đã có Clerk user ID trong allowlist server và liên kết Google. Xem [thiết lập và bằng chứng dịch vụ](docs/phase-2/PREVIEW_SERVICES.md). Chưa mở production; UAT admin/non-admin và upload qua giao diện còn cần hoàn tất.

Deploy qua CLI dùng `.vercelignore` để loại `.env*`, `.local`, browser sessions và công cụ vận hành khỏi source upload. Kiểm tra `vercel deploy --dry --json` trước deploy khi thêm thư mục local.

## Tài liệu bàn giao

- [PHASE2_PLAN](docs/phase-2/PHASE2_PLAN.md): milestone, quyết định và trạng thái thực tế.
- [DATABASE](docs/phase-2/DATABASE.md): schema, transaction, seed và rollback.
- [ADMIN_RUNBOOK](docs/phase-2/ADMIN_RUNBOOK.md): Google admin, media, widget/UAT và release.
- [VERIFICATION_PHASE2](docs/phase-2/VERIFICATION_PHASE2.md): bằng chứng, giới hạn và phần chưa nghiệm thu.
- [Ảnh widget desktop/mobile](docs/phase-2/screenshots): calendar, giờ, lỗi, disabled và focus.
- [BACKLOG](docs/BACKLOG.md): phần còn thiếu để mở shop.
- [REQUIREMENTS](docs/REQUIREMENTS.md), [CONTENT_GUIDE](docs/CONTENT_GUIDE.md), [SHEETS_RUNBOOK](docs/SHEETS_RUNBOOK.md), [VERIFICATION phase 1](docs/VERIFICATION.md): lịch sử baseline/import/Sheets; không phải hướng dẫn runtime phase 2.
