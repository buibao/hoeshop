# Kiểm chứng checkpoint Home

Baseline `0217f4d`, ngày 05/10/2026. Kết quả đang được bổ sung sau khi chạy; chưa được shop duyệt.

- Unit: 61 ca đạt, gồm 58 nghiệp vụ baseline và ba ca composition featured/empty/fallback/long copy.
- Lint/typecheck/build đạt. Build sạch đã chạy riêng để loại cache Untitled cũ, sau đó build chuẩn đạt không còn lỗi resolve CSS. Không commit thay đổi tsconfig do thư mục build kiểm chứng sinh ra.
- Full E2E Chromium fixture: 52/52, gồm 26 desktop và 26 mobile; sau tăng vùng chạm shell ≥44px chạy lại sáu ca navigation/geometry/motion, đều đạt.
- Widths 360/390/768/1024/1440px, reflow tương đương zoom 200% ở viewport CSS 720px, tắt JS, copy dài, bàn phím, menu focus/Escape, giỏ trộn, hai tab, retry, tư vấn/bình luận và guest admin guards đạt trên local fixture. Chưa gọi kiểm tra tương đương là thao tác zoom native hoặc Safari/iOS thật.
- Lighthouse baseline Preview phase 3: performance 85/91/84, median 85; LCP 3206/2910/3755ms, median 3206ms; CLS 0 cả ba. Cùng Chromium/Lighthouse/mobile simulated throttling, có quyền đọc Preview. Kết quả mới bổ sung sau deploy.
- Fixture browser tách khỏi Neon/Clerk/Blob operator; không coi receipt mock là lưu DB Preview.
- Google admin, Blob UI và Safari/iOS thật không thuộc bằng chứng mới của lượt Home này. Những tồn đọng phase 3 vẫn giữ nguyên.

## Preview đã kiểm tra

Source commit: `adb136ede9c77e68450478bbfe110d49e70a64e4`. Baseline: `0217f4d11b093b9912a9ac8ba878b656aed3bc07`. Các commit sau chỉ ghi tài liệu/minh chứng nếu không có thay đổi source.

Deployment `dpl_KewCJNRjfUuJPacbfZznJwsEUCn4`, READY, region sin1: [Home Preview](https://hoeshop-6kizqf7up-buibaos-projects.vercel.app). Alias nhánh: https://hoeshop-git-feat-oh-les-fleurs-home-buibaos-projects.vercel.app . Preview có bảo vệ; dùng share link cấp riêng hoặc tài khoản Vercel phù hợp, không lưu token trong repo.

Browser thật qua agent-browser và Playwright: 1440/390px Home/menu/cards/footer, Home → chi tiết → cấu hình → giỏ → checkout, không gửi đơn. Không page/console errors hoặc overflow; menu ArrowDown/Escape/return focus và reduced motion đạt. Kiểm tra bổ sung Home tại 360/768/1024px không overflow. Draft 404, guest admin API 401. Đợt capture không có API writes.

Neon Preview read-only: marker preview, ba sản phẩm published và một draft; assets.hero/story chưa cấu hình, hiện dùng fixture/fallback. Branch env có Postgres/Clerk/Blob/rate limit/admin allowlist, CONTENT_MODE=test và SHOP_LIVE=false. Không ghi dữ liệu, upload ảnh, seed hoặc migration trong lượt redesign này. Không suy diễn kiểm tra đọc Store thành UAT nhận đơn hoặc Google/Blob thật.

## Hiệu năng trước–sau

Cùng Lighthouse/Chromium trên máy kiểm thử, mobile simulated throttling, ba lần cho mỗi Preview; site test từ cùng DB, không chạy build/E2E đồng thời trong đợt đo sau. Chỉ lưu report đã rút gọn, không chứa headers/cookies.

| Median | Phase 3 trước | Home mới |
| --- | --- | --- |
| Performance | 85 (85/91/84) | 95 (95/95/90) |
| LCP | 3206ms | 2468ms |
| CLS | 0 | 0 |
| TBT | 239ms | 181ms |
| JS transfer toàn trang | 245856 bytes | 246017 bytes |
| Tổng transfer | 483929 bytes | 492258 bytes |

LCP median giảm khoảng 23%; JS gần như giữ nguyên (+161 bytes), tổng transfer tăng khoảng 8,3KB do composition/ảnh. Một lần đo sau có CLS 0.0033, hai lần là 0. Các số đo là kết quả kiểm thử này, không cam kết điểm cho mọi thiết bị/mạng. [Chi tiết ba lần đo](screenshots/performance-report.json).

## Ảnh và video

Ảnh trước và sau cùng viewport CSS 1440×960, 390×844; mobile chụp ở device scale của Pixel 7 nên ảnh file lớn hơn số CSS pixels. Before chụp từ rollback phase 3 `0217f4d`; after/video từ source `adb136e`. Toolbar Vercel chỉ được ẩn lúc capture.

| Màn | Desktop | Mobile |
| --- | --- | --- |
| Màn hình đầu trước | [Ảnh](screenshots/1440-before-home.png) | [Ảnh](screenshots/390-before-home.png) |
| Màn hình đầu sau | [Ảnh](screenshots/1440-after-home.png) | [Ảnh](screenshots/390-after-home.png) |
| Home đầy đủ | [Ảnh](screenshots/1440-home-full.png) | [Ảnh](screenshots/390-home-full.png) |
| Menu/focus | [Ảnh](screenshots/1440-menu.png) | [Ảnh](screenshots/390-menu.png) |
| Featured/card | [Ảnh](screenshots/1440-products.png) | [Ảnh](screenshots/390-products.png) |
| Footer | [Ảnh](screenshots/1440-footer.png) | [Ảnh](screenshots/390-footer.png) |
| Motion/menu/hover/navigation | [Video WebM](screenshots/1440-interaction.webm) | [Video WebM](screenshots/390-interaction.webm) |

[Ảnh reference từ video Wokine](screenshots/reference-desktop-video-frame.png), [mapping](REFERENCE_MAPPING.md), [browser report](screenshots/browser-report.json) và [assets còn thiếu](ASSETS.md).

## Giới hạn nghiệm thu

Chưa được shop duyệt checkpoint Home, chưa có ảnh/logo/catalog thật cho nghiệm thu hình ảnh cuối. Safari/iOS thật, screen reader trên thiết bị thật và zoom native chưa được kiểm thử; Chromium touch/reflow tương đương được ghi riêng. Google admin/non-admin/Blob UAT còn giữ trạng thái baseline phase 3, không gọi mock là provider thật.

Không commit cookies, bypass tokens, raw Lighthouse report có headers, secrets hoặc dữ liệu khách. `SHOP_LIVE=false`; không production deploy. Dừng tại Home để shop lựa chọn hướng thiết kế, chưa mở rộng redesign catalog/detail/cart/checkout/Admin.
