const tapButton = document.getElementById("tap-button");
const resetButton = document.getElementById("reset-button");
const bpmOutput = document.getElementById("bpm");
const status = document.getElementById("tap-status");

const MAX_INTERVALS = 8;
const PAUSE_MS = 5000;
const MIN_INTERVAL_MS = 120;

let lastTap = null;
let intervals = [];

function reset() {
  lastTap = null;
  intervals = [];
  bpmOutput.textContent = "—";
  status.textContent = "Tap the button or press Space to begin.";
}

function tap() {
  const now = performance.now();

  if (lastTap !== null) {
    const interval = now - lastTap;

    if (interval < MIN_INTERVAL_MS) return;

    if (interval >= PAUSE_MS) {
      intervals = [];
      bpmOutput.textContent = "—";
    } else {
      intervals.push(interval);
      if (intervals.length > MAX_INTERVALS) intervals.shift();
    }
  }

  lastTap = now;

  if (intervals.length === 0) {
    status.textContent = "Tap again to see your BPM.";
    return;
  }

  const totalInterval = intervals.reduce((sum, interval) => sum + interval, 0);
  const bpm = Math.round((60000 * intervals.length) / totalInterval);
  bpmOutput.textContent = String(bpm);
  status.textContent = `${bpm} BPM. Average of ${intervals.length} recent ${intervals.length === 1 ? "interval" : "intervals"}.`;
}

tapButton.addEventListener("click", tap);
resetButton.addEventListener("click", reset);

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;

  const target = event.target;
  if (target instanceof Element && target.closest("input, textarea, select, button, [contenteditable], [role='button']")) return;

  event.preventDefault();
  tap();
});
