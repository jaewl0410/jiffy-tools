(() => {
  const page = document.querySelector("[data-tool]");
  if (!page) return;
  const slug = page.dataset.tool;
  const $ = id => document.getElementById(id);
  const value = id => $(id)?.value ?? "";
  const output = text => {
    const el = $("output") || $("result");
    if (el) el.value !== undefined ? el.value = text : el.textContent = text;
  };
  const status = (text, error = false) => {
    const el = $("status");
    if (el) { el.textContent = text; el.classList.toggle("error", error); }
  };
  const number = id => {
    const raw = value(id).trim();
    if (raw === "") throw Error("Enter a value in every field.");
    const n = Number(raw);
    if (!Number.isFinite(n)) throw Error("Enter a valid number.");
    return n;
  };
  const fmt = n => Number.isFinite(n) ? Number(n.toFixed(6)).toLocaleString("en-US", { maximumFractionDigits: 6 }) : "—";
  const result = text => { const el = $("result"); if (el) el.textContent = text; };
  const selected = () => window.getSelection()?.toString() || "";

  if (slug === "word-counter" || slug === "character-counter") {
    const update = () => {
      const input = value("input");
      const words = input.trim() ? input.trim().split(/\s+/u).length : 0;
      const characters = [...input].length;
      const withoutSpaces = [...input.replace(/\s/gu, "")].length;
      const sentences = (input.match(/[^.!?]+[.!?]+|[^.!?]+$/gu) || []).filter(s => s.trim()).length;
      const metrics = [
        ["Words", words], ["Characters", characters],
        ["Without spaces", withoutSpaces], ["Sentences", sentences],
        ["Reading time", words ? `${Math.max(1, Math.ceil(words / 200))} min` : "0 min"],
      ];
      $("metrics").innerHTML = metrics.map(([label, n]) => `<div><strong>${n}</strong><span>${label}</span></div>`).join("");
    };
    $("input").addEventListener("input", update);
    update();
    return;
  }
  if (slug === "tap-bpm") {
    let lastTap = null;
    let intervals = [];
    const reset = () => { lastTap = null; intervals = []; $("bpm").textContent = "—"; $("tap-status").textContent = "Tap the button or press Space to begin."; };
    const tap = () => {
      const now = performance.now();
      if (lastTap !== null) {
        const interval = now - lastTap;
        if (interval < 120) return;
        if (interval >= 5000) { intervals = []; $("bpm").textContent = "—"; }
        else { intervals.push(interval); if (intervals.length > 8) intervals.shift(); }
      }
      lastTap = now;
      if (!intervals.length) { $("tap-status").textContent = "Tap again to see your BPM."; return; }
      const bpm = Math.round(60000 * intervals.length / intervals.reduce((a, b) => a + b, 0));
      $("bpm").textContent = String(bpm);
      $("tap-status").textContent = `${bpm} BPM · ${intervals.length} recent interval${intervals.length === 1 ? "" : "s"}`;
    };
    $("tap-button").addEventListener("click", tap);
    $("reset-button").addEventListener("click", reset);
    document.addEventListener("keydown", event => {
      if (event.code !== "Space" || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, button, [contenteditable]")) return;
      event.preventDefault();
      tap();
    });
    return;
  }

  async function act(action) {
    try {
      const input = value("input");
      if (action === "copy") {
        const text = value("output") || $("result")?.textContent || selected();
        if (!text) throw Error("There is nothing to copy yet.");
        await navigator.clipboard.writeText(text);
        status("Copied to clipboard.");
        return;
      }
      status("");
      if (slug === "case-converter") {
        const lower = input.toLocaleLowerCase();
        const transformed = {
          upper: () => input.toLocaleUpperCase(),
          lower: () => lower,
          title: () => lower.replace(/(^|[^\p{L}\p{N}])([\p{L}\p{N}])/gu, (_, gap, letter) => gap + letter.toLocaleUpperCase()),
          sentence: () => lower.replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, gap, letter) => gap + letter.toLocaleUpperCase()),
        }[action];
        output(transformed());
      } else if (slug === "remove-line-breaks") {
        output(action === "join-none" ? input.replace(/\r?\n/g, "") : input.replace(/\s*\r?\n\s*/g, " "));
      } else if (slug === "remove-extra-spaces") {
        output(input.split(/\r?\n/).map(line => line.trim().replace(/[\t ]+/g, " ")).join("\n"));
      } else if (slug === "sort-lines") {
        const lines = input.split(/\r?\n/);
        if (action === "unique") output([...new Set(lines)].join("\n"));
        else output(lines.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }) * (action === "sort-za" ? -1 : 1)).join("\n"));
      } else if (slug === "json-formatter" || slug === "json-validator") {
        const parsed = JSON.parse(input);
        output(action === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2));
        status("Valid JSON.");
      } else if (slug === "base64-encode-decode") {
        if (action === "encode") {
          const bytes = new TextEncoder().encode(input);
          let binary = "";
          for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
          output(btoa(binary));
        }
        else {
          const bytes = Uint8Array.from(atob(input.trim()), c => c.charCodeAt(0));
          output(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
        }
      } else if (slug === "url-encode-decode") {
        output(action === "encode" ? encodeURIComponent(input) : decodeURIComponent(input));
      } else if (slug === "uuid-generator") {
        const count = number("count");
        if (!Number.isInteger(count) || count < 1 || count > 100) throw Error("Choose 1 to 100 UUIDs.");
        output(Array.from({ length: count }, () => crypto.randomUUID()).join("\n"));
      } else if (slug === "unix-timestamp-converter") {
        if (action === "now") {
          $("timestamp").value = String(Math.floor(Date.now() / 1000));
          $("datetime").value = localDateTime(new Date());
          result("Current Unix time: " + $("timestamp").value);
        } else if (action === "timestamp-to-date") {
          const raw = value("timestamp").trim();
          if (!/^-?\d+(?:\.\d+)?$/.test(raw)) throw Error("Enter a Unix timestamp.");
          const n = Number(raw);
          const ms = Math.abs(n) >= 1e11 ? n : n * 1000;
          const date = new Date(ms);
          if (Number.isNaN(date.getTime())) throw Error("Timestamp is out of range.");
          $("datetime").value = localDateTime(date);
          result(`Local: ${date.toLocaleString()} · UTC: ${date.toISOString()}`);
        } else {
          const raw = value("datetime");
          if (!raw) throw Error("Choose a date and time.");
          const date = new Date(raw);
          if (Number.isNaN(date.getTime())) throw Error("Enter a valid date and time.");
          const seconds = Math.floor(date.getTime() / 1000);
          $("timestamp").value = String(seconds);
          result(`Unix seconds: ${seconds} · milliseconds: ${date.getTime()}`);
        }
      } else if (action === "calculate") {
        if (slug === "percentage-calculator") {
          const a = number("value"), b = number("percent");
          result(`${fmt(b)}% of ${fmt(a)} = ${fmt(a * b / 100)}`);
        } else if (slug === "percentage-change-calculator") {
          const a = number("old"), b = number("new");
          if (a === 0) throw Error("Original value must not be zero.");
          result(`${fmt((b - a) / Math.abs(a) * 100)}% ${b >= a ? "increase" : "decrease"} · difference: ${fmt(b - a)}`);
        } else if (slug === "average-calculator") {
          const raw = value("numbers").trim();
          if (!raw) throw Error("Enter at least one number.");
          const parts = raw.split(/[\s,;]+/).filter(Boolean);
          const nums = parts.map(Number);
          if (nums.some(n => !Number.isFinite(n))) throw Error("Use numbers separated by commas, spaces, or lines.");
          const sum = nums.reduce((a, b) => a + b, 0);
          result(`Average: ${fmt(sum / nums.length)} · Sum: ${fmt(sum)} · Count: ${nums.length}`);
        } else if (slug === "date-difference-calculator") {
          const a = value("start"), b = value("end");
          if (!a || !b) throw Error("Choose both dates.");
          const days = Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
          result(`${Math.abs(days).toLocaleString()} day${Math.abs(days) === 1 ? "" : "s"} ${days < 0 ? "(end is before start)" : "between the dates"} · ${fmt(Math.abs(days) / 7)} weeks`);
        } else if (slug === "bpm-to-ms" || slug === "delay-time-calculator") {
          const bpm = number("bpm");
          if (bpm <= 0) throw Error("BPM must be greater than zero.");
          const beat = 60000 / bpm;
          if (slug === "bpm-to-ms") result(`Quarter note: ${fmt(beat)} ms · Eighth note: ${fmt(beat / 2)} ms · Sixteenth note: ${fmt(beat / 4)} ms`);
          else result(`${$("note").selectedOptions[0].text} · ${$("feel").selectedOptions[0].text}: ${fmt(beat * Number(value("note")) * Number(value("feel")))} ms`);
        }
      }
    } catch (error) {
      status(error instanceof SyntaxError && (slug === "json-formatter" || slug === "json-validator") ? `Invalid JSON: ${error.message}` : error.message, true);
      if ($("result")) result(error.message);
      else if ($("output")) output("");
    }
  }
  function localDateTime(date) {
    const pad = n => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  page.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (button) act(button.dataset.action);
  });
})();
