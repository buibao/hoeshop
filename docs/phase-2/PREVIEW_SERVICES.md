# Dịch vụ Preview Hòe

Kiểm tra ngày 05/10/2026, múi giờ Asia/Ho_Chi_Minh. Vercel CLI 62.2.0 đã đăng nhập `buibao`, liên kết `buibaos-projects/hoeshop` (`prj_ew98GlvgKIW9wKSfDdGPHxlIq1TC`). Chỉ triển khai Preview, `SHOP_LIVE=false`; production/main chưa thay đổi.

## Tài nguyên và phạm vi

| Tài nguyên | Cấu hình | Kết nối |
| --- | --- | --- |
| Neon `hoe-preview` | `store_CSVnmvyonTzPnQ2k`, Free `free_v3`, Singapore `sin1`, Neon Auth tắt | Chỉ Preview; `DATABASE_URL` và `DATABASE_URL_UNPOOLED` canonical |
| Neon `hoe-test` | `store_RZCL9tEFmkeCMAAY`, Free `free_v3`, Singapore `sin1`, Neon Auth tắt | Development với prefix `HOE_TEST`; dành cho integration, marker `test` |
| Clerk `hoe-admin-preview` | Hobby `hobby_2025_08`, development instance | Chỉ Preview; hai keys tự provision |
| Blob `hoe-media-preview` | `store_ZUw2neSBsmva2JA5`, public, Singapore `sin1` | Chỉ Preview; `BLOB_READ_WRITE_TOKEN` tự provision |

Neon `neon-byzantium-notebook` do chủ shop tạo trước đó ở `iad1`, prefix `STORAGE_`, nối Preview/Production. Chưa đọc được credentials do biến Sensitive không thể pull; không chạy SQL/migration/seed vào DB đó. Các DB mới đảm bảo test và Preview không dùng kết nối của production. Không mua/nâng gói trả phí. Blob Hobby miễn phí trong hạn mức, vượt hạn mức sẽ bị ngừng truy cập; theo dõi [usage/pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing).

Biến theo nhánh Preview `feat/phase2`: `DB_ENV=preview`, `DATA_ADAPTER=postgres`, `CONTENT_MODE=test`, `SHOP_LIVE=false`, `SITE_URL=https://hoeshop-git-feat-phase2-buibaos-projects.vercel.app`, `RATE_LIMIT_SECRET` ngẫu nhiên và `ADMIN_CLERK_USER_IDS`. RATE_LIMIT_SECRET là Sensitive, không pull lại được; bản dùng vận hành được giữ trong file local đã ignore. Không thay bằng chuỗi `[SENSITIVE]`.

Clerk user ID admin: `user_3KFIoirY4ZX9iXow1tImk2g8Rbx` cho `buibao1997@gmail.com`. User được tạo ban đầu với email reserved, không mật khẩu/email notification; lần đăng nhập Google đã liên kết `oauth_google`, email chuyển verified. Allowlist đăng ký chỉ có email này; quyền admin của ứng dụng vẫn kiểm tra user ID trên server. SignIn tắt combined sign-in-or-up, chặn chuyển OAuth sang đăng ký bằng `transferable=false` và ẩn liên kết signup. Cần UAT Google non-admin riêng để nghiệm thu 403 trên phiên thật. Các phương thức email/password mặc định có thể tắt trong Clerk dashboard để chỉ dùng Google.

## Migration và kiểm chứng

Pooled/direct URL được kiểm tra cùng target trước SQL. PostgreSQL 18.6; DB mới trống trước migration. Cả hai DB đã tạo đủ 13 bảng, chạy seed `--fixtures --dry-run` rồi `--fixtures`: 4 settings, 3 services, 4 products, 2 posts, 1 policy. Marker `preview`/`test` riêng. Không overwrite content đã sửa. Fixtures không được import vào production.

- Build, typecheck, lint và 51 unit tests đạt.
- 13 integration tests đạt trên Neon `hoe-test`: concurrency, rollback, idempotency, restart/retry qua ngày, rate atomic/shared, comment paging/hide, stale edit và seed no overwrite. Clerk/Blob trong integration admin vẫn mock và được phân biệt với kiểm thử dịch vụ bên dưới.
- Preview đầu tiên có dịch vụ: [deployment](https://hoeshop-53lqqko05-buibaos-projects.vercel.app), ID `dpl_6Gw7wHJimx8rjQ8wHF5DQVypLRcj`, READY, Functions `sin1`, source `71797b2` trên `feat/phase2`, gồm `.vercelignore` chưa commit tại thời điểm upload.
- Redeploy bằng CLI sang [Preview kiểm tra persistence](https://hoeshop-jstl5de62-buibaos-projects.vercel.app), ID `dpl_85ZT92SZAbH73xVyiuMNEc7MmWsc`. Gửi lại hai payload checkout đã lưu từ deployment trước qua `vercel curl`: đều 200 và receipt cũ; kết nối SQL mới xác nhận vẫn một order/ba items cho mỗi request. Dữ liệu sống qua deployment mới, không phụ thuộc bộ nhớ process.
- Playwright trên Preview 1440/390px: giỏ ba dịch vụ, checkout 201; response bị mất sau commit rồi reload retry 200 cùng ID; bốn retry đồng thời 200; khác hash 409. SQL xác nhận mỗi request một order, ba items và một idempotency record. Tư vấn riêng 201/một inquiry. Bình luận 201/plain text, reload tồn tại; hide/restore qua SQL chỉ trên bình luận test tự tạo phản ánh ngay, retry Hidden 409. Đây chưa phải UAT thao tác hide/restore bằng admin UI.
- Draft 404; guest admin API 401; trang đăng nhập hiển thị Google; calendar Escape/return focus, không overflow và không pageerror ở cả hai viewport.
- Blob SDK thật: upload JPEG 295.502 bytes, head/read/hash bytes khớp, xóa file test thành công. Chưa thay kiểm thử quyền/token/direct upload/finish trên giao diện admin.

Dữ liệu yêu cầu test được giữ lại trong DB Preview để shop đối chiếu. Không chứa liên hệ khách thật. Logs/env/browser sessions nằm trong `.local` hoặc `.env*.local`, đều ignore; không commit credentials hay share bypass tokens.

## Thao tác CLI về sau

```powershell
vercel whoami
vercel link --yes --scope buibaos-projects --project hoeshop
vercel integration list --all --scope buibaos-projects
vercel env ls preview --scope buibaos-projects
vercel env pull .env.preview.local --environment preview --git-branch feat/phase2 --yes --scope buibaos-projects
vercel env pull .env.neon-test.local --environment development --yes --scope buibaos-projects
vercel deploy --dry --json --scope buibaos-projects
vercel deploy --yes --target preview --scope buibaos-projects
```

Tạo `.env.local` vận hành từ đúng profile, chỉ copy keys cần thiết, `DB_ENV` phải trùng marker. Profile test cần map `HOE_TEST_DATABASE_URL`/`HOE_TEST_DATABASE_URL_UNPOOLED` thành keys canonical và `DB_ENV=test`; không mang `VERCEL_ENV` vào integration process. Migration dùng direct URL. Seed Preview/test dùng `--fixtures`; không chạy fixture seed production.

`.vercelignore` chặn secrets, `.local` và browser states khỏi CLI upload; dry-run hiện có 175 source files, không có file private. Không dựa riêng vào `.gitignore` khi deploy CLI.

Production còn cần DB/Blob/Clerk production riêng, domain/OAuth Google, dữ liệu thật, UAT toàn bộ và shop nghiệm thu. [ADMIN_RUNBOOK](ADMIN_RUNBOOK.md) và [VERIFICATION_PHASE2](VERIFICATION_PHASE2.md) ghi phần còn mở.
