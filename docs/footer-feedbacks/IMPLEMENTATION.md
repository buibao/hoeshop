# Footer & sản phẩm nổi bật — 07/10/2026

Branch `feedbacks`, baseline `73105c0cbc65b11c403fe08e71378c787659b6b0`; giữ toàn bộ thay đổi Home/Admin đã có. Các thay đổi nằm trong working tree, chưa commit/push.

**Preview READY:** https://hoeshop-dwbcs40dw-buibaos-projects.vercel.app — deployment `dpl_D2KrfEznjmrfBcigeha6VvH2MkGW`, source CLI working tree, environment Preview. Đã fetch kiểm tra `origin/feedbacks` vẫn ở cùng baseline.

Ảnh dùng **dữ liệu hiện có của shop trên Preview**: [desktop 1440](screenshots/preview-footer-1440.png), [mobile 390](screenshots/preview-footer-390.png). [Admin chọn 1 sản phẩm, nút lưu được bật](screenshots/preview-admin-select-one.png).

## Kết quả

- Footer nền kem `--background`, wordmark Lora màu `--accent`, nội dung Be Vietnam Pro; dùng trực tiếp container `.olf-shell` của Home. Bốn nhóm desktop từ 1024px: Brand / Khám phá / Ghé Hòe / Kết nối. Tablet hai cột, mobile một cột theo đúng DOM order. Nhóm liên hệ/social không có dữ liệu được bỏ và grid tự reflow.
- Social tách riêng: Facebook / TikTok / Instagram, mỗi hàng gồm SVG thương hiệu đúng nền tảng và tên Admin, cao tối thiểu 44px. Các SVG Font Awesome Free được giữ nguyên và ghi [nguồn/giấy phép](ICON_LICENSE.md); không thêm dependency, icon font, CDN hay JavaScript cho Footer.
- Giữ label/URL Admin, nhận diện bằng platform metadata hoặc nhãn/domain chính xác. Social khác vẫn hiện với tên rõ ràng; URL trống, sai định dạng, scheme không phải HTTPS hoặc chứa credentials không render. Link ngoài có `target="_blank" rel="noopener noreferrer"`.
- Liên hệ theo thứ tự địa chỉ/bản đồ → điện thoại → email → giờ hoạt động. Dữ liệu dài wrap an toàn; trường trống ẩn riêng. Giữ link Liên hệ & tư vấn trong nhóm liên hệ. Policies công khai lấy đủ từ content service và nằm trong hàng cuối riêng, cùng copyright/chú thích cũ.
- Focus rõ, hover 180ms, reduced motion bỏ transition; Footer đầy đủ khi tắt JavaScript. Không thay palette root, Header, Hero hay carousel.
- Admin sản phẩm nổi bật cho phép **0–10** ID khác nhau, công khai, ảnh hợp lệ; không còn yêu cầu đủ 10. Hero vẫn đúng 3. Khi lưu, `featuredLimit` bằng số ID đã chọn; lưu 0 đặt limit 0 để không tự dùng catalog legacy. Không cần migration.
- Giữ server authorization Clerk, kiểm tra editVersion/409, transaction/audit/cache invalidation và việc chỉ cập nhật đúng nhóm settings. Lựa chọn ít hơn 10 tiếp tục dùng finite carousel hiện có.

## Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| Unit | 76 passed, gồm social mapping/URL/SSR/empty groups/policies và schema 0–10 |
| PostgreSQL integration | 23 passed; lưu 3/1/0 featured, >10/trùng/draft/missing bị từ chối, giữ Hero/copy, CAS/audit/cache |
| Browser E2E | 28 passed; Header/Hero/CTA/carousel/touch/cart/checkout/no-JS và footer trên các trang Store |
| Clerk → Admin → API → PostgreSQL → Store | 6 passed trên database TEST riêng; UI lưu 4/1/0 và reload, đủ 10 loop, conflict, contact/social, long/empty/footer keyboard |
| Responsive thực tế | 1440/1280/1024: 4 cột; 768: 2; 390/360: 1; gutter trùng Home, không overflow |
| Tương phản đo trên browser | Ink 13.37:1, secondary 5.51:1, brand 6.48:1 trên nền kem |
| Lint | 0 error; 1 warning có sẵn ở LandingBenefitsMotion.tsx (`desktop` chưa dùng) |
| Typecheck / build | Passed; Next.js 16.3.8 production build thành công |

[Browser report](browser-report.json) ghi geometry, màu, console, keyboard/reduced motion/no-JS, stress test 5 policy dài và các trang catalog/detail/contact/blog. Dữ liệu kiểm thử và ảnh ghi TEST chỉ dùng database local riêng; không seed hoặc sửa dữ liệu kinh doanh Preview.

[Kiểm tra trường trống](empty-report.json): bỏ riêng TikTok thì Facebook/Instagram còn nguyên; bỏ mọi contact/social thì reflow 2 cột ở 1440/768 và 1 cột ở 360. Các thao tác này chạy bằng Admin local TEST, sau đó khôi phục dữ liệu trước kiểm tra.

[Preview browser report](preview-browser-report.json): sáu viewport đều đúng cột/nền kem, không overflow; các API private trả guest 401/no-store, Admin Clerk hợp lệ trả 200. Preview có 4 sản phẩm đủ điều kiện; thử chọn 1 trên UI thấy save enabled. Không bấm lưu hay thay đổi dữ liệu kinh doanh trên Preview (`writes: 0`). Lưu thực tế 4/1/0, kiểm tra database và reload Store đã qua UAT local ở trên.

## Ảnh review

- [Footer desktop 1440](screenshots/footer-complete-1440.png)
- [Footer desktop 1024](screenshots/footer-complete-1024.png)
- [Footer tablet 768](screenshots/footer-complete-768.png)
- [Footer mobile 390](screenshots/footer-complete-390.png)
- [Footer mobile 360](screenshots/footer-complete-360.png)
- [Địa chỉ/email dài 360](screenshots/footer-long-360.png)
- [Không có contact/social — mobile](screenshots/footer-empty-complete-360.png)
- [Không có contact/social — desktop](screenshots/footer-empty-complete-1440.png)
- [Một social trống, giữ hai social còn lại](screenshots/footer-one-social-empty-1440.png)
- [Nhiều policy dài trên mobile](screenshots/footer-many-policies-360.png)
- [Admin chọn 4 sản phẩm](screenshots/admin-featured-four.png)

## File chính

`src/components/Footer.tsx`, `src/components/SocialBrandIcon.tsx`, `src/styles/store-shell.css`, `src/domain/contact.ts`, `src/domain/home-products.ts`, `src/features/admin/HomeProductPicker.tsx`, `src/server/admin/repository.ts`, `tests/unit/footer.test.ts`, `tests/unit/home-feedbacks.test.ts`, `tests/integration/home-feedbacks.test.ts`, `tests/uat/home-feedbacks.spec.ts`.

## Nguồn tham khảo

Đã mở [Bergamotte](https://www.bergamotte.fr/) trên browser desktop/mobile: tham khảo cách phân nhóm và tách chính sách. Thiết kế Hòe áp dụng các thông số trong spec người dùng, gồm bốn nhóm riêng và mobile không accordion. SVG lấy chọn lọc từ [Font Awesome Free](https://github.com/FortAwesome/Font-Awesome/tree/6.x/svgs/brands), giấy phép CC BY 4.0.
