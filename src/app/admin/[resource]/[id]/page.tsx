import { notFound } from "next/navigation";
import { adminPageActor } from "@/server/admin/auth";
import { resourceSchema } from "@/server/admin/schemas";
import { adminList } from "@/server/admin/repository";
import { AdminEditor } from "@/features/admin/AdminEditor";
export default async function EditPage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  if (!(await adminPageActor())) return null;
  const { resource: name, id } = await params,
    parsed = resourceSchema.safeParse(name);
  if (!parsed.success || name === "media") notFound();
  const resource = parsed.data;
  if (id === "moi" && ["products", "posts", "policies"].includes(resource))
    return <AdminEditor resource={resource} row={null} />;
  const [row] = await adminList(resource, id);
  if (!row) notFound();
  return (
    <AdminEditor resource={resource} row={JSON.parse(JSON.stringify(row))} />
  );
}
