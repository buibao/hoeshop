import type { Metadata } from "next";
import { getSite } from "@/server/content";
import { InquiryForm } from "@/features/checkout/InquiryForm";
export const metadata: Metadata = {
  title: "Liên hệ & tư vấn",
  description:
    "Kể Hòe nghe điều bạn muốn gửi. Tư vấn Hoa Thời, Hoa Tâm và Hoa Ý.",
};
export default async function ContactPage() {
  const site = await getSite();
  return (
    <div className="container mx-auto w-full max-w-container px-4 md:px-8">
      <div className="page-heading flex flex-col gap-4 py-8 md:py-12">
        <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">BẮT ĐẦU BẰNG MỘT LỜI KỂ</span>
        <h1>
          Hòe ở đây,
          <br />
          để nghe bạn.
        </h1>
      </div>
      <div className="contact-layout grid grid-cols-1 gap-8 py-8 md:grid-cols-2">
        <div>
          <h2>
            Một chút hoa,
            <br />
            một chút dịu dàng.
          </h2>
          <p className="muted text-tertiary" >
            Bạn đang nghĩ đến một người, một cảm xúc hay một thiết kế riêng? Hãy
            kể để Hòe cùng bạn tìm cách gửi.
          </p>
          <div className="footer-links flex flex-col gap-3" >
            {site.contact.phone ? (
              <a href={`tel:${site.contact.phone}`}>{site.contact.phone}</a>
            ) : null}
            {site.contact.email ? (
              <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
            ) : null}
            {site.contact.address ? <p>{site.contact.address}</p> : null}
            {site.contact.hours ? <p>{site.contact.hours}</p> : null}
            {site.social.map((s) => (
              <a
                href={s.url}
                key={s.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <InquiryForm />
      </div>
    </div>
  );
}
