/** Storage values stay stable; all customer/shop-facing labels live here. */
export const valueLabels: Record<string, string> = {
  draft: "Bản nháp",
  published: "Công khai",
  archived: "Lưu trữ",
  received: "Mới nhận",
  contacted: "Đã liên hệ",
  confirmed: "Đã xác nhận",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  resolved: "Đã giải quyết",
  visible: "Công khai",
  hidden: "Đã ẩn",
  quote: "Chờ báo giá",
  fixed: "Giá cố định",
  range: "Khoảng giá",
  "hoa-thoi": "Hoa Thời",
  "hoa-tam": "Hoa Tâm",
  "hoa-y": "Hoa Ý",
  bo: "Bó",
  hop: "Hộp",
  binh: "Bình",
  canh: "Cành",
  week: "Tuần",
  month: "Mỗi tháng",
  delivery: "Mỗi lần",
};
export const shapeChoices = ["bo", "hop", "binh", "canh"] as const;
export function valueLabel(value: string) {
  return valueLabels[value] || value;
}
