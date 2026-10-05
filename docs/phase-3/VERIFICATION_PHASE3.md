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

## Chưa nghiệm thu

- Shop duyệt checkpoint B: Home/detail và admin mẫu desktop/mobile.
- Milestone C/D/E: ArticleEditor/SettingsEditor và media/dashboard hoàn chỉnh, áp dụng toàn storefront/widget, full Google admin/non-admin/Blob UAT và hide/restore qua UI trên phiên bản cuối.
- Safari/iOS thật, Lighthouse trước–sau phase 3. Baseline phase 2 mobile median 83; chưa tuyên bố đạt ≥90.
- Assets/catalog/contact/policies thật, domain/OAuth/providers production và readiness mở shop.

SHOP_LIVE=false; không đổi production, không chạy migration/seed Preview trong A/B. Không commit env, session, bypass token hoặc dữ liệu khách.
