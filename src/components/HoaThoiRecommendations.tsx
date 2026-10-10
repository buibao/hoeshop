import { CalendarDays, Check, ArrowDown } from "lucide-react";
import { periodLabel, recommendationPrice, type Recommendation } from "@/domain/recurrence";

export function HoaThoiRecommendations({ recommendations, referenceId, period, bouquets, choose, id, disabled = false }: { recommendations: Recommendation[]; referenceId: string; period: string; bouquets: number; choose: (r: Recommendation) => void; id: string; disabled?: boolean }) {
  const rows = recommendations.filter((r) => r.enabled);
  if (!rows.length) return null;
  return <section className="ht-recommendations" aria-labelledby={`${id}-recommendations`}>
    <span className="eyebrow">MỘT NHỊP HOA CHO RIÊNG BẠN</span>
    <h2 id={`${id}-recommendations`}>Chọn nhịp hoa phù hợp với bạn</h2>
    <p>Một chút hoa ghé nhà đều đặn. Bắt đầu từ một gợi ý, rồi chọn những ngày bạn muốn nhận.</p>
    <div className="ht-recommendation-grid">{rows.map((r) => <article key={r.id} className={`ht-recommendation ${referenceId === r.id ? "is-selected" : ""}`}>
      <CalendarDays size={24} aria-hidden="true" /><h3>{r.bouquetsPerPeriod} bó/{periodLabel(r.period)}</h3>
      <p className="ht-card-price">{recommendationPrice(r)}</p>
      <p className="ht-helper">{r.period === "week" ? "Một chút dịu dàng trong mỗi tuần." : "Để hoa cùng bạn đi qua từng tháng."}</p>
      <button type="button" className="ht-package-button" disabled={disabled} aria-pressed={referenceId === r.id} aria-label={`Tham khảo ${r.bouquetsPerPeriod} bó/${periodLabel(r.period)}`} onClick={() => choose(r)}>{referenceId === r.id ? <><Check size={16} aria-hidden="true" /> Đang tham khảo</> : <>Chọn nhịp này <ArrowDown size={15} aria-hidden="true" /></>}</button>
      <span className="ht-card-match">{r.period === period && r.bouquetsPerPeriod === bouquets ? "Khớp cấu hình của bạn" : ""}</span>
    </article>)}</div>
    <p className="ht-helper">Giá tham khảo. Hòe sẽ liên hệ xác nhận hoa, giá và lịch nhận phù hợp.</p>
  </section>;
}
