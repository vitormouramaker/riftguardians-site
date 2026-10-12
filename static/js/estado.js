/* Página "Estado do servidor": lê o arquivo público de estado e mostra em texto.
   É o único script do site e o único pedido para fora dele. Sem cookies, sem armazenamento, sem rastreio.
   A página não confere a assinatura do arquivo (o jogo confere); aqui é só informação. */
(function () {
  "use strict";
  var box = document.getElementById("estado");
  if (!box || !window.fetch) { return; }
  var en = document.documentElement.lang.indexOf("en") === 0;
  var url = box.getAttribute("data-url");
  var T = en ? {
    loading: "Checking…",
    ok: "Online services are working",
    maintenance: "Server under maintenance",
    full: "Server is full",
    pvp_paused: "Online PvP is paused",
    error: "Could not read the status file right now",
    errorHelp: "This does not mean the server is down. Open the file directly using the link below, or try again in a few minutes.",
    version: "Current version", min: "Minimum version for online play", until: "Expected back", issued: "Status published", message: "Message"
  } : {
    loading: "Consultando…",
    ok: "Serviços online funcionando",
    maintenance: "Servidor em manutenção",
    full: "Servidor lotado",
    pvp_paused: "PvP online pausado",
    error: "Não foi possível ler o arquivo de estado agora",
    errorHelp: "Isso não quer dizer que o servidor caiu. Abra o arquivo direto pelo link abaixo ou tente de novo em alguns minutos.",
    version: "Versão atual", min: "Versão mínima para o online", until: "Previsão de volta", issued: "Estado publicado em", message: "Mensagem"
  };

  function el(tag, text) {
    var node = document.createElement(tag);
    if (text !== undefined) { node.textContent = text; }
    return node;
  }
  function decode(base64) {
    var bin = atob(base64), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) { bytes[i] = bin.charCodeAt(i); }
    return new TextDecoder("utf-8").decode(bytes);
  }
  function when(value) {
    var date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
    return isNaN(date.getTime()) ? "" : date.toLocaleString(en ? "en" : "pt-BR", { dateStyle: "medium", timeStyle: "short" });
  }
  function show(state, title, rows, extra) {
    box.setAttribute("data-estado", state);
    box.textContent = "";
    var heading = el("p", title);
    heading.className = "estado-titulo";
    box.appendChild(heading);
    if (extra) { box.appendChild(el("p", extra)); }
    if (rows && rows.length) {
      var list = el("dl");
      rows.forEach(function (row) {
        if (!row[1]) { return; }
        list.appendChild(el("dt", row[0]));
        list.appendChild(el("dd", row[1]));
      });
      box.appendChild(list);
    }
  }

  show("carregando", T.loading);
  fetch(url, { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" })
    .then(function (response) {
      if (!response.ok) { throw new Error("http " + response.status); }
      return response.json();
    })
    .then(function (envelope) {
      var data = JSON.parse(decode(envelope.payload));
      var state = ["ok", "maintenance", "full", "pvp_paused"].indexOf(data.state) >= 0 ? data.state : "ok";
      var message = data.message ? (en ? data.message.en : data.message.pt) || "" : "";
      show(state, T[state], [
        [T.message, message],
        [T.until, data.until ? when(data.until) : ""],
        [T.version, data.latestVersion || ""],
        [T.min, data.minVersion || ""],
        [T.issued, data.issuedAt ? when(data.issuedAt) : ""]
      ]);
    })
    .catch(function () {
      show("erro", T.error, null, T.errorHelp);
    });
})();
