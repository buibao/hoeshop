import { ActionLink } from "@/components/ui/ActionLink";
import { ArrowUpRight, Flower2, Heart, Sprout } from "lucide-react";
import { getServices } from "@/server/content";
const icons = [Sprout, Heart, Flower2];
export async function ServiceCards() {
  return (
    <div className="service-grid grid grid-cols-1 gap-8 md:grid-cols-3">
      {(await getServices()).map((service, index) => {
        const Icon = icons[index];
        return (
          <article className="service-card relative flex flex-col gap-4 rounded-xl bg-primary p-6 shadow-xs ring-1 ring-secondary" key={service.id}>
            <span className="number">/ {service.number}</span>
            <Icon className="service-flower size-8 text-fg-brand-primary" aria-hidden="true" />
            <h3>{service.shortName}</h3>
            <p>{service.subtitle}</p>
            <ActionLink href={`/dich-vu/${service.id}`} className="text-link">
              Khám phá {service.name}
              <ArrowUpRight size={15} />
            </ActionLink>
          </article>
        );
      })}
    </div>
  );
}
