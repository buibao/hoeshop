"use client";
import { Form } from "@/components/ui/Form";
import { Action } from "@/components/ui/Action";

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
export function InquiryForm({
  serviceType,
  guidance,
}: {
  serviceType?: ServiceType;
  guidance?: Guidance;
}) {
  const submission = useSubmission<Receipt>("/api/inquiries");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      data = new FormData(form);
    const value = (key: string) => String(data.get(key) || "");
    await submission.submit(
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
  }
  if (submission.result)
    return (
      <div className="success rounded-xl bg-primary p-4 text-success-primary ring-1 ring-success_secondary" role="status">
        <strong>
          Hòe đã nhận yêu cầu tư vấn {submission.result.requestId}.
        </strong>
        Shop sẽ liên hệ trao đổi thêm về nhu cầu của bạn. Đây là yêu cầu tư vấn,
        chưa phải đơn đặt hoa.
        <div>
          <Action className="link-button" onClick={submission.reset}>
            Gửi nhu cầu khác
          </Action>
        </div>
      </div>
    );
  return (
    <Form onSubmit={handleSubmit} noValidate className="card rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary">
      <fieldset disabled={submission.phase === "submitting"}>
        <legend>
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
            />
            <hr className="divider my-4 border-secondary" />
          </>
        ) : null}
        <div className="form-grid grid grid-cols-1 gap-4 md:grid-cols-2">
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
            label="Nội dung yêu cầu"
            required
            multiline
            full
            maxLength={3000}
            errors={submission.errors}
          />
        </div>
        <Honeypot />
        <p className="form-note text-sm text-tertiary">
          Hòe sẽ liên hệ để tư vấn. Gửi form chưa tạo đơn hàng hoặc đăng ký gói
          định kỳ.
        </p>
        {submission.error ? (
          <div className="error rounded-xl bg-primary p-4 text-error-primary ring-1 ring-error_subtle" role="alert">
            {submission.error}
          </div>
        ) : null}
        <Action className="button" type="submit" isLoading={submission.phase === "submitting"}>
          {submission.phase === "submitting"
            ? "Đang gửi…"
            : "Gửi yêu cầu tư vấn"}
        </Action>
      </fieldset>
    </Form>
  );
}
