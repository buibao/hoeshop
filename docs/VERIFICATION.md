# Kết quả kiểm tra

## Phạm vi bằng chứng

Kiểm thử local bằng dữ liệu fixtures, mock repository và mã Apps Script chạy trong Node VM. Không có Sheet hoặc Apps Script thật đã được cấu hình trong môi trường phát triển; các kết quả này không nghiệm thu vận hành Google Sheets.

- Production build với CONTENT_MODE=live đã thành công.
- Unit/API/gateway: 31 kiểm thử đạt, gồm chữ ký, lock, idempotency, snapshot, rate limit, ẩn bình luận và chống công thức.
- Browser Home: tải được nội dung, không error overlay, không lỗi JavaScript, không tràn ngang ở desktop.
- Playwright desktop/mobile: 16/16 kiểm thử đạt. Gồm giỏ trộn và chỉnh sửa, checkout, mất response sau lưu, retry cùng ID, đổi payload tạo ID mới, tư vấn riêng, plain text bình luận, draft 404, focus và ảnh/responsive.
- npm audit --omit=dev: không có cảnh báo bảo mật production.
- npm audit đầy đủ còn cảnh báo braces 3.0.3 và chuỗi phụ thuộc fast-glob/micromatch của ESLint config. Registry hiện chưa có bản braces đã vá. Không hạ Next.js để xử lý cảnh báo trong công cụ lint; không dùng pattern glob từ khách.

## Chưa nghiệm thu

Kết nối Apps Script thật, quota Google, đối chiếu dòng trong Sheet test/production, quyền shop, ẩn comment trong Sheet thật, deployment end-to-end và mở nhận khách. Thiếu dữ liệu kinh doanh thật và chính sách hoàn chỉnh.

## Deployment

Đang kiểm tra kết nối Vercel. CLI có token cũ không hợp lệ; connector đọc được dự án mẫu hoahoe. Website mới cần project Next.js riêng, giữ nguyên project mẫu Vite.
