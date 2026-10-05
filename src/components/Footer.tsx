import Link from "next/link";
import { getArticles, getSite } from "@/server/content";
export async function Footer() {
  const site = await getSite();
  const policies = await getArticles("policies");
  return (
    <footer className="footer border-t border-secondary bg-secondary py-12">
      <div className="container mx-auto w-full max-w-container px-4 md:px-8">
        <div className="footer-grid grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <Link href="/" className="brand font-display text-display-xs text-brand-secondary">
              hòe
            </Link>
            <p>
              Hòe — nơi những điều khó nói
              <br />
              được kể bằng hoa.
            </p>
          </div>
          <div>
            <h3>Khám phá Hòe</h3>
            <div className="footer-links flex flex-col gap-3">
              <Link href="/dich-vu/hoa-thoi">Hoa Thời</Link>
              <Link href="/dich-vu/hoa-tam">Hoa Tâm</Link>
              <Link href="/dich-vu/hoa-y">Hoa Ý</Link>
              <Link href="/blog">Chuyện của những đóa hoa</Link>
            </div>
          </div>
          <div>
            <h3>Kết nối với Hòe</h3>
            <div className="footer-links flex flex-col gap-3">
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
        <div className="footer-bottom mt-8 flex flex-wrap justify-between gap-3 border-t border-secondary pt-6 text-sm text-tertiary">
          <span>© Hòe. Một chút hoa, một chút dịu dàng.</span>
          <span>
            Giá và lịch nhận hoa được shop xác nhận sau khi tiếp nhận yêu cầu.
          </span>
        </div>
      </div>
    </footer>
  );
}
