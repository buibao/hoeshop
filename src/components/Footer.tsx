import Link from "next/link";
import { getArticles, getSite } from "@/server/content";
import { footerSocialLinks, httpsHref, phoneHref } from "@/domain/contact";
import { SocialBrandIcon } from "./SocialBrandIcon";

export async function Footer() {
  const [site, policies, articles] = await Promise.all([getSite(), getArticles("policies"), getArticles()]);
  const contact = site.contact;
  const phone = contact.phone?.trim();
  const email = contact.email?.trim();
  const address = contact.address?.trim();
  const hours = contact.hours?.trim();
  const mapUrl = httpsHref(contact.addressUrl);
  const tel = phone ? phoneHref(phone) : null;
  const hasContact = !!(address || mapUrl || tel || email || hours);
  const socials = footerSocialLinks(site.social);
  return (
    <footer className="footer hoe-store-footer">
      <div className="olf-shell">
        <div className="footer-grid" data-footer-groups={2 + Number(hasContact) + Number(socials.length > 0)}>
          <div className="footer-brand">
            <Link href="/" className="brand" aria-label="Hòe — Trang chủ">hòe</Link>
            <p>{site.tagline}</p>
          </div>
          <nav aria-labelledby="footer-explore-title">
            <h3 id="footer-explore-title">Khám phá Hòe</h3>
            <div className="footer-links">
              <Link href="/dich-vu/hoa-thoi">Hoa Thời</Link>
              <Link href="/dich-vu/hoa-tam">Hoa Tâm</Link>
              <Link href="/dich-vu/hoa-y">Hoa Ý</Link>
              {articles.length > 0 && <Link href="/blog">Chuyện của những đóa hoa</Link>}
            </div>
          </nav>
          {hasContact && <div className="footer-contact">
            <h3>Ghé Hòe</h3>
            <div className="footer-links">
              {address && (mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer">{address}</a> : <span>{address}</span>)}
              {!address && mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer">Xem đường đi</a>}
              {tel && <a href={tel}>{phone}</a>}
              {email && <a href={`mailto:${email}`}>{email}</a>}
              {hours && <span>{hours}</span>}
              <Link href="/lien-he">Liên hệ & tư vấn</Link>
            </div>
          </div>}
          {socials.length > 0 && <nav className="footer-social" aria-labelledby="footer-social-title">
            <h3 id="footer-social-title">Kết nối với Hòe</h3>
            <div className="footer-social-links">
              {socials.map((social, index) => <a key={`${social.url}-${index}`} href={social.url} target="_blank" rel="noopener noreferrer">
                {social.platform && <SocialBrandIcon platform={social.platform} />}
                <span>{social.label}</span>
              </a>)}
            </div>
          </nav>}
        </div>
        <div className="footer-bottom">
          <div className="footer-copyright">
            <span>© Hòe. Một chút hoa, một chút dịu dàng.</span>
            <p className="footer-footnote">Giá và lịch nhận hoa được shop xác nhận sau khi tiếp nhận yêu cầu.</p>
          </div>
          {policies.length > 0 && <nav className="footer-policies" aria-label="Chính sách">
            {policies.map((policy) => <Link key={policy.id} href={`/chinh-sach/${policy.slug}`}>{policy.title}</Link>)}
          </nav>}
        </div>
      </div>
    </footer>
  );
}
