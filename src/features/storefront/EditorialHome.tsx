import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Flower2, Heart } from "lucide-react";
import { getHome, getProducts, getArticles, getAssets, getSite, isTestContent } from "@/server/content";
import { ProductCard } from "@/components/ProductCard";
import { ServiceCards } from "@/components/ServiceCards";
import { Empty } from "@/components/Empty";
import { LandingScrollFade } from "./LandingMotion";
import { LandingHeroMotion, LandingTitleLine, LandingHeroPhoto, LandingHeroOrnament, LandingStoryPhoto } from "./LandingHeroMotion";
import { HomeBackToTop } from "./HomeBackToTop";
import { LandingBenefitsMotion } from "./LandingBenefitsMotion";
import { FeaturedProductCarousel } from "./FeaturedProductCarousel";
import { resolveHomeProducts } from "@/domain/home-products";
import { ScrollAnchor } from "@/components/ui/ScrollAnchor";
import { homeImageAvailable } from "@/server/home-products";

export async function EditorialHome() {
  const [home, catalog, articles, assets, site] = await Promise.all([
    getHome(), getProducts(), getArticles(), getAssets(), getSite(),
  ]);
  const test = isTestContent();
  const { featured: products, hero: selectedHero } = resolveHomeProducts(home, catalog.filter((p) => homeImageAvailable(p.image)), test);
  const story = articles.find(a => a.slug === home.storySlug);
  const fallback = "/images/floral-mark.svg";
  const hero = assets.hero || { src: catalog.find(p => p.image)?.image || (test ? "/images/preview/bouquet.jpg" : fallback), alt: "Một chút hoa của Hòe" };
  // The legacy peonies fixture shows makeup tools; it is not a suitable Home photo.
  const supporting = catalog.filter(p => p.image && p.image !== hero.src && !(test && p.image === "/images/preview/peonies.jpg")).slice(0, 2);
  const photoTwo = assets.story?.src || supporting[0]?.image || (test ? "/images/preview/roses.jpg" : fallback);
  const photoThree = supporting[1]?.image || hero.src;
  const storyPhoto = assets.story || { src: hero.src, alt: "Hoa minh họa câu chuyện Hòe" };
  const heroPhotos = selectedHero
    ? selectedHero.map((p) => p ? { src: p.image!, alt: p.imageAlt || p.name } : { src: fallback, alt: "Hòe — một chút hoa, một chút dịu dàng" })
    : [hero, { src: photoTwo, alt: "Một chút hoa của Hòe" }, { src: photoThree, alt: "Một chút hoa của Hòe" }];
  let lines = home.title.split(/\r\n?|\n/).map(line => line.trim()).filter(Boolean);
  // Legacy single-line copy can wrap visually without creating a second title layer.
  // Explicit Admin line breaks win; otherwise use the first comma as the clause break.
  if (lines.length === 1) {
    const comma = lines[0].indexOf(",");
    const ending = lines[0].slice(comma + 1).trim();
    if (comma > 0 && ending) lines = [lines[0].slice(0, comma + 1), ending];
  }
  return (
    <div className="olf-home" data-home-design="oh-les-fleurs">
      <LandingHeroMotion>
        <div className="olf-shell olf-hero-stage">
          <div className="olf-hero-heading">
            <span className="olf-eyebrow">{home.eyebrow}</span>
            <h1 id="home-title" tabIndex={-1}>
              {lines.map((line, index) => <LandingTitleLine key={index} index={index}>
                {index === 0 ? line : <em>{line}</em>}
                {index === 0 ? <LandingHeroOrnament kind="flower"><Flower2 className="olf-title-flower" /></LandingHeroOrnament> : null}
                {index === lines.length - 1 ? <LandingHeroOrnament kind="heart"><Heart className="olf-title-heart" /></LandingHeroOrnament> : null}
                {index < lines.length - 1 ? " " : null}
              </LandingTitleLine>)}
            </h1>
          </div>
          <div className="olf-hero-photos">
            <LandingHeroPhoto index={0}>
              <div className="olf-photo-frame"><Image src={heroPhotos[0].src} alt={heroPhotos[0].alt} fill sizes="(max-width: 767px) 36vw, 27vw" loading="eager" fetchPriority="high" /></div>
            </LandingHeroPhoto>
            <LandingHeroPhoto index={1}>
              <div className="olf-photo-frame"><Image src={heroPhotos[1].src} alt={heroPhotos[1].alt} fill sizes="(max-width: 767px) 26vw, 27vw" loading="eager" /></div>
            </LandingHeroPhoto>
            <LandingHeroPhoto index={2}>
              <div className="olf-photo-frame"><Image src={heroPhotos[2].src} alt={heroPhotos[2].alt} fill sizes="(max-width: 767px) 26vw, 27vw" loading="eager" /></div>
            </LandingHeroPhoto>
          </div>
        <div className="olf-hero-description">
          <p>{home.intro}</p>
          <div className="olf-actions">
            <ScrollAnchor className="olf-button" href={home.primaryCta.href}>{home.primaryCta.label}<ArrowUpRight aria-hidden="true" size={20} /></ScrollAnchor>
            {/* <Link className="olf-link" href={home.secondaryCta.href}>{home.secondaryCta.label}</Link> */}
          </div>
          <p className="olf-hero-note">{home.footnote}</p>
          <p className="olf-image-note">{home.imageNote}</p>
        </div>
        <div className="olf-hero-gallery" aria-hidden="true" />
        </div>
      </LandingHeroMotion>

      <section className="olf-section olf-story" aria-labelledby="story-title">
        <div className="olf-shell">
          {home.benefits.length > 0 && <LandingBenefitsMotion intro={<>
          <span className="olf-eyebrow">{home.benefitEyebrow}</span>
          <h3 className="copy-lines">{home.benefitTitle}</h3>
          <p>{home.benefitIntro}</p>
          </>}
            cards={home.benefits.map((benefit, index) => <div key={index}>
              <Flower2 className="olf-benefit-art" aria-hidden="true" />
              <span className="olf-step-number">{String(index + 1).padStart(2, "0")}</span><h3>{benefit.title}</h3><p>{benefit.body}</p>
            </div>)} />}
        </div>
      </section>

      <section id="dich-vu" className="olf-section olf-services" aria-labelledby="services-title">
        <div className="olf-shell">
          <LandingScrollFade className="olf-section-heading">
            <span className="olf-eyebrow">{home.servicesEyebrow}</span>
            <h2 id="services-title" className="copy-lines">{home.servicesTitle}</h2><p>{home.servicesIntro}</p>
          </LandingScrollFade>
          <ServiceCards variant="home" />
        </div>
      </section>

      <section id="nhung-doa-hoa" className="olf-section olf-shell olf-featured" aria-labelledby="featured-title">
        <LandingScrollFade><div className="olf-heading-row"><div><span className="olf-eyebrow">{home.featuredEyebrow}</span><h2 id="featured-title">{home.featuredTitle}</h2></div>
          <Link className="olf-link" href={home.featuredCta.href}>{home.featuredCta.label}<ArrowUpRight aria-hidden="true" size={19} /></Link>
        </div></LandingScrollFade>
        <LandingScrollFade>{products.length ? <FeaturedProductCarousel slides={products.map((p) => ({ id: p.id, card: <ProductCard product={p} variant="home" /> }))} />
          : <Empty title="Những mùa hoa đang được chuẩn bị" body="Hòe sẽ giới thiệu mẫu hoa khi thông tin và hình ảnh đã sẵn sàng." href="/dich-vu/hoa-tam" action="Khám phá Hoa Tâm" />}</LandingScrollFade>
      </section>

      <section className="olf-section olf-story" aria-labelledby="story-title">
        <div className="olf-shell">
          <div className="olf-story-grid">
            <LandingScrollFade><LandingStoryPhoto><Image src={storyPhoto.src} alt={storyPhoto.alt} fill sizes="(max-width: 767px) 90vw, 42vw" /></LandingStoryPhoto></LandingScrollFade>
            <LandingScrollFade className="olf-story-copy"><span className="olf-eyebrow">{home.storyEyebrow}</span>
              <h2 id="story-title" className="copy-lines">{home.storyTitle}</h2><p>{home.storyBody}</p>
              <Link className="olf-link" href={story ? `/blog/${story.slug}` : "/ve-hoe"}>{home.storyCtaLabel}<ArrowUpRight aria-hidden="true" size={19} /></Link>
              <Flower2 className="olf-story-flower" aria-hidden="true" />
            </LandingScrollFade>
          </div>
          {/* {home.benefits.length > 0 && <LandingBenefitsMotion intro={<>
          <span className="olf-eyebrow">{home.benefitEyebrow}</span>
          <h3 className="copy-lines">{home.benefitTitle}</h3>
          <p>{home.benefitIntro}</p>
          </>}
            cards={home.benefits.map((benefit, index) => <div key={index}>
              <Flower2 className="olf-benefit-art" aria-hidden="true" />
              <span className="olf-step-number">{String(index + 1).padStart(2, "0")}</span><h3>{benefit.title}</h3><p>{benefit.body}</p>
            </div>)} />} */}
        </div>
      </section>

      {/* <section className="olf-section olf-shell" aria-labelledby="journal-title">
        <div className="olf-heading-row"><div><span className="olf-eyebrow">NHỮNG ĐIỀU NHỎ BÉ</span><h2 id="journal-title">Chuyện hoa</h2></div>
          {articles.length > 0 && <Link className="olf-link" href="/blog">Đọc thêm chuyện hoa<ArrowUpRight aria-hidden="true" size={19} /></Link>}
        </div>
        {articles.length ? <div className="olf-journal">{articles.slice(0, 3).map(a => <LandingScrollFade key={a.id}>
          <Link href={`/blog/${a.slug}`} className="olf-journal-card"><span className="olf-journal-art" aria-hidden="true">{a.image ? <Image src={a.image} alt="" fill sizes="(max-width: 767px) 90vw, 30vw" /> : <Flower2 strokeWidth={0.8} />}</span>
            <div><span className="olf-eyebrow">{a.category || "Chuyện của Hòe"}</span><h3>{a.title}</h3><p>{a.excerpt}</p><span className="olf-link">Đọc câu chuyện<ArrowUpRight aria-hidden="true" size={18} /></span></div>
          </Link></LandingScrollFade>)}</div> : <Empty title="Chuyện hoa đang được viết" body="Hòe sẽ gửi bạn những câu chuyện và cảm hứng khi bài viết đã sẵn sàng." />}
      </section> */}

      <section className="olf-section olf-process" aria-labelledby="process-title">
        <div className="olf-shell">
          <LandingScrollFade className="olf-section-heading"><span className="olf-eyebrow">TỪ MONG MUỐN ĐẾN MỘT CHÚT HOA</span><h2 id="process-title">{home.processTitle}</h2></LandingScrollFade>
          <div className="olf-process-grid">{home.process.map((step, index) => <LandingScrollFade key={step.title}><span className="olf-step-number">0{index + 1}</span><h3>{step.title}</h3><p>{step.body}</p></LandingScrollFade>)}</div>
          {site.faq.length > 0 && <div className="olf-faq"><h2>{home.faqTitle}</h2>{site.faq.map(q => <details key={q.question}><summary>{q.question}</summary><p>{q.answer}</p></details>)}</div>}
        </div>
      </section>

      <section className="olf-section olf-cta" aria-labelledby="cta-title"><div className="olf-shell">
        <LandingScrollFade><Flower2 className="olf-cta-flower" aria-hidden="true" /><span className="olf-eyebrow">{home.ctaEyebrow}</span><h2 id="cta-title">{home.ctaTitle}</h2><p>{home.ctaBody}</p>
          <div className="olf-actions"><ScrollAnchor className="olf-button" href={home.primaryCta.href}>{home.primaryCta.label}<ArrowUpRight aria-hidden="true" size={20} /></ScrollAnchor><Link className="olf-link" href={home.secondaryCta.href}>{home.secondaryCta.label}</Link></div>
        </LandingScrollFade>
      </div></section>
      <HomeBackToTop />
    </div>
  );
}
