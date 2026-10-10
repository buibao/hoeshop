# Kiểm tra Hoa Thời calendar theo spec v5

Luồng: gợi ý/tùy chỉnh N/C → calendar exact dates theo chu kỳ → validation → API → JSONB/snapshot → giỏ/receipt/Admin. Chạy local, không push/PR/deploy hoặc sử dụng DB Preview/production.

Cập nhật thứ tự section: `service-page-top` → `ht-recommendations` → `ht-service-section` (mẫu hoa) → `ht-package-section` (setup/form). Lượt kiểm tra riêng sau thay đổi: 12/12 browser tests desktop/mobile pass, gồm thứ tự DOM, chọn gợi ý từ phía trên, giữ combo/ngày/contact, gửi/reset và product/cart. Typecheck, lint các file thay đổi và build Webpack pass. State gói dùng chung giữa gợi ý và form; các trang product/cart vẫn giữ state riêng.

| Ranh giới | Bằng chứng |
| --- | --- |
| UI → request | 26 browser tests desktop/mobile pass. Calendar chỉ ghi dates khách chọn, không tự lặp. Payload version 5 đúng shape N/C/anchor/dates; thiếu/vượt quota không POST. |
| Request → domain | 80 unit/API pass: date thật, weekday khác giữa kỳ, quota từng kỳ, gap, anchor giả, year boundary, leap year, Sunday/February feasibility, canonical keys, gói tối đa 52 tuần và no-past Việt Nam. |
| API → Postgres | 5 tests pass với DB TEST và `system.environment=test`: JSONB dates/groups/totals, receipt, Admin detail, legacy reject, replay, snapshot history và order quote/quantity. |
| Admin → content | Adapter count cũ không mất giá/ID; Save/editVersion/audit/cache dùng flow hiện có. Save xung đột trả 409. Tắt gợi ý vẫn nhận gói tùy chỉnh với reference price null. |
| Receipt → UI | Tư vấn và checkout hiển thị dates theo groups, snapshot giá lúc tiếp nhận; checkout vẫn giữ lịch sau cart clear. Replay receipt trước validation ngày/phiên bản mới. |
| Legacy → sửa lịch | Reader giữ templates và weekday preferences cũ. Checkout mở sửa giỏ; không nâng version hoặc điền ngày tự sinh trước khi khách chọn/lưu. |
| Layout → input | Container query theo độ rộng component; desktop có thể hiện 2 tháng và summary cạnh calendar. Mobile 7 cột/44px, keyboard chọn-bỏ được; không overflow ở 360/390/768/1024/1440px. |
| Guest → Admin | Guest không đọc/ghi services hoặc tài nguyên Admin, không cấp upload token. Không thêm auth bypass. |

## Lệnh

```powershell
npm run validate:content
npm run lint
npm run typecheck
node node_modules/vitest/vitest.mjs run tests/unit/delivery-schedule.test.ts tests/unit/recurrence.test.ts tests/unit/recurrence-api.test.ts tests/unit/recurrence-cycles.test.ts
node scripts/local-hoa-thoi.mjs --build --webpack
```

Build qua `npm run build -- --webpack` với fixture/mock và output `.next-feedback`. Lint toàn repo pass với 4 warning cũ. `git diff --check` pass. Thử nghiệm phát hiện layout calendar ở cột product hẹp bị chồng ô; đã sửa bằng container query và kiểm tra lại product/cart trên desktop/mobile.

Postgres chạy riêng với `DATABASE_URL` từ `.env.neon-test.local`, `DB_ENV=test`, `CONTENT_MODE=test`, `DATA_ADAPTER=postgres`, không có `VERCEL_ENV`. Không in URL/secret. Test guard xác minh marker, tạo fixture riêng và dọn sau test:

```powershell
npm run test:integration -- tests/integration/recurrence.test.ts
```

Browser dùng server từ build localhost:3100. Cấu hình local `.local/playwright-hoa-thoi.config.ts` kế thừa Playwright repo và reuse server:

```ts
import config from "../playwright.config";
export default { ...config, testDir: "../tests/e2e", webServer: { ...config.webServer, reuseExistingServer: true } };
```

```powershell
node scripts/local-hoa-thoi.mjs --serve --port 3100
# Terminal khác:
node node_modules/@playwright/test/cli.js test --config .local/playwright-hoa-thoi.config.ts tests/e2e/hoa-thoi.spec.ts tests/e2e/shop.spec.ts tests/e2e/widgets.spec.ts --grep 'service sections|weekly exact|monthly exact|package edits|calendar feasibility|network retries|product calendar|legacy cart checkout|responsive calendar|mixed cart|checkout saves mixed|Hoa Thời no-sample|guest cannot' --timeout 60000
```

Lượt kiểm tra toàn bộ calendar trước thay đổi thứ tự section: **26/26 pass trong 1,3 phút**, gồm 18 case Hoa Thời và 8 regression trên desktop/mobile. 16 ảnh `calendar-*` trong `screenshots/` thể hiện gói, lịch trống/thiếu/đủ/vượt/không khả thi, receipt và keyboard. Ảnh cũ được giữ để đối chiếu các lượt thiết kế trước.

## Giới hạn

- Browser dùng mock. Lưu DB thật được kiểm tra qua integration riêng; không gộp hai loại bằng chứng.
- Admin đăng nhập development chưa có phiên Clerk hợp lệ để review UI/chụp ảnh. Repository save/conflict/audit/cache và guest auth đã kiểm tra.
- Lượt whole unit suite: 161 pass, 11 lỗi baseline `carousel reading clock`; targeted Hoa Thời được chạy riêng sau thay đổi cuối. File autoplay/test vẫn trùng hash HEAD: `508756146cb86dbce7ea067abf185acceade432a` và `de6e34ef04113430ad24dfa98af5766af12158e8`. Không sửa phần này.
- Turbopack dev từng bị kẹt và Webpack HMR từng lỗi manifest khi đang reload. Lượt cuối dùng build Webpack ổn định, không đổi cấu hình deploy.
- Screenshot chỉ chụp vùng tính năng, tắt animation và ẩn skip link riêng lúc capture để tránh artifact phần tử fixed ngoài viewport. UI/keyboard của skip link giữ nguyên.
