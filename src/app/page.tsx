import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flower2 } from "lucide-react";
import { getHome, getProducts, getArticles, getAssets, isTestContent } from "@/server/content";
import { ProductCard } from "@/components/ProductCard";
import { ServiceCards } from "@/components/ServiceCards";
import { Empty } from "@/components/Empty";
export default function HomePage() {
  const home = getHome(), products = getProducts().slice(0, home.featuredLimit);
  const test = isTestContent();
  const assets = getAssets();
  const story = getArticles().find((a) => a.slug === home.storySlug);
  return <>
    <section className="hero"><div className="container hero-grid">
      <div className="hero-copy"><span className="eyebrow">{home.eyebrow}</span>
        <h1>{home.title.split("\n")[0]}<br/><em>{home.title.split("\n")[1]}</em></h1><p>{home.intro}</p>
        <div className="hero-actions"><Link className="button" href="/san-pham">Đặt hoa ngay <ArrowRight size={15} /></Link><a href="#dich-vu" className="text-link">Khám phá dịch vụ</a></div>
        <div className="hero-footnote"><Flower2 size={15} strokeWidth={1.4} /> Hoa kể chuyện. Hòe gửi thương.</div>
      </div>
      <div className="hero-visual"><div className="hero-image"><Image src={assets.hero?.src || (test ? "/images/preview/bouquet.jpg" : "/images/floral-mark.svg")} alt={assets.hero?.alt || (test ? "Bó hoa hồng — ảnh minh họa bản xem thử" : "Minh họa một nhành hoa của Hòe")} fill sizes="(max-width: 700px) 90vw, 45vw" preload loading="eager" unoptimized={test} /></div><div className="hero-note">Những điều nhỏ bé,<br/>làm ngày thêm xinh.<span>MỘT LỜI NHẮN TỪ HÒE</span></div></div>
    </div></section>
    <div className="marquee" aria-hidden="true"><span>Hoa cho những ngày bình thường</span><i>✳</i><span>Chọn hoa bằng cảm xúc</span><i>✳</i><span>Gửi một chút dịu dàng</span></div>
    <section className="section"><div className="container benefit-grid"><div className="benefit-intro"><span className="eyebrow">VÌ NIỀM VUI NÊN THẬT NHẸ NHÀNG</span><h2>Bận cứ bận,<br/>chill cứ chill.</h2><p>Hòe muốn việc chọn và gửi hoa trở nên gần gũi hơn với đời sống mỗi ngày. Bạn giữ những điều quan trọng, để Hòe cùng bạn chăm chút những niềm vui nhỏ.</p></div>
      <div className="benefit-list">{home.benefits.map((b,i) => <div key={b.title} className="benefit"><span className="benefit-number">0{i+1}</span><div><h3>{b.title}</h3><p>{b.body}</p></div></div>)}</div>
    </div></section>
    <section id="dich-vu" className="section soft-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">BA CÁCH ĐỂ HOA KỂ CHUYỆN</span><h2>Mỗi mong muốn,<br/>một cách gửi hoa.</h2></div><p>Một niềm vui cho mình, một lời thương cho ai đó.<br/>Bạn chọn điểm bắt đầu, Hòe cùng bạn viết tiếp.</p></div><ServiceCards /></div></section>
    <section className="section"><div className="container"><div className="section-heading"><div><span className="eyebrow">MỘT CHÚT CẢM HỨNG</span><h2>Những đóa hoa của Hòe</h2></div><Link href="/san-pham" className="text-link">Xem các mẫu hoa <ArrowRight size={15} /></Link></div>
      {products.length ? <div className="product-grid">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div> : <Empty title="Những mùa hoa đang được chuẩn bị" body="Hòe sẽ giới thiệu các mẫu hoa khi hình ảnh và thông tin đã sẵn sàng." href="/dich-vu/hoa-tam" action="Khám phá Hoa Tâm" />}
    </div></section>
    <section className="section soft-section"><div className="container story-grid"><div className="story-image"><Image src={assets.story?.src || (test ? "/images/preview/peonies.jpg" : "/images/floral-mark.svg")} alt={assets.story?.alt || (test ? "Hoa trong bình — ảnh minh họa bản xem thử" : "Nhành hoa minh họa cho câu chuyện Hòe")} fill sizes="(max-width: 700px) 90vw, 45vw" unoptimized={test}/></div><div className="story-copy"><span className="eyebrow">CHUYỆN CỦA HÒE</span><h2>Niềm vui xứng đáng<br/>được ở bên bạn<br/><em>nhiều hơn.</em></h2><p>Một bó hoa có thể là lời yêu thương, một lời cảm ơn, một chút nhớ nhung, hay đơn giản là món quà dành cho chính mình. Hòe muốn những điều dịu dàng ấy có mặt cả trong những ngày rất đỗi bình thường.</p>{story ? <Link className="text-link" href={`/blog/${story.slug}`}>Đọc câu chuyện của Hòe <ArrowRight size={15}/></Link> : <Link className="text-link" href="/ve-hoe">Về Hòe <ArrowRight size={15}/></Link>}</div></div></section>
    <section className="cta-section"><span className="eyebrow">BẠN MUỐN HÒE GỬI ĐIỀU GÌ?</span><h2>Để hoa thay bạn kể.</h2><p>Một chút hoa, một chút dịu dàng.<br/>Dành cho bạn, và những người bạn thương.</p><div className="hero-actions"><Link className="button" href="/san-pham">Đặt hoa ngay <ArrowRight size={15}/></Link><a className="button secondary" href="#dich-vu">Khám phá dịch vụ</a></div></section>
  </>;
}
