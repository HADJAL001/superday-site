(function () {
  "use strict";

  var ENDPOINT = "https://158.160.192.153/site-api/support";
  var form = document.getElementById("supportForm");
  var status = document.getElementById("supportStatus");
  var submit = document.getElementById("supportSubmit");
  var TOPICS = { technical: true, billing: true, privacy: true, other: true };

  if (!form || !status || !submit) return;

  function setStatus(state, message) {
    status.dataset.state = state || "";
    status.textContent = message || "";
    if (message) status.setAttribute("tabindex", "-1");
    else status.removeAttribute("tabindex");
  }

  function setBusy(busy) {
    submit.disabled = busy;
    submit.setAttribute("aria-busy", busy ? "true" : "false");
    submit.textContent = busy ? "Отправляем..." : "Отправить обращение";
  }

  function ticketResponse(value) {
    if (!value || value.ok !== true) return null;
    if (typeof value.ticket_id !== "string" || !/^SD-\d{8}-[A-F0-9]{12}$/.test(value.ticket_id)) return null;
    if (typeof value.created_at !== "string" || !isFinite(Date.parse(value.created_at))) return null;
    return value.ticket_id;
  }

  function payloadFromForm() {
    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim().toLowerCase();
    var topic = form.elements.topic.value;
    var message = form.elements.message.value.trim();
    var consent = form.elements.consent.checked;

    if (name.length < 2 || name.length > 100) throw new Error("validation");
    if (!form.elements.email.checkValidity() || email.length > 254) throw new Error("validation");
    if (!TOPICS[topic]) throw new Error("validation");
    if (message.length < 10 || message.length > 4000) throw new Error("validation");
    if (!consent) throw new Error("validation");

    return {
      name: name,
      email: email,
      topic: topic,
      message: message,
      consent: true,
      codeword: "mellivora",
      source: "web"
    };
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    setStatus("", "");

    if (!form.reportValidity()) return;

    var payload;
    try {
      payload = payloadFromForm();
    } catch (error) {
      setStatus("error", "Проверьте заполненные поля и подтвердите согласие на обработку данных.");
      status.focus();
      return;
    }

    var controller = "AbortController" in window ? new AbortController() : null;
    var timer = controller ? window.setTimeout(function () { controller.abort(); }, 20000) : null;
    setBusy(true);
    setStatus("pending", "Отправляем обращение в поддержку...");

    fetch(ENDPOINT, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      var type = response.headers.get("content-type") || "";
      if (response.status !== 201 || type.toLowerCase().indexOf("application/json") === -1) {
        throw new Error("http_" + response.status);
      }
      return response.json();
    }).then(function (data) {
      var ticket = ticketResponse(data);
      if (!ticket) throw new Error("invalid_response");
      form.reset();
      setStatus("success", "Обращение принято. Номер: " + ticket + ". Сохраните его для проверки ответа.");
      status.focus();
    }).catch(function (error) {
      var message = error && error.name === "AbortError"
        ? "Сервер не ответил вовремя. Обращение не подтверждено; повторите отправку."
        : "Не удалось подтвердить отправку. Обращение не принято; проверьте соединение и повторите попытку.";
      setStatus("error", message);
      status.focus();
    }).finally(function () {
      if (timer) window.clearTimeout(timer);
      setBusy(false);
    });
  });
})();
