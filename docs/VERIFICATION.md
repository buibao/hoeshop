# Kết quả kiểm tra

## Phạm vi bằng chứng

Kiểm thử local bằng dữ liệu fixtures, mock repository và mã Apps Script chạy trong Node VM. Không có Sheet hoặc Apps Script thật đã được cấu hình trong môi trường phát triển; các kết quả này không nghiệm thu vận hành Google Sheets.

- Production build với CONTENT_MODE=live đã thành công.
- Unit/API/gateway: 32 kiểm thử đạt, gồm chữ ký, lock, idempotency, snapshot, rate limit, ẩn bình luận, chống công thức và tách content Preview/production.
- Cài sạch bằng npm 11.6.2 đã đạt; lockfile được tạo trong thư mục sạch và kiểm tra `npm ci` cho Linux x64, tránh thiếu optional dependencies khi chuyển từ Windows.
- Browser Home: tải được nội dung, không error overlay, không lỗi JavaScript, không tràn ngang ở desktop.
- Playwright desktop/mobile: 16/16 kiểm thử đạt. Gồm giỏ trộn và chỉnh sửa, checkout, mất response sau lưu, retry cùng ID, đổi payload tạo ID mới, tư vấn riêng, plain text bình luận, draft 404, focus và ảnh/responsive.
- npm audit --omit=dev: không có cảnh báo bảo mật production.
- npm audit đầy đủ còn cảnh báo braces 3.0.3 và chuỗi phụ thuộc fast-glob/micromatch của ESLint config. Registry hiện chưa có bản braces đã vá. Không hạ Next.js để xử lý cảnh báo trong công cụ lint; không dùng pattern glob từ khách.

## Chưa nghiệm thu

Kết nối Apps Script thật, quota Google, đối chiếu dòng trong Sheet test/production, quyền shop, ẩn comment trong Sheet thật, deployment end-to-end và mở nhận khách. Thiếu dữ liệu kinh doanh thật và chính sách hoàn chỉnh.

## Deployment

Đã tạo project Next.js riêng `hoeshop`, kết nối repository `buibao/hoeshop`; giữ nguyên project mẫu Vite `hoahoe`. Preview mặc định dùng fixtures, production mặc định dùng content live và SHOP_LIVE=false. Mock bị từ chối trên deployment.

Ngày kiểm tra: 05/10/2026, Asia/Ho_Chi_Minh. Commit ứng dụng: `9065fd03f710718850011fddcfb03d017c61da60`.

- Preview **READY**: https://hoeshop-cadjx9wim-buibaos-projects.vercel.app — deployment `dpl_BY4Eq7YpxS1moHPT4DusyXwKgtPQ`.
- Production giữ cửa nhận khách đóng, **READY**: https://hoeshop-3oc5wcy44-buibaos-projects.vercel.app. Sản phẩm test và ảnh `/images/preview/bouquet.jpg` đều trả 404.
- Browser Preview: banner test đúng, noindex/nofollow, tất cả ảnh Home tải được, không tràn ngang desktop.
- Playwright chạy trên Preview thật: bấm thêm Hoa Tâm, xem giỏ, reload giữ cấu hình; mobile 390×844 không tràn ngang, không lỗi JavaScript. Ảnh kiểm tra local tại `.local/preview-mobile-cart.png` (không commit).
- GET comments và POST inquiry hợp lệ trên Preview trả 503 NOT_CONFIGURED; không báo received khi thiếu gateway. Draft trả 404.
- Build, typecheck, lint và 32 unit/API/gateway đạt lại sau cài sạch. 16 E2E desktop/mobile đã đạt trên local.

Preview có Vercel deployment protection; dùng quyền project hoặc link chia sẻ tạm được tạo qua connector. Link có token không lưu trong repository.

Connector Vercel trả 403 khi tạo environment variables. Chưa có URL/secret Apps Script và chưa cấu hình Sheet test/production; API trên deployment phải trả 503, không phát mã tiếp nhận giả. Người có quyền quản lý project cần cấu hình theo SHEETS_RUNBOOK trước nghiệm thu Google thật.
