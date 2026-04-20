/**
 * Base URL for the Spring API, including the `/api/v1` path (no trailing slash).
 *
 * - In the browser, always uses `NEXT_PUBLIC_API_BASE_URL` so Docker users can call
 *   `http://localhost:8080` on the host (published API port).
 * - On the server (SSR, route handlers) and in Edge middleware, prefers
 *   `API_INTERNAL_BASE_URL` when set (e.g. `http://api:8080/api/v1` in Docker Compose)
 *   so the Next.js container can reach the API by service name.
 */
export function getApiBaseUrl(): string {
  const strip = (u: string) => u.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    return strip(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1");
  }
  return strip(
    process.env.API_INTERNAL_BASE_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      "http://localhost:8080/api/v1",
  );
}
