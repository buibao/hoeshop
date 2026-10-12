# Hòe — Store text animation v3

Triển khai local theo spec 12/10/2026, trên branch `feedbacks`, HEAD `2a6843a5ba97f088ae25caf71d1d297b0d926ad9`. Baseline là working tree đang có motion v1 và Gradient v2.1, được build và ghi hình trước khi sửa. Không reset, stage, commit, push, PR, deploy hoặc chạy migration/submit vào DB thật.

[Mở video review trước–sau](review.html). [Diff riêng của task](implementation.diff) so với baseline local; không bao gồm các thay đổi đã có trước task. [So sánh protected sections](comparison.json) ghi SHA-256 source và geometry thực tế ở 1440/390px.

[Cải thiện độ mượt khi cuộn](smoothness/README.md): chỉ animate `transform`/`opacity` cho text không có inline link; gom đo layout; tránh tái tạo observer khi root height không đổi; chạm để bắt đầu cuộn không còn kết thúc entrance, kể cả trong section có `tabindex="-1"`. Hai mẫu đo cuối cùng với CPU slowdown 4× cho thấy thời gian tính style giảm 56.9% / 50.0% ở 1440 / 390px. Preset v3 và các owner Hero/carousel/Lenis giữ nguyên.

## Cơ chế và interface

- `StoreTextReveal`: semantic tag, `role=page|heading|eyebrow|body`, `delayMs`, `initial`, `disabled`; giữ attributes và markup inline. `StoreTextRevealGroup` phối 0/90/180ms, cap 180ms. Card copy dùng body preset; không delay theo index toàn catalogue.
- `StoreTextExemption` và `StoreTextRoot` không thêm wrapper layout. Root ref được đọc sau commit để tránh child effect chạy trước ref của parent. Hai IntersectionObserver dùng chung theo root: trigger 8–85%, reset outside+120px. Margins tính bằng px từ root height; mỗi callback kiểm tra lại box tĩnh hiện tại để tránh rectangle cũ sau cuộn nhanh/resize.
- SSR visible. Các load-target có parser script hữu hạn, khởi chạy WAAPI trước paint; hydration tiếp quản effect đó. Late paint, history/hash, focus, selection/find, reduced/forced colors và lỗi API ưu tiên visible. Các listener/observer/media query được cleanup khi target cuối cùng rời root.
- WAAPI chạy theo thời gian; opacity và translateY chỉ trên copy. `--store-text-y` giữ inline anchor ở vị trí layout cuối, đồng bộ phần copy bên trong. Focus/click settle trước handler; focus trên anchor và trong form ngăn reset. Fallback cho scroll jump không có input cue giữ readability; khoảng bảo vệ bao phủ momentum Lenis hiện có, không sửa Lenis.

| Role | Desktop | Mobile |
|---|---|---|
| Page | 56px / 1000ms | 40px / 900ms |
| Section heading | 48px / 950ms | 32px / 850ms |
| Eyebrow/caption | 24px / 800ms | 20px / 750ms |
| Body/card copy | 32px / 900ms | 24px / 800ms |

Ease: `cubic-bezier(0.22, 0.61, 0.36, 1)`. Preparation offscreen dùng effect **paused**; record duration 1ms của preparation không phải duration entrance. End state trở về opacity 1/transform none, không giữ fill hoặc transform dư.

## Inventory và coverage

| Owner | Xử lý |
|---|---|
| Home `.olf-hero` / `LandingHeroMotion` | Exempt qua context; title/photo/ornament/timeline, helper geometry, Root MotionProvider, fonts và Lenis giữ nguyên source. |
| `FeaturedProductCarousel` | Exempt toàn subtree; giữ nguyên caller `LandingScrollFade`, controller/autoplay, controls, hover và geometry. Home ProductCard không opt-in. Không tìm thấy gallery slider khác trong Store hiện tại. |
| Home benefits/services/story/process/FAQ/CTA | Text riêng dùng v3; các wrapper cũ trở thành static với cấu trúc layout cũ. Benefits tiếp tục disabled stack/rotation. Story photo giữ motion cũ. Các section đang comment không được bật lại. |
| Catalogue, Product Tâm/Thời/Ý, Service Tâm/Thời/Ý | Page headings và copy editorial; ProductCard ngoài slider opt-in. Giá, CTA và controls immediate. |
| Hoa Thời | Gỡ `ht-hero-enter`; reveal page heading, recommendations intro/copy, form/calendar/contact headings, mẫu hoa và footer. Giá/count/date/selected/status không nằm trong layer. |
| About/blog/article/policy/contact | Headings, caption/date metadata, paragraphs. Markdown dùng renderer semantic từng đoạn, giữ emphasis/link/list; không observe cả bài dài. |
| Cart/checkout/receipt/comment | Page headings và intro/helper tĩnh; quantity, totals, live regions, receipt và comment mới immediate. Form/draft/key không bị remount để replay. |
| Header, menu, date/time picker | Navigation và controls immediate. Copy đang nằm trong surface có native entrance giữ owner hiện tại để tránh double animation. Scroll-root capability kiểm chứng bằng clipped-container harness; portal/focus lifecycle kiểm chứng bằng picker/menu suites. |
| Footer, empty, Store 404/error | Text riêng; logo/background/hit areas tĩnh. Internal Admin/auth/preview fallback không có Store targets. |

## Kiểm chứng

Local production build dùng launcher `local-hoa-thoi.mjs`: `CONTENT_MODE=test`, `DATA_ADAPTER=mock`, credentials DB/Clerk/Blob được clear trong process. Flow được kiểm chứng: chọn gói/ngày/quantity → state và summary tức thời → `/api/orders`, `/api/inquiries`, `/api/comments` → mock adapter → receipt/status, retry và draft.

- [Lint](lint.log), [typecheck](typecheck.log), [build](build.log), [unit](unit.log).
- [Text suite sau tối ưu](smoothness/text-no-trace.log): 30 pass, 2 skip có chủ đích — wheel chỉ desktop; responsive widths chạy một lượt desktop. [Lượt v3 trước tối ưu](text-e2e.log) được giữ để đối chiếu.
- [Regression mở rộng](e2e.log): lưu cả kết quả thất bại trước khi sửa follow-up; không phải log xanh cuối. Bao gồm text, gradient, motion, select, Hero/navigation/back-to-top, retry và các flow checkout/inquiry/comment.
- [Kiểm tra lặp sau sửa touch](smoothness/targeted.log): 12/12 pass cho replay/jitter và touch-scroll/control trên hai project. [Hồi quy flow cuối, tắt trace](smoothness/flows-no-trace.log): 46 pass, bao gồm gradient, motion, select và các flow checkout/inquiry/comment. Kết hợp text suite cuối: 76 pass, 2 skip.
- [Lượt bật trace](smoothness/final-e2e.log) còn fail không đều khi `.ht-fields` có height 0, dù CSS computed là visible; descendants trả rect 0. Controller hiện bypass visible và không prepare/reset từ box 0. Chưa xác định dứt điểm nguyên nhân tương tác layout/container-query/trace; không tuyên bố toàn bộ suite bật trace đã xanh. Lượt tắt trace và video độc lập dùng để kiểm chứng behavior; không coi việc tắt trace là sửa lỗi layout.
- [Before](before/report.json) / [after](after/report.json): keyframes/timing khi entering, jitter/replay/focus, browser errors và protected geometry. `comparison.json` xác nhận 9 protected sources giữ SHA; Hero transforms/opacity/dimensions và slide dimensions trùng ở hai viewport.

| Criteria | Bằng chứng |
|---|---|
| TR-01–02 | Fresh Hoa Thời: một entrance, owner CSS cũ đã gỡ; desktop/mobile keyframes và timing đo từ effect. |
| TR-03–07 | Below-fold, trigger 85%, pause-scroll completion, replay hai chiều, jitter và bounded group delays. |
| TR-08 | Fresh load, soft nav, restored history/hash, parser takeover, late initialization và chunks hydration chậm. |
| TR-09–10 | Calendar/quantity/price/status immediate; focus/click/hash/skip/find bypass; anchor box giữ vị trí trong entrance, focus ngoài reset vẫn visible. |
| TR-11 | Source hashes + clips và geometry trước–sau Hero/carousel; autoplay/focus/overlay/fitting tests. |
| TR-12 | Route matrix toàn Store và SSR Markdown renderer; policy hiện tại giữ 404 vì chưa publish. |
| TR-13–14 | Gradient/owner tests, native headings/markup/links/Vietnamese SSR, static shells và end-state styles; không đổi palette/fonts. |
| TR-15 | 360/390/768/1024/1440; 390×420 và layout tương đương zoom 720×450. |
| TR-16 | No-JS, slow hydration, missing/throwing observer, live reduced/forced colors. |
| TR-17 | Cleanup harness về 0 pool; clipped root/tall target, portal lifecycle và client navigation isolation. |
| TR-18 | Checks và mock API flows; domain/API/DB/pricing schemas không đổi. |

## Chạy lại và giới hạn

```powershell
npm run lint
npm test
node scripts/local-hoa-thoi.mjs --build --webpack
npm run typecheck
npx playwright test --config playwright.motion.config.ts store-text.spec.ts store-motion.spec.ts store-gradients.spec.ts store-select.spec.ts landing-motion.spec.ts landing-navigation.spec.ts home-scroll-fade.spec.ts retry-cart.spec.ts shop.spec.ts --grep-invert 'home, navigation, keyboard and images|mixed cart persists' --max-failures=3
```

Chạy build và typecheck tuần tự: build thay generated types trong `.next-feedback`. Một lần chạy đồng thời đã gặp TS6053; typecheck đã được chạy lại sau build.

Record: mở server fixture `node scripts/local-hoa-thoi.mjs --port 3101 --serve`, rồi `node scripts/review-store-text.mjs`. `--before` chỉ dùng trên baseline thật trước sửa; không xóa CSS để giả lập.

Lượt mở rộng ban đầu có 4 assertion legacy fail: banner test trong ShopLayout, input quantity editable và carousel position/manual-pause controls. Các UI này đã bị comment trong baseline; không khôi phục UI hoặc sửa assertions ngoài scope v3 để làm xanh. Các flow tương ứng còn dùng được được kiểm chứng bằng suites hiện hành. Lint có 7 warning unused sẵn có, 0 error.

Browser tests dùng Chromium, kể cả project iPhone. Zoom là viewport tương đương, không điều khiển browser zoom thật; BFCache kiểm tra `pageshow.persisted` mô phỏng và history thật trong SPA, không khẳng định cache admission native. Find shortcut/selection và scroll-jump fallback đã kiểm chứng, không điều khiển menu Find của browser. Policy đang là draft, nên runtime route kiểm tra 404; renderer prose đã có SSR test với policy sample. Không kiểm chứng DB thật hoặc deployment production.
