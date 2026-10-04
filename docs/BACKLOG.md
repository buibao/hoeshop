# Backlog Hòe

Phase 1 baseline giữ trong REQUIREMENTS/VERIFICATION.md; adapter Sheets và Apps Script là lịch sử. Phase 2 bắt đầu từ `474cc71`, runtime dùng Postgres. Không dùng lại deadline 06/10/2026.

| Mốc phase 2          | Đã triển khai                                                                                                  | Chưa nghiệm thu                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| A: retry/giỏ         | Metadata pending 7 ngày, normalize/fingerprint, committed retry trước validation động, reconcile giỏ mới nhất. | Retry trên Neon Preview thật.                                                  |
| A: DB                | 13 bảng/migration, lazy pg, marker môi trường, seed dry-run/no overwrite, constraints/index.                   | Neon các môi trường và quyền dashboard.                                        |
| A: dữ liệu phát sinh | Transaction, idempotency, snapshot/items, shared rate buckets, comment cursor. 13 integration Postgres local.  | Persistence/rate/API DB assertions trên Preview.                               |
| A: content/admin     | Async content/cache, runtime slug, CRUD/archive, status/note audit, allowlist và stale edit.                   | Clerk Google admin/non-admin thật.                                             |
| B: media             | Direct upload, xác minh bytes/MIME/kích thước, thư viện, chống xóa tham chiếu.                                 | Blob thật; integration hiện mock nhà cung cấp.                                 |
| B: widget/storefront | Calendar/giờ tiếng Việt tùy biến, popup/bottom sheet, form nhóm, presets, quantity, menu và motion.            | Shop duyệt Preview desktop/mobile; copy/ảnh thật.                              |
| C: release           | Checks, screenshots, UAT suite, readiness/runbook/rollback.                                                    | Dịch vụ thật, tài khoản, UAT, tên miền/OAuth production và quyết định mở shop. |

## Đầu vào còn thiếu

- Neon, Clerk development Google và Blob test kết nối project Vercel hoeshop. Connector env trả 403, cần chủ project thiết lập hoặc cấp quyền.
- Clerk user ID của `buibao1997@gmail.com` và một tài khoản non-admin để UAT; không dùng email làm quyền server.
- Catalog/giá/ảnh/logo thật được phép bán, contact/social thật và chính sách đầy đủ.
- DB/Blob/Clerk production riêng, tên miền/DNS và Google OAuth production; kiểm tra gói Vercel phù hợp thương mại/chi phí trước đăng ký trả phí.
- Nghiệm thu giao diện widget và full flow trên Preview thật. Chốt lịch phase 2 sau nền tảng milestone A.

`SHOP_LIVE=false`. Không thay bằng chứng mock/local bằng tuyên bố đã kết nối dịch vụ thật. Xem docs/phase-2/VERIFICATION_PHASE2.md.

Lighthouse local median mobile phase 2 là 83 (baseline 85); mục tiêu ≥90 còn tuning trên deployment. Payload và JS đã giảm, nhưng chưa xác nhận cải thiện LCP/điểm. Xem docs/phase-2/PERFORMANCE.md. Dev tooling còn 9 audit advisories; production dependencies audit 0.

## Ngoài scope

Thanh toán, tài khoản khách, tìm kiếm công khai, upload ảnh khách, CMS/page builder, gói Hoa Thời/lịch tự động/gia hạn, tồn kho/theo dõi giao, thông báo tự động và reply/like/rating.
