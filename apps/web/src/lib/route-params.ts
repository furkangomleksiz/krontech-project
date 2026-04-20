/**
 * Normalizes Next.js App Router dynamic segment params (string | string[] | undefined).
 */
export function dynamicSegmentId(
  value: string | string[] | undefined,
): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}
