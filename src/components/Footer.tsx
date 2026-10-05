import Link from "next/link";
import { getArticles, getSite } from "@/server/content";
export async function Footer() {
  const [site, policies, articles] = await Promise.all([getSite(), getArticles("policies"), getArticles()]);
  return (
    <footer className="footer hoe-store-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="brand">
              hòe
            </Link>
            <p>{site.tagline}</p>
          </div>
          <div>
            <h3>Khám phá Hòe</h3>
            <div className="footer-links">
              <Link href="/dich-vu/hoa-thoi">Hoa Thời</Link>
              <Link href="/dich-vu/hoa-tam">Hoa Tâm</Link>
              <Link href="/dich-vu/hoa-y">Hoa Ý</Link>
              {articles.length > 0 ? <Link href="/blog">Chuyện của những đóa hoa</Link> : null}
            </div>
          </div>
          <div>
            <h3>Kết nối với Hòe</h3>
            <div className="footer-links">
              <Link href="/lien-he">Liên hệ & tư vấn</Link>
              {site.contact.phone ? (
                <a href={`tel:${site.contact.phone}`}>{site.contact.phone}</a>
              ) : null}
              {site.contact.email ? (
                <a href={`mailto:${site.contact.email}`}>
                  {site.contact.email}
                </a>
              ) : null}
              {site.contact.address ? (
                <span>{site.contact.address}</span>
              ) : null}
              {site.contact.hours ? <span>{site.contact.hours}</span> : null}
              {site.social.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.label}
                </a>
              ))}
              {policies.map((p) => (
                <Link key={p.id} href={`/chinh-sach/${p.slug}`}>
                  {p.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© Hòe. Một chút hoa, một chút dịu dàng.</span>
          <span>
            Giá và lịch nhận hoa được shop xác nhận sau khi tiếp nhận yêu cầu.
          </span>
        </div>
      </div>
    </footer>
  );
}
