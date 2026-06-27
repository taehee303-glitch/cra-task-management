/**
 * Firebase Auth + Firestore 클라우드 동기화
 * 로그인 시 PC·휴대폰 간 데이터 실시간 공유
 */
(function () {
  const META_DOC = "meta";
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
        await state.db.enablePersistence({ synchronizeTabs: true });
      } catch (err) {
        console.warn("Firestore offline persistence unavailable:", err);
      }

      state.auth.onAuthStateChanged(async (user) => {
        if (user) {
          await handleSignedIn(user);
        } else {
          handleSignedOut();
        }
      });
    }

    notifyUi();
    return true;
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

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await state.auth.signInWithPopup(provider);
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
  };
})();
