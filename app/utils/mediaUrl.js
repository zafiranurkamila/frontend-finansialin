const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  if (url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }

  if (/^https?:\/\//i.test(url)) {
    try {
      const incoming = new URL(url);
      const backend = new URL(BACKEND_URL);

      // If backend returned a storage URL from a different host/port (often APP_URL mismatch),
      // rewrite it to the active backend origin so the browser can fetch the file.
      if (incoming.pathname.startsWith("/storage/") && incoming.origin !== backend.origin) {
        return `${backend.origin}${incoming.pathname}${incoming.search}`;
      }
    } catch {
      // Keep original URL if parsing fails.
    }

    return url;
  }

  if (url.startsWith("/")) {
    return `${BACKEND_URL}${url}`;
  }

  return `${BACKEND_URL}/${url}`;
}
