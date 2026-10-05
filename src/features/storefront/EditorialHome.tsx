import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flower2, ArrowUpRight } from "lucide-react";
import {
  getHome,
  getProducts,
  getArticles,
  getAssets,
  getSite,
  isTestContent,
} from "@/server/content";
import { ProductCard } from "@/components/ProductCard";
import { ServiceCards } from "@/components/ServiceCards";
import { Empty } from "@/components/Empty";
import { EditorialReveal } from "@/components/ui/EditorialReveal";
import { EditorialHeroMotion } from "@/components/ui/EditorialHeroMotion";
export async function EditorialHome() {
  const [home, catalog, articles, assets, site] = await Promise.all([
    getHome(),
    getProducts(),
    getArticles(),
    getAssets(),
    getSite(),
  ]);
  const products = (
    home.featuredProductIds.length
      ? home.featuredProductIds.flatMap(
          (id) => catalog.find((p) => p.id === id) || [],
        )
      : catalog
  ).slice(0, home.featuredLimit);
  const test = isTestContent(),
    story = articles.find((a) => a.slug === home.storySlug);
  return (
    <div className="hoe-editorial">
      <section className="editorial-hero container">
        <div className="editorial-hero-copy">
          <span className="eyebrow">{home.eyebrow}</span>
          <h1>
            {home.title.split("\n")[0]}
            <br />
            <em>{home.title.split("\n").slice(1).join("\n")}</em>
          </h1>
          <p>{home.intro}</p>
          <div className="hero-actions">
            <Link className="button" href={home.primaryCta.href}>
              {home.primaryCta.label}
              <ArrowUpRight size={17} />
            </Link>
            <Link className="text-link" href={home.secondaryCta.href}>
              {home.secondaryCta.label}
            </Link>
          </div>
          <div className="editorial-hero-footnote">
            <Flower2 size={20} strokeWidth={1.2} aria-hidden="true" />
            <span>{home.footnote}</span>
          </div>
        </div>
        <EditorialHeroMotion>
          <div className="editorial-hero-photo">
            <Image
              src={
                assets.hero?.src ||
                (test
                  ? "/images/preview/bouquet.jpg"
                  : "/images/floral-mark.svg")
              }
              alt={assets.hero?.alt || "Nhành hoa của Hòe"}
              fill
              sizes="(max-width: 767px) 92vw, 49vw"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <div className="editorial-photo-caption">
            <Flower2 size={20} strokeWidth={1.2} aria-hidden="true" />
            <p>{home.imageNote}</p>
          </div>
          <span className="editorial-orbit" aria-hidden="true">
            <Flower2 size={42} strokeWidth={0.9} />
          </span>
        </EditorialHeroMotion>
      </section>
      <div className="editorial-benefits container">
        {home.benefits.map((benefit, i) => (
          <div key={benefit.title}>
            <span>0{i + 1}</span>
            <div>
              <h3>{benefit.title}</h3>
              <p>{benefit.body}</p>
            </div>
          </div>
        ))}
      </div>
      <section id="dich-vu" className="editorial-section editorial-services">
        <div className="container">
          <EditorialReveal className="editorial-section-heading">
            <span className="editorial-index">01 / CÁCH GỬI HOA</span>
            <h2 className="copy-lines">{home.servicesTitle}</h2>
            <p>{home.servicesIntro}</p>
          </EditorialReveal>
          <EditorialReveal>
            <ServiceCards />
          </EditorialReveal>
        </div>
      </section>
      <section className="editorial-section container">
        <div className="editorial-heading-row">
          <div>
            <span className="eyebrow">02 / {home.featuredEyebrow}</span>
            <h2>{home.featuredTitle}</h2>
          </div>
          <Link className="text-link" href={home.featuredCta.href}>
            {home.featuredCta.label}
            <ArrowRight size={17} />
          </Link>
        </div>
        {products.length ? (
          <div className="product-grid editorial-products">
            {products.map((p, i) => (
              <EditorialReveal key={p.id} delay={i * 0.09}>
                <ProductCard product={p} />
              </EditorialReveal>
            ))}
          </div>
        ) : (
          <Empty
            title="Những mùa hoa đang được chuẩn bị"
            body="Hòe sẽ giới thiệu mẫu hoa khi thông tin và hình ảnh đã sẵn sàng."
            href="/dich-vu/hoa-tam"
            action="Khám phá Hoa Tâm"
          />
        )}
      </section>
      <section className="editorial-story editorial-section">
        <div className="container editorial-story-grid">
          <EditorialReveal className="editorial-story-photo">
            <Image
              src={
                assets.story?.src ||
                (test
                  ? "/images/preview/peonies.jpg"
                  : "/images/floral-mark.svg")
              }
              alt={assets.story?.alt || "Hoa minh họa câu chuyện Hòe"}
              fill
              sizes="(max-width: 767px) 90vw, 42vw"
            />
          </EditorialReveal>
          <EditorialReveal className="editorial-story-copy">
            <span className="eyebrow">03 / {home.storyEyebrow}</span>
            <h2 className="copy-lines">{home.storyTitle}</h2>
            <p>{home.storyBody}</p>
            <Link
              className="text-link"
              href={story ? `/blog/${story.slug}` : "/ve-hoe"}
            >
              {home.storyCtaLabel}
              <ArrowUpRight size={17} />
            </Link>
            <Flower2
              className="editorial-story-flower"
              size={68}
              strokeWidth={0.7}
              aria-hidden="true"
            />
          </EditorialReveal>
        </div>
      </section>
      {articles.length > 0 && (
        <section className="editorial-section container">
          <div className="editorial-heading-row">
            <div>
              <span className="eyebrow">NHỮNG ĐIỀU NHỎ BÉ</span>
              <h2>Chuyện hoa</h2>
            </div>
            <Link className="text-link" href="/blog">
              Đọc thêm chuyện hoa
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="editorial-journal">
            {articles.slice(0, 3).map((a, i) => (
              <EditorialReveal key={a.id} delay={i * 0.09}>
                <Link
                  href={`/blog/${a.slug}`}
                  key={a.id}
                  className="editorial-journal-card"
                >
                  <span className="eyebrow">
                    {a.category || "Chuyện của Hòe"}
                  </span>
                  <h3>{a.title}</h3>
                  <p>{a.excerpt}</p>
                  <span className="text-link">
                    Đọc câu chuyện
                    <ArrowUpRight size={16} />
                  </span>
                </Link>
              </EditorialReveal>
            ))}
          </div>
        </section>
      )}
      <section className="editorial-process editorial-section">
        <div className="container">
          <span className="eyebrow">TỪ MONG MUỐN ĐẾN MỘT CHÚT HOA</span>
          <h2>{home.processTitle}</h2>
          <div className="hoe-process">
            {home.process.map((step, i) => (
              <EditorialReveal key={step.title} delay={i * 0.09}>
                <span>0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </EditorialReveal>
            ))}
          </div>
          {site.faq.length > 0 && (
            <div className="hoe-faq">
              <h2>{home.faqTitle}</h2>
              {site.faq.map((q) => (
                <details key={q.question}>
                  <summary>{q.question}</summary>
                  <p>{q.answer}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="editorial-cta">
        <EditorialReveal>
          <Flower2 size={40} strokeWidth={1} aria-hidden="true" />
          <span className="eyebrow">{home.ctaEyebrow}</span>
          <h2>{home.ctaTitle}</h2>
          <p>{home.ctaBody}</p>
          <div className="hero-actions">
            <Link className="button" href={home.primaryCta.href}>
              {home.primaryCta.label}
              <ArrowUpRight size={17} />
            </Link>
            <Link className="text-link" href={home.secondaryCta.href}>
              {home.secondaryCta.label}
            </Link>
          </div>
        </EditorialReveal>
      </section>
    </div>
  );
}
