(function () {
  var isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.add(isDark ? "dark" : "light");
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", function (e) {
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(e.matches ? "dark" : "light");
    });
})();
