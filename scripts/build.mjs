import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { categories, tools } from "../src/registry.mjs";
import { quantities, getUnit, convert, formatNumber } from "../src/converters.mjs";

const root = new URL("../public/", import.meta.url);
const origin = "https://jiffy.tools";
const favicon = "/assets/favicon.png";
const ogImage = `${origin}/assets/og-image.png`;
const defaultLocale = "en";
const analyticsId = process.env.GA_MEASUREMENT_ID?.trim() || "";
const adsenseAccount = "ca-pub-9911934236841379";
if (analyticsId && !/^G-[A-Z0-9]+$/.test(analyticsId)) throw new Error("GA_MEASUREMENT_ID must be a GA4 web measurement ID (G-...).");
const localeMetadata = {
  en: { siteName: "Jiffy", ogLocale: "en_US" },
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
const path = (...parts) => join(root.pathname.replace(/^\/(?:[A-Za-z]:)/, match => match.slice(1)), ...parts);
const link = tool => `<a class="tool-card" href="/tools/${tool.slug}/"><strong>${escape(tool.name)}</strong><span>${escape(tool.description)}</span></a>`;
const nav = `<nav class="site-nav" aria-label="Categories">${categories.map(c => `<a href="/${c.slug}/">${escape(c.name)}</a>`).join("")}</nav>`;
const trustPages = [
  { slug: "about", title: "About Jiffy", description: "Learn about Jiffy's free browser tools and how they work.", body: `<h1>About Jiffy</h1><p>Jiffy is a collection of free tools for everyday conversions, calculations, text, and images. There is no account to create.</p><p>We aim to process tool inputs locally in your browser whenever possible. Image tools on this site do not upload your files. If a future tool needs a server upload, we will explain that on its page before you use it.</p>` },
  { slug: "privacy", title: "Privacy Policy", description: "How Jiffy handles tool inputs, hosting data, analytics, and cookies.", body: `<h1>Privacy Policy</h1><p>Jiffy does not require an account. The current tools run in your browser; image files and other tool inputs are not sent to Jiffy for processing. A future tool that needs an upload will say so on its page.</p><h2>Hosting and analytics</h2><p>Cloudflare hosts this site and may process basic request information, such as IP address, browser details, and pages requested, to serve and protect it. ${analyticsId ? "We use Google Analytics 4 to measure page views and tool usage. Our custom events contain only a tool identifier, category, and page path; we do not send tool inputs, results, file names, or file contents as event parameters. Google may process request information, including IP address and browser details, when these events are sent. We configure Google Analytics to deny analytics and advertising cookie storage. <a href=\"https://policies.google.com/technologies/partner-sites\">Learn how Google uses information from sites that use its services</a>." : "Usage analytics are not active because no measurement ID is configured. The site code does not load a separate analytics service or set analytics or advertising cookies."}</p><h2>Advertising and cookies</h2><p>We intend to use Google AdSense, but Jiffy does not currently display ads. If advertising is enabled, Google and its partners may use cookies or similar technologies for ad delivery and measurement. Before ads are shown, we will update this policy with the active advertising practices and provide any required consent choices.</p><h2>Contact</h2><p>For questions about this policy, see our <a href="/contact/">contact page</a>.</p>` },
  { slug: "contact", title: "Contact Jiffy", description: "Send feedback or report an issue with a Jiffy tool.", body: `<h1>Contact Jiffy</h1><p>For tool feedback, bug reports, or questions about Jiffy, open a <a href="https://github.com/jaewl0410/jiffy-tools/issues/new">GitHub issue</a>. This is a public contact channel. Do not include personal information, private files, or sensitive tool inputs.</p>` },
  { slug: "terms", title: "Terms of Use", description: "Simple terms for using Jiffy's free browser tools.", body: `<h1>Terms of Use</h1><p>Jiffy offers free utility tools as they are. We try to keep them accurate and available, but provide no warranty and cannot guarantee that every result is suitable for your purpose. Check important results before relying on them.</p><p>You are responsible for the files and information you use with the tools. Do not use this site to break laws, interfere with the service, or harm others.</p><p>Links to third-party sites are provided for convenience; we do not control their content. Advertising may appear in the future. We may change the tools and these terms as the site develops.</p>` },
];
const footerLinks = trustPages.map(item => `<a href="/${item.slug}/">${item.title === "Privacy Policy" ? "Privacy" : item.title === "Terms of Use" ? "Terms" : item.title.replace(" Jiffy", "")}</a>`).join("");

const absolute = url => `${origin}${url}`;
const breadcrumb = items => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, url], index) => ({
    "@type": "ListItem", position: index + 1, name, item: absolute(url),
  })),
});
const schemaScript = nodes => nodes.length
  ? `  <script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replaceAll("<", "\\u003c")}</script>\n`
  : "";

function page({ title, description, url, body, script = "", schema = [], locale = defaultLocale }) {
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
  <meta name="google-adsense-account" content="${adsenseAccount}">
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
${schemaScript(schema)}  <script src="/analytics.js" defer${analyticsId ? ` data-measurement-id="${analyticsId}"` : ""}></script>
${script ? `  ${script}\n` : ""}
</head>
<body>
  <header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="Jiffy home">jiffy<span>.</span></a>${nav}</div></header>
  ${body}
  <footer class="site-footer"><div><div class="footer-brand"><a href="/">Jiffy</a><span>Fast, useful tools. Right in your browser.</span></div><nav aria-label="Site information">${footerLinks}</nav></div></footer>
</body>
</html>\n`;
}

function field([id, label, placeholder], type = "number") {
  return `<label class="field"><span>${escape(label)}</span><input id="${id}" type="${type}" ${type === "number" ? 'step="any" inputmode="decimal"' : ""} ${placeholder ? `${type === "number" ? "value" : "placeholder"}="${escape(placeholder)}"` : ""}></label>`;
}
function toolUI(tool) {
  if (tool.engine === "image") {
    const select = (id, label, options) => `<label class="field"><span>${label}</span><select id="${id}">${options.map(([value, text]) => `<option value="${value}">${text}</option>`).join("")}</select></label>`;
    const number = (id, label, value) => `<label class="field"><span>${label}</span><input id="${id}" type="number" min="${id === "crop-x" || id === "crop-y" ? 0 : 1}" step="1" value="${value}" inputmode="numeric"></label>`;
    const file = tool.mode === "decode" ? "" : `<label class="field"><span>Choose image (up to 20 MB)</span><input id="image-file" type="file" accept="${tool.input ? `image/${tool.input}` : "image/png,image/jpeg,image/webp"}"></label>`;
    const options = tool.mode === "resize" ? `<div class="fields">${number("width","Width (px)",1)}${number("height","Height (px)",1)}</div><label class="check-field"><input id="keep-ratio" type="checkbox" checked> Keep aspect ratio</label>`
      : tool.mode === "rotate" ? select("rotation", "Rotate clockwise", [["90","90°"],["180","180°"],["270","270°"]])
      : tool.mode === "flip" ? select("direction", "Flip direction", [["horizontal","Horizontal"],["vertical","Vertical"]])
      : tool.mode === "crop" ? `<p class="field-hint">Enter the crop area in pixels from the top-left corner.</p><div class="fields">${number("crop-x","Left (px)",0)}${number("crop-y","Top (px)",0)}${number("crop-width","Width (px)",1)}${number("crop-height","Height (px)",1)}</div>`
      : tool.mode === "encode" ? select("base64-kind", "Text format", [["data-url","Data URL (includes image type)"],["raw","Raw Base64 (no image type)"]])
      : tool.mode === "decode" ? `<label class="field"><span>Data URL or raw Base64</span><textarea id="base64-input" placeholder="Paste a data:image/...;base64,... URL or raw Base64"></textarea></label><p class="field-hint">Raw Base64 is detected from the image bytes. PNG, JPG, and WebP are supported.</p>`
      : tool.output === "jpeg" || tool.output === "webp" ? `<label class="field"><span>Quality: <output id="quality-value">90%</output></span><input id="quality" type="range" min="10" max="100" value="90"></label>` : "";
    const outputNote = ["resize", "rotate", "flip", "crop"].includes(tool.mode) ? `<p class="field-hint">The edited image downloads as PNG to preserve transparency.</p>` : "";
    return `<div class="image-ui" data-mode="${tool.mode}" data-input="${tool.input || ""}" data-output="${tool.output || ""}"><p class="local-note">Your file stays in this browser. No upload.</p>${file}${options}${outputNote}<div class="actions"><button id="image-run" type="button">${tool.mode === "decode" ? "Decode image" : tool.mode === "encode" ? "Convert to Base64" : "Process image"}</button><a id="image-download" class="button-link secondary" hidden>Download result</a></div><p id="image-status" class="status" role="status" aria-live="polite"></p><div id="image-result" class="image-result" hidden><p id="image-details"></p><img id="image-preview" alt="Result preview"><label id="base64-output-wrap" class="field" hidden><span>Base64 result</span><textarea id="base64-output" readonly></textarea></label></div></div>`;
  }
  if (tool.engine === "unit-converter" || tool.engine === "pair-converter") {
    const pair = tool.engine === "pair-converter";
    const options = selected => quantities[tool.quantity].units.map(unit => `<option value="${unit.id}"${unit.id === selected ? " selected" : ""}>${escape(unit.label)} (${escape(unit.symbol)})</option>`).join("");
    return `<div class="converter-ui" data-quantity="${escape(tool.quantity)}" data-from="${escape(tool.from)}" data-to="${escape(tool.to)}" data-precision="${tool.precision}"><div class="fields"><label class="field"><span>Value</span><input id="converter-value" type="text" inputmode="decimal" value="1" autocomplete="off" aria-describedby="converter-status"></label>${pair
      ? `<div class="converter-pair-units"><span>${escape(getUnit(tool.quantity, tool.from).label)} (${escape(getUnit(tool.quantity, tool.from).symbol)})</span><span aria-hidden="true">→</span><span>${escape(getUnit(tool.quantity, tool.to).label)} (${escape(getUnit(tool.quantity, tool.to).symbol)})</span></div>`
      : `<label class="field"><span>From</span><select id="converter-from">${options(tool.from)}</select></label><button id="converter-swap" type="button" class="secondary" aria-label="Swap units">Swap ↔</button><label class="field"><span>To</span><select id="converter-to">${options(tool.to)}</select></label>`}</div><output id="converter-result" class="result converter-result" aria-live="polite"></output><p id="converter-status" class="status" role="status"></p><button id="converter-copy" type="button" class="secondary">Copy result</button></div>`;
  }
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
const popular = tools.filter(tool => tool.featuredRank >= 0).sort((a, b) => a.featuredRank - b.featuredRank);
const searchIndex = tools.map(tool => ({
  name: tool.name,
  description: tool.description,
  url: `/tools/${tool.slug}/`,
  category: categories.find(category => category.slug === tool.category).name,
  keywords: [tool.slug.replaceAll("-", " "), tool.quantity, ...(tool.units || [])].filter(Boolean).join(" "),
}));
const converterGroups = Object.keys(quantities).map(quantity => ({ quantity, tools: tools.filter(t => t.category === "converters" && t.quantity === quantity) }));
const converterNote = quantity => quantity === "data-storage"
  ? "Decimal units use SI: 1 KB = 1,000 B, 1 MB = 1,000,000 B. Binary units use IEC: 1 KiB = 1,024 B, 1 MiB = 1,048,576 B."
  : quantity === "volume" ? "Gallons, fluid ounces, cups, and pints here use US customary units."
  : quantity === "temperature" ? "Temperature conversion includes an offset. Values below absolute zero are not valid."
  : quantity === "frequency" ? "RPM means cycles or revolutions per minute; 60 RPM equals 1 Hz."
  : "";
const practicalValues = {
  "minutes-to-hours": { heading: "Common minute values in decimal hours", intro: "Use decimal hours for timesheets and calculations. Twenty minutes is one third of an hour.", values: [15, 20, 30, 45, 60, 90, 120] },
  "kb-to-mb": { heading: "Common file sizes in MB", intro: "These values use 1 MB = 1,000 KB, so 500 KB is half a decimal megabyte.", values: [100, 250, 500, 750, 1000, 2000, 5000] },
  "mb-to-gb": { heading: "Common storage sizes in GB", intro: "Compare downloads and storage amounts labeled with decimal MB and GB.", values: [100, 250, 500, 750, 1000, 2000, 5000] },
  "gb-to-mb": { heading: "Common storage sizes in MB", intro: "One decimal gigabyte is 1,000 megabytes; these rows show larger storage sizes.", values: [0.5, 1, 2, 5, 10, 50, 100] },
  "inches-to-cm": { heading: "Common lengths in centimeters", intro: "Compare familiar inch measurements using the exact factor 1 inch = 2.54 cm.", values: [1, 2, 4, 6, 8, 10, 12] },
  "km-to-miles": { heading: "Common distances in miles", intro: "Check short trips and race distances; 5 km is about 3.11 miles.", values: [1, 2, 5, 10, 21.0975, 42.195] },
  "celsius-to-fahrenheit": { heading: "Familiar temperatures in Fahrenheit", intro: "Reference points cover freezing, room temperature, hot weather, and boiling water at standard pressure.", values: [0, 10, 20, 25, 30, 37, 100] },
  "fahrenheit-to-celsius": { heading: "Familiar temperatures in Celsius", intro: "Compare freezing weather, indoor temperatures, body temperature, and a hot day.", values: [0, 32, 50, 68, 72, 98.6, 100] },
};
function converterInfo(tool) {
  const source = getUnit(tool.quantity, tool.from), target = getUnit(tool.quantity, tool.to);
  const pair = tool.engine === "pair-converter";
  const formula = tool.quantity === "temperature"
    ? ({ "c-f": "°F = (°C × 9/5) + 32", "f-c": "°C = (°F − 32) × 5/9", "c-k": "K = °C + 273.15", "k-c": "°C = K − 273.15" })[`${tool.from}-${tool.to}`] || "Choose two temperature units to convert."
    : `Multiply ${source.symbol} by ${formatNumber(convert(tool.quantity, tool.from, tool.to, 1), 12)} to get ${target.symbol}.`;
  const generalText = `Choose any two ${quantities[tool.quantity].name.toLowerCase()} units. The result updates as you type, and Swap reverses the direction.`;
  const table = practicalValues[tool.slug];
  const dataNote = pair && tool.quantity === "data-storage" ? `<p>These pair results use decimal KB, MB, and GB (1,000 per step). For 1,024-based units, choose KiB, MiB, or GiB in the <a href="/tools/data-storage-converter/">Data Storage Converter</a>.</p>` : "";
  return `<section class="info"><h2>${pair ? "Conversion formula" : "How to use it"}</h2><p>${escape(pair ? formula : generalText)}</p>${converterNote(tool.quantity) ? `<p>${escape(converterNote(tool.quantity))}</p>` : ""}${dataNote}${table ? `<h2>${escape(table.heading)}</h2><p>${escape(table.intro)}</p><div class="table-scroll"><table class="conversion-table"><thead><tr><th scope="col">${escape(source.label)} (${escape(source.symbol)})</th><th scope="col">${escape(target.label)} (${escape(target.symbol)})</th></tr></thead><tbody>${table.values.map(value => `<tr><td>${escape(formatNumber(value))}</td><td>${escape(formatNumber(convert(tool.quantity, tool.from, tool.to, value), 8))}</td></tr>`).join("")}</tbody></table></div>` : `<h2>Examples</h2><ul class="example-list">${tool.examples.map(example => `<li>${escape(example)}</li>`).join("")}</ul>`}</section>`;
}
await save("index.html", page({
  title: "Jiffy — Quick Tools, No Fuss",
  description: "Free, quick converters, text, developer, and calculator tools. Use them directly in your browser.",
  url: "/",
  schema: [
    { "@type": "WebSite", "@id": `${origin}/#website`, name: "Jiffy", alternateName: ["Jiffy Tools", "jiffy.tools"], url: `${origin}/`, publisher: { "@id": `${origin}/#publisher` } },
    { "@type": "Organization", "@id": `${origin}/#publisher`, name: "Jiffy", url: `${origin}/`, logo: `${origin}${favicon}` },
  ],
  script: '<script src="/search.js" defer></script>',
  body: `<main class="container"><section class="hero"><p class="eyebrow">FREE BROWSER TOOLS</p><h1>Quick tools. No fuss.</h1><p>Jiffy Tools helps you convert, calculate, and clean up text right in your browser.</p><div class="search-wrap"><label for="tool-search">Find a tool</label><input id="tool-search" type="search" placeholder="Try “cm to inches” or “JSON”" autocomplete="off" aria-controls="search-results"><p id="search-status" class="search-status" role="status" aria-live="polite"></p><div id="search-results" class="search-results" hidden></div></div></section><section class="listing home-categories"><h2>Browse by category</h2><div class="category-grid">${categories.map(c => `<a class="category-card" href="/${c.slug}/"><strong>${escape(c.name)}</strong><span>${grouped(c.slug).length} tools</span><small>${escape(c.description)}</small></a>`).join("")}</div></section><section class="listing"><div class="section-heading"><h2>Popular tools</h2><a href="/converters/">All converters →</a></div><div class="tool-grid">${popular.map(link).join("")}</div></section><script id="search-index" type="application/json">${JSON.stringify(searchIndex).replaceAll("<", "\\u003c")}</script></main>`,
}));

for (const category of categories) {
  await save(`${category.slug}/index.html`, page({
    title: `${category.name} Tools | Jiffy`,
    description: category.description,
    url: `/${category.slug}/`,
    schema: [breadcrumb([["Home", "/"], [category.name, `/${category.slug}/`]])],
    body: `<main class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span>${category.name}</nav><section class="page-intro"><h1>${category.slug === "converters" ? "Converters" : `${category.name} tools`}</h1><p>${escape(category.description)}</p></section>${category.slug === "converters" ? `<nav class="quantity-nav" aria-label="Converter types">${converterGroups.map(group => `<a href="#${group.quantity}">${escape(quantities[group.quantity].name)}</a>`).join("")}</nav>${converterGroups.map(group => `<section class="listing quantity-section" id="${group.quantity}"><div class="section-heading"><h2>${escape(quantities[group.quantity].name)}</h2><span>${group.tools.length} tools</span></div><div class="tool-grid">${group.tools.map(link).join("")}</div></section>`).join("")}` : `<div class="tool-grid">${grouped(category.slug).map(link).join("")}</div>`}</main>`,
  }));
}

function toolGuidance(tool) {
  const guidance = {
    "date-difference-calculator": "This counts calendar day boundaries between the dates, without including the start date. For example, October 1 to October 2 is 1 day; counting both dates inclusively would be 2 days. Reversing the dates shows the same magnitude and an end-before-start note.",
    "percentage-change-calculator": "For a positive original value, percentage change = (new − old) / old × 100. For example, 80 to 100 is a 25% increase. The calculator uses the absolute original value as the denominator, including when the original is negative; an original value of zero is undefined.",
    "tap-bpm": "Two taps give a first estimate. Tap at least four times for an average over three intervals; the tool keeps up to eight recent intervals and resets after a pause of 5 seconds.",
    "png-to-jpg": "JPG does not support transparency. Transparent PNG areas are filled white before export; adjust quality, then download the result.",
  };
  return guidance[tool.slug] ? `<p>${escape(guidance[tool.slug])}</p>` : "";
}

for (const tool of tools) {
  const category = categories.find(c => c.slug === tool.category);
  const relatedCandidates = [
    ...tool.related.map(slug => tools.find(t => t.slug === slug)),
    ...tools.filter(candidate => candidate.slug !== tool.slug && candidate.category === tool.category && candidate.quantity === tool.quantity),
    ...tools.filter(candidate => candidate.slug !== tool.slug && candidate.category === tool.category),
  ];
  const related = [...new Map(relatedCandidates.filter(Boolean).map(candidate => [candidate.slug, candidate])).values()].slice(0, 6);
  const inverse = tool.engine === "pair-converter" ? tools.find(t => t.engine === "pair-converter" && t.quantity === tool.quantity && t.from === tool.to && t.to === tool.from) : null;
  await save(`tools/${tool.slug}/index.html`, page({
    title: tool.title, description: tool.meta, url: `/tools/${tool.slug}/`,
    schema: [
      breadcrumb([["Home", "/"], [category.name, `/${category.slug}/`], [tool.name, `/tools/${tool.slug}/`]]),
      {
        "@type": "WebApplication",
        name: tool.name,
        url: absolute(`/tools/${tool.slug}/`),
        description: tool.meta,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires a modern web browser",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ],
    script: tool.category === "converters" ? '<script type="module" src="/converter.js"></script>' : tool.engine === "image" ? '<script type="module" src="/image.js"></script>' : '<script src="/tool.js" defer></script>',
    body: `<main class="container tool-page" data-tool="${tool.slug}" data-category="${tool.category}"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="/${category.slug}/">${category.name}</a><span>›</span>${escape(tool.name)}</nav><section class="page-intro"><h1>${escape(tool.name)}</h1><p>${escape(tool.description)}</p></section><section class="tool-panel" aria-label="${escape(tool.name)} tool">${toolUI(tool)}</section>${tool.category === "converters" ? converterInfo(tool) : `<section class="info"><h2>How to use it</h2><p>${escape(tool.example)} Everything runs in your browser.</p>${toolGuidance(tool)}</section>`}${tool.engine === "pair-converter" ? `<p class="converter-links"><a href="/tools/${inverse.slug}/">Reverse: ${escape(inverse.name)}</a><span>·</span><a href="/tools/${tool.quantity}-converter/">All ${escape(quantities[tool.quantity].name.toLowerCase())} units</a></p>` : ""}<section class="listing"><h2>Related tools</h2><div class="tool-grid">${related.map(link).join("")}</div></section></main>`,
  }));
}

for (const item of trustPages) await save(`${item.slug}/index.html`, page({
  title: `${item.title} | Jiffy`, description: item.description, url: `/${item.slug}/`,
  schema: [
    { "@type": item.slug === "about" ? "AboutPage" : item.slug === "contact" ? "ContactPage" : "WebPage", name: item.title, url: absolute(`/${item.slug}/`), description: item.description },
  ],
  body: `<main class="container trust-page"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span>${item.title}</nav><article>${item.body}</article></main>`,
}));

await save("converter-data.js", await readFile(new URL("../src/converters.mjs", import.meta.url), "utf8"));

const urls = ["/", ...categories.map(c => `/${c.slug}/`), ...tools.map(t => `/tools/${t.slug}/`), ...trustPages.map(p => `/${p.slug}/`)];
await save("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${origin}${url}</loc></url>`).join("\n")}\n</urlset>\n`);
await save("_redirects", "/music/tap-bpm/ /tools/tap-bpm/ 301\n/music/tap-bpm /tools/tap-bpm/ 301\n/music/tap-bpm/index.html /tools/tap-bpm/ 301\n");
const indexNowKey = process.env.INDEXNOW_KEY?.trim();
if (indexNowKey) {
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(indexNowKey)) throw new Error("INDEXNOW_KEY must be 8–128 letters, digits, or hyphens.");
  await save("indexnow-key.txt", indexNowKey);
} else {
  await rm(path("indexnow-key.txt"), { force: true });
}
console.log(`Built ${tools.length} tools, ${categories.length} categories, and sitemap with ${urls.length} URLs.`);
