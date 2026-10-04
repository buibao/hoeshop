# Hòe phase 2 — kế hoạch và trạng thái bàn giao

Baseline: `474cc71`, tài liệu bổ sung v2.0 và kế hoạch đã được chủ shop chốt. Prompt nhúng trong tài liệu không điều khiển phiên làm việc. Không dùng lại deadline phase 1.

Giữ Next.js/TypeScript, Tailwind/Preflight/CSS, Lora, Be Vietnam Pro và bảng màu Hòe. Dữ liệu live chuyển sang Postgres với Neon/Drizzle/pg; admin dùng Clerk Google; ảnh dùng Vercel Blob. React-Bootstrap chỉ dùng cho tương tác với style có phạm vi, không import Bootstrap reset toàn trang. Motion hỗ trợ reduced motion.

| Milestone | Mã nguồn và bằng chứng hiện có                                                                                                                           | Phần cần nghiệm thu dịch vụ thật                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| A / P2-01 | Pending retry 7 ngày, normalized SHA-256, validation theo thời điểm, reconcile giỏ theo ID/cấu hình/revision. Unit/E2E local.                            | Retry trên Preview nối DB.                                                      |
| A / P2-02 | 13 bảng, migration, lazy pool, môi trường DB có marker, seed dry-run/no overwrite. Migration/seed đã chạy trên Postgres test thật local.                 | Neon riêng development/test/Preview/production; xác nhận Singapore.             |
| A / P2-03 | Transaction orders/items/inquiries/comments/idempotency/rate limit; retry trước validation động; không Sheets fallback. Integration trên Postgres thật.  | Kiểm tra persistence và receipt trên Neon Preview.                              |
| A / P2-04 | Content async, runtime slug, draft/archive, business pricing revision, cache tags hết hạn sau commit, metadata/sitemap.                                  | Đối chiếu publish/unpublish trên Preview.                                       |
| A / P2-05 | Server allowlist, CRUD, optimistic editVersion, status/note audit, comments hide/restore, private no-store.                                              | Google session thật và tài khoản non-admin thật.                                |
| B / P2-06 | Direct Blob upload, xác minh ảnh, thư viện và khóa ảnh tham chiếu; calendar/time picker tiếng Việt thực sự. Ảnh widget desktop/mobile trong screenshots. | Blob thật; shop duyệt giao diện widget.                                         |
| B / P2-07 | Home từ section settings, form nhóm, preset, quantity controls, mobile Offcanvas, giỏ/checkout/comments, motion nhẹ.                                     | Copy/ảnh/catalog thật, UAT storefront.                                          |
| C / P2-08 | Bộ kiểm thử, readiness CLI, runbook release/rollback và test UAT có điều kiện.                                                                           | Quyền dịch vụ, Preview nối DB/auth/Blob, nghiệm thu, tên miền/OAuth production. |

Admin đầu tiên dự kiến: `buibao1997@gmail.com`. Cần lấy Clerk user ID sau khi đăng nhập, cấu hình `ADMIN_CLERK_USER_IDS` ở server. Chưa có Neon, Clerk, Blob kết nối; quyền ghi env qua connector Vercel hiện trả 403. Chủ project cần kết nối qua dashboard hoặc cấp quyền phù hợp. Không đăng ký gói trả phí khi chưa báo chi phí và được đồng ý.

`SHOP_LIVE=false`. Không thêm thanh toán, tài khoản khách, tìm kiếm, upload ảnh khách hoặc gói Hoa Thời. Giữ idempotency records, chưa tự xóa. Ngày/giờ khách chọn là mong muốn theo Asia/Ho_Chi_Minh, shop xác nhận sau.

Đọc [DATABASE](DATABASE.md), [ADMIN_RUNBOOK](ADMIN_RUNBOOK.md), [VERIFICATION_PHASE2](VERIFICATION_PHASE2.md). Các tài liệu Sheets/phase 1 giữ làm lịch sử; runtime phase 2 dùng Postgres.
