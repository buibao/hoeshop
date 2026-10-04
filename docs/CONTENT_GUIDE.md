# Cập nhật nội dung Hòe

> Phase 1 historical reference. Phase 2 uses Postgres/admin; see [phase 2 runbook](phase-2/ADMIN_RUNBOOK.md).

## Nơi cần sửa

| Nội dung                                           | Vị trí                             |
| -------------------------------------------------- | ---------------------------------- |
| Shop, FAQ, liên hệ, social                         | content/site.json                  |
| Hero, lợi ích, số mẫu nổi bật, liên kết câu chuyện | content/home.json                  |
| Logo, ảnh hero và câu chuyện                       | content/assets.json                |
| Ba dịch vụ                                         | content/services/*.json            |
| Sản phẩm                                           | content/products/*.json            |
| Bài blog                                           | content/blog/*.md                  |
| Chính sách                                         | content/policies/*.md              |
| Logo/ảnh thật                                      | public/images/                     |
| Màu sắc, typography, spacing tokens                | src/styles/tokens.css              |
| Giỏ/form/comment                                   | src/features/                      |
| Adapter dữ liệu                                    | src/server/integrations/           |
| Google Sheets gateway                              | integrations/google-sheets/Code.gs |

Không refactor toàn dự án cho một yêu cầu sửa nội dung. Giữ ID/slug ổn định. Build/typecheck/lint sau cập nhật.

## Ảnh và logo

Đặt file thật vào public/images. content/assets.json nhận logo, hero và story; mỗi ảnh có src và alt. Logo thêm width/height nguyên dương. Ví dụ hero: \`{"src":"/images/hero.webp","alt":"Mô tả ảnh do shop cung cấp"}\`. Null dùng minh họa tạm; không bịa ảnh sản phẩm. Build kiểm tra file ảnh và chặn ảnh preview ở live. Logo/hero/ảnh sản phẩm bắt buộc trước khi bật SHOP_LIVE.

## Sản phẩm

Mỗi sản phẩm một file JSON. Ví dụ này là mẫu cấu trúc, không phải dữ liệu được phép bán:

```json
{
  "id": "id-do-shop-chot",
  "slug": "slug-do-shop-chot",
  "name": "Tên do shop cung cấp",
  "serviceType": "hoa-y",
  "description": "Nội dung do shop cung cấp",
  "image": null,
  "imageAlt": "",
  "published": false,
  "fixture": false,
  "price": { "mode": "quote" },
  "defaultDesign": { "shape": "bo" },
  "pricedOptions": {}
}
```

- Giá fixed: `{"mode":"fixed","amount":550000,"unit":"bó"}`; chỉ điền giá thật đã được shop chốt.
- Giá range: `{"mode":"range","min":600000,"max":800000,"unit":"bó"}`; đơn vị bắt buộc, min ≤ max.
- Giá quote: `{"mode":"quote"}`; không điền 0. Hoa Thời luôn quote ở phase 1.
- Hình thức: bo/hop/binh/canh. defaultDesign lưu cấu hình của mẫu; pricedOptions chỉ thêm các lựa chọn đã được shop xác nhận nằm trong giá.
- Màu/phong cách/hoa/hình thức/kích thước/yêu cầu riêng/link ảnh khác cấu hình có giá chuyển sang quote. Ngân sách tham khảo, lời nhắn, cảm xúc và ngày mong muốn không thay thế giá mẫu.
- Revision tự tính từ toàn bộ JSON. Sửa nội dung/giá/cấu hình khiến khách có giỏ cũ phải xem lại và lưu cấu hình trước khi gửi.
- Sản phẩm draft không có trong list/detail/API. Nếu không còn được bán, chuyển published=false; khách được hướng dẫn bỏ khỏi giỏ.
- Ảnh dùng đường dẫn /images/...; lưu ảnh thật vào public/images, đặt tên có nghĩa và imageAlt mô tả. Không dùng ảnh preview như ảnh sản phẩm thật.

Giới hạn kỹ thuật: 30 dòng mỗi yêu cầu, số lượng nguyên 1–99, snapshot tối đa 45.000 ký tự. Không có ngân sách tối thiểu hoặc vùng giao tự suy ra.

## Blog và chính sách

Markdown có frontmatter id, slug, title, excerpt, published, date (YYYY-MM-DD), category; image tùy chọn. Không nhúng HTML/script. Chỉ đăng nội dung đầy đủ và được shop cho phép. Chuyện của Hòe được chuyển từ Word nguồn; các chủ đề chưa có nội dung không được tự viết thành bài xuất bản.

Chính sách bán hàng hiện là draft. Shop cần hoàn thiện phương thức thanh toán, xác nhận giá/lịch, giao hàng, thay đổi/hủy và xử lý sau giao trước khi mở nhận khách. Không dùng hotline/địa chỉ/giờ hoạt động minh họa trong Word.

## Fixtures và phạm vi phase 1

Fixtures nằm trong tests/fixtures/content và tests/fixtures/images, chỉ chọn khi CONTENT_MODE=test. Mọi ảnh preview qua route kiểm tra môi trường và trả 404 ở live. Production không được dùng CONTENT_MODE=test hoặc DATA_ADAPTER=mock. Không promote bản build có fixtures sang production.

Feature flags ở src/domain/features.ts. Gói Hoa Thời, tìm kiếm, bộ lọc, upload và thanh toán đang tắt. Hướng dẫn này không bật gói; phase sau cần đặc tả và migration riêng.
