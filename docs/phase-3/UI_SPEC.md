# UI spec — checkpoint B

## Tokens và nền

| Token / vai trò           | Giá trị                       |
| ------------------------- | ----------------------------- |
| Ivory chính / chữ         | #FFFCF7 / #332C2A             |
| Berry / Pink / Blush      | #D6306E / #FF92C1 / #FCDFE1   |
| Caramel / Jasmine         | #EFB17E / #EFD47B             |
| CTA / hover / focus       | #AF2154 / #922044 / #8A1942   |
| Surface / border / muted  | #FFFFFF / #E7DDD5 / #706561   |
| Error / success / warning | #A32634 / #216348 / #83540E   |
| Radius panel / field      | 12px / 8px                    |
| Shadow panel              | 0 8px 30px rgba(51,44,42,.03) |

Màu semantic có nhãn/chấm đi cùng. Store ưu tiên Lora ở tiêu đề; admin dùng Be Vietnam Pro cho bảng và form. Sidebar wordmark dùng Lora. Icons Lucide hiện có. Tailwind/Preflight không thay; style mới có prefix hoặc phạm vi admin/Home/detail.

## Màn duyệt

- Home desktop: hero hai cột, tiêu đề 54–86px, ảnh cao 565px trong khung cong, điểm nhấn Jasmine; CTA chính sẵn sàng ngay. Ghi chú nằm trong luồng bên dưới ảnh, không còn panel trắng chồng ra ngoài. Mobile: tiêu đề 46–68px, ảnh 420px, xếp dọc và nút đủ vùng chạm.
- Card sản phẩm dùng cùng tỷ lệ 4:5, bo 8px và crop cover trên Home/catalog/dịch vụ; bỏ khung vòm riêng ở card thứ hai. Tên dịch vụ dùng nhãn tiếng Việt chung. Ảnh vẫn là assets test hiện có.
- Menu Sản phẩm giữ link xem toàn bộ mẫu, thêm disclosure Hoa Thời/Tâm/Ý dẫn tới /dich-vu/{loại}. Desktop mở bằng hover hoặc nút; ArrowDown vào link đầu, Tab theo thứ tự, Escape đóng và trả focus. Mobile dưới 768px dùng Offcanvas và danh sách con mở tại chỗ; chọn link đóng navigation. Click ngoài hoặc chuyển focus ra ngoài đóng menu con.
- Home tiếp nối benefits → ba dịch vụ → featured → story → bài công khai → quy trình/FAQ → CTA. Hình ảnh/nội dung runtime từ DB; dữ liệu trống có empty state, liên hệ thật chỉ hiển thị khi có cấu hình.
- Chi tiết sản phẩm: ảnh tỉ lệ 4:5, panel cấu hình rõ, giá/cảnh báo test, CTA toàn chiều rộng trên mobile; lịch và giờ vẫn là mong muốn cần shop xác nhận.
- Admin: sidebar 240px và vùng nội dung nền trung tính; navigation Offcanvas trên mobile. Danh sách đơn desktop là bảng, mobile là thẻ với giá/trạng thái/action; chi tiết chia người đặt, người nhận, từng mẫu/cấu hình và tổng.
- ProductEditor: thông tin → thiết kế/giá; bên cạnh là xuất bản và ảnh. Dưới 1200px đổi bố cục; dưới 768px một cột, input 16px. Hoa Ý có default shape và checkbox hình thức có giá. Không tự chọn hình thức cho bản ghi thiếu.
- Component mẫu: badges trạng thái, input default/error, focus bằng Tab, primary/secondary/disabled/loading, feedback thành công. Calendar/time đầy đủ trạng thái ở /xem-thu/widgets. Thư viện component và theme widget áp dụng rộng tiếp tục ở C/D sau duyệt.

## Motion

| Tương tác          | Đặc tả                                                                           |
| ------------------ | -------------------------------------------------------------------------------- |
| Button / hover | 160ms đổi màu, bóng, mũi tên; click phản hồi scale .98 ngay; card dịch vụ nâng 6px/240ms |
| Hero | Ảnh zoom 1.035 → 1 trong 1000ms, không fade ảnh; copy phụ fade + 12px/700ms, icon rotate/scale 900ms. Scroll dịch ảnh tối đa 36px và fade tới .65 khi rời viewport; nội dung chính/CTA giữ sẵn sàng |
| Section / cards | Fade 0 → 1 và dịch 28px → 0, 700ms ease [0.22,1,0.36,1], một lần vào viewport; card sản phẩm/blog/quy trình lệch nhau 90ms |
| Navigation | Submenu fade in/out 240ms, dịch 10px vào/6px ra; Offcanvas và backdrop fade/slide 240ms, giữ focus/Escape của React-Bootstrap |
| Reduced motion | Bỏ reveal, parallax, fade và hover/click transform; nội dung hiển thị ngay, giữ hành vi navigation |

Server render nội dung và ảnh; animation không đặt opacity=0 trên tiêu đề/CTA/ảnh hero. Reveal không giấu nội dung trong HTML ban đầu. Motion chỉ bọc phần tương tác và nhận children từ Server Components. Không video nền/3D/WebGL/scroll hijacking. Hero, ảnh và copy vẫn đọc được khi motion không chạy.

Revision B theo feedback ngày 05/10/2026, chưa phải shop duyệt thiết kế cuối. API dùng theo [Motion scroll animations](https://motion.dev/docs/react-scroll-animations) và [AnimatePresence](https://motion.dev/docs/react-animate-presence).

## Hành vi editor

Lỗi hiển thị dưới input, có summary link/focus đầu tiên; array path quy về control nhiều lựa chọn. Khoảng giá sai trỏ tới giá cao nhất. Lỗi mạng/409 giữ input. 409 cho xem bản mới, chỉ thay input khi shop chọn và xác nhận. PUT trả version dạng SQL; client dùng edit_version để lần lưu tiếp theo không giữ version cũ.

Dirty form cảnh báo khi reload/đóng tab và điều hướng bằng link cùng website. Không thêm lưu tự động hay lưu nội dung liên hệ vào localStorage. Các trường cố định/readonly, disabled và lỗi phân biệt rõ.

## Assets cần thay trước nghiệm thu hình ảnh cuối

Ảnh bouquet/roses/peonies hiện là fixtures, ghi nguồn ở docs/ASSET_SOURCES.md. Wordmark bằng chữ và floral-mark.svg là tài sản tạm trong repo. Cần logo được duyệt, ảnh hero/story/catalog có quyền sử dụng, alt text, contact/social và chính sách thật. Nghiệm thu bố cục với ảnh tạm không thay nghiệm thu assets cuối cùng.

Reference thiết kế: https://www.foglia-doro.com/ ; https://www.stclairedesignstudio.com/portfolio-the-florist ; https://www.untitledui.com/ . Không sao chép ảnh/logo/font riêng hoặc nội dung của reference vào catalog Hòe.
