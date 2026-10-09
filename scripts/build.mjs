import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { categories, tools } from "../src/registry.mjs";

const root = new URL("../public/", import.meta.url);
const origin = "https://jiffy.tools";
const favicon = "/assets/favicon.png";
const ogImage = `${origin}/assets/og-image.png`;
const defaultLocale = "en";
const localeMetadata = {
  en: { siteName: "Jiffy", ogLocale: "en_US" },
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
const path = (...parts) => join(root.pathname.replace(/^\/(?:[A-Za-z]:)/, match => match.slice(1)), ...parts);
const link = tool => `<a class="tool-card" href="/tools/${tool.slug}/"><strong>${escape(tool.name)}</strong><span>${escape(tool.description)}</span></a>`;
const nav = `<nav class="site-nav" aria-label="Categories">${categories.map(c => `<a href="/${c.slug}/">${escape(c.name)}</a>`).join("")}</nav>`;

function page({ title, description, url, body, script = "", locale = defaultLocale }) {
  const site = localeMetadata[locale];
  if (!site) throw new Error(`Unsupported locale: ${locale}`);
  const canonicalUrl = `${origin}${url}`;
  return `<!doctype html>
<html lang="${escape(locale)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="icon" type="image/png" sizes="512x512" href="${favicon}">
  <link rel="apple-touch-icon" href="${favicon}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escape(site.siteName)}">
  <meta property="og:locale" content="${escape(site.ogLocale)}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${ogImage}">
  <link rel="stylesheet" href="/styles.css">
${script ? `  ${script}\n` : ""}
</head>
<body>
  <header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="Jiffy home">jiffy<span>.</span></a>${nav}</div></header>
  ${body}
  <footer class="site-footer"><div><a href="/">Jiffy</a><span>Fast, useful tools. Right in your browser.</span></div></footer>
</body>
</html>\n`;
}

function field([id, label, placeholder], type = "number") {
  return `<label class="field"><span>${escape(label)}</span><input id="${id}" type="${type}" ${type === "number" ? 'step="any" inputmode="decimal"' : ""} ${placeholder ? `${type === "number" ? "value" : "placeholder"}="${escape(placeholder)}"` : ""}></label>`;
}
function toolUI(tool) {
  const area = (id, placeholder) => `<label class="field"><span>${id === "input" ? "Input" : "Result"}</span><textarea id="${id}" ${id === "output" ? "readonly" : ""} placeholder="${escape(placeholder)}"></textarea></label>`;
  const button = (action, label, secondary = false) => `<button type="button" data-action="${action}" class="${secondary ? "secondary" : ""}">${label}</button>`;
  if (tool.engine === "tap") return `<div class="tap-ui"><output id="bpm" class="big-number">—</output><span class="unit">BPM</span><p id="tap-status" role="status">Tap the button or press Space to begin.</p><button id="tap-button" type="button" class="tap-button">TAP</button><button id="reset-button" type="button" class="secondary">Reset</button></div>`;
  if (tool.engine === "analyzer") return `${area("input", "Paste or type your text here…")}<div id="metrics" class="metrics" aria-live="polite"></div>`;
  if (tool.engine === "transform") {
    const actions = {
      "case-converter": [["upper","UPPERCASE"],["lower","lowercase"],["title","Title Case"],["sentence","Sentence case"]],
      "remove-line-breaks": [["join-space","Join with spaces"],["join-none","Join without spaces"]],
      "remove-extra-spaces": [["spaces","Remove extra spaces"]],
      "sort-lines": [["sort-az","A → Z"],["sort-za","Z → A"],["unique","Remove duplicates"]],
    }[tool.slug];
    return `${area("input", "Paste or type your text here…")}<div class="actions">${actions.map(a => button(...a)).join("")}${button("copy","Copy result",true)}</div><p id="status" role="status" class="status"></p>${area("output","Your result appears here…")}`;
  }
  if (tool.engine === "json") return `${area("input", "Paste JSON here…")}<div class="actions">${tool.slug === "json-formatter" ? button("format","Format") + button("minify","Minify") : button("validate","Validate")}${button("copy","Copy result",true)}</div><p id="status" role="status" class="status"></p>${area("output","Result appears here…")}`;
  if (tool.engine === "codec") return `${area("input", "Enter text here…")}<div class="actions">${button("encode","Encode")}${button("decode","Decode")}${button("copy","Copy result",true)}</div><p id="status" role="status" class="status"></p>${area("output","Result appears here…")}`;
  if (tool.engine === "generator") return `<div class="fields">${field(["count","Number of UUIDs (1–100)","1"])}</div><div class="actions">${button("generate","Generate UUIDs")}${button("copy","Copy result",true)}</div><p id="status" role="status" class="status"></p>${area("output","Generated IDs appear here…")}`;
  if (tool.engine === "timestamp") return `<div class="fields">${field(["timestamp","Unix timestamp (seconds or milliseconds)","1720000000"],"text")}${button("timestamp-to-date","Convert to date")}</div><div class="fields">${field(["datetime","Local date and time",""],"datetime-local")}${button("date-to-timestamp","Convert to Unix")}</div><div class="actions">${button("now","Use current time",true)}</div><p id="status" role="status" class="status"></p><output id="result" class="result"></output>`;
  if (tool.slug === "average-calculator") return `<label class="field"><span>Numbers</span><textarea id="numbers" placeholder="10, 20, 30"></textarea></label><div class="actions">${button("calculate","Calculate")}</div><output id="result" class="result" aria-live="polite"></output>`;
  const fields = tool.fields.map(f => field(f, tool.slug === "date-difference-calculator" ? "date" : "number")).join("");
  const extra = tool.slug === "delay-time-calculator" ? `<label class="field"><span>Note value</span><select id="note"><option value="1">Quarter note</option><option value="0.5">Eighth note</option><option value="0.25">Sixteenth note</option><option value="2">Half note</option><option value="4">Whole note</option></select></label><label class="field"><span>Feel</span><select id="feel"><option value="1">Straight</option><option value="1.5">Dotted</option><option value="0.6666666667">Triplet</option></select></label>` : "";
  return `<div class="fields">${fields}${extra}</div><div class="actions">${button("calculate","Calculate")}</div><output id="result" class="result" aria-live="polite"></output>`;
}

async function save(relative, content) {
  const file = path(...relative.split("/"));
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, content);
}

const grouped = category => tools.filter(t => t.category === category);
await save("index.html", page({
  title: "Jiffy — Quick Tools, No Fuss",
  description: "Free, quick text, developer, and calculator tools. Use them directly in your browser.",
  url: "/",
  body: `<main class="container"><section class="hero"><p class="eyebrow">FREE BROWSER TOOLS</p><h1>Quick tools. No fuss.</h1><p>Pick a task and get straight to it. No account, upload, or wait.</p></section>${categories.map(c => `<section class="listing"><div class="section-heading"><h2><a href="/${c.slug}/">${c.name}</a></h2><a href="/${c.slug}/">View all →</a></div><div class="tool-grid">${grouped(c.slug).slice(0, c.slug === "converters" ? 0 : 6).map(link).join("") || "<p>More tools are on the way.</p>"}</div></section>`).join("")}</main>`,
}));

for (const category of categories) {
  await save(`${category.slug}/index.html`, page({
    title: `${category.name} Tools | Jiffy`,
    description: category.description,
    url: `/${category.slug}/`,
    body: `<main class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span>${category.name}</nav><section class="page-intro"><h1>${category.name} tools</h1><p>${escape(category.description)}</p></section><div class="tool-grid">${grouped(category.slug).map(link).join("") || '<p>Converters are coming in Wave 2. Browse <a href="/calculators/">calculators</a> for now.</p>'}</div></main>`,
  }));
}

for (const tool of tools) {
  const category = categories.find(c => c.slug === tool.category);
  const related = tool.related.map(slug => tools.find(t => t.slug === slug)).filter(Boolean);
  await save(`tools/${tool.slug}/index.html`, page({
    title: tool.title, description: tool.meta, url: `/tools/${tool.slug}/`,
    script: '<script src="/tool.js" defer></script>',
    body: `<main class="container tool-page" data-tool="${tool.slug}"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="/${category.slug}/">${category.name}</a><span>›</span>${tool.name}</nav><section class="page-intro"><h1>${tool.name}</h1><p>${escape(tool.description)}</p></section><section class="tool-panel" aria-label="${escape(tool.name)} tool">${toolUI(tool)}</section><section class="info"><h2>How to use it</h2><p>${escape(tool.example)} Everything runs in your browser.</p></section><section class="listing"><h2>Related tools</h2><div class="tool-grid">${related.map(link).join("")}</div></section></main>`,
  }));
}

const urls = ["/", ...categories.map(c => `/${c.slug}/`), ...tools.map(t => `/tools/${t.slug}/`)];
await save("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${origin}${url}</loc></url>`).join("\n")}\n</urlset>\n`);
await save("_redirects", "/music/tap-bpm/ /tools/tap-bpm/ 301\n/music/tap-bpm /tools/tap-bpm/ 301\n/music/tap-bpm/index.html /tools/tap-bpm/ 301\n");
console.log(`Built ${tools.length} tools, ${categories.length} categories, and sitemap with ${urls.length} URLs.`);
