import { readFile, stat, readdir } from "node:fs/promises";
import { categories, tools } from "../src/registry.mjs";

const publicDir = new URL("../public/", import.meta.url);
const failures = [];
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
}

for (const url of urls) {
  const html = await read("." + url + "index.html");
  if (!html.includes(`<link rel="canonical" href="https://jiffy.tools${url}">`)) failures.push(`Bad canonical: ${url}`);
  if (!/<title>[^<]+<\/title>/.test(html)) failures.push(`Missing title: ${url}`);
  if (!/<meta name="description" content="[^"]+">/.test(html)) failures.push(`Missing description: ${url}`);
  for (const match of html.matchAll(/href="(\/[^"]*)"/g)) {
    const link = match[1];
    if (link === "/styles.css") continue;
    if (!urlSet.has(link) && !await exists(link)) failures.push(`Broken link ${url} → ${link}`);
  }
  for (const match of html.matchAll(/src="(\/[^"]*)"/g)) {
    if (!await exists(match[1])) failures.push(`Missing asset ${url} → ${match[1]}`);
  }
}
const sitemap = await read("./sitemap.xml");
const listed = [...sitemap.matchAll(/<loc>https:\/\/jiffy\.tools([^<]+)<\/loc>/g)].map(m => m[1]);
if (listed.length !== urls.length || listed.some(url => !urlSet.has(url))) failures.push("Sitemap does not match generated pages.");
const publicHtml = await htmlPaths();
const expectedHtml = urls.map(url => (url === "/" ? "" : url.slice(1)) + "index.html");
if (publicHtml.length !== expectedHtml.length || publicHtml.some(path => !expectedHtml.includes(path))) failures.push("Public HTML files do not match sitemap URLs.");
const redirects = await read("./_redirects");
if (!redirects.includes("/music/tap-bpm/ /tools/tap-bpm/ 301")) failures.push("Missing Tap BPM 301 redirect.");
const robots = await read("./robots.txt");
if (!robots.includes("Sitemap: https://jiffy.tools/sitemap.xml")) failures.push("Missing robots.txt sitemap reference.");
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log(`Checked ${urls.length} public pages, links, assets, metadata, sitemap, and redirect.`);
