import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import {
  dirname,
  extname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";

const root = await realpath(
  resolve(dirname(fileURLToPath(import.meta.url)), ".."),
);
const port = Number(process.env.PORT || 5173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

// A loopback-only development server; production uses static hosting.
const server = createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  try {
    let pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (pathname.endsWith("/")) pathname += "index.html";
    if (pathname.split("/").some((part) => part.startsWith("."))) {
      response.writeHead(404).end("Not found");
      return;
    }
    const file = await realpath(resolve(root, "." + pathname));
    const location = relative(root, file);
    if (
      location.startsWith(".." + sep) ||
      location === ".." ||
      isAbsolute(location)
    ) {
      response.writeHead(404).end("Not found");
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) throw new Error("Not a file");
    const contents = await readFile(file);
    response.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
      "Content-Length": contents.length,
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : contents);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

server.on("error", (error) => {
  console.error(`Could not start ORBIT: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  console.log(`ORBIT 01 is ready at http://127.0.0.1:${port}`);
  console.log("Press Ctrl+C to stop.");
});
