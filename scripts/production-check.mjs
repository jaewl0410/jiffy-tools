import assert from "node:assert/strict";
import { categories, tools } from "../src/registry.mjs";

const origin = "https://jiffy.tools";
const expected = ["/", ...categories.map(category => `/${category.slug}/`), ...tools.map(tool => `/tools/${tool.slug}/`)];
const get = (path, options) => fetch(new URL(path, origin), options);

const sitemapResponse = await get("/sitemap.xml");
assert.equal(sitemapResponse.status, 200, "sitemap HTTP status");
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>(https:\/\/jiffy\.tools[^<]+)<\/loc>/g)].map(match => match[1]);
assert.equal(urls.length, expected.length, "sitemap URL count");
assert.deepEqual(new Set(urls), new Set(expected.map(path => origin + path)), "sitemap URLs");

const robotsResponse = await get("/robots.txt");
assert.equal(robotsResponse.status, 200, "robots HTTP status");
const robots = await robotsResponse.text();
assert.match(robots, /Sitemap: https:\/\/jiffy\.tools\/sitemap\.xml/);
assert.doesNotMatch(robots, /Disallow: \/(?:\s|$)/);

for (let start = 0; start < expected.length; start += 8) {
  await Promise.all(expected.slice(start, start + 8).map(async path => {
    const response = await get(path);
    assert.equal(response.status, 200, `${path} HTTP status`);
    const html = await response.text();
    const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)].map(match => match[1]);
    assert.deepEqual(canonicals, [origin + path], `${path} canonical`);
    assert.doesNotMatch(html, /<meta name="robots" content="noindex/i, `${path} noindex`);
  }));
}

for (const asset of ["/assets/favicon.png", "/assets/og-image.png"]) {
  const response = await get(asset);
  assert.equal(response.status, 200, `${asset} HTTP status`);
  assert.match(response.headers.get("content-type") || "", /^image\/png/, `${asset} content type`);
}
const missing = await get("/this-page-does-not-exist/");
assert.equal(missing.status, 404, "missing page HTTP status");
const old = await get("/music/tap-bpm/", { redirect: "manual" });
assert.equal(old.status, 301, "old Tap BPM redirect");
assert.equal(old.headers.get("location"), "/tools/tap-bpm/");
const www = await fetch("https://www.jiffy.tools/", { redirect: "manual" });
assert.equal(www.status, 301, "www redirect");
assert.equal(www.headers.get("location"), origin + "/");
const http = await fetch("http://jiffy.tools/", { redirect: "manual" });
assert.equal(http.status, 301, "HTTP redirect");
assert.equal(http.headers.get("location"), origin + "/");

console.log(`Production QA passed: ${expected.length} public pages, sitemap, robots, canonical, assets, redirects, and 404.`);
