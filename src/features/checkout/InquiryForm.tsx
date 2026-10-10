"use client";
import { useContext } from "react";
import { Field, Honeypot } from "@/components/Fields";
import {
  structuralInquirySchema,
  type ServiceType,
  type Receipt,
} from "@/domain/schemas";
import {
  ConfigurationFields,
  configurationInput,
  type Guidance,
} from "./configuration";
import { useSubmission } from "./useSubmission";
import { RecurrenceSummary } from "./RecurrenceSummary";
import { HoaThoiPackageContext } from "./HoaThoiPackageState";
export function InquiryForm({
  serviceType,
  guidance,
  showRecommendations = serviceType === "hoa-thoi",
}: {
  serviceType?: ServiceType;
  guidance?: Guidance;
  showRecommendations?: boolean;
}) {
  const packageState = useContext(HoaThoiPackageContext);
  const submission = useSubmission<Receipt>("/api/inquiries");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      data = new FormData(form);
    const value = (key: string) => String(data.get(key) || "");
    packageState?.setLocked(true);
    const receipt = await submission.submit(
      {
        kind: serviceType ? "service" : "general",
        name: value("name"),
        phone: value("phone"),
        email: value("email"),
        serviceType: serviceType || value("serviceType"),
        body: value("body"),
        honeypot: value("honeypot"),
        ...(serviceType
          ? { configuration: configurationInput(data, serviceType) }
          : {}),
      },
      structuralInquirySchema,
      form,
    );
    packageState?.setLocked(!!receipt);
  }
  if (submission.result)
    return (
      <div className="success" role="status">
        <strong>
          {serviceType === "hoa-thoi" ? "Hòe đã nhận mong muốn của bạn." : "Hòe đã nhận yêu cầu tư vấn."} Mã tiếp nhận: {submission.result.requestId}.
        </strong>
        {serviceType === "hoa-thoi" ? "Hòe sẽ liên hệ để xác nhận hoa, giá và lịch nhận." : "Shop sẽ liên hệ trao đổi thêm về nhu cầu của bạn. Đây là yêu cầu tư vấn, chưa phải đơn đặt hoa."}
        {submission.result.configuration?.serviceType === "hoa-thoi" ? <RecurrenceSummary recurrence={submission.result.configuration.recurrence} snapshot={submission.result.recurrenceSnapshot} /> : null}
        <div>
          <button className="link-button" onClick={() => { packageState?.reset(); submission.reset(); }}>
            {serviceType === "hoa-thoi" ? "Gửi mong muốn khác" : "Gửi nhu cầu khác"}
          </button>
        </div>
      </div>
    );
  return (
    <form onSubmit={handleSubmit} noValidate className={serviceType === "hoa-thoi" ? "ht-inquiry" : "card"}>
      <fieldset disabled={submission.phase === "submitting"}>
        <legend className={serviceType === "hoa-thoi" ? "visually-hidden" : undefined}>
          {serviceType
            ? "Kể Hòe nghe mong muốn của bạn"
            : "Bạn muốn Hòe gửi điều gì?"}
        </legend>
        {serviceType ? (
          <>
            <ConfigurationFields
              serviceType={serviceType}
              noSample
              errors={submission.errors}
              guidance={guidance}
              showRecommendations={showRecommendations}
            />
            <hr className="divider" />
          </>
        ) : null}
        <div className="form-grid">
          <Field
            name="name"
            label="Họ tên"
            required
            autoComplete="name"
            maxLength={120}
            errors={submission.errors}
          />
          <Field
            name="phone"
            label="Số điện thoại"
            type="tel"
            required
            autoComplete="tel"
            maxLength={30}
            errors={submission.errors}
          />
          <Field
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            maxLength={254}
            errors={submission.errors}
          />
          {!serviceType ? (
            <Field
              name="serviceType"
              label="Dịch vụ quan tâm"
              defaultValue="tu-van"
              options={[
                { value: "tu-van", label: "Tư vấn chung" },
                { value: "hoa-thoi", label: "Hoa Thời" },
                { value: "hoa-tam", label: "Hoa Tâm" },
                { value: "hoa-y", label: "Hoa Ý" },
              ]}
            />
          ) : null}
          <Field
            name="body"
            label={serviceType === "hoa-thoi" ? "Lời nhắn thêm" : "Nội dung yêu cầu"}
            required={serviceType !== "hoa-thoi"}
            multiline
            full
            maxLength={3000}
            errors={submission.errors}
          />
        </div>
        <Honeypot />
        <p className="form-note">
          {serviceType === "hoa-thoi" ? "Hòe sẽ liên hệ để chốt hoa, giá và lịch nhận." : "Hòe sẽ liên hệ để tư vấn. Gửi form chưa tạo đơn hàng hoặc đăng ký gói định kỳ."}
        </p>
        {submission.error ? (
          <div className="error" role="alert">
            {submission.error}
          </div>
        ) : null}
        <button className="button" type="submit">
          {submission.phase === "submitting"
            ? "Đang gửi…"
            : serviceType === "hoa-thoi" ? "Gửi mong muốn đến Hòe" : "Gửi yêu cầu tư vấn"}
        </button>
      </fieldset>
    </form>
  );
}
