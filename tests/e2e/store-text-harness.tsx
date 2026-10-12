import { createRoot } from "react-dom/client";
import { useRef, useState } from "react";
import { StoreScope } from "@/components/StoreScope";
import { StoreTextReveal, StoreTextExemption, StoreTextRoot } from "@/components/ui/StoreTextReveal";
import { textRevealPoolCount } from "@/lib/store-text-reveal";

function Harness() {
  const root = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(true);
  const [rerenders, setRerenders] = useState(0);
  return <>
    <button id="unmount" onClick={() => setMounted(false)}>Unmount</button>
    <button id="rerender" onClick={() => setRerenders(count => count + 1)}>Rerender {rerenders}</button>
    <button id="diagnostics" onClick={event => { event.currentTarget.textContent = String(textRevealPoolCount()); }}>Pools</button>
    {mounted && <StoreScope className="hoe-store-scope">
      <div id="scroll-root" ref={root} style={{ height: 240, overflow: "auto", marginTop: 40 }}>
        <StoreTextRoot root={root}>
          <div style={{ height: 500 }} />
          <StoreTextReveal as="h2" role="heading" id="root-heading">Tiếng Việt có dấu: đều đặn, dịu dàng.</StoreTextReveal>
          <StoreTextReveal as="p" id="linked-copy">Một đoạn có <a id="inline-link" href="#local">liên kết nội tuyến dài</a> và chữ còn lại.</StoreTextReveal>
          <StoreTextReveal as="p" id="tall-copy">{Array(120).fill("Một đoạn dài hơn viewport để kiểm tra giao nhau dương.").join(" ")}</StoreTextReveal>
          <div style={{ height: 500 }} />
        </StoreTextRoot>
      </div>
      <StoreTextExemption><StoreTextReveal as="h2" id="exempt">Protected copy</StoreTextReveal></StoreTextExemption>
    </StoreScope>}
  </>;
}
createRoot(document.getElementById("root")!).render(<Harness />);
