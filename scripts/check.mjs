import { readFile, stat, readdir } from "node:fs/promises";
import { categories, tools } from "../src/registry.mjs";
import { quantities } from "../src/converters.mjs";

const publicDir = new URL("../public/", import.meta.url);
const failures = [];
const favicon = "/assets/favicon.png";
const ogImage = "https://jiffy.tools/assets/og-image.png";
const urls = ["/", ...categories.map(c => `/${c.slug}/`), ...tools.map(t => `/tools/${t.slug}/`)];
const urlSet = new Set(urls);
const read = relative => readFile(new URL(relative, publicDir), "utf8");
const exists = async url => {
  const relative = url.endsWith("/") ? url + "index.html" : url;
  try { await stat(new URL("." + relative, publicDir)); return true; } catch { return false; }
};
async function htmlPaths(dir = publicDir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    if (entry.isDirectory()) paths.push(...await htmlPaths(new URL(entry.name + "/", dir), prefix + entry.name + "/"));
    else if (entry.name.endsWith(".html")) paths.push(prefix + entry.name);
  }
  return paths;
}
if (new Set(tools.map(t => t.slug)).size !== tools.length) failures.push("Duplicate tool slug.");
for (const tool of tools) {
  if (!categories.some(c => c.slug === tool.category)) failures.push(`Unknown category: ${tool.slug}`);
  for (const related of tool.related) if (!tools.some(t => t.slug === related)) failures.push(`Unknown related tool: ${tool.slug} → ${related}`);
  if (tool.category === "converters") {
    if (!quantities[tool.quantity]) failures.push(`Unknown converter quantity: ${tool.slug}`);
    if (!tool.units.includes(tool.from) || !tool.units.includes(tool.to)) failures.push(`Bad converter defaults: ${tool.slug}`);
    if (tool.engine === "pair-converter" && !tools.some(t => t.engine === "pair-converter" && t.quantity === tool.quantity && t.from === tool.to && t.to === tool.from)) failures.push(`Missing inverse pair: ${tool.slug}`);
  }
}

for (const url of urls) {
  const html = await read("." + url + "index.html");
  if (!html.includes(`<link rel="canonical" href="https://jiffy.tools${url}">`)) failures.push(`Bad canonical: ${url}`);
  if ((html.match(/<link rel="canonical"/g) || []).length !== 1) failures.push(`Duplicate canonical: ${url}`);
  if (/hreflang=/i.test(html)) failures.push(`Unexpected hreflang: ${url}`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
  if (!title) failures.push(`Missing title: ${url}`);
  if (!description) failures.push(`Missing description: ${url}`);
  const expected = [
    `<html lang="en">`,
    `<link rel="icon" type="image/png" sizes="512x512" href="${favicon}">`,
    `<link rel="apple-touch-icon" href="${favicon}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Jiffy">`,
    `<meta property="og:locale" content="en_US">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="https://jiffy.tools${url}">`,
    `<meta property="og:image" content="${ogImage}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${ogImage}">`,
  ];
  for (const tag of expected) if (!html.includes(tag)) failures.push(`Missing or incorrect metadata ${url}: ${tag}`);
  for (const match of html.matchAll(/href="(\/[^"]*)"/g)) {
    const link = match[1];
    if (link === "/styles.css") continue;
    if (!urlSet.has(link) && !await exists(link)) failures.push(`Broken link ${url} → ${link}`);
  }
  for (const match of html.matchAll(/src="(\/[^"]*)"/g)) {
    if (!await exists(match[1])) failures.push(`Missing asset ${url} → ${match[1]}`);
  }
  if (url.startsWith("/tools/")) {
    const tool = tools.find(t => url === `/tools/${t.slug}/`);
    if (tool.category === "converters") {
      if (!html.includes(`data-quantity="${tool.quantity}"`) || !html.includes('id="converter-value"')) failures.push(`Missing converter UI: ${url}`);
      if (tool.engine === "pair-converter" && (!html.includes("Conversion formula") || !html.includes("Reverse:"))) failures.push(`Missing pair content: ${url}`);
    }
  }
}
if (!await exists(new URL(ogImage).pathname)) failures.push(`Missing OG asset: ${ogImage}`);
for (const [asset, width, height] of [[favicon, 512, 512], [new URL(ogImage).pathname, 1200, 629]]) {
  const png = await readFile(new URL("." + asset, publicDir));
  if (png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || png.readUInt32BE(16) !== width || png.readUInt32BE(20) !== height) failures.push(`Unexpected PNG dimensions: ${asset}`);
}
const sitemap = await read("./sitemap.xml");
const listed = [...sitemap.matchAll(/<loc>https:\/\/jiffy\.tools([^<]+)<\/loc>/g)].map(m => m[1]);
if (listed.length !== urls.length || listed.some(url => !urlSet.has(url))) failures.push("Sitemap does not match generated pages.");
if (new Set(listed).size !== listed.length) failures.push("Duplicate sitemap URL.");
const publicHtml = await htmlPaths();
const expectedHtml = urls.map(url => (url === "/" ? "" : url.slice(1)) + "index.html");
if (publicHtml.length !== expectedHtml.length || publicHtml.some(path => !expectedHtml.includes(path))) failures.push("Public HTML files do not match sitemap URLs.");
const redirects = await read("./_redirects");
if (!redirects.includes("/music/tap-bpm/ /tools/tap-bpm/ 301")) failures.push("Missing Tap BPM 301 redirect.");
const robots = await read("./robots.txt");
if (!robots.includes("Sitemap: https://jiffy.tools/sitemap.xml")) failures.push("Missing robots.txt sitemap reference.");
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log(`Checked ${urls.length} public pages, links, assets, metadata, sitemap, and redirect.`);
