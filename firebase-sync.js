/**
 * Firebase Auth + Firestore 클라우드 동기화
 * 로그인 시 PC·휴대폰 간 데이터 실시간 공유
 */
(function () {
  const META_DOC = "meta";
  const REDIRECT_PENDING_KEY = "cra-firebase-auth-redirect";
  const DEBOUNCE_MS = 400;
  const TAB_ID =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const state = {
    app: null,
    auth: null,
    db: null,
    user: null,
    sources: {},
    listeners: [],
    pendingKeys: new Set(),
    debounceTimer: null,
    suppressRemoteUntil: 0,
    refreshCallback: null,
    uiCallback: null,
    authErrorCallback: null,
    signedInEntryCallback: null,
    ready: false,
    syncing: false,
    gisInitialized: false,
    gisCredentialHandler: null,
    initialAuthResolved: false,
    initialAuthWaiters: [],
    signedInSyncWaiters: [],
    authInProgress: false,
    suppressSignOutUntil: 0,
    initialAuthNullSeen: false,
    persistenceMode: null,
    everAuthenticatedThisPage: false,
    pageLoadedAt: Date.now(),
    signInWaiters: [],
  };

  function isAuthInProgress() {
    return Boolean(state.authInProgress || window.__authInProgress);
  }

  function setAuthInProgress(active) {
    state.authInProgress = Boolean(active);
    window.__authInProgress = Boolean(active);
  }

  async function unregisterServiceWorkersForAuth() {
    if (!("serviceWorker" in navigator)) return;
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch (err) {
      console.warn("Service Worker unregister before auth failed:", err);
    }
  }

  function requiresAuth() {
    if (!isConfigured()) return Boolean(window.FIREBASE_CONFIG?.requireCloudAuth);
    return window.FIREBASE_CONFIG?.requireCloudAuth !== false;
  }

  function resolveInitialAuthWaiters() {
    const waiters = state.initialAuthWaiters.splice(0);
    waiters.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    });
  }

  function resolveSignedInSyncWaiters() {
    if (!isSignedIn() || !state.ready) return;
    const waiters = state.signedInSyncWaiters.splice(0);
    waiters.forEach(({ resolve, timer }) => {
      if (timer) clearTimeout(timer);
      try {
        resolve(state.user);
      } catch {
        /* ignore */
      }
    });
  }

  function rejectSignedInSyncWaiters(err) {
    const waiters = state.signedInSyncWaiters.splice(0);
    waiters.forEach(({ reject, timer }) => {
      if (timer) clearTimeout(timer);
      try {
        reject(err);
      } catch {
        /* ignore */
      }
    });
  }

  function waitForAuthUser(timeoutMs = 30000) {
    if (!state.auth) {
      return Promise.reject(new Error("Firebase Auth가 초기화되지 않았습니다."));
    }
    if (state.auth.currentUser) {
      return Promise.resolve(state.auth.currentUser);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsub();
        reject({
          code: "auth/timeout",
          message:
            "Google 로그인 확인 시간이 초과되었습니다. 팝업 차단·회사 보안 정책·네트워크를 확인한 뒤 다시 시도해 주세요.",
        });
      }, timeoutMs);

      const unsub = state.auth.onAuthStateChanged((user) => {
        if (!user) return;
        clearTimeout(timer);
        unsub();
        resolve(user);
      });
    });
  }

  function withTimeout(promise, timeoutMs, timeoutError) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          timeoutError || {
            code: "auth/sync-timeout",
            message: "클라우드 요청 시간이 초과되었습니다. 네트워크 또는 Firestore Rules를 확인해 주세요.",
          }
        );
      }, timeoutMs);
      Promise.resolve(promise)
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  function waitUntilSignedIn(timeoutMs = 0) {
    if (isSignedIn()) {
      return Promise.resolve(state.user);
    }

    const waitPromise = new Promise((resolve, reject) => {
      state.signInWaiters.push({ resolve, reject });
    });

    if (!timeoutMs) return waitPromise;

    return withTimeout(waitPromise, timeoutMs, {
      code: "auth/timeout",
      message: "Google 로그인 확인 시간이 초과되었습니다. 다시 시도해 주세요.",
    });
  }

  function notifySignedInWaiters() {
    if (!isSignedIn()) return;
    state.signInWaiters.splice(0).forEach((entry) => entry.resolve(state.user));
  }

  function rejectSignedInWaiters(err) {
    state.signInWaiters.splice(0).forEach((entry) => entry.reject(err));
  }

  function waitUntilSignedInAndSynced(timeoutMs = 30000) {
    if (isSignedIn() && state.ready) {
      return Promise.resolve(state.user);
    }

    return withTimeout(
      new Promise((resolve, reject) => {
        const entry = { resolve, reject };
        entry.timer = setTimeout(() => {
          const idx = state.signedInSyncWaiters.indexOf(entry);
          if (idx !== -1) state.signedInSyncWaiters.splice(idx, 1);
          reject({
            code: "auth/sync-timeout",
            message:
              "로그인 확인 시간이 초과되었습니다. 팝업 차단·회사 네트워크·Firebase 설정을 확인해 주세요.",
          });
        }, timeoutMs);
        state.signedInSyncWaiters.push(entry);
      }),
      timeoutMs + 1000,
      {
        code: "auth/sync-timeout",
        message:
          "로그인 확인 시간이 초과되었습니다. 팝업 차단·회사 네트워크·Firebase 설정을 확인해 주세요.",
      }
    );
  }

  function waitForInitialAuth() {
    if (state.initialAuthResolved) {
      return Promise.resolve({ signedIn: isSignedIn(), user: state.user });
    }
    return new Promise((resolve) => {
      state.initialAuthWaiters.push(() => {
        resolve({ signedIn: isSignedIn(), user: state.user });
      });
    });
  }

  function notifySignedInSyncReady() {
    resolveSignedInSyncWaiters();
  }

  function isConfigured() {
    const cfg = window.FIREBASE_CONFIG;
    if (!cfg) return false;
    return Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
  }

  function isSignedIn() {
    return Boolean(state.user);
  }

  function isActive() {
    return isConfigured() && isSignedIn() && state.ready;
  }

  function userRoot() {
    return state.db.collection("users").doc(state.user.uid);
  }

  function dataDoc(key) {
    return userRoot().collection("data").doc(key);
  }

  function metaDoc() {
    return userRoot().collection("data").doc(META_DOC);
  }

  function notifyUi() {
    if (typeof state.uiCallback === "function") {
      state.uiCallback({
        configured: isConfigured(),
        signedIn: isSignedIn(),
        syncing: state.syncing,
        user: state.user,
      });
    }
  }

  function notifyRefresh() {
    if (typeof state.refreshCallback === "function") {
      state.refreshCallback();
    }
  }

  function registerSources(map) {
    state.sources = map || {};
  }

  function setRefreshCallback(fn) {
    state.refreshCallback = fn;
  }

  function setUiCallback(fn) {
    state.uiCallback = fn;
  }

  function setAuthErrorCallback(fn) {
    state.authErrorCallback = fn;
  }

  function reportAuthError(message) {
    if (typeof state.authErrorCallback === "function") {
      state.authErrorCallback(message);
      return;
    }
    alert(message);
  }

  function localHasAnyData() {
    return Object.values(state.sources).some((source) => {
      try {
        const raw = localStorage.getItem(source.localStorageKey);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.length > 0;
        return parsed && typeof parsed === "object" && Object.keys(parsed).length > 0;
      } catch {
        return false;
      }
    });
  }

  const FIRESTORE_OP_TIMEOUT_MS = 15000;

  async function readRemoteDoc(key) {
    const snap = await withTimeout(
      dataDoc(key).get({ source: "default" }),
      FIRESTORE_OP_TIMEOUT_MS,
      {
        code: "auth/sync-timeout",
        message: `Firestore 읽기 시간 초과 (${key}). 회사 네트워크에서 firestore.googleapis.com 차단 여부를 확인해 주세요.`,
      }
    );
    if (!snap.exists) return null;
    return snap.data();
  }

  async function writeMetaDoc(payload) {
    await withTimeout(metaDoc().set(payload, { merge: true }), FIRESTORE_OP_TIMEOUT_MS, {
      code: "auth/sync-timeout",
      message: "Firestore 메타 저장 시간 초과. Firestore Rules 배포와 네트워크를 확인해 주세요.",
    });
  }

  async function cloudHasAnyData() {
    const meta = await readRemoteDoc(META_DOC);
    if (meta?.initialized) return true;

    const keys = Object.keys(state.sources);
    for (const key of keys) {
      const remote = await readRemoteDoc(key);
      if (!remote) continue;
      if (Array.isArray(remote.items) && remote.items.length > 0) return true;
      if (remote.data && typeof remote.data === "object" && Object.keys(remote.data).length > 0) {
        return true;
      }
    }
    return false;
  }

  function applyRemoteEntry(key, remote) {
    const source = state.sources[key];
    if (!source || !remote) return;

    if (source.kind === "array") {
      source.applyPayload(Array.isArray(remote.items) ? remote.items : []);
      return;
    }

    source.applyPayload(remote.data && typeof remote.data === "object" ? remote.data : {});
  }

  function buildPayload(key) {
    const source = state.sources[key];
    if (!source) return null;

    const updatedAt = new Date().toISOString();
    if (source.kind === "array") {
      return {
        items: source.getPayload(),
        updatedAt,
        tabId: TAB_ID,
      };
    }

    return {
      data: source.getPayload(),
      updatedAt,
      tabId: TAB_ID,
    };
  }

  function shouldIgnoreRemote(remote) {
    if (!remote?.updatedAt) return false;
    if (Date.now() < state.suppressRemoteUntil) return true;
    if (remote.tabId && remote.tabId === TAB_ID) {
      const ageMs = Date.now() - Date.parse(remote.updatedAt);
      if (!Number.isNaN(ageMs) && ageMs < 2500) return true;
    }
    return false;
  }

  async function pushKey(key) {
    if (!isActive()) return;
    const payload = buildPayload(key);
    if (!payload) return;

    state.suppressRemoteUntil = Date.now() + 1200;
    await dataDoc(key).set(payload, { merge: true });
  }

  async function flushPending() {
    if (!isActive() || state.pendingKeys.size === 0) return;

    const keys = [...state.pendingKeys];
    state.pendingKeys.clear();

    state.syncing = true;
    notifyUi();

    try {
      for (const key of keys) {
        await pushKey(key);
      }
      await metaDoc().set(
        {
          initialized: true,
          lastSyncedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } finally {
      state.syncing = false;
      notifyUi();
      notifySignedInSyncReady();
    }
  }

  function schedulePush(key) {
    if (!isActive() || !state.sources[key]) return;
    state.pendingKeys.add(key);
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
      flushPending().catch((err) => {
        console.warn("Cloud sync push failed:", err);
      });
    }, DEBOUNCE_MS);
  }

  function notifyChange(key) {
    schedulePush(key);
  }

  function stopListeners() {
    state.listeners.forEach((unsub) => {
      try {
        unsub();
      } catch {
        /* ignore */
      }
    });
    state.listeners = [];
  }

  function startListeners() {
    stopListeners();
    if (!isActive()) return;

    Object.keys(state.sources).forEach((key) => {
      const unsub = dataDoc(key).onSnapshot(
        (snap) => {
          if (!snap.exists) return;
          const remote = snap.data();
          if (shouldIgnoreRemote(remote)) return;
          applyRemoteEntry(key, remote);
          notifyRefresh();
        },
        (err) => {
          console.warn(`Cloud sync listener failed (${key}):`, err);
        }
      );
      state.listeners.push(unsub);
    });
  }

  async function uploadAllLocal() {
    if (!isActive()) return;
    state.syncing = true;
    notifyUi();

    try {
      const keys = Object.keys(state.sources);
      for (const key of keys) {
        await pushKey(key);
      }
      await metaDoc().set(
        {
          initialized: true,
          migratedFromLocalAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } finally {
      state.syncing = false;
      notifyUi();
      notifySignedInSyncReady();
    }
  }

  async function downloadAllCloud() {
    if (!isActive()) return;
    state.syncing = true;
    notifyUi();

    try {
      const keys = Object.keys(state.sources);
      for (const key of keys) {
        const remote = await readRemoteDoc(key);
        if (remote) applyRemoteEntry(key, remote);
      }
      notifyRefresh();
    } finally {
      state.syncing = false;
      notifyUi();
      notifySignedInSyncReady();
    }
  }

  async function resolveInitialSync() {
    const metaSnap = await withTimeout(metaDoc().get(), FIRESTORE_OP_TIMEOUT_MS);
    const initialized = metaSnap.exists && metaSnap.data()?.initialized;
    const hasLocal = localHasAnyData();
    const hasCloud = initialized ? true : await cloudHasAnyData();
    const mandatory = requiresAuth();

    if (initialized || hasCloud) {
      await downloadAllCloud();
      return;
    }

    if (hasLocal) {
      if (mandatory) {
        await uploadAllLocal();
        return;
      }

      const upload = window.confirm(
        "이 기기의 로컬 데이터를 클라우드에 업로드할까요?\n\n" +
          "예: PC 데이터를 클라우드에 저장해 휴대폰과 공유\n" +
          "아니오: 빈 클라우드로 시작 (로컬 데이터는 이 기기에만 유지)"
      );
      if (upload) {
        await uploadAllLocal();
        return;
      }
      await writeMetaDoc({
        initialized: true,
        skippedLocalUploadAt: new Date().toISOString(),
      });
      return;
    }

    await writeMetaDoc({ initialized: true });
  }

  async function runBackgroundCloudSync() {
    state.syncing = true;
    notifyUi();
    try {
      await resolveInitialSync();
      startListeners();
    } catch (err) {
      console.error("Background cloud sync failed:", err);
      const message =
        err?.code === "permission-denied"
          ? "Firestore 접근 거부 — Firebase Console에서 firestore.rules를 배포해 주세요."
          : err?.message || "클라우드 동기화에 실패했습니다. 네트워크 연결을 확인해 주세요.";
      reportAuthError(message);
    } finally {
      state.syncing = false;
      notifyUi();
      if (window.__appBootstrapFinished) {
        notifyRefresh();
      }
    }
  }

  async function handleSignedIn(user) {
    if (state.user?.uid === user.uid && state.ready) {
      return;
    }

    state.everAuthenticatedThisPage = true;
    state.user = user;
    state.ready = true;
    state.suppressSignOutUntil = Date.now() + 120000;
    clearPersistedAuthError();
    persistAuthStatus(`signed-in:${user.uid}`);
    notifyUi();
    notifySignedInWaiters();
    notifySignedInSyncReady();

    if (typeof state.signedInEntryCallback === "function") {
      try {
        void state.signedInEntryCallback(user);
      } catch (err) {
        console.error("Signed-in entry callback failed:", err);
      }
    }

    void runBackgroundCloudSync();
  }

  function handleSignedOut() {
    if (isAuthInProgress()) return;
    if (Date.now() < state.suppressSignOutUntil) return;
    if (state.auth?.currentUser) {
      void syncCurrentAuthUser();
      return;
    }
    if (!state.everAuthenticatedThisPage && !state.user) return;

    stopListeners();
    state.user = null;
    state.ready = false;
    state.pendingKeys.clear();
    clearTimeout(state.debounceTimer);
    persistAuthStatus("signed-out");
    if (state.everAuthenticatedThisPage) {
      persistAuthError({
        code: "auth/session-lost",
        message:
          "로그인 세션이 유지되지 않았습니다. Chrome에서 taehee303-glitch.github.io 쿠키·사이트 데이터를 허용한 뒤 다시 로그인해 주세요.",
      });
    }
    rejectSignedInWaiters({
      code: "auth/signed-out",
      message: "로그아웃되었습니다.",
    });
    notifyUi();
  }

  function markInitialAuthResolved() {
    if (!state.initialAuthResolved) {
      state.initialAuthResolved = true;
      resolveInitialAuthWaiters();
    }
  }

  async function init() {
    clearStaleAuthMessages();
    if (!isConfigured()) {
      notifyUi();
      markInitialAuthResolved();
      return false;
    }

    if (typeof firebase === "undefined") {
      console.warn("Firebase SDK not loaded.");
      notifyUi();
      markInitialAuthResolved();
      return false;
    }

    if (!state.app) {
      state.app = firebase.initializeApp(window.FIREBASE_CONFIG);
      state.auth = firebase.auth();
      state.db = firebase.firestore();

      try {
        state.db.settings({
          experimentalForceLongPolling: true,
          merge: true,
        });
      } catch (err) {
        console.warn("Firestore long polling setting unavailable:", err);
      }

      try {
        await configureAuthPersistence();
      } catch (err) {
        console.warn("Firebase auth persistence unavailable:", err);
      }

      const redirectResult = await processRedirectSignInResult();

      try {
        await state.db.enablePersistence({ synchronizeTabs: true });
      } catch (err) {
        console.warn("Firestore offline persistence unavailable:", err);
      }

      state.auth.onAuthStateChanged(async (user) => {
        try {
          if (user) {
            sessionStorage.removeItem(REDIRECT_PENDING_KEY);
            state.initialAuthNullSeen = true;
            if (state.user?.uid === user.uid && state.ready) return;
            await handleSignedIn(user);
            return;
          }

          if (!state.initialAuthNullSeen) {
            state.initialAuthNullSeen = true;
            if (state.auth?.currentUser) {
              await handleSignedIn(state.auth.currentUser);
              return;
            }
            if (shouldRecoverRedirectAuth()) return;
          }

          if (redirectResult?.user) return;
          if (shouldRecoverRedirectAuth()) return;
          if (isAuthInProgress()) return;
          if (Date.now() < state.suppressSignOutUntil) return;
          if (state.auth?.currentUser) {
            await handleSignedIn(state.auth.currentUser);
            return;
          }
          handleSignedOut();
        } catch (err) {
          console.error("Auth state handler failed:", err);
          rejectSignedInSyncWaiters(err);
        } finally {
          markInitialAuthResolved();
          notifySignedInSyncReady();
        }
      });
    }

    notifyUi();
    return true;
  }

  function hasPendingAuthRedirect() {
    return shouldRecoverRedirectAuth();
  }

  function isAuthCallbackUrl() {
    const target = `${window.location.href}${window.location.search}${window.location.hash}`;
    return /(authType=signInViaRedirect|signInViaRedirect|\/__\/auth\/handler)/i.test(target);
  }

  function shouldRecoverRedirectAuth() {
    if (isAuthCallbackUrl()) return true;
    return Boolean(sessionStorage.getItem(REDIRECT_PENDING_KEY));
  }

  async function configureAuthPersistence() {
    const modes = [
      firebase.auth.Auth.Persistence.LOCAL,
      firebase.auth.Auth.Persistence.SESSION,
    ];
    for (const mode of modes) {
      try {
        await state.auth.setPersistence(mode);
        state.persistenceMode = mode;
        return mode;
      } catch (err) {
        console.warn("Auth persistence unavailable:", mode, err);
      }
    }
    return null;
  }

  async function processRedirectSignInResult() {
    const hadPendingRedirect = Boolean(sessionStorage.getItem(REDIRECT_PENDING_KEY));
    const authCallback = isAuthCallbackUrl();
    let redirectResult = null;

    try {
      redirectResult = await state.auth.getRedirectResult();

      if (redirectResult?.error) {
        persistAuthError(redirectResult.error);
        reportAuthError(formatAuthError(redirectResult.error));
        return redirectResult;
      }

      if (redirectResult?.user) {
        await handleSignedIn(redirectResult.user);
        return redirectResult;
      }

      if (state.auth.currentUser) {
        await handleSignedIn(state.auth.currentUser);
        return redirectResult;
      }

      if (hadPendingRedirect || authCallback) {
        setAuthInProgress(true);
        try {
          const user = await waitForAuthUser(20000);
          await handleSignedIn(user);
        } catch (err) {
          console.warn("Redirect auth recovery failed:", err);
          persistAuthError({
            code: "auth/redirect-result-missing",
            message:
              "Google 로그인 결과를 불러오지 못했습니다. 아래 「Google로 로그인」을 다시 시도하거나, 회사 PC에서는 Chrome에서 taehee303-glitch.github.io 쿠키를 허용해 주세요.",
          });
          reportAuthError(formatAuthError({ code: "auth/redirect-result-missing" }));
        } finally {
          setAuthInProgress(false);
        }
      }
    } catch (err) {
      console.warn("Firebase redirect sign-in result failed:", err);
      persistAuthError(err);
      reportAuthError(formatAuthError(err));
    } finally {
      sessionStorage.removeItem(REDIRECT_PENDING_KEY);
    }

    return redirectResult;
  }

  async function recoverRedirectAuth(timeoutMs = 20000) {
    if (isSignedIn()) return true;
    if (!shouldRecoverRedirectAuth() && !sessionStorage.getItem("cra-last-auth-error")) return false;

    setAuthInProgress(true);
    try {
      if (state.auth.currentUser) {
        await handleSignedIn(state.auth.currentUser);
        return isSignedIn();
      }
      const user = await waitForAuthUser(timeoutMs);
      await handleSignedIn(user);
      return isSignedIn();
    } catch (err) {
      console.warn("recoverRedirectAuth failed:", err);
      return false;
    } finally {
      setAuthInProgress(false);
      sessionStorage.removeItem(REDIRECT_PENDING_KEY);
      markInitialAuthResolved();
      notifySignedInSyncReady();
    }
  }

  function getGoogleWebClientId() {
    return String(window.FIREBASE_CONFIG?.googleWebClientId || "").trim();
  }

  function isMobileBrowser() {
    return isAndroidDevice() || isIosDevice();
  }

  async function waitForGis(maxMs = 8000) {
    if (window.google?.accounts?.id) return;

    await new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }
        if (Date.now() - started > maxMs) {
          reject(new Error("Google 로그인 SDK를 불러오지 못했습니다. 네트워크 연결 후 새로고침해 주세요."));
          return;
        }
        setTimeout(tick, 100);
      };
      tick();
    });
  }

  function ensureGisInitialized(clientId) {
    if (state.gisInitialized) return;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (typeof state.gisCredentialHandler === "function") {
          state.gisCredentialHandler(response);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: false,
      itp_support: true,
    });

    state.gisInitialized = true;
  }

  async function signInWithGoogleGisModal() {
    const clientId = getGoogleWebClientId();
    if (!clientId) {
      throw {
        code: "auth/missing-client-id",
        message:
          "모바일 Google 로그인 설정이 필요합니다.\n\nFirebase Console → Authentication → Google → Web client ID 를 firebase-config.js 의 googleWebClientId 에 입력해 주세요.",
      };
    }

    if (!state.auth) {
      await init();
    }

    await waitForGis();
    ensureGisInitialized(clientId);

    return new Promise((resolve, reject) => {
      let settled = false;
      const overlay = document.createElement("div");
      overlay.className = "gis-auth-overlay";
      overlay.innerHTML = `
        <div class="gis-auth-panel" role="dialog" aria-modal="true" aria-labelledby="gisAuthTitle">
          <h3 id="gisAuthTitle" class="gis-auth-panel__title">Google 로그인</h3>
          <p class="gis-auth-panel__hint">아래 Google 버튼을 눌러 계정을 선택하세요.</p>
          <div id="gisSignInButtonHost" class="gis-auth-panel__button"></div>
          <button type="button" class="btn btn--ghost gis-auth-panel__cancel">취소</button>
        </div>
      `;

      const finish = (err) => {
        if (settled) return;
        settled = true;
        state.gisCredentialHandler = null;
        overlay.remove();
        document.body.style.overflow = "";
        if (err) reject(err);
        else resolve();
      };

      overlay.querySelector(".gis-auth-panel__cancel").addEventListener("click", () => {
        finish({ code: "auth/popup-closed-by-user" });
      });

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
          finish({ code: "auth/popup-closed-by-user" });
        }
      });

      state.gisCredentialHandler = async (response) => {
        try {
          if (!response?.credential) {
            throw {
              code: "auth/invalid-credential",
              message: "Google 계정 정보를 받지 못했습니다. 다시 시도해 주세요.",
            };
          }
          const credential = firebase.auth.GoogleAuthProvider.credential(response.credential);
          const result = await state.auth.signInWithCredential(credential);
          const user = result?.user || state.auth.currentUser;
          if (!user) {
            throw {
              code: "auth/invalid-credential",
              message:
                "Firebase에 Google 계정을 연결하지 못했습니다. Google Cloud OAuth 설정을 확인해 주세요.",
            };
          }
          sessionStorage.removeItem(REDIRECT_PENDING_KEY);
          await handleSignedIn(user);
          finish(null);
        } catch (err) {
          persistAuthError(err);
          finish(err);
        }
      };

      document.body.appendChild(overlay);
      document.body.style.overflow = "hidden";

      google.accounts.id.renderButton(overlay.querySelector("#gisSignInButtonHost"), {
        theme: "outline",
        size: "large",
        type: "standard",
        text: "signin_with",
        width: 280,
        locale: "ko",
      });
    });
  }

  function isIosDevice() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  }

  function isAndroidDevice() {
    return /Android/i.test(navigator.userAgent || "");
  }

  function isStandaloneApp() {
    return (
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true
    );
  }

  function isInAppBrowser() {
    const ua = navigator.userAgent || "";
    return /(KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER)/i.test(ua);
  }

  function getSignInStrategy(options = {}) {
    if (isInAppBrowser()) return "blocked-in-app";
    if (options.forceRedirect) return "redirect";
    return "native-first";
  }

  function setSignedInEntryCallback(fn) {
    state.signedInEntryCallback = typeof fn === "function" ? fn : null;
  }

  function clearStaleAuthMessages() {
    try {
      const ts = Number(localStorage.getItem("cra-last-auth-error-ts") || "0");
      if (ts && Date.now() - ts > 10 * 60 * 1000) {
        localStorage.removeItem("cra-last-auth-error");
        localStorage.removeItem("cra-last-auth-error-ts");
      }
    } catch {
      /* ignore */
    }
  }

  function persistAuthError(err) {
    try {
      const message = formatAuthError(err);
      localStorage.setItem("cra-last-auth-error", message);
      localStorage.setItem("cra-last-auth-error-ts", String(Date.now()));
      sessionStorage.setItem("cra-last-auth-error", message);
    } catch {
      /* ignore */
    }
  }

  function consumePersistedAuthError() {
    try {
      const message =
        sessionStorage.getItem("cra-last-auth-error") ||
        localStorage.getItem("cra-last-auth-error") ||
        "";
      sessionStorage.removeItem("cra-last-auth-error");
      return message || "";
    } catch {
      return "";
    }
  }

  function peekPersistedAuthError() {
    try {
      return (
        sessionStorage.getItem("cra-last-auth-error") ||
        localStorage.getItem("cra-last-auth-error") ||
        ""
      );
    } catch {
      return "";
    }
  }

  function clearPersistedAuthError() {
    try {
      sessionStorage.removeItem("cra-last-auth-error");
      localStorage.removeItem("cra-last-auth-error");
      localStorage.removeItem("cra-last-auth-error-ts");
    } catch {
      /* ignore */
    }
  }

  function persistAuthStatus(message) {
    try {
      sessionStorage.setItem("cra-auth-status", String(message || ""));
    } catch {
      /* ignore */
    }
  }

  function getAuthStatus() {
    try {
      return sessionStorage.getItem("cra-auth-status") || "";
    } catch {
      return "";
    }
  }

  function shouldUseRedirectSignIn() {
    return getSignInStrategy() === "redirect";
  }

  async function signInWithRedirectFlow(provider) {
    sessionStorage.setItem(REDIRECT_PENDING_KEY, String(Date.now()));

    if ("serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      } catch (err) {
        console.warn("Service Worker unregister before auth redirect failed:", err);
      }
    }

    await state.auth.signInWithRedirect(provider);
  }

  function formatAuthError(err) {
    const code = err?.code || "";
    const messages = {
      "auth/popup-blocked":
        "브라우저가 로그인 팝업을 차단했습니다. 주소창 옆 팝업 허용 후 다시 시도하거나, 페이지가 Google 로그인 화면으로 이동합니다.",
      "auth/unauthorized-domain":
        "이 사이트 도메인이 Firebase에 등록되지 않았습니다. Authentication → Authorized domains에 현재 도메인을 추가해 주세요.",
      "auth/operation-not-allowed":
        "Firebase Authentication에서 Google 로그인이 활성화되지 않았습니다.",
      "auth/cancelled-popup-request":
        "로그인 팝업이 중복 실행되었습니다. 잠시 후 다시 시도해 주세요.",
      "auth/network-request-failed":
        "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
      "auth/missing-client-id":
        "모바일 Google 로그인 설정이 필요합니다. Firebase Console → Authentication → Google → Web client ID 를 firebase-config.js 의 googleWebClientId 에 입력해 주세요.",
      "auth/timeout":
        "Google 로그인 확인 시간이 초과되었습니다. 팝업 차단·회사 보안 정책·네트워크를 확인한 뒤 다시 시도해 주세요.",
      "auth/redirect-result-missing":
        "Google 로그인 결과를 불러오지 못했습니다. 브라우저 쿠키·사이트 데이터를 허용한 뒤 다시 시도해 주세요.",
      "auth/invalid-credential":
        "Google OAuth 설정이 맞지 않습니다. Google Cloud Console → 사용자 인증 정보 → OAuth 클라이언트 → 승인된 JavaScript 원본에 https://taehee303-glitch.github.io 를 추가해 주세요.",
      "auth/operation-not-supported-in-this-environment":
        "이 브라우저/환경에서는 Google 로그인이 지원되지 않습니다. Chrome 최신 버전을 사용해 주세요.",
      "auth/oauth-token-failed":
        "Google OAuth 토큰 발급에 실패했습니다. Google Cloud Console OAuth 설정을 확인해 주세요.",
      "auth/session-lost":
        "로그인 세션이 유지되지 않았습니다. Chrome에서 taehee303-glitch.github.io 쿠키·사이트 데이터를 허용한 뒤 다시 로그인해 주세요.",
      "auth/sync-timeout":
        "클라우드 동기화 시간이 초과되었습니다. Firebase Firestore Rules 배포와 네트워크 연결을 확인해 주세요.",
      "permission-denied":
        "Firestore 접근이 거부되었습니다. Firebase Console → Firestore → Rules 에 firestore.rules 내용을 배포해 주세요.",
    };
    const hostname = window.location.hostname || "현재 사이트";
    if (code === "auth/unauthorized-domain") {
      return `${messages[code]}\n\n현재 도메인: ${hostname}`;
    }
    return messages[code] || err?.message || "Google 로그인에 실패했습니다.";
  }

  function getMobileLoginHint() {
    if (isInAppBrowser()) {
      return "카카오톡/인스타 등 앱 내 브라우저에서는 Google 로그인이 차단될 수 있습니다. Safari 또는 Chrome에서 주소를 직접 열어 주세요.";
    }
    if (isIosDevice() && isStandaloneApp()) {
      return "iPhone 홈 화면 앱에서는 Google 로그인이 제한될 수 있습니다. Safari에서 https://taehee303-glitch.github.io/cra-task-management/ 주소를 열어 로그인해 주세요.";
    }
    return "";
  }

  async function signInWithGoogleOAuthToken() {
    const clientId = getGoogleWebClientId();
    if (!clientId) {
      throw {
        code: "auth/missing-client-id",
        message:
          "Google OAuth client ID가 없습니다. firebase-config.js 의 googleWebClientId 를 확인해 주세요.",
      };
    }

    if (!state.auth) {
      await init();
    }

    await waitForGis();

    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (err) => {
        if (settled) return;
        settled = true;
        if (err) reject(err);
        else resolve();
      };

      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email profile",
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              finish({
                code: "auth/oauth-token-failed",
                message: tokenResponse.error_description || tokenResponse.error,
              });
              return;
            }
            try {
              const credential = firebase.auth.GoogleAuthProvider.credential(
                null,
                tokenResponse.access_token
              );
              const result = await state.auth.signInWithCredential(credential);
              const user = result?.user || state.auth.currentUser;
              if (!user) {
                throw {
                  code: "auth/invalid-credential",
                  message: "Firebase에 Google 계정을 연결하지 못했습니다.",
                };
              }
              sessionStorage.removeItem(REDIRECT_PENDING_KEY);
              await handleSignedIn(user);
              finish(null);
            } catch (err) {
              persistAuthError(err);
              finish(err);
            }
          },
          error_callback: (err) => {
            finish({
              code: "auth/popup-closed-by-user",
              message: err?.message || "Google OAuth가 취소되었습니다.",
            });
          },
        });
        client.requestAccessToken({ prompt: "select_account" });
      } catch (err) {
        finish(err);
      }
    });
  }

  async function syncCurrentAuthUser() {
    if (!state.auth?.currentUser) return false;
    if (isSignedIn()) return true;
    await handleSignedIn(state.auth.currentUser);
    return isSignedIn();
  }

  function getAuthDiagnostics() {
    const origin = `${window.location.protocol}//${window.location.hostname}`;
    let storageOk = "unknown";
    try {
      localStorage.setItem("cra-auth-probe", "1");
      localStorage.removeItem("cra-auth-probe");
      storageOk = "ok";
    } catch {
      storageOk = "blocked";
    }

    return {
      origin,
      storageOk,
      persistenceMode: state.persistenceMode || "unknown",
      hasClientId: Boolean(getGoogleWebClientId()),
      swControlled: Boolean(navigator.serviceWorker?.controller),
    };
  }

  async function signInWithGoogle(options = {}) {
    if (!isConfigured()) {
      throw {
        code: "auth/not-configured",
        message:
          "Firebase 설정이 비어 있습니다.\nfirebase-config.js 파일에 Firebase Console에서 발급받은 설정값을 입력해 주세요.",
      };
    }

    if (!state.auth) {
      await init();
    }

    if (!state.auth) {
      throw {
        code: "auth/not-initialized",
        message: "Firebase Auth를 초기화하지 못했습니다. 페이지를 새로고침해 주세요.",
      };
    }

    setAuthInProgress(true);
    let redirectStarted = false;
    try {
      await unregisterServiceWorkersForAuth();

      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const strategy = getSignInStrategy(options);
      const mobileHint = getMobileLoginHint();

      if (strategy === "blocked-in-app") {
        throw { code: "auth/blocked-in-app", message: mobileHint };
      }

      if (strategy === "native-first") {
        try {
          const popupResult = await state.auth.signInWithPopup(provider);
          if (popupResult?.user) {
            await handleSignedIn(popupResult.user);
          }
          await waitForAuthUser(10000);
          return waitUntilSignedInAndSynced();
        } catch (err) {
          if (err?.code === "auth/popup-closed-by-user") throw err;
          console.warn("Popup sign-in failed, trying GIS:", err);
        }

        try {
          await signInWithGoogleGisModal();
          await waitForAuthUser(30000);
          return waitUntilSignedInAndSynced();
        } catch (err) {
          if (err?.code === "auth/popup-closed-by-user") throw err;
          console.warn("GIS sign-in failed, trying OAuth token client:", err);
        }

        try {
          await signInWithGoogleOAuthToken();
          await waitForAuthUser(30000);
          return waitUntilSignedInAndSynced();
        } catch (err) {
          if (err?.code === "auth/popup-closed-by-user") throw err;
          persistAuthError(err);
          throw err;
        }
      }

      if (strategy === "gis-first") {
        try {
          await signInWithGoogleGisModal();
          await waitForAuthUser(30000);
          return waitUntilSignedInAndSynced();
        } catch (err) {
          if (err?.code === "auth/popup-closed-by-user") throw err;
          console.warn("GIS sign-in failed, trying OAuth token client:", err);
        }

        try {
          await signInWithGoogleOAuthToken();
          await waitForAuthUser(30000);
          return waitUntilSignedInAndSynced();
        } catch (err) {
          if (err?.code === "auth/popup-closed-by-user") throw err;
          persistAuthError(err);
          throw err;
        }
      }

      if (strategy === "redirect") {
        await signInWithRedirectFlow(provider);
        redirectStarted = true;
        return new Promise(() => {});
      }

      if (strategy === "gis") {
        await signInWithGoogleGisModal();
        await waitForAuthUser();
        return waitUntilSignedInAndSynced();
      }

      try {
        await state.auth.signInWithPopup(provider);
      } catch (err) {
        if (err?.code === "auth/popup-closed-by-user") throw err;
        if (getGoogleWebClientId()) {
          await signInWithGoogleGisModal();
          await waitForAuthUser();
          return waitUntilSignedInAndSynced();
        }
        throw err;
      }

      await waitForAuthUser();
      if (!state.auth.currentUser && getGoogleWebClientId()) {
        await signInWithGoogleGisModal();
        await waitForAuthUser();
      }
      return waitUntilSignedInAndSynced();
    } finally {
      if (!redirectStarted) {
        setAuthInProgress(false);
      }
    }
  }

  async function signOut() {
    if (!state.auth) return;
    await state.auth.signOut();
  }

  window.CloudSyncManager = {
    init,
    isConfigured,
    isSignedIn,
    isActive,
    requiresAuth,
    waitForInitialAuth,
    waitUntilSignedIn,
    waitUntilSignedInAndSynced,
    registerSources,
    setRefreshCallback,
    setUiCallback,
    notifyChange,
    signInWithGoogle,
    signOut,
    formatAuthError,
    getMobileLoginHint,
    setAuthErrorCallback,
    setSignedInEntryCallback,
    hasPendingAuthRedirect,
    isAuthInProgress,
    consumePersistedAuthError,
    peekPersistedAuthError,
    persistAuthError,
    getAuthStatus,
    shouldRecoverRedirectAuth,
    recoverRedirectAuth,
    syncCurrentAuthUser,
    getAuthDiagnostics,
  };
})();
