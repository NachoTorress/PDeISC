import http from "node:http";
import https from "node:https";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Sirve exclusivamente la exportación local de Expo Web, incluidos sus recursos de Metro.
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist",
);
const port = Number(process.env.PORT ?? 5173);
const host = process.env.HOST ?? "127.0.0.1";
const api = new URL(process.env.API_PROXY_URL ?? "http://127.0.0.1:3001");
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT debe ser un puerto válido.");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
};
http
  .createServer(async (request, response) => {
    try {
      const address = new URL(request.url ?? "/", `http://${host}:${port}`);
      const pathname = decodeURIComponent(address.pathname);
      if (pathname.startsWith("/api/")) {
        const target = new URL(api);
        target.pathname = pathname;
        target.search = address.search;
        const upstream = (target.protocol === "https:" ? https : http).request(
          target,
          {
            method: request.method,
            headers: { ...request.headers, host: target.host },
          },
          (result) => {
            response.writeHead(result.statusCode ?? 502, result.headers);
            result.pipe(response);
          },
        );
        upstream.on("error", () => {
          if (!response.headersSent)
            response.writeHead(503, { "Content-Type": "application/json" });
          response.end(
            JSON.stringify({
              error: {
                message:
                  "La API local no está disponible. Iniciá el backend y reintentá.",
              },
            }),
          );
        });
        request.pipe(upstream);
        return;
      }
      let target = path.resolve(root, `.${pathname}`);
      if (target !== root && !target.startsWith(root + path.sep)) {
        response.writeHead(403);
        response.end();
        return;
      }
      try {
        if ((await stat(target)).isDirectory())
          target = path.join(target, "index.html");
      } catch {
        target = path.join(root, "index.html");
      }
      const content = await readFile(target);
      response.writeHead(200, {
        "Content-Type":
          mime[path.extname(target)] ?? "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      response.end(content);
    } catch {
      response.writeHead(404);
      response.end("Archivo no disponible.");
    }
  })
  .listen(port, host, () =>
    process.stdout.write(`ExpoTec · http://${host}:${port}\n`),
  );
