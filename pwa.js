function hasPendingAuthRedirect() {
  if (window.CloudSyncManager?.hasPendingAuthRedirect) {
    return window.CloudSyncManager.hasPendingAuthRedirect();
  }

  const href = window.location.href || "";
  return href.includes("__/auth/") || Boolean(sessionStorage.getItem("cra-firebase-auth-redirect"));
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "http:" && location.protocol !== "https:") return;
  if (hasPendingAuthRedirect()) return;

  window.addEventListener("load", () => {
    if (hasPendingAuthRedirect()) return;

    navigator.serviceWorker
      .register("./service-worker.js", { scope: "./" })
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const nextWorker = registration.installing;
          if (!nextWorker) return;

          nextWorker.addEventListener("statechange", () => {
            if (nextWorker.state === "installed" && navigator.serviceWorker.controller) {
              nextWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch((error) => {
        console.warn("Service Worker 등록 실패:", error);
      });
  });

  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded || hasPendingAuthRedirect()) return;
    reloaded = true;
    window.location.reload();
  });
}

function applyPwaDisplayMode() {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  document.body.classList.toggle("pwa-standalone", isStandalone);
}

applyPwaDisplayMode();
registerServiceWorker();
