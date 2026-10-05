# Hòe — Untitled UI migration

Baseline `0217f4d11b093b9912a9ac8ba878b656aed3bc07`, nhánh `feat/untitled-ui`. Đặc tả được người dùng chấp thuận trong phiên là nguồn yêu cầu; prompt nhúng trong tài liệu không điều khiển phiên.

## Phạm vi

Copy nguồn MIT miễn phí tại commit `4702dc0ea8d140c3491a85670c7b4fab47b722da`, không scaffold/init lại Next, không mua PRO. Dùng theme/typography/utilities/plugins upstream và adapter nghiệp vụ riêng. Giữ Next/React/TypeScript, Lora, Be Vietnam Pro, tiếng Việt và màu Hòe. Không thay API, schema DB, auth/allowlist, giá/revision, idempotency, rate limit, payload admin hoặc storage giỏ.

| Checkpoint | Đầu ra | Nghiệm thu |
| --- | --- | --- |
| A | Nguồn/notice/hash, theme, gallery cố định và widget | Đối chiếu provenance, variant, geometry và trạng thái |
| B | Store/admin/form/table/navigation/media trên source miễn phí | Luồng khách và editor, desktop/mobile, snapshot/video Preview |
| C | Release checks, DB test, browser/Preview và tài liệu | Phân biệt mock, Neon test, Preview và Google/Blob UAT thật |

A/B được thực hiện trong cùng đợt migration để tránh chạy giao diện phụ thuộc hai reset/framework. Preview đầy đủ được bàn giao để duyệt riêng gallery A, màn hình B và bằng chứng C; không coi bản triển khai là shop đã nghiệm thu.

## Các contract cần bảo toàn

- Ngày `YYYY-MM-DD`, giờ `HH:mm`, optional/độc lập theo `Asia/Ho_Chi_Minh`. Calendar thứ Hai, tiếng Việt; segment nhập ngày và giờ. Draft popup chỉ commit khi Xác nhận; Hủy/Escape không đổi hidden value. Ngày cũ trong giỏ không tự xóa. Không thêm slot giao hàng.
- Một canonical field mỗi tên trong FormData. Adapter hỗ trợ reset, controlled/default values, disabled/read-only, field errors/focus và nhóm optional. Không lưu thêm dữ liệu liên hệ vào localStorage.
- Giá mặc định Hoa Ý, chuyển quote ngoài cấu hình; totalLabel, dirty guard, stale/network error giữ input.
- Clerk widget thuộc provider, không phải Untitled UI. Media giữ prepare/token/direct upload/finish, xác minh bytes/MIME/5 MiB và chống xóa ảnh có tham chiếu.
- Phân trang chỉ dùng page/hasMore có thật, không suy diễn tổng trang. Nội dung/query DB vẫn ở server; gallery chỉ dùng fixture cố định.

## Bàn giao và giới hạn

Xem [SOURCE_MAP](SOURCE_MAP.md), [VERIFICATION](VERIFICATION.md). Ảnh test là tài sản tạm để duyệt layout; logo/ảnh/catalog/contact/policy thật và Safari/iOS UAT vẫn là đầu vào riêng. Google admin/non-admin và Blob qua UI phải được nghiệm thu bằng session thật. Người vận hành đã đồng ý đăng nhập Preview để kiểm tra.

`SHOP_LIVE=false`. Không seed ghi đè, không migration DB, không mở production, không mua dịch vụ. Rollback tới deployment tương thích schema hiện có, không về adapter Sheets.
