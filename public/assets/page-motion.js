(function () {
  var root = document.documentElement;
  var key = "dockfold:skip-page-motion";
  try {
    if (sessionStorage.getItem(key) === "1") root.dataset.pageMotion = "off";
    sessionStorage.removeItem(key);
  } catch {
    // Motion preferences must never block navigation when storage is unavailable.
  }

  document.addEventListener("keydown", function () {
    root.dataset.pageMotion = "off";
  }, { once: true });
  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    var url = new URL(link.href, location.href);
    if (url.origin !== location.origin ||
        (url.pathname === location.pathname && url.search === location.search)) return;
    try {
      sessionStorage.setItem(key, event.detail === 0 ? "1" : "0");
    } catch { /* Native links still work without storage. */ }
  });

  function prepare(event) {
    if (!event.viewTransition) return;
    root.dataset.nativePageTransition = "true";
    if (root.dataset.pageMotion === "off" ||
        matchMedia("(prefers-reduced-motion: reduce)").matches) {
      event.viewTransition.skipTransition();
    }
  }
  // Native document transitions preserve ordinary links, history and forms.
  window.addEventListener("pageswap", prepare);
  window.addEventListener("pagereveal", prepare);
})();
