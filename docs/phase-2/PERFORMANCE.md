# Đo hiệu năng trước–sau

05/10/2026, Home production build local với cùng fixtures, CONTENT_MODE=test, DATA_ADAPTER=mock, SHOP_LIVE=false. Baseline `474cc71` port 3200, phase 2 port 3201. Next 16.3.8, app Node 22.16, Lighthouse 13.0.3 chạy bằng Node 22.20 (đúng engine yêu cầu), Chromium 153 trên cùng máy Windows. Mobile simulated throttling, ba lần tuần tự mỗi bản; số dưới là median. Baseline worktree chỉ chỉnh Turbopack root để dùng chung node_modules, không đổi giao diện/nghiệp vụ.

| Chỉ số              |  Baseline |   Phase 2 |
| ------------------- | --------: | --------: |
| Performance mobile  |        85 |        83 |
| Accessibility       |        96 |        96 |
| LCP                 | 3,89 giây | 4,18 giây |
| TBT                 |  164,5 ms |    192 ms |
| CLS                 |         0 |         0 |
| Tổng transfer       |   974 KiB |   480 KiB |
| JavaScript transfer | 243,5 KiB | 227,2 KiB |

Payload giảm khoảng 51%, JavaScript giảm khoảng 6,7%; điểm performance/LCP chưa cải thiện trong phép đo này. Mục tiêu mobile ≥90 **chưa đạt**. Không dùng run tốt nhất thay median. Tất cả samples và thông số trong [PERFORMANCE.json](PERFORMANCE.json); raw Lighthouse JSON giữ ở `.local/lighthouse-supported-*.json`, không chứa dữ liệu khách.

Đã dùng responsive image optimization, ưu tiên hero, import widget theo module, Motion LazyMotion/domAnimation và locale Việt riêng. Zod dùng namespace import để Turbopack không giữ toàn bộ locale qua alias `z`; [hướng dẫn locale Zod](https://zod.dev/error-customization#internationalization). Motion dùng subset theo [LazyMotion](https://motion.dev/docs/react-lazy-motion).

Đây là lab fixtures local, chưa đo Neon/Blob/CDN trên Preview thật và chưa Lighthouse production có nội dung thật. Điểm dao động 80–87 baseline, 82–85 phase 2; giữ mục tiêu tuning LCP/JS/ảnh/font trên deployment, kiểm tra lại các trang form và dữ liệu thực tế trước release. Thêm section Home và chuyển nội dung sang runtime có thể ảnh hưởng phép đo; không suy ra hiệu năng Neon từ kết quả file fixtures.
