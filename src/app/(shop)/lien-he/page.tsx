import { StoreTextRevealGroup, StoreTextReveal } from "@/components/ui/StoreTextReveal";
import { StoreHeading } from "@/components/StoreHeading";
import type { Metadata } from "next";
import { getSite } from "@/server/content";
import { InquiryForm } from "@/features/checkout/InquiryForm";
import { phoneHref } from "@/domain/contact";
export const metadata: Metadata = {
  title: "Liên hệ & tư vấn",
  description:
    "Kể Hòe nghe điều bạn muốn gửi. Tư vấn Hoa Thời, Hoa Tâm và Hoa Ý.",
};
export default async function ContactPage() {
  const site = await getSite();
  return (
    <>
      <StoreHeading>
        <StoreTextRevealGroup initial className="page-heading">
          <span className="eyebrow">BẮT ĐẦU BẰNG MỘT LỜI KỂ</span>
          <h1>
            Hòe ở đây,
            <br />
            để nghe bạn.
          </h1>
        </StoreTextRevealGroup>
      </StoreHeading>
      <div className="container">
        <div className="contact-layout">
          <div>
            <StoreTextReveal as="h2" role="heading">
              Một chút hoa,
              <br />
              một chút dịu dàng.
            </StoreTextReveal>
            <StoreTextReveal as="p" role="body" className="muted" style={{ marginTop: 25 }}>
              Bạn đang nghĩ đến một người, một cảm xúc hay một thiết kế riêng?
              Hãy kể để Hòe cùng bạn tìm cách gửi.
            </StoreTextReveal>
            <div className="footer-links" style={{ marginTop: 30 }}>
              {site.contact.phone && phoneHref(site.contact.phone) ? (
                <a href={phoneHref(site.contact.phone)!}>
                  {site.contact.phone}
                </a>
              ) : null}
              {site.contact.email ? (
                <a href={`mailto:${site.contact.email}`}>
                  {site.contact.email}
                </a>
              ) : null}
              {site.contact.address ? <StoreTextReveal as="p" role="body">{site.contact.address}</StoreTextReveal> : null}
              {site.contact.hours ? <StoreTextReveal as="p" role="body">{site.contact.hours}</StoreTextReveal> : null}
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
    </>
  );
}
