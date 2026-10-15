// Only fixed event names and page/tool identifiers cross this boundary.
(() => {
  const measurementId = document.currentScript?.dataset.measurementId;
  const allowed = new Set(["tool_open", "tool_used", "result_copied", "file_downloaded"]);
  const page = document.querySelector(".tool-page[data-tool][data-category]");
  const path = location.pathname;
  const identity = page ? { tool_slug: page.dataset.tool, category: page.dataset.category, page_path: path } : null;
  let timer;
  const track = eventName => {
    if (!measurementId || !identity || !allowed.has(eventName)) return;
    window.gtag("event", eventName, identity);
  };
  const usedDebounced = () => {
    clearTimeout(timer);
    timer = setTimeout(() => track("tool_used"), 900);
  };
  const cancelUsed = () => clearTimeout(timer);
  window.JiffyAnalytics = { track, usedDebounced, cancelUsed };
  if (!measurementId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false,
    page_location: location.origin + path,
    page_referrer: "",
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  window.gtag("event", "page_view", { page_location: location.origin + path, page_path: path, page_referrer: "" });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.append(script);
})();
