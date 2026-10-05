import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Flower2, Heart } from "lucide-react";
import { getHome, getProducts, getArticles, getAssets, getSite, isTestContent } from "@/server/content";
import { ProductCard } from "@/components/ProductCard";
import { ServiceCards } from "@/components/ServiceCards";
import { Empty } from "@/components/Empty";
import { LandingPhoto, LandingReveal } from "./LandingMotion";

export async function EditorialHome() {
  const [home, catalog, articles, assets, site] = await Promise.all([
    getHome(), getProducts(), getArticles(), getAssets(), getSite(),
  ]);
  const products = (home.featuredProductIds.length
    ? home.featuredProductIds.flatMap(id => catalog.find(p => p.id === id) || [])
    : catalog).slice(0, home.featuredLimit);
  const test = isTestContent();
  const story = articles.find(a => a.slug === home.storySlug);
  const fallback = "/images/floral-mark.svg";
  const hero = assets.hero || { src: catalog.find(p => p.image)?.image || (test ? "/images/preview/bouquet.jpg" : fallback), alt: "Một chút hoa của Hòe" };
  // The legacy peonies fixture shows makeup tools; it is not a suitable Home photo.
  const supporting = catalog.filter(p => p.image && p.image !== hero.src && !(test && p.image === "/images/preview/peonies.jpg")).slice(0, 2);
  const photoTwo = assets.story?.src || supporting[0]?.image || (test ? "/images/preview/roses.jpg" : fallback);
  const photoThree = supporting[1]?.image || hero.src;
  const storyPhoto = assets.story || { src: hero.src, alt: "Hoa minh họa câu chuyện Hòe" };
  const lines = home.title.split("\n");
  return (
    <div className="olf-home" data-home-design="oh-les-fleurs">
      <section className="olf-hero" aria-labelledby="home-title">
        <div className="olf-shell olf-hero-stage">
          <div className="olf-hero-heading">
            <span className="olf-eyebrow">{home.eyebrow}</span>
            <h1 id="home-title">
              {lines.map((line, index) => <span className="olf-title-line" key={index}>
                {index === 0 ? line : <em>{line}</em>}
                {index === 0 ? <Flower2 className="olf-title-flower" aria-hidden="true" /> : index === lines.length - 1 ? <Heart className="olf-title-heart" aria-hidden="true" /> : null}
                {index < lines.length - 1 ? " " : null}
              </span>)}
            </h1>
          </div>
          <div className="olf-hero-photos">
            <LandingPhoto className="olf-hero-photo olf-hero-photo--one">
              <div className="olf-photo-frame"><Image src={hero.src} alt={hero.alt} fill sizes="(max-width: 767px) 36vw, 18vw" loading="eager" fetchPriority="high" /></div>
            </LandingPhoto>
            <LandingPhoto className="olf-hero-photo olf-hero-photo--two" depth={-18}>
              <div className="olf-photo-frame"><Image src={photoTwo} alt="" fill sizes="(max-width: 767px) 26vw, 18vw" loading="eager" /></div>
            </LandingPhoto>
            <LandingPhoto className="olf-hero-photo olf-hero-photo--three" depth={16}>
              <div className="olf-photo-frame"><Image src={photoThree} alt="" fill sizes="(max-width: 767px) 26vw, 12vw" /></div>
            </LandingPhoto>
          </div>
        </div>
        <div className="olf-hero-description olf-shell">
          <p>{home.intro}</p>
          <div className="olf-actions">
            <Link className="olf-button" href={home.primaryCta.href}>{home.primaryCta.label}<ArrowUpRight aria-hidden="true" size={20} /></Link>
            <Link className="olf-link" href={home.secondaryCta.href}>{home.secondaryCta.label}</Link>
          </div>
          <p className="olf-hero-note">{home.footnote}</p>
          <p className="olf-image-note">{home.imageNote}</p>
        </div>
      </section>

      <section id="dich-vu" className="olf-section olf-services" aria-labelledby="services-title">
        <div className="olf-shell">
          <LandingReveal className="olf-section-heading">
            <span className="olf-eyebrow">{home.servicesEyebrow}</span>
            <h2 id="services-title" className="copy-lines">{home.servicesTitle}</h2><p>{home.servicesIntro}</p>
          </LandingReveal>
          <LandingReveal><ServiceCards variant="home" /></LandingReveal>
        </div>
      </section>

      <section className="olf-section olf-shell" aria-labelledby="featured-title">
        <div className="olf-heading-row"><div><span className="olf-eyebrow">{home.featuredEyebrow}</span><h2 id="featured-title">{home.featuredTitle}</h2></div>
          <Link className="olf-link" href={home.featuredCta.href}>{home.featuredCta.label}<ArrowUpRight aria-hidden="true" size={19} /></Link>
        </div>
        {products.length ? <div className="olf-product-grid editorial-products">{products.map((p, index) =>
          <LandingReveal key={p.id} delay={Math.min(index, 2) * 0.08}><ProductCard product={p} variant="home" /></LandingReveal>)}</div>
          : <Empty title="Những mùa hoa đang được chuẩn bị" body="Hòe sẽ giới thiệu mẫu hoa khi thông tin và hình ảnh đã sẵn sàng." href="/dich-vu/hoa-tam" action="Khám phá Hoa Tâm" />}
      </section>

      <section className="olf-section olf-story" aria-labelledby="story-title">
        <div className="olf-shell">
          <div className="olf-story-grid">
            <LandingReveal className="olf-story-photo"><Image src={storyPhoto.src} alt={storyPhoto.alt} fill sizes="(max-width: 767px) 90vw, 42vw" /></LandingReveal>
            <LandingReveal className="olf-story-copy"><span className="olf-eyebrow">{home.storyEyebrow}</span>
              <h2 id="story-title" className="copy-lines">{home.storyTitle}</h2><p>{home.storyBody}</p>
              <Link className="olf-link" href={story ? `/blog/${story.slug}` : "/ve-hoe"}>{home.storyCtaLabel}<ArrowUpRight aria-hidden="true" size={19} /></Link>
              <Flower2 className="olf-story-flower" aria-hidden="true" />
            </LandingReveal>
          </div>
          {home.benefits.length > 0 && <div className="olf-benefits"><div className="olf-benefits-intro"><span className="olf-eyebrow">{home.benefitEyebrow}</span><h3 className="copy-lines">{home.benefitTitle}</h3><p>{home.benefitIntro}</p></div>
            <div className="olf-benefit-grid">{home.benefits.map((benefit, index) => <LandingReveal key={benefit.title} delay={Math.min(index, 2) * 0.08}>
              <span className="olf-step-number">0{index + 1}</span><h3>{benefit.title}</h3><p>{benefit.body}</p>
            </LandingReveal>)}</div></div>}
        </div>
      </section>

      <section className="olf-section olf-shell" aria-labelledby="journal-title">
        <div className="olf-heading-row"><div><span className="olf-eyebrow">NHỮNG ĐIỀU NHỎ BÉ</span><h2 id="journal-title">Chuyện hoa</h2></div>
          {articles.length > 0 && <Link className="olf-link" href="/blog">Đọc thêm chuyện hoa<ArrowUpRight aria-hidden="true" size={19} /></Link>}
        </div>
        {articles.length ? <div className="olf-journal">{articles.slice(0, 3).map(a => <LandingReveal key={a.id}>
          <Link href={`/blog/${a.slug}`} className="olf-journal-card"><span className="olf-journal-art" aria-hidden="true">{a.image ? <Image src={a.image} alt="" fill sizes="(max-width: 767px) 90vw, 30vw" /> : <Flower2 strokeWidth={0.8} />}</span>
            <div><span className="olf-eyebrow">{a.category || "Chuyện của Hòe"}</span><h3>{a.title}</h3><p>{a.excerpt}</p><span className="olf-link">Đọc câu chuyện<ArrowUpRight aria-hidden="true" size={18} /></span></div>
          </Link></LandingReveal>)}</div> : <Empty title="Chuyện hoa đang được viết" body="Hòe sẽ gửi bạn những câu chuyện và cảm hứng khi bài viết đã sẵn sàng." />}
      </section>

      <section className="olf-section olf-process" aria-labelledby="process-title">
        <div className="olf-shell">
          <LandingReveal className="olf-section-heading"><span className="olf-eyebrow">TỪ MONG MUỐN ĐẾN MỘT CHÚT HOA</span><h2 id="process-title">{home.processTitle}</h2></LandingReveal>
          <div className="olf-process-grid">{home.process.map((step, index) => <LandingReveal key={step.title} delay={Math.min(index, 2) * 0.08}><span className="olf-step-number">0{index + 1}</span><h3>{step.title}</h3><p>{step.body}</p></LandingReveal>)}</div>
          {site.faq.length > 0 && <div className="olf-faq"><h2>{home.faqTitle}</h2>{site.faq.map(q => <details key={q.question}><summary>{q.question}</summary><p>{q.answer}</p></details>)}</div>}
        </div>
      </section>

      <section className="olf-section olf-cta" aria-labelledby="cta-title"><div className="olf-shell">
        <LandingReveal><Flower2 className="olf-cta-flower" aria-hidden="true" /><span className="olf-eyebrow">{home.ctaEyebrow}</span><h2 id="cta-title">{home.ctaTitle}</h2><p>{home.ctaBody}</p>
          <div className="olf-actions"><Link className="olf-button" href={home.primaryCta.href}>{home.primaryCta.label}<ArrowUpRight aria-hidden="true" size={20} /></Link><Link className="olf-link" href={home.secondaryCta.href}>{home.secondaryCta.label}</Link></div>
        </LandingReveal>
      </div></section>
    </div>
  );
}
