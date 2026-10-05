# Kiểm chứng checkpoint Home

Baseline `0217f4d`, ngày 05/10/2026. Kết quả đang được bổ sung sau khi chạy; chưa được shop duyệt.

- Unit: 61 ca đạt, gồm 58 nghiệp vụ baseline và ba ca composition featured/empty/fallback/long copy.
- Lint/typecheck/build đạt. Build sạch đã chạy riêng để loại cache Untitled cũ, sau đó build chuẩn đạt không còn lỗi resolve CSS. Không commit thay đổi tsconfig do thư mục build kiểm chứng sinh ra.
- Full E2E Chromium fixture: 52/52, gồm 26 desktop và 26 mobile; sau tăng vùng chạm shell ≥44px chạy lại sáu ca navigation/geometry/motion, đều đạt.
- Widths 360/390/768/1024/1440px, reflow tương đương zoom 200% ở viewport CSS 720px, tắt JS, copy dài, bàn phím, menu focus/Escape, giỏ trộn, hai tab, retry, tư vấn/bình luận và guest admin guards đạt trên local fixture. Chưa gọi kiểm tra tương đương là thao tác zoom native hoặc Safari/iOS thật.
- Lighthouse baseline Preview phase 3: performance 85/91/84, median 85; LCP 3206/2910/3755ms, median 3206ms; CLS 0 cả ba. Cùng Chromium/Lighthouse/mobile simulated throttling, có quyền đọc Preview. Kết quả mới bổ sung sau deploy.
- Fixture browser tách khỏi Neon/Clerk/Blob operator; không coi receipt mock là lưu DB Preview.
- Google admin, Blob UI và Safari/iOS thật không thuộc bằng chứng mới của lượt Home này. Những tồn đọng phase 3 vẫn giữ nguyên.

Release checks, Preview SHA/URL, screenshot/video và kết quả trước–sau sẽ được ghi tại đây. Không commit cookies, bypass tokens, raw Lighthouse report có headers, secrets hoặc dữ liệu khách. `SHOP_LIVE=false`; không migration/seed/production deploy.
