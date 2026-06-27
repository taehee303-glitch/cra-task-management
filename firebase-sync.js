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
    ready: false,
    syncing: false,
  };

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

  async function readRemoteDoc(key) {
    const snap = await dataDoc(key).get();
    if (!snap.exists) return null;
    return snap.data();
  }

  async function cloudHasAnyData() {
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
    }
  }

  async function resolveInitialSync() {
    const metaSnap = await metaDoc().get();
    const initialized = metaSnap.exists && metaSnap.data()?.initialized;
    const hasLocal = localHasAnyData();
    const hasCloud = await cloudHasAnyData();

    if (initialized || hasCloud) {
      await downloadAllCloud();
      return;
    }

    if (hasLocal) {
      const upload = window.confirm(
        "이 기기의 로컬 데이터를 클라우드에 업로드할까요?\n\n" +
          "예: PC 데이터를 클라우드에 저장해 휴대폰과 공유\n" +
          "아니오: 빈 클라우드로 시작 (로컬 데이터는 이 기기에만 유지)"
      );
      if (upload) {
        await uploadAllLocal();
        return;
      }
      await metaDoc().set(
        {
          initialized: true,
          skippedLocalUploadAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return;
    }

    await metaDoc().set({ initialized: true }, { merge: true });
  }

  async function handleSignedIn(user) {
    state.user = user;
    state.ready = true;
    notifyUi();

    try {
      await resolveInitialSync();
      startListeners();
      notifyRefresh();
    } catch (err) {
      console.error("Cloud sync sign-in handling failed:", err);
      alert("클라우드 동기화 초기화에 실패했습니다. 네트워크와 Firebase 설정을 확인해 주세요.");
    }
  }

  function handleSignedOut() {
    stopListeners();
    state.user = null;
    state.ready = false;
    state.pendingKeys.clear();
    clearTimeout(state.debounceTimer);
    notifyUi();
  }

  async function init() {
    if (!isConfigured()) {
      notifyUi();
      return false;
    }

    if (typeof firebase === "undefined") {
      console.warn("Firebase SDK not loaded.");
      notifyUi();
      return false;
    }

    if (!state.app) {
      state.app = firebase.initializeApp(window.FIREBASE_CONFIG);
      state.auth = firebase.auth();
      state.db = firebase.firestore();

      try {
        await state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      } catch (err) {
        console.warn("Firebase auth persistence unavailable:", err);
      }

      try {
        await state.db.enablePersistence({ synchronizeTabs: true });
      } catch (err) {
        console.warn("Firestore offline persistence unavailable:", err);
      }

      try {
        const redirectResult = await state.auth.getRedirectResult();
        sessionStorage.removeItem(REDIRECT_PENDING_KEY);

        if (redirectResult?.error) {
          reportAuthError(formatAuthError(redirectResult.error));
        }
      } catch (err) {
        sessionStorage.removeItem(REDIRECT_PENDING_KEY);
        console.warn("Firebase redirect sign-in result failed:", err);
        reportAuthError(formatAuthError(err));
      }

      state.auth.onAuthStateChanged(async (user) => {
        if (user) {
          sessionStorage.removeItem(REDIRECT_PENDING_KEY);
          await handleSignedIn(user);
        } else {
          handleSignedOut();
        }
      });
    }

    notifyUi();
    return true;
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

  function getSignInStrategy() {
    if (isInAppBrowser()) return "blocked-in-app";

    // iOS 홈 화면 PWA는 redirect 후 세션이 앱으로 돌아오지 않는 경우가 많음
    if (isIosDevice() && isStandaloneApp()) return "ios-standalone";

    if (isIosDevice()) return "redirect";

    if (isAndroidDevice()) return "popup-first";

    return "popup-first";
  }

  function shouldUseRedirectSignIn() {
    return getSignInStrategy() === "redirect";
  }

  async function signInWithRedirectFlow(provider) {
    sessionStorage.setItem(REDIRECT_PENDING_KEY, String(Date.now()));
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

  async function signInWithGoogle() {
    if (!isConfigured()) {
      alert(
        "Firebase 설정이 비어 있습니다.\nfirebase-config.js 파일에 Firebase Console에서 발급받은 설정값을 입력해 주세요."
      );
      return;
    }

    if (!state.auth) {
      await init();
    }

    if (!state.auth) {
      alert("Firebase Auth를 초기화하지 못했습니다. 페이지를 새로고침해 주세요.");
      return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const strategy = getSignInStrategy();
    const mobileHint = getMobileLoginHint();

    if (strategy === "blocked-in-app") {
      reportAuthError(mobileHint);
      return;
    }

    if (strategy === "ios-standalone") {
      try {
        await state.auth.signInWithPopup(provider);
        return;
      } catch (err) {
        if (err?.code === "auth/popup-closed-by-user") return;
        reportAuthError(`${formatAuthError(err)}\n\n${mobileHint}`);
        return;
      }
    }

    if (strategy === "redirect") {
      await signInWithRedirectFlow(provider);
      return;
    }

    try {
      await state.auth.signInWithPopup(provider);
    } catch (err) {
      if (err?.code === "auth/popup-closed-by-user") return;
      if (err?.code === "auth/popup-blocked") {
        await signInWithRedirectFlow(provider);
        return;
      }
      if (mobileHint) {
        reportAuthError(`${formatAuthError(err)}\n\n${mobileHint}`);
        return;
      }
      throw err;
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
    registerSources,
    setRefreshCallback,
    setUiCallback,
    notifyChange,
    signInWithGoogle,
    signOut,
    formatAuthError,
    getMobileLoginHint,
    setAuthErrorCallback,
  };
})();
