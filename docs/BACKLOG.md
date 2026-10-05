# Backlog Hòe

## Migration Untitled UI

Nhánh `feat/untitled-ui` thay toàn bộ UI ứng dụng bằng source MIT đã khóa và composition miễn phí cho Hòe. Theme/fonts/controls/navigation/table/media đã migrate, giữ business/API/DB contracts. Xem docs/untitled-ui. Không mua PRO; không tự mở shop.

Còn nghiệm thu: duyệt gallery và Store/Admin desktop/mobile, Google admin/non-admin + Blob qua UI trên Preview, Safari/iOS thật, assets thật. Các yêu cầu cũ về Bootstrap/DayPicker/parallax/reveal/time popup đã được quyết định mới thay thế. Trạng thái kiểm thử cuối và link Preview cập nhật tại VERIFICATION.md; không lấy tài liệu cũ làm bằng chứng cho bản UI mới.

Phase 1 baseline giữ trong REQUIREMENTS/VERIFICATION.md; adapter Sheets và Apps Script là lịch sử. Phase 2 bắt đầu từ `474cc71`, runtime dùng Postgres. Không dùng lại deadline 06/10/2026.

| Mốc phase 2          | Đã triển khai                                                                                                                                       | Chưa nghiệm thu                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A: retry/giỏ         | Metadata 7 ngày, normalize/fingerprint, retry trước validation động, reconcile; retry mất response/reload đạt trên Neon Preview desktop/mobile.     | Shop nghiệm thu giỏ/retry.                                                                        |
| A: DB                | 13 bảng/migration, marker, seed no overwrite; Neon Free test/Preview riêng Singapore đã migrate/import.                                             | DB production và dữ liệu thật.                                                                    |
| A: dữ liệu phát sinh | Transaction/idempotency/rate; 13 integration cases đạt trên Neon test. Public Preview lưu đơn/tư vấn/bình luận, đối chiếu SQL và retry không trùng. | Shop nghiệm thu/vận hành.                                                                         |
| A: content/admin     | Async content/cache, runtime slug, CRUD/archive, status/note audit, allowlist và stale edit.                                                        | Clerk Google admin/non-admin thật.                                                                |
| B: media             | Direct upload, xác minh bytes/MIME/kích thước, thư viện, chống xóa tham chiếu. Blob SDK thật upload/read/delete đã đạt.                             | UAT token/direct upload/finish/xóa tham chiếu qua admin UI; integration admin hiện mock provider. |
| B: widget/storefront | Calendar/giờ tiếng Việt tùy biến, popup/bottom sheet, form nhóm, presets, quantity, menu và motion.                                                 | Shop duyệt Preview desktop/mobile; copy/ảnh thật.                                                 |
| C: release           | Checks, screenshots, UAT suite, readiness/runbook/rollback.                                                                                         | Dịch vụ thật, tài khoản, UAT, tên miền/OAuth production và quyết định mở shop.                    |

## Đầu vào còn thiếu

- UAT Google admin/non-admin và upload Blob qua giao diện. Neon test/Preview, Clerk development và Blob đã kết nối bằng CLI; kiểm tra Blob SDK đã đạt.
- Một tài khoản Google non-admin và browser storageStates để chạy UAT đầy đủ. Admin `buibao1997@gmail.com` đã có Clerk user ID trong allowlist server; không dùng email làm quyền server.
- Catalog/giá/ảnh/logo thật được phép bán, contact/social thật và chính sách đầy đủ.
- DB/Blob/Clerk production riêng, tên miền/DNS và Google OAuth production; kiểm tra gói Vercel phù hợp thương mại/chi phí trước đăng ký trả phí.
- Nghiệm thu giao diện widget và full flow trên Preview thật. Chốt lịch phase 2 sau nền tảng milestone A.

`SHOP_LIVE=false`. Không thay bằng chứng mock/local bằng tuyên bố đã kết nối dịch vụ thật. Xem docs/phase-2/VERIFICATION_PHASE2.md.

Lighthouse local median mobile phase 2 là 83 (baseline 85); mục tiêu ≥90 còn tuning trên deployment. Payload và JS đã giảm, nhưng chưa xác nhận cải thiện LCP/điểm. Xem docs/phase-2/PERFORMANCE.md. Dev tooling còn 9 audit advisories; production dependencies audit 0.

## Phase 3 — checkpoint A/B

Nhánh feat/phase3 từ e53bbbf: đã sửa cấu hình Hoa Ý/hiển thị tổng/nhãn trạng thái/field error và dựng Home/detail, sidebar/bảng-thẻ/chi tiết đơn/ProductEditor mẫu. Preview có dữ liệu test riêng; chờ shop duyệt checkpoint B trước áp dụng rộng.

Revision B theo feedback: bỏ caption hero chồng lệch, đồng nhất card 4:5, thêm submenu sản phẩm Hoa Thời/Tâm/Ý và nâng fade/scroll/hover/click với reduced motion. Chờ duyệt bản Preview cập nhật; không coi feedback sửa mẫu là nghiệm thu để tự mở rộng C/D/E.

Còn C/D/E: tách ArticleEditor/SettingsEditor; dashboard/media UX; áp dụng listing/dịch vụ/giỏ/checkout/blog/contact/policy/widget; full Google admin/non-admin/Blob UI UAT, Safari/iOS thật, Lighthouse phase 3, ảnh/logo/copy thật và production readiness. Xem docs/phase-3/PHASE3_PLAN.md và VERIFICATION_PHASE3.md. Không đánh dấu phase 3 hoàn tất khi chỉ có mẫu được triển khai.

## Ngoài scope phase 3

Thanh toán, tài khoản khách, tìm kiếm công khai, upload ảnh khách, CMS/page builder, gói Hoa Thời/lịch tự động/gia hạn, tồn kho/theo dõi giao, thông báo tự động và reply/like/rating.
