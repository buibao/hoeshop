import { adminPageActor } from "@/server/admin/auth";
import { adminHomeSelection } from "@/server/admin/repository";
import { HomeProductPicker } from "@/features/admin/HomeProductPicker";
export default async function FeaturedPage() {
  if (!(await adminPageActor())) return null;
  return <HomeProductPicker kind="featured" initial={await adminHomeSelection("featured")} />;
}
