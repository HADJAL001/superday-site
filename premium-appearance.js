/* SUPER DAY — Approved Black Chrome / Executive Blue selector.
 * Presentation only; never changes API, billing, tasks, sessions or waitlist.
 */
(() => {
  "use strict";
  const STORAGE_KEY = "superday-premium-visual-mode-v1";
  const variants = { a: "Black Chrome", b: "Executive Blue" };

  function readMode() {
    try { return window.localStorage.getItem(STORAGE_KEY) === "b" ? "b" : "a"; }
    catch { return "a"; }
  }

  function mount() {
    const nav = document.querySelector(".nav-inner");
    if (!nav || document.getElementById("superday-appearance")) return;
    const control = document.createElement("div");
    control.id = "superday-appearance";
    control.className = "sd-appearance";
    control.setAttribute("role", "group");
    control.setAttribute("aria-label", "Внешний вид SUPER DAY");

    Object.entries(variants).forEach(([value, label]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.mode = value;
      btn.setAttribute("aria-label", label);
      btn.textContent = value === "a" ? "A · Chrome" : "B · Blue";
      btn.addEventListener("click", () => apply(value, true));
      control.appendChild(btn);
    });

    // Insert just before the navigation links so keyboard order stays predictable.
    const links = nav.querySelector("nav.links");
    nav.insertBefore(control, links);
    apply(readMode(), false);
  }

  function apply(value, persist) {
    const mode = value === "b" ? "b" : "a";
    document.body.dataset.superdayPremium = mode;
    document.querySelectorAll("#superday-appearance button[data-mode]")
      .forEach(btn => {
        const selected = btn.dataset.mode === mode;
        btn.setAttribute("aria-pressed", selected ? "true" : "false");
        btn.classList.toggle("is-current", selected);
      });
    if (persist) {
      try { window.localStorage.setItem(STORAGE_KEY, mode); }
      catch { /* Storage is optional. */ }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else mount();
})();
