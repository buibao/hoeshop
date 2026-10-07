import Link from "next/link";
import { ArrowUpRight, Flower2, Heart, Sprout } from "lucide-react";
import { getServices } from "@/server/content";
import { LandingScrollFade } from "@/features/storefront/LandingMotion";
const icons = [Sprout, Heart, Flower2];
export async function ServiceCards({ variant = "default" }: { variant?: "default" | "home" }) {
  return (
    <div className={variant === "home" ? "olf-service-grid" : "service-grid"}>
      {(await getServices()).map((service, index) => {
        const Icon = icons[index];
        const card = (
          <article className={variant === "home" ? "olf-service-card" : "service-card"} key={service.id}>
            <span className="number">{service.number}</span>
            <Icon className="service-flower" aria-hidden="true" />
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
