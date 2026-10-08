"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { ServiceTypeIcon } from "./ServiceTypeIcon";
import { AnimatePresence, useIsPresent, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

const services = [
  { slug: "hoa-thoi", title: "Hoa Thời", note: "Hoa cho những ngày thường" },
  { slug: "hoa-tam", title: "Hoa Tâm", note: "Gửi hoa theo cảm xúc" },
  { slug: "hoa-y", title: "Hoa Ý", note: "Chọn hoa theo ý bạn" },
];

function ProductSubmenu({
  id,
  mobile,
  reduced,
  children,
}: {
  id: string;
  mobile: boolean;
  reduced: boolean | null;
  children: React.ReactNode;
}) {
  const present = useIsPresent();
  return (
    <m.div
      id={id}
      className="product-submenu hoe-store-submenu"
      inert={!present}
      initial={reduced ? false : { opacity: 0, y: mobile ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 1 } : { opacity: 0, y: mobile ? 0 : 6 }}
      transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}

/** A navigation disclosure: links retain normal Tab order and link semantics. */
export function ProductNavigation({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReducedMotion();
  const id = mobile ? "mobile-product-links" : "desktop-product-links";
  const active =
    pathname.startsWith("/san-pham") || pathname.startsWith("/dich-vu/");
  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!expanded) return;
    const outside = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setExpanded(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [expanded]);
  function navigate() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setExpanded(false);
    onNavigate?.();
  }
  return (
    <div
      ref={wrapper}
      className={`product-navigation hoe-store-product-navigation${mobile ? " product-navigation--mobile" : ""}`}
      onMouseEnter={() => {
        if (!mobile)
          hoverTimer.current = setTimeout(() => setExpanded(true), 120);
      }}
      onMouseLeave={() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        if (!mobile && !wrapper.current?.contains(document.activeElement))
          setExpanded(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          if (hoverTimer.current) clearTimeout(hoverTimer.current);
          setExpanded(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && expanded) {
          event.preventDefault();
          event.stopPropagation();
          setExpanded(false);
          trigger.current?.focus();
        }
        if (event.key === "ArrowDown" && event.target === trigger.current) {
          event.preventDefault();
          setExpanded(true);
          requestAnimationFrame(() =>
            wrapper.current
              ?.querySelector<HTMLAnchorElement>(".product-submenu a")
              ?.focus(),
          );
        }
      }}
    >
      <div className="product-navigation-heading">
        <Link
          href="/san-pham"
          data-active={active || undefined}
          aria-current={pathname === "/san-pham" ? "page" : undefined}
          onClick={navigate}
        >
          Sản phẩm
        </Link>
        <button
          ref={trigger}
          type="button"
          aria-label="Các loại hoa"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => {
            if (hoverTimer.current) clearTimeout(hoverTimer.current);
            setExpanded(!expanded);
          }}
        >
          <ChevronDown size={15} aria-hidden="true" />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <ProductSubmenu id={id} mobile={mobile} reduced={reduced}>
            <span className="product-submenu-eyebrow">
              Một chút hoa, theo cách của bạn
            </span>
            <ul>
              {services.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/dich-vu/${service.slug}`}
                    aria-current={
                      pathname === `/dich-vu/${service.slug}`
                        ? "page"
                        : undefined
                    }
                    onClick={navigate}
                  >
                    <ServiceTypeIcon serviceId={service.slug} className="service-type-icon" size={22} />
                    <span className="product-submenu-copy">
                      <strong>{service.title}</strong>
                      <small>{service.note}</small>
                    </span>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </ProductSubmenu>
        )}
      </AnimatePresence>
    </div>
  );
}
