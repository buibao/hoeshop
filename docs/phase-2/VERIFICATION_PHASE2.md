# Bằng chứng phase 2

Ngày kiểm tra: 05/10/2026 (Asia/Ho_Chi_Minh). Baseline `474cc71`; branch `feat/phase2`. Không có deadline phase 2. SHOP_LIVE=false.

| Kiểm tra                  | Kết quả / giới hạn                                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build                     | Next production build đã đạt khi không có DB: lazy connection, dynamic public/admin routes; sitemap đọc runtime.                                   |
| Typecheck / lint          | Đạt.                                                                                                                                               |
| Vitest unit/API           | 51/51 đạt: giá, cart keys/reconcile, schema, ngày Việt Nam, pending expiry/fingerprint, signature và API errors.                                   |
| Postgres integration      | 13/13 đạt trên Postgres 18.4 UTF8 local, DB test riêng.                                                                                            |
| Playwright public         | 34/34 đạt: desktop/mobile, mixed cart, reload pending retry, hai tab, form/comment, draft, guest admin và widget. Adapter mock local có nhãn test. |
| Browser → API → DB        | Checkout local với adapter Postgres trả 201 received; truy vấn order/items xác nhận một snapshot, cleanup dữ liệu test. Không pageerror.           |
| Readiness                 | Cố ý chạy DB test: ready=false, exit 1 vì test catalog, thiếu ảnh/contact/policies/auth/media và chưa production.                                  |
| Google / Neon / Blob thật | Chưa kết nối, chưa nghiệm thu. UAT suite có sẵn nhưng chưa chạy; không coi test mock Clerk/Blob là bằng chứng nhà cung cấp thật.                   |
| Preview                   | Đang tạo bản xem thử test; sẽ bổ sung deployment URL và smoke khi READY.                                                                           |
| Lighthouse/bundle         | Đang đo baseline/phase 2 cùng môi trường local production fixture. Chưa cam kết điểm trên Preview Neon thật.                                       |

Postgres integration bao gồm 12 concurrent cùng ID chỉ một đơn, khác hash 409, trigger gây rollback không còn order/items/idempotency/rate, retry sau response mất/restart và qua ngày/catalog archive/shop đóng, rate 5/6 với retry miễn phí, plain text formula string, 22 comments phân trang tuple/hide/restore, optimistic edit và pricing revision, seed không overwrite. Admin API integration dùng Clerk session và Blob deletion mock với DB thật, kiểm tra 401/403, stale 409, publish content và FK/reference deletion 409.

Widget được thử chuột/chạm/bàn phím tại 360/390/768/1024/1440px; reduced motion, focus trap, Escape/return focus, hôm nay/xóa/hủy, canonical date/time, ngày không tồn tại và giờ/phút biên. Calendar dùng DayPicker locale vi, tuần thứ Hai; không native date/time input. Test mobile iPhone 13 chạy Chromium emulation, chưa thay thử Safari/iOS thật.

## Ảnh nghiệm thu widget

| Desktop 1440px                                                | Mobile 390px                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------- |
| [Calendar đã chọn](screenshots/1440-calendar-selected.png)    | [Calendar bottom sheet](screenshots/390-calendar-selected.png) |
| [Giờ đã chọn](screenshots/1440-time-selected.png)             | [Giờ bottom sheet](screenshots/390-time-selected.png)          |
| [Trống/lỗi/disabled/focus](screenshots/1440-states-focus.png) | [Trống/lỗi/disabled/focus](screenshots/390-states-focus.png)   |

Ảnh là giao diện fixture test local, không phải ảnh/giá bán. Cần shop thử trực tiếp Preview trước chốt milestone B.

## Các gate còn mở

Kết nối Neon/Clerk/Blob test, cấu hình env đúng môi trường, lấy admin user ID, chạy UAT trên deployment và đối chiếu DB. Có quyền đọc/deploy Vercel nhưng thao tác ghi env/integrations trả 403; CLI chưa đăng nhập. Không tự mua dịch vụ trả phí. Production cần dữ liệu thật, tên miền/OAuth và nghiệm thu; chưa mở nhận khách.

Đọc [ADMIN_RUNBOOK](ADMIN_RUNBOOK.md) cho cấu hình, UAT session states và release/rollback. Lịch sử phase 1 không được coi là nghiệm thu Postgres/Clerk/Blob phase 2.
