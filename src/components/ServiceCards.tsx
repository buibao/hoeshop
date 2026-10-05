import Link from "next/link";
import { ArrowUpRight, Flower2, Heart, Sprout } from "lucide-react";
import { getServices } from "@/server/content";
const icons = [Sprout, Heart, Flower2];
export async function ServiceCards() {
  return (
    <div className="service-grid">
      {(await getServices()).map((service, index) => {
        const Icon = icons[index];
        return (
          <article className="service-card" key={service.id}>
            <span className="number">/ {service.number}</span>
            <Icon className="service-flower" aria-hidden="true" />
            <h3>{service.shortName}</h3>
            <p>{service.subtitle}</p>
            <Link href={`/dich-vu/${service.id}`} className="text-link">
              Khám phá {service.name}
              <ArrowUpRight size={15} />
            </Link>
          </article>
        );
      })}
    </div>
  );
}
