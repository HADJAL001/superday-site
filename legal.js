(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {
      // Документы остаются доступны по сети, даже если браузер запретил SW.
    });
  });
})();
