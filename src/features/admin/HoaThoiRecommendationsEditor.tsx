"use client";
import { AdminField } from "./AdminField";
import { useState } from "react";
import { MAX_RECOMMENDATIONS, recommendationSchema, recommendationPrice, parseVndAmount, type Recommendation } from "@/domain/recurrence";

function MoneyField({ path, label, value, change, error }: { path: string; label: string; value: number; change: (path: string, value: unknown) => void; error?: string }) {
  const [draft, setDraft] = useState(() => new Intl.NumberFormat("vi-VN").format(value));
  return <div className="field admin-control"><label htmlFor={path}>{label} (₫)</label>
    <input id={path} name={path} type="text" inputMode="numeric" value={draft} onChange={(e) => {
      const raw = e.target.value;
      setDraft(raw);
      change(path, parseVndAmount(raw));
    }} onBlur={() => {
      const amount = parseVndAmount(draft);
      if (amount !== null) setDraft(new Intl.NumberFormat("vi-VN").format(amount));
    }} aria-invalid={!!error} aria-describedby={error ? `${path}-error` : undefined} />
    {error ? <small id={`${path}-error`} className="admin-field-error">{error}</small> : null}
  </div>;
}

export function HoaThoiRecommendationsEditor({ rows, change, errors }: {
  rows: Recommendation[]; change: (path: string, value: unknown) => void; errors: Record<string, string>;
}) {
  function reorder(index: number, offset: number) {
    const next = [...rows];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    change("recurringRecommendations", next);
  }
  return <section className="admin-panel">
    <h2>Gói đề xuất Hoa Thời</h2>
    <p className="admin-hint">Cấu hình gợi ý gói trên Store. Bật tối đa 3 gói; khách chọn ngày cụ thể cho từng tuần/tháng lịch. Giá tham khảo bằng đồng Việt Nam.</p>
    {errors.recurringRecommendations ? <p className="admin-field-error" id="recurringRecommendations" tabIndex={-1}>{errors.recurringRecommendations}</p> : null}
    {rows.map((r, index) => {
      const path = `recurringRecommendations.${index}`, checked = recommendationSchema.safeParse(r);
      return <fieldset key={r.id} className="admin-list-entry"><legend>Gợi ý {index + 1}</legend>
        <div className="admin-field-grid">
          <AdminField path={`${path}.period`} label="Nhịp nhận hoa" type="select" options={["week", "month"]} value={r.period} change={change} errors={errors} />
          <AdminField path={`${path}.bouquetsPerPeriod`} label="Số bó mỗi chu kỳ" type="number" value={r.bouquetsPerPeriod} change={change} errors={errors} hint={r.period === "week" ? "Từ 1 đến 7 bó/tuần" : "Từ 1 đến 31 bó/tháng; lịch phải đủ ngày thực tế"} />
          {(["min", "max"] as const).map((key) => <MoneyField key={key} path={`${path}.suggestedPrice.${key}`} label={`Giá ${key === "min" ? "từ" : "đến"}`} value={r.suggestedPrice[key]} change={change} error={errors[`${path}.suggestedPrice.${key}`]} />)}
          <AdminField path={`${path}.suggestedPrice.basis`} label="Đơn vị giá tham khảo" type="select" options={["delivery", "month"]} value={r.suggestedPrice.basis} change={change} errors={errors} />
          <label className="admin-control"><input id={`${path}.enabled`} type="checkbox" checked={r.enabled} onChange={(e) => change(`${path}.enabled`, e.target.checked)} /> Hiển thị gợi ý</label>
        </div>
        {checked.success ? <p className="admin-hint">{r.bouquetsPerPeriod} bó/{r.period === "week" ? "tuần" : "tháng"} · {recommendationPrice(r)}</p> : <p className="admin-hint">Kiểm tra số bó và khoảng giá để xem gợi ý.</p>}
        {errors[`${path}.id`] ? <p id={`${path}.id`} tabIndex={-1} className="admin-field-error">{errors[`${path}.id`]}</p> : null}
        <div className="admin-save">
          <button type="button" className="button secondary" disabled={index === 0} onClick={() => reorder(index, -1)} aria-label={`Đưa gợi ý ${index + 1} lên`}>Lên</button>
          <button type="button" className="button secondary" disabled={index === rows.length - 1} onClick={() => reorder(index, 1)} aria-label={`Đưa gợi ý ${index + 1} xuống`}>Xuống</button>
          <button type="button" className="text-link" onClick={() => change("recurringRecommendations", rows.filter((_, i) => i !== index))}>Gỡ khỏi bản chỉnh sửa</button>
        </div>
      </fieldset>;
    })}
    <button type="button" className="button secondary" disabled={rows.length >= MAX_RECOMMENDATIONS} onClick={() => change("recurringRecommendations", [...rows, { id: `rhythm-${crypto.randomUUID()}`, period: "month", bouquetsPerPeriod: 1, suggestedPrice: { min: 0, max: 0, basis: "delivery" }, enabled: false }])}>Thêm gợi ý</button>
  </section>;
}
