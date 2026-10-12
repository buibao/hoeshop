import { StoreTextReveal, StoreTextLink, StoreTextExemption } from "@/components/ui/StoreTextReveal";
import Link from "next/link";
import Image from "next/image";
import { getArticles, getAssets, getSite } from "@/server/content";
import { footerSocialLinks, httpsHref, phoneHref } from "@/domain/contact";
import { SocialBrandIcon } from "./SocialBrandIcon";

export async function Footer() {
  const [site, policies, articles, { logo }] = await Promise.all([getSite(), getArticles("policies"), getArticles(), getAssets()]);
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
            <Link href="/" className="brand" aria-label="Hòe — Trang chủ">
              {logo ? <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height}
                style={{ maxWidth: 130, maxHeight: 65, objectFit: "contain" }} /> : "hòe"}
            </Link>
            <StoreTextReveal as="p" role="body">{site.tagline}</StoreTextReveal>
          </div>
          <nav aria-labelledby="footer-explore-title">
            <StoreTextReveal as="h3" role="heading" id="footer-explore-title">Khám phá Hòe</StoreTextReveal>
            <div className="footer-links">
              <StoreTextLink><Link href="/dich-vu/hoa-thoi">Hoa Thời</Link></StoreTextLink>
              <StoreTextLink><Link href="/dich-vu/hoa-tam">Hoa Tâm</Link></StoreTextLink>
              <StoreTextLink><Link href="/dich-vu/hoa-y">Hoa Ý</Link></StoreTextLink>
              {articles.length > 0 && <StoreTextLink><Link href="/blog">Chuyện của những đóa hoa</Link></StoreTextLink>}
            </div>
          </nav>
          {hasContact && <div className="footer-contact">
            <StoreTextReveal as="h3" role="heading">Ghé Hòe</StoreTextReveal>
            <div className="footer-links">
              {address && (mapUrl ? <StoreTextLink><a href={mapUrl} target="_blank" rel="noopener noreferrer">{address}</a></StoreTextLink> : <StoreTextReveal>{address}</StoreTextReveal>)}
              {!address && mapUrl && <StoreTextLink><a href={mapUrl} target="_blank" rel="noopener noreferrer">Xem đường đi</a></StoreTextLink>}
              {tel && <StoreTextLink><a href={tel}>{phone}</a></StoreTextLink>}
              {email && <StoreTextLink><a href={`mailto:${email}`}>{email}</a></StoreTextLink>}
              {hours && <StoreTextReveal>{hours}</StoreTextReveal>}
              <StoreTextLink><Link href="/lien-he">Liên hệ & tư vấn</Link></StoreTextLink>
            </div>
          </div>}
          {socials.length > 0 && <nav className="footer-social" aria-labelledby="footer-social-title">
            <StoreTextReveal as="h3" role="heading" id="footer-social-title">Kết nối với Hòe</StoreTextReveal>
            <div className="footer-social-links">
              {socials.map((social, index) => <a key={`${social.url}-${index}`} href={social.url} target="_blank" rel="noopener noreferrer">
                {social.platform && <SocialBrandIcon platform={social.platform} />}
                <StoreTextReveal>{social.label}</StoreTextReveal>
              </a>)}
            </div>
          </nav>}
        </div>
        {/* The final row cannot always reach the 85% trigger band at scroll end. */}
        <StoreTextExemption><div className="footer-bottom">
          <div className="footer-copyright">
            <StoreTextReveal>© Hòe. Một chút hoa, một chút dịu dàng.</StoreTextReveal>
            <StoreTextReveal as="p" role="body" className="footer-footnote">Giá và lịch nhận hoa được shop xác nhận sau khi tiếp nhận yêu cầu.</StoreTextReveal>
          </div>
          {policies.length > 0 && <nav className="footer-policies" aria-label="Chính sách">
            {policies.map((policy) => <StoreTextLink key={policy.id}><Link href={`/chinh-sach/${policy.slug}`}>{policy.title}</Link></StoreTextLink>)}
          </nav>}
        </div></StoreTextExemption>
      </div>
    </footer>
  );
}
