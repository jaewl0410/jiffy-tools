import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = await mkdtemp(join(tmpdir(), "jiffy-image-smoke-"));
const server = spawn(process.execPath, ["scripts/serve.mjs"], { cwd: new URL("../", import.meta.url), windowsHide: true });
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, label) {
  for (let i = 0; i < 100; i++) { try { const value = await fn(); if (value) return value; } catch {} await pause(100); }
  throw Error(`Timed out waiting for ${label}`);
}
let ws;
try {
  await until(async () => (await fetch("http://127.0.0.1:8765/")).ok, "local site");
  const port = await until(async () => (await readFile(join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0], "Chrome debugging port");
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id); pending.delete(message.id);
    message.error ? reject(Error(message.error.message)) : resolve(message.result);
  };
  function send(method, params = {}) {
    const id = ++nextId;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  }
  async function evalJs(expression) {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text || "Browser evaluation failed");
    return result.result.value;
  }
  async function go(slug) {
    await send("Page.navigate", { url: `http://127.0.0.1:8765/tools/${slug}/` });
    await until(async () => await evalJs(`document.readyState === "complete" && !!document.querySelector(".image-ui") && document.getElementById("image-run").onclick === null`), slug);
    // A complete document includes its deferred module script.
    await pause(50);
  }
  await send("Page.enable"); await send("Runtime.enable");
  await go("jpg-to-png");
  const fixtures = await evalJs(`(async () => {
    const c = document.createElement("canvas"); c.width = 16; c.height = 12;
    const x = c.getContext("2d");
    x.fillStyle = "red"; x.fillRect(0, 0, 8, 6);
    x.fillStyle = "lime"; x.fillRect(8, 0, 8, 6);
    x.fillStyle = "blue"; x.fillRect(0, 6, 8, 6);
    const result = {};
    for (const [type, name] of [["image/png","png"],["image/jpeg","jpeg"],["image/webp","webp"]]) result[name] = c.toDataURL(type).split(",")[1];
    return result;
  })()`);
  async function run(slug, sourceType, settings = {}, base64Input) {
    await go(slug);
    const result = await evalJs(`(async () => {
      const settings = ${JSON.stringify(settings)};
      const sourceType = ${JSON.stringify(sourceType)};
      const encoded = ${JSON.stringify(sourceType ? fixtures[sourceType] : "")};
      if (sourceType) {
        const bytes = Uint8Array.from(atob(encoded), ch => ch.charCodeAt(0));
        const file = new File([bytes], "sample." + (sourceType === "jpeg" ? "jpg" : sourceType), { type: "image/" + sourceType });
        const dt = new DataTransfer(); dt.items.add(file);
        const input = document.getElementById("image-file"); input.files = dt.files;
        input.dispatchEvent(new Event("change"));
        if (${JSON.stringify(slug === "image-resizer" || slug === "image-cropper")}) await new Promise(resolve => setTimeout(resolve, 150));
      }
      for (const [id, value] of Object.entries(settings)) { const field = document.getElementById(id); field.value = value; field.dispatchEvent(new Event("input")); }
      if (${JSON.stringify(base64Input ?? null)} !== null) document.getElementById("base64-input").value = ${JSON.stringify(base64Input ?? null)};
      document.getElementById("image-run").click();
      for (let i = 0; i < 100; i++) {
        const status = document.getElementById("image-status").textContent;
        if (status === "Ready to download.") break;
        if (document.getElementById("image-status").classList.contains("error")) throw Error(status);
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      if (document.getElementById("image-status").textContent !== "Ready to download.") throw Error("Processing timed out");
      const imageBlob = await (await fetch(document.getElementById("image-preview").src)).blob();
      const download = document.getElementById("image-download");
      if (download.hidden || !(await fetch(download.href)).ok) throw Error("Download is unavailable");
      const bitmap = await createImageBitmap(imageBlob);
      const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height;
      const context = canvas.getContext("2d"); context.drawImage(bitmap, 0, 0);
      const pixel = (x, y) => [...context.getImageData(x, y, 1, 1).data];
      return { type: imageBlob.type, width: bitmap.width, height: bitmap.height,
        topLeft: pixel(1, 1), topRight: pixel(bitmap.width - 2, 1), bottomRight: pixel(bitmap.width - 2, bitmap.height - 2),
        text: document.getElementById("base64-output").value,
        download: download.download };
    })()`);
    return result;
  }
  for (const [slug, input, output] of [
    ["jpg-to-png","jpeg","png"], ["png-to-jpg","png","jpeg"],
    ["webp-to-png","webp","png"], ["png-to-webp","png","webp"],
    ["jpg-to-webp","jpeg","webp"], ["webp-to-jpg","webp","jpeg"],
  ]) {
    const result = await run(slug, input);
    assert.equal(result.type, `image/${output}`, slug);
    assert.equal(result.width, 16, slug); assert.equal(result.height, 12, slug);
    if (output === "jpeg" && input !== "jpeg") assert.ok(result.bottomRight.slice(0, 3).every(channel => channel > 235), `${slug}: transparent area should be white`);
  }
  const resized = await run("image-resizer", "png", { width: 8 });
  assert.deepEqual([resized.width, resized.height], [8, 6]);
  const rotated = await run("rotate-image", "png", { rotation: 90 });
  assert.deepEqual([rotated.width, rotated.height], [12, 16]);
  assert.ok(rotated.topRight[0] > 200 && rotated.topRight[1] < 80, "rotation moves red to top right");
  const rotated180 = await run("rotate-image", "png", { rotation: 180 });
  assert.deepEqual([rotated180.width, rotated180.height], [16, 12]);
  assert.ok(rotated180.bottomRight[0] > 200, "180° rotation moves red to bottom right");
  const rotated270 = await run("rotate-image", "png", { rotation: 270 });
  assert.deepEqual([rotated270.width, rotated270.height], [12, 16]);
  assert.ok(rotated270.topLeft[1] > 200, "270° rotation moves green to top left");
  const flipped = await run("flip-image", "png", { direction: "horizontal" });
  assert.ok(flipped.topRight[0] > 200 && flipped.topRight[1] < 80, "horizontal flip moves red to top right");
  const flippedVertical = await run("flip-image", "png", { direction: "vertical" });
  assert.ok(flippedVertical.bottomRight[1] > 200, "vertical flip moves green to bottom right");
  const cropped = await run("image-cropper", "png", { "crop-x": 8, "crop-y": 0, "crop-width": 8, "crop-height": 6 });
  assert.deepEqual([cropped.width, cropped.height], [8, 6]);
  assert.ok(cropped.topLeft[1] > 200, "crop selects green quadrant");
  for (const kind of ["data-url", "raw"]) {
    const encoded = await run("image-to-base64", "png", { "base64-kind": kind });
    assert.ok(kind === "data-url" ? encoded.text.startsWith("data:image/png;base64,") : !encoded.text.startsWith("data:"));
    const decoded = await run("base64-to-image", null, {}, encoded.text);
    assert.deepEqual([decoded.type, decoded.width, decoded.height], ["image/png", 16, 12]);
  }
  await go("png-to-jpg");
  const invalid = await evalJs(`(async () => {
    const bytes = Uint8Array.from(atob(${JSON.stringify(fixtures.png)}), ch => ch.charCodeAt(0));
    async function tryFile(file) {
      const dt = new DataTransfer(); dt.items.add(file);
      document.getElementById("image-file").files = dt.files;
      document.getElementById("image-run").click();
      for (let i = 0; i < 100; i++) {
        const status = document.getElementById("image-status");
        if (status.classList.contains("error")) return status.textContent;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      throw Error("Expected validation error");
    }
    return [
      await tryFile(new File([bytes], "wrong.jpg", { type: "image/jpeg" })),
      await tryFile(new File([new Uint8Array([1,2,3])], "broken.png", { type: "image/png" })),
      await tryFile(new File([new Uint8Array(20 * 1024 * 1024 + 1)], "huge.png", { type: "image/png" })),
    ];
  })()`);
  assert.match(invalid[0], /File type does not match/);
  assert.match(invalid[1], /valid PNG, JPG, or WebP/);
  assert.match(invalid[2], /20 MB or smaller/);
  await go("base64-to-image");
  const badBase64 = await evalJs(`(async () => {
    document.getElementById("base64-input").value = "not base64";
    document.getElementById("image-run").click();
    await new Promise(resolve => setTimeout(resolve, 50));
    return document.getElementById("image-status").textContent;
  })()`);
  assert.match(badBase64, /valid image data URL or raw Base64/);
  await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 700, deviceScaleFactor: 1, mobile: true });
  for (const slug of ["image-resizer", "base64-to-image", "image-cropper"]) {
    await go(slug);
    const width = await evalJs(`Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)`);
    assert.ok(width <= 320, `${slug}: horizontal overflow at 320px (${width}px)`);
  }
  console.log("Smoked all 12 image tools in Chrome: formats, JPG white background, resize, rotate, flip, crop, Base64 round trips, and 320px layout.");
} finally {
  ws?.close(); server.kill(); chrome.kill();
  if (profile.startsWith(tmpdir()) && profile.includes("jiffy-image-smoke-")) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
