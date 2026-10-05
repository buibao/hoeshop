# Bằng chứng phase 3 — A/B

05/10/2026. Đây là checkpoint thiết kế, chưa phải nghiệm thu toàn phase 3 hoặc mở bán.

## Đã xác minh

- 58 unit tests: nghiệp vụ phase 1/2 và regression Hoa Ý default/priced/custom shape, fixed/range/quote, publish validation, tổng đơn, nhãn trạng thái, field paths.
- 14 integration cases trên Neon hoe-test PostgreSQL thật. Case mới gọi PUT admin với Clerk session mock: missing shape publish 422/field path, draft 200, publish default Bình/priced Hộp 200, stale 409; catalog runtime → ba cấu hình → snapshot/total đúng trong DB; retry shop đóng trả receipt cũ; admin listing serviceTypes đúng. Cleanup chỉ bản ghi thuộc test run.
- Browser local qua agent-browser: Home và trang duyệt tải được, không có page errors. Lỗi overflow 360px trong admin mẫu đã sửa: table caption/sr-only có containing block, orders mobile dùng thẻ.
- Playwright cấu hình fixture riêng không thừa kế Neon/Clerk/Blob của operator .env.local. Tests mock không phải UAT Google hay Blob thật.

Build, typecheck và lint bản A/B đạt. Public Playwright 40/40 đạt (20 desktop, 20 mobile), gồm các case phase 1/2 và sáu case mới cho preview isolation, field error/focus, quote/mixed, giữ input/cảnh báo rời trang, mobile menu, 360/390/768/1024/1440px, ảnh và reduced motion. Browser capture local 1440/390: sáu page checks, mười screenshots, không page error hoặc overflow; form demo không gửi admin writes, guest admin API 401/no-store.

Các lần chạy đầu phát hiện overflow trên trang admin mẫu và giả định môi trường/selector của tests cũ; đã sửa rồi chạy lại đủ 40 cases. E2E giờ scrub credentials operator khỏi webServer, ảnh test mới ghi vào .local để không thay bằng chứng phase 2. Dev còn warning LCP khi cuộn đến ảnh mẫu và thông báo reduced motion; chưa dùng kết quả dev để kết luận performance production.

Preview code `73d4f6d`: deployment `dpl_2i344oiydr5YcoKhhDsqQHPPGNwS`, READY, sin1, [website](https://hoeshop-alt0lt5fe-buibaos-projects.vercel.app), [trang duyệt](https://hoeshop-alt0lt5fe-buibaos-projects.vercel.app/xem-thu/giao-dien). Alias nhánh: https://hoeshop-git-feat-phase3-buibaos-projects.vercel.app . Vercel bảo vệ Preview; dùng share link cấp riêng hoặc đăng nhập chủ project, không commit token.

Browser thật 1440/390px: sáu page checks và mười screenshots; Home/detail HTTP 200, ảnh decode đúng và không overflow, zero page errors; admin mẫu không ghi API, shape missing có inline error/focus và sửa Bình/Hộp kiểm tra hợp lệ; guest /api/admin/orders 401 + no-store. Neon Preview read-only xác nhận pooled/direct cùng DB, marker preview và 13 bảng. Không chạy migration/seed hay sửa nội dung Preview.

| Màn | Desktop 1440 | Mobile 390 |
| --- | --- | --- |
| Home | [Ảnh](screenshots/1440-home.png) | [Ảnh](screenshots/390-home.png) |
| Chi tiết sản phẩm | [Ảnh](screenshots/1440-product.png) | [Ảnh](screenshots/390-product.png) |
| Đơn mẫu | [Ảnh](screenshots/1440-admin-orders.png) | [Ảnh](screenshots/390-admin-orders.png) |
| ProductEditor | [Ảnh](screenshots/1440-product-editor.png) | [Ảnh](screenshots/390-product-editor.png) |
| Field error / focus | [Ảnh](screenshots/1440-field-error-focus.png) | [Ảnh](screenshots/390-field-error-focus.png) |

Ảnh trên deployment code 73d4f6d; commit bàn giao sau đó chỉ thêm tài liệu/ảnh. Toolbar Vercel chỉ được ẩn lúc chụp, không thay source. Không suy diễn build hoặc screenshot là bằng chứng tiếp nhận đơn/Blob. UAT Google admin/non-admin và media qua UI vẫn cần hoàn tất ở C/E.

## Revision 1 — phản hồi bố cục và motion

05/10/2026: chuyển caption hero xuống dưới ảnh, bỏ khung vòm riêng của card thứ hai; card Home/catalog/dịch vụ cùng 4:5/8px. Thêm submenu Sản phẩm tới ba trang dịch vụ, giữ link catalog. Bổ sung fade in/out của menu, fade/scroll reveal, stagger card, hero parallax nhẹ và hover/click; reduced motion không dịch chuyển hoặc giấu nội dung. Các link đang fade-out trở thành inert ngay để Tab không đi vào menu đã đóng.

Kiểm tra revision: 58 unit, 14 integration Neon test, build/typecheck/lint đạt; full public E2E 46/46 đạt (23 desktop + 23 mobile), sau chỉnh Tab order chạy riêng sáu ca landing/navigation đạt. Có kiểm tra hover, ArrowDown/Tab/Escape và return focus, link Hoa Ý tới catalog đúng loại, caption nằm dưới ảnh, khung ảnh đồng nhất, overflow tại 360/390/768/1024/1440px, trạng thái cuối reveal và reduced motion. Kiểm tra console trong ca motion không có hydration error sau khi sửa SSR style của hero. Mock browser tests vẫn tách khỏi dữ liệu Neon Preview.

Preview code `5ce2578`: deployment `dpl_ASn2pS7XBmpnEgBjwjs1sb4brco5`, READY, sin1, [website](https://hoeshop-5dvl26umm-buibaos-projects.vercel.app). Mở bằng share link cấp riêng hoặc tài khoản Vercel có quyền; không commit token. Browser thật qua agent-browser và Playwright: Home HTTP 200, ba trang dịch vụ HTTP 200 ở 1440/390px, mỗi dịch vụ hiện một mẫu test đúng loại từ catalog hiện có. Không có page/console errors hoặc overflow; reduced motion hiển thị card ngay; không ghi API hoặc seed nội dung shop. Không suy diễn kiểm tra navigation là nghiệm thu Google admin/Blob hay lưu đơn thật.

| Revision 1 | Desktop 1440 | Mobile 390 |
| --- | --- | --- |
| Hero / caption | [Ảnh](screenshots/revision-1/1440-hero.png) | [Ảnh](screenshots/revision-1/390-hero.png) |
| Card cùng layout | [Ảnh](screenshots/revision-1/1440-products.png) | [Ảnh](screenshots/revision-1/390-products.png) |
| Menu Sản phẩm / focus | [Ảnh](screenshots/revision-1/1440-product-menu.png) | [Ảnh](screenshots/revision-1/390-product-menu.png) |
| Home toàn trang | [Ảnh](screenshots/revision-1/1440-home.png) | [Ảnh](screenshots/revision-1/390-home.png) |
| Scroll / hover / menu | [Video WebM](screenshots/revision-1/1440-motion.webm) | [Video WebM](screenshots/revision-1/390-motion.webm) |

Video dùng viewport cao 960px, có mở/đóng menu và cuộn các section. Ảnh hero mobile dùng vùng chụp cao 1200px để thấy caption dưới ảnh; ảnh toàn trang chụp sau khi đưa scroll về đầu để trạng thái parallax đúng hero ban đầu. Chỉ ẩn toolbar Vercel khi chụp, không sửa giao diện ứng dụng. Tám ảnh và hai video trên cùng deployment code 5ce2578; commit bàn giao sau chỉ thêm bằng chứng. Bằng chứng A/B bên trên được giữ làm lịch sử; chưa coi feedback sửa mẫu là shop duyệt checkpoint B.

## Chưa nghiệm thu

- Shop duyệt checkpoint B: Home/detail và admin mẫu desktop/mobile.
- Milestone C/D/E: ArticleEditor/SettingsEditor và media/dashboard hoàn chỉnh, áp dụng toàn storefront/widget, full Google admin/non-admin/Blob UAT và hide/restore qua UI trên phiên bản cuối.
- Safari/iOS thật, Lighthouse trước–sau phase 3. Baseline phase 2 mobile median 83; chưa tuyên bố đạt ≥90.
- Assets/catalog/contact/policies thật, domain/OAuth/providers production và readiness mở shop.

SHOP_LIVE=false; không đổi production, không chạy migration/seed Preview trong A/B. Không commit env, session, bypass token hoặc dữ liệu khách.
