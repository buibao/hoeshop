# Kiểm chứng migration Untitled UI

Ngày thực hiện: 05/10/2026. Trạng thái đang cập nhật; không đánh dấu shop nghiệm thu chỉ từ build hoặc screenshot.

| Kiểm tra | Kết quả hiện tại |
| --- | --- |
| Unit nghiệp vụ | 58/58 đạt |
| Postgres thật riêng | 14/14 trên Neon có marker test; concurrency/idempotency/transaction/rate/snapshot/stale/revision |
| Lint/typecheck/build | Đạt; lint không lỗi, bốn warning img giữ nguyên source avatar/badge upstream |
| E2E fixture Chromium | 50/50 ca desktop/mobile đạt, gồm modal/reset/recompute giá. Không dùng secrets/DB/operator profile |
| Source audit | 63 file khớp SHA upstream; patch branding/Việt hóa/integration ghi riêng |
| Google admin/non-admin | Chờ session thật trên Preview; người vận hành đã đồng ý tham gia |
| Blob qua admin UI | Chờ UAT thật, không suy diễn từ mock hoặc SDK phase 2 |
| Safari/iOS thật | Chưa chạy |
| Shop duyệt thiết kế/ảnh thật | Chưa nghiệm thu; ảnh test |

Production dependency audit: 0 advisories. Dev tooling còn 9 advisories như baseline, không chạy audit fix phá version. Các thay đổi source sau full suite được kiểm tra lại bằng ca liên quan.

Sau adapter icon: tám ca Store/cart liên quan đạt, thêm hai ca geometry desktop/mobile đạt. Button md: cao 40px, padding 10/14px, radius 8px, gap 4px, text 14px; input md: text 16px/padding dọc 8px; icon slot 20px. Các giá trị này được đối chiếu variant source, không phải scale riêng của Hòe.

## Phân biệt môi trường

Public E2E chạy CONTENT_MODE=test/DATA_ADAPTER=mock, xóa provider keys khỏi child environment. Integration dùng Neon riêng đã kiểm tra marker `test`, không dùng Preview/production. Preview dùng Postgres + Clerk development + Blob đã kết nối; không seed/migrate dữ liệu ở đợt UI này. Branch overrides giữ `SHOP_LIVE=false`.

Mobile Chromium touch dùng Android UA và viewport 390×844 để engine/platform khớp nhau. Emulation iPhone trên Chromium có thể kích hoạt nhánh scroll-lock Safari của React Aria trên engine khác; không dùng kết quả đó để tuyên bố Safari/iOS đạt. Safari/iOS thật vẫn chờ kiểm tra riêng.

## Bằng chứng cần bàn giao

Preview URL và SHA chính xác, ảnh desktop/mobile gallery/Home/detail/admin/calendar, video thao tác ngày/giờ/navigation, metrics geometry cùng variant. Không commit secrets, bypass link token, cookies hoặc dữ liệu khách. Gallery chỉ fixture và noindex, 404 production.

UAT thật: đăng nhập admin → tạo bản test nhận diện rõ → cấu hình Hoa Ý → publish → Store → checkout → đối chiếu snapshot; stale edit giữ input; Blob upload/chọn ảnh/xóa ảnh đang dùng 409; hide/restore comment. Non-admin và Safari/iOS ghi riêng nếu chưa có session/thiết bị.
