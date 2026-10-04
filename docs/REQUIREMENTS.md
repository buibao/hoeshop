# Đặc tả yêu cầu và kế hoạch triển khai website Hòe

Phiên bản 1.0 — ngày 04/10/2026 — BA Manager — baseline để Codex triển khai.

Tài liệu dành cho chủ dự án và Codex triển khai website mới trên Vercel. Mục tiêu phiên bản đầu là tiếp nhận yêu cầu đặt hoa thực tế qua giỏ hàng và Google Sheets, đồng thời cho phép bình luận bài blog. Baseline này kết hợp trả lời Q1–Q10 và C1–C8 của chủ dự án. Các quyết định phạm vi đã đủ để bắt đầu lập trình. Tham số kỹ thuật trong tài liệu là mặc định triển khai do BA chọn, có thể điều chỉnh qua cấu hình. Giá, nội dung, thông tin shop và quyền kết nối thật vẫn là đầu vào cần bổ sung; không tự tạo dữ liệu kinh doanh còn thiếu. Chức năng gói Hoa Thời được để phase sau theo C3 mới nhất.

## 1 Nguồn và thứ tự ưu tiên

- Trả lời Q1–Q10 và C1–C8 ngày 04/10/2026 có ưu tiên cao nhất; C3 chuyển quy tắc gói Hoa Thời sang phase sau.
- Truyền thông số - Hoa.docx cung cấp nội dung thương hiệu, dịch vụ và danh sách trường form ban đầu.
- Sơ đồ 7e70c19b-31f0-44f2-a622-a3d5f47ba0cb.jfif cung cấp cấu trúc trang và ghi chú bố cục.
- https://hoahoe-mu.vercel.app/ là tham chiếu bố cục Home; đã kiểm tra trực tiếp bằng trình duyệt ngày 04/10/2026.
- image.png cung cấp bảng màu thương hiệu.
- Tạm thời không tham khảo Thơ Fleur theo yêu cầu mới nhất.

## 2 Các quyết định đã chốt

| Mã | Nội dung |
| --- | --- |
| D01 | Xây mới; website chỉ dùng tiếng Việt; deploy trên Vercel. |
| D02 | Phiên bản đầu có thể vận hành thực tế; giỏ hàng và bình luận blog phải hoạt động. |
| D03 | Luồng đặt hàng B: chọn sản phẩm, thêm vào giỏ, gửi đơn; shop xác nhận sau. |
| D04 | Shop nhận dữ liệu qua Google Sheets. |
| D05 | Mẫu hoa có tên, giá, nội dung riêng; có trang chi tiết và thao tác thêm vào giỏ. |
| D06 | Chưa triển khai tìm kiếm và bộ lọc nâng cao. Điều hướng ba dịch vụ vẫn cần có. |
| D07 | Định hướng Hoa Thời gồm Ngày/Tuần/Tháng và nhiều tháng, nhưng cấu hình tần suất, thời hạn và giá gói chuyển sang phase sau theo C3. Phiên bản đầu tiếp nhận nhu cầu để shop tư vấn thủ công. |
| D08 | Shop chốt lịch và giá cuối thủ công; dùng fixed/range/quote theo dữ liệu thực tế. Hoa Thời chưa có quy tắc giá thì dùng Liên hệ báo giá; chưa gia hạn tự động. |
| D09 | Có ba form riêng theo dịch vụ và form tư vấn chung ở Liên hệ. Ảnh tham khảo không bắt buộc; phiên bản đầu nhận link ảnh theo C5. |
| D10 | Phiên bản đầu cập nhật nội dung qua Codex; cấu trúc cần dễ cập nhật và mở rộng. |
| D11 | Home tương tự bố cục website mẫu hiện tại; các trang khác theo cấu trúc Hòe. |
| D12 | Logo, ảnh, dữ liệu shop và blog đang chuẩn bị. Địa chỉ/hotline trong Word là minh họa. |
| D13 | Mong muốn sớm nhất có thể; hạn muộn nhất là thứ Ba 06/10/2026, giờ bàn giao chưa chốt. |

Luồng B không bao gồm thanh toán trực tuyến. Việc thu tiền và xác nhận giá cuối cùng cần được mô tả trong chính sách vận hành của shop.

## 3 Phạm vi phiên bản đầu

### 3.1 Phạm vi bắt buộc

- Home, Sản phẩm, ba trang dịch vụ, chi tiết sản phẩm, Về Hòe, Blog, chi tiết bài viết, Liên hệ và trang chính sách đã đủ nội dung.
- Giỏ hàng: thêm, xem, cập nhật số lượng/cấu hình, xóa, giữ giỏ khi tải lại trang trên cùng trình duyệt.
- Checkout gửi yêu cầu đặt hàng đến Google Sheets; trả mã yêu cầu sau khi lưu thành công.
- Form Hoa Thời/Tâm/Ý gắn với cấu hình từng mục giỏ hàng, theo C2 đã chốt.
- Form Liên hệ gửi yêu cầu tư vấn độc lập; không tự tạo đơn từ một câu hỏi tư vấn.
- Bình luận theo từng bài blog: không đăng nhập, một cấp, công khai ngay sau lưu thành công; không duyệt trước.
- Giao diện điện thoại/máy tính, trạng thái trống/lỗi/đang gửi/thành công, liên kết hoạt động, ảnh tối ưu, SEO cơ bản và thao tác bàn phím cho form/giỏ hàng.
- Hướng dẫn cập nhật nội dung, thiết lập kết nối Google Sheets và vận hành bình luận.

### 3.2 Phạm vi để giai đoạn sau

- Tìm kiếm, bộ lọc nâng cao.
- Thanh toán trực tuyến, tài khoản khách hàng và lịch sử đơn trên website.
- Quy tắc và chức năng gói Hoa Thời Ngày/Tuần/Tháng: tần suất, số tháng, đơn vị giá và tính giá gói.
- Tự động xếp lịch giao, gia hạn hoặc thu tiền định kỳ.
- Tải file ảnh tham khảo; phiên bản đầu chỉ nhận link tùy chọn.
- CMS/trang quản trị nội dung đầy đủ; quản trị đơn trên website.
- Theo dõi giao hàng, tồn kho và thông báo tự động qua các kênh ngoài Sheets.
- Reply, like, rating, tài khoản và chỉnh sửa bình luận bởi khách.

## 4 Nhật ký chốt yêu cầu

| Mã | Quyết định cuối | Hệ quả triển khai |
| --- | --- | --- |
| C1 | Khách nhập tên/nội dung, không đăng nhập; công khai ngay; một cấp | Ghi status Visible, đọc trực tiếp từ dữ liệu đã lưu. Shop có thể đổi Hidden để gỡ sau đăng; không có hàng đợi duyệt. |
| C2 | Đồng ý giỏ trộn dịch vụ, cấu hình mỗi dòng, một địa chỉ/người nhận chung; ngày mong muốn theo dòng | Một checkout chung; nhiều địa chỉ gửi yêu cầu riêng. |
| C3 | Chưa có yêu cầu chi tiết, bổ sung phase sau | Giữ trang giới thiệu Hoa Thời và form tiếp nhận nhu cầu. Không dựng lựa chọn gói hoạt động, số tháng bắt buộc, lịch hay phép tính giá gói. |
| C4 | Đồng ý fixed/range/quote và phí giao/giá cuối do shop xác nhận | Hiển thị đúng đơn vị; mục chưa có giá không được tính bằng 0. |
| C5 | Đồng ý đề xuất | Chọn phương án nhận link ảnh tùy chọn ở phase 1 để giữ tiến độ; upload file chuyển phase sau. |
| C6 | Tiếp nhận ngày/giờ mong muốn, shop xác nhận sau | Không tự hứa giao trong ngày, miễn phí hay giới hạn vùng chưa có dữ liệu. |
| C7 | Đồng ý thay khối ưu đãi bằng dịch vụ, đánh giá bằng câu chuyện; lợi ích dọc | Home theo baseline ở mục 6. |
| C8 | Đồng ý Sheet test riêng và tích hợp Apps Script; web deploy Vercel | Thiết kế kết nối và runbook. Không coi câu đồng ý là bằng chứng Sheet/credentials đã được thiết lập. |

Giờ bàn giao thứ Ba, người phụ trách Sheet và thông tin kết nối cụ thể chưa được cung cấp. Đây là đầu vào vận hành, không chặn viết code và không cần hỏi lại để khởi động các task độc lập. Bàn giao theo hạn 06/10/2026 khi cấu hình và nội dung thật sẵn sàng; không tự diễn giải thành một giờ cụ thể.

## 5 Sitemap triển khai

| Đường dẫn | Vai trò |
| --- | --- |
| / | Home |
| /san-pham | Tổng quan sản phẩm và điều hướng ba dịch vụ |
| /dich-vu/hoa-thoi | Giới thiệu Hoa Thời, mẫu tham khảo và tiếp nhận nhu cầu; quy tắc gói để phase sau |
| /dich-vu/hoa-tam | Giới thiệu Hoa Tâm và mẫu |
| /dich-vu/hoa-y | Giới thiệu Hoa Ý và mẫu |
| /san-pham/[slug] | Chi tiết sản phẩm, giá, tùy chọn và form dịch vụ |
| /gio-hang | Xem và chỉnh sửa giỏ |
| /dat-hoa | Checkout gửi yêu cầu |
| /ve-hoe | Giới thiệu, giá trị và FAQ |
| /blog | Danh sách bài viết |
| /blog/[slug] | Nội dung bài và bình luận |
| /lien-he | Thông tin shop và form tư vấn |
| /chinh-sach/[slug] | Chính sách đã được shop hoàn thiện |

Trang xác nhận sau gửi chỉ hiển thị mã yêu cầu và hướng dẫn tiếp theo trong phiên hiện tại; không công khai chi tiết khách hàng bằng URL đoán được.

## 6 Home và hệ thống thiết kế

### 6.1 Bố cục đã chốt ở C7

1. Header: logo Hòe, menu tiếng Việt, giỏ hàng có số lượng.
2. Hero chia hai cột theo mẫu: giới thiệu nhanh/slogan/CTA bên trái, ảnh hoa lớn bên phải. Trên điện thoại chuyển về một cột.
3. Lợi ích: Tiết kiệm thời gian, Dễ dàng lựa chọn, Duy trì niềm vui; trình bày dọc theo ghi chú.
4. Ba dịch vụ Thời, Tâm, Ý; mỗi mục giải thích ngắn và dẫn tới trang tương ứng.
5. Sản phẩm nổi bật: chọn một tập nhỏ từ danh mục; không đưa toàn bộ khoảng 30 sản phẩm vào Home. Số lượng hiển thị cấu hình trong content.
6. Khối ảnh/câu chuyện thương hiệu; dẫn đến bài Chuyện của Hòe.
7. CTA Khám phá dịch vụ kéo đến khối ba dịch vụ; CTA Đặt hoa ngay dẫn tới /san-pham.
8. Phần cuối trang: liên hệ, chính sách, social và nút inbox khi có URL thật.

Không sao chép nội dung hoa giả, giá USD, ưu đãi, số sao, lời đánh giá và phương thức thanh toán từ website tham chiếu. Home theo cấu trúc đã được đồng ý; điều chỉnh khi chủ dự án gửi yêu cầu thay đổi rõ ràng.

### 6.2 Thương hiệu

- Personality: Tinh tế, Có gu, Nữ tính, Lãng mạn, Giàu cảm xúc.
- Tone: Sang trọng, Tinh tế, Thanh lịch, Hiện đại, Nữ tính.
- Mood: Soft Luxury, Elegant Floral, Romantic, Sophisticated.
- Nền sáng/ivory, khoảng thở rộng; typography có serif hỗ trợ đủ dấu tiếng Việt ở tiêu đề và sans dễ đọc ở nội dung.

Mã dưới đây tạm lấy mẫu từ các vùng màu phẳng của image.png 224×219 px; đây không phải khẳng định mã HEX in nhỏ trong ảnh. Đồng bộ lại nếu có bảng màu gốc khác.

| Màu | HEX lấy mẫu | Vai trò đề xuất |
| --- | --- | --- |
| Berry Lipstick | #D6306E | CTA chính, trạng thái chọn, điểm nhấn |
| Pink Mist | #FF92C1 | Hover, điểm nhấn phụ |
| Soft Blush | #FCDFE1 | Nền khối nội dung nhẹ |
| Light Caramel | #EFB17E | Chi tiết trang trí, nền phụ |
| Jasmine | #EFD47B | Điểm nhấn nhỏ |

Kiểm tra tương phản từng cặp chữ/nền; không dùng toàn bộ bảng màu với tỷ lệ ngang nhau. Tokens CSS đặt tên theo vai trò và ánh xạ màu gốc tại một nơi. Animation ưu tiên reveal nhẹ, hover CTA/thẻ và chuyển trạng thái giỏ; tôn trọng reduced-motion và không cản thao tác form.

## 7 Luồng nghiệp vụ và quy tắc triển khai

### 7.1 Giỏ hàng và checkout

- Khách chọn mẫu, xem chi tiết, nhập tùy chọn dịch vụ và thêm vào giỏ.
- Dòng giỏ được định danh bằng productId và cấu hình, không chỉ productId. Hai mẫu giống nhau nhưng lời nhắn/ngày/cấu hình khác nhau không tự gộp. Cấu hình gói Hoa Thời chưa dùng ở phase 1.
- Khách sửa số lượng/cấu hình hoặc xóa; tải lại trang vẫn giữ giỏ. Chỉ lưu giỏ và sở thích cần thiết trên máy, không tự lưu thông tin liên hệ/địa chỉ vào localStorage.
- Checkout lấy thông tin liên hệ và nhận hoa chung theo C2; kiểm tra các form đã đủ trước khi gửi.
- Server xác thực sản phẩm, giá hiện tại và cấu hình; không tin giá hay trạng thái đơn do trình duyệt gửi lên. Nếu giá/cấu hình thay đổi cần khách xem lại.
- Nút Gửi yêu cầu đặt hoa thể hiện rõ shop sẽ xác nhận giá và lịch; chưa thanh toán trên website.
- Chỉ báo thành công sau khi hệ thống xác nhận lưu bền vững; khi lỗi giữ dữ liệu để thử lại.
- Mỗi lần gửi có requestId ổn định khi retry; cần cơ chế chống ghi trùng ở nơi lưu, không chỉ disable nút gửi.
- Mã tiếp nhận khác với xác nhận đơn/giao hàng. Website phiên bản đầu không tự chuyển sang đã xác nhận.

### 7.2 Form riêng

Dùng tên trường tiếng Việt ở giao diện và key ổn định trong schema. Thông tin nhận hoa chung ở checkout, không bắt khách nhập lại trong ba form. Mặc định bắt buộc họ tên người đặt, SĐT, tên người nhận và địa chỉ khi gửi đơn; SĐT người nhận tùy chọn, dùng số người đặt để shop liên hệ nếu để trống. Email và ghi chú tùy chọn. Form tư vấn chỉ bắt buộc tên, SĐT và nội dung. Ngày/giờ là thông tin mong muốn tùy chọn để shop chốt sau.

| Phạm vi | Trường |
| --- | --- |
| Thông tin checkout chung | Họ tên người đặt, SĐT, email tùy chọn, người nhận, SĐT người nhận, địa chỉ, ghi chú giao |
| Hoa Thời | Mẫu tham khảo nếu chọn từ catalog, ngày bắt đầu mong muốn, phong cách, màu sắc, ngân sách, nhu cầu định kỳ dạng ghi chú; tất cả tùy chọn. Không có dropdown gói hay số tháng bắt buộc. |
| Hoa Tâm | Mối quan hệ, dịp tặng, cảm xúc muốn gửi, màu sắc, hoa không thích, phong cách, ngân sách, lời nhắn, ngày/giờ mong muốn |
| Hoa Ý | Hình thức Bó/Hộp/Bình/Cành, loại hoa, màu, phong cách, kích thước, ngân sách, dịp tặng, lời nhắn, link ảnh tùy chọn, yêu cầu riêng, ngày/giờ mong muốn |
| Tư vấn chung | Họ tên, SĐT, email tùy chọn, dịch vụ quan tâm, nội dung yêu cầu; chỉ hỏi thêm trường giao nếu thực sự cần |

Hoa Tâm yêu cầu cảm xúc muốn gửi; các tùy chọn còn lại không bắt buộc. Hoa Ý yêu cầu hình thức, có thể mặc định từ mẫu; nếu đặt không chọn mẫu thì cần mô tả nhu cầu. Ngân sách là tham khảo, không thay giá catalog; khi thay đổi thiết kế ngoài cấu hình đã có giá thì chuyển dòng sang quote.

Ngày nếu được nhập không ở quá khứ theo Asia/Ho_Chi_Minh; ngày/giờ lựa chọn là mong muốn tới khi có chính sách giao. Validation không tự đặt vùng giao, minimum budget hay số tháng tối đa chưa được shop chốt.

### 7.3 Bình luận công khai ngay

- Bài đã xuất bản có form tên hiển thị và nội dung; không đăng nhập, không cần email.
- Validate và ghi vào Sheet Comments với status Visible. Sau lưu thành công, thêm bản ghi server trả về vào danh sách ngay cho người gửi; không dùng thông báo chờ duyệt.
- API đọc chỉ trả commentId, postId, displayName, body và createdAt của bản Visible, theo đúng bài; không lộ trường nội bộ hay dữ liệu Orders/Inquiries.
- Shop có thể đổi Visible thành Hidden trực tiếp trong Sheet để gỡ bình luận sau đăng; đây không phải duyệt trước. Không xóa hàng chuẩn để giữ ID ổn định.
- Bình luận là plain text, escape HTML; không dùng dangerouslySetInnerHTML. Tên không phải danh tính đã xác minh.
- Mặc định kỹ thuật: tên 1–80 ký tự sau trim, nội dung 1–1500 ký tự; 20 bình luận mỗi trang, mới nhất trước. Honeypot, giới hạn tần suất bằng trạng thái dùng chung ở gateway và validate lại phía server/gateway; không chỉ dựa vào trình duyệt hoặc bộ nhớ một Vercel Function.
- Đọc danh sách với cache tối đa 30 giây hoặc không cache trong phase 1; bản vừa đăng hiển thị ngay cho người gửi và cho lượt đọc mới không quá 30 giây. Sau đổi Hidden, biến mất ở lượt tải lại không quá 30 giây.
- Nếu Sheets lỗi: báo không thể tải/gửi và cho thử lại; không tự ghi comment vào source code hay giả báo thành công. Retry giữ requestId để không đăng trùng.
- Không có reply, rating, like hay chỉnh sửa bởi khách trong phase 1; không gọi bình luận blog là đánh giá đã mua hàng.

### 7.4 Hoa Thời khi chưa có quy tắc gói

- Trang Hoa Thời vẫn giới thiệu nhu cầu nhận hoa định kỳ. Nếu giữ tên Ngày/Tuần/Tháng trong nội dung, phải thể hiện là định hướng cần shop tư vấn, không phải lựa chọn gói có thể đặt hoặc lịch đã cam kết.
- Khách chọn mẫu tham khảo thì có thể thêm vào giỏ với serviceType hoa-thoi và priceMode quote. Giá dòng hiển thị Liên hệ báo giá; không lấy các khoảng giá cũ trong Word để suy ra gói mới.
- Khách không chọn mẫu có thể gửi nhu cầu qua form tư vấn Hoa Thời, lưu Inquiries. Gửi nhu cầu không đồng nghĩa đã đăng ký một gói.
- Feature flag subscriptionPackagesEnabled=false. Không bắt nhập planId/months, không tạo lịch hoặc nhân tiền theo số tháng; schema phase 1 từ chối payload đăng ký gói chưa được hỗ trợ. Thêm gói thật ở phase sau cần đặc tả và migration riêng.

### 7.5 Giá và tổng giỏ

- fixed: giá VND cho một đơn vị sản phẩm; tiền dòng bằng giá hiện tại nhân số lượng.
- range: có min/max và đơn vị xác định; tiền dòng là khoảng min×quantity đến max×quantity. Không dùng khoảng khi chưa rõ đơn vị.
- quote: không có tiền dòng; nhãn Cần shop báo giá. Nếu catalog chưa có giá thật, chỉ xuất bản theo quote với nội dung phù hợp.
- Nếu tất cả dòng có giá hợp lệ: hiển thị Tạm tính hoặc Khoảng tạm tính; phí giao Chờ shop xác nhận.
- Nếu có ít nhất một dòng quote: chỉ tổng các dòng đã có giá với nhãn Tạm tính phần đã có giá, liệt kê các dòng còn cần báo giá. Không hiển thị số này thành tổng toàn bộ đơn; không coi quote là miễn phí/0đ.
- Website không thu tiền. Phản hồi sau gửi: Hòe đã nhận yêu cầu [mã]. Shop sẽ liên hệ xác nhận giá và thời gian giao.
- Không cộng giá mẫu và giá gói Hoa Thời. Catalog được xác thực trên server và lưu snapshot khi gửi. Đổi thiết kế ngoài giá mẫu cần đánh dấu quote thay vì giữ giá cũ như giá cam kết.

### 7.6 Link ảnh tham khảo

- Trường URL https tùy chọn, giới hạn 2000 ký tự; không có nút upload trong phase 1.
- Lưu link vào snapshot/Sheet để shop xem. Website không fetch ảnh từ URL khách nhập, không tạo preview hoặc iframe từ link đó.
- Gợi ý khách dùng link mà shop có thể mở; khi link không xem được, shop liên hệ lại. Link mở với rel=noopener noreferrer nếu hiển thị ở trang xác nhận.

## 8 Công nghệ và tổ chức dự án

### 8.1 Stack

- Next.js App Router, TypeScript, Tailwind CSS, Zod; khóa phiên bản ổn định tại thời điểm bootstrap.
- Server Components cho trang nội dung; Client Components cho giỏ/form/bình luận tương tác. Next.js Route Handlers cho API chạy trên Vercel.
- Nội dung sản phẩm/dịch vụ/shop/Home ở JSON được kiểm tra schema; mỗi bài blog ở Markdown riêng với frontmatter. Markdown thuần phù hợp nội dung hiện tại, chỉ thêm MDX khi cần component trong bài.
- Google Sheets lưu yêu cầu, tư vấn và bình luận. Không dùng file JSON trong filesystem của Vercel để lưu dữ liệu khách.
- Gateway Apps Script nhỏ theo phương án C8 đã được đồng ý, có xác thực request từ server Vercel, cho thao tác lưu đơn dưới ScriptLock và kiểm tra requestId trước ghi. Đây là phần tích hợp Google Sheets, không phải một website hosting khác. Website và API website deploy trên Vercel; Apps Script là phần kết nối Sheets đã được đồng ý.
- Không dùng lock trong bộ nhớ một Vercel Function làm bảo đảm chống trùng. Nếu không dùng Apps Script, cần chọn một cơ chế idempotency bền vững khác trước nghiệm thu chức năng gửi đơn.
- Phase 1 nhận link ảnh; chưa cần Vercel Blob hay nơi upload riêng. Không ghi base64 vào Sheets hoặc repo.

### 8.2 Cấu trúc dự án

| Vị trí | Nội dung và phạm vi sửa |
| --- | --- |
| content/site.json | Thông tin shop, menu, social, FAQ |
| content/home.json | Nội dung Home và thứ tự section |
| content/services/ | Nội dung ba dịch vụ và feature flag; định nghĩa gói chưa hoạt động ở phase 1 |
| content/products/ | Một file mỗi sản phẩm; ID ổn định, slug, giá, nội dung, ảnh, published |
| content/blog/ | Một file Markdown mỗi bài, frontmatter, published |
| content/policies/ | Các chính sách đã chốt |
| public/images/ | Logo/ảnh nội dung đã tối ưu và đặt tên có nghĩa |
| src/styles/tokens.css | Màu, khoảng cách, typography |
| src/components/ | Thành phần dùng chung và section Home |
| src/features/cart/ | Quy tắc và giao diện giỏ |
| src/features/checkout/ | Form, validation, gửi yêu cầu |
| src/features/comments/ | Hiển thị và gửi bình luận |
| src/domain/ | Schema, kiểu dữ liệu và quy tắc giá/dịch vụ |
| src/server/repositories/ | Contract OrderRepository, InquiryRepository, CommentRepository |
| src/server/integrations/ | Adapter Google Sheets/Apps Script |
| integrations/google-sheets/ | Script gateway, schema Sheet, hướng dẫn cấu hình |
| docs/ | Quyết định BA, backlog, hướng dẫn cập nhật và vận hành |

Không đưa toàn bộ nội dung vào một component Home dài. Thay nội dung chỉ sửa file content liên quan; thay màu chỉ sửa tokens; adapter và UI độc lập để sau này đổi sang database/CMS. Không thêm abstraction cho các chức năng chưa cần. Có mục chỉ dẫn ngắn cho Codex nêu thay đổi loại nào thì đọc/sửa file nào; yêu cầu cập nhật nội dung không kéo theo refactor toàn dự án.

### 8.3 Google Sheets

| Tab | Bản ghi và dữ liệu |
| --- | --- |
| Orders | Một hàng chuẩn cho mỗi yêu cầu: requestId, thời gian, status, buyer, recipient, address, snapshot các dòng đơn, tổng/khoảng ước tính nếu có, shipping pending, ghi chú shop |
| Inquiries | requestId, thời gian, trạng thái, liên hệ, dịch vụ, câu hỏi |
| Comments | commentId/requestId, postId, thời gian, tên hiển thị, nội dung, status Visible hoặc Hidden |

Một hàng Orders giữ snapshot JSON chuẩn và tóm tắt các mục dễ đọc. Nếu tạo tab chi tiết từng dòng, tab đó là projection có thể tái tạo; không coi nhiều lần append vào nhiều tab là một transaction. Lưu snapshot tên/giá/đơn vị/cấu hình khi gửi để cập nhật catalog không làm đổi yêu cầu cũ.

Google Sheet test và production tách riêng. Trình duyệt chỉ gọi API website; khóa tích hợp nằm ở server/environment Vercel, không dùng NEXT_PUBLIC cho secrets. Trường khách nhập phải lưu dưới dạng dữ liệu text, không bị thực thi như công thức Sheets. Không công khai Sheet đơn hàng. Khi gateway timeout nhưng có thể đã lưu, retry giữ requestId và trả lại bản ghi đã tồn tại. Gateway xác thực chữ ký HMAC kèm timestamp từ server Vercel; secret ở Script Properties và biến môi trường server. Public GET không trả Orders hoặc Inquiries. Dùng ScriptLock cho check-and-write, requestId gắn payloadHash; cùng ID khác payload trả conflict. Dữ liệu khách được ghi dưới dạng text an toàn, không dùng trực tiếp công thức. Giới hạn tần suất phải có trạng thái dùng chung và được kiểm thử; không cần thêm database cho phase 1.

## 9 Backlog triển khai và tiêu chí nghiệm thu

| Task | Phụ thuộc | Kết quả | Nghiệm thu chính |
| --- | --- | --- | --- |
| P0 Baseline BA | Đã hoàn thành trong tài liệu này | Quyết định phạm vi, giá, form, bình luận, Hoa Thời phase sau | Không tự đưa quy tắc gói hoặc duyệt trước vào phase 1 |
| P1 Bootstrap và dữ liệu | P0 | Repo, Next.js, TS, tokens, schema JSON/Markdown, routing, env example | Build/typecheck/lint pass; secret không vào client; content có ID ổn định |
| P2 Home và layout | P1 | Header/footer, hero hai cột, lợi ích dọc, ba dịch vụ, featured, câu chuyện, CTA, responsive | Đúng bố cục chốt, tiếng Việt, CTA đúng đích; không có ưu đãi/đánh giá giả |
| P3 Catalog và form dịch vụ | P1 | List/detail, form Tâm/Ý, Hoa Thời tiếp nhận nhu cầu | fixed/range/quote đúng; không dropdown gói hoạt động, không tính lịch/tháng; nội dung draft không xuất bản |
| P4 Giỏ và checkout | P3 | Giỏ persistent, sửa cấu hình/số lượng, một người nhận/địa chỉ chung, ngày theo dòng | Hai cấu hình khác nhau không gộp; quote không 0đ; retry giữ ID; thông tin không nhập lặp |
| P5 Google Sheets | P1, schema P4, cấu hình kết nối | Gateway, Orders/Inquiries/Comments, chữ ký, idempotency, xử lý lỗi | Dữ liệu lưu thật; bấm đôi/timeout/retry không tạo trùng; không báo thành công khi chưa lưu |
| P6 Blog và bình luận | P1, P5 | Blog list/detail, gửi và đọc comment công khai ngay | Không đăng nhập/chờ duyệt; đúng bài; Visible hiện ngay; Hidden gỡ sau tối đa 30 giây; không lộ dữ liệu nội bộ |
| P7 Trang nội dung và assets | P1, nội dung thật | Về Hòe, Liên hệ, FAQ, chính sách, ảnh/logo | Loại dữ liệu minh họa/tên Thơ Fleur; social thật; form tư vấn lưu Inquiries |
| P8 Nghiệm thu và Vercel | P2–P7 | Preview, production, runbook, content guide | End-to-end trên deployment; mobile/desktop; shop mở Sheet và xem đúng dữ liệu; phân biệt preview và vận hành thật |

P1–P8 đang ở trạng thái Chưa triển khai. Codex thực hiện theo thứ tự phụ thuộc; có thể dựng UI/content và gateway độc lập khi contract đã thống nhất. Khi thiếu credentials, dùng adapter test để phát triển và đánh dấu tích hợp thật chưa nghiệm thu; không tuyên bố website vận hành thực tế bằng kết quả mock.

## 10 Kế hoạch tiến độ có điều kiện

| Mốc | Mục tiêu |
| --- | --- |
| Tối Chủ nhật 04/10 | Bàn giao baseline v1.0 và backlog; bắt đầu bootstrap, chuẩn bị Sheet test/kết nối |
| Thứ Hai 05/10 | Dựng preview; hoàn thành Home, catalog, giỏ, form và kết nối thử; blog/comment hoạt động |
| Thứ Ba 06/10 | Thay assets/nội dung thật, kiểm tra end-to-end, sửa lỗi và deploy Vercel trước giờ bàn giao được chốt |

Đây là mục tiêu thực hiện theo hạn của chủ dự án, không phải cam kết thời lượng trước khi có người triển khai, cấu hình kết nối và dữ liệu. Giảm animation/nội dung phụ nếu cần giữ tiến độ; không thay giỏ hàng hoặc bình luận thật bằng demo để tuyên bố hoàn tất.

## 11 Kiểm thử cần thực hiện

- Một yêu cầu thực tế cho Tâm/Ý, Hoa Thời quote, một tư vấn Hoa Thời không chọn mẫu và một giỏ trộn; đối chiếu toàn bộ trường vào Sheet.
- Các mẫu cùng ID nhưng khác cấu hình; sửa và tải lại giỏ; giỏ trống; số lượng không hợp lệ.
- Giá khoảng có đơn vị, giá cố định và quote; mixed cart không hiển thị phần đã có giá thành toàn bộ tổng; không cộng trùng giá mẫu/gói; server từ chối dữ liệu giá giả hoặc sản phẩm chưa published.
- Bấm đôi, retry khi response mất sau lưu, lỗi xác thực, lỗi Sheet và timeout; không mất dữ liệu khách/không hiển thị thành công giả.
- Form tư vấn lưu riêng, không tạo đơn.
- Bình luận Visible công khai ngay, đúng postId, đổi Hidden để gỡ; retry không tạo trùng; pagination/cache đáp ứng 30 giây; nội dung HTML/script và chuỗi có thể thành công thức Sheet.
- Link ảnh rỗng/hợp lệ/sai scheme/quá dài; không fetch hay embed URL tùy ý.
- Hoa Thời không có lựa chọn gói hoạt động, số tháng bắt buộc, lịch giao tự sinh hoặc phép nhân tiền theo thời gian; yêu cầu vẫn lưu để shop tư vấn.
- Kiểm tra thao tác giỏ/form/bình luận trên màn hình nhỏ và desktop, focus/label/lỗi đọc được, ảnh không vỡ, không layout tràn ngang.
- Build/typecheck/lint và bộ kiểm thử nghiệp vụ giá/validation/idempotency; smoke test sau deploy với dữ liệu test xác định rõ.

## 12 Điều kiện mở nhận khách

- Có sản phẩm/giá/ảnh thật được shop cho phép bán và bài blog đủ nội dung xuất bản; bản draft không được công khai như nội dung hoàn thiện.
- Có thông tin shop/liên hệ thật; không dùng địa chỉ/hotline minh họa trong Word.
- Shop cung cấp cách tiếp nhận và xác nhận yêu cầu, giá đang hiển thị, phương thức thanh toán với shop và xử lý thay đổi/hủy. Ngày/giờ giao là mong muốn chờ shop xác nhận. Gói Hoa Thời chưa bán như gói có lịch/giá cam kết ở phase 1.
- Google Sheets production nhận đơn thật; có người theo dõi đơn và có khả năng ẩn bình luận sau đăng khi cần.
- Kết nối Vercel/Google được cấu hình qua kênh phù hợp; nghiệm thu luồng thành công và lỗi trên deployment thực tế.
- Nếu chưa đủ dữ liệu thật có thể bàn giao preview hoàn chỉnh về chức năng, nhưng phải phân biệt với việc website đã sẵn sàng vận hành.

## 13 Tài liệu bàn giao cuối

- README: khởi chạy, cấu hình env, deploy Vercel và kiểm tra kết nối.
- CONTENT_GUIDE: thêm/sửa sản phẩm, gói, ảnh, bài blog và thứ tự Home; file cần sửa theo từng loại yêu cầu.
- SHEETS_RUNBOOK: cột Sheet, trạng thái đơn, ẩn bình luận sau đăng, đọc ảnh và xử lý lỗi gửi.
- REQUIREMENTS: quyết định cuối và acceptance criteria.
- BACKLOG: task và tình trạng hoàn thành; phần chuyển sang giai đoạn sau.

## 14 Tài liệu kỹ thuật tham chiếu

- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Google Apps Script LockService: https://developers.google.com/apps-script/reference/lock/
- Google Sheets API values append: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append
- Google Sheets API limits: https://developers.google.com/workspace/sheets/api/limits
- Vercel Function limitations: https://vercel.com/docs/functions/limitations

Kế hoạch này lựa chọn cách phân tách code và tích hợp dựa trên yêu cầu hiện tại. Những API nền tảng trên hỗ trợ triển khai; chúng không tự bảo đảm chống trùng, kiểm soát bình luận sau đăng, bảo vệ dữ liệu hoặc tính đúng giá nếu ứng dụng chưa thực hiện và kiểm thử các quy tắc đã nêu.

## 15 Contract API và trạng thái

| API | Dữ liệu chính | Kết quả |
| --- | --- | --- |
| POST /api/orders | requestId, buyer, recipient, address, items với productId/quantity/configuration, ghi chú | Lưu snapshot giá/cấu hình do server tính; trả requestId và status received. Không trả đã xác nhận. |
| POST /api/inquiries | requestId, tên/SĐT, dịch vụ, nội dung, email tùy chọn | Lưu Inquiries; trả mã tiếp nhận. |
| GET /api/comments?postId=...&cursor=... | postId hợp lệ, cursor phân trang | Chỉ Visible của bài đã xuất bản; public DTO không chứa dữ liệu nội bộ. |
| POST /api/comments | requestId, postId, displayName, body, honeypot | Ghi Visible và trả bình luận đã lưu; công khai ngay. |

HTTP: 400/422 dữ liệu sai, 409 cùng requestId khác payload, 429 quá tần suất, 503 upstream lỗi/tạm không khả dụng. API không echo dữ liệu nhạy cảm vào log/error công khai. Schema dùng chung client/server; kiểm tra lại ở server. Không cache response POST. Không expose gateway secret hay gọi gateway từ trình duyệt.

Trạng thái UI: idle, validating, submitting, success, error. submitting khóa thao tác gửi trùng; success chỉ sau lưu thành công. error giữ input và requestId khi retry cùng payload. Nếu người dùng sửa payload trước gửi lại, tạo requestId mới; không dùng ID của yêu cầu đã lưu cho một yêu cầu mới.

Đơn ở Sheets: received, contacted, confirmed, cancelled; shop cập nhật thủ công. Website phase 1 chỉ tạo received và không có trang tra cứu trạng thái công khai. Bình luận: Visible khi lưu, Hidden khi shop ẩn sau đăng; không có Pending/Approved trong luồng phase 1.

## 16 Mặc định triển khai và bàn giao cho Codex

- Feature flags trong config: subscriptionPackagesEnabled=false, imageUploadEnabled=false, searchEnabled=false, advancedFiltersEnabled=false, onlinePaymentEnabled=false, commentsEnabled=true, commentPreModerationEnabled=false.
- Chỉ dùng CTA inbox khi có URL thật; không tạo hotline/address/social giả. Logo/ảnh placeholder được ghi nhận là dữ liệu preview và thay từ manifest khi chủ dự án cung cấp.
- Khoảng 10 mẫu mỗi dịch vụ là mục tiêu nội dung, không phải lý do tự tạo 30 sản phẩm thương mại. Có thể dùng fixtures rõ ràng ở môi trường test; production chỉ published dữ liệu đã được shop chốt.
- Không tạo route/admin UI cho các chức năng chưa thuộc scope. Về sau thêm CMS/database qua contract repository; source content vẫn có schema để migration.
- Mỗi task bàn giao kèm danh sách file thay đổi, cách kiểm tra và hạn chế thực tế còn lại. Test tập trung nghiệp vụ giá, giỏ có cấu hình khác nhau, validation và idempotency; không viết test chỉ lặp lại HTML nội dung.

### 16.1 Prompt khởi động cho Codex

Đóng vai developer triển khai website Hòe từ baseline v1.0 này. Xây mới bằng Next.js App Router, TypeScript và Tailwind CSS, deploy trên Vercel. Thực hiện backlog P1–P8 theo dependency và acceptance criteria. Tách content JSON/Markdown, design tokens, feature giỏ/form/comment và adapter Google Sheets. Website tiếp nhận yêu cầu, shop xác nhận giá/lịch sau; không thu tiền online. Cho trộn dịch vụ trong giỏ, cấu hình riêng từng dòng, một địa chỉ/người nhận chung. Hoa Thời chỉ giới thiệu và tiếp nhận nhu cầu/quote; không tự triển khai gói Ngày/Tuần/Tháng, số tháng, lịch hoặc phép tính giá. Bình luận blog không đăng nhập, một cấp, công khai ngay sau lưu, lưu Comments ở Sheets; không duyệt trước. Link ảnh tham khảo tùy chọn, không upload. Home theo website mẫu và bố cục đã chốt; không tham khảo Thơ Fleur. Dùng Apps Script gateway có xác thực/idempotency để kết nối Sheets; web và API ở Vercel. Chuẩn bị preview với test Sheet trước, thay nội dung thật khi nhận được. Khi thiếu dữ liệu/kết nối, tiếp tục phần độc lập và ghi rõ phần chưa nghiệm thu. Hoàn thành kiểm thử nghiệp vụ/end-to-end và hướng dẫn cập nhật nội dung/Sheet trước bàn giao. Không tự đổi quyết định phạm vi; không gọi mock là tích hợp thật.
