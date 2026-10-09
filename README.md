# Jiffy

Fast browser tools at [jiffy.tools](https://jiffy.tools). The site is plain HTML, CSS, and JavaScript served from `public/` by Cloudflare Workers Static Assets.

## Build

Node.js is the only build requirement. No packages need to be installed.

```sh
node scripts/build.mjs
node scripts/check.mjs
node scripts/smoke.mjs
```

The build generates the home page, category pages, tool pages, sitemap, and `_redirects` in `public/`. Commit the generated HTML with source changes so Cloudflare can deploy `public/` directly even without a build command.

## Add a tool

1. Add its metadata and UI fields to `src/registry.mjs`. The registry owns slug, category, engine, title, description, example, and related tools.
2. Reuse or extend a branch in `public/tool.js` for the browser behavior.
3. If it needs a new control layout, extend `toolUI` in `scripts/build.mjs`.
4. Run the build and check commands above.

Every tool is published at `/tools/<slug>/`; categories are browse pages at `/<category>/`. The build writes canonical and social metadata from the registry. `public/_redirects` sends the former Tap BPM URL to its new path with HTTP 301 on Cloudflare.

## Converter pages

`src/converters.mjs` defines the 13 quantity groups, ordered unit lists, conversion factors, temperature offsets, validation, and the selected pair URLs. `src/registry.mjs` derives one general converter per quantity and the pair pages, including title, description, examples, precision, and related links. The build copies the shared conversion module to `public/converter-data.js`; `public/converter.js` provides the browser UI. Do not edit the generated copy directly. Add a unit or pair in the source module, then rebuild and run the checks.

Data storage uses decimal SI units by default (`1 KB = 1,000 B`), with separately labeled binary IEC units (`1 KiB = 1,024 B`). All conversion happens in the browser; no API or server calculations are used.

## Deployment

`wrangler.jsonc` points Static Assets at `./public`. Deploy the committed `public/` directory through the existing Cloudflare workflow. The local check verifies generated URLs, links, assets, metadata, sitemap, robots reference, and redirect declaration. The smoke script exercises representative browser behavior. Use `node scripts/serve.mjs` to preview at `http://127.0.0.1:8765/`. These checks do not replace a production redirect test.
