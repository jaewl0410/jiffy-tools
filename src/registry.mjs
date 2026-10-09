export const categories = [
  { slug: "text", name: "Text", description: "Count, clean, and transform text in your browser." },
  { slug: "developer", name: "Developer", description: "Everyday encoding, JSON, IDs, and time tools." },
  { slug: "calculators", name: "Calculators", description: "Quick answers for percentages, dates, and music timing." },
  { slug: "converters", name: "Converters", description: "Simple unit and format converters are coming in the next wave." },
];

const text = (slug, name, description, engine, example, related) => ({ slug, name, description, category: "text", engine, example, related });
const dev = (slug, name, description, engine, example, related) => ({ slug, name, description, category: "developer", engine, example, related });
const calc = (slug, name, description, engine, example, related, fields) => ({ slug, name, description, category: "calculators", engine, example, related, fields });

export const tools = [
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
