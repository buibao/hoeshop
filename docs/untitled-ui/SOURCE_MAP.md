# Nguồn và patch Untitled UI

Nguồn miễn phí [untitleduico/react tại commit đã khóa](https://github.com/untitleduico/react/tree/4702dc0ea8d140c3491a85670c7b4fab47b722da), MIT. [Manual installation](https://www.untitledui.com/react/docs/installation). Không dùng React PRO, không lấy latest. Notice được giữ trong `src/components/untitled/LICENSE`.

`upstream.json` ghi URL/path, SHA-256 upstream, local hash và dependency closure của 63 file. Import alias được đổi có hệ thống sang `@/components/untitled/`; không sửa module nghiệp vụ để giả làm source upstream. `upstream.patch` ghi diff ngoài namespace. `node scripts/audit-untitled.mjs` phát hiện patch chưa ghi nhận. Khôi phục source bằng `node scripts/vendor-untitled.mjs --apply-patches`, sau đó `node scripts/audit-untitled.mjs --record` và kiểm thử lại; importer thay source và manifest, không chạy giữa các milestone.

## Component và nơi dùng

Mọi đường dẫn dưới đây tương đối với root repository upstream, cùng commit trên; nguồn truy cập được trong public MIT repository. Demo là reference pattern, dữ liệu demo không được đưa vào shop.

| Vai trò/reference | Source | Variant | Adapter/nơi dùng | Dependencies chính |
| --- | --- | --- | --- | --- |
| Form/inputs.demo pattern | `components/base/form/form.tsx`, `components/base/input/input.tsx` | md | ui/Form, Fields, AdminField; sản phẩm/giỏ/checkout/tư vấn/comment/editor | React Aria Components |
| TextArea | `components/base/textarea/textarea.tsx` | md | Fields/AdminField; Markdown textarea + safe preview | RAC |
| Select | `components/base/select/select.tsx` | md | SelectField; hình thức, admin enum/filter | RAC, icons |
| Checkbox/RadioGroup | `components/base/checkbox/checkbox.tsx`, `components/base/radio-buttons/radio-buttons.tsx` | sm | priced shapes, boolean settings; gallery radio | RAC |
| Button/utility | `components/base/buttons/button.tsx`, `button-utility.tsx` | md primary/secondary/tertiary; source utility variant | Action/ActionLink, widget/media/gallery | RAC, tailwind-merge |
| DatePicker/Calendar | `components/application/date-picker/date-picker.tsx`, `calendar.tsx`, `cell.tsx` | trigger md; Calendar/footer giữ source | DateTimeField, widget gallery, cấu hình/giỏ/tư vấn | RAC, internationalized/date, react-stately/utils, react-aria |
| Time-only adapter | `components/base/input/input-date.tsx` | InputDateBase md | React Aria TimeField 24h/minute + DateTimeField | RAC, internationalized/date |
| InputNumber | `components/base/input/input-number.tsx` | md horizontal 1–99; editor vertical | QuantityField/AdminField | RAC |
| HeaderNavigationDualTierDemo pattern | `components/application/app-navigation/header-navigation.tsx` | base, secondaryType buttons; mobile disclosure | Header — catalog + ba dịch vụ | RAC, icons |
| SidebarNavigationSimpleDemo pattern | `components/application/app-navigation/sidebar-navigation/sidebar-simple.tsx` | simple, no demo account card | AdminNav, standalone gallery panel | RAC, icons |
| Table01DividerLine pattern | `components/application/table/table.tsx` | TableCard md, Header bordered | DataTable adapter, OrderTable và admin resources | RAC, icons |
| BadgeWithDot | `components/base/badges/badges.tsx` | pill-color sm | StatusBadge với value DB/nhãn Việt giữ nguyên | icons |
| Modal/SlideoutMenu | `components/application/modals/modal.tsx`, `slideout-menus/slideout-menu.tsx` | source modal; mobile navigation dùng overlay source riêng | LibraryDialog/media; Slideout primitive có trong closure, chưa cần consumer riêng | RAC |
| FileUpload | `components/application/file-upload/file-upload-base.tsx` | DropZone + List/ProgressBar | MediaLibrary, Blob thực tế | Motion, file-icons |
| Pagination pattern | `components/application/pagination/pagination.tsx` | free minimal/card pattern | composition prev/next từ Button với page/hasMore thật | RAC |

TimeField là **adapter từ primitive**, không phải time-only template hoàn chỉnh của Untitled. [React Aria TimeField](https://react-aria.adobe.com/TimeField).

Action/ActionLink đặt SVG Lucide đã render từ server vào icon slot upstream, dùng đúng class icon source; không truyền component function qua RSC boundary hoặc để icon xuống dòng trong text wrapper. Geometry button/icon giữ variant source.

## Patch ngoài namespace

- Logo: thay artwork Untitled bằng wordmark/asset Hòe, giữ slot source.
- Header/sidebar: bỏ search/support/mock-account demo vì không có nghiệp vụ này; mobile giữ action giỏ và catalog, dùng Next Link cho logo. Nhãn navigation tiếng Việt; dialog có accessible name. Nút đóng được chuyển vào dialog focus scope để không bị modal làm inert; giữ nguyên vị trí/kích thước. Navigation remount theo pathname để đóng menu sau navigation.
- Calendar/date picker: nhãn Việt, formatter ngày số, múi giờ Việt Nam, tuần thứ Hai; bỏ cắt hai ký tự làm mọi thứ đều thành “Th”. Không đổi kích thước ô, padding, popup hoặc footer.
- Button export LinkProps cho adapter TypeScript, không sửa variant geometry.
- Label required indicator: giữ glyph/geometry qua pseudo content, đánh dấu aria-hidden để tên label không chứa ký tự trang trí.
- InputNumber: nhãn tăng/giảm tiếng Việt. Adapter formatter chỉ số nguyên theo constraint hiện có, tránh inputMode khác giữa SSR và Android. FileUpload: nhãn chọn/kéo thả/xóa/retry tiếng Việt.
- Guard reduced motion ở theme Hòe và MotionConfig: không dịch chuyển/animation khi người dùng yêu cầu, giữ geometry.

Không ghi đè padding/radius component qua class legacy hoặc custom `!important`. Một số utility `!` có sẵn trong source Button/Popover được giữ và ghi trong patch/hash; đó không phải rule ép style bổ sung.

## Theme Hòe

Theme/typography/plugins upstream giữ nguyên scale spacing/radius/shadow/text/breakpoint. `src/styles/untitled/hoe-theme.css` chỉ map branding và accessibility. Biến next/font nguồn là `--font-hoe-body`/`--font-hoe-display`, map một chiều tới body/display, không tự tham chiếu.

| Token | Màu/nguồn |
| --- | --- |
| brand-50 | 50% blush + white, OKLCH |
| brand-100 | blush `#FCDFE1` |
| brand-200 / 300 | blush 67% / 33% + pink |
| brand-400 | pink `#FF92C1` |
| brand-500 | berry `#D6306E` |
| brand-600 / 700 | `#AF2154` / `#922044` |
| brand-800 / 900 / 950 | brand-700 85% / 70% / 55% + black |
| bg-brand-solid / hover | brand-500 / brand-600, giữ CTA/hover Hòe |
| bg-primary | ivory `#FFFCF7` |
| text/fg-primary | `#332C2A` |
| hoe-caramel / hoe-jasmine | `#EFB17E` / `#EFD47B` |
| font-body / font-display | Be Vietnam Pro / Lora |

Shade bổ sung chỉ khai báo trong theme. Store headings dùng display font; admin dùng body font. Legacy CSS field/navigation/overlay/reset/token/motion đã loại bỏ; class marker còn lại chỉ phục vụ cấu trúc và browser selectors, không còn rule geometry riêng.

## Composition cho Hòe — không phải template chính thức

Home/marketing section, product/image card 4:5, page header, settings/product/article editor layout, dashboard, inline alert/status, empty/skeleton và phân trang chưa có total là **composition cho Hòe**. Dùng utility token scale và primitives trên; không gọi chúng là template miễn phí hoặc PRO upstream. Không mô phỏng toast PRO.

Clerk SignIn/UserButton giữ SDK provider, Việt hóa bằng localization provider và map màu/font; không gắn nhãn Untitled UI. Business/date/time/FormData adapters nằm ngoài namespace vendor. DB/server/repositories không bị thay để đáp ứng UI.
