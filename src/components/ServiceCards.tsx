import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ServiceTypeIcon } from "./ServiceTypeIcon";
import { getServices } from "@/server/content";
import { LandingScrollFade } from "@/features/storefront/LandingMotion";
export async function ServiceCards({ variant = "default" }: { variant?: "default" | "home" }) {
  return (
    <div className={variant === "home" ? "olf-service-grid" : "service-grid"}>
      {(await getServices()).map((service) => {
        const card = (
          <article className={variant === "home" ? "olf-service-card" : "service-card"} key={service.id}>
            <span className="number">{service.number}</span>
            <ServiceTypeIcon serviceId={service.id} className="service-flower" />
            <h3>{variant === "home" ? service.name : service.shortName}</h3>
            <p>{service.subtitle}</p>
            <Link href={`/dich-vu/${service.id}`} className="text-link">
              Khám phá {service.name}
              <ArrowUpRight size={15} />
            </Link>
          </article>
        );
        return variant === "home" ? <LandingScrollFade key={service.id}>{card}</LandingScrollFade> : card;
      })}
    </div>
  );
}
