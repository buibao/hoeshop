# Vận hành Google Sheets / Apps Script

## Thiết lập Sheet test trước

1. Tạo Google Spreadsheet riêng cho test; không dùng file khách thật. Chỉ chia sẻ với người shop phân công.
2. Tạo Apps Script project riêng, sao chép integrations/google-sheets/Code.gs. Dùng manifest appsscript.json; timezone Asia/Ho_Chi_Minh, runtime V8.
3. Trong Project Settings → Script Properties: SHEET_ID = ID spreadsheet; GATEWAY_SECRET = secret ngẫu nhiên ít nhất 32 byte. Tạo bằng `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` trên máy quản lý; không gửi secret vào chat hoặc repo.
4. Chạy initializeHoeSheets một lần, cấp quyền cho tài khoản chủ script. Script tạo Orders/Inquiries/Comments, header và hàng cố định. Không ghi đè tab đã có header khác.
5. Deploy → New deployment → Web app; Execute as Me (tài khoản shop), access Anyone. Endpoint có thể truy cập mạng nhưng mọi thao tác dữ liệu bắt buộc signed POST; doGet không đọc dữ liệu.
6. Sao chép URL kết thúc /exec, không dùng /dev cho Vercel. Đặt SHEETS_GATEWAY_URL và SHEETS_GATEWAY_SECRET trong env server Preview của Vercel. Tạo RATE_LIMIT_SECRET riêng, cấu hình CONTENT_MODE=test, DATA_ADAPTER=sheets, SHOP_LIVE=false.
7. Deploy lại website. Gửi đơn test giỏ trộn, tư vấn và bình luận. Đối chiếu từng trường trong Sheet trước khi nghiệm thu.
8. Production dùng spreadsheet + script + secrets riêng; không cho Preview truy cập Sheet production. Nếu Workspace cấm Web app anonymous, cần quản trị viên cho phép hoặc đặc tả lại xác thực server-to-server; không mở Sheet công khai để khắc phục.

## Contract gateway

Vercel ký envelope JSON:
`{version:1,timestamp,payload,signature}`, payload là nguyên chuỗi JSON; signature là HMAC-SHA256 hex của `v1.TIMESTAMP.PAYLOAD`. Timestamp giây UTC, độ lệch tối đa 300 giây. Các action: lookup/create cho Orders/Inquiries, create/listComments cho Comments. Cả đọc bình luận cũng là signed POST giữa hai server.

Apps Script trả JSON `{ok:true,data:...}` hoặc `{ok:false,status,code}`; adapter website chuyển trạng thái JSON thành HTTP 409/422/429/503. HTTP 200 từ Apps Script chưa đủ để kết luận đã lưu. Không ghi customer data vào log.

Gateway dùng ScriptLock cho check-and-write. requestId gắn payloadHash của request đã chuẩn hóa; cùng ID/cùng payload trả bản ghi cũ, khác payload trả 409. Đơn được lookup trước khi server tính lại giá, giữ snapshot cũ khi retry sau cập nhật catalog. Chỉ báo thành công sau setValues + SpreadsheetApp.flush; nếu response mất sau ghi, retry vẫn giữ ID.

Không xóa hàng chuẩn hoặc sửa requestId/payloadHash. Phân biệt mã tiếp nhận và trạng thái shop xác nhận. Không đổi header hoặc sắp xếp tab Comments theo thứ tự khác; đọc phân trang dùng thứ tự append mới nhất trước.

## Các cột

Header chính xác được định nghĩa tại HOE_COLUMNS trong Code.gs. initializeHoeSheets tạo đúng thứ tự.

- Orders: requestId, payloadHash, createdAt, status, buyerName, buyerPhone, buyerEmail, recipientName, recipientPhone, address, summary, snapshot, totals, shipping, notes, shopNotes.
- Inquiries: requestId, payloadHash, createdAt, status, name, phone, email, serviceType, body, configuration, snapshot, shopNotes.
- Comments: requestId, payloadHash, createdAt, status, postId, displayName, body, commentId, shopNotes.

snapshot Orders là JSON chuẩn lưu tên/giá/đơn vị/cấu hình/số lượng và tổng tại thời điểm gửi. Không chỉnh JSON snapshot khi giá catalog thay đổi. Nếu làm tab phân tích chi tiết, tab đó là projection có thể tạo lại từ snapshot; không thay thế hàng chuẩn.

SĐT người nhận trống dùng SĐT người đặt. Shipping luôn pending; số tiền có quote chỉ là phần đã có giá. Link tham khảo lưu như text, shop tự mở bằng trình duyệt; website không fetch hoặc embed URL do khách nhập.

Dữ liệu ghi dưới dạng text và escape tiền tố có thể thành công thức. Không chuyển cột chứa nội dung khách thành công thức, không dùng copy/paste nội dung khách vào ô công thức.

## Shop xử lý yêu cầu

- Orders/Inquiries mới: received. Shop cập nhật contacted, confirmed hoặc cancelled ở status, ghi trao đổi vào shopNotes.
- Website chỉ tạo received, không có tra cứu công khai thông tin khách bằng requestId.
- Comments mới: Visible. Đổi đúng giá trị Hidden ở status để gỡ sau đăng. Không có Pending/Approved, không duyệt trước và không xóa hàng chuẩn.
- Website không cache bình luận. Tải lại sẽ đọc trạng thái mới; kiểm tra sau ẩn phải đạt tối đa 30 giây. Cursor dựa trên commentId và vẫn hoạt động nếu hàng cursor đã Hidden.

## Chống spam

Đơn và tư vấn: mỗi loại tối đa 5 lần/10 phút cho một IP đã băm. Bình luận: 5 lần/phút. Properties dùng chung dưới ScriptLock; tự dọn khóa hết hạn. Retry bản ghi đã lưu không tăng quota.

Tùy chỉnh Script Properties: REQUEST_RATE_LIMIT, REQUEST_RATE_WINDOW_MS, COMMENT_RATE_LIMIT, COMMENT_RATE_WINDOW_MS. Dùng số nguyên dương. Secret băm IP nằm ở server Vercel; Script chỉ nhận rateKey, không nhận IP thô. Trên local, mọi request dùng cùng khóa test.

## Xử lý lỗi

| Biểu hiện | Kiểm tra / xử lý |
| --- | --- |
| 503 chưa cấu hình | URL /exec, secret server, Script Properties; giữ dữ liệu và retry. |
| INVALID_SIGNATURE | Secret hai nơi phải giống, đúng version và timestamp; không tắt xác thực. |
| MISSING_TAB / INVALID_HEADERS | Chạy initializer; giữ header đúng thứ tự. |
| LOCK_BUSY / timeout | Đợi rồi retry cùng requestId; đối chiếu Sheet trước khi gửi payload mới. |
| 409 REQUEST_CONFLICT | Cùng ID được dùng cho nội dung khác; sửa nội dung phải tạo ID mới. |
| 409 CATALOG_CHANGED | Khách xem lại giỏ, lưu cấu hình để chấp nhận thông tin hiện tại. |
| 429 | Đợi hết cửa sổ hoặc kiểm tra giới hạn trong Script Properties. |
| Link ảnh không mở được | Liên hệ khách để lấy link shop có quyền xem; không upload ở phase 1. |
| Quota Apps Script / Properties / Sheet | Đo lưu lượng và dọn dữ liệu test; giữ phản hồi lỗi trung thực. Nếu vượt khả năng vận hành, lên kế hoạch chuyển repository sang database. |

Không coi kiểm thử trong Node VM là nghiệm thu Google thật. Mã script vẫn phải được chạy với quyền, quota, định dạng ô và deployment Apps Script thực tế.

## Checklist mở nhận khách

- [ ] Catalog, giá/quote, logo/ảnh và nội dung đã được shop chốt.
- [ ] Liên hệ thật, chính sách thanh toán/giao/thay đổi/hủy đã xuất bản.
- [ ] Production Sheet/script/secrets riêng; người theo dõi yêu cầu đã được phân công.
- [ ] Trên Vercel production: gửi đơn Hoa Tâm/Hoa Ý/Hoa Thời và giỏ trộn; kiểm tra đầy đủ snapshot, SĐT và địa chỉ.
- [ ] Gửi tư vấn không mẫu, kiểm tra chỉ có Inquiries.
- [ ] Retry/bấm đôi/timeout không trùng; cùng ID khác payload bị từ chối.
- [ ] Bình luận Visible hiện ngay, Hidden biến mất khi tải lại; không lộ Orders/Inquiries.
- [ ] Mobile/desktop, ảnh, focus và trạng thái lỗi đạt.
- [ ] Bật SHOP_LIVE=true, CONTENT_MODE=live, DATA_ADAPTER=sheets, SITE_URL chuẩn; build lại production.
