(() => {
  const isGitHubPages = window.location.hostname === "spnkd.github.io";
  window.HUMANLY_CONFIG = {
    // GitHub Pages uses the public Yandex API Gateway; local demo keeps its relative proxy path.
    apiBaseUrl: isGitHubPages ? "https://d5dk89ppio7pjn77uh2g.7qsg961h.apigw.yandexcloud.net" : ""
  };
})();
