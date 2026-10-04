import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flower2 } from "lucide-react";
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
import { Reveal } from "@/components/ui/Reveal";
export default async function HomePage() {
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
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">{home.eyebrow}</span>
            <h1>
              {home.title.split("\n")[0]}
              <br />
              <em>{home.title.split("\n").slice(1).join("\n")}</em>
            </h1>
            <p>{home.intro}</p>
            <div className="hero-actions">
              <Link className="button" href={home.primaryCta.href}>
                {home.primaryCta.label} <ArrowRight size={15} />
              </Link>
              <Link className="text-link" href={home.secondaryCta.href}>
                {home.secondaryCta.label}
              </Link>
            </div>
            <div className="hero-footnote">
              <Flower2 size={15} strokeWidth={1.4} />
              {home.footnote}
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image">
              <Image
                src={
                  assets.hero?.src ||
                  (test
                    ? "/images/preview/bouquet.jpg"
                    : "/images/floral-mark.svg")
                }
                alt={assets.hero?.alt || "Nhành hoa của Hòe"}
                fill
                sizes="(max-width: 767px) 90vw, 45vw"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            <div className="hero-note" style={{ whiteSpace: "pre-line" }}>
              {home.imageNote}
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container benefit-grid">
          <div className="benefit-intro">
            <span className="eyebrow">{home.benefitEyebrow}</span>
            <h2 className="copy-lines">{home.benefitTitle}</h2>
            <p>{home.benefitIntro}</p>
          </div>
          <div className="benefit-list">
            {home.benefits.map((b, i) => (
              <Reveal key={b.title}>
                <div className="benefit">
                  <span className="benefit-number">0{i + 1}</span>
                  <div>
                    <h3>{b.title}</h3>
                    <p>{b.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section id="dich-vu" className="section soft-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{home.servicesEyebrow}</span>
              <h2 className="copy-lines">{home.servicesTitle}</h2>
            </div>
            <p>{home.servicesIntro}</p>
          </div>
          <ServiceCards />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{home.featuredEyebrow}</span>
              <h2>{home.featuredTitle}</h2>
            </div>
            <Link href={home.featuredCta.href} className="text-link">
              {home.featuredCta.label}
              <ArrowRight size={15} />
            </Link>
          </div>
          {products.length ? (
            <div className="product-grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <Empty
              title="Những mùa hoa đang được chuẩn bị"
              body="Hòe sẽ giới thiệu các mẫu hoa khi hình ảnh và thông tin đã sẵn sàng."
              href="/dich-vu/hoa-tam"
              action="Khám phá Hoa Tâm"
            />
          )}
        </div>
      </section>
      <section className="section soft-section">
        <div className="container story-grid">
          <div className="story-image">
            <Image
              src={
                assets.story?.src ||
                (test
                  ? "/images/preview/peonies.jpg"
                  : "/images/floral-mark.svg")
              }
              alt={assets.story?.alt || "Nhành hoa minh họa câu chuyện Hòe"}
              fill
              sizes="(max-width: 767px) 90vw, 45vw"
            />
          </div>
          <div className="story-copy">
            <span className="eyebrow">{home.storyEyebrow}</span>
            <h2 className="copy-lines">{home.storyTitle}</h2>
            <p>{home.storyBody}</p>
            <Link
              className="text-link"
              href={story ? `/blog/${story.slug}` : "/ve-hoe"}
            >
              {home.storyCtaLabel}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <span className="eyebrow">TỪ MONG MUỐN ĐẾN MỘT CHÚT HOA</span>
          <h2>{home.processTitle}</h2>
          <div className="hoe-process">
            {home.process.map((step, i) => (
              <div key={step.title}>
                <span>0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
          <div className="hoe-faq">
            <h2>{home.faqTitle}</h2>
            {site.faq.map((q) => (
              <details key={q.question}>
                <summary>{q.question}</summary>
                <p>{q.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className="cta-section">
        <span className="eyebrow">{home.ctaEyebrow}</span>
        <h2>{home.ctaTitle}</h2>
        <p>{home.ctaBody}</p>
        <div className="hero-actions">
          <Link className="button" href={home.primaryCta.href}>
            {home.primaryCta.label}
            <ArrowRight size={15} />
          </Link>
          <Link className="button secondary" href={home.secondaryCta.href}>
            {home.secondaryCta.label}
          </Link>
        </div>
      </section>
    </>
  );
}
