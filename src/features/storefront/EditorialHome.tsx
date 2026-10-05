import { ActionLink } from "@/components/ui/ActionLink";
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
      <section className="editorial-hero grid grid-cols-1 items-center gap-8 py-12 md:grid-cols-2 md:py-16 container mx-auto w-full max-w-container px-4 md:px-8">
        <div className="editorial-hero-copy flex flex-col items-start gap-4">
          <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">
            {home.eyebrow}
          </span>
          <h1>
            {home.title.split("\n")[0]}
            <br />
            <em>{home.title.split("\n").slice(1).join("\n")}</em>
          </h1>
          <p>{home.intro}</p>
          <div className="hero-actions mt-6 flex flex-wrap items-center gap-3">
            <ActionLink className="button" href={home.primaryCta.href}>
              {home.primaryCta.label}
              <ArrowUpRight size={17} />
            </ActionLink>
            <ActionLink className="text-link" href={home.secondaryCta.href}>
              {home.secondaryCta.label}
            </ActionLink>
          </div>
          <div className="editorial-hero-footnote flex items-center gap-3 text-sm text-tertiary">
            <Flower2 size={20} strokeWidth={1.2} aria-hidden="true" />
            <span>{home.footnote}</span>
          </div>
        </div>
        <div className="editorial-hero-art flex flex-col gap-4">
          <div className="editorial-hero-photo relative aspect-[4/5] overflow-hidden rounded-xl">
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
          <div className="editorial-photo-caption flex items-center gap-3 text-sm text-tertiary">
            <Flower2 size={20} strokeWidth={1.2} aria-hidden="true" />
            <p>{home.imageNote}</p>
          </div>
          <span className="editorial-orbit hidden" aria-hidden="true">
            <Flower2 size={42} strokeWidth={0.9} />
          </span>
        </div>
      </section>
      <div className="editorial-benefits grid grid-cols-1 gap-8 py-8 md:grid-cols-3 container mx-auto w-full max-w-container px-4 md:px-8">
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
      <section
        id="dich-vu"
        className="editorial-section py-12 md:py-16 editorial-services bg-secondary"
      >
        <div className="container mx-auto w-full max-w-container px-4 md:px-8">
          <div className="editorial-section-heading mx-auto mb-8 flex max-w-3xl flex-col gap-4 text-center">
            <span className="editorial-index mb-4 block text-sm font-semibold text-brand-secondary">
              01 / CÁCH GỬI HOA
            </span>
            <h2 className="copy-lines">{home.servicesTitle}</h2>
            <p>{home.servicesIntro}</p>
          </div>
          <div>
            <ServiceCards />
          </div>
        </div>
      </section>
      <section className="editorial-section py-12 md:py-16 container mx-auto w-full max-w-container px-4 md:px-8">
        <div className="editorial-heading-row mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">
              02 / {home.featuredEyebrow}
            </span>
            <h2>{home.featuredTitle}</h2>
          </div>
          <ActionLink className="text-link" href={home.featuredCta.href}>
            {home.featuredCta.label}
            <ArrowRight size={17} />
          </ActionLink>
        </div>
        {products.length ? (
          <div className="product-grid grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 editorial-products">
            {products.map((p) => (
              <div key={p.id}>
                <ProductCard product={p} />
              </div>
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
      <section className="editorial-story bg-secondary editorial-section py-12 md:py-16">
        <div className="container mx-auto w-full max-w-container px-4 md:px-8 editorial-story-grid grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div className="editorial-story-photo relative aspect-[4/5] overflow-hidden rounded-xl">
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
          </div>
          <div className="editorial-story-copy flex flex-col gap-4">
            <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">
              03 / {home.storyEyebrow}
            </span>
            <h2 className="copy-lines">{home.storyTitle}</h2>
            <p>{home.storyBody}</p>
            <ActionLink
              className="text-link"
              href={story ? `/blog/${story.slug}` : "/ve-hoe"}
            >
              {home.storyCtaLabel}
              <ArrowUpRight size={17} />
            </ActionLink>
            <Flower2
              className="editorial-story-flower size-8 text-fg-brand-primary"
              size={68}
              strokeWidth={0.7}
              aria-hidden="true"
            />
          </div>
        </div>
      </section>
      {articles.length > 0 && (
        <section className="editorial-section py-12 md:py-16 container mx-auto w-full max-w-container px-4 md:px-8">
          <div className="editorial-heading-row mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">
                NHỮNG ĐIỀU NHỎ BÉ
              </span>
              <h2>Chuyện hoa</h2>
            </div>
            <ActionLink className="text-link" href="/blog">
              Đọc thêm chuyện hoa
              <ArrowRight size={17} />
            </ActionLink>
          </div>
          <div className="editorial-journal grid grid-cols-1 gap-8 md:grid-cols-3">
            {articles.slice(0, 3).map((a) => (
              <div key={a.id}>
                <Link
                  href={`/blog/${a.slug}`}
                  key={a.id}
                  className="editorial-journal-card flex h-full flex-col gap-4 rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary"
                >
                  <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">
                    {a.category || "Chuyện của Hòe"}
                  </span>
                  <h3>{a.title}</h3>
                  <p>{a.excerpt}</p>
                  <span className="text-link">
                    Đọc câu chuyện
                    <ArrowUpRight size={16} />
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="editorial-process bg-secondary editorial-section py-12 md:py-16">
        <div className="container mx-auto w-full max-w-container px-4 md:px-8">
          <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">
            TỪ MONG MUỐN ĐẾN MỘT CHÚT HOA
          </span>
          <h2>{home.processTitle}</h2>
          <div className="hoe-process mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {home.process.map((step, i) => (
              <div key={step.title}>
                <span>0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
          {site.faq.length > 0 && (
            <div className="hoe-faq mt-8 flex flex-col gap-4">
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
      <section className="editorial-cta flex flex-col items-center gap-4 border-t border-secondary px-4 py-12 text-center md:py-16">
        <div>
          <Flower2 size={40} strokeWidth={1} aria-hidden="true" />
          <span className="eyebrow mb-4 block text-sm font-semibold text-brand-secondary">
            {home.ctaEyebrow}
          </span>
          <h2>{home.ctaTitle}</h2>
          <p>{home.ctaBody}</p>
          <div className="hero-actions mt-6 flex flex-wrap items-center gap-3">
            <ActionLink className="button" href={home.primaryCta.href}>
              {home.primaryCta.label}
              <ArrowUpRight size={17} />
            </ActionLink>
            <ActionLink className="text-link" href={home.secondaryCta.href}>
              {home.secondaryCta.label}
            </ActionLink>
          </div>
        </div>
      </section>
    </div>
  );
}
