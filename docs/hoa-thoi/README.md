# Hoa Thời — calendar nhận hoa theo combo

Triển khai spec cập nhật v5 ngày 10/10/2026 trên branch `feedbacks`, HEAD nền `62bd311acecc26ee86a8fde3f6dc4e723cc4c0b9`. Chỉ bàn giao local; chưa commit, push, tạo PR hoặc deploy.

## Trải nghiệm hiện tại

Trang `/dich-vu/hoa-thoi`: giới thiệu (`service-page-top`) → ba gợi ý (`ht-recommendations`) → mẫu tham khảo (`ht-service-section`) → form gói/calendar (`ht-package-section`). Gợi ý lấy từ Admin, giữ chính xác giá `/lần` hoặc `/tháng`. Bấm gợi ý điền loại gói và số bó, giữ combo/bản nháp/contact rồi cuộn đến thiết lập gói, không điền ngày hộ khách. Matching giá theo số bó mỗi chu kỳ, độc lập số combo.

Khách chọn Tuần/Tháng, N bó mỗi chu kỳ và C combo. Calendar multi-select dùng DayPicker hiện có, ngày quá khứ là ô trống. Mỗi ngày nhận 1 bó; cần đúng N ngày trong từng chu kỳ, tổng N×C. Tuần từ Thứ Hai–Chủ nhật; tháng từ ngày 1–cuối tháng. Lượt này thay thế quy ước 4 tuần/tháng và chọn thứ ưu tiên trước đó.

Ngày đầu xác định anchor. Calendar mở C chu kỳ liên tiếp, chặn ngày ngoài vùng hoặc chu kỳ đầy quota, giữ ngày đã chọn để bỏ. Kiểm tra khả thi trước khi nhận ngày đầu, gồm Chủ nhật không đủ ngày và tháng 02 không đủ quota 31 bó. Bỏ hết ngày chu kỳ đầu vẫn giữ anchor khi còn ngày chu kỳ sau. Xóa toàn bộ hoặc “Chọn lại thời gian nhận” mới reset anchor.

Đổi N/C giữ các ngày đã chọn. Quota vượt và ngày ngoài vùng mới được ghi rõ trong tóm tắt để khách sửa; không tự cắt hoặc dịch lịch. Giữ bản nháp Tuần/Tháng độc lập. Form chia calendar/tóm tắt khi đủ chiều rộng; dùng container query để hoạt động cả trên trang dịch vụ, form mẫu hẹp và sửa giỏ. Mobile 7 cột, vùng bấm 44px, không overflow ở 360px. Font Cormorant Garamond/TeX Gyre Termes, tokens ivory/blush/accent và shell Store giữ nguyên.

## Dữ liệu và các luồng liên quan

Recurrence mới dùng đúng shape spec: `version:5`, `period`, `bouquetsPerPeriod`, `comboCount`, `startPeriod`, `deliveryDates`. Dates unique và sorted; strict validation kiểm tra ngày thật, anchor, quota và chu kỳ liên tiếp. Server kiểm tra no-past theo Asia/Ho_Chi_Minh lúc ghi mới, tự tạo groups, endPeriod, total và snapshot giá. Không có unresolved ngày cho lịch mới; không tạo delivery job hoặc tính thanh toán định kỳ.

Một lượt local cũ cũng từng dùng `version:5` cho lịch mẫu. Reader phân biệt hai shape strict bằng các field lịch; không đổi nghĩa dữ liệu lịch sử. Giữ v1–v6 cũ khi đọc, ghi rõ “Cấu hình theo phiên bản cũ”. Yêu cầu mới phải dùng calendar. Giỏ cũ không bị drop; checkout hướng khách mở sửa calendar, dates để trống đến khi khách chọn và lưu. Replay receipt chạy trước kiểm tra phiên bản/ngày mới.

Controls dùng chung ở InquiryForm, ProductForm và sửa giỏ. Quote vẫn quote, quantity giỏ không thay số combo. Giỏ/checkout/Admin trình bày các ngày cụ thể theo từng chu kỳ. Receipt giữ snapshot server sau khi giỏ được xóa. Retry giữ requestId cho cùng payload; đổi dates/N/C tạo fingerprint mới. Body Hoa Thời được trống khi lịch và contact hợp lệ; Tâm/Ý/tư vấn chung giữ quy tắc cũ.

Admin → Dịch vụ → Hoa Thời chỉnh số bó/chu kỳ, period, giá/đơn vị, enabled và reorder. Adapter đọc `timesPerPeriod` cũ thành `bouquetsPerPeriod`; không nhận cả hai nguồn count cùng lúc, không ghi đè giá/ID. Save dùng auth/editVersion/audit/cache hiện có. Tắt gợi ý không cấm gói tùy chỉnh; yêu cầu mới không có giá khớp sẽ chờ báo giá. Snapshot lịch sử không đổi theo content mới.

## Review local

**http://localhost:3100/dich-vu/hoa-thoi** — fixture/mock, không dùng DB Preview hoặc Clerk Preview.

```powershell
npm run dev:hoa-thoi
# Hoặc bản build đã dùng để kiểm tra:
node scripts/local-hoa-thoi.mjs --build --webpack
node scripts/local-hoa-thoi.mjs --serve --port 3100
```

Launcher giữ `.env` nguyên trạng và truyền chuỗi rỗng thật cho DB/Clerk/Blob trong process con. Cần cách này vì PowerShell xóa biến khi gán `''`, khiến Next có thể nạp lại profile Preview trong `.env.local`. Output build `.next-feedback` tách khỏi dev server khác. Không thay deployment config.

## Bằng chứng kiểm tra

- `validate:content`, lint, typecheck và build Webpack: pass. Lint còn 4 warning có sẵn ngoài Hoa Thời.
- 80 unit/API Hoa Thời pass, gồm 37 kiểm tra lịch mới, legacy, giá, canonicalization và replay.
- 5 kiểm tra Postgres Hoa Thời pass trên DB TEST riêng đã xác minh `system.environment=test`; test tự dọn dữ liệu riêng và khôi phục service.
- 26 kiểm tra browser desktop/mobile pass: gợi ý, quota, vùng lịch, thiếu/đủ/vượt/không khả thi, retry, product/cart/checkout, legacy, keyboard và responsive.
- Giao diện Admin qua Clerk development chưa có phiên đăng nhập để xác minh; repository save/conflict/audit/cache và guest auth đã kiểm tra. Chi tiết trong [verification.md](verification.md).

Lượt chạy toàn bộ unit suite ghi nhận 161 pass và 11 lỗi baseline ở nhóm `carousel reading clock`; code/test đó không đổi. Test Hoa Thời được chạy lại sau thay đổi cuối. Không coi mock browser là bằng chứng lưu Postgres; hai nhóm được kiểm tra riêng.

## Dữ liệu service đã tồn tại

Fixture mới dùng `bouquetsPerPeriod`. DB cũ được đọc qua adapter; Save Admin ghi shape mới qua luồng audit bình thường. Script bổ sung gợi ý chỉ thêm khi key chưa tồn tại, giữ nguyên cấu hình Admin, kể cả mảng rỗng:

```powershell
# Chỉ với DATABASE_URL development/test và DB_ENV tương ứng đã xác minh.
node node_modules/tsx/dist/cli.mjs scripts/db/hoa-thoi.ts
node node_modules/tsx/dist/cli.mjs scripts/db/hoa-thoi.ts --apply --actor=<actor> --edit-version=<version-tu-dry-run>
```

Script có dry-run, environment guard, row lock, editVersion và audit. Không cần DDL; không ghi DB Preview/production. Trong phiên trước đã apply trên TEST từ editVersion 1; lượt calendar mới không overwrite gợi ý đã có. Save Admin invalidation tag `services` ngay; direct script cần restart local hoặc đợi cache 60 giây.

## Ảnh review

Các ảnh prefix `calendar-` là UI spec mới; ảnh không có prefix này là các lượt thiết kế cũ.

- [Gói và calendar trống](screenshots/calendar-packages-empty-desktop.png)
- [Tuần 2×2 còn thiếu](screenshots/calendar-weekly-partial-desktop.png)
- [Tuần 2×2 đã đủ](screenshots/calendar-weekly-complete-desktop.png)
- [Tháng 2×2](screenshots/calendar-monthly-complete-desktop.png)
- [Quota vượt sau đổi gói](screenshots/calendar-overflow-desktop.png)
- [Vùng không khả thi](screenshots/calendar-infeasible-mobile.png)
- [Calendar trên mobile](screenshots/calendar-weekly-complete-mobile.png)
- [Receipt tháng](screenshots/calendar-monthly-receipt-mobile.png)
