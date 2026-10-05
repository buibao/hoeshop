# Đối chiếu reference → Hòe

Reference duy nhất: [Oh les Fleurs](https://www.ohlesfleurs.com/). Tư liệu cùng dự án, không phải reference thứ hai: [case study của Wokine](https://www.wokine.com/en/what-we-do/projects/oh-les-fleurs), [video desktop](https://api.wokine.com/wp-content/uploads/2024/01/case-large-01.mp4), [video cards](https://api.wokine.com/wp-content/uploads/2024/01/cards.mp4).

Ngày kiểm tra 05/10/2026: HTML trực tiếp đọc được; CSS app và JS app trả HTTP 429 trong browser, trang không có theme. Không dùng trang mất CSS để đo geometry. Video Wokine xem được trong browser; video là presentation nhiều màn hình, không phải recording thao tác của người dùng trên website.

| Quan sát qua tư liệu chính thức | Adaptation cho Hòe |
| --- | --- |
| Hero chữ lớn ở giữa, nhiều dòng; dấu hoa/trái tim trong nhịp chữ | Một H1 chia theo dòng DB, Lora; SVG trang trí aria-hidden, không tách ký tự |
| Ảnh chữ nhật nhỏ, xoay nhẹ ở hai cạnh và phía dưới headline | Ảnh Hòe/test crop 3:4/4:5, ba vị trí quanh copy; không khung vòm/cutout |
| Headline chiếm phần lớn giữa cửa sổ; ảnh cạnh không thay vai trò chữ | Vùng copy desktop khoảng 66% stage, mỗi ảnh cạnh 15.5%; đây là adaptation, không số pixel chính thức |
| Nền sáng, chữ nhận diện đậm, accents hoa nhiều màu | Ivory `--background`, chữ `--ink`, berry `--accent`, blush `--brand-blush`; caramel/jasmine trang trí |
| Các khối nội dung có nhịp rộng; showcase nghề và hình sản phẩm | Dịch vụ/featured/story/benefits/blog/process của Hòe, không sao chép số cửa hàng/năm kinh nghiệm/giao nhanh |
| Menu có sản phẩm chính, vùng phụ và giỏ | Navigation Hòe hiện có, link catalog + disclosure riêng đến ba dịch vụ |

Ảnh reference chụp ở viewport 1440×960 nhưng cửa sổ website trong video nhỏ hơn viewport. Không gọi kích thước video là kích thước CSS website. Scale desktop Hòe: headline clamp 64–108px theo chiều rộng, section heading 36–60px; ở mobile headline clamp 36–64px, content và CTA nằm riêng. Đây là scale cho font Lora/tiếng Việt, được kiểm tra viewport/zoom và ghi rõ adaptation. Spacing section dùng chung một biến Home, không đổi control scale trên các trang khác.

Mobile reference tương tác và timing gốc chưa xác minh được. Mobile Hòe là composition được đề xuất: headline trước, cụm ảnh ba cột, mô tả/action phía dưới; ảnh không parallax. Không coi layout này là bản sao mobile reference.

## Motion của Hòe

| Nhóm | Giá trị triển khai | Điều kiện |
| --- | --- | --- |
| Hover/click | 160ms, CTA dịch 2px; ảnh card scale 1.035 | Không thay layout hoặc delay navigation |
| Menu | 240ms fade/translate, chevron xoay | Link đang exit inert, Escape/return focus |
| Hero ảnh | 600ms, translate 14px và opacity .65→1 | Copy/H1/CTA visible ngay từ SSR |
| Section | 600ms, translate 16px và opacity .35→1; offset card tối đa 160ms | Reveal một lần; SSR initial visible, không giấu nội dung khi tắt JS |
| Parallax | Ảnh desktop hover-capable ≥1024px: 24/-18/16px | Mobile và reduced motion không parallax |
| Reduced motion | Không dịch chuyển, xoay, stagger hoặc animation | Geometry/copy/action vẫn đầy đủ |

Các con số trên là đề xuất cho Hòe, không phải timing/easing đã đo từ Oh les Fleurs. Easing section/ảnh dùng cubic-bezier(.22,1,.36,1); source reference không được copy vào app. Không GSAP, Lenis, WebGL, video background hoặc scroll hijacking.
