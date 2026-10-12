# Store Animation v1 — local review

Triển khai theo `Hoe_Store_Animation_Spec_v1.md`, trên branch `feedbacks`, local HEAD `2a6843a5ba97f088ae25caf71d1d297b0d926ad9`. Baseline là **working tree đã có Gradient/Select**, không phải ảnh HEAD sạch. Những thay đổi đã stage trước phiên này được giữ nguyên. Không commit, push, PR, deploy hoặc ghi DB Preview/production.

Mở [review.html](review.html) để xem clip trước/sau và ảnh responsive. Metadata route, viewport, preference, fixture và HEAD nằm trong [before/manifest.json](before/manifest.json) và [after/manifest.json](after/manifest.json). Clip tương tác sau thay đổi có 12 scene, không có page error; retry checkout giữ cùng request ID và retry comment giữ draft.

## Hành vi đã triển khai

CSS sở hữu các role Store: feedback 140ms, hover 180ms, overlay mở 240ms/đóng 180ms, reveal 360ms, stagger 50ms cho tối đa bốn phần tử, y 8px desktop/4px mobile, lift 2px và ảnh 1.02. Reveal mới chỉ translate nhóm trang trí khi vào viewport lần đầu, opacity luôn 1; SSR/no-JS không chờ JavaScript để đọc nội dung. Focus hủy effect ngay. Touch không lift/zoom/stagger. Reduced motion đổi trực tiếp, effect mới về 0ms và không displacement.

Giá/count/ngày/time đổi ngay, chỉ nền giá trị được highlight. Tick, disabled và foreground selection không đợi animation. Calendar đổi tháng tức thời, không fade grid. Khi nút tháng trước trở thành disabled, focus chuyển sang nút tháng sau bằng `preventScroll`. Giỏ sửa xong trả focus về nút sửa; xóa trả về row còn lại hoặc CTA khi giỏ rỗng. Không exit animation trì hoãn xóa row.

Date/time modal giữ Bootstrap lifecycle và panel có displacement nhỏ. Modal root luôn opaque để chữ không bị fade. Chặn `transitionend` từ dialog/child nổi lên root: nếu không, Bootstrap nhận nhầm event của child và không hoàn tất close/focus restore. Backdrop vẫn dùng owner Bootstrap. Select portalled root giữ scope Store; AM/PM vẫn `modal={false}` và không căn item với trigger để tránh scroll lock làm sticky summary nhảy.

Theo câu trả lời của bạn, sửa kèm quantity: bổ sung hidden input `name="quantity"` đồng bộ số hiện tại để FormData gửi được vào giỏ. Giữ nguyên UI stepper và con số đang hiển thị. Không đổi API/schema/giá hoặc logic tính lịch.

## Mapping route và owner

| Nhóm | Cách xử lý |
|---|---|
| Home Hero | Giữ toàn bộ component/geometry/config và CSS Hero; không thêm wrapper |
| Home sections | Giữ Home fade replay hai chiều; chuẩn hóa micro hover/link/button ngoài Hero |
| Benefits journey/story | Journey vẫn tắt; không pin/horizontal scroll/parallax mới |
| Featured carousel | Giữ Embla controller, geometry, autoplay clock và control; micro card/image theo token |
| Catalogue/services | Reveal một lần nhóm mẫu/gợi ý đầu tiên, tối đa bốn delay; danh sách dài không stagger tiếp |
| Product Tâm/Thời/Ý | Form luôn visible, giá/quantity/time feedback nền; ảnh/control theo role hiện có |
| Hoa Thời | Recommendation reveal; calendar/form/summary static; tick/count/price tức thời; không wrap sticky summary |
| Cart/checkout/receipt | Cart feedback giá/quantity, focus khi edit/remove; checkout validation/status/receipt giữ tĩnh |
| About/blog/policy | About value cards reveal; blog hover; prose/policy static có chủ ý |
| Contact/inquiry/comment | Form/status/error/success static, micro action; retry/draft không remount |
| Header/mobile menu/submenu | Giữ markup/control; submenu 180ms/y4; Offcanvas/backdrop giữ Bootstrap owner |
| Date/time/Select portal | Scope tại portal root, role overlay; focus trap/Escape/Apply/Cancel giữ owner |
| Footer/back-to-top/FAQ | Contact/prose static; link feedback; back-to-top owner cũ; native details disclosure tối đa 240ms |
| Loading/empty/error/retry/404 | Static copy và control; Store fallback scope hiện có; không page-wide reveal/exit |
| Admin/auth/internal preview | Không nhận role Store; source/static scope và runtime unauthenticated được kiểm tra |

Một thuộc tính có một owner. Không thêm thư viện; package/lockfile không có thay đổi mới từ phiên animation. Gradient giữ tĩnh, không thêm shimmer/loop/shader/video/overlay phủ ảnh. 9 protected source hashes khớp baseline: Hero, geometry, Home fade, benefits, carousel, autoplay, back-to-top, MotionProvider và SmoothScroll. [Hero comparison](hero-comparison.json) ghi độ lệch geometry thực tế.

## Route review matrix

Pass là trong môi trường Chromium local/mock và phạm vi bằng chứng ghi kèm; Partial không được tính như xác minh toàn bộ.

| ID | Kết quả | Bằng chứng / giới hạn |
|---|---|---|
| RV-01 | Pass | Home before/after 1440/390, normal/reduced, top/mid/end; protected hashes và hero-comparison |
| RV-02 | Pass | Home clips xuống/lên, `home-scroll-fade.spec.ts`, long-copy/reduced checks |
| RV-03 | Pass | Unit controller, existing Home tests và motion harness focus/overlay/1/0; baseline Play/Pause và position UI đang comment vẫn giữ nguyên |
| RV-04 | Pass | cards-overlays clips, focus screenshots, catalogue tại 5 breakpoint; không stagger catalogue dài |
| RV-05 | Pass | 3 product fixtures tại 5 breakpoint, product→cart flows và narrow/focus screenshots |
| RV-06 | Pass | 3 service routes ở 5 breakpoint, cards/calendar clips; form không reveal |
| RV-07 | Pass | weekly 3/4→4/4, bỏ/chọn ngày và đổi mode/draft trong store-motion tests + calendar clips |
| RV-08 | Pass | monthly/weekly cross-month test xác nhận 4 ngày duy nhất, không double count |
| RV-09 | Pass | rapid months/focus test, mobile clip, 10-combo long summary và short viewport |
| RV-10 | Pass | actual quantity FormData→add, cart empty/edit/remove/focus; after cart-checkout clips |
| RV-11 | Pass | validation/network failure/retry same ID/success receipt clips; mixed cart/503/concurrent tab existing tests |
| RV-12 | Partial | About/blog/contact runtime + responsive; policy fixture chưa published nên chỉ xác minh fallback/source |
| RV-13 | Pass | Mock inquiry/comment API success + delay + network abort retry clips, comment draft retained; escaped comment/reload test |
| RV-14 | Pass | existing picker/menu tests + clips, Apply/Cancel/Escape/focus/scroll-lock; AM/PM summary geometry regression |
| RV-15 | Pass | back-to-top keyboard/input cancellation/Home-only regression + long native FAQ keyboard/height test |
| RV-16 | Pass | empty/error/retry/404/status fixtures và outside fallback tests; static source owners |
| RV-17 | Pass | pre-load/live reduced + no-JS; SSR reveal never hidden, scripts cover warmed hydration; không mô phỏng mọi tốc độ mạng |
| RV-18 | Partial | Direct + client navigation internal preview/Admin/auth unauthenticated fallback không leak; chưa có authenticated Admin session |

## Acceptance matrix

| ID | Kết quả | Đối chiếu |
|---|---|---|
| AN-01 | Pass | Mapping toàn bộ nhóm route/shared owner ở trên, static có chủ ý |
| AN-02 | Pass | 9 protected hashes + Hero before/after geometry |
| AN-03 | Pass | Home fade owner không đổi, scroll replay/focused content tests |
| AN-04 | Pass | Benefits journey vẫn `enabled=false`, file hash giữ nguyên |
| AN-05 | Pass | Native StoreReveal một lần, first-four delay, opacity 1; không reveal carousel slide |
| AN-06 | Pass | Token lift/image, hover/focus images và touch/reduced regression |
| AN-07 | Pass | Ring/tick/selected instant; keyboard focus và disabled checks |
| AN-08 | Pass | Form/calendar static; draft/mode/time/month state regression |
| AN-09 | Pass | Stable text nodes, không digit flip; chỉ background feedback |
| AN-10 | Pass | Month instant; focus fallback và rapid/cross-month tests |
| AN-11 | Pass | Không thêm wrapper summary; AM/PM geometry, tall summary, mobile/short reading checks |
| AN-12 | Pass | Local browser→API→mock→receipt/comment/inquiry, retry + cart focus |
| AN-13 | Pass | Bootstrap lifecycle và Base UI scroll lock regression; close/focus/Apply/Cancel/Escape |
| AN-14 | Pass | Protected Embla/controller/autoplay nguồn không đổi; unit + harness/flow tests |
| AN-15 | Pass | Gradient static, không effect loop mới; CSS/source review |
| AN-16 | Pass | CSS 0ms + live preference hook, state retained/no displacement |
| AN-17 | Pass | SSR opacity 1, no-JS tests; không page-wide wrappers |
| AN-18 | Partial | Source/direct/CSR outside scope pass; authenticated Admin/auth chưa xác minh |
| AN-19 | Partial | Palette/selection owners giữ contract, representative focus/forced colors/5 widths/short checks; 200% là layout-equivalent, không audit mọi frame/device |
| AN-20 | Pass | Lint/typecheck/build/unit/UI logs; quantity bug fix được bạn cho phép; domain/API/DB/font/layout giữ nguyên |
| AN-21 | Pass | Clip/review/matrix/diff/commands/limits/backlog trong thư mục này |

## Checks và lệnh tái hiện

Kết quả cuối được lưu tại `e2e-final.json`, `e2e-final.log`, `unit.log`, `lint.log`, `typecheck.log`, `build.log`, `responsive.json`. UI chạy trên **production build local fixture**, không dev HMR: **69 pass, 1 skip** (wheel desktop-only trên mobile), **0 fail, 0 flaky**. Lint 0 error/7 warning có sẵn (commented controls, protected carousel/benefits); unit 173 test pass. Build webpack và typecheck pass.

```powershell
npm run lint
npm run typecheck
npm test
node scripts/local-hoa-thoi.mjs --port 3101 --build --webpack
$env:PLAYWRIGHT_JSON_OUTPUT_NAME = 'docs/store-motion/v1/e2e-final.json'
node node_modules/@playwright/test/cli.js test store-motion.spec.ts store-select.spec.ts store-gradients.spec.ts landing-motion.spec.ts landing-home.spec.ts shop.spec.ts retry-cart.spec.ts home-scroll-fade.spec.ts --config playwright.motion.config.ts --grep-invert 'mixed cart persists|home, navigation, keyboard|Home scroll fade and back to top at|preview: scroll down' --reporter=list,json
```

Config khởi động fixture `--serve` tại 3101, credential thực bị xóa trong child process, CONTENT_MODE=test/DATA_ADAPTER=mock. Không chạy build đồng thời với server dùng `.next-feedback`. Những test legacy bị loại bằng grep vẫn dùng input quantity đã comment/position indicator đã comment/standalone preview; behavior liên quan được test bằng actual stepper, controller harness và outside-scope tests. Không bật lại các control bị comment để làm xanh test.

```powershell
# Review dev fixture (không dùng server của bạn ở 3000):
node scripts/local-hoa-thoi.mjs --port 3100 --webpack
node scripts/review-store-motion.mjs --after
node scripts/trace-store-motion.mjs --after
# Responsive có thể chạy trên fixture production đang serve:
$env:STORE_REVIEW_URL = 'http://localhost:3101'
node scripts/verify-store-motion.mjs
```

Before được ghi trước khi sửa nguồn; không thể tạo lại bằng `--before` trên code hiện tại. After recording ở dev warmed routes; UI tests/ảnh responsive cuối dùng fixture build. `working.diff` chỉ phần tracked chưa stage của task, `files.json` tách tracked/new source và artifact; không trộn deletions/screenshots đã stage từ trước vào diff animation.

## Giới hạn và iteration history

- Policy `/chinh-sach/ban-hang` fixture `published:false`: runtime 404 đúng domain; không publish/seed nội dung để giả lập coverage. Policy prose được giữ tĩnh theo source.
- Không có authenticated Admin/Clerk session. Ngoài Store được xác minh bằng preview/direct/CSR/fallback và không có motion variables. Đây chưa phải authenticated UI audit.
- 720×450 là viewport tương đương layout 200% của 1440×900, không điều khiển zoom của browser chrome. Chưa xác minh physical device/Safari/Firefox.
- Before 390 dùng viewport-only input profile; after 390 là touch. Before desktop cards recorder bị reload nên clip chính partial; clip `before/1440-overlays-no-preference.webm` bổ sung đầy đủ. Metadata ghi rõ, không coi phần thiếu là pass. Trước fix quantity chưa thể ghi flow cart/checkout thật; chỉ có after flow.
- Lần responsive đầu ở dev, chạy cùng recorder, gặp `Unexpected end of JSON input` khi chuyển route. Kết quả cuối được kiểm tra lại trên build fixture và báo riêng; không bỏ qua page errors trong script.
- Iteration đầu UI 46/48 pass: 2 reduced-motion product-image checks phát hiện specificity ưu tiên hover sai. Đã sửa owner selector, suite cuối kiểm tra lại. Unit timing assertions cũ hardcode 3s trong khi HEAD controller dùng 1.5s; test chuyển sang AUTOPLAY_WAIT_MS, controller không đổi.
- Performance trace là Chromium dev warmed route, không benchmark production/60fps. Lượt after đầu chạy cùng UI suite khác: desktop task duration 1.921s so với before 1.246s, nên đo lại sau khi các browser jobs kết thúc. Giữ lượt đầu trong `after/performance-first.json`; raw trace và `after/performance.json` là lượt quiet cuối. Không suy diễn long task dev thành regression riêng của animation.

| Trace | Desktop before → after quiet | 390px before → after quiet |
|---|---|---|
| Task duration | 1.246s → 0.987s | 1.018s → 0.730s |
| Script duration | 0.895s → 0.751s | 0.715s → 0.544s |
| Layout duration | 11.849ms → 8.193ms | 12.246ms → 6.926ms |
| Layout count | 12 → 10 | 15 → 12 |
| CLS, loại recent input | 0 → 0 | 0 → 0 |

Số đo không cho thấy tăng chi phí trong lượt quiet này; sample đơn và môi trường dev không đủ để tuyên bố cải thiện performance hoặc 60fps. Các long task vẫn có ở cả baseline và after.

## Backlog v1.1

P0/P1: chưa có lỗi blocker tái hiện trong các flow fixture đã pass. P2: bạn review cảm giác timing trên clip; xác minh published policy/authenticated Admin khi có dữ liệu/quyền phù hợp; physical zoom/device và production performance trace. P3: shader/loop/parallax bổ sung, mở benefits journey, đổi carousel controls hoặc framework motion nằm ngoài v1, cần yêu cầu riêng.
