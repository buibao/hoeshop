import { initialRecommendations } from "./recurrence";

const legacyDescription = "Dành cho những ai muốn có hoa bên mình thường xuyên hơn. Bạn kể nhu cầu, phong cách và thời điểm mong muốn; Hòe sẽ tư vấn giá cùng lịch nhận phù hợp. Hiện chưa có gói định kỳ hoặc lịch giao được cam kết trên website.";
export function hoaThoiMigration(data: Record<string, unknown>) {
  if (Object.hasOwn(data, "recurringRecommendations")) return {};
  return {
    recurringRecommendations: structuredClone(initialRecommendations),
    ...(data.description === legacyDescription ? { description: "Một chút hoa ghé nhà đều đặn. Bạn chọn nhịp phù hợp, Hòe cùng bạn chăm chút từng lần nhận. Hòe sẽ liên hệ để xác nhận hoa, giá và lịch nhận phù hợp." } : {}),
  };
}
