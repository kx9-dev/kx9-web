import path from "node:path";

export function hostnameFromHeaders(headers) {
  // Only the exact configured app hostname changes the document root.
  const forwarded = String(headers["x-forwarded-host"] || "").split(",")[0].trim();
  const host = String(headers.host || "").trim();
  return (forwarded || host).split(":")[0].toLowerCase();
}

export function resolveSiteFile(root, hostname, requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://site.local").pathname);
  if (pathname.includes("\0") || pathname.includes("\\") ||
      pathname.split("/").some((segment) => segment.startsWith("."))) return null;
  const appHost = hostname === "app.kx9.tech";
  let relative = pathname.replace(/^\/+/, "");
  // The workspace's /app shortcut and the production app root must resolve to
  // the same existing document, including when the trailing slash is omitted.
  if (relative === "app") relative = appHost ? "index.html" : "app/index.html";
  // Old app links and /app/ previews remain valid on either hostname.
  if (appHost) relative = relative.replace(/^app\//, "").replace(/^app\.html$/, "index.html");
  if (!relative || relative.endsWith("/")) relative += "index.html";
  const docRoot = appHost ? path.join(root, "app") : root;
  const file = path.resolve(docRoot, relative);
  return file.startsWith(`${path.resolve(docRoot)}${path.sep}`) ? file : null;
}
