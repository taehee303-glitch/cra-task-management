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

async function purgeStaleAppShellCache() {
  const expectedBuild = document.querySelector('meta[name="app-build"]')?.content || "";
  const storageKey = "cra_app_shell_build";
  const storedBuild = localStorage.getItem(storageKey) || "";
  if (expectedBuild && storedBuild === expectedBuild) return false;

  let shouldReload = false;
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      const stale = keys.filter(
        (key) => key.startsWith("cra-task-manager-") || key.startsWith("fitspace")
      );
      if (stale.length) {
        await Promise.all(stale.map((key) => caches.delete(key)));
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
    if (expectedBuild) {
      localStorage.setItem(storageKey, expectedBuild);
    }
  } catch (error) {
    console.warn("App shell cache purge failed:", error);
  }
  return shouldReload;
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

function applyPwaDisplayMode() {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  document.body.classList.toggle("pwa-standalone", isStandalone);
}

applyPwaDisplayMode();

async function bootstrapPwa() {
  if (window.FIREBASE_CONFIG?.requireCloudAuth) {
    try {
      const regs = await navigator.serviceWorker?.getRegistrations?.();
      if (regs?.length) {
        await Promise.all(regs.map((reg) => reg.unregister()));
      }
    } catch (error) {
      console.warn("Service Worker cleanup for auth mode failed:", error);
    }
    return;
  }

  if (hasPendingAuthRedirect()) return;

  const purged = await purgeStaleAppShellCache();
  if (purged) {
    window.location.reload();
    return;
  }

  const fitspaceReload = await purgeFitSpaceServiceWorkerCache();
  if (fitspaceReload) {
    window.location.reload();
  }
}

bootstrapPwa();
