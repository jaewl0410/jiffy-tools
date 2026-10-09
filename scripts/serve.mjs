import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const root = resolve(new URL("../public/", import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, value => value.slice(1)));
const mime = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".xml":"application/xml; charset=utf-8", ".txt":"text/plain; charset=utf-8" };
createServer(async (request, response) => {
  let url;
  try { url = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
  catch { response.writeHead(400).end("Bad request"); return; }
  const file = resolve(root, "." + url, url.endsWith("/") ? "index.html" : "");
  if (file !== root && !file.startsWith(root + sep)) { response.writeHead(403).end("Forbidden"); return; }
  try {
    const body = await readFile(file);
    response.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" }).end(body);
  } catch { response.writeHead(404).end("Not found"); }
}).listen(8765, "127.0.0.1", () => console.log("Preview: http://127.0.0.1:8765/"));
