/* SUPER DAY / Approved Black Chrome + Executive Blue.
 * Theme selection and accessible presentation navigation only.
 * No billing, account, planner, waitlist or network side effects.
 */
(() => {
  "use strict";
  const KEY = "superday-premium-visual-mode-v1";
  const modes = { a: "Black Chrome", b: "Executive Blue" };
  const MOBILE_WIDTH = 820;
  const readMode = () => {
    try { return window.localStorage.getItem(KEY) === "b" ? "b" : "a"; }
    catch { return "a"; }
  };

  function apply(mode, persist) {
    const normalized = mode === "b" ? "b" : "a";
    document.body.dataset.superdayPremium = normalized;
    document.querySelectorAll("#superday-appearance button[data-mode]").forEach(button => {
      const selected = button.dataset.mode === normalized;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("is-current", selected);
    });
    if (persist) {
      try { window.localStorage.setItem(KEY, normalized); }
      catch { /* Theme is optional; keep the site usable without storage. */ }
    }
  }

  function mount() {
    const header = document.querySelector(".nav-inner");
    const nav = header && header.querySelector("nav.links");
    if (!header || !nav || document.getElementById("superday-appearance")) return;

    nav.id = nav.id || "superday-site-links";
    const appearance = document.createElement("div");
    appearance.id = "superday-appearance";
    appearance.className = "sd-appearance";
    appearance.setAttribute("role", "group");
    appearance.setAttribute("aria-label", "Оформление сайта");

    Object.entries(modes).forEach(([value, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.mode = value;
      button.setAttribute("aria-label", label);
      button.textContent = value === "a" ? "A · Chrome" : "B · Blue";
      button.addEventListener("click", () => apply(value, true));
      appearance.appendChild(button);
    });

    const mobileMenu = document.createElement("button");
    mobileMenu.className = "sd-nav-toggle";
    mobileMenu.type = "button";
    mobileMenu.setAttribute("aria-label", "Открыть меню");
    mobileMenu.setAttribute("aria-controls", nav.id);
    mobileMenu.setAttribute("aria-expanded", "false");
    mobileMenu.innerHTML = '<span class="sd-menu-lines" aria-hidden="true"><i></i><i></i><i></i></span><span class="sd-menu-caption">Меню</span>';
    header.insertBefore(appearance, nav);
    header.insertBefore(mobileMenu, nav);

    const closeMenu = (returnFocus = false) => {
      nav.classList.remove("is-open");
      mobileMenu.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-label", "Открыть меню");
      if (returnFocus) mobileMenu.focus();
    };

    mobileMenu.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      mobileMenu.setAttribute("aria-expanded", String(open));
      mobileMenu.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    });
    nav.addEventListener("click", event => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) closeMenu(true);
    });
    document.addEventListener("click", event => {
      if (nav.classList.contains("is-open") && !header.contains(event.target)) closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > MOBILE_WIDTH && nav.classList.contains("is-open")) closeMenu();
    }, { passive: true });
    window.addEventListener("storage", event => {
      if (event.key === KEY) apply(event.newValue, false);
    });
    apply(readMode(), false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else mount();
})();
