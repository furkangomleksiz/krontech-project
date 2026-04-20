/**
 * Single place for blog hero/cover image URLs from the public API.
 * List and detail both use this so they never diverge.
 *
 * Older rows or cached JSON sometimes contained a space in the path after the bucket
 * segment (e.g. {@code .../media/ uploads/...}), which breaks the browser {@code <img>} request.
 */
export function normalizeBlogHeroImageUrl(
  input: string | undefined | null,
): string | undefined {
  if (input == null) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  const fixed = trimmed.replace(/\/media\/\s+uploads\//g, "/media/uploads/");
  if (!/^https?:\/\//i.test(fixed)) return undefined;
  return fixed;
}
