/**
 * Admin API client.
 *
 * All functions read the JWT from localStorage and attach it as a Bearer token.
 * Every admin operation is gated by the backend's Spring Security configuration,
 * so bypassing this client-side auth check only exposes empty/forbidden responses.
 */

import { getApiBaseUrl } from "./base-url";

// ── Error type ────────────────────────────────────────────────────────────────

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

// ── Token helpers (browser-only) ──────────────────────────────────────────────

export function saveCredentials(
  token: string,
  role: string,
  email: string,
): void {
  localStorage.setItem("krontech_admin_token", token);
  localStorage.setItem("krontech_admin_role", role);
  localStorage.setItem("krontech_admin_email", email);
}

export function clearCredentials(): void {
  localStorage.removeItem("krontech_admin_token");
  localStorage.removeItem("krontech_admin_role");
  localStorage.removeItem("krontech_admin_email");
}

/** True when the request should not send a stored JWT (e.g. login with a stale token in storage). */
function shouldAttachAuthHeader(path: string, method: string): boolean {
  return !(path === "/auth/login" && method === "POST");
}

/**
 * Invalid or expired sessions use HTTP 401 after {@code SecurityConfig} disables anonymous auth.
 * Clears stored credentials and sends the browser to the login page (unless already there).
 */
function forceAdminReLoginIfUnauthorized(
  status: number,
  path: string,
  method: string,
  sentAuthorization: boolean,
): void {
  if (status !== 401 || !sentAuthorization) return;
  if (path === "/auth/login" && method === "POST") return;
  if (typeof window === "undefined") return;
  clearCredentials();
  if (!window.location.pathname.startsWith("/admin/login")) {
    window.location.replace("/admin/login");
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("krontech_admin_token");
}

export function getStoredRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("krontech_admin_role");
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function adminFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const token = shouldAttachAuthHeader(path, method) ? getStoredToken() : null;
  const sentAuthorization = Boolean(token);

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    // Avoid stale admin reads (e.g. audit log after save) when the URL is unchanged.
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
      else if (typeof body === "string") message = body;
    } catch {
      // ignore parse error
    }
    forceAdminReLoginIfUnauthorized(res.status, path, method, sentAuthorization);
    throw new AdminApiError(res.status, message);
  }

  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

// ── Response / request types ──────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  role: string;
  email: string;
  expiresAt: string;
}

export interface MeResponse {
  id: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface SeoAdminFields {
  metaTitle?: string;
  metaDescription?: string;
  canonicalPath?: string;
  noIndex: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImageKey?: string;
  structuredDataJson?: string;
}

export type PublishStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

interface ContentAdminBase {
  id: string;
  slug: string;
  locale: string;
  contentGroupId?: string;
  pageType?: string;
  status: PublishStatus;
  publishedAt?: string;
  scheduledAt?: string;
  previewToken?: string;
  title: string;
  summary?: string;
  heroImageKey?: string;
  seo: SeoAdminFields;
  createdAt: string;
  updatedAt: string;
}

export interface PageAdminItem extends ContentAdminBase {
  pageType: string;
}

export interface BlogAdminItem extends ContentAdminBase {
  body: string;
  tags?: string;
  readTimeMinutes: number;
  category?: string;
}

export interface ProductTabCardAdminItem {
  id: string;
  /** Matches API enum: SOLUTION | HOW_IT_WORKS | KEY_BENEFITS | RESOURCES */
  tab: string;
  sortOrder: number;
  title: string;
  body: string;
  imageObjectKey?: string;
  imageAlt?: string;
}

/** Write payload for create/update (no card id — server replaces rows). */
export interface ProductTabCardReplacePayload {
  tab: "SOLUTION" | "HOW_IT_WORKS" | "KEY_BENEFITS" | "RESOURCES";
  sortOrder: number;
  title: string;
  body: string;
  imageObjectKey?: string;
  imageAlt?: string;
}

export interface ProductResourcesTabPayload {
  introTitle?: string | null;
  introBody?: string | null;
  introImageKey?: string | null;
  introImageAlt?: string | null;
  linkedResourceIds?: string[];
}

export interface ProductAdminItem extends ContentAdminBase {
  highlights?: string;
  resourcesIntroTitle?: string | null;
  resourcesIntroBody?: string | null;
  resourcesIntroImageKey?: string | null;
  resourcesIntroImageAlt?: string | null;
  linkedResourceIds?: string[];
  tabCards?: ProductTabCardAdminItem[];
}

export type ProductAdminUpsertBody = Partial<Omit<ProductAdminItem, "tabCards">> & {
  tabCards?: ProductTabCardReplacePayload[];
  resourcesTab?: ProductResourcesTabPayload;
};

export type ResourceType =
  | "WHITEPAPER"
  | "DATASHEET"
  | "CASE_STUDY"
  | "VIDEO"
  | "OTHER";

export interface ResourceAdminItem extends ContentAdminBase {
  resourceType: ResourceType;
  fileKey?: string;
  externalUrl?: string;
  /** S3 key for auto-generated PDF first-page JPEG; set by the API after save. */
  filePreviewImageKey?: string | null;
}

export interface MediaAdminItem {
  id: string;
  objectKey: string;
  publicUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  altText?: string;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormSubmissionAdminItem {
  id: string;
  submittedAt: string;
  formType: string;
  fullName: string;
  email: string;
  company: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
  message: string;
  consentAccepted: boolean;
  sourcePage?: string;
  ipAddress: string;
}

export interface UserAdminItem {
  id: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  id: string;
  createdAt: string;
  actor: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetSlug?: string;
  details?: string;
}

export interface PublishStateResponse {
  id: string;
  slug: string;
  locale: string;
  status: string;
  publishedAt?: string;
  scheduledAt?: string;
}

export interface PreviewTokenResponse {
  /** UUID of the page whose token was rotated. */
  pageId: string;
  /** The new preview token (UUID string). Pass as ?token= query param to the preview endpoint. */
  token: string;
  /** Ready-made path: /api/v1/preview?token={token} */
  previewPath: string;
}

export interface ContentBlockItem {
  blockType: string;
  sortOrder: number;
  payloadJson: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function adminLogin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return adminFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function adminMe(): Promise<MeResponse> {
  return adminFetch<MeResponse>("/auth/me");
}

// ── Pages ─────────────────────────────────────────────────────────────────────

export function listPages(params?: {
  page?: number;
  size?: number;
  locale?: string;
  status?: string;
}): Promise<PagedResponse<PageAdminItem>> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set("page", String(params.page));
  if (params?.size !== undefined) q.set("size", String(params.size));
  if (params?.locale) q.set("locale", params.locale);
  if (params?.status) q.set("status", params.status);
  return adminFetch<PagedResponse<PageAdminItem>>(
    `/admin/pages?${q.toString()}`,
  );
}

export function getPage(id: string): Promise<PageAdminItem> {
  return adminFetch<PageAdminItem>(`/admin/pages/${id}`);
}

export function createPage(body: Omit<PageAdminItem, "id" | "createdAt" | "updatedAt" | "seo">): Promise<PageAdminItem> {
  return adminFetch<PageAdminItem>("/admin/pages", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updatePage(
  id: string,
  body: Partial<PageAdminItem>,
): Promise<PageAdminItem> {
  return adminFetch<PageAdminItem>(`/admin/pages/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function patchPageSeo(
  id: string,
  seo: SeoAdminFields,
): Promise<PageAdminItem> {
  return adminFetch<PageAdminItem>(`/admin/pages/${id}/seo`, {
    method: "PATCH",
    body: JSON.stringify(seo),
  });
}

export function deletePage(id: string): Promise<void> {
  return adminFetch<void>(`/admin/pages/${id}`, { method: "DELETE" });
}

export function getPageBlocks(pageId: string): Promise<ContentBlockItem[]> {
  return adminFetch<ContentBlockItem[]>(`/admin/pages/${pageId}/blocks`);
}

export function replacePageBlocks(
  pageId: string,
  blocks: ContentBlockItem[],
): Promise<ContentBlockItem[]> {
  return adminFetch<ContentBlockItem[]>(`/admin/pages/${pageId}/blocks`, {
    method: "PUT",
    body: JSON.stringify({ blocks }),
  });
}

// ── Blog ──────────────────────────────────────────────────────────────────────

export function listBlog(params?: {
  page?: number;
  size?: number;
  locale?: string;
  status?: string;
}): Promise<PagedResponse<BlogAdminItem>> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set("page", String(params.page));
  if (params?.size !== undefined) q.set("size", String(params.size));
  if (params?.locale) q.set("locale", params.locale);
  if (params?.status) q.set("status", params.status);
  return adminFetch<PagedResponse<BlogAdminItem>>(
    `/admin/blog?${q.toString()}`,
  );
}

export function getBlogPost(id: string): Promise<BlogAdminItem> {
  return adminFetch<BlogAdminItem>(`/admin/blog/${id}`);
}

export function createBlogPost(
  body: Partial<BlogAdminItem>,
): Promise<BlogAdminItem> {
  return adminFetch<BlogAdminItem>("/admin/blog", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateBlogPost(
  id: string,
  body: Partial<BlogAdminItem>,
): Promise<BlogAdminItem> {
  return adminFetch<BlogAdminItem>(`/admin/blog/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function patchBlogSeo(
  id: string,
  seo: SeoAdminFields,
): Promise<BlogAdminItem> {
  return adminFetch<BlogAdminItem>(`/admin/blog/${id}/seo`, {
    method: "PATCH",
    body: JSON.stringify(seo),
  });
}

export function deleteBlogPost(id: string): Promise<void> {
  return adminFetch<void>(`/admin/blog/${id}`, { method: "DELETE" });
}

export interface BlogHighlightAdminItem {
  id: string;
  slug: string;
  title: string;
  status: string;
}

export interface BlogHighlightsAdminResponse {
  locale: string;
  posts: BlogHighlightAdminItem[];
}

export function getBlogHighlightsAdmin(
  locale: string,
): Promise<BlogHighlightsAdminResponse> {
  return adminFetch<BlogHighlightsAdminResponse>(
    `/admin/blog/highlights?locale=${encodeURIComponent(locale)}`,
  );
}

export function updateBlogHighlightsAdmin(
  locale: string,
  postIds: string[],
): Promise<BlogHighlightsAdminResponse> {
  return adminFetch<BlogHighlightsAdminResponse>(
    `/admin/blog/highlights?locale=${encodeURIComponent(locale)}`,
    {
      method: "PUT",
      body: JSON.stringify({ postIds }),
    },
  );
}

// ── Products ──────────────────────────────────────────────────────────────────

export function listProducts(params?: {
  page?: number;
  size?: number;
  locale?: string;
  status?: string;
}): Promise<PagedResponse<ProductAdminItem>> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set("page", String(params.page));
  if (params?.size !== undefined) q.set("size", String(params.size));
  if (params?.locale) q.set("locale", params.locale);
  if (params?.status) q.set("status", params.status);
  return adminFetch<PagedResponse<ProductAdminItem>>(
    `/admin/products?${q.toString()}`,
  );
}

export function getProduct(id: string): Promise<ProductAdminItem> {
  return adminFetch<ProductAdminItem>(`/admin/products/${id}`);
}

export function createProduct(body: ProductAdminUpsertBody): Promise<ProductAdminItem> {
  return adminFetch<ProductAdminItem>("/admin/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateProduct(id: string, body: ProductAdminUpsertBody): Promise<ProductAdminItem> {
  return adminFetch<ProductAdminItem>(`/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function patchProductSeo(
  id: string,
  seo: SeoAdminFields,
): Promise<ProductAdminItem> {
  return adminFetch<ProductAdminItem>(`/admin/products/${id}/seo`, {
    method: "PATCH",
    body: JSON.stringify(seo),
  });
}

export function deleteProduct(id: string): Promise<void> {
  return adminFetch<void>(`/admin/products/${id}`, { method: "DELETE" });
}

// ── Resources ─────────────────────────────────────────────────────────────────

export function listResources(params?: {
  page?: number;
  size?: number;
  locale?: string;
  status?: string;
  resourceType?: string;
}): Promise<PagedResponse<ResourceAdminItem>> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set("page", String(params.page));
  if (params?.size !== undefined) q.set("size", String(params.size));
  if (params?.locale) q.set("locale", params.locale);
  if (params?.status) q.set("status", params.status);
  if (params?.resourceType) q.set("resourceType", params.resourceType);
  return adminFetch<PagedResponse<ResourceAdminItem>>(
    `/admin/resources?${q.toString()}`,
  );
}

export function getResource(id: string): Promise<ResourceAdminItem> {
  return adminFetch<ResourceAdminItem>(`/admin/resources/${id}`);
}

export function createResource(
  body: Partial<ResourceAdminItem>,
): Promise<ResourceAdminItem> {
  return adminFetch<ResourceAdminItem>("/admin/resources", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateResource(
  id: string,
  body: Partial<ResourceAdminItem>,
): Promise<ResourceAdminItem> {
  return adminFetch<ResourceAdminItem>(`/admin/resources/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function patchResourceSeo(
  id: string,
  seo: SeoAdminFields,
): Promise<ResourceAdminItem> {
  return adminFetch<ResourceAdminItem>(`/admin/resources/${id}/seo`, {
    method: "PATCH",
    body: JSON.stringify(seo),
  });
}

export function deleteResource(id: string): Promise<void> {
  return adminFetch<void>(`/admin/resources/${id}`, { method: "DELETE" });
}

// ── Media ─────────────────────────────────────────────────────────────────────

// ── Media upload ──────────────────────────────────────────────────────────────
// Uses a raw fetch (not adminFetch) because the Content-Type must be multipart/form-data
// with a browser-generated boundary — we must NOT set Content-Type manually here.

export function uploadMedia(file: File, altText?: string): Promise<MediaAdminItem> {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append("file", file);
  if (altText?.trim()) formData.append("altText", altText.trim());

  return fetch(`${getApiBaseUrl()}/admin/media/upload`, {
    method: "POST",
    // Only add Authorization — no Content-Type, the browser sets it with the boundary.
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (body?.message) message = body.message;
      } catch { /* ignore */ }
      forceAdminReLoginIfUnauthorized(res.status, "/admin/media/upload", "POST", Boolean(token));
      throw new AdminApiError(res.status, message);
    }
    return res.json() as Promise<MediaAdminItem>;
  });
}

// ── Media CRUD ────────────────────────────────────────────────────────────────

export function listMedia(params?: {
  page?: number;
  size?: number;
  mimeType?: string;
}): Promise<PagedResponse<MediaAdminItem>> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set("page", String(params.page));
  if (params?.size !== undefined) q.set("size", String(params.size));
  if (params?.mimeType) q.set("mimeType", params.mimeType);
  return adminFetch<PagedResponse<MediaAdminItem>>(
    `/admin/media?${q.toString()}`,
  );
}

export function getMediaAsset(id: string): Promise<MediaAdminItem> {
  return adminFetch<MediaAdminItem>(`/admin/media/${id}`);
}

export function registerMedia(body: {
  objectKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  altText?: string;
  width?: number;
  height?: number;
}): Promise<MediaAdminItem> {
  return adminFetch<MediaAdminItem>("/admin/media", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateMedia(
  id: string,
  body: { altText?: string; width?: number; height?: number },
): Promise<MediaAdminItem> {
  return adminFetch<MediaAdminItem>(`/admin/media/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteMedia(id: string): Promise<void> {
  return adminFetch<void>(`/admin/media/${id}`, { method: "DELETE" });
}

// ── Form Submissions ──────────────────────────────────────────────────────────

export function listFormSubmissions(params?: {
  page?: number;
  size?: number;
  formType?: string;
  status?: string;
}): Promise<PagedResponse<FormSubmissionAdminItem>> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set("page", String(params.page));
  if (params?.size !== undefined) q.set("size", String(params.size));
  if (params?.formType) q.set("formType", params.formType);
  if (params?.status) q.set("status", params.status);
  return adminFetch<PagedResponse<FormSubmissionAdminItem>>(
    `/admin/forms?${q.toString()}`,
  );
}

export function getFormSubmission(
  id: string,
): Promise<FormSubmissionAdminItem> {
  return adminFetch<FormSubmissionAdminItem>(`/admin/forms/${id}`);
}

/**
 * Fetches the CSV export with the current admin token and triggers a browser download.
 * Omit {@link formType} to include every submission.
 */
export async function downloadFormSubmissionsCsv(formType?: string): Promise<void> {
  const token = getStoredToken();
  const q = new URLSearchParams();
  if (formType) q.set("formType", formType);
  const query = q.toString();
  const path = `/admin/forms/export.csv${query ? `?${query}` : ""}`;

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    const text = await res.text();
    try {
      const body = JSON.parse(text) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      if (text) message = text.slice(0, 200);
    }
    forceAdminReLoginIfUnauthorized(res.status, path, "GET", Boolean(token));
    throw new AdminApiError(res.status, message);
  }

  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition");
  let filename = "submissions.csv";
  if (cd) {
    const m = /filename="([^"]+)"/.exec(cd);
    if (m) filename = m[1];
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Users ─────────────────────────────────────────────────────────────────────

/**
 * Lists users. The API currently returns a JSON array; if it is later switched to a Spring
 * {@code Page} object, both shapes are accepted here so callers always get {@link PagedResponse}.
 */
export async function listUsers(params?: {
  page?: number;
  size?: number;
}): Promise<PagedResponse<UserAdminItem>> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set("page", String(params.page));
  if (params?.size !== undefined) q.set("size", String(params.size));
  const raw = await adminFetch<unknown>(`/admin/users?${q.toString()}`);
  if (Array.isArray(raw)) {
    const content = raw as UserAdminItem[];
    return {
      content,
      totalElements: content.length,
      totalPages: 1,
      number: 0,
      size: content.length,
    };
  }
  const paged = raw as PagedResponse<UserAdminItem>;
  return {
    content: paged.content ?? [],
    totalElements: paged.totalElements ?? 0,
    totalPages: paged.totalPages ?? 0,
    number: paged.number ?? 0,
    size: paged.size ?? 0,
  };
}

export function createUser(body: {
  email: string;
  password: string;
  role: string;
}): Promise<UserAdminItem> {
  return adminFetch<UserAdminItem>("/admin/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateUserRole(
  id: string,
  role: string,
): Promise<UserAdminItem> {
  return adminFetch<UserAdminItem>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function deactivateUser(id: string): Promise<UserAdminItem> {
  return adminFetch<UserAdminItem>(`/admin/users/${id}/deactivate`, {
    method: "POST",
  });
}

// ── Publishing ────────────────────────────────────────────────────────────────
// The backend publishing endpoints are keyed by slug + locale (not by ID).
// The page ID is only used for preview token rotation.

export function publishContent(
  slug: string,
  locale: string,
): Promise<PublishStateResponse> {
  return adminFetch<PublishStateResponse>("/admin/publishing/publish", {
    method: "POST",
    body: JSON.stringify({ slug, locale }),
  });
}

export function scheduleContent(
  slug: string,
  locale: string,
  scheduledAt: string,
): Promise<PublishStateResponse> {
  return adminFetch<PublishStateResponse>("/admin/publishing/schedule", {
    method: "POST",
    body: JSON.stringify({ slug, locale, scheduledAt }),
  });
}

export function unpublishContent(
  slug: string,
  locale: string,
): Promise<PublishStateResponse> {
  return adminFetch<PublishStateResponse>("/admin/publishing/unpublish", {
    method: "POST",
    body: JSON.stringify({ slug, locale }),
  });
}

export function rotatePreviewToken(
  pageId: string,
): Promise<PreviewTokenResponse> {
  return adminFetch<PreviewTokenResponse>(
    `/admin/publishing/pages/${pageId}/preview-token`,
    { method: "POST" },
  );
}

// ── Redirects ─────────────────────────────────────────────────────────────────

export interface RedirectRuleItem {
  id: string;
  sourcePath: string;
  targetPath: string;
  statusCode: 301 | 302;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RedirectRuleWriteRequest {
  sourcePath: string;
  targetPath: string;
  statusCode: 301 | 302;
  active: boolean;
  notes?: string;
}

export function listRedirects(params?: {
  page?: number;
  size?: number;
}): Promise<PagedResponse<RedirectRuleItem>> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set("page", String(params.page));
  if (params?.size !== undefined) q.set("size", String(params.size));
  q.set("sort", "sourcePath");
  return adminFetch<PagedResponse<RedirectRuleItem>>(
    `/admin/redirects?${q.toString()}`,
  );
}

export function getRedirect(id: string): Promise<RedirectRuleItem> {
  return adminFetch<RedirectRuleItem>(`/admin/redirects/${id}`);
}

export function createRedirect(
  body: RedirectRuleWriteRequest,
): Promise<RedirectRuleItem> {
  return adminFetch<RedirectRuleItem>("/admin/redirects", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateRedirect(
  id: string,
  body: RedirectRuleWriteRequest,
): Promise<RedirectRuleItem> {
  return adminFetch<RedirectRuleItem>(`/admin/redirects/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function toggleRedirect(id: string): Promise<RedirectRuleItem> {
  return adminFetch<RedirectRuleItem>(`/admin/redirects/${id}/toggle`, {
    method: "PATCH",
  });
}

export function deleteRedirect(id: string): Promise<void> {
  return adminFetch<void>(`/admin/redirects/${id}`, { method: "DELETE" });
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export function listAuditLog(params?: {
  page?: number;
  size?: number;
  action?: string;
  actor?: string;
  targetId?: string;
}): Promise<PagedResponse<AuditLogItem>> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set("page", String(params.page));
  if (params?.size !== undefined) q.set("size", String(params.size));
  if (params?.action) q.set("action", params.action);
  if (params?.actor) q.set("actor", params.actor);
  if (params?.targetId) q.set("targetId", params.targetId);
  // Unique URL per request so intermediaries cannot return a cached page of audit rows.
  q.set("_", String(Date.now()));
  return adminFetch<PagedResponse<AuditLogItem>>(
    `/admin/audit?${q.toString()}`,
  );
}
