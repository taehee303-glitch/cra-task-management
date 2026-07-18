function hasPendingAuthRedirect() {
  if (window.CloudSyncManager?.hasPendingAuthRedirect) {
    return window.CloudSyncManager.hasPendingAuthRedirect();
  }

  const href = window.location.href || "";
  if (href.includes("__/auth/")) return true;
  if (sessionStorage.getItem("cra-firebase-auth-redirect")) return true;
  if (window.__authInProgress || window.CloudSyncManager?.isAuthInProgress?.()) return true;
  return false;
}

async function purgeFitSpaceServiceWorkerCache() {
  const KEY = "cra_purge_fitspace_sw_v1";
  if (localStorage.getItem(KEY)) return false;

  let shouldReload = false;
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      const stale = keys.filter((k) => k.startsWith("fitspace"));
      if (stale.length) {
        await Promise.all(stale.map((k) => caches.delete(k)));
        shouldReload = true;
      }
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (regs.length) {
        await Promise.all(regs.map((reg) => reg.unregister()));
        shouldReload = true;
      }
    }
  } catch (error) {
    console.warn("FitSpace cache purge failed:", error);
  } finally {
    localStorage.setItem(KEY, "1");
  }
  return shouldReload;
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
purgeFitSpaceServiceWorkerCache().then((shouldReload) => {
  if (shouldReload) {
    window.location.reload();
    return;
  }
  registerServiceWorker();
});
