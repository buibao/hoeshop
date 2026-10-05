"use client";
import { Form } from "@/components/ui/Form";
import { Action } from "@/components/ui/Action";

import { useState, useSyncExternalStore } from "react";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { vietnamToday } from "@/domain/schemas";
import { displayDate } from "@/domain/date-time";
const readySubscription = () => () => {};
export function WidgetPreview() {
  const ready = useSyncExternalStore(
    readySubscription,
    () => true,
    () => false,
  );
  const [selection, setSelection] = useState({ date: "", time: "" });
  return (
    <div className="widget-preview-grid grid grid-cols-1 gap-8 py-8 lg:grid-cols-2" data-ready={ready}>
      <section className="widget-preview-card flex flex-col gap-4 rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
        <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">THỬ CHỌN MỘT NGÀY DỊU DÀNG</span>
        <h2>Ngày và giờ nhận hoa</h2>
        <p className="form-note text-sm text-tertiary" >
          Ngày, giờ là mong muốn của bạn. Hòe sẽ liên hệ xác nhận lịch.
        </p>
        <Form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            setSelection({
              date: String(data.get("desiredDate") || ""),
              time: String(data.get("desiredTime") || ""),
            });
          }}
        >
          <DateTimeField
            name="desiredDate"
            label="Ngày nhận mong muốn"
            type="date"
            hint="Chọn trên lịch hoặc nhập dd/mm/yyyy."
          />
          <DateTimeField
            name="desiredTime"
            label="Giờ mong muốn"
            type="time"
            hint="Giờ Việt Nam, định dạng 24 giờ."
          />
          <Action type="submit" className="button">
            Xem lựa chọn
          </Action>
        </Form>
        <div className="widget-preview-state rounded-xl bg-secondary p-4" role="status">
          {selection.date || selection.time
            ? `Bạn muốn nhận hoa ${selection.date ? displayDate(selection.date) : "chưa chọn ngày"}${selection.time ? " lúc " + selection.time : ""}.`
            : "Chưa có lựa chọn. Hãy mở lịch hoặc bộ chọn giờ để thử."}
        </div>
      </section>
      <section className="widget-preview-card flex flex-col gap-4 rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
        <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">CÁC TRẠNG THÁI ĐỂ NGHIỆM THU</span>
        <h2>Rõ ràng ở từng thao tác</h2>
        <DateTimeField
          name="selectedDate"
          label="Ngày đã chọn"
          type="date"
          defaultValue={vietnamToday()}
        />
        <DateTimeField
          name="selectedTime"
          label="Giờ đã chọn"
          type="time"
          defaultValue="14:30"
        />
        <DateTimeField
          name="errorDate"
          label="Ngày cần kiểm tra"
          type="date"
          defaultValue="2026-02-30"
          errors={{ errorDate: "Ngày này không tồn tại. Vui lòng chọn lại." }}
        />
        <DateTimeField
          name="disabledTime"
          label="Đang chờ gửi yêu cầu"
          type="time"
          defaultValue="09:00"
          disabled
        />
        <DateTimeField name="disabledDate" label="Ngày đang chờ xác nhận" type="date" defaultValue={vietnamToday()} disabled />
        <DateTimeField name="readonlyDate" label="Ngày cũ giữ nguyên để xem lại" type="date" defaultValue="2025-12-31" readOnly />
        <p className="form-note text-sm text-tertiary">
          Dùng Tab để chuyển segment và nút mở lịch. Trong lịch dùng phím
          mũi tên; Escape để đóng. Dữ liệu trên trang này không gửi vào hệ thống
          đặt hoa.
        </p>
      </section>
    </div>
  );
}
