"use client";
import { useState } from "react";
import { AdminEditor } from "./AdminEditor";
import { AdminField } from "./AdminField";
const sample = {
  id: "preview-hoa-y",
  slug: "preview-hoa-y",
  name: "Một chút nắng — mẫu giao diện",
  description:
    "Ảnh và giá minh họa để duyệt bố cục. Không phải sản phẩm đang bán.",
  serviceType: "hoa-y",
  image: "/images/preview/roses.jpg",
  imageAlt: "Hoa test minh họa",
  priceMode: "fixed",
  amount: 500000,
  unit: "mẫu",
  publicationStatus: "draft",
  defaultDesign: { color: "Hồng", style: "Thanh lịch" },
  pricedOptions: {},
  fixture: 1,
  editVersion: 0,
};
export function ProductDesignPreview() {
  return <AdminEditor resource="products" row={sample} demo />;
}
export function ControlDesignPreview() {
  const [value, setValue] = useState("");
  return (
    <div className="admin-panel">
      <div className="admin-field-grid">
        <AdminField
          path="preview.input"
          label="Ô nhập mặc định"
          value={value}
          change={(_, next) => setValue(String(next))}
          errors={{}}
          hint="Nhấn Tab để kiểm tra focus."
        />
        <AdminField
          path="preview.error"
          label="Ô nhập có lỗi"
          value=""
          change={() => {}}
          errors={{ "preview.error": "Ví dụ lỗi: cần điền thông tin." }}
        />
      </div>
      <div className="phase3-preview-nav">
        <button className="button" type="button">
          Hành động chính
        </button>
        <button className="button secondary" type="button">
          Hành động phụ
        </button>
        <button className="button" disabled>
          Đang lưu…
        </button>
        <button className="button secondary" disabled>
          Chưa khả dụng
        </button>
      </div>
      <p className="admin-hint">
        Hover / focus / disabled / loading là trạng thái mẫu, không gửi dữ liệu.
      </p>
      <p className="success" role="status">
        Đã kiểm tra cấu hình mẫu.
      </p>
    </div>
  );
}
