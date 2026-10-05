# Motion revision — 05/10/2026

Baseline review: `bea475c1e78a0fc127d2b805832e647e747336d8`, branch `feat/oh-les-fleurs-home`. Đây là revision được người dùng yêu cầu triển khai và deploy Preview; chưa phải nghiệm thu của shop.

## Đối chiếu runtime reference

Reference duy nhất: https://www.ohlesfleurs.com/. Browser request có thể trả 429. Đợt kiểm tra này lấy HTML/CSS/JS/fonts/ảnh gốc từ canonical host bằng Node rồi phục vụ ở URL gốc trong browser; không sửa mã animation. Runtime Chromium chạy được, không có console/page errors sau khi phục hồi transport. Không dùng video Wokine để suy ra timing.

Viewport 1440×960: dòng 2 từ x≈155 → -80 ở scroll 325 → -265 ở 580; dòng 3 từ -173 → 52 → 229. Ảnh scale/rotate/position đổi theo scroll và đảo chiều. Benefits track từ bên phải đi sang trái qua intro sticky. Viewport 390×844: headline không dịch ngang, cụm ảnh nhỏ nghiêng; benefits vẫn có track ngang gắn với scroll. Các số là snapshot tại viewport này, không áp nguyên pixel vào Hòe.

Xem [runtime observations](reference/observations.json), [desktop video](reference/1440-reference.webm), [mobile video](reference/390-reference.webm).

## Mapping sang Hòe

| Layer | Trigger và đường chạy | Adaptation |
| --- | --- | --- |
| Hero | Một `useScroll` trên section; start `start 0.15`, end `end 0.85`. Tất cả line/photo cùng progress, có keyframe 0/.55/1. | Hai dòng nội dung DB, không thêm dòng giả. X đối hướng, biên độ tối đa 6.5% stage, chặn theo khoảng trống của heading. |
| 3 ảnh | Start scale .5/.5/.65, góc +4/-6/-10; tới .55 scale .94/.94/.96, vào gallery; cuối 1/1/1, góc -18/-6/+4. | Tọa độ từ stage/heading/gallery đo thực tế. Wrapper ngoài sở hữu transform, crop bên trong không xoay hoặc animate cùng thuộc tính. |
| Gallery | Có chỗ dành sẵn trong SSR. Cuộn lên đi ngược cùng timeline. | Không pin hero, không che CTA, không đè services. Static gallery khi no-JS/reduced motion. |
| Benefits | Sticky stage từ top 100px, track start ngoài bên phải và end ngoài bên trái; rotate/y riêng từng thẻ. | Số thẻ lấy đúng DB. Độ dài bằng stage + 70% quãng chạy tính từ width/card/count; không hardcode 4 thẻ. Palette blush/jasmine/berry. |
| Mobile/tablet <1024px | Hero/copy và cards trong flow. | Cố ý bỏ sticky ngang dài của reference trên màn nhỏ. Không cần hover, không thêm vùng scroll trống. |
| Reduced motion/no-JS | Bỏ hành trình và sticky; toàn bộ nội dung đọc trong flow. | Theo dõi preference thay đổi khi đang mở trang. Motion 14 đọc reduced preference lúc mount nên dùng subscription media cho controller. |
| Motion phụ | Hoa/trái tim xoay/scale theo progress hero; ảnh story y -24→24 và góc -2→2 theo viewport. | Vai trò riêng; không thay bằng generic reveal. Reveal một lần còn dùng cho các section khác. Menu hiện có giữ nguyên. |

Benefits 0 bị bỏ; 1 dùng card tĩnh; 2–10 có journey desktop khi đủ chiều cao. Copy dài khiến card/stage không vừa viewport sẽ dùng flow, tránh nội dung bị clip. Không khóa wheel/touch hoặc thêm thư viện.

## Phạm vi bảo toàn

Query/content vẫn ở Server Components. API, DB schema, giỏ, receipt, pricing, retry, Clerk, Blob và Admin giữ nguyên. Không seed/migration hoặc ghi dữ liệu Preview. Assets vẫn là test/fallback; cần ảnh hero/story thật và ảnh thứ ba phù hợp, hiện một ảnh bouquet được lặp. `SHOP_LIVE=false`.

## Kiểm tra và bàn giao

Các kết quả mới nằm trong [VERIFICATION.md](VERIFICATION.md). Báo cáo cũ ở thư mục cha giữ làm lịch sử; không dùng nó để khẳng định motion revision đã đạt. Video ghi cùng viewport, cùng mốc hero 0/325/580/145/0 và trạng thái giữa/cuối benefits, thêm gallery cuối tính theo geometry Hòe. Scroll trong video là cuộn native được tự động hóa; không thay đổi cơ chế scroll của ứng dụng.
