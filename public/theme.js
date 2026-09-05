(function () {
  try {
    var t = localStorage.getItem("dockfold:theme");
    document.documentElement.dataset.theme =
      t === "dark" || t === "light"
        ? t
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
  } catch {
    // A blocked preference store should not prevent the page from loading.
  }
})();
