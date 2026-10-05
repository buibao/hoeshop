"use client";
import { Action } from "@/components/ui/Action";

import { useState } from "react";
import { AdminEditor } from "./AdminEditor";
import { AdminField } from "./AdminField";
import { Button } from "@/components/untitled/base/buttons/button";
import { Checkbox } from "@/components/untitled/base/checkbox/checkbox";
import {
  RadioGroup,
  RadioButton,
} from "@/components/untitled/base/radio-buttons/radio-buttons";
import { Input } from "@/components/untitled/base/input/input";
import { SelectField } from "@/components/ui/SelectField";
import { QuantityField } from "@/components/ui/QuantityField";
import { LibraryDialog } from "@/components/ui/LibraryDialog";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { Form } from "@/components/ui/Form";
import { Skeleton } from "@/components/ui/Skeleton";
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
  const [open, setOpen] = useState(false),
    [receipt, setReceipt] = useState("");
  return (
    <div className="admin-panel rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
      <div className="admin-field-grid grid grid-cols-1 gap-4 md:grid-cols-2">
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
      <div className="phase3-preview-nav flex flex-wrap gap-3">
        <Action className="button" type="button">
          Hành động chính
        </Action>
        <Action className="button secondary" type="button">
          Hành động phụ
        </Action>
        <Button size="md" color="primary" isLoading>
          Đang lưu…
        </Button>
        <Action className="button secondary" disabled>
          Chưa khả dụng
        </Action>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          size="md"
          label="Trường đã vô hiệu hóa"
          defaultValue="Giữ dữ liệu"
          isDisabled
        />
        <SelectField
          name="preview.choice"
          label="Lựa chọn"
          defaultValue="bo"
          options={[
            { value: "", label: "Chưa chọn" },
            { value: "bo", label: "Bó" },
            { value: "hop", label: "Hộp" },
          ]}
        />
        <QuantityField name="preview.quantity" />
        <Checkbox size="sm" label="Lựa chọn đã chọn" defaultSelected />
        <RadioGroup size="sm" aria-label="Ưu tiên" defaultValue="sample">
          <RadioButton value="sample" label="Theo mẫu" />
          <RadioButton value="custom" label="Yêu cầu riêng" />
        </RadioGroup>
      </div>
      <p className="admin-hint text-sm text-tertiary">
        Hover / focus / disabled / loading là trạng thái mẫu, không gửi dữ liệu.
      </p>
      <p
        className="success rounded-xl bg-primary p-4 text-success-primary ring-1 ring-success_secondary"
        role="status"
      >
        Đã kiểm tra cấu hình mẫu.
      </p>
      <Skeleton />
      <Button size="md" color="secondary" onPress={() => setOpen(true)}>
        Thử field trong modal
      </Button>
      <LibraryDialog
        open={open}
        close={() => setOpen(false)}
        title="Widget trong modal — dữ liệu mẫu"
      >
        <Form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setReceipt(
              `${data.get("modalDate")} · ${data.get("modalTime")} · ${data.get("modalShape")}`,
            );
          }}
        >
          <DateTimeField
            name="modalDate"
            label="Ngày mẫu trong modal"
            type="date"
            defaultValue="2028-02-29"
          />
          <DateTimeField
            name="modalTime"
            label="Giờ mẫu trong modal"
            type="time"
            defaultValue="23:59"
          />
          <SelectField
            name="modalShape"
            label="Hình thức mẫu trong modal"
            defaultValue="bo"
            options={[
              { value: "", label: "Chưa chọn" },
              { value: "bo", label: "Bó" },
              { value: "hop", label: "Hộp" },
            ]}
          />
          <Button size="md" color="primary" type="submit">
            Kiểm tra FormData mẫu
          </Button>
          <Button size="md" color="secondary" type="reset">
            Khôi phục mẫu
          </Button>
          <p role="status">{receipt}</p>
        </Form>
      </LibraryDialog>
    </div>
  );
}
