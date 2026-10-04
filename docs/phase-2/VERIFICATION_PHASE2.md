# Bằng chứng phase 2

05/10/2026 (Asia/Ho_Chi_Minh). Baseline `474cc71`, branch `feat/phase2`. SHOP_LIVE=false; chưa có deadline phase 2.

| Kiểm tra                | Kết quả / giới hạn                                                                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build/typecheck/lint    | Đạt local; build Vercel Preview READY trên sin1. Lazy DB không yêu cầu kết nối khi build; public/admin/sitemap đọc runtime.                                                                        |
| Vitest unit/API         | 51/51 đạt: giá, giỏ/reconcile, schema, ngày Việt Nam, fingerprint/TTL, signature/API errors và bytes JPEG/PNG/WebP/AVIF.                                                                           |
| Postgres integration    | 13/13 đạt trên Postgres 18.4 UTF8 local test riêng. Clerk session và Blob provider được mock trong admin integration.                                                                              |
| Playwright public       | 34/34 desktop/mobile đạt. Đã chạy lại 8 storefront cases mỗi viewport sau tối ưu ảnh/motion và 2 retry cases sau đổi import locale. Mock local có nhãn test.                                       |
| Browser → API → DB      | Checkout local Postgres 201 received; query order/items xác nhận một snapshot, cleanup. Không pageerror.                                                                                           |
| Preview thật            | Home/test banner, calendar, giờ, hủy/Escape/return focus, overflow ở 1440/390px: PASS. POST order thiếu DB 503, không receipt; guest admin API 401; admin thông báo đang kết nối; không pageerror. |
| Readiness               | DB test trả ready=false/exit 1 đúng khi thiếu catalog thật, ảnh/contact/policies/auth/media và chưa production.                                                                                    |
| Production dependencies | npm audit --omit=dev: 0 vulnerabilities. Sharp 0.35.5, kiểm thử decode MIME thực tế đạt.                                                                                                           |
| Linux install           | npm 11.6.2 ci dry-run Linux x64 đạt với lockfile tạo từ directory sạch; pinned emnapi overrides xử lý optional dependency mismatch. Vercel install/build đã đạt.                                   |
| Lighthouse/bundle       | Median mobile 85 → 83, transfer 974 → 480 KiB, JS 243,5 → 227,2 KiB. Target ≥90 chưa đạt; [điều kiện và samples](PERFORMANCE.md).                                                                  |
| Neon/Google/Blob thật   | Chưa kết nối, chưa nghiệm thu. UAT suite có sẵn nhưng chưa chạy; không coi mock nhà cung cấp là bằng chứng dịch vụ thật.                                                                           |

Preview kiểm tra đầu tiên: `fe93568`, deployment `dpl_DHa7Y75esPbGrm8hsSoCdtDboPo8`, [widget](https://hoeshop-d7twl1isw-buibaos-projects.vercel.app/xem-thu/widgets). Alias nhánh [Preview hiện tại](https://hoeshop-git-feat-phase2-buibaos-projects.vercel.app/xem-thu/widgets) cập nhật theo HEAD. Vercel bảo vệ Preview; dùng share link cấp riêng hoặc đăng nhập chủ project. Không commit bypass token/browser cookies vào repo. Main/production phase 1 chưa đổi.

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

Neon/Clerk/Blob test chưa có; thao tác ghi env/integrations Vercel trả 403, CLI chưa đăng nhập. Git push nhánh thành công và có Preview; GitHub connector tạo draft PR trả 403 Resource not accessible by integration. Có thể [mở PR từ nhánh](https://github.com/buibao/hoeshop/pull/new/feat/phase2) sau khi chủ project cấp quyền. Chưa merge/promote.

`npm audit` toàn bộ còn 9 advisories ở dev tooling (drizzle-kit/esbuild và eslint glob/braces); runtime audit 0. Không tự downgrade Drizzle/Next theo audit --force. Theo dõi bản vá tương thích của tooling, chỉ chạy công cụ dev local; không mở dev server của esbuild ra mạng. Chưa coi đây là toàn bộ release security/UAT.

Cần Clerk user ID của buibao1997@gmail.com, DB/Blob/auth đúng môi trường, UAT Google/non-admin/Blob/Neon deployment và DB assertions, catalog/giá/logo/ảnh/contact/policies thật, domain/OAuth production và shop nghiệm thu. Performance tuning ≥90, Safari/iOS thật và kiểm tra gói Vercel thương mại còn mở. Không tự mua gói trả phí, không mở nhận khách.

Xem [ADMIN_RUNBOOK](ADMIN_RUNBOOK.md), [DATABASE](DATABASE.md), [PHASE2_PLAN](PHASE2_PLAN.md). Phase 1 không phải bằng chứng nghiệm thu dịch vụ phase 2.
