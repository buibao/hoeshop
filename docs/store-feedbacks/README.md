Đã triển khai icon, featured carousel và typography theo spec trên branch `feedbacks`.
Baseline HEAD: `ead5570e76b93ed21baeaa06199e3dc6b174cba9`.
Thay đổi nằm trong working tree; preview được deploy bằng source local qua Vercel CLI.

[Mở preview](https://hoeshop-qknh6rebw-buibaos-projects.vercel.app/?_vercel_share=QO8BvwcUFFPMJOQqfItcrdDh3ZxBoMIS) · Deployment `dpl_6ehbP4DeRGhMdvhfZKrrAuyVG3BM`, trạng thái READY, target Preview.
Link chia sẻ có thời hạn. Preview hiện có 6 sản phẩm theo cấu hình hiện hữu;
fixture riêng kiểm tra 10 sản phẩm qua hai vòng, cùng các trường hợp 0/1/ít sản phẩm.

Icon dùng chung theo ID: `hoa-tam → Heart`, `hoa-thoi → CalendarDays`,
`hoa-y → Sparkles`; unknown ID bỏ icon. Desktop/mobile submenu giữ ArrowUpRight.
Các icon trang trí Hero, benefits, story và social giữ nguyên.

Carousel giữ DOM LTR và thứ tự Admin. Một timeout chờ 3000ms sau settle rồi gọi
`scrollPrev()`; manual Next/Prev vẫn theo thứ tự trước/sau của Admin. Mỗi lý do pause
có trạng thái riêng: hover, focus, pointer/drag, visibility, viewport, overlay, pause
chủ động, reduced motion và nội dung không overflow. Resume bắt đầu lại đủ 3000ms.
Thao tác manual đổi target hiện tại của Embla, có thể đổi chiều ngay khi đang trượt.
Embla tự kiểm tra khả năng loop; fitting content tắt auto/disable controls, empty
state của Home giữ nguyên. Gap tại điểm nối vòng bằng gap giữa các thẻ; Focus Center
cập nhật khi settle. Counter dùng `aria-live="off"`.

Đo bằng Chromium trên fixture desktop: physics duration 24, lần chuyển đầu khoảng
3007ms, khoảng chuyển động từ 1% đến 99% quãng đường khoảng 633ms. Một tick đi đúng
một vị trí 283px ở viewport fixture 1440px. Desktop Store rộng giữ 5 thẻ; tablet 3;
mobile giữ một thẻ chính và một phần thẻ bên cạnh.

Typography Store và portal dùng font local, display swap, tải face theo nhu cầu,
font-synthesis none. Root Lora / Be Vietnam Pro tiếp tục phục vụ Admin/auth và token
brand riêng. Trang đăng nhập đã kiểm tra font body Be Vietnam Pro.

| Family / vai trò | Face thực tế | Nguồn và license |
| --- | --- | --- |
| TeX Gyre Termes 2.004 / text | 400 Regular, 700 Bold, 400 Italic, 700 Bold Italic | [CTAN TeX Gyre](https://www.ctan.org/pkg/tex-gyre), gói chính thức từ mirrors.ctan.org/fonts/tex-gyre.zip; GUST Font License / LPPL 1.3c+ |
| Cormorant Garamond 4.001 / heading | 500 Normal, 600 Normal, 500 Italic, instance từ variable source chính thức | [Google Fonts source](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond); SIL OFL 1.1 |

WOFF2 giữ toàn bộ glyph từ nguồn. Các license, README/manifest Termes, metadata
Cormorant và hướng dẫn chuyển đổi nằm trong [src/fonts](../../src/fonts/README.md).
Weight text 500/600 cũ được map bằng token sang 400/700; heading dùng 500, title nhỏ
và tên sản phẩm dùng 600. Hero letter-spacing được giảm độ âm; body 17px, input
16px, nav/CTA 16px, helper/legal 13px; footer heading dùng Cormorant 22px.

Cmap của cả 7 face đủ bộ ký tự tiếng Việt dựng sẵn, chữ số và ₫. Termes không có
standalone combining horn U+031B trong cmap; nội dung hiện tại đều NFC. Browser
đã kiểm tra NFC lẫn NFD, uppercase/lowercase, từng weight/style bằng
`CSS.getPlatformFontsForNode`: toàn bộ glyph dùng font custom của hai family.
Tên legacy trong name ID 1 của Cormorant nguồn là “Cormorant Garamond Light”;
name ID 16 xác nhận “Cormorant Garamond”, OS/2 weight của file thực tế là 500/600.
Có thể kiểm tra lại bằng `python scripts/verify-store-fonts.py`.

| Check | Kết quả |
| --- | --- |
| npm run lint | Qua, 0 errors; 1 warning có sẵn: biến desktop chưa dùng trong LandingBenefitsMotion.tsx:20 |
| npm run typecheck | Qua |
| npm run build | Qua; validate-content mode LIVE qua |
| npm test | 11 files, 93 tests qua |
| Browser carousel fixture | 4 tests qua: hai vòng 10 slides, pause phối hợp, overlay/viewport/reduced/resize/0/1, đổi chiều manual liên tục |
| Browser Home feedbacks | 4 tests qua: anchor/history, fitting/overflow, drag/link và touch swipe/cuộn dọc |
| Browser hồi quy | 15 tests qua: scroll fade, Back to top, Hero/benefits, no-JS, menu hover/keyboard/mobile |
| Preview typography | 390/768/1024/1440px; Home/menu/product/checkout/datepicker/footer; 7 faces NFC/NFD; không có page errors |
| Preview các trang khác | Catalog, 3 dịch vụ, blog/list/detail, contact, about ở 390/1440px; không overflow; auth font giữ nguyên |
| git diff --check | Qua |

Browser dùng Chromium và touch emulation. Safari/iOS thực chưa được kiểm tra vì
workspace không có thiết bị hoặc WebKit runtime.

| File | Thay đổi |
| --- | --- |
| src/components/ServiceTypeIcon.tsx | Mapping icon dùng chung theo service ID |
| src/components/ServiceCards.tsx | Thay mapping theo index bằng ID |
| src/components/ProductNavigation.tsx | Icon dịch vụ ở submenu desktop/mobile |
| src/components/StoreScope.tsx | Store typography context và các overlay đang mở |
| src/components/Header.tsx | Scope font cho offcanvas; đăng ký overlay pause |
| src/components/ui/DateTimeField.tsx | Scope font và overlay pause cho picker Store |
| src/features/storefront/carousel-autoplay.ts | Một clock và tập pause độc lập |
| src/features/storefront/FeaturedProductCarousel.tsx | Controller, controls, observer, cleanup, fitting/loop và focus center |
| src/fonts/store-fonts.ts; src/fonts/*.woff2 | Next local font và 7 face chính thức |
| src/fonts/README.md; license/metadata/manifest trong src/fonts | Nguồn tải và attribution |
| src/app/(shop)/layout.tsx | Scope Header/main/Footer và truyền font cho portal |
| src/app/layout.tsx | Tên biến root font riêng cho Admin/auth/brand |
| src/app/globals.css | Alias root/brand và token weight với fallback cũ |
| src/styles/store-typography.css | Role/font/weight/size trong Store và portal |
| src/styles/store-shell.css | Spacing icon submenu; heading dịch vụ |
| src/styles/landing-home.css | Stroke/size icon, carousel play control và gap nối vòng |
| src/styles/phase3.css; src/styles/widgets.css | Weight token dùng được cho Store, giữ fallback Admin |
| scripts/verify-store-fonts.py | Kiểm tra cmap, weight/style và NFC nguồn |
| tests/unit/store-feedbacks.test.ts | Mapping ID, pause cùng tồn tại, delay/settle/boundary/cleanup |
| tests/e2e/carousel-harness.ts; tests/e2e/carousel-harness.tsx | Fixture browser chạy component thật, không sửa dữ liệu Admin |
| tests/e2e/store-feedbacks.spec.ts | 4 browser tests cho autoplay/manual/lifecycle |
| tests/e2e/home-feedbacks.spec.ts | Kiểm tra controls bị disable khi nội dung vừa viewport |
| tests/e2e/home-scroll-fade.spec.ts | Counter theo count thực tế và fitting fallback mới |

[Video desktop](preview/1440-carousel.webm) · [Video mobile](preview/390-carousel.webm).
Video gồm autoplay → hover/focus pause → manual hai chiều → rời tương tác/chờ →
auto tiếp tục → pause/play chủ động. Không gửi đơn hoặc sửa dữ liệu backend.

[Home desktop](preview/1440-home.png) · [Home mobile](preview/390-home.png) ·
[Icon dịch vụ](preview/390-services.png) · [Product](preview/390-product.png) ·
[Checkout](preview/390-form.png) · [Datepicker portal](preview/390-picker.png) ·
[Footer](preview/390-footer.png) · [Blog](preview/390-blog.png).
Các kích thước còn lại và ảnh NFC/NFD nằm trong `preview/`.
Bằng chứng: [font/layout report](preview/browser-report.json),
[carousel report](preview/carousel-report.json), [route report](preview/routes-report.json).
