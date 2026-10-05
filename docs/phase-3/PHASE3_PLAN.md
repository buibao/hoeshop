# Phase 3 — Store và admin Hòe

Baseline e53bbbfc2d0452ce9c9844ed9d6df087d01a8814; nhánh feat/phase3. Đặc tả: Hoe_Phase2_Review_Phase3_UI_Draft.md và plan được chủ shop xác nhận trong phiên. Ngày bắt đầu 05/10/2026, chưa có deadline.

Store: Foglia + Orphic, ảnh lớn, nền ivory và chi tiết lãng mạn; motion vừa phải. Admin: Untitled UI làm reference, không mua kit. Giữ Tailwind/Preflight, React-Bootstrap, Motion, Lora, Be Vietnam Pro và màu Hòe. Dùng ảnh test hiện có cho Preview.

| Milestone           | Trạng thái và đầu ra                                                                                                                                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — Sửa hành vi     | R1: editor Hoa Ý có default/priced shape, server chặn publish fixed/range thiếu shape, draft vẫn lưu được. R2: tổng dùng totalLabel. R3: nhãn trạng thái tập trung. R4: field errors/summary/focus, giữ dữ liệu khi lỗi và kiểm tra version. Kiểm thử trong VERIFICATION_PHASE3. |
| B — Thiết kế mẫu    | Home, chi tiết sản phẩm, danh sách/chi tiết đơn, ProductEditor, tokens/states và route /xem-thu/giao-dien. Chờ shop duyệt Preview desktop/mobile.                                                                                                                                |
| C — Admin vận hành  | Sau duyệt B: tách ArticleEditor/SettingsEditor, hoàn thiện dashboard/media/feedback và UAT Google admin/non-admin/Blob qua UI.                                                                                                                                                   |
| D — Store và motion | Sau duyệt B: áp dụng rộng cho listing, dịch vụ, giỏ, checkout, blog, giới thiệu, liên hệ, chính sách và theme widget.                                                                                                                                                            |
| E — Nghiệm thu      | Full regression trên phiên bản cuối, UAT thật, Safari/iOS, Lighthouse trước–sau và tài liệu release.                                                                                                                                                                             |

## Ràng buộc dữ liệu

- Không tự gán hình thức cho sản phẩm cũ, không tự đưa mọi hình thức vào giá. Server chỉ normalize khoảng trắng khi shop chủ động lưu; snapshot lịch sử giữ nguyên.
- Giữ payload API public/admin, receipt, giỏ, transaction, idempotency, rate limit, audit và edit_version. Danh sách đơn admin bổ sung serviceTypes, chỉ phục vụ vùng được cấp quyền; truy vấn nhóm trên một trang, không N+1.
- Không cần migration cho A/B. Không seed lại Preview hoặc sửa dữ liệu shop. Integration ghi/dọn bản ghi thuộc run trên Neon hoe-test có marker test.
- Preview dùng Neon hoe-preview và Clerk/Blob đã kết nối. Env cấu hình riêng feat/phase3: DB_ENV=preview, DATA_ADAPTER=postgres, CONTENT_MODE=test, SHOP_LIVE=false, SITE_URL alias nhánh, RATE_LIMIT_SECRET và ADMIN_CLERK_USER_IDS phía server.
- /xem-thu/giao-dien chỉ chạy CONTENT_MODE=test, 404 trên Vercel production; admin mẫu cố định, không đọc khách/đơn thật, không gọi API lưu. Admin thật vẫn kiểm tra Clerk session + user ID allowlist.

## Checkpoint B

Shop duyệt Home desktop/mobile, trang mẫu Hoa Ý, bảng/thẻ và chi tiết đơn mẫu, editor sản phẩm cùng các trạng thái lỗi/focus. Ghi phản hồi thành thay đổi cụ thể trong UI_SPEC; chỉ áp dụng rộng sau duyệt. Không coi lựa chọn reference là nghiệm thu giao diện đã triển khai.

Không mở production, mua dịch vụ trả phí hoặc thêm payment/login khách/public search/subscription trong phase UI này. Rollback A/B bằng deployment phase 2 cùng schema; không dùng lại Sheets adapter hoặc migration phá dữ liệu.
