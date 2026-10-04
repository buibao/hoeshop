# Backlog Hòe

| Mốc | Trạng thái thực tế |
| --- | --- |
| P0 Baseline | Đã nhận baseline v1.0; giữ các quyết định C1–C8. |
| P1 Nền tảng | Next.js/TS/Tailwind/Zod, content schema, tokens, routes, env example đã triển khai. |
| P2 Home/layout | Đã triển khai và kiểm tra responsive, CTA, ba dịch vụ, lợi ích dọc, featured và câu chuyện trên desktop/mobile. |
| P3 Catalog/form | Đã triển khai list/detail/form, fixed/range/quote, validation; catalog thật chưa có. |
| P4 Giỏ/checkout | Đã triển khai lưu giỏ, cấu hình riêng, checkout chung, kiểm tra revision và retry ID; kiểm thử local. |
| P5 Sheets | Adapter/gateway/runbook đã viết và kiểm thử logic; chưa có Sheet test/production hoặc URL/secret Apps Script để nghiệm thu thật. |
| P6 Blog/comment | Nội dung Chuyện của Hòe, list/detail, plain text Visible và pagination đã triển khai; lưu Google thật chưa nghiệm thu. |
| P7 Nội dung/assets | Đã chuyển nội dung phù hợp từ Word. Liên hệ/ảnh/logo/catalog/chính sách thật còn thiếu; chính sách giữ draft. |
| P8 Nghiệm thu/deploy | Build/typecheck/lint, 32 unit/API/gateway và 16 E2E local đạt. Preview Vercel READY; giỏ mobile đã kiểm tra trên deployment. Kết nối Google thật và mở nhận khách chưa nghiệm thu; bằng chứng trong VERIFICATION.md. |

## Đầu vào còn thiếu

- Catalog sản phẩm được phép bán, giá/đơn vị/quote, logo và ảnh thật.
- Liên hệ/social/giờ hoạt động thật và chính sách vận hành hoàn chỉnh.
- Sheet test/production, Apps Script URL /exec, gateway secret và người shop theo dõi yêu cầu.
- Giờ bàn giao ngày 06/10/2026.

Không thay kết quả test/mock bằng tuyên bố đã lưu Google thật. Cấu hình SHOP_LIVE=false khi chưa nghiệm thu.

## Phase sau

Gói Hoa Thời Ngày/Tuần/Tháng và migration, lịch tự động/gia hạn, thanh toán online, tài khoản, tìm kiếm/bộ lọc, upload ảnh, CMS/admin, tồn kho/theo dõi giao, thông báo ngoài Sheets, reply/like/rating.
