"use client";
import { Field } from "@/components/Fields";
import { configurationSchema, vietnamToday, type ServiceType, type Configuration } from "@/domain/schemas";
export const configurationFields: Record<ServiceType, string[]> = {
  "hoa-thoi": ["desiredDate","desiredTime","style","color","budget","recurringNeeds"],
  "hoa-tam": ["desiredDate","desiredTime","style","color","budget","relationship","occasion","emotion","dislikedFlowers","message"],
  "hoa-y": ["desiredDate","desiredTime","style","color","budget","shape","flowerType","size","occasion","message","referenceUrl","requirements"],
};
export function configurationInput(data: FormData, serviceType: ServiceType) {
  return { serviceType, ...Object.fromEntries(configurationFields[serviceType].map((key) => [key, String(data.get(key) || "")])) };
}
export function parseConfiguration(data: FormData, serviceType: ServiceType) { return configurationSchema.parse(configurationInput(data, serviceType)); }
export function ConfigurationFields({ serviceType, initial = {}, noSample = false, errors }: { serviceType: ServiceType; initial?: Record<string, string> | Configuration; noSample?: boolean; errors?: Record<string,string> }) {
  const value = initial as unknown as Record<string,string>;
  const field = (key: string, label: string, props: Partial<React.ComponentProps<typeof Field>> = {}) => <Field key={key} name={key} label={label} defaultValue={value[key] || ""} errors={errors} {...props}/>;
  return <div className="form-grid">
    {serviceType === "hoa-tam" ? <>
      {field("emotion", "Cảm xúc muốn gửi", { required: true, full: true, multiline: true, maxLength: 500, hint: "Ví dụ: yêu thương, biết ơn, động viên…" })}
      {field("relationship","Mối quan hệ", { maxLength:120 })}
      {field("occasion","Dịp tặng", { maxLength:120 })}
      {field("dislikedFlowers","Hoa không thích", { maxLength:250 })}
    </> : null}
    {serviceType === "hoa-y" ? <>
      <Field name="shape" label="Hình thức" required defaultValue={value.shape || "bo"} errors={errors} options={[{value:"bo",label:"Bó"},{value:"hop",label:"Hộp"},{value:"binh",label:"Bình"},{value:"canh",label:"Cành"}]}/>
      {field("flowerType","Loại hoa", {maxLength:250})}
      {field("size","Kích thước", {maxLength:120})}
      {field("occasion","Dịp tặng", {maxLength:120})}
    </> : null}
    {field("color","Màu sắc", {maxLength:120})}
    {field("style","Phong cách", {maxLength:120})}
    {field("budget","Ngân sách tham khảo", {maxLength:120, hint:"Thông tin để shop tư vấn; không thay thế giá mẫu."})}
    {field("desiredDate", serviceType === "hoa-thoi" ? "Ngày bắt đầu mong muốn" : "Ngày nhận mong muốn", { type:"date", min:vietnamToday() })}
    {field("desiredTime","Giờ mong muốn", {type:"time", hint:"Shop sẽ liên hệ xác nhận lịch."})}
    {serviceType === "hoa-thoi" ? field("recurringNeeds","Nhu cầu nhận hoa định kỳ", {multiline:true,full:true,hint:"Kể nhu cầu của bạn để Hòe tư vấn. Chưa có gói hay lịch giao cam kết."}) : field("message","Lời nhắn trên thiệp",{multiline:true,full:true,maxLength:1000})}
    {serviceType === "hoa-y" ? <>
      {field("referenceUrl","Link ảnh tham khảo", { type:"url", full:true, maxLength:2000, hint:"Tùy chọn. Dùng link https shop có thể mở; website không tải hoặc hiển thị ảnh từ link." })}
      {field("requirements","Mô tả thiết kế / yêu cầu riêng", {multiline:true,full:true,required:noSample,hint:noSample ? "Hãy mô tả điều bạn mong muốn khi chưa chọn mẫu." : "Thay đổi thiết kế ngoài mẫu sẽ cần shop báo giá."})}
    </> : null}
  </div>;
}
