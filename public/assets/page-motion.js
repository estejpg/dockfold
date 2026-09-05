(function () {
  // Native document transitions preserve ordinary links, history and forms.
  // Mark the document so the CSS entry animation yields to the native
  // transition instead of running on top of it. Reduced-motion preferences
  // are honoured in CSS through @view-transition and the animation rules.
  function prepare(event) {
    if (event.viewTransition)
      document.documentElement.dataset.nativePageTransition = "true";
  }
  window.addEventListener("pageswap", prepare);
  window.addEventListener("pagereveal", prepare);
})();
