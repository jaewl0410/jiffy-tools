(() => {
  const input = document.getElementById("tool-search");
  const results = document.getElementById("search-results");
  const status = document.getElementById("search-status");
  const index = JSON.parse(document.getElementById("search-index").textContent);
  const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  let matches = [];

  function update() {
    const query = normalize(input.value);
    results.replaceChildren();
    if (!query) {
      matches = [];
      results.hidden = true;
      status.textContent = "";
      return;
    }
    const terms = query.split(/\s+/);
    matches = index.map(tool => {
      const name = normalize(tool.name);
      const haystack = normalize(`${tool.name} ${tool.description} ${tool.category} ${tool.keywords}`);
      if (!terms.every(term => haystack.includes(term))) return null;
      const score = (name === query ? 100 : 0) + (name.startsWith(query) ? 40 : 0) + (name.includes(query) ? 20 : 0) + terms.filter(term => name.includes(term)).length * 5;
      return { ...tool, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    status.textContent = matches.length ? `${matches.length} ${matches.length === 1 ? "tool" : "tools"} found` : "No tools found. Try a different term.";
    for (const tool of matches.slice(0, 8)) {
      const anchor = document.createElement("a");
      anchor.href = tool.url;
      anchor.className = "search-result";
      const title = document.createElement("strong");
      title.textContent = tool.name;
      const category = document.createElement("small");
      category.textContent = tool.category;
      anchor.append(title, category);
      results.append(anchor);
    }
    results.hidden = !matches.length;
  }

  input.addEventListener("input", update);
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && matches.length) {
      window.location.href = matches[0].url;
    }
    if (event.key === "Escape") {
      input.value = "";
      update();
    }
  });
})();
