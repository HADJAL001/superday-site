(function () {
  "use strict";

  document.querySelectorAll("[data-copy-codeword]").forEach(function (button) {
    var input = document.getElementById(button.getAttribute("data-copy-target") || "");
    var status = button.closest(".verification-token").querySelector("[data-copy-status]");
    if (!input || !status) return;

    function showCopied() {
      button.textContent = "Скопировано";
      status.textContent = "Код mellivora скопирован.";
      window.setTimeout(function () { button.textContent = "Копировать"; status.textContent = ""; }, 2500);
    }

    function selectForManualCopy() {
      input.focus();
      input.select();
      input.setSelectionRange(0, input.value.length);
      status.textContent = "Код выделен. Скопируйте его через меню браузера.";
    }

    button.addEventListener("click", function () {
      var text = input.value;
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(text).then(showCopied).catch(selectForManualCopy);
        return;
      }
      selectForManualCopy();
      try {
        if (document.execCommand("copy")) showCopied();
      } catch (error) {
        // Поле уже выделено для ручного копирования.
      }
    });
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {
        // Документы остаются доступны по сети, даже если браузер запретил SW.
      });
    });
  }
})();
