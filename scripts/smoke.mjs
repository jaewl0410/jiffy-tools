import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { webcrypto } from "node:crypto";
import assert from "node:assert/strict";
import { quantities, pairSpecs, convert, formatNumber } from "../src/converters.mjs";

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

for (const [quantity, definition] of Object.entries(quantities)) {
  const [from, to] = definition.units;
  for (const sample of [0, 1, -2.5, 123456.789]) {
    if (quantity === "temperature" && sample < 0 && from.id === "k") continue;
    const answer = convert(quantity, from.id, to.id, sample);
    assert.ok(Number.isFinite(answer), `${quantity}: finite result`);
    const roundTrip = convert(quantity, to.id, from.id, answer);
    assert.ok(Math.abs(roundTrip - sample) <= 1e-8 * Math.max(1, Math.abs(sample)), `${quantity}: round trip ${sample}`);
  }
}
for (const [quantity, slug, from, to] of pairSpecs) {
  const value = quantity === "temperature" ? 25 : 42.5;
  const answer = convert(quantity, from, to, value);
  assert.ok(Number.isFinite(answer), slug);
  assert.ok(Math.abs(convert(quantity, to, from, answer) - value) <= 1e-8 * Math.max(1, Math.abs(value)), `${slug}: inverse`);
}
assert.equal(convert("temperature", "c", "f", 0), 32);
assert.equal(convert("temperature", "f", "c", 212), 100);
assert.equal(convert("temperature", "c", "k", 0), 273.15);
assert.equal(convert("temperature", "k", "c", 0), -273.15);
const closeTo = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-9 * Math.max(1, Math.abs(expected)), `${label}: ${actual} ≠ ${expected}`);
closeTo(convert("length", "in", "cm", 1), 2.54, "inch to centimeter");
closeTo(convert("length", "mi", "km", 1), 1.609344, "mile to kilometer");
closeTo(convert("weight", "lb", "kg", 1), 0.45359237, "pound to kilogram");
closeTo(convert("weight", "kg", "lb", 1), 2.2046226218487757, "kilogram to pound");
closeTo(convert("speed", "kmh", "mps", 36), 10, "km/h to m/s");
closeTo(convert("speed", "mph", "kmh", 1), 1.609344, "mph to km/h");
assert.equal(convert("data-storage", "MB", "KB", 1), 1000);
assert.equal(convert("data-storage", "MiB", "KiB", 1), 1024);
assert.equal(convert("data-storage", "GB", "GiB", 1), 1e9 / 1073741824);
for (const value of ["", "foo", "Infinity", "NaN", "0x10", "1e999"]) assert.throws(() => convert("length", "m", "ft", value));
assert.throws(() => convert("temperature", "k", "c", -1), /absolute zero/);
assert.throws(() => convert("length", "km", "mm", "1e308"), /supported range/);
assert.equal(formatNumber(0.000001), "0.000001");
console.log(`Smoked ${Object.keys(quantities).length} converter quantities and ${pairSpecs.length} pair directions, including inverse, temperature, SI/IEC, and invalid inputs.`);
