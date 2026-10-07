# Home & Admin feedback — 07/10/2026

> Cập nhật lượt Footer: sản phẩm nổi bật hiện cho phép **0–10**, không còn bắt buộc đủ 10. Lưu 0 bỏ danh sách đã chọn và đặt `featuredLimit = 0`, không tự lấy lại catalog. Hero vẫn đúng 3. Báo cáo ban đầu bên dưới giữ lịch sử bàn giao; xem [Footer & lựa chọn linh hoạt](../footer-feedbacks/IMPLEMENTATION.md) cho yêu cầu mới nhất.

Triển khai trên branch `feedbacks`, baseline `73105c0cbc65b11c403fe08e71378c787659b6b0`. Giữ Lora, Be Vietnam Pro, màu Hòe, layout/timeline Hero, Clerk và PostgreSQL hiện có.

## Thay đổi

- Hai CTA chính Home cuộn đến `/#nhung-doa-hoa`, giữ nhãn shop đã nhập. Lenis là scroll controller duy nhất; link vẫn hoạt động khi tắt JavaScript. Hash trực tiếp, refresh và history đã kiểm tra.
- Embla stable **8.6.0**, khóa trong package/lockfile: center, step 1, manual; 5 thẻ từ 1280px, 3 từ 768px, một thẻ giữa với hai phần ảnh hai bên trên mobile. Loop khi đủ 10; dữ liệu thiếu dùng finite carousel, giữ center cả đầu/cuối. Ảnh 4:5, selected scale 1, ảnh bên cạnh .94, reduced motion bỏ scale và chuyển tức thời.
- `/admin/home-hero`: chọn/sắp xếp đúng 3 sản phẩm. `/admin/home-featured`: đúng 10. Picker chung có ảnh, tên, giá, trạng thái, tìm tên và phân trang 24 sản phẩm; sản phẩm ngoài 50 bản ghi đầu vẫn tìm/chọn được. Draft, thiếu ảnh, fixture ngoài mode test và ảnh không phù hợp Next Image không được chọn.
- `/admin/settings/site`: form Liên hệ & mạng xã hội, gồm địa chỉ/link bản đồ, điện thoại, email, giờ hoạt động, Facebook/TikTok/Instagram. URL HTTPS, email có validation, để trống social URL để ẩn. Giữ social khác, FAQ và các trường thương hiệu khi lưu. `tel:` chuẩn hóa giữ dấu `+`; Footer và trang liên hệ dùng cùng settings.
- Social mới có metadata `platform` tùy chọn ngay trong array hiện có, để tên hiển thị tùy chỉnh/link rút gọn vẫn nạp đúng ô sau reload. Social legacy không có metadata vẫn đọc được bằng nhãn/domain; social khác giữ nguyên.
- Không còn input raw Hero/Featured IDs/featuredLimit trong form Home. API lưu nội dung Home cũng giữ các trường selection hiện tại. Primary CTA href được cố định về section, nhãn vẫn sửa được.
- Hero chưa cấu hình giữ hành vi legacy. Đã cấu hình thì dùng đúng ba ảnh catalog, độc lập với ảnh story; slot không hợp lệ dùng placeholder thương hiệu. Featured giữ thứ tự, bỏ sản phẩm không hợp lệ, không tự bù sản phẩm khác.

## API và dữ liệu

| Endpoint | Hợp đồng |
| --- | --- |
| `GET/PATCH /api/admin/home/hero` | PATCH `{ editVersion, productIds }`, đúng 3 ID độc nhất |
| `GET/PATCH /api/admin/home/featured` | PATCH `{ editVersion, productIds }`, đúng 10 ID độc nhất |
| `GET /api/admin/product-options?q=...&page=...` | Pagination 24, tìm theo tên, metadata eligibility |
| `GET/PATCH /api/admin/settings/site/contact` | PATCH `{ editVersion, contact, social: { Facebook, TikTok, Instagram } }` |

Tất cả endpoint/page mới dùng server guard Clerk sẵn có. Mutation khóa settings, kiểm tra version trong transaction, merge đúng trường, khóa sản phẩm để validate eligibility, kiểm tra thư viện Blob, tăng version, ghi audit và invalidate tag `settings`. Version cũ trả 409. UI giữ dữ liệu đang nhập và yêu cầu đối chiếu bản mới trước khi lưu tiếp.

Không thêm bảng hoặc snapshot catalog. `heroProductIds` mặc định `[]`, `contact.addressUrl` mặc định `null`. Schema đọc vẫn chấp nhận legacy 12 Featured IDs và featuredLimit cũ. Renderer giới hạn 10, selection mới không bị limit cũ cắt còn 3.

## Migration có kiểm soát

`scripts/db/home-feedbacks.ts` mặc định dry-run; không seed/reset database. Chỉ đổi CTA href; nếu có hơn 10 Featured IDs, giữ 10 ID đầu theo thứ tự; điều chỉnh limit về 10 khi có đủ ID.

```powershell
npx tsx scripts/db/home-feedbacks.ts
npx tsx scripts/db/home-feedbacks.ts --apply --edit-version=<version-tu-dry-run> --actor=<nguoi-thuc-hien>
```

Cần profile database đúng môi trường. Script kiểm tra `system.environment`, khóa bản ghi, kiểm tra version, giữ mọi trường khác và ghi audit. Sau khi chạy ngoài Next, deploy lại hoặc chờ TTL settings 60 giây; renderer tương thích CTA legacy ngay từ lúc deploy.

Đã áp dụng trên database **Preview**: Home version **3 → 4**, duy nhất `primaryCta` (chỉ href), audit `migrate:home-feedbacks`. Label và nội dung khác giữ nguyên. Không chạy migration/seed trên production.

## Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| Unit | 73/73 pass |
| PostgreSQL integration | 22/22 pass, database local test riêng |
| E2E storefront liên quan | 20/20 pass desktop/mobile, gồm touch swipe và cuộn dọc thật qua CDP |
| Regression Hero/Benefits | 8/8 pass desktop/mobile, giữ quyết định static Benefits của baseline |
| Browser Admin → API → PostgreSQL → Home/Footer | 4/4 pass với **Clerk thật** và database local test riêng |
| Browser Vercel Preview | Pass ở 390/1440px, đăng nhập Clerk thật, đọc được cả ba menu Admin và các API selection/picker; guest bị chặn |
| Lint | Pass, còn một warning baseline không liên quan |
| Typecheck | Pass |
| Build | Pass (Next 16.3.8) |
| Lockfile | npm 11.6.2 `ci --dry-run --ignore-scripts` pass |

Browser đã đo center, số thẻ 5/3/1 và kiểm tra overflow ở **360, 390, 768, 1024, 1280, 1440px**. Kiểm tra cycle toàn bộ 10 sản phẩm, keyboard, kéo không mở link, click thật mở chi tiết, reduced motion, hash/refresh/back, mobile Admin navigation, lưu/reload, xung đột hai tab, email sai, tel/mailto/maps/social và địa chỉ dài. Suite storefront còn kiểm tra thêm giỏ/configuration/checkout và Hero layout.

Baseline có một test đòi section blog mặc dù section đã bị tắt trong source; cập nhật kỳ vọng theo source hiện tại. Suite motion cũ cũng kỳ vọng Benefits được bật và còn class `.olf-benefits`, trong khi baseline đã cố định `enabled = false` và bỏ class này: cập nhật test để kiểm tra giữ static flow, không thay code Benefits. Warning lint có sẵn: `desktop` không dùng trong `LandingBenefitsMotion.tsx`. Cold-start `.next-e2e` trên Windows từng vượt timeout 120s; E2E chạy lại qua server fixtures đã warm với cấu hình tạm trong `.local`, không thay auth hoặc nội dung production. Chạy các suite Playwright đồng thời cần thư mục output riêng.

Ảnh trong [screenshots](./screenshots/) là thao tác browser thật trên **database test**, với 61 sản phẩm test độc lập và ảnh fixture. Các ảnh/thông tin liên hệ test không được chép lên database shop.

## Shop cần cấu hình

Catalog Preview hiện chỉ có **4 sản phẩm published**, chưa đủ lưu 10 Featured. Bổ sung/công khai đủ sản phẩm có ảnh hợp lệ, rồi chọn 3 Hero và 10 Featured trong hai menu tương ứng. Cấu hình legacy vẫn hoạt động cho đến khi shop lưu danh sách mới. Điền thông tin liên hệ thật trong Website → Liên hệ & mạng xã hội; dữ liệu minh họa không được coi là thông tin đã xác nhận.

## Preview Vercel

[Mở Preview](https://hoeshop-6bg2ngwxz-buibaos-projects.vercel.app) — `dpl_mF8seXiJcsxTJTNeKJi5JaB6wjGR`, project `hoeshop`, region `sin1`, target Preview. Upload từ working tree trên `feedbacks`; metadata Git vẫn là commit baseline vì chưa commit/push thay đổi local. Không promote production. Deployment protection hiện có được giữ nguyên; đăng nhập bằng quyền project để xem.

Preview cuối **READY**. Storefront đã kiểm tra ở 390/1440px: CTA/hash, carousel finite 4 sản phẩm legacy, không overflow, trang đăng nhập Google, endpoint mới trả 401/no-store cho guest. Đăng nhập bằng tài khoản trong danh sách quản trị hiện có mở được Hero, Nổi bật, Liên hệ; API Hero/Featured/picker trả 200. Không có lỗi JavaScript. Không ghi dữ liệu shop trong lượt kiểm tra browser này. Các test đủ 10 sản phẩm chạy trên database local test riêng như mô tả trên. Bằng chứng: [preview-browser-report.json](./preview-browser-report.json), ảnh `preview-*` trong thư mục screenshots.

Kiểm tra thực tế phát hiện `ADMIN_CLERK_USER_IDS` chỉ có trên các branch Preview cũ, chưa có trên `feedbacks`; Clerk đăng nhập thành công nhưng guard trả 403. Đã sao chép **đúng 4 ID quản trị đang cấu hình** từ Preview `feat/oh-les-fleurs-home` sang biến Config riêng cho Preview branch `feedbacks`, rồi deploy lại. Không thay danh sách người dùng, khóa Clerk, database hoặc biến production. Đây là điều chỉnh cấu hình cần thiết từ bằng chứng runtime, ngoài giả định ban đầu của spec rằng không cần chỉnh Vercel.

## Tài liệu đã đối chiếu

- Next.js: guides route handlers, server/client components, caching/revalidation và navigation trong `node_modules/next/dist/docs/`.
- [Embla v8 options](https://www.embla-carousel.com/docs/v8/api/options), React wrapper/types của bản 8.6.0 đã cài.
- [Clerk sign-in tokens](https://clerk.com/docs/reference/backend/sign-in-tokens/create-sign-in-token): dùng token ngắn hạn trên development instance để kiểm tra, không thay guard ứng dụng.
