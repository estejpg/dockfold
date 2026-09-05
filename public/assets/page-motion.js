(function () {
  var root = document.documentElement;
  var storageKey = "dockfold:keyboard-navigation";
  var maxAge = 5000;

  function rememberKeyboardNavigation() {
    root.dataset.navigationInput = "keyboard";
    try {
      sessionStorage.setItem(storageKey, String(Date.now()));
    } catch {
      // The outgoing document can still skip when storage is unavailable.
    }
  }

  function clearKeyboardNavigation() {
    delete root.dataset.navigationInput;
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // A blocked preference store must never block navigation.
    }
  }

  function hasRecentKeyboardNavigation() {
    if (root.dataset.navigationInput === "keyboard") return true;
    try {
      var recordedAt = Number(sessionStorage.getItem(storageKey));
      return (
        Number.isFinite(recordedAt) &&
        recordedAt > 0 &&
        Date.now() - recordedAt < maxAge
      );
    } catch {
      return false;
    }
  }

  function internalPageLink(event) {
    var link = event.target.closest && event.target.closest("a[href]");
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.hasAttribute("download") ||
      (link.target && link.target !== "_self")
    )
      return false;
    var url = new URL(link.href, location.href);
    return (
      url.origin === location.origin &&
      (url.pathname !== location.pathname || url.search !== location.search)
    );
  }

  document.addEventListener("click", function (event) {
    if (!internalPageLink(event)) return;
    // Keyboard-activated links dispatch click with detail 0. Pointer
    // navigation clears a stale keyboard marker from a cancelled navigation.
    if (event.detail === 0) rememberKeyboardNavigation();
    else clearKeyboardNavigation();
  });

  document.addEventListener("keydown", function (event) {
    // Browser back/forward keys do not dispatch a link click.
    if (
      (event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight")) ||
      event.key === "BrowserBack" ||
      event.key === "BrowserForward"
    )
      rememberKeyboardNavigation();
  });

  function prepare(event) {
    if (event.viewTransition && hasRecentKeyboardNavigation())
      event.viewTransition.skipTransition();
    // The incoming page owns cleanup so the marker survives the navigation.
    if (event.type === "pagereveal") clearKeyboardNavigation();
  }

  window.addEventListener("pageswap", prepare);
  window.addEventListener("pagereveal", prepare);
})();
