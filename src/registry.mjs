import { quantities, pairSpecs, getUnit, convert, formatNumber } from "./converters.mjs";

export const categories = [
  { slug: "text", name: "Text", description: "Count, clean, and transform text in your browser." },
  { slug: "developer", name: "Developer", description: "Everyday encoding, JSON, IDs, and time tools." },
  { slug: "calculators", name: "Calculators", description: "Quick answers for percentages, dates, and music timing." },
  { slug: "converters", name: "Converters", description: "Convert common units instantly, with clear formulas and no uploads." },
  { slug: "image", name: "Image", description: "Convert and adjust images locally in your browser." },
];

const text = (slug, name, description, engine, example, related) => ({ slug, name, description, category: "text", engine, example, related });
const dev = (slug, name, description, engine, example, related) => ({ slug, name, description, category: "developer", engine, example, related });
const calc = (slug, name, description, engine, example, related, fields) => ({ slug, name, description, category: "calculators", engine, example, related, fields });

const waveOneTools = [
  text("word-counter", "Word Counter", "Count words, characters, sentences, and reading time as you type.", "analyzer", "Paste an article or essay to check its length.", ["character-counter", "case-converter"]),
  text("character-counter", "Character Counter", "Count characters with and without spaces in real time.", "analyzer", "Check the length of a social post or form response.", ["word-counter", "remove-extra-spaces"]),
  text("case-converter", "Case Converter", "Convert text to uppercase, lowercase, title case, or sentence case.", "transform", "Turn a heading into title case with one click.", ["remove-extra-spaces", "sort-lines"]),
  text("remove-line-breaks", "Remove Line Breaks", "Join broken lines into clean paragraphs instantly.", "transform", "Clean text copied from a PDF or email.", ["remove-extra-spaces", "sort-lines"]),
  text("remove-extra-spaces", "Remove Extra Spaces", "Collapse repeated spaces and trim unwanted whitespace.", "transform", "Clean up pasted text while keeping paragraph breaks.", ["remove-line-breaks", "case-converter"]),
  text("sort-lines", "Sort Lines", "Sort text lines alphabetically, reverse them, or remove duplicates.", "transform", "Alphabetize a list of names or keywords.", ["remove-line-breaks", "case-converter"]),

  dev("json-formatter", "JSON Formatter", "Format and minify JSON with clear syntax errors.", "json", "Paste a compact API response and choose Format.", ["json-validator", "url-encode-decode"]),
  dev("json-validator", "JSON Validator", "Check whether JSON is valid and find syntax errors.", "json", "Paste a configuration file to verify its syntax.", ["json-formatter", "base64-encode-decode"]),
  dev("base64-encode-decode", "Base64 Encode & Decode", "Encode or decode UTF-8 text as Base64 in your browser.", "codec", "Encode a Unicode string or decode an existing Base64 value.", ["url-encode-decode", "json-formatter"]),
  dev("url-encode-decode", "URL Encode & Decode", "Encode or decode URL components safely.", "codec", "Encode a search query before adding it to a URL.", ["base64-encode-decode", "json-validator"]),
  dev("uuid-generator", "UUID Generator", "Generate random version 4 UUIDs with your browser's secure random source.", "generator", "Create an ID for a record or test fixture.", ["unix-timestamp-converter", "json-formatter"]),
  dev("unix-timestamp-converter", "Unix Timestamp Converter", "Convert Unix seconds or milliseconds to dates and back.", "timestamp", "Convert an API timestamp into a readable local date.", ["uuid-generator", "date-difference-calculator"]),

  calc("percentage-calculator", "Percentage Calculator", "Find a percentage of any number instantly.", "formula", "Find 15% of 80.", ["percentage-change-calculator", "average-calculator"], [["value","Value","80"],["percent","Percent (%)","15"]]),
  calc("percentage-change-calculator", "Percentage Change Calculator", "Calculate the percentage increase or decrease between two values.", "formula", "Compare a price before and after a change.", ["percentage-calculator", "average-calculator"], [["old","Original value","80"],["new","New value","100"]]),
  calc("average-calculator", "Average Calculator", "Find the mean, sum, and count of a list of numbers.", "formula", "Enter numbers separated by commas, spaces, or new lines.", ["percentage-calculator", "percentage-change-calculator"]),
  calc("date-difference-calculator", "Date Difference Calculator", "Calculate the days between two calendar dates.", "formula", "Measure the time between a start and end date.", ["unix-timestamp-converter", "percentage-calculator"], [["start","Start date",""],["end","End date",""]]),
  calc("tap-bpm", "Tap BPM", "Tap along to a beat to find its tempo.", "tap", "Tap at least twice, then keep tapping for a steadier result.", ["bpm-to-ms", "delay-time-calculator"]),
  calc("bpm-to-ms", "BPM to MS Converter", "Convert tempo in BPM into milliseconds per beat or note.", "formula", "At 120 BPM, a quarter note lasts 500 ms.", ["tap-bpm", "delay-time-calculator"], [["bpm","Tempo (BPM)","120"]]),
  calc("delay-time-calculator", "Delay Time Calculator", "Find musical delay times for common note values at any BPM.", "formula", "Set the tempo to match your project and choose a note value.", ["bpm-to-ms", "tap-bpm"], [["bpm","Tempo (BPM)","120"]]),
].map(tool => ({
  ...tool,
  title: `${tool.name} — Free Online Tool | Jiffy`,
  meta: tool.description,
}));

const pairName = slug => slug.split("-to-").map(part => ({
  cm: "CM", mm: "MM", km: "KM", kg: "KG", lbs: "LBS", mb: "MB", gb: "GB", kb: "KB", tb: "TB", kmh: "KM/H", mph: "MPH",
  "meters-per-second": "Meters per Second",
})[part] || part.charAt(0).toUpperCase() + part.slice(1)).join(" to ");

const relatedQuantities = {
  area: ["length", "volume"], volume: ["area", "length"], energy: ["power", "time"],
  power: ["energy", "frequency"], pressure: ["weight", "area"],
  angle: ["length", "frequency"], frequency: ["time", "speed"],
};

const generalConverters = Object.entries(quantities).map(([quantity, definition]) => {
  const [from, to] = definition.units;
  const exampleValues = quantity === "temperature" ? [0, 100] : quantity === "data-storage" ? [1, 1000] : [1, 10];
  const relatedPairs = pairSpecs.filter(spec => spec[0] === quantity).slice(0, 5).map(spec => spec[1]);
  return {
    slug: `${quantity}-converter`, name: `${definition.name} Converter`, category: "converters", engine: "unit-converter", quantity,
    units: definition.units.map(unit => unit.id), from: from.id, to: to.id, precision: 10,
    description: `Convert ${definition.name.toLowerCase()} units instantly. Choose two units, enter a value, and see the result as you type.`,
    examples: exampleValues.map(value => `${formatNumber(value)} ${from.symbol} = ${formatNumber(convert(quantity, from.id, to.id, value))} ${to.symbol}`),
    related: relatedPairs.length ? relatedPairs : relatedQuantities[quantity].map(other => `${other}-converter`),
    title: `${definition.name} Converter — Free Unit Conversion | Jiffy`,
    meta: `Convert ${definition.name.toLowerCase()} units online with instant results and clear unit definitions. Free browser-based ${definition.name.toLowerCase()} converter.`,
  };
});

const pairConverters = pairSpecs.map(([quantity, slug, from, to]) => {
  const source = getUnit(quantity, from), target = getUnit(quantity, to);
  const name = `${pairName(slug)} Converter`;
  const inverse = pairSpecs.find(spec => spec[0] === quantity && spec[2] === to && spec[3] === from);
  const examples = (quantity === "temperature" ? [0, 100] : [1, 10])
    .map(value => `${formatNumber(value)} ${source.symbol} = ${formatNumber(convert(quantity, from, to, value))} ${target.symbol}`);
  return {
    slug, name, category: "converters", engine: "pair-converter", quantity,
    units: [from, to], from, to, precision: 10,
    description: `Convert ${source.label.toLowerCase()} to ${target.label.toLowerCase()} instantly. Enter any value to see the result.`,
    examples,
    related: [inverse?.[1], `${quantity}-converter`, ...pairSpecs.filter(spec => spec[0] === quantity && spec[1] !== slug && spec[1] !== inverse?.[1]).slice(0, 3).map(spec => spec[1])].filter(Boolean),
    title: `${name} — Formula & Examples | Jiffy`,
    meta: `${name}: enter a value for an instant result. See the conversion formula and practical examples.`,
  };
});

const image = (slug, name, description, mode, related, options = {}) => ({
  slug, name, description, category: "image", engine: "image", mode, related, ...options,
  example: "Choose an image, adjust the options, then download the result.",
  title: `${name} — Free Online Image Tool | Jiffy`, meta: `${description} Files stay in your browser.`,
});
const imageTools = [
  image("jpg-to-png", "JPG to PNG", "Convert a JPG image to PNG.", "format", ["png-to-jpg", "jpg-to-webp"], { input: "jpeg", output: "png" }),
  image("png-to-jpg", "PNG to JPG", "Convert a PNG image to JPG with a white background for transparency.", "format", ["jpg-to-png", "png-to-webp"], { input: "png", output: "jpeg" }),
  image("webp-to-png", "WebP to PNG", "Convert a WebP image to PNG.", "format", ["png-to-webp", "webp-to-jpg"], { input: "webp", output: "png" }),
  image("png-to-webp", "PNG to WebP", "Convert a PNG image to WebP.", "format", ["webp-to-png", "png-to-jpg"], { input: "png", output: "webp" }),
  image("jpg-to-webp", "JPG to WebP", "Convert a JPG image to WebP.", "format", ["webp-to-jpg", "jpg-to-png"], { input: "jpeg", output: "webp" }),
  image("webp-to-jpg", "WebP to JPG", "Convert a WebP image to JPG with a white background for transparency.", "format", ["jpg-to-webp", "webp-to-png"], { input: "webp", output: "jpeg" }),
  image("image-resizer", "Image Resizer", "Resize an image by width and height while optionally keeping its aspect ratio.", "resize", ["image-cropper", "rotate-image"]),
  image("rotate-image", "Rotate Image", "Rotate an image 90, 180, or 270 degrees.", "rotate", ["flip-image", "image-resizer"]),
  image("flip-image", "Flip Image", "Flip an image horizontally or vertically.", "flip", ["rotate-image", "image-cropper"]),
  image("image-to-base64", "Image to Base64", "Turn an image into a data URL or raw Base64 text.", "encode", ["base64-to-image", "png-to-webp"]),
  image("base64-to-image", "Base64 to Image", "Preview and download an image from a data URL or raw Base64 text.", "decode", ["image-to-base64", "image-resizer"]),
  image("image-cropper", "Image Cropper", "Crop an image by entering its start position and output size in pixels.", "crop", ["image-resizer", "rotate-image"]),
];

export const tools = [...waveOneTools, ...generalConverters, ...pairConverters, ...imageTools];
