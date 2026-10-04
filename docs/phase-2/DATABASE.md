# Database Hòe phase 2

## Kết nối và môi trường

`src/server/db/index.ts` tạo pool pg lazy, tối đa 3 kết nối mỗi process, connection timeout 5 giây và statement timeout 15 giây. Node runtime dùng `DATABASE_URL` pooled Neon; CLI migration dùng `DATABASE_URL_UNPOOLED` direct. Không tạo pool hay yêu cầu DB trong build. Thiếu DB hoặc marker sai trả 503, không ghi mock/Sheets trên deployment.

Mỗi DB/branch có `site_settings.key = system.environment` với JSON string `development`, `test`, `preview` hoặc `production`. `DB_ENV` bắt buộc ở CLI/local; deployment chọn môi trường từ `VERCEL_ENV`. Migration/seed từ chối marker khác trước khi thay đổi. Clone branch sang môi trường khác phải có người vận hành kiểm tra URL và thay marker bằng SQL riêng; không sửa marker qua admin.

Ngày 05/10/2026 đã provision Neon Free `hoe-preview` chỉ nối Preview và `hoe-test` nối Development với prefix `HOE_TEST`, cùng region Singapore `sin1` (AWS `ap-southeast-1`). PostgreSQL 18.6, pooled/direct kết nối cùng DB đã kiểm tra; migration/import fixtures hoàn tất với marker riêng `preview`/`test`. Functions Preview xác nhận `sin1`. `hoe-test` là DB dành cho kiểm thử, không dùng cho production. Chi tiết trong [PREVIEW_SERVICES](PREVIEW_SERVICES.md). Tham khảo [Neon regions](https://neon.com/docs/introduction/regions), [Drizzle pg](https://orm.drizzle.team/docs/get-started-postgresql).

DB `neon-byzantium-notebook` do chủ shop tạo trước đó dùng prefix `STORAGE_`, region `iad1`, nối Preview/Production. Không chạy migration hay seed vào DB này; runtime phase 2 Preview dùng URL canonical của `hoe-preview`. Production vẫn cần DB và dữ liệu thật riêng trước release.

## Bảng và bảo toàn lịch sử

| Bảng                 | Vai trò                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| media                | Blob đã xác minh, alt, MIME, kích thước, bytes, actor.                                  |
| products             | Giá fixed/range/quote, cấu hình/options, revision nghiệp vụ, publish/archive, cover FK. |
| posts / policies     | Markdown, slug, publish/draft/archive, cover FK.                                        |
| services             | Ba dịch vụ với schema cố định.                                                          |
| site_settings        | site/home/assets và marker môi trường riêng tư.                                         |
| orders / order_items | Receipt, buyer chung và snapshot dòng do server tính, FK bảo toàn.                      |
| inquiries            | Tư vấn độc lập, status/note.                                                            |
| comments             | Plain text, visible/hidden, actor hide, tuple pagination.                               |
| idempotency_requests | Unique operation + requestId, payload hash, resource và receipt.                        |
| rate_limit_buckets   | Khóa IP băm, bucket atomic/shared và cleanup hết hạn.                                   |
| admin_audit_logs     | Actor, resource, action, thay đổi; status/note trước và sau.                            |

Schema/migration nằm trong `src/server/db`. Constraint kiểm tra kiểu giá, trạng thái, số lượng 1–99, vị trí dòng và ảnh tối đa 5 MiB. Các index hỗ trợ slug, danh sách và comment cursor `(created_at, id)`. Không xóa sản phẩm/bài/chính sách; archive để giữ lịch sử. `edit_version` cập nhật có điều kiện, stale trả 409.

## Migration và import

Sao chép `.env.example` thành `.env.local`, đặt URL direct/pooled và `DB_ENV` đúng DB đích. Không gửi URL/secret qua chat hay commit env.

```powershell
npm run db:migrate
npm run db:seed:dry
npm run db:seed
```

DB test dùng fixtures riêng:

```powershell
npm run db:seed -- --fixtures --dry-run
npm run db:seed -- --fixtures
```

Seed đọc JSON/Markdown cũ, giữ ID/slug/draft/published và chỉ insert ID chưa tồn tại trong transaction. Không cập nhật bản ghi admin đã sửa. Dry-run báo số nội dung đầu vào, không ghi; không phải số bản ghi mới thực tế. Fixtures bị cấm import vào DB production. File content chỉ là nguồn import/fixtures, live không fallback file. Không chạy seed fixture vào production; dữ liệu thật còn thiếu.

## Transaction và retry

Server normalize cấu trúc trước; SHA-256 payload bỏ requestId. Transaction khóa advisory theo operation/requestId, kiểm tra receipt đã commit trước ngày/catalog/shop gate. Unique constraint bảo vệ cùng ID. Cùng hash trả receipt cũ, khác hash 409; retry đã nhận không tốn rate limit. Với đơn mới: đọc catalog hiện tại `FOR SHARE`, tính snapshot và ghi order/items/receipt/rate trong cùng transaction. Rollback không để đơn hoặc bucket dở dang.

5 đơn/tư vấn trong 10 phút, 5 comment/phút theo khóa IP băm; DB dùng chung giữa process. Không lưu IP thô. Comment cursor là opaque tuple, 20 visible mới nhất; hidden retry không công khai lại. Giữ idempotency records trong phase 2.

Client chỉ lưu metadata pending operation/requestId/hash/time, TTL 7 ngày. Không lưu buyer, địa chỉ hay nội dung form. Retry sau reload cần nhập lại cùng nội dung; hash trùng nhận lại ID. Thay payload tạo ID khác. Giỏ lưu cấu hình và số lượng, sau receipt chỉ trừ dòng có cùng ID/cấu hình/revision ở giỏ mới nhất.

## Kiểm thử và vận hành

```powershell
# Dùng DB test riêng đã migrate/seed fixtures, tuyệt đối không production.
$env:DATABASE_URL = '<pooled test URL>'
$env:DB_ENV = 'test'
npm run test:integration
npm run db:readiness
```

Xem tên biến integration chính xác trong `vitest.integration.config.ts`/tests. Readiness exit 1 khi thiếu production/catalog/contact/ảnh/chính sách/auth/media. Exit 0 là kiểm tra cấu hình/dữ liệu cơ bản, chưa thay UAT dịch vụ và quyết định mở shop.

Backup trước migration/deploy. Migration mở rộng tương thích, smoke test và đối chiếu DB rồi mới mở shop. Rollback về bản phase 2 tương thích schema; không rollback adapter Sheets, không migration phá dữ liệu để hạ phiên bản. Định kỳ backup qua Neon/export riêng, giữ dữ liệu người mua/audit ngoài repo và giới hạn quyền truy cập.
