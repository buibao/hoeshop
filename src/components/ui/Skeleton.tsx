/** Hòe composition using upstream utility scale; this is not a PRO template. */
export function Skeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex animate-pulse flex-col gap-3 motion-reduce:animate-none"
    >
      <div className="h-4 w-full rounded bg-secondary" />
      <div className="h-4 w-3/4 rounded bg-secondary" />
    </div>
  );
}
