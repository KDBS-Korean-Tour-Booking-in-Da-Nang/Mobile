import api from "../../services/api";

const isAbsoluteUrl = (value?: string | null): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  // Check for http://, https://, or blob storage URLs
  return (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith("data:") ||
    trimmed.includes("blob.core.windows.net") ||
    trimmed.includes("amazonaws.com") ||
    trimmed.includes("googleapis.com")
  );
};

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const getApiOrigin = (): string => {
  const base = (api.defaults.baseURL || "").trim();
  if (!base) return "";
  const normalized = base.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;
};

const normalizeUploadPath = (path: string, scope?: string): string => {
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

  const trimmedPath = path.trim();
  if (!trimmedPath) return fallback;

  // Check if path is already a full URL (http/https/blob storage) before processing
  if (isAbsoluteUrl(trimmedPath)) {
    console.log("[buildUploadUrl] Already absolute URL (returning as-is):", {
      original: path,
      trimmed: trimmedPath,
      scope,
    });
    return trimmedPath;
  }

  // Remove leading slash if path starts with http/https (edge case: /https://...)
  const cleanedPath = trimmedPath.replace(/^\/+(https?:\/\/)/i, "$1");
  if (isAbsoluteUrl(cleanedPath)) {
    console.log("[buildUploadUrl] Cleaned absolute URL:", {
      original: path,
      trimmed: trimmedPath,
      cleaned: cleanedPath,
      scope,
    });
    return cleanedPath;
  }

  const normalized = normalizeUploadPath(cleanedPath, scope);
  if (!normalized) return fallback;
  if (isAbsoluteUrl(normalized)) {
    console.log("[buildUploadUrl] Normalized to absolute URL:", {
      original: path,
      normalized,
      scope,
    });
    return normalized;
  }
  const origin = getApiOrigin();
  if (!origin) return normalized;
  const ensured = normalized.startsWith("/") ? normalized : `/${normalized}`;
  const finalUrl = `${origin}${ensured}`;
  console.log("[buildUploadUrl] Built URL:", {
    original: path,
    trimmed: trimmedPath,
    cleaned: cleanedPath,
    normalized,
    origin,
    final: finalUrl,
    scope,
  });
  return finalUrl;
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
  return images.map((img) => getContentImageUrl(img)).filter((url) => !!url);
};

export const normalizeHtmlImageSrc = (src?: string | null): string => {
  console.log("[normalizeHtmlImageSrc] Input src:", src);
  const result = getContentImageUrl(src);
  console.log("[normalizeHtmlImageSrc] Output URL:", result);
  return result;
};
