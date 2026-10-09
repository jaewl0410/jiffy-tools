import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const origin = "https://jiffy.tools";
const endpoint = "https://www.bing.com/indexnow";
const dryRun = process.argv.includes("--dry-run");
const all = process.argv.includes("--all");
const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const published = [...sitemap.matchAll(/<loc>(https:\/\/jiffy\.tools[^<]+)<\/loc>/g)].map(match => match[1]);
const publishedSet = new Set(published);

function changedPaths() {
  if (all) return published;
  try {
    const files = execFileSync("git", ["diff", "--name-only", "HEAD^", "--", "public"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return [...new Set(files.split(/\r?\n/).map(file => {
      if (file === "public/index.html") return `${origin}/`;
      const match = file.match(/^public\/(.+)\/index\.html$/);
      return match ? `${origin}/${match[1]}/` : null;
    }).filter(url => url && publishedSet.has(url)))];
  } catch {
    console.log("IndexNow: Git parent unavailable; using all published URLs.");
    return published;
  }
}

const urls = changedPaths();
if (!urls.length) {
  console.log("IndexNow: no added or changed public pages.");
  process.exit(0);
}
if (dryRun) {
  console.log(`IndexNow dry-run: ${urls.length} URL(s) would be submitted to ${endpoint}:`);
  console.log(urls.join("\n"));
  process.exit(0);
}

const key = process.env.INDEXNOW_KEY?.trim();
if (!key) {
  console.log("IndexNow: INDEXNOW_KEY is unset; skipping submission.");
  process.exit(0);
}
if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) {
  console.error("IndexNow: invalid INDEXNOW_KEY; skipping submission.");
  process.exit(0);
}

const keyLocation = `${origin}/indexnow-key.txt`;
try {
  let verified = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(keyLocation, { signal: AbortSignal.timeout(10000) });
    if (response.ok && (await response.text()).trim() === key) { verified = true; break; }
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 3000));
  }
  if (!verified) throw new Error("deployed key verification file is unavailable or does not match");
  for (let start = 0; start < urls.length; start += 10000) {
    const batch = urls.slice(start, start + 10000);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: "jiffy.tools", key, keyLocation, urlList: batch }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Bing returned HTTP ${response.status}`);
    console.log(`IndexNow: submitted ${batch.length} URL(s), HTTP ${response.status}.`);
  }
} catch (error) {
  // Search notification must not turn a successful site deployment into a failure.
  console.error(`IndexNow: submission skipped or failed: ${error.message}`);
}
