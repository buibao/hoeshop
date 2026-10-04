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
    <div className="container">
      <div className="page-heading">
        <span className="eyebrow">BẮT ĐẦU BẰNG MỘT LỜI KỂ</span>
        <h1>
          Hòe ở đây,
          <br />
          để nghe bạn.
        </h1>
      </div>
      <div className="contact-layout">
        <div>
          <h2>
            Một chút hoa,
            <br />
            một chút dịu dàng.
          </h2>
          <p className="muted" style={{ marginTop: 25 }}>
            Bạn đang nghĩ đến một người, một cảm xúc hay một thiết kế riêng? Hãy
            kể để Hòe cùng bạn tìm cách gửi.
          </p>
          <div className="footer-links" style={{ marginTop: 30 }}>
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
