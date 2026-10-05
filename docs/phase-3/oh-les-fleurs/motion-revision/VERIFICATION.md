# Kiểm chứng motion revision

Ngày 05/10/2026. Baseline `bea475c1e78a0fc127d2b805832e647e747336d8`, branch `feat/oh-les-fleurs-home`. Chưa được shop nghiệm thu. Source/deployment và kết quả Preview được bổ sung sau deploy.

## Kết quả mới tại local

- Lint, typecheck và build đạt. Unit 66/66, gồm composition 0/1/10 benefits, fallback ảnh/catalog trống, featured ordering và geometry responsive, cùng nghiệp vụ cũ.
- E2E Chromium fixture 58/58 (29 desktop, 29 mobile). Sáu lượt mới kiểm tra timeline/reverse/gallery, track/sticky/preference/resize và no-JS desktop. Các lượt mobile có ba bài motion chủ động đổi viewport sang desktop để kiểm tra controller; không gọi đó là motion pinned trên điện thoại.
- Hồi quy cấu hình → giỏ → checkout với receipt mock, giỏ trộn/hai tab/retry, tư vấn, bình luận, draft/guest, menu keyboard và date/time picker đạt. Local tách khỏi Neon/Clerk/Blob, không suy diễn receipt mock thành lưu DB thật.
- Automation riêng thay **file content local** tạm thời rồi restore nguyên bản: 0/1/10 benefits, long title/intro/card body ở 360/390/768/1024/1440px; không overflow, 10 thẻ có native journey, 1 thẻ tĩnh, copy quá dài không pin. Không seed DB.
- Reduced motion đang mở trang chuyển controller về flow ngay, không cần reload. No-JS có một H1, copy/CTA/link đầy đủ và không tạo stage scroll dài.
- Reference chạy runtime Chromium ở 1440×960 và 390×844, có video/snapshot cùng mốc và chiều cuộn ngược. [Chi tiết transport và mapping](IMPLEMENTATION.md), [observations](reference/observations.json).

## Preview và hiệu năng

Đang chờ deployment mới và đo/capture trên deployment chính xác. Không gọi build pass là nghiệm thu motion hoặc tự báo điểm Lighthouse.

## Giới hạn còn giữ

Shop chưa duyệt; ảnh test và bouquet lặp chưa là nghiệm thu hình ảnh cuối. Mobile benefits cố ý khác reference: normal flow thay cho pinned ngang. Safari/iOS thật, screen reader thiết bị thật, zoom native chưa chạy; reflow 200% tương đương được kiểm tra trong E2E cũ. Google admin/Blob UAT giữ trạng thái baseline, không thuộc revision Home. Không migration, seed, production deploy hoặc mở nhận khách.
