/* SUPER DAY legal / support visual continuity.
 * Presentation only; never reads form data or changes support/payment flows.
 */
(() => {
  "use strict";
  const KEY = "superday-premium-visual-mode-v1";
  const read = () => {
    try { return localStorage.getItem(KEY) === "b" ? "b" : "a"; }
    catch { return "a"; }
  };
  function apply(mode, persist) {
    const m = mode === "b" ? "b" : "a";
    document.documentElement.dataset.sdLegal = m;
    document.querySelectorAll(".sd-legal-theme-choice").forEach(button => {
      const selected = button.dataset.theme === m;
      button.classList.toggle("is-current", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    if (persist) {
      try { localStorage.setItem(KEY, m); } catch { /* Visual only. */ }
    }
  }
  function mount() {
    const header = document.querySelector(".legal-header");
    if (!header || document.querySelector(".sd-legal-theme-bar")) return;
    const bar = document.createElement("div");
    bar.className = "sd-legal-theme-bar";
    const row = document.createElement("div");
    row.className = "legal-wrap sd-legal-theme-inner";
    const description = document.createElement("span");
    description.className = "sd-legal-theme-caption";
    description.textContent = "Оформление";
    const group = document.createElement("div");
    group.className = "sd-legal-theme-group";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Оформление SUPER DAY");
    for (const [code, name] of [["a", "Black Chrome"], ["b", "Executive Blue"]]) {
      const button = document.createElement("button");
      button.className = "sd-legal-theme-choice";
      button.type = "button";
      button.dataset.theme = code;
      button.textContent = code === "a" ? "A · Chrome" : "B · Blue";
      button.setAttribute("aria-label", name);
      button.addEventListener("click", () => apply(code, true));
      group.appendChild(button);
    }
    row.appendChild(description);
    row.appendChild(group);
    bar.appendChild(row);
    header.insertAdjacentElement("afterend", bar);
    window.addEventListener("storage", event => {
      if (event.key === KEY) apply(event.newValue, false);
    });
    apply(read(), false);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once:true });
  } else mount();
})();
