import { StoreTextReveal } from "@/components/ui/StoreTextReveal";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ServiceTypeIcon } from "./ServiceTypeIcon";
import { getServices } from "@/server/content";
export async function ServiceCards({ variant = "default" }: { variant?: "default" | "home" }) {
  return (
    <div className={variant === "home" ? "olf-service-grid" : "service-grid"}>
      {(await getServices()).map((service) => {
        const card = (
          <article className={variant === "home" ? "olf-service-card" : "service-card"} key={service.id}>
            <span className="number">{service.number}</span>
            <ServiceTypeIcon serviceId={service.id} className="service-flower" />
            <StoreTextReveal as="h3" role="body">{variant === "home" ? service.name : service.shortName}</StoreTextReveal>
            <StoreTextReveal as="p" role="body" delayMs={90}>{service.subtitle}</StoreTextReveal>
            <Link href={`/dich-vu/${service.id}`} className="text-link">
              Khám phá {service.name}
              <ArrowUpRight size={15} />
            </Link>
          </article>
        );
        return variant === "home" ? <div key={service.id} data-scroll-fade data-text-group><div data-scroll-fade-content>{card}</div></div> : <div key={service.id} className="store-motion-reveal" data-text-group>{card}</div>;
      })}
    </div>
  );
}
