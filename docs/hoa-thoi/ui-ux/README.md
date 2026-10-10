# Hoa Thời — bàn giao UI/UX và animation

Ngày: 11/10/2026. Branch: `feedbacks`. HEAD trước sửa: `651a5fd`.

## Kết quả

- Trang dịch vụ: Hero → Gợi ý gói → Form chọn lịch → Mẫu hoa. Gợi ý và form liền nhau.
- Nền ivory, giảm card lồng nhau; nhóm form chia bằng khoảng trắng và đường mảnh. Calendar và summary có panel riêng.
- Tuần/Tháng gọn, radio native nhận click toàn label, có tick và focus ring; stepper cao 48px, control/panel dùng radius 10px.
- Tổng “Đã chọn x/N ngày” sát calendar; tiến độ dưới hàng tuần hoặc dưới tháng dùng `scheduleGroups` hiện có. Tuần qua ranh giới tháng dùng cùng group, không thêm engine tính lịch. Không còn “quota” trong copy cho khách.
- Một summary theo thứ tự gói → thời gian nhận → ngày đã chọn → giá tham khảo. Desktop đủ rộng dùng sticky, mobile và cột sản phẩm hẹp xếp sau calendar. Summary cao hơn viewport trở về normal flow, không giới hạn chiều cao nội dung.
- Tái sử dụng Cormorant Garamond / TeX Gyre Termes, Motion và Lenis. Reveal chỉ dành cho gợi ý/mẫu hoa, chạy một lần; form luôn hiện. Chọn ngày cập nhật ngay, tick có vùng dành sẵn; đổi tháng không làm mất focus. Không remount calendar theo gói để tạo animation.
- Một live region ngắn thông báo tiến độ và tháng đang xem; summary không đọc lại toàn bộ sau mỗi click. Reduced motion bỏ transition/translation/stagger và smooth scroll.
- Giữ cấu trúc ảnh/thông tin sản phẩm. Control dùng chung áp dụng vào form sản phẩm và sửa lịch ở giỏ.

Không thay đổi domain, schema, API, server, Admin editor, dữ liệu gợi ý/giá hay content. Thay đổi trong `HoaThoiPackageState.tsx` chỉ phục vụ thời lượng scroll và chuyển focus; các state/handler nghiệp vụ giữ nguyên. Không push, PR, deploy hoặc ghi DB Preview/production.

## Chạy local

```powershell
npm run dev:hoa-thoi
```

- Dịch vụ: http://localhost:3000/dich-vu/hoa-thoi
- Sản phẩm fixture: http://localhost:3000/san-pham/mau-test-hoa-thoi

Launcher có sẵn xóa credential DB/Clerk/Blob khỏi môi trường con và dùng `CONTENT_MODE=test`, `DATA_ADAPTER=mock`, `DB_ENV=test`. Yêu cầu gửi khi smoke được lưu tạm trong bộ nhớ local.

Để chạy bản build đã kiểm tra:

```powershell
node scripts/local-hoa-thoi.mjs --build --webpack --port 3100
node scripts/local-hoa-thoi.mjs --serve --port 3100
```

## Checks

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run typecheck` | Pass. Build cuối cũng hoàn tất TypeScript. |
| `npm run lint` | 0 errors; 4 warnings có sẵn ở `FeaturedProductCarousel.tsx` và `LandingBenefitsMotion.tsx`. |
| `node scripts/local-hoa-thoi.mjs --build --webpack --port 3100` | Pass; validate content TEST, compile, typecheck và generate 25 pages thành công. |
| Playwright Hoa Thời + UI | **24/24 pass**, desktop và mobile, trên bản build local/mock cuối. |
| `git diff --check` | Pass. |
| `npm test` | 162 pass / 11 fail. Cả 11 lỗi thuộc `tests/unit/store-feedbacks.test.ts` về clock carousel trang chủ. File test và `src/features/storefront/carousel-autoplay.ts` vẫn trùng HEAD; không sửa ngoài phạm vi Hoa Thời. |
| JavaScript disabled | Service/product tại 390 và 1440px hiển thị đầy đủ, opacity 1, không overflow. |
| Contrast mẫu body/helper/summary/radio | 5.14:1–13.37:1; xem [số đo](after/contrast.json). |
| Lỗi JavaScript bản build | Không ghi nhận; focus sau gợi ý/link tới form đúng đích. Xem [static review](after/static-review.json). |
| Motion trực tiếp | Pass: reveal không chạy lại khi quay lại, navigation focus giữ nguyên, calendar DOM giữ nguyên, reduced motion transition 0s. Xem [clip](motion/service-desktop.webm) và [số đo](motion/review.json). |

Các E2E bao gồm lịch thiếu/đủ, validation trước khi POST, gói tuần/tháng, đổi gói/bỏ ngày và bản nháp độc lập, giới hạn chu kỳ, retry/network error và request ID, sản phẩm → giỏ → sửa → reload → checkout, giỏ phiên bản cũ, keyboard, reduced motion, summary 52 combo, và 360/390/768/1024/1440px trên dịch vụ lẫn cột sản phẩm hẹp.

Để chạy các E2E bằng cấu hình repo, tắt server dùng port 3100 rồi chạy:

```powershell
npx playwright test hoa-thoi.spec.ts hoa-thoi-ui.spec.ts
```

Lượt nghiệm thu cuối dùng `.local/playwright.hoa-thoi.config.ts` để chạy cùng các test trên server build/mock đã khởi động; cấu hình phụ này không được track. Fixture clock của test là 11/10/2026.

## Ảnh review

| Trang | Trước | Sau |
| --- | --- | --- |
| Dịch vụ desktop | [1440px](before/service-1440.png) | [1440px](after/service-1440.png) |
| Dịch vụ mobile | [390px](before/service-390.png) | [390px](after/service-390.png) |
| Sản phẩm desktop | [1440px](before/product-1440.png) | [1440px](after/product-1440.png) |
| Sản phẩm mobile | [390px](before/product-390.png) | [390px](after/product-390.png) |

| Trạng thái | Dịch vụ | Sản phẩm |
| --- | --- | --- |
| 3/4 ngày desktop | [Ảnh](states/service-three-of-four-1440.png) | [Ảnh](states/product-three-of-four-1440.png) |
| 3/4 ngày mobile | [Ảnh](states/service-three-of-four-390.png) | [Ảnh](states/product-three-of-four-390.png) |
| Đủ ngày desktop | [Ảnh](states/service-complete-1440.png) | [Ảnh](states/product-complete-1440.png) |
| Đủ ngày mobile | [Ảnh](states/service-complete-390.png) | [Ảnh](states/product-complete-390.png) |
| Radio focus desktop | [Ảnh](states/service-radio-focus-1440.png) | [Ảnh](states/product-radio-focus-1440.png) |
| Radio focus mobile | [Ảnh](states/service-radio-focus-390.png) | [Ảnh](states/product-radio-focus-390.png) |

Thư mục `flow/` chứa thêm ảnh gói tháng, lỗi số ngày, kết quả gửi và keyboard từ smoke test. `after/no-js-*.png` ghi nhận giao diện khi tắt JavaScript. Ảnh trước lấy trên dev local; ảnh sau và clip cuối lấy trên bản build local. Ảnh tĩnh không chứng minh chuyển động; dùng clip để review animation.

## Giới hạn xác minh

Hai URL Preview trong spec không đọc được qua công cụ web ở phiên này. Sản phẩm `/san-pham/mau-test-mau-don` không có trong bộ fixture local; review dùng `/san-pham/mau-test-hoa-thoi`, có cùng `ProductForm` và control Hoa Thời. Hình minh họa fixture hiện có được giữ nguyên và có thể khác nội dung Admin/Preview. Không xác minh DB/giá Preview, không gửi yêu cầu tới Preview/production. Keyboard và live-region DOM đã kiểm tra tự động; chưa chạy screen reader thực tế trên thiết bị người dùng.

## Đối chiếu spec

UI-01–03: section/layout/radio đã kiểm tra. UI-04–05: progress, boundary week, summary và sticky/tall panel đã kiểm tra. UI-06–07: font/control và responsive service/product/cart đã kiểm tra. UI-08–09: clip, focus/draft, reduced motion và no-JS đã kiểm tra. UI-10–11: kích thước, hit area, lịch dài và smoke local/mock đã kiểm tra. UI-12: diff trong workspace, bộ ảnh và kết quả checks ở tài liệu này; các giới hạn Preview và unit test ngoài phạm vi nêu ở trên.
