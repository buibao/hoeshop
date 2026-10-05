# Assets của checkpoint

Giữ logo/hero/story được shop cấu hình và ảnh catalog công khai từ DB. Khi thiếu ảnh trong bản test, dùng ảnh fixture của dự án và SVG floral-mark. Khi live thiếu ảnh, dùng SVG minh họa; không lấy ảnh test vào production.

Ảnh reference chỉ nằm trong tài liệu đối chiếu, không dùng làm tài sản website. Không thay nội dung hoặc file ảnh catalog, không upload Blob hay ghi đè dữ liệu shop để dựng checkpoint.

Kiểm tra trực quan phát hiện fixture `peonies.jpg` là ảnh dụng cụ trang điểm, không phải hoa. Home không dùng fixture này trong collage/story mặc định; card Home của bản ghi fixture sử dụng floral-mark thay thế và có alt ghi minh họa tạm. Default card/catalog/detail giữ ảnh của baseline. Đây là presentation test, không sửa DTO hoặc pricing revision.

| Asset | Trạng thái |
| --- | --- |
| Wordmark hòe bằng Lora | Tạm khi chưa có logo được cấu hình |
| bouquet.jpg | Bó hoa test, không đại diện sản phẩm bán |
| roses.jpg | Nhành hoa hồng nhạt test; tên file không phải tên loài |
| floral-mark.svg | Minh họa thay ảnh thiếu/fixture không phù hợp |
| Ảnh nghề/câu chuyện shop | Thiếu; đang dùng ảnh hoa test khi chưa cấu hình |
| Ảnh từng sản phẩm thật, cùng ánh sáng/crop | Cần shop cung cấp trước nghiệm thu hình ảnh cuối |

Nghiệm thu bố cục/interaction với ảnh tạm được ghi riêng với nghiệm thu hình ảnh thật. Contact/social/policies chỉ hiện khi có dữ liệu tương ứng; không bổ sung thông tin giả.
