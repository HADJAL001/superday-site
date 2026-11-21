/* SUPER DAY web planner: read-only bridge to approved site appearance.
 * The planner's explicit daylight/emerald themes always take priority.
 * Does not alter tasks, server calls, payments, maps or saved planner theme.
 */
(() => {
  "use strict";
  const KEY = "superday-premium-visual-mode-v1";
  const apply = value => {
    document.documentElement.dataset.superdayPremium = value === "b" ? "b" : "a";
  };
  try { apply(window.localStorage.getItem(KEY)); }
  catch { apply("a"); }
  window.addEventListener("storage", event => {
    if (event.key === KEY) apply(event.newValue);
  });
})();
