import { convert, formatNumber, getUnit } from "./converter-data.js";

const ui = document.querySelector(".converter-ui");
if (ui) {
  const quantity = ui.dataset.quantity;
  const input = document.getElementById("converter-value");
  const fromSelect = document.getElementById("converter-from");
  const toSelect = document.getElementById("converter-to");
  const result = document.getElementById("converter-result");
  const status = document.getElementById("converter-status");
  const from = () => fromSelect?.value || ui.dataset.from;
  const to = () => toSelect?.value || ui.dataset.to;
  let copyText = "";

  function update() {
    copyText = "";
    status.textContent = "";
    status.classList.remove("error");
    if (!input.value.trim()) {
      result.textContent = "Enter a value to convert.";
      return;
    }
    try {
      const converted = convert(quantity, from(), to(), input.value);
      copyText = `${formatNumber(converted, Number(ui.dataset.precision) || 10)} ${getUnit(quantity, to()).symbol}`;
      result.textContent = copyText;
    } catch (error) {
      result.textContent = "—";
      status.textContent = error.message;
      status.classList.add("error");
    }
  }

  input.addEventListener("input", update);
  fromSelect?.addEventListener("change", update);
  toSelect?.addEventListener("change", update);
  document.getElementById("converter-swap")?.addEventListener("click", () => {
    [fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value];
    update();
  });
  document.getElementById("converter-copy").addEventListener("click", async () => {
    if (!copyText) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(copyText);
      status.textContent = "Result copied.";
      status.classList.remove("error");
    } catch {
      const helper = document.createElement("textarea");
      helper.value = copyText;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.append(helper);
      helper.select();
      let copied = false;
      try { copied = document.execCommand?.("copy") || false; } catch { /* Manual copy remains available. */ }
      helper.remove();
      status.textContent = copied ? "Result copied." : "Clipboard unavailable. Select the result above to copy it.";
      status.classList.toggle("error", !copied);
    }
  });
  update();
}
