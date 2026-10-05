# Kiểm chứng motion revision

Ngày 05/10/2026. Baseline `bea475c1e78a0fc127d2b805832e647e747336d8`, branch `feat/oh-les-fleurs-home`. Source cuối `db96d5ac3124198e1f06d682bfbbeb7609f5870b`. Chưa được shop nghiệm thu.

## Kết quả mới tại local

- Lint, typecheck và build đạt. Unit 66/66, gồm composition 0/1/10 benefits, fallback ảnh/catalog trống, featured ordering và geometry responsive, cùng nghiệp vụ cũ.
- E2E Chromium fixture 58/58 (29 desktop, 29 mobile). Sáu lượt mới kiểm tra timeline/reverse/gallery, track/sticky/preference/resize và no-JS desktop. Các lượt mobile có ba bài motion chủ động đổi viewport sang desktop để kiểm tra controller; không gọi đó là motion pinned trên điện thoại.
- Sau sửa góc cạnh cửa sổ thấp và số thứ tự 10, chạy lại toàn bộ Home/navigation/motion: 20/20 (10 mỗi profile), gồm kiểm tra 580/600/620px không dao động mode. Không gọi đây là một lượt full suite 60/60. Unit 66/66 và lint/typecheck đạt trên source cuối.
- Build cuối với profile local hiện có exit 0 nhưng có cảnh báo timeout kết nối Neon trong lúc collect pages; không coi đó là build DB sạch. Build fixture tách credentials đạt, không có cảnh báo DB. Cloud build Preview thật READY; runtime Store được kiểm tra riêng dưới đây.
- Hồi quy cấu hình → giỏ → checkout với receipt mock, giỏ trộn/hai tab/retry, tư vấn, bình luận, draft/guest, menu keyboard và date/time picker đạt. Local tách khỏi Neon/Clerk/Blob, không suy diễn receipt mock thành lưu DB thật.
- Automation riêng thay **file content local** tạm thời rồi restore nguyên bản: 0/1/10 benefits, long title/intro/card body ở 360/390/768/1024/1440px; không overflow, 10 thẻ có native journey, 1 thẻ tĩnh, copy quá dài không pin. Không seed DB.
- Reduced motion đang mở trang chuyển controller về flow ngay, không cần reload. No-JS có một H1, copy/CTA/link đầy đủ và không tạo stage scroll dài.
- Reference chạy runtime Chromium ở 1440×960 và 390×844, có video/snapshot cùng mốc và chiều cuộn ngược. [Chi tiết transport và mapping](IMPLEMENTATION.md), [observations](reference/observations.json).

## Preview và hiệu năng

Deployment `dpl_3EPVPgp9x5fXnn1sqjvon9dQf1Gk`, region sin1, READY: [Home Preview](https://hoeshop-3531mkt9t-buibaos-projects.vercel.app). Share link cấp riêng, không lưu secret trong repo. Các commit sau chỉ thêm minh chứng nếu không có diff source.

Actual Preview Chromium 1440×960 và 390×844: hero đầu/giữa/cuối, gallery cuối, cuộn ngược, benefits sticky; mobile/reduced/no-JS flow; resize cả chiều rộng và cửa sổ thấp; menu ArrowDown/Escape/return focus; Home → cấu hình → giỏ → checkout. Không page/console errors, overflow hoặc POST API. Draft 404, guest admin 401. Viewport hẹp Preview dùng Chromium desktop ở DPR1; mobile touch profile kiểm tra trong E2E, không phải Safari/iOS thật.

Neon read-only: environment preview, DATA_ADAPTER=postgres, SHOP_LIVE=false; 3 published/1 draft, hero/story chưa cấu hình. Không seed/migrate hoặc ghi dữ liệu. [Browser observations](preview/observations.json), [DB read check](db-read-check.json).

| Minh chứng | Desktop | Mobile |
| --- | --- | --- |
| Trước revision (UI adb136e, bea475c chỉ thêm docs) | [Before](../screenshots/1440-after-home.png) | [Before](../screenshots/390-after-home.png) |
| Hero đầu | [Hòe](preview/1440-hero-start.png) / [Reference](reference/1440-hero-start.png) | [Hòe](preview/390-hero-start.png) / [Reference](reference/390-hero-start.png) |
| Hero giữa | [Hòe](preview/1440-hero-middle.png) / [Reference](reference/1440-hero-middle.png) | [Hòe](preview/390-hero-middle.png) / [Reference](reference/390-hero-middle.png) |
| Hero cuối | [Hòe](preview/1440-hero-gallery.png) / [Reference](reference/1440-hero-end.png) | [Hòe](preview/390-hero-end.png) / [Reference](reference/390-hero-end.png) |
| Benefits | [Hòe](preview/1440-benefits-middle.png) / [Reference](reference/1440-benefits-middle.png) | [Hòe](preview/390-benefits-middle.png) / [Reference](reference/390-benefits-middle.png) |
| Video xuống/lên và tương tác | [Hòe](preview/1440-hoe.webm) / [Reference](reference/1440-reference.webm) | [Hòe](preview/390-hoe.webm) / [Reference](reference/390-reference.webm) |
| Reduced motion | [Hero](preview/1440-reduced-hero.png) / [Benefits](preview/1440-reduced-benefits.png) | [Hero](preview/390-reduced-hero.png) / [Benefits](preview/390-reduced-benefits.png) |
| Không JavaScript | [Ảnh](preview/1440-no-js.png) | [Ảnh](preview/390-no-js.png) |

Các video có cùng viewport và mốc cuộn hero; đây là hai recording riêng, không khẳng định frame đồng bộ tuyệt đối. `.vercelignore` loại docs khỏi gói CLI deploy; source publish bằng Git. Minh chứng lớn dùng GitHub API với phiên Git đã có sau khi Git upload báo HTTP 408. Không force-push, không đổi bảo vệ Preview.

### Lighthouse

Kết quả ba lượt mới và các lần đối chiếu được lưu đầy đủ trong [performance-report.json](performance-report.json); raw report có headers/cookies chỉ ở thư mục ignored. Không chọn riêng lượt cao nhất. Một bộ paired bị chuyển baseline tới Vercel login (JS ~1.4MB) bị loại khỏi so sánh Hòe. Các lượt hợp lệ đều có LCP image của Home; lượt cuối kiểm tra Home access và final URL.

| Median, ba lượt mỗi bản | Baseline đo lại | Source cuối db96d5a |
| --- | --- | --- |
| Performance | 89 (91/88/89) | 68 (68/56/89) |
| LCP | 2919ms | 4340ms |
| CLS | 0 | 0.000114 |
| TBT | 214.5ms | 178.5ms |
| JS transfer toàn trang | 245993 bytes | 247938 bytes |
| Total transfer | 492233 bytes | 494511 bytes |

**Chưa đạt mục tiêu ≥90 và chưa chứng minh không hồi quy.** Đợt đầu baseline 97/86/96 và revision 7595fe1 88/75/94; một đợt bổ sung hợp lệ trên 7595fe1 là 96/96/95. Lưu tất cả để thể hiện dao động, không chọn riêng điểm cao. Source cuối vẫn có LCP/tải trang chậm dù TBT giảm và JS chỉ tăng ~1.9KB; cần tuning/đo tiếp trên môi trường ổn định trước nghiệm thu hiệu năng. Trace breakdown/timings đã rút gọn trong report; chưa đủ căn cứ quy toàn bộ khác biệt cho animation hoặc riêng đường truyền. Không gọi build pass là nghiệm thu motion/hiệu năng.

## Giới hạn còn giữ

Shop chưa duyệt; ảnh test và bouquet lặp chưa là nghiệm thu hình ảnh cuối. Mobile benefits cố ý khác reference: normal flow thay cho pinned ngang. Safari/iOS thật, screen reader thiết bị thật, zoom native chưa chạy; reflow 200% tương đương được kiểm tra trong E2E cũ. Google admin/Blob UAT giữ trạng thái baseline, không thuộc revision Home. Không migration, seed, production deploy hoặc mở nhận khách.
