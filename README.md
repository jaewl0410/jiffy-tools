# Jiffy

Fast browser tools at [jiffy.tools](https://jiffy.tools). The site is plain HTML, CSS, and JavaScript served from `public/` by Cloudflare Workers Static Assets.

## Build

Node.js is the only build requirement. No packages need to be installed.

```sh
node scripts/build.mjs
node scripts/check.mjs
node scripts/smoke.mjs
node scripts/image-smoke.mjs
```

The build generates the home page, category pages, tool pages, sitemap, and `_redirects` in `public/`. Commit the generated HTML with source changes so Cloudflare can deploy `public/` directly even without a build command.
The image smoke test uses a locally installed Chrome browser; set `CHROME_PATH` if it is not in the default Windows location. It runs sample images through the browser tools without adding a production dependency. Set `JIFFY_TEST_URL=https://jiffy.tools` to run the same checks against production.

## Add a tool

1. Add its metadata and UI fields to `src/registry.mjs`. The registry owns slug, category, engine, title, description, example, and related tools.
2. Reuse or extend a branch in `public/tool.js` for the browser behavior.
3. If it needs a new control layout, extend `toolUI` in `scripts/build.mjs`.
4. Run the build and check commands above.

Every tool is published at `/tools/<slug>/`; categories are browse pages at `/<category>/`. The build writes canonical and social metadata from the registry. `public/_redirects` sends the former Tap BPM URL to its new path with HTTP 301 on Cloudflare.

## Converter pages

`src/converters.mjs` defines the 13 quantity groups, ordered unit lists, conversion factors, temperature offsets, validation, and the selected pair URLs. `src/registry.mjs` derives one general converter per quantity and the pair pages, including title, description, examples, precision, and related links. The build copies the shared conversion module to `public/converter-data.js`; `public/converter.js` provides the browser UI. Do not edit the generated copy directly. Add a unit or pair in the source module, then rebuild and run the checks.

Data storage uses decimal SI units by default (`1 KB = 1,000 B`), with separately labeled binary IEC units (`1 KiB = 1,024 B`). All conversion happens in the browser; no API or server calculations are used.

## Image tools and site information

Image tools share `public/image.js` for file checks, decoding, Canvas processing, previews, and downloads. Their format and mode settings live in `src/registry.mjs`; the build uses these settings to generate 12 tool pages under `/tools/` and the `/image/` category. PNG, JPG, and WebP files are limited to 20 MB and 40 megapixels. JPG output fills transparent pixels with white. Resize, rotate, flip, and crop export PNG. The Base64 pair accepts either a data URL with a MIME type or raw Base64 image bytes.

About, Privacy, Contact, and Terms pages are generated from `scripts/build.mjs` and linked in every footer. Update the page copy there, then rebuild. The Contact page currently uses public GitHub issues until a support address is available.

## Deployment

`wrangler.jsonc` points Static Assets at `./public`. Deploy the committed `public/` directory through the existing Cloudflare workflow. The local check verifies generated URLs, links, assets, metadata, sitemap, robots reference, and redirect declaration. The smoke script exercises representative browser behavior. Use `node scripts/serve.mjs` to preview at `http://127.0.0.1:8765/`. These checks do not replace a production redirect test.

## Bing Webmaster Tools and IndexNow

1. Sign in to [Bing Webmaster Tools](https://www.bing.com/webmasters/). Choose **Import from Google Search Console**, authorize the Google account that owns `https://jiffy.tools/`, select Jiffy, and import it. Bing can verify the site and import its sitemap through this route. Confirm `https://jiffy.tools/sitemap.xml` appears under Sitemaps; add it there if it does not. No Bing verification tag is needed for the import route.
2. Generate one IndexNow key (8–128 letters, digits, or hyphens). In Cloudflare **Workers & Pages → jiffy-tools → Settings → Builds → Build variables and secrets**, add it as the secret `INDEXNOW_KEY`. Do not put it in Git, `wrangler.jsonc`, or a tracked `.env` file. The generated `public/indexnow-key.txt` is intentionally public: IndexNow must fetch this file to verify site ownership. It is ignored by Git and contains the key only during builds with the secret available.
3. For the production branch in Cloudflare Workers Builds, set the build command to `node scripts/build.mjs && node scripts/check.mjs` and the deploy command to `npx wrangler deploy && node scripts/indexnow.mjs`. The first command produces the public key file with the deployed assets. The second submits changed pages only after Wrangler reports a successful deployment. Keep preview builds from running the production deploy command. This is a Cloudflare dashboard setting; adding the script to the repo alone does not activate it.
4. After the first configured deploy, verify `https://jiffy.tools/indexnow-key.txt` returns the key, then check the IndexNow report in Bing Webmaster Tools. The submission script checks that the live key file matches before calling Bing and does not fail the deploy if Bing is unavailable. An accepted notification is a discovery signal, not an indexing guarantee.

`node scripts/indexnow.mjs --dry-run` shows the URLs that would be submitted without reading or printing the key and without making network requests. `--all --dry-run` shows every current sitemap URL. The script compares generated `public/**/index.html` files with the prior Git commit; it includes new and changed pages. If the prior commit is unavailable in a shallow checkout, it falls back to one batch of all public URLs. Batches are capped at 10,000 URLs per IndexNow request. Keep generated HTML committed with source changes so the diff reflects each release.
