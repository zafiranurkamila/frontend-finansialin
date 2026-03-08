const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  if (url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${BACKEND_URL}${url}`;
  }

  return `${BACKEND_URL}/${url}`;
}
