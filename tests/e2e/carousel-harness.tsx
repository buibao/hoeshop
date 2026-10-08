/* eslint-disable @next/next/no-html-link-for-pages -- Standalone browser fixture has no Next router; Store cards are tested separately. */
import { createRoot } from "react-dom/client";
import { useState } from "react";
import { StoreScope, useStoreOverlay } from "../../src/components/StoreScope";
import { FeaturedProductCarousel } from "../../src/features/storefront/FeaturedProductCarousel";
function Fixture() {
 const [count,setCount] = useState(10), [overlay,setOverlay] = useState(false);
 useStoreOverlay(overlay);
 return <><button id="outside">Ngoài carousel</button><button id="overlay" onClick={()=>setOverlay(v=>!v)}>Overlay</button><button id="count" onClick={()=>setCount(v=>v===10?1:v===1?0:10)}>Số lượng</button><h2 id="featured-title">Những đóa hoa của Hòe</h2><FeaturedProductCarousel slides={Array.from({length:count},(_,i)=>({id:String(i),card:<article className="olf-product-card"><a href="/san-pham/mau-test-diu-dang" className="product-image" style={{background:'#efd9db',display:'grid',placeItems:'center',height:200}}>Hoa {i+1}</a><h3>Một chút dịu dàng {i+1}</h3><p className="product-price">550.000 ₫</p></article>}))}/><div style={{height:1200}}/></>;
}
createRoot(document.getElementById('root')!).render(<StoreScope className="hoe-store-scope"><Fixture/></StoreScope>);
