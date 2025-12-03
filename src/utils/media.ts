import api from "../../services/api";

const isAbsoluteUrl = (value?: string | null): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:");
};

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const getApiOrigin = (): string => {
  const base = (api.defaults.baseURL || "").trim();
  if (!base) return "";
  const normalized = base.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;
};

const normalizeUploadPath = (
  path: string,
  scope?: string
): string => {
  if (!path) return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (isAbsoluteUrl(trimmed)) return trimmed;
  if (trimmed.startsWith("/uploads/")) return trimmed;
  if (trimmed.startsWith("uploads/")) return `/${trimmed}`;

  const sanitizedScope = trimSlashes(scope || "");
  const sanitizedPath = trimmed.replace(/^\/+/, "");

  if (!sanitizedScope) {
    return sanitizedPath.startsWith("uploads/")
      ? `/${sanitizedPath}`
      : `/${sanitizedPath}`;
  }

  if (sanitizedPath.startsWith(`${sanitizedScope}/`)) {
    return `/uploads/${sanitizedPath}`;
  }

  return `/uploads/${sanitizedScope}/${sanitizedPath}`;
};

const buildUploadUrl = (
  path?: string | null,
  scope?: string,
  fallback = ""
): string => {
  if (!path) return fallback;
  const normalized = normalizeUploadPath(path, scope);
  if (!normalized) return fallback;
  if (isAbsoluteUrl(normalized)) return normalized;
  const origin = getApiOrigin();
  if (!origin) return normalized;
  const ensured = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${origin}${ensured}`;
};

export const getTourThumbnailUrl = (
  path?: string | null,
  fallback = ""
): string => {
  return buildUploadUrl(path, "tours/thumbnails", fallback);
};

export const getContentImageUrl = (path?: string | null): string => {
  return buildUploadUrl(path, "tours/content", "");
};

export const mapContentImages = (images?: (string | null)[]): string[] => {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => getContentImageUrl(img))
    .filter((url) => !!url);
};

export const normalizeHtmlImageSrc = (src?: string | null): string => {
  return getContentImageUrl(src);
};

