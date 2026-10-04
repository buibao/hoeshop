# Bằng chứng phase 2

05/10/2026 (Asia/Ho_Chi_Minh). Baseline `474cc71`, branch `feat/phase2`. SHOP_LIVE=false; chưa có deadline phase 2.

| Kiểm tra                | Kết quả / giới hạn                                                                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build/typecheck/lint    | Đạt local; build Vercel Preview READY trên sin1. Lazy DB không yêu cầu kết nối khi build; public/admin/sitemap đọc runtime.                                                                        |
| Vitest unit/API         | 51/51 đạt: giá, giỏ/reconcile, schema, ngày Việt Nam, fingerprint/TTL, signature/API errors và bytes JPEG/PNG/WebP/AVIF.                                                                           |
| Postgres integration    | 13/13 đạt trên Postgres 18.4 UTF8 local và chạy lại đạt trên Neon PostgreSQL 18.6, DB `hoe-test` riêng Singapore. Clerk session/Blob trong admin integration vẫn mock. |
| Playwright public       | 34/34 desktop/mobile đạt. Đã chạy lại 8 storefront cases mỗi viewport sau tối ưu ảnh/motion và 2 retry cases sau đổi import locale. Mock local có nhãn test.                                       |
| Browser → API → DB      | Neon Preview 1440/390px: giỏ ba dịch vụ, checkout 201; mất response/reload retry 200 cùng ID; SQL mỗi request một order, ba items, một idempotency row. Tư vấn/bình luận 201. Sau redeploy, hai checkout retry 200/receipt cũ và SQL vẫn một order/ba items. |
| Preview thật            | Home/test banner, Google button, calendar/Escape/return focus, không overflow/pageerror. Bốn retry cùng payload 200, khác hash 409, draft 404, guest admin 401; Hidden retry 409. Hide/restore kiểm tra qua SQL trên comment test, chưa qua admin UI. |
| Readiness               | DB test trả ready=false/exit 1 đúng khi thiếu catalog thật, ảnh/contact/policies/auth/media và chưa production.                                                                                    |
| Production dependencies | npm audit --omit=dev: 0 vulnerabilities. Sharp 0.35.5, kiểm thử decode MIME thực tế đạt.                                                                                                           |
| Linux install           | npm 11.6.2 ci dry-run Linux x64 đạt với lockfile tạo từ directory sạch; pinned emnapi overrides xử lý optional dependency mismatch. Vercel install/build đã đạt.                                   |
| Lighthouse/bundle       | Median mobile 85 → 83, transfer 974 → 480 KiB, JS 243,5 → 227,2 KiB. Target ≥90 chưa đạt; [điều kiện và samples](PERFORMANCE.md).                                                                  |
| Neon/Google/Blob thật   | Đã kết nối qua CLI. Neon đã migrate/seed và public Preview đối chiếu SQL. Clerk development backend xác nhận Google linked/email verified/đăng nhập của admin. Blob SDK upload/read/delete đạt. UAT admin/non-admin/direct upload qua UI chưa chạy đầy đủ. |

Preview kiểm tra đầu tiên chưa có DB: `fe93568`, deployment `dpl_DHa7Y75esPbGrm8hsSoCdtDboPo8`, [widget](https://hoeshop-d7twl1isw-buibaos-projects.vercel.app/xem-thu/widgets); khi đó API trả 503 đúng. Preview có dịch vụ đã nghiệm thu public: `dpl_6Gw7wHJimx8rjQ8wHF5DQVypLRcj`, [website](https://hoeshop-53lqqko05-buibaos-projects.vercel.app), Functions sin1. [PREVIEW_SERVICES](PREVIEW_SERVICES.md) ghi tài nguyên, keys và phạm vi bằng chứng. Alias nhánh [Preview hiện tại](https://hoeshop-git-feat-phase2-buibaos-projects.vercel.app/xem-thu/widgets) cập nhật theo HEAD. Vercel bảo vệ Preview; dùng share link cấp riêng hoặc đăng nhập chủ project. Không commit bypass token/browser cookies vào repo. Main/production phase 1 chưa đổi.

13 integration cases bao gồm: 12 concurrent cùng ID một đơn; khác hash 409; rollback order/items/idempotency/rate; mất response/restart và retry qua ngày/catalog archive/shop đóng; shared rate 5/6 và retry miễn phí; formula string plain text; 22 comments tuple paging/hide/restore; stale edit và pricing revision; seed no overwrite; admin 401/403/content publish/media FK/reference 409. Media finish kiểm tra pathname trong Blob store của server và URL canonical trước fetch, từ chối URL store khác. Các provider mocks được ghi rõ.

Widget thử ở 360/390/768/1024/1440px: chuột/chạm/bàn phím, reduced motion, focus trap/Escape/return focus, hôm nay/xóa/hủy, date/time canonical, ngày không tồn tại và giờ/phút biên. DayPicker locale vi, tuần thứ Hai, không native date/time input. iPhone 13 chạy Chromium emulation; chưa thay Safari/iOS thật.

## Ảnh nghiệm thu trên Preview

| Desktop 1440px                                                             | Mobile 390px                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [Calendar](screenshots/preview-1440-calendar-selected.png)                 | [Calendar bottom sheet](screenshots/preview-390-calendar-selected.png)    |
| [Giờ](screenshots/preview-1440-time-selected.png)                          | [Giờ bottom sheet](screenshots/preview-390-time-selected.png)             |
| [Trống/chọn/lỗi/disabled/focus](screenshots/preview-1440-states-focus.png) | [Trống/chọn/lỗi/disabled/focus](screenshots/preview-390-states-focus.png) |

Ảnh fixture test, không phải ảnh/giá bán. Screenshot ẩn riêng toolbar Vercel khi chụp để thấy widget rõ; ứng dụng không thay đổi platform toolbar. Ảnh local test tương ứng cũng giữ trong screenshots. Shop cần thử trực tiếp Preview trước chốt milestone B.

## Phần chưa nghiệm thu và giới hạn

Neon test/Preview và Clerk/Blob Preview đã provision qua CLI sau khi chủ project đăng nhập/chấp nhận điều khoản. Connector env/integrations vẫn thiếu quyền; không dùng connector đó để ghi cấu hình. Git push nhánh thành công; GitHub connector tạo draft PR trước đó trả 403 Resource not accessible by integration. Có thể [mở PR từ nhánh](https://github.com/buibao/hoeshop/pull/new/feat/phase2) sau khi chủ project cấp quyền. Chưa merge/promote.

`npm audit` toàn bộ còn 9 advisories ở dev tooling (drizzle-kit/esbuild và eslint glob/braces); runtime audit 0. Không tự downgrade Drizzle/Next theo audit --force. Theo dõi bản vá tương thích của tooling, chỉ chạy công cụ dev local; không mở dev server của esbuild ra mạng. Chưa coi đây là toàn bộ release security/UAT.

Cần hoàn tất UAT admin/non-admin/Blob qua giao diện và shop nghiệm thu. Admin user ID đã được cấu hình; Neon public deployment và DB assertions đã đạt, không thay kiểm thử admin/media. Catalog/giá/logo/ảnh/contact/policies thật, DB/Blob/Clerk production, domain/OAuth production, performance tuning ≥90, Safari/iOS thật và gói Vercel thương mại còn mở. Không tự mua gói trả phí, không mở nhận khách.

Xem [ADMIN_RUNBOOK](ADMIN_RUNBOOK.md), [DATABASE](DATABASE.md), [PHASE2_PLAN](PHASE2_PLAN.md). Phase 1 không phải bằng chứng nghiệm thu dịch vụ phase 2.
