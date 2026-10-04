# Vận hành admin, media và Preview

## Thiết lập do chủ project thực hiện

1. Kết nối Neon, Clerk và Blob trong Vercel dashboard cho project `hoeshop`. Chưa có dịch vụ kết nối; connector ghi env đang trả 403. Ưu tiên gói miễn phí cho test/Preview, kiểm tra chi phí trước khi nâng gói. [Vercel storage](https://vercel.com/docs/storage).
2. Đặt URL DB đúng môi trường, `DB_ENV=preview`, `DATA_ADAPTER=postgres`, `CONTENT_MODE=test`, `SHOP_LIVE=false`, `RATE_LIMIT_SECRET` ngẫu nhiên. Migration/seed dùng direct URL ở máy người vận hành. Preview dùng DB/Blob test riêng.
3. Tạo Clerk development instance, bật Google, tắt các phương thức không cần. Dùng chế độ hạn chế đăng ký/invite tài khoản quản trị trong dashboard. Không có route đăng ký admin trong ứng dụng; SignIn tắt signup. [Clerk environments](https://clerk.com/docs/guides/development/managing-environments).
4. Mời/tạo `buibao1997@gmail.com`, lấy user ID dạng `user_...`, đặt `ADMIN_CLERK_USER_IDS` và hai Clerk keys. Email không cấp quyền; server kiểm tra session và allowlist ID cho mọi read/mutation/upload.
5. Đặt `BLOB_READ_WRITE_TOKEN` test. Redeploy Preview sau thay đổi env. Đăng nhập `/dang-nhap`, xác nhận `/admin` đọc đúng DB marker Preview, shop vẫn đóng.

Clerk chỉ tải ở admin/signin; storefront không yêu cầu tài khoản. Guest API trả 401, signed-in non-admin 403. Admin/draft noindex, private response no-store. Không public buyer hay internalNote trong DTO.

## Quản lý nội dung và yêu cầu

- `/admin`: số yêu cầu mới, môi trường, trạng thái shop. Các danh sách có phân trang 50 dòng; đơn/tư vấn có lọc trạng thái.
- Đơn: `received → contacted → confirmed → completed`, hoặc `cancelled`. Tư vấn: `received → contacted → resolved`, hoặc `cancelled`. Shop chọn trạng thái và note; app không tự gửi thông báo. Audit ghi actor/thay đổi và note trước/sau.
- Sản phẩm: ID ổn định, slug unique, price/options và nội dung. Chỉ đổi nghiệp vụ/giá/options làm đổi pricing_revision; ảnh/mô tả không làm giỏ phải chấp nhận lại giá.
- Bài/chính sách: Markdown textarea + preview an toàn, raw HTML không chạy. Draft chỉ xem trong admin. Publish slug mới hoạt động runtime; archive trả 404 public và giữ lịch sử. Không có xóa cứng.
- Home/site/assets/service: section settings theo schema cố định, không page builder. Không dùng liên hệ/social giả hay chính sách thiếu nội dung để mở production.
- Comment: hide/restore, danh sách public đọc mới không cache. Retry comment đã hidden không đưa comment trở lại public.
- Lưu với editVersion cũ trả 409. Tải lại nội dung, đối chiếu thay đổi rồi sửa; không tự overwrite người khác.

## Ảnh

JPEG/PNG/WebP/AVIF tối đa 5 MiB, không animation; server giới hạn xử lý 40 megapixel để tránh ảnh nén gây quá tải. Chọn alt rõ nghĩa rồi upload trực tiếp bằng token được cấp sau kiểm tra quyền. Server xác minh Blob ownership, bytes, MIME thực tế, decode và kích thước trước khi đưa vào thư viện. Metadata chưa verified không được dùng trong nội dung. Upload qua client vì [Functions request body giới hạn 4,5 MB](https://vercel.com/docs/functions/limitations).

Ảnh tham chiếu bởi sản phẩm/bài/chính sách/service/settings, kể cả archived, trả 409 kèm nơi dùng khi xóa. Thay/gỡ tham chiếu trước. Ảnh không dùng vẫn cần bấm xác nhận xóa. Nếu mạng mất sau upload trước finish, kiểm tra Blob orphan bằng dashboard; chỉ dọn file sau khi đối chiếu không có media/nội dung tham chiếu. Blob deletion và DB transaction không phải distributed transaction: nếu Blob xóa thành công nhưng DB commit lỗi, người vận hành kiểm tra Blob và gỡ media orphan trong maintenance có backup, không báo xóa thành công khi API lỗi.

## Widget preview và UAT

`/xem-thu/widgets` chỉ dùng local/Preview, noindex và 404 production. Calendar tiếng Việt, tuần từ thứ Hai, nhập dd/MM/yyyy, hôm nay/xóa, khóa ngày quá khứ cho yêu cầu mới. Giờ 00–23/phút 00–59, xác nhận/hủy/xóa. Desktop popup, mobile dưới 768px bottom sheet. Alt+ArrowDown mở, Escape đóng, focus trả về field, list giờ/phút dùng Arrow/Home/End. Ngày/giờ là mong muốn, shop xác nhận sau.

Ảnh desktop/mobile và trạng thái trống/chọn/lỗi/disabled/focus ở [screenshots](screenshots). Shop cần trực tiếp duyệt widget trên Preview trước khi chốt milestone B.

UAT Clerk/Blob thật không thay bằng mock. Lưu Playwright storageState của một admin Google và một Google non-admin vào `.local` (file chứa session, không commit). Cấu hình:

```powershell
$env:UAT_BASE_URL = '<Preview URL đã kết nối dịch vụ>'
$env:UAT_ADMIN_STATE = 'D:\hoeshop\.local\admin-state.json'
$env:UAT_NON_ADMIN_STATE = 'D:\hoeshop\.local\non-admin-state.json'
npm run test:uat
```

Bộ UAT yêu cầu DB môi trường test/preview và SHOP_LIVE=false, sẽ tạo rồi archive nội dung UAT và xóa ảnh không dùng. Dùng Preview có quyền truy cập hoặc cấu hình protection bypass trong browser state. Thiếu states/env dừng rõ ràng; không fake auth trên deployment. Kiểm tra admin/non-admin, stale edit, publish slug không build, comment hide/restore và Blob thật.

## Release

Chưa mở production: thiếu catalog/giá/ảnh/logo/contact/chính sách thật, dịch vụ và UAT. Production dùng DB, Blob và Clerk production riêng; cần tên miền/DNS và Google OAuth credentials riêng theo [Clerk production](https://clerk.com/docs/guides/development/deployment/production). Kiểm tra [Vercel plan cho mục đích thương mại](https://vercel.com/docs/plans/hobby) và chi phí hiện hành; không giả định shop production dùng Hobby miễn phí.

Backup → migration tương thích → deploy build production mới (`CONTENT_MODE=live`) → smoke/DB assertions/UAT → `db:readiness` → chủ shop nghiệm thu → mở SHOP_LIVE. Không promote artifact chứa fixtures. Rollback về app phase 2 tương thích schema và đóng shop khi có lỗi tiếp nhận; không đổi sang Sheets/mock.
