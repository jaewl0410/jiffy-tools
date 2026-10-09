import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { webcrypto } from "node:crypto";
import assert from "node:assert/strict";

const source = await readFile(new URL("../public/tool.js", import.meta.url), "utf8");
function load(slug, values = {}) {
  const listeners = {};
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: values[id] ?? "", textContent: "", innerHTML: "",
      classList: { toggle() {} },
      addEventListener(name, handler) { listeners[id + ":" + name] = handler; },
      selectedOptions: [{ text: id === "note" ? "Quarter note" : "Straight" }],
    });
    return elements.get(id);
  }
  const page = {
    dataset: { tool: slug },
    addEventListener(name, handler) { listeners["page:" + name] = handler; },
  };
  const document = {
    querySelector() { return page; },
    getElementById: element,
    addEventListener(name, handler) { listeners["document:" + name] = handler; },
  };
  runInNewContext(source, {
    document, window: { getSelection: () => null }, navigator: { clipboard: { writeText: async () => {} } },
    crypto: webcrypto, performance: { now: () => 0 }, TextEncoder, TextDecoder, Uint8Array,
    btoa, atob, Element: class {}, Number, Date, console,
  });
  const action = name => listeners["page:click"]({ target: { closest: () => ({ dataset: { action: name } }) } });
  return { element, action, listeners };
}

const cases = [
  ["case-converter", { input: "hello WORLD" }, "title", "Hello World"],
  ["remove-line-breaks", { input: "first\nsecond" }, "join-space", "first second"],
  ["remove-extra-spaces", { input: " a   b \n c  d " }, "spaces", "a b\nc d"],
  ["sort-lines", { input: "z\na" }, "sort-az", "a\nz"],
  ["json-formatter", { input: '{"a":1}' }, "format", '{\n  "a": 1\n}'],
  ["base64-encode-decode", { input: "한글 🙂" }, "encode", "7ZWc6riAIPCfmYI="],
  ["url-encode-decode", { input: "a b&c" }, "encode", "a%20b%26c"],
];
for (const [slug, inputs, actionName, expected] of cases) {
  const ui = load(slug, inputs);
  await ui.action(actionName);
  assert.equal(ui.element("output").value, expected, slug);
}
for (const [slug, inputs, expected] of [
  ["percentage-calculator", { value: "80", percent: "15" }, "15% of 80 = 12"],
  ["percentage-change-calculator", { old: "80", new: "100" }, "25% increase · difference: 20"],
  ["average-calculator", { numbers: "10, 20, 30" }, "Average: 20 · Sum: 60 · Count: 3"],
  ["bpm-to-ms", { bpm: "120" }, "Quarter note: 500 ms · Eighth note: 250 ms · Sixteenth note: 125 ms"],
]) {
  const ui = load(slug, inputs);
  await ui.action("calculate");
  assert.equal(ui.element("result").textContent, expected, slug);
}
const invalid = load("json-validator", { input: "{oops}" });
await invalid.action("validate");
assert.match(invalid.element("status").textContent, /Invalid JSON/);
const counter = load("word-counter", { input: "one two three" });
assert.match(counter.element("metrics").innerHTML, /<strong>3<\/strong><span>Words/);
console.log("Smoked text, JSON, encoding, calculator, and analyzer behavior.");
