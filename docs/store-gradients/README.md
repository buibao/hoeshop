# Store Gradient v2 — lưu bản trước revision

**Bản hiện tại: [Cập nhật theo 6 góp ý review](review-fixes/README.md).** [Store Gradient v2.1](v2.1/README.md) giữ ảnh/report trước lượt góp ý mới. Thư mục này giữ ảnh/report v2.0 để đối chiếu; các quyết định về heading hẹp, form trắng và shell của v2.0 đã được thay bằng v2.1.

Triển khai spec `Hoe_UI_Gradient_Spec.md` ngày 11/10/2026 trên branch `feedbacks`, HEAD `2a6843a5ba97f088ae25caf71d1d297b0d926ad9`. Thay đổi tập trung vào màu/bề mặt Store; primitive trong `tokens.css`, domain, API, DB/schema, giá, nội dung, SEO, routing, font, kích thước/radius, animation và carousel không đổi. Không push, PR, deploy hoặc ghi DB Preview/production.

## Thay đổi

- `src/styles/store-gradients.css`: một nguồn token `--store-*`, fallback đơn sắc hợp lệ và enhancement trong `@supports`. Mapping chỉ bên trong `.hoe-store-scope`; portal picker/menu nhận token ngay root.
- ShopLayout import mapping sau typography. Home giữ ambient → ivory/warm → blush → ivory → warm → blush/summary. Benefit berry có chữ/helper/icon trắng; ảnh không bị overlay/filter.
- Card/heading/summary dùng role chung. Prose, FAQ, form, input, ảnh và calendar body giữ bề mặt đọc. Error/success/warning giữ màu semantic hiện tại.
- Selected-soft dùng ink + cue/tick; picker selected-strong dùng trắng. Primary action có gradient; secondary/text/icon/destructive giữ thứ bậc. Disabled loại bỏ gradient; viền control và focus được tăng tương phản. Focus nằm trong selected-strong dùng trắng để đủ tương phản; forced colors dùng system highlight.
- Root 404 được bọc scope riêng qua `StoreFallbackScope`, giữ font Store hiện có. `/admin`, `/dang-nhap`, `/xem-thu` cùng các fallback bên dưới không nhận scope. Không bọc RootLayout.

## Route matrix và ảnh

Mỗi dòng có ảnh **390px và 1440px**, trước/sau trong [before](before/) và [after](after/). Report từng route gồm HTTP status, scope, overflow và lỗi browser: [before/routes.json](before/routes.json), [after/routes.json](after/routes.json).

| Nhóm | Route / tình huống | Tên ảnh |
| --- | --- | --- |
| Home | `/`, đủ hero/benefits/services/carousel/story/process/FAQ/CTA/footer | `home` |
| Catalogue | `/san-pham`, sản phẩm và ba service card | `catalogue` |
| Product Tâm | `/san-pham/mau-test-diu-dang` | `product-tam` |
| Product Thời | `/san-pham/mau-test-hoa-thoi` | `product-thoi` |
| Product Ý | `/san-pham/mau-test-nang` | `product-y` |
| Service Tâm | `/dich-vu/hoa-tam` | `service-tam` |
| Service Thời | `/dich-vu/hoa-thoi` | `service-thoi` |
| Service Ý | `/dich-vu/hoa-y` | `service-y` |
| Cart rỗng | `/gio-hang` | `cart-empty` |
| Checkout rỗng | `/dat-hoa` | `checkout-empty` |
| About | `/ve-hoe` | `about` |
| Blog | `/blog` | `blog` |
| Article | `/blog/chuyen-cua-hoe` | `article` |
| Policy chưa xuất bản | `/chinh-sach/ban-hang` trả 404 đúng trạng thái dữ liệu | `policy-unpublished` |
| Contact | `/lien-he` | `contact` |
| Root Store fallback | `/khong-co-trang-nay` | `404` |
| Product fallback | `/san-pham/khong-co-mau` | `product-404` |
| Ngoài Store | `/admin`, `/dang-nhap`, `/xem-thu/widgets` | `admin`, `auth`, `preview` |

Ví dụ so sánh: Home [desktop trước](before/1440-home.png) / [sau](after/1440-home.png), [mobile trước](before/390-home.png) / [sau](after/390-home.png); sản phẩm Thời [trước](before/390-product-thoi.png) / [sau](after/390-product-thoi.png); catalogue [trước](before/1440-catalogue.png) / [sau](after/1440-catalogue.png).

Ảnh trạng thái trong [verification](verification/): cart-populated, cart-edit, checkout, receipt; calendar-three-of-four và calendar-complete; picker-date/time ở 1440/390px; submenu/mobile-menu; product-error, inquiry-error/success; forced-colors, without-color-mix và no-JS Home/service/404.

Ảnh được chụp sau khi fonts/images tải xong, reduced motion để bề mặt ổn định. Baseline ban đầu được đọc/chụp trước sửa; lượt chụp bổ sung dùng bản build local, bỏ CSS chunk gradient trong CSSOM và tháo wrapper 404 mới để khôi phục bề mặt HEAD, không sửa source/dữ liệu. `before/routes.json` xác nhận tất cả heading không có gradient. Kích thước 40 cặp ảnh trước/sau trùng nhau.

## Tương phản đã render

[verification/report.json](verification/report.json) ghi phép đo nền raster của browser: giữ kích thước/lớp alpha/background ancestor, tạm ẩn copy để lấy pixel nền, lấy mẫu mỗi 2px ở vùng trong bề mặt và tính sRGB foreground thực tế. Các ảnh `background-*.png` lưu nền đã đo. Floating back-to-top được ẩn khi đo section để không lẫn màu control khác. Foreground alpha không hợp lệ bị từ chối.

| Role / state | Tỷ lệ thấp nhất đo được | Ngưỡng |
| --- | ---: | ---: |
| Ambient/helper | 4.655 | 4.5 |
| Blush/helper | 4.868 | 4.5 |
| Warm/helper | 5.067 | 4.5 |
| Card/helper | 5.021 | 4.5 |
| Berry benefit copy/icon | 5.660 | 4.5 / 3 |
| Primary/default → hover | 5.721 → 6.732 | 4.5 |
| Cart / lịch summary helper | 4.834 / 4.837 | 4.5 |
| Picker day/time selected-strong | 5.876 / 5.727 | 4.5 |
| Picker day/time focus trắng trên selected | 5.876 / 5.727 | 3 |
| Selected-soft day/package | 11.429 / 11.422 | 4.5 |
| Submenu selected/helper | 4.698 | 4.5 |
| Input border / focus | 3.609 / 8.928 | 3 |
| Fallback blush/helper không color-mix | 4.507 | 4.5 |
| Fallback action | 6.628 | 4.5 |

Đây là mẫu các role/state đã render, không phải chứng nhận mọi pixel của mọi component. Vùng lấy mẫu bỏ góc bo/viền để không trộn nền ngoài shape. Endpoint action trắng có cận bảo thủ khoảng 5.62:1 theo công thức token. Unsupported-color-mix được kiểm tra bằng bỏ đúng block `@supports` của token trong browser; không giả định background-color bên dưới cứu được declaration không parse.

## Nghiệm thu SG-01–18

| ID | Kết quả / bằng chứng |
| --- | --- |
| SG-01–04 | Tất cả nhóm Store có mapping; Home/default card cùng role. Có 40 ảnh route, ảnh hoa nguyên màu. Không bật journal đang comment. |
| SG-05 | Empty/populated/edit/checkout/receipt có ảnh; luồng order mock trả 201 và xóa cart sau receipt. Xem prerequisite quantity bên dưới. |
| SG-06 | About/blog/article/contact kiểm tra runtime; policy chưa xuất bản, mapping `.article-title`/`.prose` kiểm tra source và article dùng chung. |
| SG-07–09 | Header/footer, submenu/mobile portal, date/time portal, selected soft/strong, primary/secondary/icon/text đã kiểm tra. Backdrop/z-index/focus trap không sửa. |
| SG-10–11 | Các role và state trong bảng contrast đều đạt ngưỡng. Berry helper/icon và picker trắng được đo riêng. |
| SG-12 | Bỏ selected và disable không giữ image; kiểm tra focus keyboard, restore khi đóng và control boundary. |
| SG-13 | 20 route × 360/390/768/1024/1440px = 100 trường hợp, không overflow; bao gồm cột product Thời hẹp. |
| SG-14 | Reduced-motion nội dung hiện đủ; forced-colors selected có outline/cue; no-JS Home/service/404 còn nội dung. Không thêm motion/loop/shimmer/JS render màu. |
| SG-15 | Root/product/policy 404 thực tế nhận scope Store. Empty và form error/success có ảnh. Shop error/retry và cart loading kiểm tra source, không ép lỗi server production. |
| SG-16 | Admin/auth/preview không nhận token khi tải trực tiếp và qua mounted AppRouter từ Store, gồm `/admin/khong-co`, `/xem-thu/khong-co`. Chỉ môi trường auth chưa cấu hình; không kiểm tra admin đã đăng nhập. |
| SG-17 | Diff không chạm domain/API/schema/DB/content/pricing/SEO/routing/carousel. |
| SG-18 | Report, matrix, before/after, state/portal/contrast, commands và giới hạn nằm trong thư mục này. |

## Commands và giới hạn

Chạy trong repository, với Node/npm hiện có:

```powershell
npm run lint
npm run typecheck
node scripts/local-hoa-thoi.mjs --build --webpack
node scripts/local-hoa-thoi.mjs --serve --port 3101
```

Ở terminal khác, kiểm tra gradient/navigation/widget:

```powershell
npx playwright test --config playwright.gradients.config.ts store-gradients.spec.ts widgets.spec.ts landing-navigation.spec.ts
node scripts/review-store-gradients.mjs before
node scripts/review-store-gradients.mjs after
node scripts/verify-store-gradients.mjs
```

Suite bổ sung inquiry/comment/validation cùng các test trên:

```powershell
npx playwright test --config playwright.gradients.config.ts store-gradients.spec.ts widgets.spec.ts landing-navigation.spec.ts shop.spec.ts --grep-invert 'home, navigation, keyboard and images|mixed cart persists|checkout saves mixed services|lost response retries|failed submissions keep cart'
```

Khởi động lại fixture server trước khi chạy lại các test comment: mock comments nằm trong memory và test cũ dùng cùng nội dung ở mỗi project. Không rebuild vào `.next-feedback` khi server `--serve` đang dùng chính thư mục đó.

Lint không có error; 7 warning có sẵn trong QuantityField/RecurrenceFields/carousel/benefits. Typecheck và webpack production build local TEST/MOCK pass. Suite UI kiểm tra 34 trường hợp: 33 qua lượt đầu, 1 test focus ở widget preview ngoài Store bị flaky và qua khi chạy lại riêng. Kết quả trong [verification/playwright.json](verification/playwright.json) và [verification/widget-rerun.json](verification/widget-rerun.json). Các test gradient mới đều qua; không sửa logic modal để xử lý flake của preview.

`npm test`: **162 pass, 11 fail**, đều trong unit carousel `tests/unit/store-feedbacks.test.ts`. HEAD đang dùng interval 1500ms trong `carousel-autoplay.ts`, còn test kỳ vọng 3000ms. File này và test/domain không bị sửa trong task màu.

Lỗi baseline ngăn chạy flow đặt hàng nguyên bản: `QuantityField` đã comment input `name="quantity"`, vì vậy ProductForm đọc FormData thành quantity=0 và báo lỗi. Luồng mock trong script verification bổ sung hidden quantity=1 **chỉ vào DOM fixture**, rồi dùng handler/API mock hiện có; không sửa app để che lỗi này. `RecurrenceFields` cũng comment spinbutton input, nên review lịch dùng nút tăng/giảm đang render để chọn 2 bó × 2 combo, không thay logic.

Policy duy nhất trong content là draft, không bật publish để chụp ảnh. Contact/logo thực tế và admin/Clerk đã xác thực chưa được kiểm tra bằng dữ liệu/credentials thật. Calendar và portal đã kiểm tra trong Chromium; chưa kiểm tra engine Safari/Firefox hoặc thiết bị thật. Các flow thử chỉ chạy trên launcher local với DATABASE_URL/Clerk/Blob bị xóa khỏi environment và DATA_ADAPTER=mock.
