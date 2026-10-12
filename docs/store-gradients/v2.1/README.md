# Store Gradient v2.1 — bàn giao local

Thực hiện spec ngày 11/10/2026, branch `feedbacks`, HEAD `2a6843a5ba97f088ae25caf71d1d297b0d926ad9`. Baseline so sánh là **bản gradient v2.0 đang có trong working tree**, không phải bản remote chưa có gradient. Ảnh trước được chụp trực tiếp từ production build local trước sửa v2.1, không xóa CSS để giả lập baseline. Bản v2.0 được giữ ở thư mục cha.

[manifest.json](manifest.json) ghi HEAD, fixture, các check và SHA-256 source/spec. [working.diff](working.diff) là toàn bộ diff ứng dụng/test/script so với HEAD, gồm phần gradient v2.0 local và revision v2.1; không stage/commit thay đổi.

## Thay đổi

- `StoreHeading` là wrapper tĩnh toàn chiều rộng, với container hiện có bên trong. Catalogue, cart, checkout, About, blog/article/policy, contact và service dùng wrapper này. Text measure/gutter, nội dung và các phần tử tương tác giữ nguyên.
- Product có `.store-detail-section` bao toàn grid ảnh + copy. `.page-heading`, `.article-title`, `.detail-copy` không còn gradient riêng. Home giữ background ở outer section hiện có; không đổi node motion.
- Header/footer có role riêng, container/logo transparent. Dải ivory của shell được giữ ở vị trí logo, mở rộng trên mobile để chứa vùng logo 130px; không thêm ô trắng, tint/filter lên ảnh hay thay hình logo. Footer chuyển blush → champagne → peach.
- Product/checkout/inquiry/comment/cart edit/Hoa Thời form dùng `--store-gradient-form`; calendar/modal dùng calendar/form role. Input, ô ngày và legend ivory; summary vẫn đậm hơn. Không thêm card lồng hoặc padding mới vào Hoa Thời.
- Submenu có một gradient trên Link item khi hover/focus-visible; decoration bị gỡ tại Link owner, cả desktop/mobile. Current giữ `aria-current` và tên accent; không có gradient cố định. Nav cấp trên và backdrop giữ vai trò riêng.
- Token chỉ trong StoreScope và portal root. Primitive palette, semantic error/success, fonts, API/schema/DB, giá, validation, state/draft và animation/carousel không đổi. Root fallback Store có scope; Admin/auth/preview giữ riêng.

## Review ảnh

Mở [bảng so sánh ảnh](review.html). Ảnh full page 390px và 1440px ở [before](before/) / [after](after/); crop và trạng thái ở `before/states` / `after/states`. Ảnh palette thật dùng reduced motion để chụp ổn định, sau khi fonts/ảnh tải xong. Forced colors và fallback được tách riêng trong [verification](verification/).

Đã xem trực tiếp checkout, product, calendar và menu ở hai kích thước **trước khi chạy automation dài**. Nền heading phủ ngang section thay vì chỉ cột trái; product ambient bao cả ảnh/copy; form/calendar dịu hơn summary; chuyển màu shell nhìn thấy được. Menu hover/focus không underline tên/mô tả, current route không tạo mảng highlight cạnh tranh. Lượt chụp bổ sung đưa focus về trigger trước hover từng item, tránh ảnh đồng thời giữ focus item trước và hover item sau.

Ảnh locator có thể đưa skip-link vốn nằm ngoài viewport vào crop dài của Playwright; ảnh priority mới ẩn riêng skip-link **không có focus** khi chụp. Không sửa CSS skip-link của app. Review trạng thái không gửi request đặt hoa/bình luận; script verification riêng có gửi vào mock local.

| Nhóm | Route | Ảnh |
| --- | --- | --- |
| Home | `/` | `home` |
| Catalogue | `/san-pham` | `catalogue` |
| Product Tâm/Thời/Ý | `/san-pham/mau-test-diu-dang`, `/san-pham/mau-test-hoa-thoi`, `/san-pham/mau-test-nang` | `product-tam`, `product-thoi`, `product-y` |
| Service Tâm/Thời/Ý | `/dich-vu/hoa-tam`, `/dich-vu/hoa-thoi`, `/dich-vu/hoa-y` | `service-tam`, `service-thoi`, `service-y` |
| Cart/checkout rỗng | `/gio-hang`, `/dat-hoa` | `cart-empty`, `checkout-empty` |
| Cart có hàng/edit, checkout có hàng | Cùng các route trên, browser fixture quantity | `states/cart-populated`, `cart-edit`, `checkout` |
| About/blog | `/ve-hoe`, `/blog` | `about`, `blog` |
| Article/comment | `/blog/chuyen-cua-hoe` | `article`, `states/comment-error-focus` |
| Policy chưa xuất bản | `/chinh-sach/ban-hang` (404) | `policy-unpublished` |
| Contact/inquiry | `/lien-he` | `contact`; verification `inquiry-error`, `inquiry-success` |
| Store fallback | `/khong-co-trang-nay`, `/san-pham/khong-co-mau` | `404`, `product-404` |
| Ngoài Store | `/admin`, `/dang-nhap`, `/xem-thu/widgets` | `admin`, `auth`, `preview` |

Menu có default/current và hover/focus cả ba item trên desktop/mobile. Calendar có 3/4 và đủ ngày; product error, checkout input focus, comment error/focus, picker day/time selected và focus, receipt/retry, forced colors/no-color-mix/no-JS đều có ảnh. Bản trước comment được chụp trạng thái mặc định trong ảnh full-page article; crop error/focus là bằng chứng bổ sung của bản mới.

## Kiểm tra và đo

- [low-viewport.json](verification/low-viewport.json): 390×420px và mô phỏng 200% bằng CSS viewport 720×450px/DPR 2; bốn route không overflow, picker nằm trong viewport (10 checks). Đây là kiểm tra tương đương layout khi zoom, không tự động đổi thiết lập zoom của browser.
- Lint: pass, 0 lỗi; 7 warning sẵn có tại QuantityField, RecurrenceFields, FeaturedProductCarousel và LandingBenefitsMotion, không thuộc diff này.
- Typecheck: pass. Production build mock/webpack: pass, content schema hợp lệ; [build.log](build.log).
- 30 test desktop/mobile: gradient roles, owner full width, submenu hover/focus/current/Escape, picker selection/cancel/focus/disabled, Store isolation sau client navigation, Home navigation/geometry/reveal và widgets 360–1440px/Admin authorization.
- 6 test form hiện có: inquiry, bình luận escaped/persist, draft route/validation. Pass. Không rewrite domain tests để làm business pass.
- Test submenu được chạy riêng sau bổ sung kiểm tra các item còn lại không nhận gradient; hai viewport pass. Gradient suite được chạy lại trên build cuối sau điều chỉnh điểm màu shell mobile.
- [routes.json](after/routes.json): 40 ảnh route/viewport, không browser error/overflow; policy/404 giữ HTTP 404. [geometry.json](geometry.json): không thay đổi x/y/width/height quá 1px ở 140 anchor được đo so với v2.0, gồm heading, ảnh/grid, service hero, prose, flow và footer.
- [verification/report.json](verification/report.json): 100 ca responsive ở 360/390/768/1024/1440px. 47/47 phép đo contrast đạt ngưỡng. Contrast lấy từ nền raster browser thực tế, giữ ancestor/layer, tạm ẩn copy, lấy mẫu mỗi 2px bên trong bề mặt; không dùng average/endpoint. Text ngưỡng 4.5, boundary/focus/icon ngưỡng 3. Các nền đã đo lưu dưới `background-*.png`. Footer/helper, ambient, form/calendar, summary, menu hover/focus và picker selected được đo lại cho v2.1.


| Nền/state | Tỷ lệ thấp nhất | Ngưỡng |
| --- | ---: | ---: |
| header navigation | 5.720 | 4.5 |
| header icon | 11.810 | 3 |
| footer helper | 4.757 | 4.5 |
| footer links | 11.543 | 4.5 |
| ambient helper | 4.824 | 4.5 |
| blush helper | 4.868 | 4.5 |
| warm helper | 5.067 | 4.5 |
| card helper | 5.021 | 4.5 |
| berry benefit copy | 5.660 | 4.5 |
| berry benefit icon | 5.660 | 3 |
| primary action | 5.721 | 4.5 |
| primary hover | 6.732 | 4.5 |
| detail ambient helper | 4.824 | 4.5 |
| product form helper | 5.217 | 4.5 |
| form adjacent boundary | 3.417 | 3 |
| input boundary | 3.609 | 3 |
| input focus | 8.928 | 3 |
| form adjacent focus | 8.451 | 3 |
| invalid input boundary | 7.115 | 3 |
| cart summary helper | 4.834 | 4.5 |
| checkout heading helper | 4.824 | 4.5 |
| checkout form text | 12.659 | 4.5 |
| checkout form helper | 5.217 | 4.5 |
| picker calendar text | 12.824 | 4.5 |
| picker form helper | 6.185 | 4.5 |
| picker selected day | 5.876 | 4.5 |
| picker day focus | 5.876 | 3 |
| picker selected time | 5.721 | 4.5 |
| picker time focus | 5.721 | 3 |
| inquiry form text | 12.659 | 4.5 |
| schedule form helper | 5.182 | 4.5 |
| calendar helper | 5.289 | 4.5 |
| calendar icon | 5.289 | 3 |
| selected soft day | 11.429 | 4.5 |
| schedule summary helper | 4.837 | 4.5 |
| selected soft package | 11.422 | 4.5 |
| mobile header icon | 11.810 | 3 |
| mobile footer helper | 4.771 | 4.5 |
| submenu hover helper | 4.741 | 4.5 |
| submenu focus helper | 4.741 | 4.5 |
| submenu focus outline | 7.679 | 3 |
| desktop submenu hover helper | 4.741 | 4.5 |
| desktop submenu icon | 5.570 | 3 |
| article heading | 11.704 | 4.5 |
| comment form text | 12.659 | 4.5 |
| fallback blush helper | 4.507 | 4.5 |
| fallback action | 6.628 | 4.5 |

Lệnh tái hiện, chỉ local mock:

```powershell
node scripts/local-hoa-thoi.mjs --build --webpack
node scripts/local-hoa-thoi.mjs --serve --port 3101
node scripts/review-store-gradients.mjs after v2.1
node scripts/review-gradient-priority.mjs after
node scripts/verify-store-gradients.mjs --v2.1
npm run lint
npm run typecheck
$env:STORE_GRADIENT_REPORT_PATH='docs/store-gradients/v2.1/verification/playwright.json'
npx playwright test --config playwright.gradients.config.ts tests/e2e/store-gradients.spec.ts tests/e2e/landing-navigation.spec.ts tests/e2e/widgets.spec.ts
```

`review-store-gradients ... before v2.1` chỉ chạy khi build đang là v2.0; không tái tạo ảnh trước bằng app đã sửa. Dừng server trước khi build lại cùng `.next-feedback`.

## Matrix SG-01–18

| ID | Kết quả / bằng chứng |
| --- | --- |
| SG-01 | Mapping toàn Store áp dụng; 20 route × 2 viewport. Policy mapping ở source; nội dung draft chưa có runtime published để review. |
| SG-02 | Một hệ role trên StoreScope; primitive/fonts/semantic states giữ nguyên. |
| SG-03 | Shell full width, gradient riêng; ảnh full page; container/logo transparent. |
| SG-04 | Heading static outer; width = viewport; copy measure/geometry giữ nguyên. |
| SG-05 | Product outer bao cả grid; ảnh không overlay/filter; geometry không đổi. |
| SG-06 | Form product/checkout/inquiry/comment/edit dùng chung form role; ảnh/error/focus. |
| SG-07 | Hoa Thời giữ wrapper/nhóm hiện có; calendar nhẹ, summary rõ; 3/4 và đủ ngày. |
| SG-08 | Gradient trên Link item hover/focus; computed decoration none ở owner/name/description; ảnh từng item. |
| SG-09 | Current accent/aria-current, image none khi không tương tác; trigger không có item gradient. |
| SG-10 | Desktop/mobile cùng token; keyboard/Escape/focus/navigation test pass. |
| SG-11 | Soft ink, strong white; unselect/disabled bỏ image; forced-colors có outline. |
| SG-12 | Các role/state đã lấy mẫu đạt text 4.5, control/focus/icon 3; report nền thực tế mới. |
| SG-13 | 100 ca 360–1440px không overflow; không thêm 100vw/margin âm; geometry không đổi. |
| SG-14 | Portal/root fallback đúng scope; Admin/auth/preview direct và client navigation không leak. |
| SG-15 | Không sửa motion/controller/sticky; Home geometry/reduced-motion/widgets tests pass. |
| SG-16 | Không sửa domain/API/schema/DB/giá/content/validation; wrapper chỉ trình bày. |
| SG-17 | Static CSS; forced colors, fallback color-mix và no-JS Home/service/404 được kiểm tra. |
| SG-18 | Ảnh trước/sau/full page/state, route matrix, contrast/checks/fixture/limits và diff local được bàn giao. |

## Giới hạn xác minh

1. `QuantityField` ở HEAD đã comment input `name=quantity`; thêm vào giỏ theo form nguyên bản thiếu giá trị này. Script review/verification chỉ thêm hidden quantity=1 vào **DOM browser local** để xem cart/checkout. Không sửa source business; flow mock có fixture không chứng minh toàn bộ business app đã pass.
2. Policy `ban-hang` chưa published. Không thay dữ liệu để tạo ảnh trang published; source dùng StoreHeading/prose chung với article đã review.
3. Mock không có logo ảnh/contact/social đầy đủ và không có operator auth thật. Kiểm tra shell/icon/link, CSS không tint/overlay logo và isolation/guest authorization; không tuyên bố đã review tài khoản Admin hay logo gold thực tế.
4. Unit suite ở lượt v2.0 trước đó có 162 pass/11 fail ở kỳ vọng carousel 3000ms so với controller hiện tại 1500ms. Các file đó không đổi trong revision này; không chạy lại full unit hoặc đổi domain tests vì task chỉ sửa surface. Kết quả cũ ghi trong README v2.0.
5. Không push/PR/deploy hay submit DB Preview/production. Server review `http://localhost:3101` dùng launcher mock cô lập. Ảnh và kiểm tra có phạm vi fixture local; số contrast là mẫu nền/role đã ghi, không phải chứng nhận mọi tổ hợp dữ liệu có thể có.
