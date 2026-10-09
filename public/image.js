const root = document.querySelector(".image-ui");
if (root) {
  const $ = id => document.getElementById(id);
  const mode = root.dataset.mode;
  const MAX_BYTES = 20 * 1024 * 1024;
  const MAX_PIXELS = 40_000_000;
  const MAX_SIDE = 16384;
  const mime = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };
  const extension = { png: "png", jpeg: "jpg", webp: "webp" };
  let resultUrl;
  let textUrl;
  let originalSize;
  let changing = false;

  function status(message, error = false) {
    $("image-status").textContent = message;
    $("image-status").classList.toggle("error", error);
  }
  function clearResult() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    if (textUrl) URL.revokeObjectURL(textUrl);
    resultUrl = null;
    textUrl = null;
    $("image-result").hidden = true;
    $("image-download").hidden = true;
    $("image-preview").removeAttribute("src");
    $("base64-output-wrap").hidden = true;
    $("base64-output").value = "";
  }
  function kind(bytes) {
    if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v)) return "png";
    if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "jpeg";
    if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
    return null;
  }
  async function checkedBlob(blob, expected) {
    if (!blob || !blob.size) throw Error("Choose a non-empty image.");
    if (blob.size > MAX_BYTES) throw Error("Image must be 20 MB or smaller.");
    const actual = kind(new Uint8Array(await blob.slice(0, 16).arrayBuffer()));
    if (!actual) throw Error("Choose a valid PNG, JPG, or WebP image.");
    if (expected && actual !== expected) throw Error(`This tool needs a ${expected === "jpeg" ? "JPG" : expected.toUpperCase()} image.`);
    if (blob.type && blob.type !== mime[actual] && !(actual === "jpeg" && blob.type === "image/jpg")) throw Error("File type does not match its image data.");
    return actual;
  }
  async function loadImage(blob) {
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth > MAX_SIDE || img.naturalHeight > MAX_SIDE || img.naturalWidth * img.naturalHeight > MAX_PIXELS) throw Error("Image dimensions are too large or invalid.");
      return img;
    } catch (error) {
      throw Error(error.message === "Image dimensions are too large or invalid." ? error.message : "This image could not be opened.");
    } finally {
      // Keep the object URL until drawing has finished by returning a decoded Image.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }
  function integer(id, label, minimum = 1) {
    const value = Number($(id).value);
    if (!Number.isSafeInteger(value) || value < minimum || value > MAX_SIDE) throw Error(`${label} must be a whole number from ${minimum} to ${MAX_SIDE}.`);
    return value;
  }
  function dimensions(width, height) {
    if (width < 1 || height < 1 || width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_PIXELS) throw Error("Output dimensions are too large.");
  }
  function canvasOutput(canvas, type, quality) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => {
      if (!blob || blob.type !== mime[type]) reject(Error("This browser cannot export that image format."));
      else resolve(blob);
    }, mime[type], quality));
  }
  function show(blob, type, width, height, filename, textResult) {
    resultUrl = URL.createObjectURL(blob);
    $("image-preview").src = resultUrl;
    $("image-result").hidden = false;
    $("image-details").textContent = `${width} × ${height} px · ${type.toUpperCase()} · ${(blob.size / 1024).toFixed(1)} KB`;
    const download = $("image-download");
    if (textResult) textUrl = URL.createObjectURL(new Blob([textResult], { type: "text/plain" }));
    download.href = textUrl || resultUrl;
    download.download = filename;
    download.hidden = false;
    if (textResult) {
      $("base64-output-wrap").hidden = false;
      $("base64-output").value = textResult;
    }
  }
  function sourceFile() {
    const file = $("image-file").files[0];
    if (!file) throw Error("Choose an image first.");
    return file;
  }
  async function readDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(Error("Could not read the image."));
      reader.readAsDataURL(blob);
    });
  }
  function decodeBase64(value) {
    const input = value.trim();
    if (input.length > Math.ceil(MAX_BYTES * 4 / 3) + 100) throw Error("Encoded image is too large.");
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(input);
    const raw = match ? match[2] : input;
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(raw) || !raw) throw Error("Enter a valid image data URL or raw Base64 value.");
    const binary = atob(raw);
    if (binary.length > MAX_BYTES) throw Error("Image must be 20 MB or smaller.");
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const type = kind(bytes);
    if (!type) throw Error("Base64 must contain a PNG, JPG, or WebP image.");
    if (match && match[1].toLowerCase() !== mime[type]) throw Error("Data URL image type does not match its contents.");
    return { blob: new Blob([bytes], { type: mime[type] }), type };
  }
  async function run() {
    clearResult();
    status("Processing…");
    $("image-run").disabled = true;
    try {
      if (mode === "decode") {
        const { blob, type } = decodeBase64($("base64-input").value);
        const img = await loadImage(blob);
        show(blob, type, img.naturalWidth, img.naturalHeight, `jiffy-image.${extension[type]}`);
      } else {
        const file = sourceFile();
        const type = await checkedBlob(file, root.dataset.input || null);
        const img = await loadImage(file);
        const width = img.naturalWidth, height = img.naturalHeight;
        if (mode === "encode") {
          const dataURL = await readDataURL(file);
          const output = $("base64-kind").value === "raw" ? dataURL.slice(dataURL.indexOf(",") + 1) : dataURL;
          show(file, type, width, height, "jiffy-image-base64.txt", output);
        } else {
          let w = width, h = height, sx = 0, sy = 0, sw = width, sh = height;
          if (mode === "resize") { w = integer("width", "Width"); h = integer("height", "Height"); }
          if (mode === "rotate" && $("rotation").value !== "180") { w = height; h = width; }
          if (mode === "crop") {
            sx = integer("crop-x", "Left", 0); sy = integer("crop-y", "Top", 0);
            sw = w = integer("crop-width", "Crop width"); sh = h = integer("crop-height", "Crop height");
            if (sx + sw > width || sy + sh > height) throw Error("Crop area must fit inside the image.");
          }
          dimensions(w, h);
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw Error("Canvas is unavailable in this browser.");
          const outputType = root.dataset.output || "png";
          if (outputType === "jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); }
          if (mode === "rotate") {
            ctx.translate(w / 2, h / 2);
            ctx.rotate(Number($("rotation").value) * Math.PI / 180);
            ctx.drawImage(img, -width / 2, -height / 2);
          } else if (mode === "flip") {
            if ($("direction").value === "horizontal") { ctx.translate(w, 0); ctx.scale(-1, 1); }
            else { ctx.translate(0, h); ctx.scale(1, -1); }
            ctx.drawImage(img, 0, 0);
          } else ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
          const quality = $("quality") ? Number($("quality").value) / 100 : undefined;
          const blob = await canvasOutput(canvas, outputType, quality);
          show(blob, outputType, w, h, `jiffy-${mode}.${extension[outputType]}`);
        }
      }
      status("Ready to download.");
    } catch (error) { status(error.message || "Could not process this image.", true); }
    finally { $("image-run").disabled = false; }
  }
  if ($("image-file")) $("image-file").addEventListener("change", async () => {
    clearResult(); status("");
    if (mode !== "resize" && mode !== "crop") return;
    try {
      const file = sourceFile();
      await checkedBlob(file, root.dataset.input || null);
      const img = await loadImage(file);
      originalSize = [img.naturalWidth, img.naturalHeight];
      if (mode === "resize") { $("width").value = originalSize[0]; $("height").value = originalSize[1]; }
      else { $("crop-x").value = 0; $("crop-y").value = 0; $("crop-width").value = originalSize[0]; $("crop-height").value = originalSize[1]; }
      status(`Loaded ${originalSize[0]} × ${originalSize[1]} px.`);
    } catch (error) { status(error.message, true); }
  });
  if (mode === "resize") for (const changed of ["width", "height"]) $(changed).addEventListener("input", () => {
    if (changing || !$("keep-ratio").checked || !originalSize) return;
    const other = changed === "width" ? "height" : "width";
    const value = Number($(changed).value);
    if (!Number.isFinite(value) || value < 1) return;
    changing = true;
    $(other).value = Math.max(1, Math.round(value * originalSize[other === "width" ? 0 : 1] / originalSize[changed === "width" ? 0 : 1]));
    changing = false;
  });
  if ($("quality")) $("quality").addEventListener("input", () => $("quality-value").textContent = `${$("quality").value}%`);
  $("image-run").addEventListener("click", run);
  window.addEventListener("pagehide", () => { if (resultUrl) URL.revokeObjectURL(resultUrl); if (textUrl) URL.revokeObjectURL(textUrl); });
}
