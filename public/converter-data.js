// One source of truth for build-time copy and browser conversion. Factors map to
// the base unit of each quantity; temperature uses an affine conversion below.
const unit = (id, label, symbol, factor) => ({ id, label, symbol, factor });

export const quantities = {
  length: { name: "Length", base: "m", units: [unit("m", "Meters", "m", 1), unit("cm", "Centimeters", "cm", .01), unit("ft", "Feet", "ft", .3048), unit("in", "Inches", "in", .0254), unit("km", "Kilometers", "km", 1000), unit("mi", "Miles", "mi", 1609.344), unit("mm", "Millimeters", "mm", .001), unit("yd", "Yards", "yd", .9144)] },
  weight: { name: "Weight", base: "kg", units: [unit("kg", "Kilograms", "kg", 1), unit("lb", "Pounds", "lb", .45359237), unit("g", "Grams", "g", .001), unit("oz", "Ounces", "oz", .028349523125), unit("mg", "Milligrams", "mg", .000001), unit("t", "Metric tons", "t", 1000)] },
  temperature: { name: "Temperature", base: "c", units: [unit("c", "Celsius", "°C", 1), unit("f", "Fahrenheit", "°F", 1), unit("k", "Kelvin", "K", 1)] },
  area: { name: "Area", base: "m2", units: [unit("m2", "Square meters", "m²", 1), unit("ft2", "Square feet", "ft²", .09290304), unit("km2", "Square kilometers", "km²", 1e6), unit("mi2", "Square miles", "mi²", 2589988.110336), unit("cm2", "Square centimeters", "cm²", .0001), unit("ha", "Hectares", "ha", 10000), unit("ac", "Acres", "ac", 4046.8564224)] },
  volume: { name: "Volume", base: "l", units: [unit("l", "Liters", "L", 1), unit("ml", "Milliliters", "mL", .001), unit("gal", "US gallons", "US gal", 3.785411784), unit("floz", "US fluid ounces", "US fl oz", .0295735295625), unit("m3", "Cubic meters", "m³", 1000), unit("cup", "US cups", "US cup", .2365882365), unit("pt", "US pints", "US pt", .473176473)] },
  speed: { name: "Speed", base: "mps", units: [unit("kmh", "Kilometers per hour", "km/h", 1 / 3.6), unit("mph", "Miles per hour", "mph", .44704), unit("mps", "Meters per second", "m/s", 1), unit("knot", "Knots", "kn", 1852 / 3600), unit("fps", "Feet per second", "ft/s", .3048)] },
  time: { name: "Time", base: "s", units: [unit("h", "Hours", "h", 3600), unit("min", "Minutes", "min", 60), unit("s", "Seconds", "s", 1), unit("d", "Days", "d", 86400), unit("wk", "Weeks", "wk", 604800), unit("ms", "Milliseconds", "ms", .001)] },
  "data-storage": { name: "Data Storage", base: "B", units: [unit("MB", "Megabytes", "MB", 1e6), unit("GB", "Gigabytes", "GB", 1e9), unit("KB", "Kilobytes", "KB", 1e3), unit("TB", "Terabytes", "TB", 1e12), unit("B", "Bytes", "B", 1), unit("KiB", "Kibibytes", "KiB", 1024), unit("MiB", "Mebibytes", "MiB", 1048576), unit("GiB", "Gibibytes", "GiB", 1073741824), unit("TiB", "Tebibytes", "TiB", 1099511627776)] },
  energy: { name: "Energy", base: "J", units: [unit("J", "Joules", "J", 1), unit("kJ", "Kilojoules", "kJ", 1000), unit("cal", "Calories", "cal", 4.184), unit("kcal", "Kilocalories", "kcal", 4184), unit("Wh", "Watt-hours", "Wh", 3600), unit("kWh", "Kilowatt-hours", "kWh", 3.6e6), unit("BTU", "BTU (International Table)", "BTU", 1055.05585262)] },
  power: { name: "Power", base: "W", units: [unit("W", "Watts", "W", 1), unit("kW", "Kilowatts", "kW", 1000), unit("MW", "Megawatts", "MW", 1e6), unit("hp", "Mechanical horsepower", "hp", 745.6998715822702), unit("mW", "Milliwatts", "mW", .001)] },
  pressure: { name: "Pressure", base: "Pa", units: [unit("Pa", "Pascals", "Pa", 1), unit("kPa", "Kilopascals", "kPa", 1000), unit("bar", "Bars", "bar", 1e5), unit("psi", "Pounds per square inch", "psi", 6894.757293168), unit("atm", "Standard atmospheres", "atm", 101325), unit("mmHg", "Millimeters of mercury", "mmHg", 133.322387415)] },
  angle: { name: "Angle", base: "rad", units: [unit("deg", "Degrees", "°", Math.PI / 180), unit("rad", "Radians", "rad", 1), unit("grad", "Gradians", "grad", Math.PI / 200), unit("turn", "Turns", "turn", 2 * Math.PI), unit("arcmin", "Arcminutes", "′", Math.PI / 10800)] },
  frequency: { name: "Frequency", base: "Hz", units: [unit("Hz", "Hertz", "Hz", 1), unit("kHz", "Kilohertz", "kHz", 1e3), unit("MHz", "Megahertz", "MHz", 1e6), unit("GHz", "Gigahertz", "GHz", 1e9), unit("rpm", "Revolutions per minute", "rpm", 1 / 60)] },
};

// Ordered by clear search intent; only these pair pages are published.
export const pairSpecs = [
  ["length", "cm-to-inches", "cm", "in"], ["length", "inches-to-cm", "in", "cm"],
  ["length", "cm-to-feet", "cm", "ft"], ["length", "feet-to-cm", "ft", "cm"],
  ["length", "meters-to-feet", "m", "ft"], ["length", "feet-to-meters", "ft", "m"],
  ["length", "km-to-miles", "km", "mi"], ["length", "miles-to-km", "mi", "km"],
  ["length", "mm-to-inches", "mm", "in"], ["length", "inches-to-mm", "in", "mm"],
  ["weight", "kg-to-lbs", "kg", "lb"], ["weight", "lbs-to-kg", "lb", "kg"],
  ["weight", "grams-to-ounces", "g", "oz"], ["weight", "ounces-to-grams", "oz", "g"],
  ["temperature", "celsius-to-fahrenheit", "c", "f"], ["temperature", "fahrenheit-to-celsius", "f", "c"],
  ["temperature", "celsius-to-kelvin", "c", "k"], ["temperature", "kelvin-to-celsius", "k", "c"],
  ["data-storage", "mb-to-gb", "MB", "GB"], ["data-storage", "gb-to-mb", "GB", "MB"],
  ["data-storage", "kb-to-mb", "KB", "MB"], ["data-storage", "mb-to-kb", "MB", "KB"],
  ["data-storage", "gb-to-tb", "GB", "TB"], ["data-storage", "tb-to-gb", "TB", "GB"],
  ["speed", "kmh-to-mph", "kmh", "mph"], ["speed", "mph-to-kmh", "mph", "kmh"],
  ["speed", "meters-per-second-to-kmh", "mps", "kmh"], ["speed", "kmh-to-meters-per-second", "kmh", "mps"],
  ["time", "hours-to-minutes", "h", "min"], ["time", "minutes-to-hours", "min", "h"],
  ["time", "days-to-hours", "d", "h"], ["time", "hours-to-days", "h", "d"],
];

export const getUnit = (quantity, id) => quantities[quantity]?.units.find(unit => unit.id === id);

export function convert(quantity, from, to, input) {
  const source = getUnit(quantity, from), target = getUnit(quantity, to);
  if (!source || !target) throw new Error("Choose valid units.");
  const raw = String(input).trim();
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) throw new Error("Enter a valid number.");
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error("Enter a finite number.");
  let base;
  if (quantity === "temperature") {
    base = from === "c" ? value : from === "f" ? (value - 32) * 5 / 9 : value - 273.15;
    if (base < -273.15 - 1e-10) throw new Error("Temperature cannot be below absolute zero.");
    if (Math.abs(base + 273.15) < 1e-12) base = -273.15;
  } else base = value * source.factor;
  const answer = quantity === "temperature"
    ? to === "c" ? base : to === "f" ? base * 9 / 5 + 32 : base + 273.15
    : base / target.factor;
  if (!Number.isFinite(base) || !Number.isFinite(answer) || (quantity !== "temperature" && value !== 0 && answer === 0)) throw new Error("Value is outside the supported range.");
  return Object.is(answer, -0) ? 0 : answer;
}

export function formatNumber(value, digits = 10) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e12 || abs < 1e-6) return value.toExponential(Math.max(0, digits - 1)).replace(/(?:\.0+|(?<=\d)0+)e/, "e").replace("e+", "e+");
  return Number(value.toPrecision(digits)).toLocaleString("en-US", { maximumSignificantDigits: digits });
}
