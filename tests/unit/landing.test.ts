import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {homeDefaults,homeSchema} from '@/domain/content';
import * as files from '@/server/file-content';
import * as content from '@/server/content';
import {EditorialHome} from '@/features/storefront/EditorialHome';

vi.mock('@/server/content',()=>({getHome:vi.fn(),getProducts:vi.fn(),getArticles:vi.fn(),getAssets:vi.fn(),getSite:vi.fn(),getServices:vi.fn(),isTestContent:vi.fn()}));
// Render client leaves as visible wrappers to inspect server-selected content independently of animation.
vi.mock('@/features/storefront/LandingMotion',()=>({LandingPhoto:({children,...props}: {children:React.ReactNode})=>createElement('div',props,children),LandingScrollFade:({children}: {children:React.ReactNode})=>createElement('div',null,children)}));
vi.mock('@/features/storefront/LandingHeroMotion',()=>({LandingHeroMotion:({children}: {children:React.ReactNode})=>createElement('section',{className:'olf-hero'},children),LandingTitleLine:({children}: {children:React.ReactNode})=>createElement('span',{className:'olf-title-line'},children),LandingHeroOrnament:({children}: {children:React.ReactNode})=>createElement('span',{'aria-hidden':true},children),LandingHeroPhoto:({children}: {children:React.ReactNode})=>createElement('div',null,children),LandingStoryPhoto:({children}: {children:React.ReactNode})=>createElement('div',null,children)}));
vi.mock('@/features/storefront/LandingBenefitsMotion',()=>({LandingBenefitsMotion:({intro,cards}: {intro:React.ReactNode;cards:React.ReactNode[]})=>createElement('div',{className:'olf-benefits'},intro,...cards.map((card,index)=>createElement('article',{key:index},card)))}));
vi.mock('@/components/ServiceCards',()=>({ServiceCards:()=>createElement('div',null,'Ba dịch vụ')}));
afterEach(()=>vi.unstubAllEnvs());

beforeEach(()=>{
  vi.stubEnv('CONTENT_MODE','test');
  vi.mocked(content.getHome).mockResolvedValue(homeSchema.parse({...homeDefaults,...files.getHome()}));
  vi.mocked(content.getProducts).mockResolvedValue(files.getProducts().map(p=>({...p,revision:'test'})));
  vi.mocked(content.getArticles).mockResolvedValue([]);
  vi.mocked(content.getAssets).mockResolvedValue({logo:null,hero:null,story:null});
  vi.mocked(content.getSite).mockResolvedValue(files.getSite());
  vi.mocked(content.isTestContent).mockReturnValue(true);
});

describe('landing content composition',()=>{
  it.each([
    'Hòe gửi hoa,  chill ghé nhà.',
    'Hòe gửi hoa,\nchill ghé nhà.',
    'Hòe gửi hoa,\r\n\r\nchill ghé nhà.\r\n',
  ])('preserves both hero ornaments and emphasis for title %j',async(title)=>{
    const home=await content.getHome();
    vi.mocked(content.getHome).mockResolvedValue({...home,title});
    const html=renderToStaticMarkup(await EditorialHome());
    const heading=html.split('<h1')[1].split('</h1>')[0];
    expect(heading.match(/class="olf-title-line"/g)).toHaveLength(2);
    expect(heading.match(/\bolf-title-flower\b/g)).toHaveLength(1);
    expect(heading.match(/\bolf-title-heart\b/g)).toHaveLength(1);
    expect(heading).toContain('<em>chill ghé nhà.</em>');
  });
  it('keeps both ornaments for custom titles without a clause break',async()=>{
    const home=await content.getHome();
    vi.mocked(content.getHome).mockResolvedValue({...home,title:'Một chút dịu dàng'});
    const html=renderToStaticMarkup(await EditorialHome());
    const heading=html.split('<h1')[1].split('</h1>')[0];
    expect(heading).toContain('Một chút dịu dàng');
    expect(heading.match(/\bolf-title-flower\b/g)).toHaveLength(1);
    expect(heading.match(/\bolf-title-heart\b/g)).toHaveLength(1);
  });
  it.each([0,1,10])('keeps exactly %i configured benefits without reference claims',async(count)=>{
    const home=await content.getHome();
    vi.mocked(content.getHome).mockResolvedValue({...home,benefits:Array.from({length:count},(_,i)=>({title:`Benefit ${i}`,body:'Configured content'}))});
    const html=renderToStaticMarkup(await EditorialHome());
    expect(html.match(/Configured content/g)||[]).toHaveLength(count);
    expect(html.includes('class="olf-benefits"')).toBe(count>0);
    expect(html).not.toContain('24 ans');
  });
  it('respects featured ordering, ignores the legacy limit for selections, and does not insert missing IDs',async()=>{
    const catalog=await content.getProducts();
    const home=await content.getHome();
    vi.mocked(content.getHome).mockResolvedValue({...home,featuredProductIds:[catalog[1].id,'not-published',catalog[0].id],featuredLimit:1});
    const html=renderToStaticMarkup(await EditorialHome());
    const featured=html.split('class="olf-featured-carousel editorial-products"')[1].split('</section>')[0];
    expect(featured).toContain(`/san-pham/${catalog[1].slug}`);
    expect(featured).toContain(`/san-pham/${catalog[0].slug}`);
    expect(featured.indexOf(`/san-pham/${catalog[1].slug}`)).toBeLessThan(featured.indexOf(`/san-pham/${catalog[0].slug}`));
    expect(featured).not.toContain('not-published');
  });
  it('empty catalog/blog and missing photos remain useful; empty FAQ is omitted',async()=>{
    vi.mocked(content.getProducts).mockResolvedValue([]);
    vi.mocked(content.getSite).mockResolvedValue({...files.getSite(),faq:[]});
    vi.mocked(content.isTestContent).mockReturnValue(false);
    const html=renderToStaticMarkup(await EditorialHome());
    expect(html).toContain('Những mùa hoa đang được chuẩn bị');expect(html).not.toContain('id="journal-title"');
    expect(html).toContain('/images/floral-mark.svg');expect(html).not.toContain('/images/preview/');expect(html).not.toContain('class="olf-faq"');
  });
  it('configured hero/story win over fixtures and supports long Vietnamese title',async()=>{
    vi.mocked(content.getAssets).mockResolvedValue({logo:null,hero:{src:'/images/floral-mark.svg',alt:'Ảnh hero cấu hình'},story:{src:'/images/floral-mark.svg',alt:'Ảnh story cấu hình'}});
    const home=await content.getHome();vi.mocked(content.getHome).mockResolvedValue({...home,title:'Hòe gửi những điều dịu dàng đến người bạn thương\nMột chút hoa mỗi ngày'});
    const html=renderToStaticMarkup(await EditorialHome());
    expect(html).toContain('Ảnh hero cấu hình');expect(html).toContain('Ảnh story cấu hình');expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('Hòe gửi những điều dịu dàng đến người bạn thương');
  });
});
