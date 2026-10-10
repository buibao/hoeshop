import type { Configuration } from "./schemas";
import { currentRecurrenceSchema, recurrenceSnapshot, type Recommendation, type RecurrenceSnapshot } from "./recurrence";

// This output is server-owned and deliberately absent from strict request schemas.
export function snapshotConfiguration(configuration: Configuration, recommendations: Recommendation[]) {
  if (configuration.serviceType !== "hoa-thoi") return configuration;
  const parsed = currentRecurrenceSchema.safeParse(configuration.recurrence);
  return { ...configuration, ...(parsed.success ? { recurrenceSnapshot: recurrenceSnapshot(parsed.data, recommendations) } : {}) };
}
export type ConfigurationSnapshot = Configuration & { recurrenceSnapshot?: RecurrenceSnapshot };
