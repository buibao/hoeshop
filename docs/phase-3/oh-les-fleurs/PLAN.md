# Home theo Oh les Fleurs

Baseline: `0217f4d11b093b9912a9ac8ba878b656aed3bc07`, nhánh triển khai `feat/oh-les-fleurs-home`. Ngày 05/10/2026.

Đầu ra là một checkpoint toàn Home cùng motion, header/menu/footer và variant card Home. Người vận hành chọn duyệt toàn Home một lượt. Chưa mở rộng redesign catalog/detail/cart/checkout/widget/Admin. Shared shell được kiểm tra trên các trang Store.

Home dùng headline trung tâm và ảnh chữ nhật xoay nhẹ quanh chữ, thay hero hai cột/khung vòm. Mobile có cụm ảnh trong flow riêng, mô tả và action không bị ảnh che. Thứ tự: hero → ba dịch vụ → featured → story/benefits → blog → process/FAQ → CTA → footer.

Giữ Next/React/Tailwind/Preflight/React-Bootstrap/Motion và lockfile baseline; giữ Lora, Be Vietnam Pro và palette Hòe. Không Untitled UI hoặc thư viện mới. Content từ DB qua repository hiện có, server component cho composition. Client leaves chỉ đảm nhiệm motion và navigation.

Public/admin APIs, DB schema, transaction, idempotency, pricing revision, auth và storage giỏ không đổi. Không migration hoặc seed. Preview dùng Postgres hiện có, Clerk development và Blob hiện có; `SHOP_LIVE=false`. Production không thay đổi.

Card/service thêm variant `home`; default giữ baseline. Style Home nằm trong namespace `olf-*`, shell trong `hoe-store-*`. Rules Home/nav cũ được bỏ khỏi phase3.css; detail, admin preview và default catalog cards giữ nguyên. Xóa hai client wrappers Home cũ không còn nơi dùng.

Nghiệm thu cần Preview thật, ảnh desktop/mobile trước–sau, video scroll/menu/card, Lighthouse ba lần cùng điều kiện, lint/typecheck/unit/build/E2E. Build pass không thay cho shop duyệt. Dừng tại checkpoint Home; những bước Store khác chỉ được lập tiếp sau khi người vận hành lựa chọn hướng này.
