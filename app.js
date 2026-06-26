const STORAGE_KEY = "cra-tasks";
const STUDY_MASTER_KEY = "cra-study-master";
const SITE_MASTER_KEY = "cra-site-master";
const SYSTEM_MASTER_KEY = "cra-system-master";
const REMINDER_SETTINGS_KEY = "cra-reminder-settings";
const UI_SETTINGS_KEY = "cra-ui-settings";
const IRB_CRYPTO_SALT = "cra-task-manager-irb-v1";
const IRB_CRYPTO_PEPPER = "cra-irb-portal-key";
const URGENT_DAYS = 3;
const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const STATUSES = ["Open", "In Progress", "On Hold", "Completed", "Cancelled"];
const DEFAULT_STATUS = "Open";
const TASK_RULE_DEFAULT_STATUSES = ["Open", "In Progress"];

const TASK_RULE_PRESET_TASK_NAMES = [
  "CTMS/TMF Update",
  "CTMS Update",
  "TMF Filing",
  "Expense Claim",
  "MV Report 작성",
  "Follow-up Letter 발송",
  "SDV Note 정리",
  "Query Follow-up",
  "SAE Follow-up",
  "Drug Accountability",
  "Close-out Report 작성",
];

const DEFAULT_TASK_RULE_PRIORITIES = {
  "CTMS/TMF Update": "High",
  "CTMS Update": "High",
  "TMF Filing": "Medium",
  "Expense Claim": "Low",
  "MV Report 작성": "Critical",
  "SIV Report 작성": "Critical",
  "COV Report 작성": "Critical",
  "Follow-up Letter 발송": "Medium",
  "SDV Note 정리": "Medium",
  "Query Follow-up": "High",
  "SAE Follow-up": "Critical",
  "Drug Accountability": "Medium",
  "Close-out Report 작성": "Critical",
};

const TASK_RULE_OVERRIDE_NOTICE =
  "⚠️ 이 Study에는 사용자 정의 Task Rule이 등록되어 있습니다. 등록된 Rule만 자동 생성되며 기본 Workflow Rule은 적용되지 않습니다.";

const LEGACY_STATUS_MAP = {
  Pending: "Open",
  "In Progress": "Open",
  "On Hold": "On Hold",
  Completed: "Completed",
};

let selectedStudyMasterId = null;
let selectedSiteMasterId = null;
let selectedSystemMasterId = null;
let selectedSiteMasterTab = "basic";
let selectedStudyMasterTab = "basic";

const TASK_RULE_BASE_EVENTS = [
  { key: "mv", label: "MV 완료일" },
  { key: "siv", label: "SIV 완료일" },
  { key: "cov", label: "COV 완료일" },
];

const TASK_RULE_DUE_UNITS = [
  { key: "calendar", label: "Calendar Day" },
  { key: "business", label: "Business Day" },
];

const TASK_RULE_BASE_EVENT_LABELS = Object.fromEntries(
  TASK_RULE_BASE_EVENTS.map((item) => [item.key, item.label])
);

const TASK_RULE_DUE_UNIT_LABELS = Object.fromEntries(
  TASK_RULE_DUE_UNITS.map((item) => [item.key, item.label])
);

const WORKFLOW_VISIT_RULES = [
  {
    key: "cov",
    label: "Close-out Visit",
    keywords: ["Close-out Visit", "Close Out Visit", "COV"],
    templates: [
      { task: "COV Report 작성", daysOffset: 5 },
      { task: "Follow-up Letter 발송", daysOffset: 7 },
      { task: "CTMS Update", daysOffset: 2 },
      { task: "TMF Filing", daysOffset: 3 },
      { task: "Expense Claim", daysOffset: 3 },
    ],
  },
  {
    key: "siv",
    label: "Site Initiation Visit",
    keywords: ["Site Initiation Visit", "SIV"],
    templates: [
      { task: "SIV Report 작성", daysOffset: 5 },
      { task: "Follow-up Letter 발송", daysOffset: 7 },
      { task: "CTMS Update", daysOffset: 2 },
      { task: "TMF Filing", daysOffset: 3 },
      { task: "Expense Claim", daysOffset: 3 },
    ],
  },
  {
    key: "mv",
    label: "Monitoring Visit",
    keywords: ["Monitoring Visit", "Monitoring", "MV"],
    templates: [
      { task: "CTMS/TMF Update", daysOffset: 2 },
      { task: "MV Report 작성", daysOffset: 5 },
      { task: "Follow-up Letter 발송", daysOffset: 7 },
      { task: "SDV Note 정리", daysOffset: 3 },
      { task: "Query Follow-up", daysOffset: 5 },
    ],
  },
];
let tasks = [];
let dashboardCardFilter = null;
let toastHideTimer = null;
let toastRemoveTimer = null;

const DASHBOARD_FILTER_LABELS = {
  all: "전체 업무",
  completed: "완료된 업무",
  overdue: "지연 업무",
  week: "이번 주 마감",
};
const els = {
  todayLabel: document.getElementById("todayLabel"),
  statTotal: document.getElementById("statTotal"),
  statCompleted: document.getElementById("statCompleted"),
  statOverdue: document.getElementById("statOverdue"),
  statWeekDue: document.getElementById("statWeekDue"),
  progressSubtitle: document.getElementById("progressSubtitle"),
  progressPercent: document.getElementById("progressPercent"),
  progressFill: document.getElementById("progressFill"),
  taskForm: document.getElementById("taskForm"),
  study: document.getElementById("study"),
  site: document.getElementById("site"),
  resetFormBtn: document.getElementById("resetFormBtn"),
  viewTasks: document.getElementById("viewTasks"),
  viewStudyMaster: document.getElementById("viewStudyMaster"),
  viewSystemMaster: document.getElementById("viewSystemMaster"),
  navButtons: document.querySelectorAll(".app-nav__btn"),
  studyMasterList: document.getElementById("studyMasterList"),
  studyMasterEmpty: document.getElementById("studyMasterEmpty"),
  studyMasterForm: document.getElementById("studyMasterForm"),
  linkedSitesPanel: document.getElementById("linkedSitesPanel"),
  linkedSitesTableBody: document.getElementById("linkedSitesTableBody"),
  newStudyBtn: document.getElementById("newStudyBtn"),
  deleteStudyBtn: document.getElementById("deleteStudyBtn"),
  linkSiteBtn: document.getElementById("linkSiteBtn"),
  linkSiteModal: document.getElementById("linkSiteModal"),
  linkSiteForm: document.getElementById("linkSiteForm"),
  linkSiteSelect: document.getElementById("linkSiteSelect"),
  closeLinkSiteModalBtn: document.getElementById("closeLinkSiteModalBtn"),
  cancelLinkSiteBtn: document.getElementById("cancelLinkSiteBtn"),
  studySystemsPanel: document.getElementById("studySystemsPanel"),
  studySystemsTableBody: document.getElementById("studySystemsTableBody"),
  newStudySystemBtn: document.getElementById("newStudySystemBtn"),
  studyTaskRulesPanel: document.getElementById("studyTaskRulesPanel"),
  studyTaskRulesTableBody: document.getElementById("studyTaskRulesTableBody"),
  newStudyTaskRuleBtn: document.getElementById("newStudyTaskRuleBtn"),
  studyTaskRuleModal: document.getElementById("studyTaskRuleModal"),
  studyTaskRuleForm: document.getElementById("studyTaskRuleForm"),
  closeStudyTaskRuleModalBtn: document.getElementById("closeStudyTaskRuleModalBtn"),
  cancelStudyTaskRuleBtn: document.getElementById("cancelStudyTaskRuleBtn"),
  studySystemModal: document.getElementById("studySystemModal"),
  studySystemForm: document.getElementById("studySystemForm"),
  closeStudySystemModalBtn: document.getElementById("closeStudySystemModalBtn"),
  cancelStudySystemBtn: document.getElementById("cancelStudySystemBtn"),
  systemMasterList: document.getElementById("systemMasterList"),
  systemMasterSearch: document.getElementById("systemMasterSearch"),
  systemMasterEmpty: document.getElementById("systemMasterEmpty"),
  systemMasterForm: document.getElementById("systemMasterForm"),
  newSystemMasterBtn: document.getElementById("newSystemMasterBtn"),
  deleteSystemMasterBtn: document.getElementById("deleteSystemMasterBtn"),
  systemMasterUsageInfo: document.getElementById("systemMasterUsageInfo"),
  siteInfoPanel: document.getElementById("siteInfoPanel"),
  siteInfoContent: document.getElementById("siteInfoContent"),
  siteInfoToggleBtn: document.getElementById("siteInfoToggleBtn"),
  editSiteInfoPanel: document.getElementById("editSiteInfoPanel"),
  editSiteInfoContent: document.getElementById("editSiteInfoContent"),
  editSiteInfoToggleBtn: document.getElementById("editSiteInfoToggleBtn"),
  viewSiteMaster: document.getElementById("viewSiteMaster"),
  siteMasterList: document.getElementById("siteMasterList"),
  siteMasterSearch: document.getElementById("siteMasterSearch"),
  siteMasterEmpty: document.getElementById("siteMasterEmpty"),
  siteMasterForm: document.getElementById("siteMasterForm"),
  newSiteMasterBtn: document.getElementById("newSiteMasterBtn"),
  deleteSiteMasterBtn: document.getElementById("deleteSiteMasterBtn"),
  siteSystemsPanel: document.getElementById("siteSystemsPanel"),
  siteSystemsTableBody: document.getElementById("siteSystemsTableBody"),
  newSiteSystemBtn: document.getElementById("newSiteSystemBtn"),
  siteSystemModal: document.getElementById("siteSystemModal"),
  siteSystemForm: document.getElementById("siteSystemForm"),
  closeSiteSystemModalBtn: document.getElementById("closeSiteSystemModalBtn"),
  cancelSiteSystemBtn: document.getElementById("cancelSiteSystemBtn"),
  taskTableBody: document.getElementById("taskTableBody"),
  filterStudy: document.getElementById("filterStudy"),
  filterStatus: document.getElementById("filterStatus"),
  searchInput: document.getElementById("searchInput"),
  siteMasterHint: document.getElementById("siteMasterHint"),
  editSiteMasterHint: document.getElementById("editSiteMasterHint"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  importCsvBtn: document.getElementById("importCsvBtn"),
  importCsvInput: document.getElementById("importCsvInput"),
  editModal: document.getElementById("editModal"),
  editForm: document.getElementById("editForm"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  attentionTodayCount: document.getElementById("attentionTodayCount"),
  attentionOverdueCount: document.getElementById("attentionOverdueCount"),
  attentionD1Count: document.getElementById("attentionD1Count"),
  attentionTodayList: document.getElementById("attentionTodayList"),
  attentionOverdueList: document.getElementById("attentionOverdueList"),
  attentionD1List: document.getElementById("attentionD1List"),
  reminderStatusBadge: document.getElementById("reminderStatusBadge"),
  openSettingsBtn: document.getElementById("openSettingsBtn"),
  settingsModal: document.getElementById("settingsModal"),
  closeSettingsModalBtn: document.getElementById("closeSettingsModalBtn"),
  cancelSettingsBtn: document.getElementById("cancelSettingsBtn"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  reminderEnabledToggle: document.getElementById("reminderEnabledToggle"),
  reminderPermissionStatus: document.getElementById("reminderPermissionStatus"),
  googleConnectBtn: document.getElementById("googleConnectBtn"),
  googleDisconnectBtn: document.getElementById("googleDisconnectBtn"),
  googleSetupHint: document.getElementById("googleSetupHint"),
  googleAccountStatus: document.getElementById("googleAccountStatus"),
  uiScaleSelect: document.getElementById("uiScaleSelect"),
  taskListSection: document.getElementById("taskListSection"),
  dashboardFilterCards: document.querySelectorAll("[data-dashboard-filter]"),
  dashboardFilterBar: document.getElementById("dashboardFilterBar"),
  dashboardFilterLabel: document.getElementById("dashboardFilterLabel"),
  dashboardFilterCount: document.getElementById("dashboardFilterCount"),
  dashboardFilterChip: document.getElementById("dashboardFilterChip"),
  clearDashboardFilterBtn: document.getElementById("clearDashboardFilterBtn"),
  toastContainer: document.getElementById("toastContainer"),
};
function init() {
  applyUiScale();
  bootstrapApp().catch((err) => {
    console.error("앱 초기화 실패:", err);
    alert("앱을 초기화하는 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.");
  });
}

async function bootstrapApp() {
  tasks = TaskStore.load();
  StudyMasterStore.load();
  SiteMasterStore.load();
  SystemMasterStore.load();
  await seedSiteMasterIfEmpty();
  migrateMasterStructureV2();
  migrateStudySystemsToSystemMaster();
  await migrateIrbPortalPasswords();
  await seedStudyMasterIfEmpty();
  seedSampleDataIfEmpty();
  migrateTaskStatuses();
  StudyMasterStore.migrateFromTasks(tasks);
  reconcileSiteNamesAfterMasterChange();

  updateTodayLabel();
  showFileProtocolBannerIfNeeded();
  initMobileAccessBanner();
  renderAll();
  renderStudyMaster();
  renderSystemMaster();
  refreshTaskStudySiteSelects();

  if (window.CalendarSyncManager) {
    await CalendarSyncManager.init();
    CalendarSyncManager.registerHelpers({
      getStandardSiteName,
      getTaskById: (id) => tasks.find((t) => t.id === id),
      updateTaskCalendarSync: (taskId, calendarSync) => TaskStore.update(taskId, { calendarSync }),
      clearTaskCalendarSync: (taskId) => {
        const idx = tasks.findIndex((t) => t.id === taskId);
        if (idx === -1) return false;
        const updated = { ...tasks[idx], updatedAt: new Date().toISOString() };
        delete updated.calendarSync;
        tasks[idx] = updated;
        TaskStore.persist();
        return true;
      },
    });
    CalendarSyncManager.reconcileAuthWithSettings();
  }

  await initDesktopReminders();

  els.taskForm.addEventListener("submit", handleAddTask);
  els.resetFormBtn.addEventListener("click", () => {
    els.taskForm.reset();
    refreshTaskStudySiteSelects();
    updateSiteInfoDisplays();
  });
  els.study.addEventListener("change", () => {
    populateSiteSelect(els.site, els.study.value);
    updateSiteInfoDisplays();
    updateSiteSelectHint(els.study.value, els.siteMasterHint);
  });
  els.site.addEventListener("change", updateSiteInfoDisplays);
  els.siteInfoToggleBtn?.addEventListener("click", toggleTaskSiteInfo);
  document.getElementById("editStudy").addEventListener("change", () => {
    populateSiteSelect(document.getElementById("editSite"), document.getElementById("editStudy").value);
    updateEditSiteInfoDisplay();
    updateSiteSelectHint(document.getElementById("editStudy").value, els.editSiteMasterHint);
  });
  document.getElementById("editSite").addEventListener("change", updateEditSiteInfoDisplay);
  els.editSiteInfoToggleBtn.addEventListener("click", toggleEditSiteInfo);
  els.navButtons.forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });
  els.newStudyBtn.addEventListener("click", () => openNewStudyForm());
  els.studyMasterForm.addEventListener("submit", handleStudyMasterSubmit);
  els.deleteStudyBtn.addEventListener("click", handleDeleteStudy);
  els.linkSiteBtn.addEventListener("click", openLinkSiteModal);
  els.linkSiteForm.addEventListener("submit", handleLinkSiteSubmit);
  els.closeLinkSiteModalBtn.addEventListener("click", closeLinkSiteModal);
  els.cancelLinkSiteBtn.addEventListener("click", closeLinkSiteModal);
  els.linkSiteModal.addEventListener("click", (e) => {
    if (e.target === els.linkSiteModal) closeLinkSiteModal();
  });
  els.newStudySystemBtn.addEventListener("click", () => openStudySystemModal());
  els.studySystemForm.addEventListener("submit", handleStudySystemSubmit);
  els.closeStudySystemModalBtn.addEventListener("click", closeStudySystemModal);
  els.cancelStudySystemBtn.addEventListener("click", closeStudySystemModal);
  els.studySystemModal.addEventListener("click", (e) => {
    if (e.target === els.studySystemModal) closeStudySystemModal();
  });
  document.querySelectorAll("[data-study-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchStudyMasterTab(btn.dataset.studyTab));
  });
  els.newStudyTaskRuleBtn?.addEventListener("click", () => openStudyTaskRuleModal());
  els.studyTaskRuleForm?.addEventListener("submit", handleStudyTaskRuleSubmit);
  els.closeStudyTaskRuleModalBtn?.addEventListener("click", closeStudyTaskRuleModal);
  els.cancelStudyTaskRuleBtn?.addEventListener("click", closeStudyTaskRuleModal);
  document.getElementById("studyTaskRuleNameSelect")?.addEventListener("change", handleStudyTaskRuleNameSelectChange);
  els.studyTaskRuleModal?.addEventListener("click", (e) => {
    if (e.target === els.studyTaskRuleModal) closeStudyTaskRuleModal();
  });

  els.newSystemMasterBtn?.addEventListener("click", openNewSystemMasterForm);
  els.systemMasterForm?.addEventListener("submit", handleSystemMasterSubmit);
  els.deleteSystemMasterBtn?.addEventListener("click", handleDeleteSystemMaster);
  els.systemMasterSearch?.addEventListener("input", renderSystemMaster);
  els.newSiteMasterBtn.addEventListener("click", openNewSiteMasterForm);
  els.siteMasterForm.addEventListener("submit", handleSiteMasterSubmit);
  els.deleteSiteMasterBtn.addEventListener("click", handleDeleteSiteMaster);
  els.siteMasterSearch.addEventListener("input", renderSiteMaster);
  document.querySelectorAll("[data-site-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchSiteMasterTab(btn.dataset.siteTab));
  });
  els.newSiteSystemBtn.addEventListener("click", () => openSiteSystemModal());
  els.siteSystemForm.addEventListener("submit", handleSiteSystemSubmit);
  els.closeSiteSystemModalBtn.addEventListener("click", closeSiteSystemModal);
  els.cancelSiteSystemBtn.addEventListener("click", closeSiteSystemModal);
  els.siteSystemModal.addEventListener("click", (e) => {
    if (e.target === els.siteSystemModal) closeSiteSystemModal();
  });
  els.filterStudy.addEventListener("change", renderTable);
  els.filterStatus.addEventListener("change", renderTable);
  els.dashboardFilterCards.forEach((card) => {
    card.addEventListener("click", () => handleDashboardCardFilterClick(card.dataset.dashboardFilter));
  });
  els.clearDashboardFilterBtn?.addEventListener("click", clearDashboardCardFilter);
  els.searchInput.addEventListener("input", renderTable);
  els.exportCsvBtn.addEventListener("click", exportTasksToCsv);
  els.importCsvBtn.addEventListener("click", () => els.importCsvInput.click());
  els.importCsvInput.addEventListener("change", handleCsvImport);
  els.editForm.addEventListener("submit", handleEditTask);
  els.closeModalBtn.addEventListener("click", closeModal);
  els.cancelEditBtn.addEventListener("click", closeModal);
  els.editModal.addEventListener("click", (e) => {
    if (e.target === els.editModal) closeModal();
  });
  els.openSettingsBtn.addEventListener("click", openSettingsModal);
  els.closeSettingsModalBtn.addEventListener("click", closeSettingsModal);
  els.cancelSettingsBtn.addEventListener("click", closeSettingsModal);
  els.saveSettingsBtn.addEventListener("click", handleSaveSettings);
  els.googleConnectBtn.addEventListener("click", handleGoogleConnect);
  els.googleDisconnectBtn.addEventListener("click", handleGoogleDisconnect);
  els.settingsModal.addEventListener("click", (e) => {
    if (e.target === els.settingsModal) closeSettingsModal();
  });

  window.addEventListener("storage", handleStorageSync);
}

function isWebCryptoAvailable() {
  return typeof crypto !== "undefined" && crypto.subtle;
}

async function deriveIrbCryptoKey() {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(IRB_CRYPTO_PEPPER),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(IRB_CRYPTO_SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function obfuscateIrbPassword(plainText) {
  let result = "";
  for (let i = 0; i < plainText.length; i += 1) {
    result += String.fromCharCode(plainText.charCodeAt(i) ^ IRB_CRYPTO_PEPPER.charCodeAt(i % IRB_CRYPTO_PEPPER.length));
  }
  return btoa(result);
}

function deobfuscateIrbPassword(encoded) {
  try {
    const decoded = atob(encoded);
    let result = "";
    for (let i = 0; i < decoded.length; i += 1) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ IRB_CRYPTO_PEPPER.charCodeAt(i % IRB_CRYPTO_PEPPER.length));
    }
    return result;
  } catch {
    return "";
  }
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptIrbPassword(plainText) {
  const trimmed = String(plainText || "").trim();
  if (!trimmed) return "";

  if (isWebCryptoAvailable()) {
    const key = await deriveIrbCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(trimmed)
    );
    const combined = new Uint8Array(iv.length + cipher.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(cipher), iv.length);
    return `enc:${bytesToBase64(combined)}`;
  }

  return `obf:${obfuscateIrbPassword(trimmed)}`;
}

async function decryptIrbPassword(storedValue) {
  const value = String(storedValue || "").trim();
  if (!value) return "";

  try {
    if (value.startsWith("enc:") && isWebCryptoAvailable()) {
      const combined = base64ToBytes(value.slice(4));
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      const key = await deriveIrbCryptoKey();
      const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
      return new TextDecoder().decode(plainBuffer);
    }

    if (value.startsWith("obf:")) {
      return deobfuscateIrbPassword(value.slice(4));
    }
  } catch (err) {
    console.warn("IRB 비밀번호 복호화 실패:", err);
  }

  return "";
}

function formatExternalUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

async function migrateIrbPortalPasswords() {
  let changed = false;

  for (let i = 0; i < SiteMasterStore.sites.length; i += 1) {
    const site = SiteMasterStore.sites[i];
    if (site.irbPassword && !site.irbPasswordEncrypted) {
      SiteMasterStore.sites[i] = {
        ...site,
        irbPasswordEncrypted: await encryptIrbPassword(site.irbPassword),
      };
      delete SiteMasterStore.sites[i].irbPassword;
      changed = true;
    }
  }

  migrateSiteIrbToSystems();

  SiteMasterStore.sites = SiteMasterStore.sites.map((site) => {
    const normalized = normalizeSiteMasterRecord(site);
    if (JSON.stringify(normalized) !== JSON.stringify(site)) changed = true;
    return normalized;
  });

  if (changed) SiteMasterStore.persist();

  let siteSystemsChanged = false;
  for (let i = 0; i < SiteMasterStore.sites.length; i += 1) {
    const site = SiteMasterStore.sites[i];
    if (!Array.isArray(site.systems)) {
      SiteMasterStore.sites[i] = { ...site, systems: [] };
      siteSystemsChanged = true;
      continue;
    }

    for (let j = 0; j < site.systems.length; j += 1) {
      const system = site.systems[j];
      if (system.password && !system.passwordEncrypted) {
        site.systems[j] = {
          ...normalizeSiteSystemRecord(system),
          passwordEncrypted: await encryptIrbPassword(system.password),
        };
        delete site.systems[j].password;
        siteSystemsChanged = true;
      } else {
        const normalized = normalizeSiteSystemRecord(system);
        if (JSON.stringify(normalized) !== JSON.stringify(system)) {
          site.systems[j] = normalized;
          siteSystemsChanged = true;
        }
      }
    }
  }

  if (siteSystemsChanged) {
    SiteMasterStore.sites = SiteMasterStore.sites.map(normalizeSiteMasterRecord);
    SiteMasterStore.persist();
  }

  let studyChanged = false;
  for (let i = 0; i < StudyMasterStore.studies.length; i += 1) {
    const study = StudyMasterStore.studies[i];
    if (!Array.isArray(study.systems)) {
      StudyMasterStore.studies[i] = { ...study, systems: [] };
      studyChanged = true;
      continue;
    }

    for (let j = 0; j < study.systems.length; j += 1) {
      const system = study.systems[j];
      if (system.password && !system.passwordEncrypted) {
        study.systems[j] = {
          ...normalizeStudySystemLinkRecord(system),
          passwordEncrypted: await encryptIrbPassword(system.password),
        };
        delete study.systems[j].password;
        studyChanged = true;
      } else {
        const normalized = normalizeStudySystemLinkRecord(system);
        if (JSON.stringify(normalized) !== JSON.stringify(system)) {
          study.systems[j] = normalized;
          studyChanged = true;
        }
      }
    }
  }

  if (studyChanged) {
    StudyMasterStore.studies = StudyMasterStore.studies.map(normalizeStudyRecord);
    StudyMasterStore.persist();
  }
}

const SiteMasterStore = {
  sites: [],

  load() {
    try {
      const raw = localStorage.getItem(SITE_MASTER_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      this.sites = Array.isArray(parsed) ? parsed.map(normalizeSiteMasterRecord) : [];
    } catch {
      this.sites = [];
    }
  },

  persist() {
    localStorage.setItem(SITE_MASTER_KEY, JSON.stringify(this.sites));
  },

  normalizeKey(name) {
    return String(name || "")
      .trim()
      .replace(/\s+/g, "")
      .toLowerCase();
  },

  getAll() {
    return [...this.sites].sort((a, b) => a.standardName.localeCompare(b.standardName, "ko"));
  },

  getById(id) {
    return this.sites.find((site) => site.id === id) || null;
  },

  getBySiteNumber(siteNumber) {
    const key = String(siteNumber || "").trim();
    if (!key) return null;
    return this.sites.find((site) => site.siteNumber === key) || null;
  },

  findByValue(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return null;
    return (
      this.getById(trimmed) ||
      this.getBySiteNumber(trimmed) ||
      this.findExact(trimmed)
    );
  },

  findExact(input) {
    const key = this.normalizeKey(input);
    if (!key) return null;
    return (
      this.sites.find(
        (site) =>
          this.normalizeKey(site.standardName) === key ||
          site.aliases.some((alias) => this.normalizeKey(alias) === key)
      ) || null
    );
  },

  resolve(input) {
    const match = this.findExact(input);
    return match ? match.standardName : String(input || "").trim();
  },

  findSimilar(input, excludeId = null) {
    const trimmed = String(input || "").trim();
    if (!trimmed) return [];

    const matches = new Map();
    this.sites.forEach((site) => {
      if (site.id === excludeId) return;
      if (isSimilarSiteName(trimmed, site.standardName)) matches.set(site.id, site);
      site.aliases.forEach((alias) => {
        if (isSimilarSiteName(trimmed, alias)) matches.set(site.id, site);
      });
    });
    return [...matches.values()];
  },

  search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();
    return this.getAll().filter((site) => {
      const haystack = [
        site.siteNumber,
        site.standardName,
        site.piName,
        site.piPhoneNumber,
        site.crcName,
        site.crcPhoneNumber,
        site.contact,
        site.pharmacyContactName,
        site.pharmacyPhoneNumber,
        site.labContactName,
        site.labPhoneNumber,
        site.ipStorageLocation,
        site.notes,
        ...(site.systems || []).flatMap((system) => [
          system.systemType,
          system.systemName,
          system.websiteUrl,
          system.loginId,
          system.passwordHint,
          system.notes,
        ]),
        ...site.aliases,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q) || site.aliases.some((alias) => this.normalizeKey(alias).includes(q.replace(/\s+/g, "")));
    });
  },

  create(data) {
    const site = normalizeSiteMasterRecord({
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    this.sites.push(site);
    this.persist();
    return site;
  },

  update(id, data) {
    const idx = this.sites.findIndex((site) => site.id === id);
    if (idx === -1) return null;

    this.sites[idx] = normalizeSiteMasterRecord({
      ...this.sites[idx],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    });
    this.persist();
    return this.sites[idx];
  },

  delete(id) {
    this.sites = this.sites.filter((site) => site.id !== id);
    this.persist();
  },

  getSystems(siteId) {
    const site = this.getById(siteId);
    if (!site) return [];
    return [...(site.systems || [])].sort(
      (a, b) =>
        a.systemType.localeCompare(b.systemType, "ko") ||
        a.systemName.localeCompare(b.systemName, "ko")
    );
  },

  addSystem(siteId, systemData) {
    const site = this.getById(siteId);
    if (!site) return null;

    const system = normalizeSiteSystemRecord({
      ...systemData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    if (!site.systems) site.systems = [];
    site.systems.push(system);
    site.updatedAt = new Date().toISOString();
    this.persist();
    return system;
  },

  updateSystem(siteId, systemId, systemData) {
    const site = this.getById(siteId);
    if (!site) return null;

    const idx = (site.systems || []).findIndex((system) => system.id === systemId);
    if (idx === -1) return null;

    site.systems[idx] = normalizeSiteSystemRecord({
      ...site.systems[idx],
      ...systemData,
      id: systemId,
      updatedAt: new Date().toISOString(),
    });
    site.updatedAt = new Date().toISOString();
    this.persist();
    return site.systems[idx];
  },

  deleteSystem(siteId, systemId) {
    const site = this.getById(siteId);
    if (!site) return false;

    site.systems = (site.systems || []).filter((system) => system.id !== systemId);
    site.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  },

  addAlias(id, alias) {
    const site = this.getById(id);
    if (!site || !alias?.trim()) return null;
    const trimmed = alias.trim();
    if (this.findExact(trimmed)) return site;
    if (!site.aliases.includes(trimmed) && site.standardName !== trimmed) {
      site.aliases.push(trimmed);
      site.aliases.sort((a, b) => a.localeCompare(b, "ko"));
      site.updatedAt = new Date().toISOString();
      this.persist();
    }
    return site;
  },

  ensureStandardSite(rawName, { interactive = true } = {}) {
    const trimmed = rawName.trim();
    if (!trimmed) return "";

    const exact = this.findExact(trimmed);
    if (exact) return exact.standardName;

    const similar = this.findSimilar(trimmed);
    if (interactive && similar.length > 0) {
      const list = similar.map((site) => `· ${site.standardName}`).join("\n");
      if (confirm(`기존 Site와 동일한 기관인가요?\n\n${list}`)) {
        this.addAlias(similar[0].id, trimmed);
        return similar[0].standardName;
      }
    }

    this.create({ standardName: trimmed, aliases: [], siteNumber: "" });
    return trimmed;
  },

  getSearchTermsForSite(value) {
    const resolved = this.resolve(value);
    const entry = this.findExact(resolved);
    if (!entry) return [resolved, value].filter(Boolean);
    return [entry.standardName, ...entry.aliases];
  },
};

function splitLegacyContact(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return { name: "", phone: "" };

  const slashMatch = trimmed.match(/^(.+?)\s*[\/|]\s*(.+)$/);
  if (slashMatch) {
    const part1 = slashMatch[1].trim();
    const part2 = slashMatch[2].trim();
    const isPhone = (text) => /^[\d\s\-+().]+$/.test(text.replace(/\s/g, ""));

    if (isPhone(part2)) return { name: part1, phone: part2 };
    if (isPhone(part1)) return { name: part2, phone: part1 };
    return { name: part1, phone: part2 };
  }

  if (/^[\d\s\-+().]+$/.test(trimmed.replace(/\s/g, ""))) {
    return { name: "", phone: trimmed };
  }

  return { name: trimmed, phone: "" };
}

function formatPharmacySummary(site) {
  if (!site.pharmacyContactName && !site.pharmacyPhoneNumber) return "";
  if (site.pharmacyContactName && site.pharmacyPhoneNumber) {
    return `${site.pharmacyContactName} · ${site.pharmacyPhoneNumber}`;
  }
  return site.pharmacyContactName || site.pharmacyPhoneNumber;
}

function normalizeSiteMasterRecord(site) {
  const aliases = parseAliasNames(site.aliases);
  const standardName = site.standardName?.trim() || "";

  let pharmacyContactName = site.pharmacyContactName?.trim() || "";
  let pharmacyPhoneNumber = site.pharmacyPhoneNumber?.trim() || "";
  let labContactName = site.labContactName?.trim() || "";
  let labPhoneNumber = site.labPhoneNumber?.trim() || "";

  if (!pharmacyContactName && !pharmacyPhoneNumber && site.pharmacyContact) {
    const split = splitLegacyContact(site.pharmacyContact);
    pharmacyContactName = split.name;
    pharmacyPhoneNumber = split.phone;
  }

  if (!labContactName && !labPhoneNumber && site.labContact) {
    const split = splitLegacyContact(site.labContact);
    labContactName = split.name;
    labPhoneNumber = split.phone;
  }

  let piPhoneNumber = site.piPhoneNumber?.trim() || "";
  let crcPhoneNumber = site.crcPhoneNumber?.trim() || "";

  if (!piPhoneNumber && site.contact?.trim()) {
    piPhoneNumber = site.contact.trim();
  }

  return {
    id: site.id || generateId(),
    siteNumber: site.siteNumber?.trim() || "",
    standardName,
    aliases,
    piName: site.piName?.trim() || "",
    piPhoneNumber,
    crcName: site.crcName?.trim() || "",
    crcPhoneNumber,
    contact: site.contact?.trim() || "",
    pharmacyContactName,
    pharmacyPhoneNumber,
    labContactName,
    labPhoneNumber,
    ipStorageLocation: site.ipStorageLocation?.trim() || "",
    notes: site.notes?.trim() || "",
    systems: Array.isArray(site.systems) ? site.systems.map(normalizeSiteSystemRecord) : [],
    createdAt: site.createdAt || new Date().toISOString(),
    ...(site.updatedAt ? { updatedAt: site.updatedAt } : {}),
  };
}

function parseAliasNames(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }
  if (!value) return [];
  return [...new Set(String(value).split(/[,;\n]/).map((item) => item.trim()).filter(Boolean))];
}

function formatAliasNames(aliases) {
  return aliases.join(", ");
}

function isSimilarSiteName(a, b) {
  const na = SiteMasterStore.normalizeKey(a);
  const nb = SiteMasterStore.normalizeKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 3 && nb.length >= 3 && (na.includes(nb) || nb.includes(na))) return true;
  return stringSimilarity(na, nb) >= 0.72;
}

function stringSimilarity(a, b) {
  if (a === b) return 1;
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length >= b.length ? b : a;
  if (!longer.length) return 1;
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
}

function getStandardSiteName(value) {
  const entry = SiteMasterStore.findByValue(value);
  return entry ? entry.standardName : SiteMasterStore.resolve(value);
}

function getSiteOptionValue(site) {
  return site.id;
}

function formatSiteOptionLabel(site) {
  return site.standardName || site.siteNumber || "Site";
}

function resolveSiteMasterEntry(value) {
  return SiteMasterStore.findByValue(value);
}

function getLinkedSitesForProtocol(protocolNumber, includeSiteValue = "") {
  let sites = StudyMasterStore.getSitesForProtocol(protocolNumber);
  const selectedEntry = resolveSiteMasterEntry(includeSiteValue);
  if (selectedEntry && !sites.some((site) => site.id === selectedEntry.id)) {
    sites = [selectedEntry, ...sites];
  }
  return sites.sort((a, b) => a.standardName.localeCompare(b.standardName, "ko"));
}

function updateSiteSelectHint(protocolNumber, hintEl) {
  if (!hintEl) return;
  if (!protocolNumber) {
    hintEl.hidden = true;
    return;
  }
  const sites = StudyMasterStore.getSitesForProtocol(protocolNumber);
  hintEl.hidden = sites.length > 0;
}

function validateStudySiteSelection(study, site, existingTask = null) {
  if (!study) {
    alert("Study Master에 등록된 Study를 선택해 주세요.");
    return false;
  }
  if (!StudyMasterStore.getByProtocol(study)) {
    alert("Study Master에 등록된 Study를 선택해 주세요.");
    return false;
  }
  if (!site) {
    alert("Site를 선택해 주세요.");
    return false;
  }
  const siteEntry = resolveSiteMasterEntry(site);
  if (!siteEntry) {
    alert("Site Master에 등록된 Site를 선택해 주세요.");
    return false;
  }
  const linkedSites = StudyMasterStore.getSitesForProtocol(study);
  if (!linkedSites.some((linkedSite) => linkedSite.id === siteEntry.id)) {
    const sameAsExisting =
      existingTask &&
      existingTask.study === study &&
      getStandardSiteName(site) === getStandardSiteName(existingTask.site);
    if (!sameAsExisting) {
      alert("선택한 Study에 연결된 Site를 선택해 주세요.");
      return false;
    }
  }
  return true;
}

const SystemMasterStore = {
  systems: [],

  load() {
    try {
      const raw = localStorage.getItem(SYSTEM_MASTER_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      this.systems = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.systems = [];
    }
  },

  persist() {
    localStorage.setItem(SYSTEM_MASTER_KEY, JSON.stringify(this.systems));
  },

  getAll() {
    return [...this.systems].sort(
      (a, b) =>
        a.systemType.localeCompare(b.systemType, "ko") ||
        a.systemName.localeCompare(b.systemName, "ko")
    );
  },

  getById(id) {
    return this.systems.find((system) => system.id === id) || null;
  },

  findByNameAndType(systemName, systemType) {
    const name = systemName?.trim().toLowerCase();
    const type = systemType?.trim();
    if (!name || !type) return null;
    return (
      this.systems.find(
        (system) =>
          system.systemName.trim().toLowerCase() === name && system.systemType === type
      ) || null
    );
  },

  getStudyLinkCount(systemMasterId) {
    return StudyMasterStore.studies.reduce(
      (count, study) =>
        count + (study.systems || []).filter((link) => link.systemMasterId === systemMasterId).length,
      0
    );
  },

  search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();
    return this.getAll().filter((system) => {
      const haystack = [system.systemType, system.systemName, system.websiteUrl].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  },

  create(data) {
    const system = normalizeSystemMasterRecord({
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    this.systems.push(system);
    this.persist();
    return system;
  },

  update(id, data) {
    const idx = this.systems.findIndex((system) => system.id === id);
    if (idx === -1) return null;

    this.systems[idx] = normalizeSystemMasterRecord({
      ...this.systems[idx],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    });
    this.persist();
    return this.systems[idx];
  },

  delete(id) {
    this.systems = this.systems.filter((system) => system.id !== id);
    this.persist();
  },
};

const StudyMasterStore = {
  studies: [],

  load() {
    try {
      const raw = localStorage.getItem(STUDY_MASTER_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      this.studies = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.studies = [];
    }
  },

  persist() {
    localStorage.setItem(STUDY_MASTER_KEY, JSON.stringify(this.studies));
  },

  getAll() {
    return [...this.studies];
  },

  getById(id) {
    return this.studies.find((study) => study.id === id) || null;
  },

  getByProtocol(protocolNumber) {
    return this.studies.find((study) => study.protocolNumber === protocolNumber) || null;
  },

  getProtocolNumbers() {
    return this.studies
      .map((study) => study.protocolNumber)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "ko"));
  },

  getSitesForProtocol(protocolNumber) {
    const study = this.getByProtocol(protocolNumber);
    if (!study) return [];
    return (study.siteIds || [])
      .map((id) => SiteMasterStore.getById(id))
      .filter(Boolean)
      .sort((a, b) => a.siteNumber.localeCompare(b.siteNumber, "ko"));
  },

  getLinkedSites(studyId) {
    const study = this.getById(studyId);
    if (!study) return [];
    return (study.siteIds || [])
      .map((id) => SiteMasterStore.getById(id))
      .filter(Boolean)
      .sort((a, b) => a.siteNumber.localeCompare(b.siteNumber, "ko"));
  },

  linkSite(studyId, siteMasterId) {
    const study = this.getById(studyId);
    if (!study) return false;

    if (!study.siteIds) study.siteIds = [];
    if (study.siteIds.includes(siteMasterId)) return true;

    study.siteIds.push(siteMasterId);
    study.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  },

  unlinkSite(studyId, siteMasterId) {
    const study = this.getById(studyId);
    if (!study) return false;

    study.siteIds = (study.siteIds || []).filter((id) => id !== siteMasterId);
    study.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  },

  createStudy(data) {
    const study = normalizeStudyRecord({
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    this.studies.push(study);
    this.studies.sort((a, b) => a.protocolNumber.localeCompare(b.protocolNumber, "ko"));
    this.persist();
    return study;
  },

  updateStudy(id, data) {
    const idx = this.studies.findIndex((study) => study.id === id);
    if (idx === -1) return null;

    this.studies[idx] = normalizeStudyRecord({
      ...this.studies[idx],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    });
    this.studies.sort((a, b) => a.protocolNumber.localeCompare(b.protocolNumber, "ko"));
    this.persist();
    return this.studies[idx];
  },

  deleteStudy(id) {
    this.studies = this.studies.filter((study) => study.id !== id);
    this.persist();
  },

  getSystems(studyId) {
    const study = this.getById(studyId);
    if (!study) return [];
    return [...(study.systems || [])]
      .map(resolveStudySystem)
      .sort(
        (a, b) =>
          a.systemType.localeCompare(b.systemType, "ko") ||
          a.systemName.localeCompare(b.systemName, "ko")
      );
  },

  getSystemLink(studyId, systemId) {
    const study = this.getById(studyId);
    if (!study) return null;
    return (study.systems || []).find((link) => link.id === systemId) || null;
  },

  addSystem(studyId, systemData) {
    const study = this.getById(studyId);
    if (!study) return null;

    const system = normalizeStudySystemLinkRecord({
      ...systemData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    if (!study.systems) study.systems = [];
    study.systems.push(system);
    study.updatedAt = new Date().toISOString();
    this.persist();
    return resolveStudySystem(system);
  },

  updateSystem(studyId, systemId, systemData) {
    const study = this.getById(studyId);
    if (!study) return null;

    const idx = (study.systems || []).findIndex((system) => system.id === systemId);
    if (idx === -1) return null;

    study.systems[idx] = normalizeStudySystemLinkRecord({
      ...study.systems[idx],
      ...systemData,
      id: systemId,
      updatedAt: new Date().toISOString(),
    });
    study.updatedAt = new Date().toISOString();
    this.persist();
    return resolveStudySystem(study.systems[idx]);
  },

  deleteSystem(studyId, systemId) {
    const study = this.getById(studyId);
    if (!study) return false;

    study.systems = (study.systems || []).filter((system) => system.id !== systemId);
    study.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  },

  getTaskRules(studyId) {
    const study = this.getById(studyId);
    if (!study) return [];
    return [...(study.taskRules || [])]
      .map(normalizeStudyTaskRuleRecord)
      .sort((a, b) => {
        const baseCompare = a.baseEvent.localeCompare(b.baseEvent, "ko");
        if (baseCompare !== 0) return baseCompare;
        return a.taskName.localeCompare(b.taskName, "ko");
      });
  },

  getTaskRule(studyId, ruleId) {
    const study = this.getById(studyId);
    if (!study) return null;
    return (study.taskRules || []).find((rule) => rule.id === ruleId) || null;
  },

  addTaskRule(studyId, ruleData) {
    const study = this.getById(studyId);
    if (!study) return null;

    const rule = normalizeStudyTaskRuleRecord({
      ...ruleData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    if (!study.taskRules) study.taskRules = [];
    study.taskRules.push(rule);
    study.updatedAt = new Date().toISOString();
    this.persist();
    return rule;
  },

  updateTaskRule(studyId, ruleId, ruleData) {
    const study = this.getById(studyId);
    if (!study) return null;

    const idx = (study.taskRules || []).findIndex((rule) => rule.id === ruleId);
    if (idx === -1) return null;

    study.taskRules[idx] = normalizeStudyTaskRuleRecord({
      ...study.taskRules[idx],
      ...ruleData,
      id: ruleId,
      updatedAt: new Date().toISOString(),
    });
    study.updatedAt = new Date().toISOString();
    this.persist();
    return study.taskRules[idx];
  },

  deleteTaskRule(studyId, ruleId) {
    const study = this.getById(studyId);
    if (!study) return false;

    study.taskRules = (study.taskRules || []).filter((rule) => rule.id !== ruleId);
    study.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  },

  addCustomTaskName(studyId, taskName) {
    const trimmed = taskName?.trim();
    if (!trimmed || isPresetTaskName(trimmed)) return false;

    const study = this.getById(studyId);
    if (!study) return false;

    if (!study.customTaskNames) study.customTaskNames = [];
    if (study.customTaskNames.includes(trimmed)) return true;

    study.customTaskNames.push(trimmed);
    study.customTaskNames.sort((a, b) => a.localeCompare(b, "ko"));
    study.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  },

  migrateFromTasks(taskList) {
    let changed = false;

    taskList.forEach((task) => {
      const protocolNumber = task.study?.trim();
      const siteValue = task.site?.trim();
      if (!protocolNumber) return;

      let study = this.getByProtocol(protocolNumber);
      if (!study) {
        study = this.createStudy({
          studyName: protocolNumber,
          protocolNumber,
          siteIds: [],
          systems: [],
        });
        changed = true;
      }

      if (!siteValue) return;

      const siteEntry =
        SiteMasterStore.findByValue(siteValue) ||
        SiteMasterStore.getBySiteNumber(siteValue);

      if (siteEntry) {
        if (!(study.siteIds || []).includes(siteEntry.id)) {
          if (!study.siteIds) study.siteIds = [];
          study.siteIds.push(siteEntry.id);
          changed = true;
        }
        return;
      }

      const standardSiteName = SiteMasterStore.resolve(siteValue);
      const created = SiteMasterStore.create({
        siteNumber: siteValue,
        standardName: standardSiteName,
        aliases: [],
      });
      if (!study.siteIds) study.siteIds = [];
      study.siteIds.push(created.id);
      changed = true;
    });

    if (changed) this.persist();
  },
};

const STUDY_SYSTEM_TYPES = [
  "CTMS",
  "EDC",
  "IWRS/IRT",
  "eTMF",
  "Safety Portal",
  "ePRO/eCOA",
  "Training Portal",
  "Vendor Portal",
  "Other",
];

const SITE_SYSTEM_TYPES = [
  "IRB",
  "EMR",
  "LIS/Laboratory System",
  "Hospital Portal",
  "eSource",
  "PACS",
  "Other",
];

const SITE_SYSTEM_TYPE_ALIASES = {
  "Site CTMS": "Hospital Portal",
};

function normalizeSiteSystemRecord(system) {
  const systemType = SITE_SYSTEM_TYPE_ALIASES[system.systemType] || system.systemType;
  return normalizeLoginSystemRecord({ ...system, systemType }, SITE_SYSTEM_TYPES);
}

function migrateSiteIrbToSystems() {
  let changed = false;

  for (let i = 0; i < SiteMasterStore.sites.length; i += 1) {
    const site = SiteMasterStore.sites[i];
    const hasLegacyIrb = Boolean(
      site.irbWebsiteUrl?.trim() ||
      site.irbLoginId?.trim() ||
      site.irbPasswordEncrypted ||
      site.irbPasswordHint?.trim()
    );

    if (!hasLegacyIrb) continue;

    const systems = Array.isArray(site.systems) ? [...site.systems] : [];
    const hasIrbSystem = systems.some((system) => system.systemType === "IRB");

    if (!hasIrbSystem) {
      systems.push(
        normalizeSiteSystemRecord({
          id: generateId(),
          systemType: "IRB",
          systemName: "IRB Portal",
          websiteUrl: site.irbWebsiteUrl?.trim() || "",
          loginId: site.irbLoginId?.trim() || "",
          passwordEncrypted: site.irbPasswordEncrypted || "",
          passwordHint: site.irbPasswordHint?.trim() || "",
          notes: "",
          createdAt: site.createdAt || new Date().toISOString(),
        })
      );
      changed = true;
    }

    SiteMasterStore.sites[i] = normalizeSiteMasterRecord({
      ...site,
      systems,
      irbWebsiteUrl: "",
      irbLoginId: "",
      irbPasswordEncrypted: "",
      irbPasswordHint: "",
    });
    changed = true;
  }

  if (changed) SiteMasterStore.persist();
}

function normalizeSystemMasterRecord(system) {
  const systemType = STUDY_SYSTEM_TYPES.includes(system.systemType) ? system.systemType : "Other";

  return {
    id: system.id || generateId(),
    systemType,
    systemName: system.systemName?.trim() || "",
    websiteUrl: system.websiteUrl?.trim() || "",
    createdAt: system.createdAt || new Date().toISOString(),
    ...(system.updatedAt ? { updatedAt: system.updatedAt } : {}),
  };
}

function normalizeStudySystemLinkRecord(link) {
  return {
    id: link.id || generateId(),
    systemMasterId: link.systemMasterId?.trim() || "",
    loginId: link.loginId?.trim() || "",
    passwordEncrypted: link.passwordEncrypted || "",
    passwordHint: link.passwordHint?.trim() || "",
    notes: link.notes?.trim() || "",
    createdAt: link.createdAt || new Date().toISOString(),
    ...(link.updatedAt ? { updatedAt: link.updatedAt } : {}),
  };
}

function resolveStudySystem(link) {
  const normalized = normalizeStudySystemLinkRecord(link);
  const master = SystemMasterStore.getById(normalized.systemMasterId);

  if (!master) {
    return {
      id: normalized.id,
      systemMasterId: normalized.systemMasterId,
      systemType: link.systemType || "Other",
      systemName: link.systemName || "(삭제된 System)",
      websiteUrl: link.websiteUrl || "",
      loginId: normalized.loginId,
      passwordEncrypted: normalized.passwordEncrypted,
      passwordHint: normalized.passwordHint,
      notes: normalized.notes,
      createdAt: normalized.createdAt,
      updatedAt: normalized.updatedAt,
    };
  }

  return {
    id: normalized.id,
    systemMasterId: normalized.systemMasterId,
    systemType: master.systemType,
    systemName: master.systemName,
    websiteUrl: master.websiteUrl,
    loginId: normalized.loginId,
    passwordEncrypted: normalized.passwordEncrypted,
    passwordHint: normalized.passwordHint,
    notes: normalized.notes,
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
  };
}

function normalizeLoginSystemRecord(system, allowedTypes) {
  const systemType = allowedTypes.includes(system.systemType) ? system.systemType : "Other";

  return {
    id: system.id || generateId(),
    systemType,
    systemName: system.systemName?.trim() || "",
    websiteUrl: system.websiteUrl?.trim() || "",
    loginId: system.loginId?.trim() || "",
    passwordEncrypted: system.passwordEncrypted || "",
    passwordHint: system.passwordHint?.trim() || "",
    notes: system.notes?.trim() || "",
    createdAt: system.createdAt || new Date().toISOString(),
    ...(system.updatedAt ? { updatedAt: system.updatedAt } : {}),
  };
}

function migrateStudySystemsToSystemMaster() {
  let masterChanged = false;
  let studyChanged = false;

  StudyMasterStore.studies.forEach((study) => {
    const nextSystems = (study.systems || []).map((system) => {
      if (system.systemMasterId) {
        const normalized = normalizeStudySystemLinkRecord(system);
        if (JSON.stringify(normalized) !== JSON.stringify(system)) {
          studyChanged = true;
        }
        return normalized;
      }

      if (!system.systemName?.trim()) {
        const normalized = normalizeStudySystemLinkRecord(system);
        if (JSON.stringify(normalized) !== JSON.stringify(system)) {
          studyChanged = true;
        }
        return normalized;
      }

      let master = SystemMasterStore.findByNameAndType(system.systemName, system.systemType);
      if (!master) {
        master = SystemMasterStore.create({
          systemType: system.systemType,
          systemName: system.systemName,
          websiteUrl: system.websiteUrl,
        });
        masterChanged = true;
      }

      studyChanged = true;
      return normalizeStudySystemLinkRecord({
        id: system.id,
        systemMasterId: master.id,
        loginId: system.loginId,
        passwordEncrypted: system.passwordEncrypted,
        passwordHint: system.passwordHint,
        notes: system.notes,
        createdAt: system.createdAt,
        updatedAt: system.updatedAt,
      });
    });

    if (JSON.stringify(nextSystems) !== JSON.stringify(study.systems || [])) {
      study.systems = nextSystems;
      studyChanged = true;
    }
  });

  if (masterChanged) SystemMasterStore.persist();
  if (studyChanged) StudyMasterStore.persist();
}

function renderLoginSystemPasswordCell(system) {
  if (!system.passwordEncrypted) {
    return '<span class="site-info-panel__empty">—</span>';
  }

  return `
    <span class="site-info-panel__password-row">
      <span class="site-info-panel__password-value" data-password-display>********</span>
      <button
        type="button"
        class="btn btn--ghost btn--sm"
        data-toggle-password
        data-encrypted="${escapeAttr(system.passwordEncrypted)}"
        data-visible="false"
      >Show Password</button>
    </span>
  `;
}

function renderLoginSystemWebsiteCell(url) {
  if (!url) return '<span class="site-info-panel__empty">—</span>';
  const href = formatExternalUrl(url);
  return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
}

function renderLoginSystemsTableRows(systems, { editAttr, deleteAttr }) {
  return systems
    .map(
      (system) => `
      <tr>
        <td>${escapeHtml(system.systemType)}</td>
        <td>${escapeHtml(system.systemName)}</td>
        <td>${renderLoginSystemWebsiteCell(system.websiteUrl)}</td>
        <td>${system.loginId ? escapeHtml(system.loginId) : '<span class="site-info-panel__empty">—</span>'}</td>
        <td class="system-password-cell">${renderLoginSystemPasswordCell(system)}</td>
        <td>${system.passwordHint ? escapeHtml(system.passwordHint) : '<span class="site-info-panel__empty">—</span>'}</td>
        <td>${system.notes ? escapeHtml(system.notes) : '<span class="site-info-panel__empty">—</span>'}</td>
        <td class="actions-cell">
          <button type="button" class="btn btn--edit" ${editAttr}="${system.id}">수정</button>
          <button type="button" class="btn btn--danger" ${deleteAttr}="${system.id}">삭제</button>
        </td>
      </tr>
    `
    )
    .join("");
}

function normalizeStudyTaskRuleRecord(rule) {
  const dueUnit = TASK_RULE_DUE_UNITS.some((item) => item.key === rule.dueUnit)
    ? rule.dueUnit
    : "calendar";
  const baseEvent = TASK_RULE_BASE_EVENTS.some((item) => item.key === rule.baseEvent)
    ? rule.baseEvent
    : "mv";
  const dueOffset = Number.isFinite(Number(rule.dueOffset)) ? Math.max(0, Math.round(Number(rule.dueOffset))) : 0;
  const priority = PRIORITIES.includes(rule.priority) ? rule.priority : "Medium";
  const defaultStatus = TASK_RULE_DEFAULT_STATUSES.includes(rule.defaultStatus)
    ? rule.defaultStatus
    : DEFAULT_STATUS;

  return {
    id: rule.id || generateId(),
    taskName: rule.taskName?.trim() || "",
    autoGenerate: rule.autoGenerate !== false,
    dueOffset,
    dueUnit,
    baseEvent,
    priority,
    defaultStatus,
    ...(rule.templateSourceId ? { templateSourceId: rule.templateSourceId } : {}),
    createdAt: rule.createdAt || new Date().toISOString(),
    ...(rule.updatedAt ? { updatedAt: rule.updatedAt } : {}),
  };
}

function getDefaultPriorityForTaskName(taskName) {
  return DEFAULT_TASK_RULE_PRIORITIES[taskName] || "Medium";
}

function getTaskNameOptionsForStudy(study) {
  const presetSet = new Set(TASK_RULE_PRESET_TASK_NAMES);
  const customNames = Array.isArray(study?.customTaskNames) ? study.customTaskNames : [];
  const ruleNames = (study?.taskRules || [])
    .map((rule) => rule.taskName)
    .filter((name) => name && !presetSet.has(name));

  return [...new Set([...TASK_RULE_PRESET_TASK_NAMES, ...customNames, ...ruleNames])].sort((a, b) =>
    a.localeCompare(b, "ko")
  );
}

function isPresetTaskName(taskName) {
  return TASK_RULE_PRESET_TASK_NAMES.includes(taskName);
}

function updateStudyTaskRuleOverrideNotice(study) {
  const hasRules = (study?.taskRules || []).length > 0;
  const panelNotice = document.getElementById("studyTaskRuleOverrideNotice");
  const modalNotice = document.getElementById("studyTaskRuleModalNotice");

  if (panelNotice) {
    panelNotice.hidden = !hasRules;
    panelNotice.textContent = TASK_RULE_OVERRIDE_NOTICE;
  }
  if (modalNotice) {
    modalNotice.hidden = !hasRules;
    modalNotice.textContent = TASK_RULE_OVERRIDE_NOTICE;
  }
}

function populateStudyTaskRuleNameSelect(study, selectedName = "") {
  const select = document.getElementById("studyTaskRuleNameSelect");
  const customInput = document.getElementById("studyTaskRuleCustomName");
  if (!select) return;

  const options = getTaskNameOptionsForStudy(study);
  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Task 선택...";
  select.appendChild(placeholder);

  options.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  const customOption = document.createElement("option");
  customOption.value = "__custom__";
  customOption.textContent = "+ Custom Task...";
  select.appendChild(customOption);

  const trimmed = selectedName.trim();
  if (!trimmed) {
    select.value = "";
    if (customInput) {
      customInput.value = "";
      customInput.hidden = true;
      customInput.required = false;
    }
    return;
  }

  if (options.includes(trimmed)) {
    select.value = trimmed;
    if (customInput) {
      customInput.value = "";
      customInput.hidden = true;
      customInput.required = false;
    }
  } else {
    select.value = "__custom__";
    if (customInput) {
      customInput.value = trimmed;
      customInput.hidden = false;
      customInput.required = true;
    }
  }
}

function handleStudyTaskRuleNameSelectChange() {
  const select = document.getElementById("studyTaskRuleNameSelect");
  const customInput = document.getElementById("studyTaskRuleCustomName");
  const ruleId = document.getElementById("studyTaskRuleId")?.value;
  if (!select || !customInput) return;

  const isCustom = select.value === "__custom__";
  customInput.hidden = !isCustom;
  customInput.required = isCustom;
  if (!isCustom) customInput.value = "";

  if (!ruleId && select.value && select.value !== "__custom__") {
    const prioritySelect = document.getElementById("studyTaskRulePriority");
    if (prioritySelect) {
      prioritySelect.value = getDefaultPriorityForTaskName(select.value);
    }
  }
}

function resolveStudyTaskRuleNameFromForm() {
  const select = document.getElementById("studyTaskRuleNameSelect");
  const customInput = document.getElementById("studyTaskRuleCustomName");
  if (!select) return "";

  if (select.value === "__custom__") {
    return customInput?.value.trim() || "";
  }
  return select.value.trim();
}

function normalizeStudyRecord(study) {
  const siteIds = Array.isArray(study.siteIds)
    ? [...new Set(study.siteIds.filter(Boolean))]
    : [];

  const systems = Array.isArray(study.systems)
    ? study.systems.map(normalizeStudySystemLinkRecord)
    : [];

  const taskRules = Array.isArray(study.taskRules)
    ? study.taskRules.map(normalizeStudyTaskRuleRecord)
    : [];

  const customTaskNames = Array.isArray(study.customTaskNames)
    ? [...new Set(study.customTaskNames.map((name) => name.trim()).filter(Boolean))]
    : [];

  return {
    id: study.id || generateId(),
    studyName: study.studyName?.trim() || study.protocolNumber?.trim() || "",
    protocolNumber: study.protocolNumber?.trim() || "",
    sponsor: study.sponsor?.trim() || "",
    therapeuticArea: study.therapeuticArea?.trim() || "",
    pmName: study.pmName?.trim() || "",
    ctaName: study.ctaName?.trim() || "",
    notes: study.notes?.trim() || "",
    siteIds,
    systems,
    taskRules,
    customTaskNames,
    ...(study.ruleTemplateId ? { ruleTemplateId: study.ruleTemplateId } : {}),
    createdAt: study.createdAt || new Date().toISOString(),
    ...(study.updatedAt ? { updatedAt: study.updatedAt } : {}),
  };
}

function upsertSiteMasterFromLegacy(nested) {
  const stdName = getStandardSiteName(nested.standardSiteName || nested.siteNumber || nested.standardName || "");
  let entry =
    (nested.siteMasterId && SiteMasterStore.getById(nested.siteMasterId)) ||
    (nested.siteNumber && SiteMasterStore.getBySiteNumber(nested.siteNumber)) ||
    SiteMasterStore.findExact(stdName);

  const payload = {
    siteNumber: nested.siteNumber?.trim() || entry?.siteNumber || "",
    standardName: stdName || entry?.standardName || nested.siteNumber?.trim() || "",
    aliases: entry?.aliases || [],
    piName: nested.piName?.trim() || entry?.piName || "",
    piPhoneNumber: nested.piPhoneNumber?.trim() || entry?.piPhoneNumber || "",
    crcName: nested.crcName?.trim() || entry?.crcName || "",
    crcPhoneNumber: nested.crcPhoneNumber?.trim() || entry?.crcPhoneNumber || "",
    contact: nested.contact?.trim() || entry?.contact || "",
    pharmacyContactName: nested.pharmacyContactName?.trim() || entry?.pharmacyContactName || "",
    pharmacyPhoneNumber: nested.pharmacyPhoneNumber?.trim() || entry?.pharmacyPhoneNumber || "",
    labContactName: nested.labContactName?.trim() || entry?.labContactName || "",
    labPhoneNumber: nested.labPhoneNumber?.trim() || entry?.labPhoneNumber || "",
    ipStorageLocation: nested.ipStorageLocation?.trim() || entry?.ipStorageLocation || "",
    notes: nested.notes?.trim() || entry?.notes || "",
  };

  if (entry) {
    SiteMasterStore.update(entry.id, payload);
    return entry.id;
  }

  return SiteMasterStore.create(payload).id;
}

function migrateMasterStructureV2() {
  let studyChanged = false;
  let siteChanged = false;

  StudyMasterStore.studies.forEach((study) => {
    const legacySites = Array.isArray(study.sites) ? study.sites : [];

    if (legacySites.length > 0 && typeof legacySites[0] === "object") {
      const siteIds = [...(study.siteIds || [])];
      legacySites.forEach((nested) => {
        const id = upsertSiteMasterFromLegacy(nested);
        if (!siteIds.includes(id)) siteIds.push(id);
      });
      study.siteIds = siteIds;
      delete study.sites;
      studyChanged = true;
    }

    if (!study.siteIds) {
      study.siteIds = [];
      studyChanged = true;
    }

    if (!study.systems) {
      study.systems = [];
      studyChanged = true;
    }

    if (!study.taskRules) {
      study.taskRules = [];
      studyChanged = true;
    }

    if (!study.customTaskNames) {
      study.customTaskNames = [];
      studyChanged = true;
    }

    (study.taskRules || []).forEach((rule) => {
      const taskName = rule.taskName?.trim();
      if (taskName && !isPresetTaskName(taskName) && !study.customTaskNames.includes(taskName)) {
        study.customTaskNames.push(taskName);
        studyChanged = true;
      }
    });

    if (!study.studyName?.trim() && study.protocolNumber) {
      study.studyName = study.protocolNumber;
      studyChanged = true;
    }

    if (study.irbName !== undefined || study.croContact !== undefined || study.sites !== undefined) {
      delete study.irbName;
      delete study.croContact;
      delete study.sites;
      studyChanged = true;
    }
  });

  SiteMasterStore.sites.forEach((site, idx) => {
    const normalized = normalizeSiteMasterRecord(site);
    if (JSON.stringify(normalized) !== JSON.stringify(site)) {
      SiteMasterStore.sites[idx] = normalized;
      siteChanged = true;
    }
  });

  if (studyChanged) {
    StudyMasterStore.studies = StudyMasterStore.studies.map(normalizeStudyRecord);
    StudyMasterStore.persist();
  }
  if (siteChanged) SiteMasterStore.persist();
}

function switchView(viewName) {
  els.viewTasks.hidden = viewName !== "tasks";
  els.viewStudyMaster.hidden = viewName !== "study-master";
  els.viewSystemMaster.hidden = viewName !== "system-master";
  els.viewSiteMaster.hidden = viewName !== "site-master";
  els.navButtons.forEach((btn) => {
    btn.classList.toggle("app-nav__btn--active", btn.dataset.view === viewName);
  });
  if (viewName === "study-master") renderStudyMaster();
  if (viewName === "system-master") renderSystemMaster();
  if (viewName === "site-master") renderSiteMaster();
  if (viewName === "tasks") refreshTaskStudySiteSelects();
}

function populateStudySelect(selectEl, selectedValue = "") {
  const studies = StudyMasterStore.getAll().sort((a, b) =>
    a.protocolNumber.localeCompare(b.protocolNumber, "ko")
  );

  if (studies.length === 0) {
    selectEl.innerHTML = '<option value="">등록된 Study 없음</option>';
    selectEl.disabled = true;
    return;
  }

  selectEl.disabled = false;
  selectEl.innerHTML =
    '<option value="">Study 선택</option>' +
    studies
      .map((study) => {
        const value = study.protocolNumber;
        const label =
          study.studyName && study.studyName !== study.protocolNumber
            ? `${study.protocolNumber} · ${study.studyName}`
            : study.protocolNumber;
        return `<option value="${escapeAttr(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(label)}</option>`;
      })
      .join("");
}

function populateSiteSelect(selectEl, protocolNumber, selectedValue = "") {
  if (!protocolNumber) {
    selectEl.innerHTML = '<option value="">Site 선택</option>';
    selectEl.disabled = true;
    return;
  }

  const sites = getLinkedSitesForProtocol(protocolNumber, selectedValue);
  selectEl.disabled = sites.length === 0;
  selectEl.innerHTML =
    `<option value="">${sites.length ? "Site 선택" : "연결된 Site 없음"}</option>` +
    sites
      .map((site) => {
        const value = getSiteOptionValue(site);
        const selectedEntry = resolveSiteMasterEntry(selectedValue);
        const isSelected =
          value === selectedValue ||
          (selectedEntry && selectedEntry.id === site.id) ||
          SiteMasterStore.resolve(selectedValue) === site.standardName ||
          site.siteNumber === selectedValue ||
          site.standardName === selectedValue;
        return `<option value="${escapeAttr(value)}"${isSelected ? " selected" : ""}>${escapeHtml(formatSiteOptionLabel(site))}</option>`;
      })
      .join("");
}

function refreshTaskStudySiteSelects() {
  const selectedStudy = els.study.value;
  populateStudySelect(els.study, selectedStudy);
  populateSiteSelect(els.site, selectedStudy, els.site.value);
  updateSiteInfoDisplays();
  updateSiteSelectHint(selectedStudy, els.siteMasterHint);
}

function renderSiteInfoField(label, type, value, encryptedPassword = "") {
  if (type === "url") {
    const href = formatExternalUrl(value);
    const dd = href
      ? `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>`
      : '<span class="site-info-panel__empty">—</span>';
    return `
      <div class="site-info-panel__item">
        <dt>${escapeHtml(label)}</dt>
        <dd>${dd}</dd>
      </div>
    `;
  }

  if (type === "password") {
    if (!encryptedPassword) {
      return `
        <div class="site-info-panel__item">
          <dt>${escapeHtml(label)}</dt>
          <dd><span class="site-info-panel__empty">—</span></dd>
        </div>
      `;
    }

    return `
      <div class="site-info-panel__item site-info-panel__item--password">
        <dt>${escapeHtml(label)}</dt>
        <dd class="site-info-panel__password-row">
          <span class="site-info-panel__password-value" data-password-display>********</span>
          <button
            type="button"
            class="btn btn--ghost btn--sm"
            data-toggle-password
            data-encrypted="${escapeAttr(encryptedPassword)}"
            data-visible="false"
          >Show Password</button>
        </dd>
      </div>
    `;
  }

  return `
    <div class="site-info-panel__item">
      <dt>${escapeHtml(label)}</dt>
      <dd>${value ? escapeHtml(value) : '<span class="site-info-panel__empty">—</span>'}</dd>
    </div>
  `;
}

function bindPasswordToggles(container) {
  if (!container) return;

  container.querySelectorAll("[data-toggle-password]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const display = btn.closest(".site-info-panel__item, td")?.querySelector("[data-password-display]");
      if (!display) return;

      if (btn.dataset.visible === "true") {
        display.textContent = "********";
        btn.textContent = "Show Password";
        btn.dataset.visible = "false";
        return;
      }

      btn.disabled = true;
      const plain = await decryptIrbPassword(btn.dataset.encrypted);
      display.textContent = plain || "—";
      btn.textContent = "Hide Password";
      btn.dataset.visible = "true";
      btn.disabled = false;
    });
  });
}

function bindSiteInfoPasswordToggles(container) {
  bindPasswordToggles(container);
}

function renderSiteInfoSystems(site) {
  const systems = [...(site.systems || [])].sort(
    (a, b) =>
      a.systemType.localeCompare(b.systemType, "ko") ||
      a.systemName.localeCompare(b.systemName, "ko")
  );
  if (!systems.length) return [];

  return systems.flatMap((system) => [
    renderSiteInfoField(`${system.systemType} · ${system.systemName}`, "text", system.systemName),
    renderSiteInfoField(`${system.systemType} Website URL`, "url", system.websiteUrl),
    renderSiteInfoField(`${system.systemType} Login ID`, "text", system.loginId),
    renderSiteInfoField(`${system.systemType} Password`, "password", "", system.passwordEncrypted),
    renderSiteInfoField(`${system.systemType} Password Hint`, "text", system.passwordHint),
  ]);
}

function renderSiteInfoContent(container, site) {
  if (!container) return;
  if (!site) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = [
    renderSiteInfoField("Site Number", "text", site.siteNumber),
    renderSiteInfoField("Standard Site Name", "text", site.standardName),
    renderSiteInfoField("PI Name", "text", site.piName),
    renderSiteInfoField("PI Phone Number", "text", site.piPhoneNumber),
    renderSiteInfoField("CRC Name", "text", site.crcName),
    renderSiteInfoField("CRC Phone Number", "text", site.crcPhoneNumber),
    renderSiteInfoField("Pharmacy Contact Name", "text", site.pharmacyContactName),
    renderSiteInfoField("Pharmacy Phone Number", "text", site.pharmacyPhoneNumber),
    renderSiteInfoField("IP Storage Location", "text", site.ipStorageLocation),
    renderSiteInfoField("Lab Contact Name", "text", site.labContactName),
    renderSiteInfoField("Lab Phone Number", "text", site.labPhoneNumber),
    ...renderSiteInfoSystems(site),
    renderSiteInfoField("Site Notes", "text", site.notes),
  ].join("");

  bindSiteInfoPasswordToggles(container);
}

function updateSiteInfoDisplays() {
  const siteEntry = resolveSiteMasterEntry(els.site.value);
  if (siteEntry) {
    els.siteInfoToggleBtn.hidden = false;
    renderSiteInfoContent(els.siteInfoContent, siteEntry);
    setTaskSiteInfoExpanded(UiSettingsStore.getTaskSiteInfoExpanded(), { persist: false });
  } else {
    els.siteInfoToggleBtn.hidden = true;
    setTaskSiteInfoExpanded(false, { persist: false });
    renderSiteInfoContent(els.siteInfoContent, null);
  }
}

function setTaskSiteInfoExpanded(expanded, { persist = true } = {}) {
  if (!els.siteInfoPanel || !els.siteInfoToggleBtn) return;

  els.siteInfoPanel.hidden = !expanded;
  els.siteInfoToggleBtn.setAttribute("aria-expanded", String(expanded));
  els.siteInfoToggleBtn.textContent = expanded ? "📋 Site 정보 숨기기" : "📋 Site 정보 보기";
  if (persist) {
    UiSettingsStore.setTaskSiteInfoExpanded(expanded);
  }
}

function toggleTaskSiteInfo() {
  setTaskSiteInfoExpanded(els.siteInfoPanel.hidden);
}

function setEditSiteInfoExpanded(expanded) {
  els.editSiteInfoPanel.hidden = !expanded;
  els.editSiteInfoToggleBtn.setAttribute("aria-expanded", String(expanded));
  els.editSiteInfoToggleBtn.textContent = expanded ? "📋 Site 정보 숨기기" : "📋 Site 정보 보기";
}

function toggleEditSiteInfo() {
  setEditSiteInfoExpanded(els.editSiteInfoPanel.hidden);
}

function updateEditSiteInfoDisplay() {
  const siteEntry = resolveSiteMasterEntry(document.getElementById("editSite").value);
  if (siteEntry) {
    els.editSiteInfoToggleBtn.hidden = false;
    renderSiteInfoContent(els.editSiteInfoContent, siteEntry);
  } else {
    els.editSiteInfoToggleBtn.hidden = true;
    setEditSiteInfoExpanded(false);
    renderSiteInfoContent(els.editSiteInfoContent, null);
  }
}

function switchStudyMasterTab(tabName) {
  if (selectedStudyMasterId === "new" && tabName !== "basic") return;
  selectedStudyMasterTab = tabName;
  applyStudyMasterTabUi();
}

function applyStudyMasterTabUi() {
  document.querySelectorAll("[data-study-tab]").forEach((btn) => {
    const tab = btn.dataset.studyTab;
    btn.classList.toggle("site-master-tabs__btn--active", tab === selectedStudyMasterTab);
    btn.disabled = selectedStudyMasterId === "new" && tab !== "basic";
  });

  document.querySelectorAll("[data-study-tab-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.studyTabPanel !== selectedStudyMasterTab;
  });

  const isNewStudy = selectedStudyMasterId === "new";
  const newStudySystemsHint = document.getElementById("studySystemsNewStudyHint");
  const newStudyTaskRulesHint = document.getElementById("studyTaskRulesNewStudyHint");

  if (newStudySystemsHint) newStudySystemsHint.hidden = !isNewStudy || selectedStudyMasterTab !== "systems";
  if (newStudyTaskRulesHint) newStudyTaskRulesHint.hidden = !isNewStudy || selectedStudyMasterTab !== "task-rules";
  if (els.newStudySystemBtn) els.newStudySystemBtn.disabled = isNewStudy;
  if (els.newStudyTaskRuleBtn) els.newStudyTaskRuleBtn.disabled = isNewStudy;
  if (els.linkSiteBtn) els.linkSiteBtn.disabled = isNewStudy;
}

function renderStudyMaster() {
  const studies = StudyMasterStore.getAll();

  if (studies.length === 0) {
    els.studyMasterList.innerHTML = '<li class="study-master-list__empty">등록된 Study가 없습니다.</li>';
  } else {
    els.studyMasterList.innerHTML = studies
      .map(
        (study) => `
        <li>
          <button type="button" class="study-master-list__item${study.id === selectedStudyMasterId ? " study-master-list__item--active" : ""}" data-study-id="${study.id}">
            <span class="study-master-list__name">${escapeHtml(study.studyName || study.protocolNumber)}</span>
            <span class="study-master-list__meta">${escapeHtml(study.protocolNumber)} · Site ${(study.siteIds || []).length}곳 · Rule ${(study.taskRules || []).length}개</span>
          </button>
        </li>
      `
      )
      .join("");

    els.studyMasterList.querySelectorAll("[data-study-id]").forEach((btn) => {
      btn.addEventListener("click", () => selectStudyMaster(btn.dataset.studyId));
    });
  }

  if (!selectedStudyMasterId) {
    els.studyMasterEmpty.hidden = false;
    els.studyMasterForm.hidden = true;
    return;
  }

  if (selectedStudyMasterId === "new") {
    els.studyMasterEmpty.hidden = true;
    els.studyMasterForm.hidden = false;
    selectedStudyMasterTab = "basic";
    els.studyMasterForm.reset();
    document.getElementById("studyMasterId").value = "";
    applyStudyMasterTabUi();
    return;
  }

  const study = StudyMasterStore.getById(selectedStudyMasterId);
  if (!study) {
    selectedStudyMasterId = null;
    renderStudyMaster();
    return;
  }

  els.studyMasterEmpty.hidden = true;
  els.studyMasterForm.hidden = false;

  document.getElementById("studyMasterId").value = study.id;
  document.getElementById("studyName").value = study.studyName;
  document.getElementById("protocolNumber").value = study.protocolNumber;
  document.getElementById("sponsor").value = study.sponsor;
  document.getElementById("therapeuticArea").value = study.therapeuticArea;
  document.getElementById("pmName").value = study.pmName;
  document.getElementById("ctaName").value = study.ctaName;
  document.getElementById("studyNotes").value = study.notes;

  renderLinkedSitesTable(study);
  renderStudySystemsTable(study);
  renderStudyTaskRulesTable(study);
  applyStudyMasterTabUi();
}

function renderStudySystemsTable(study) {
  const systems = StudyMasterStore.getSystems(study.id);

  if (!systems.length) {
    els.studySystemsTableBody.innerHTML =
      '<tr class="empty-row"><td colspan="8">등록된 System이 없습니다.</td></tr>';
    return;
  }

  els.studySystemsTableBody.innerHTML = renderLoginSystemsTableRows(systems, {
    editAttr: "data-edit-system",
    deleteAttr: "data-delete-system",
  });

  bindPasswordToggles(els.studySystemsTableBody);
  els.studySystemsTableBody.querySelectorAll("[data-edit-system]").forEach((btn) => {
    btn.addEventListener("click", () => openStudySystemModal(btn.dataset.editSystem));
  });
  els.studySystemsTableBody.querySelectorAll("[data-delete-system]").forEach((btn) => {
    btn.addEventListener("click", () => handleDeleteStudySystem(btn.dataset.deleteSystem));
  });
}

function renderLinkedSitesTable(study) {
  const linkedSites = StudyMasterStore.getLinkedSites(study.id);

  if (!linkedSites.length) {
    els.linkedSitesTableBody.innerHTML =
      '<tr class="empty-row"><td colspan="6">연결된 Site가 없습니다. Site Master에서 Site를 등록한 후 연결하세요.</td></tr>';
    return;
  }

  els.linkedSitesTableBody.innerHTML = linkedSites
    .map(
      (site) => `
      <tr>
        <td>${escapeHtml(site.siteNumber)}</td>
        <td>${escapeHtml(site.standardName)}</td>
        <td>${escapeHtml(site.piName)}</td>
        <td>${escapeHtml(site.crcName)}</td>
        <td>${escapeHtml(site.contact)}</td>
        <td class="actions-cell">
          <button type="button" class="btn btn--danger" data-unlink-site="${site.id}">연결 해제</button>
        </td>
      </tr>
    `
    )
    .join("");

  els.linkedSitesTableBody.querySelectorAll("[data-unlink-site]").forEach((btn) => {
    btn.addEventListener("click", () => handleUnlinkSite(btn.dataset.unlinkSite));
  });
}

function renderStudyTaskRulesTable(study) {
  const rules = StudyMasterStore.getTaskRules(study.id);
  updateStudyTaskRuleOverrideNotice(study);

  if (!rules.length) {
    els.studyTaskRulesTableBody.innerHTML =
      '<tr class="empty-row"><td colspan="8">등록된 Task Rule이 없습니다. 기본 자동 생성 규칙이 사용됩니다.</td></tr>';
    return;
  }

  els.studyTaskRulesTableBody.innerHTML = rules
    .map(
      (rule) => `
      <tr>
        <td>${escapeHtml(rule.taskName)}</td>
        <td><span class="task-rule-badge task-rule-badge--${rule.autoGenerate ? "on" : "off"}">${rule.autoGenerate ? "On" : "Off"}</span></td>
        <td><span class="priority-badge priority-badge--${priorityClass(rule.priority)}">${escapeHtml(rule.priority)}</span></td>
        <td>${escapeHtml(rule.defaultStatus)}</td>
        <td>+${rule.dueOffset}</td>
        <td>${escapeHtml(TASK_RULE_DUE_UNIT_LABELS[rule.dueUnit] || rule.dueUnit)}</td>
        <td>${escapeHtml(TASK_RULE_BASE_EVENT_LABELS[rule.baseEvent] || rule.baseEvent)}</td>
        <td class="actions-cell">
          <button type="button" class="btn btn--edit" data-edit-task-rule="${rule.id}">수정</button>
          <button type="button" class="btn btn--danger" data-delete-task-rule="${rule.id}">삭제</button>
        </td>
      </tr>
    `
    )
    .join("");

  els.studyTaskRulesTableBody.querySelectorAll("[data-edit-task-rule]").forEach((btn) => {
    btn.addEventListener("click", () => openStudyTaskRuleModal(btn.dataset.editTaskRule));
  });
  els.studyTaskRulesTableBody.querySelectorAll("[data-delete-task-rule]").forEach((btn) => {
    btn.addEventListener("click", () => handleDeleteStudyTaskRule(btn.dataset.deleteTaskRule));
  });
}

function openStudyTaskRuleModal(ruleId = "") {
  if (!selectedStudyMasterId || selectedStudyMasterId === "new") {
    alert("Study를 먼저 저장해 주세요.");
    return;
  }

  const study = StudyMasterStore.getById(selectedStudyMasterId);
  if (!study) return;

  document.getElementById("studyTaskRuleModalTitle").textContent = ruleId ? "Task Rule 수정" : "Task Rule 등록";
  document.getElementById("studyTaskRuleId").value = ruleId || "";
  document.getElementById("studyTaskRuleAutoGenerate").value = "true";
  document.getElementById("studyTaskRuleDueOffset").value = "0";
  document.getElementById("studyTaskRuleDueUnit").value = "calendar";
  document.getElementById("studyTaskRuleBaseEvent").value = "mv";
  document.getElementById("studyTaskRulePriority").value = "Medium";
  document.getElementById("studyTaskRuleDefaultStatus").value = "Open";
  populateStudyTaskRuleNameSelect(study, "");

  updateStudyTaskRuleOverrideNotice(study);

  if (ruleId) {
    const rule = StudyMasterStore.getTaskRule(selectedStudyMasterId, ruleId);
    if (!rule) return;
    populateStudyTaskRuleNameSelect(study, rule.taskName);
    document.getElementById("studyTaskRuleAutoGenerate").value = String(rule.autoGenerate);
    document.getElementById("studyTaskRuleDueOffset").value = String(rule.dueOffset);
    document.getElementById("studyTaskRuleDueUnit").value = rule.dueUnit;
    document.getElementById("studyTaskRuleBaseEvent").value = rule.baseEvent;
    document.getElementById("studyTaskRulePriority").value = rule.priority;
    document.getElementById("studyTaskRuleDefaultStatus").value = rule.defaultStatus;
  }

  els.studyTaskRuleModal.hidden = false;
}

function closeStudyTaskRuleModal() {
  els.studyTaskRuleModal.hidden = true;
  els.studyTaskRuleForm.reset();
  document.getElementById("studyTaskRuleId").value = "";
  handleStudyTaskRuleNameSelectChange();
}

function handleStudyTaskRuleSubmit(e) {
  e.preventDefault();

  const studyId = selectedStudyMasterId;
  if (!studyId || studyId === "new") {
    alert("Study를 먼저 저장해 주세요.");
    return;
  }

  const taskName = resolveStudyTaskRuleNameFromForm();
  if (!taskName) {
    alert("Task Name을 선택하거나 입력해 주세요.");
    return;
  }

  const payload = {
    taskName,
    autoGenerate: document.getElementById("studyTaskRuleAutoGenerate").value === "true",
    dueOffset: Number(document.getElementById("studyTaskRuleDueOffset").value),
    dueUnit: document.getElementById("studyTaskRuleDueUnit").value,
    baseEvent: document.getElementById("studyTaskRuleBaseEvent").value,
    priority: document.getElementById("studyTaskRulePriority").value,
    defaultStatus: document.getElementById("studyTaskRuleDefaultStatus").value,
  };

  const ruleId = document.getElementById("studyTaskRuleId").value;
  const duplicate = StudyMasterStore.getTaskRules(studyId).find(
    (rule) =>
      rule.taskName === taskName &&
      rule.baseEvent === payload.baseEvent &&
      rule.id !== ruleId
  );
  if (duplicate) {
    alert("동일한 Task Name과 기준 이벤트 조합의 Rule이 이미 있습니다.");
    return;
  }

  if (!isPresetTaskName(taskName)) {
    StudyMasterStore.addCustomTaskName(studyId, taskName);
  }

  if (ruleId) {
    StudyMasterStore.updateTaskRule(studyId, ruleId, payload);
  } else {
    StudyMasterStore.addTaskRule(studyId, payload);
  }

  closeStudyTaskRuleModal();
  renderStudyMaster();
}

function handleDeleteStudyTaskRule(ruleId) {
  if (!selectedStudyMasterId || selectedStudyMasterId === "new") return;
  if (!confirm("이 Task Rule을 삭제하시겠습니까?")) return;

  StudyMasterStore.deleteTaskRule(selectedStudyMasterId, ruleId);
  renderStudyMaster();
}

function openNewStudyForm() {
  selectedStudyMasterId = "new";
  selectedStudyMasterTab = "basic";
  els.studyMasterEmpty.hidden = true;
  els.studyMasterForm.hidden = false;
  els.studyMasterForm.reset();
  document.getElementById("studyMasterId").value = "";
  applyStudyMasterTabUi();
}

function selectStudyMaster(studyId) {
  selectedStudyMasterId = studyId;
  renderStudyMaster();
}

function handleStudyMasterSubmit(e) {
  e.preventDefault();

  const studyName = document.getElementById("studyName").value.trim();
  const protocolNumber = document.getElementById("protocolNumber").value.trim();
  if (!studyName) {
    alert("Study Name을 입력해 주세요.");
    return;
  }
  if (!protocolNumber) {
    alert("Protocol Number를 입력해 주세요.");
    return;
  }

  const payload = {
    studyName,
    protocolNumber,
    sponsor: document.getElementById("sponsor").value.trim(),
    therapeuticArea: document.getElementById("therapeuticArea").value.trim(),
    pmName: document.getElementById("pmName").value.trim(),
    ctaName: document.getElementById("ctaName").value.trim(),
    notes: document.getElementById("studyNotes").value.trim(),
  };

  const studyId = document.getElementById("studyMasterId").value;
  const duplicate = StudyMasterStore.getAll().find(
    (study) => study.protocolNumber === protocolNumber && study.id !== studyId
  );
  if (duplicate) {
    alert("이미 등록된 Protocol Number입니다.");
    return;
  }

  if (studyId) {
    StudyMasterStore.updateStudy(studyId, payload);
    selectedStudyMasterId = studyId;
  } else {
    const created = StudyMasterStore.createStudy({ ...payload, siteIds: [], systems: [], taskRules: [], customTaskNames: [] });
    selectedStudyMasterId = created.id;
  }

  renderStudyMaster();
  refreshTaskStudySiteSelects();
  updateStudyFilterOptions();
  alert("Study 정보가 저장되었습니다.");
}

function handleDeleteStudy() {
  const studyId = document.getElementById("studyMasterId").value;
  if (!studyId) return;

  const study = StudyMasterStore.getById(studyId);
  if (!study) return;

  if (!confirm(`"${study.studyName || study.protocolNumber}" Study와 연결된 Site 정보를 모두 해제하시겠습니까?`)) return;

  StudyMasterStore.deleteStudy(studyId);
  selectedStudyMasterId = null;
  renderStudyMaster();
  refreshTaskStudySiteSelects();
  updateStudyFilterOptions();
}

function openLinkSiteModal() {
  if (!selectedStudyMasterId || selectedStudyMasterId === "new") {
    alert("Study를 먼저 저장한 후 Site를 연결할 수 있습니다.");
    return;
  }

  const study = StudyMasterStore.getById(selectedStudyMasterId);
  if (!study) return;

  const available = SiteMasterStore.getAll().filter((site) => !(study.siteIds || []).includes(site.id));
  if (available.length === 0) {
    alert("연결 가능한 Site가 없습니다. Site Master에서 Site를 먼저 등록하세요.");
    return;
  }

  els.linkSiteSelect.innerHTML =
    '<option value="">Site 선택</option>' +
    available
      .map(
        (site) =>
          `<option value="${escapeAttr(site.id)}">${escapeHtml(formatSiteOptionLabel(site))}</option>`
      )
      .join("");

  els.linkSiteModal.hidden = false;
}

function closeLinkSiteModal() {
  els.linkSiteModal.hidden = true;
  els.linkSiteForm.reset();
}

function handleLinkSiteSubmit(e) {
  e.preventDefault();

  const studyId = selectedStudyMasterId;
  const siteMasterId = els.linkSiteSelect.value;
  if (!studyId || !siteMasterId) return;

  StudyMasterStore.linkSite(studyId, siteMasterId);
  closeLinkSiteModal();
  renderStudyMaster();
  refreshTaskStudySiteSelects();
  alert("Site가 Study에 연결되었습니다.");
}

function handleUnlinkSite(siteMasterId) {
  if (!selectedStudyMasterId) return;
  if (!confirm("이 Site 연결을 해제하시겠습니까? Site Master 데이터는 유지됩니다.")) return;

  StudyMasterStore.unlinkSite(selectedStudyMasterId, siteMasterId);
  renderStudyMaster();
  refreshTaskStudySiteSelects();
}

function openStudySystemModal(systemId = null) {
  if (!selectedStudyMasterId || selectedStudyMasterId === "new") {
    alert("Study를 먼저 저장한 후 System을 등록할 수 있습니다.");
    return;
  }

  const study = StudyMasterStore.getById(selectedStudyMasterId);
  if (!study) return;

  document.getElementById("studySystemModalTitle").textContent = systemId ? "System 수정" : "System 등록";
  document.getElementById("studySystemId").value = systemId || "";
  els.studySystemForm.reset();
  document.getElementById("studySystemId").value = systemId || "";

  const masterSelect = document.getElementById("studySystemMasterSelect");

  if (systemId) {
    const link = StudyMasterStore.getSystemLink(study.id, systemId);
    if (!link) return;

    populateStudySystemMasterSelect(link.systemMasterId);
    if (masterSelect) masterSelect.disabled = true;

    document.getElementById("studySystemLoginId").value = link.loginId;
    document.getElementById("studySystemPassword").value = "";
    document.getElementById("studySystemPasswordHint").value = link.passwordHint;
    document.getElementById("studySystemNotes").value = link.notes;
    updateStudySystemPasswordStatus(Boolean(link.passwordEncrypted));
  } else {
    populateStudySystemMasterSelect();
    if (masterSelect) masterSelect.disabled = false;
    updateStudySystemPasswordStatus(false);
  }

  els.studySystemModal.hidden = false;
}

function populateStudySystemMasterSelect(selectedId = "") {
  const select = document.getElementById("studySystemMasterSelect");
  if (!select) return;

  const masters = SystemMasterStore.getAll();
  if (!masters.length) {
    select.innerHTML = '<option value="">등록된 System 없음</option>';
    select.disabled = true;
    return;
  }

  select.disabled = Boolean(selectedId);
  select.innerHTML =
    '<option value="">System 선택...</option>' +
    masters
      .map((master) => {
        return `<option value="${escapeAttr(master.id)}"${master.id === selectedId ? " selected" : ""}>${escapeHtml(master.systemName)}</option>`;
      })
      .join("");
}

function closeStudySystemModal() {
  els.studySystemModal.hidden = true;
  els.studySystemForm.reset();
  const masterSelect = document.getElementById("studySystemMasterSelect");
  if (masterSelect) masterSelect.disabled = false;
  updateStudySystemPasswordStatus(false);
}

function updateStudySystemPasswordStatus(hasSavedPassword) {
  const statusEl = document.getElementById("studySystemPasswordStatus");
  if (!statusEl) return;
  statusEl.hidden = !hasSavedPassword;
}

async function buildStudySystemPayload(studyId, systemId) {
  const existing = systemId ? StudyMasterStore.getSystemLink(studyId, systemId) : null;
  const plainPassword = document.getElementById("studySystemPassword").value;
  let passwordEncrypted = existing?.passwordEncrypted || "";

  if (plainPassword) {
    passwordEncrypted = await encryptIrbPassword(plainPassword);
  }

  const systemMasterId =
    document.getElementById("studySystemMasterSelect").value || existing?.systemMasterId || "";

  return {
    systemMasterId,
    loginId: document.getElementById("studySystemLoginId").value.trim(),
    passwordEncrypted,
    passwordHint: document.getElementById("studySystemPasswordHint").value.trim(),
    notes: document.getElementById("studySystemNotes").value.trim(),
  };
}

async function handleStudySystemSubmit(e) {
  e.preventDefault();

  const studyId = selectedStudyMasterId;
  const systemId = document.getElementById("studySystemId").value;
  if (!studyId || studyId === "new") return;

  const payload = await buildStudySystemPayload(studyId, systemId);

  if (!payload.systemMasterId) {
    alert("System을 선택해 주세요.\n\n새로운 System은 System Master에서 등록해주세요.");
    return;
  }

  const study = StudyMasterStore.getById(studyId);
  const duplicateLink = (study?.systems || []).find(
    (link) => link.systemMasterId === payload.systemMasterId && link.id !== systemId
  );
  if (duplicateLink) {
    alert("이 Study에 이미 동일한 System이 연결되어 있습니다.");
    return;
  }

  if (systemId) {
    StudyMasterStore.updateSystem(studyId, systemId, payload);
  } else {
    StudyMasterStore.addSystem(studyId, payload);
  }

  closeStudySystemModal();
  renderStudyMaster();
  alert("System 정보가 저장되었습니다.");
}

function handleDeleteStudySystem(systemId) {
  if (!selectedStudyMasterId) return;
  if (!confirm("이 Study의 System 연결을 삭제하시겠습니까?\n(System Master 데이터는 유지됩니다.)")) return;

  StudyMasterStore.deleteSystem(selectedStudyMasterId, systemId);
  renderStudyMaster();
}

function renderSystemMaster() {
  const query = els.systemMasterSearch?.value || "";
  const systems = SystemMasterStore.search(query);

  if (systems.length === 0) {
    els.systemMasterList.innerHTML = '<li class="study-master-list__empty">등록된 System이 없습니다.</li>';
  } else {
    els.systemMasterList.innerHTML = systems
      .map(
        (system) => `
        <li>
          <button type="button" class="study-master-list__item${system.id === selectedSystemMasterId ? " study-master-list__item--active" : ""}" data-system-master-id="${system.id}">
            <span class="study-master-list__name">${escapeHtml(system.systemName)}</span>
            <span class="study-master-list__meta">${escapeHtml(system.systemType)} · Study ${SystemMasterStore.getStudyLinkCount(system.id)}개</span>
          </button>
        </li>
      `
      )
      .join("");

    els.systemMasterList.querySelectorAll("[data-system-master-id]").forEach((btn) => {
      btn.addEventListener("click", () => selectSystemMaster(btn.dataset.systemMasterId));
    });
  }

  if (!selectedSystemMasterId) {
    els.systemMasterEmpty.hidden = false;
    els.systemMasterForm.hidden = true;
    if (els.systemMasterUsageInfo) els.systemMasterUsageInfo.textContent = "";
    return;
  }

  if (selectedSystemMasterId === "new") {
    els.systemMasterEmpty.hidden = true;
    els.systemMasterForm.hidden = false;
    document.getElementById("systemMasterEntryId").value = "";
    document.getElementById("systemMasterType").value = "CTMS";
    document.getElementById("systemMasterName").value = "";
    document.getElementById("systemMasterWebsiteUrl").value = "";
    if (els.systemMasterUsageInfo) els.systemMasterUsageInfo.textContent = "";
    return;
  }

  const system = SystemMasterStore.getById(selectedSystemMasterId);
  if (!system) {
    selectedSystemMasterId = null;
    renderSystemMaster();
    return;
  }

  els.systemMasterEmpty.hidden = true;
  els.systemMasterForm.hidden = false;
  document.getElementById("systemMasterEntryId").value = system.id;
  document.getElementById("systemMasterType").value = system.systemType;
  document.getElementById("systemMasterName").value = system.systemName;
  document.getElementById("systemMasterWebsiteUrl").value = system.websiteUrl;

  const usageCount = SystemMasterStore.getStudyLinkCount(system.id);
  if (els.systemMasterUsageInfo) {
    els.systemMasterUsageInfo.textContent =
      usageCount > 0
        ? `이 System은 ${usageCount}개 Study에서 사용 중입니다. Master 정보를 수정하면 연결된 Study에 모두 반영됩니다.`
        : "아직 Study에 연결되지 않은 System입니다.";
  }
}

function openNewSystemMasterForm() {
  selectedSystemMasterId = "new";
  renderSystemMaster();
}

function selectSystemMaster(systemMasterId) {
  selectedSystemMasterId = systemMasterId;
  renderSystemMaster();
}

function handleSystemMasterSubmit(e) {
  e.preventDefault();

  const systemId = document.getElementById("systemMasterEntryId").value;
  const payload = {
    systemType: document.getElementById("systemMasterType").value,
    systemName: document.getElementById("systemMasterName").value.trim(),
    websiteUrl: document.getElementById("systemMasterWebsiteUrl").value.trim(),
  };

  if (!payload.systemName) {
    alert("System Name을 입력해 주세요.");
    return;
  }

  const duplicate = SystemMasterStore.getAll().find(
    (system) =>
      system.systemName.trim().toLowerCase() === payload.systemName.toLowerCase() &&
      system.systemType === payload.systemType &&
      system.id !== systemId
  );
  if (duplicate) {
    alert("동일한 System Type과 Name이 이미 System Master에 등록되어 있습니다.");
    return;
  }

  if (systemId) {
    SystemMasterStore.update(systemId, payload);
    selectedSystemMasterId = systemId;
  } else {
    const created = SystemMasterStore.create(payload);
    selectedSystemMasterId = created.id;
  }

  renderSystemMaster();
  renderStudyMaster();
  alert("System Master 정보가 저장되었습니다.");
}

function handleDeleteSystemMaster() {
  const systemId = document.getElementById("systemMasterEntryId").value;
  if (!systemId) return;

  const usageCount = SystemMasterStore.getStudyLinkCount(systemId);
  if (usageCount > 0) {
    alert(`이 System은 ${usageCount}개 Study에서 사용 중입니다.\nStudy에서 System 연결을 먼저 해제한 후 삭제할 수 있습니다.`);
    return;
  }

  if (!confirm("이 System Master를 삭제하시겠습니까?")) return;

  SystemMasterStore.delete(systemId);
  selectedSystemMasterId = null;
  renderSystemMaster();
}

function switchSiteMasterTab(tabName) {
  if (selectedSiteMasterId === "new" && tabName === "system") return;
  if (tabName === "irb") tabName = "system";
  selectedSiteMasterTab = tabName;
  applySiteMasterTabUi();
}

function applySiteMasterTabUi() {
  document.querySelectorAll("[data-site-tab]").forEach((btn) => {
    const tab = btn.dataset.siteTab;
    btn.classList.toggle("site-master-tabs__btn--active", tab === selectedSiteMasterTab);
    btn.disabled = selectedSiteMasterId === "new" && tab === "system";
  });

  document.querySelectorAll("[data-site-tab-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.siteTabPanel !== selectedSiteMasterTab;
  });

  const newSiteHint = document.getElementById("siteSystemsNewSiteHint");
  const newSiteSystemBtn = els.newSiteSystemBtn;
  const isNewSite = selectedSiteMasterId === "new";

  if (newSiteHint) newSiteHint.hidden = !isNewSite || selectedSiteMasterTab !== "system";
  if (newSiteSystemBtn) newSiteSystemBtn.disabled = isNewSite;
}

function renderSiteMaster() {
  if (selectedSiteMasterTab === "irb") selectedSiteMasterTab = "system";

  const query = els.siteMasterSearch?.value || "";
  const sites = SiteMasterStore.search(query);

  if (sites.length === 0) {
    els.siteMasterList.innerHTML = '<li class="study-master-list__empty">등록된 Site가 없습니다.</li>';
  } else {
    els.siteMasterList.innerHTML = sites
      .map(
        (site) => `
        <li>
          <button type="button" class="study-master-list__item${site.id === selectedSiteMasterId ? " study-master-list__item--active" : ""}" data-site-master-id="${site.id}">
            <span class="study-master-list__name">${escapeHtml(site.standardName || site.siteNumber || "Site")}</span>
            <span class="study-master-list__meta">${escapeHtml(site.siteNumber || "Site Number 미등록")}${site.piName ? ` · PI ${site.piName}` : ""}${site.crcName ? ` · CRC ${site.crcName}` : ""}</span>
          </button>
        </li>
      `
      )
      .join("");

    els.siteMasterList.querySelectorAll("[data-site-master-id]").forEach((btn) => {
      btn.addEventListener("click", () => selectSiteMasterEntry(btn.dataset.siteMasterId));
    });
  }

  if (!selectedSiteMasterId) {
    els.siteMasterEmpty.hidden = false;
    els.siteMasterForm.hidden = true;
    return;
  }

  if (selectedSiteMasterId === "new") {
    els.siteMasterEmpty.hidden = true;
    els.siteMasterForm.hidden = false;
    selectedSiteMasterTab = "basic";
    applySiteMasterTabUi();
    return;
  }

  const site = SiteMasterStore.getById(selectedSiteMasterId);
  if (!site) {
    selectedSiteMasterId = null;
    renderSiteMaster();
    return;
  }

  els.siteMasterEmpty.hidden = true;
  els.siteMasterForm.hidden = false;
  document.getElementById("siteMasterEntryId").value = site.id;
  document.getElementById("smSiteNumber").value = site.siteNumber;
  document.getElementById("standardSiteName").value = site.standardName;
  document.getElementById("aliasNames").value = formatAliasNames(site.aliases);
  document.getElementById("smPiName").value = site.piName;
  document.getElementById("smPiPhoneNumber").value = site.piPhoneNumber;
  document.getElementById("smCrcName").value = site.crcName;
  document.getElementById("smCrcPhoneNumber").value = site.crcPhoneNumber;
  document.getElementById("smPharmacyContactName").value = site.pharmacyContactName;
  document.getElementById("smPharmacyPhoneNumber").value = site.pharmacyPhoneNumber;
  document.getElementById("smLabContactName").value = site.labContactName;
  document.getElementById("smLabPhoneNumber").value = site.labPhoneNumber;
  document.getElementById("smIpStorageLocation").value = site.ipStorageLocation;
  document.getElementById("smSiteNotes").value = site.notes;
  renderSiteSystemsTable(site);
  applySiteMasterTabUi();
}

function renderSiteSystemsTable(site) {
  const systems = SiteMasterStore.getSystems(site.id);

  if (!systems.length) {
    els.siteSystemsTableBody.innerHTML =
      '<tr class="empty-row"><td colspan="8">등록된 System이 없습니다.</td></tr>';
    return;
  }

  els.siteSystemsTableBody.innerHTML = renderLoginSystemsTableRows(systems, {
    editAttr: "data-edit-site-system",
    deleteAttr: "data-delete-site-system",
  });

  bindPasswordToggles(els.siteSystemsTableBody);
  els.siteSystemsTableBody.querySelectorAll("[data-edit-site-system]").forEach((btn) => {
    btn.addEventListener("click", () => openSiteSystemModal(btn.dataset.editSiteSystem));
  });
  els.siteSystemsTableBody.querySelectorAll("[data-delete-site-system]").forEach((btn) => {
    btn.addEventListener("click", () => handleDeleteSiteSystem(btn.dataset.deleteSiteSystem));
  });
}

function openNewSiteMasterForm() {
  selectedSiteMasterId = "new";
  selectedSiteMasterTab = "basic";
  els.siteMasterEmpty.hidden = true;
  els.siteMasterForm.hidden = false;
  els.siteMasterForm.reset();
  document.getElementById("siteMasterEntryId").value = "";
  applySiteMasterTabUi();
}

async function buildSiteMasterPayload(entryId) {
  const existing = entryId ? SiteMasterStore.getById(entryId) : null;

  return {
    siteNumber: document.getElementById("smSiteNumber").value.trim(),
    standardName: document.getElementById("standardSiteName").value.trim(),
    aliases: parseAliasNames(document.getElementById("aliasNames").value),
    piName: document.getElementById("smPiName").value.trim(),
    piPhoneNumber: document.getElementById("smPiPhoneNumber").value.trim(),
    crcName: document.getElementById("smCrcName").value.trim(),
    crcPhoneNumber: document.getElementById("smCrcPhoneNumber").value.trim(),
    contact: existing?.contact || "",
    pharmacyContactName: document.getElementById("smPharmacyContactName").value.trim(),
    pharmacyPhoneNumber: document.getElementById("smPharmacyPhoneNumber").value.trim(),
    labContactName: document.getElementById("smLabContactName").value.trim(),
    labPhoneNumber: document.getElementById("smLabPhoneNumber").value.trim(),
    ipStorageLocation: document.getElementById("smIpStorageLocation").value.trim(),
    notes: document.getElementById("smSiteNotes").value.trim(),
  };
}

function selectSiteMasterEntry(siteId) {
  selectedSiteMasterId = siteId;
  renderSiteMaster();
}

async function handleSiteMasterSubmit(e) {
  e.preventDefault();

  const entryId = document.getElementById("siteMasterEntryId").value;
  const payload = await buildSiteMasterPayload(entryId);
  const { siteNumber, standardName, aliases } = payload;

  if (!siteNumber) {
    alert("Site Number를 입력해 주세요.");
    return;
  }
  if (!standardName) {
    alert("Standard Site Name을 입력해 주세요.");
    return;
  }

  const duplicateNumber = SiteMasterStore.sites.find(
    (site) => site.siteNumber === siteNumber && site.id !== entryId
  );
  if (duplicateNumber) {
    alert("동일한 Site Number가 이미 등록되어 있습니다.");
    return;
  }

  const duplicateStandard = SiteMasterStore.sites.find(
    (site) => site.standardName === standardName && site.id !== entryId
  );
  if (duplicateStandard) {
    alert("동일한 Standard Site Name이 이미 등록되어 있습니다.");
    return;
  }

  if (!entryId) {
    const similar = SiteMasterStore.findSimilar(standardName);
    if (similar.length > 0) {
      const list = similar.map((site) => `· ${site.standardName}`).join("\n");
      if (confirm(`기존 Site와 동일한 기관인가요?\n\n${list}`)) {
        SiteMasterStore.addAlias(similar[0].id, standardName);
        aliases.forEach((alias) => SiteMasterStore.addAlias(similar[0].id, alias));
        SiteMasterStore.update(similar[0].id, {
          siteNumber: similar[0].siteNumber || payload.siteNumber,
          piName: payload.piName || similar[0].piName,
          piPhoneNumber: payload.piPhoneNumber || similar[0].piPhoneNumber,
          crcName: payload.crcName || similar[0].crcName,
          crcPhoneNumber: payload.crcPhoneNumber || similar[0].crcPhoneNumber,
          contact: payload.contact || similar[0].contact,
          pharmacyContactName: payload.pharmacyContactName || similar[0].pharmacyContactName,
          pharmacyPhoneNumber: payload.pharmacyPhoneNumber || similar[0].pharmacyPhoneNumber,
          labContactName: payload.labContactName || similar[0].labContactName,
          labPhoneNumber: payload.labPhoneNumber || similar[0].labPhoneNumber,
          ipStorageLocation: payload.ipStorageLocation || similar[0].ipStorageLocation,
          notes: payload.notes || similar[0].notes,
        });
        selectedSiteMasterId = similar[0].id;
        reconcileSiteNamesAfterMasterChange();
        renderSiteMaster();
        refreshTaskStudySiteSelects();
        renderAll();
        alert("기존 Site에 병합되었습니다.");
        return;
      }
    }
    const created = SiteMasterStore.create(payload);
    selectedSiteMasterId = created.id;
  } else {
    SiteMasterStore.update(entryId, payload);
    selectedSiteMasterId = entryId;
  }

  reconcileSiteNamesAfterMasterChange();
  renderSiteMaster();
  refreshTaskStudySiteSelects();
  renderAll();
  alert("Site Master 정보가 저장되었습니다.");
}

function handleDeleteSiteMaster() {
  const entryId = document.getElementById("siteMasterEntryId").value;
  if (!entryId) return;

  const site = SiteMasterStore.getById(entryId);
  if (!site) return;

  if (!confirm(`"${site.standardName}" Site Master 항목을 삭제하시겠습니까?`)) return;

  SiteMasterStore.delete(entryId);
  selectedSiteMasterId = null;
  renderSiteMaster();
}

function openSiteSystemModal(systemId = null) {
  if (!selectedSiteMasterId || selectedSiteMasterId === "new") {
    alert("Site를 먼저 저장한 후 System을 등록할 수 있습니다.");
    return;
  }

  const site = SiteMasterStore.getById(selectedSiteMasterId);
  if (!site) return;

  document.getElementById("siteSystemModalTitle").textContent = systemId ? "System 수정" : "System 등록";
  document.getElementById("siteSystemId").value = systemId || "";

  if (systemId) {
    const system = (site.systems || []).find((item) => item.id === systemId);
    if (!system) return;
    document.getElementById("siteSystemType").value = system.systemType;
    document.getElementById("siteSystemName").value = system.systemName;
    document.getElementById("siteSystemWebsiteUrl").value = system.websiteUrl;
    document.getElementById("siteSystemLoginId").value = system.loginId;
    document.getElementById("siteSystemPassword").value = "";
    document.getElementById("siteSystemPasswordHint").value = system.passwordHint;
    document.getElementById("siteSystemNotes").value = system.notes;
    updateSiteSystemPasswordStatus(Boolean(system.passwordEncrypted));
  } else {
    els.siteSystemForm.reset();
    document.getElementById("siteSystemId").value = "";
    document.getElementById("siteSystemType").value = "EMR";
    updateSiteSystemPasswordStatus(false);
  }

  els.siteSystemModal.hidden = false;
}

function closeSiteSystemModal() {
  els.siteSystemModal.hidden = true;
  els.siteSystemForm.reset();
  updateSiteSystemPasswordStatus(false);
}

function updateSiteSystemPasswordStatus(hasSavedPassword) {
  const statusEl = document.getElementById("siteSystemPasswordStatus");
  if (!statusEl) return;
  statusEl.hidden = !hasSavedPassword;
}

async function buildSiteSystemPayload(siteId, systemId) {
  const site = SiteMasterStore.getById(siteId);
  const existing = systemId ? (site?.systems || []).find((item) => item.id === systemId) : null;
  const plainPassword = document.getElementById("siteSystemPassword").value;
  let passwordEncrypted = existing?.passwordEncrypted || "";

  if (plainPassword) {
    passwordEncrypted = await encryptIrbPassword(plainPassword);
  }

  return {
    systemType: document.getElementById("siteSystemType").value,
    systemName: document.getElementById("siteSystemName").value.trim(),
    websiteUrl: document.getElementById("siteSystemWebsiteUrl").value.trim(),
    loginId: document.getElementById("siteSystemLoginId").value.trim(),
    passwordEncrypted,
    passwordHint: document.getElementById("siteSystemPasswordHint").value.trim(),
    notes: document.getElementById("siteSystemNotes").value.trim(),
  };
}

async function handleSiteSystemSubmit(e) {
  e.preventDefault();

  const siteId = selectedSiteMasterId;
  const systemId = document.getElementById("siteSystemId").value;
  if (!siteId || siteId === "new") return;

  const payload = await buildSiteSystemPayload(siteId, systemId);
  if (!payload.systemName) {
    alert("System Name을 입력해 주세요.");
    return;
  }

  if (systemId) {
    SiteMasterStore.updateSystem(siteId, systemId, payload);
  } else {
    SiteMasterStore.addSystem(siteId, payload);
  }

  closeSiteSystemModal();
  renderSiteMaster();
  alert("System 정보가 저장되었습니다.");
}

function handleDeleteSiteSystem(systemId) {
  if (!selectedSiteMasterId) return;
  if (!confirm("이 System을 삭제하시겠습니까?")) return;

  SiteMasterStore.deleteSystem(selectedSiteMasterId, systemId);
  renderSiteMaster();
}

function reconcileSiteNamesAfterMasterChange() {
  tasks = tasks.map((task) => ({
    ...task,
    site: getStandardSiteName(task.site),
  }));
  TaskStore.persist();
}

async function seedSiteMasterIfEmpty() {
  if (SiteMasterStore.getAll().length > 0) return;

  const demoPassword = await encryptIrbPassword("DemoPass123!");

  const site101 = SiteMasterStore.create({
    siteNumber: "Site 101",
    standardName: "한림성심대학교병원",
    aliases: ["한림성심", "한림 성심", "한림성심대병원", "한림대학교성심병원", "한림 성심대병원"],
    piName: "Dr. Hong",
    piPhoneNumber: "02-1234-5678",
    crcName: "Park CRC",
    pharmacyContactName: "김약사",
    pharmacyPhoneNumber: "02-1234-5678",
    labContactName: "이검사",
    labPhoneNumber: "02-2345-6789",
    ipStorageLocation: "약국 IP 보관실 (B1F)",
    notes: "",
    systems: [],
  });

  SiteMasterStore.addSystem(site101.id, {
    systemType: "IRB",
    systemName: "IRB Portal",
    websiteUrl: "https://irb.example.com",
    loginId: "cra.user@example.com",
    passwordEncrypted: demoPassword,
    passwordHint: "병원 포털 초기 비밀번호",
    notes: "",
  });

  SiteMasterStore.addSystem(site101.id, {
    systemType: "EMR",
    systemName: "Hospital EMR",
    websiteUrl: "https://emr.example.com",
    loginId: "cra.emr@hospital.com",
    passwordEncrypted: demoPassword,
    passwordHint: "Hospital SSO",
    notes: "Primary EMR access",
  });

  SiteMasterStore.addSystem(site101.id, {
    systemType: "LIS/Laboratory System",
    systemName: "Central Lab System",
    websiteUrl: "https://lab.example.com",
    loginId: "cra.lab@hospital.com",
    passwordEncrypted: demoPassword,
    passwordHint: "Lab portal password",
    notes: "",
  });

  [
    { siteNumber: "Site 102", piName: "Dr. Choi", piPhoneNumber: "02-2345-6789", crcName: "Jung CRC" },
    { siteNumber: "Site 103", piName: "Dr. Yoon", piPhoneNumber: "02-3456-7890", crcName: "Han CRC" },
    { siteNumber: "Site 201", piName: "Dr. Shin", crcName: "Kang CRC" },
    { siteNumber: "Site 202", piName: "Dr. Lim", crcName: "Oh CRC" },
    { siteNumber: "Site 301", piName: "Dr. Baek", crcName: "Song CRC" },
  ].forEach((site) => SiteMasterStore.create({ ...site, standardName: site.siteNumber, aliases: [] }));
}

async function seedStudyMasterIfEmpty() {
  if (StudyMasterStore.getAll().length > 0) return;

  const site101 = SiteMasterStore.getBySiteNumber("Site 101");
  const site102 = SiteMasterStore.getBySiteNumber("Site 102");
  const site103 = SiteMasterStore.getBySiteNumber("Site 103");
  const site201 = SiteMasterStore.getBySiteNumber("Site 201");
  const site202 = SiteMasterStore.getBySiteNumber("Site 202");
  const site301 = SiteMasterStore.getBySiteNumber("Site 301");

  const demoPassword = await encryptIrbPassword("DemoPass123!");

  const veevaMaster = SystemMasterStore.create({
    systemType: "CTMS",
    systemName: "Veeva CTMS",
    websiteUrl: "https://ctms.example.com",
  });

  const raveMaster = SystemMasterStore.create({
    systemType: "EDC",
    systemName: "Medidata Rave",
    websiteUrl: "https://edc.example.com",
  });

  const abcStudy = StudyMasterStore.createStudy({
    studyName: "ABC-301 Phase III Oncology Study",
    protocolNumber: "ABC-301",
    sponsor: "Example Pharma",
    therapeuticArea: "Oncology",
    pmName: "Kim PM",
    ctaName: "Lee CTA",
    notes: "Phase III study",
    siteIds: [site101, site102, site103].filter(Boolean).map((s) => s.id),
    systems: [],
  });

  StudyMasterStore.addSystem(abcStudy.id, {
    systemMasterId: veevaMaster.id,
    loginId: "cra.user@example.com",
    passwordEncrypted: demoPassword,
    passwordHint: "Corporate SSO",
    notes: "Primary CTMS",
  });

  StudyMasterStore.addSystem(abcStudy.id, {
    systemMasterId: raveMaster.id,
    loginId: "cra.rave@example.com",
    passwordEncrypted: demoPassword,
    passwordHint: "Study-specific password",
    notes: "",
  });

  StudyMasterStore.addTaskRule(abcStudy.id, {
    taskName: "CTMS Update",
    autoGenerate: true,
    dueOffset: 2,
    dueUnit: "business",
    baseEvent: "mv",
    priority: "High",
    defaultStatus: "Open",
  });
  StudyMasterStore.addTaskRule(abcStudy.id, {
    taskName: "MV Report 작성",
    autoGenerate: true,
    dueOffset: 5,
    dueUnit: "calendar",
    baseEvent: "mv",
    priority: "Critical",
    defaultStatus: "Open",
  });
  StudyMasterStore.addTaskRule(abcStudy.id, {
    taskName: "Follow-up Letter 발송",
    autoGenerate: true,
    dueOffset: 7,
    dueUnit: "calendar",
    baseEvent: "mv",
    priority: "Medium",
    defaultStatus: "Open",
  });

  const xyzStudy = StudyMasterStore.createStudy({
    studyName: "XYZ-102 Cardiology Study",
    protocolNumber: "XYZ-102",
    sponsor: "Global Bio",
    therapeuticArea: "Cardiology",
    pmName: "Park PM",
    ctaName: "Choi CTA",
    siteIds: [site201, site202].filter(Boolean).map((s) => s.id),
    systems: [],
  });

  StudyMasterStore.addSystem(xyzStudy.id, {
    systemMasterId: raveMaster.id,
    loginId: "cra.xyz@example.com",
    passwordEncrypted: demoPassword,
    passwordHint: "Shared EDC login",
    notes: "Medidata Rave 재사용 예시",
  });

  StudyMasterStore.createStudy({
    studyName: "DEF-205 Immunology Study",
    protocolNumber: "DEF-205",
    sponsor: "MediCore",
    therapeuticArea: "Immunology",
    siteIds: [site301].filter(Boolean).map((s) => s.id),
    systems: [],
  });
}

const TaskStore = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(isValidTask).map(normalizeTask);
    } catch (err) {
      console.warn("Local Storage 데이터를 불러오지 못했습니다:", err);
      return [];
    }
  },

  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error("Local Storage에 저장하지 못했습니다:", err);
      alert("업무 데이터 저장에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.");
      return false;
    }
  },

  persist() {
    return this.save(tasks);
  },

  add(task) {
    tasks.unshift(task);
    this.persist();
  },

  addMany(newTasks) {
    tasks = [...newTasks, ...tasks];
    this.persist();
  },

  replaceAll(newTasks) {
    tasks = newTasks;
    this.persist();
  },

  update(id, updates) {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return false;

    tasks[idx] = {
      ...tasks[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return true;
  },

  remove(id) {
    tasks = tasks.filter((t) => t.id !== id);
    this.persist();
  },

  removeMany(ids) {
    const idSet = new Set(ids);
    tasks = tasks.filter((t) => !idSet.has(t.id));
    this.persist();
  },

  detachSubtasks(parentId) {
    let changed = false;
    tasks = tasks.map((task) => {
      if (task.parentTaskId !== parentId) return task;

      changed = true;
      const updated = {
        ...task,
        updatedAt: new Date().toISOString(),
      };
      delete updated.parentTaskId;
      delete updated.autoGenerated;
      return updated;
    });
    if (changed) this.persist();
  },
};

function migrateTaskStatus(status) {
  if (STATUSES.includes(status)) return status;
  return LEGACY_STATUS_MAP[status] || DEFAULT_STATUS;
}

function migrateTaskStatuses() {
  let changed = false;
  tasks = tasks.map((task) => {
    const migrated = migrateTaskStatus(task.status);
    if (migrated !== task.status) {
      changed = true;
      return { ...task, status: migrated, updatedAt: new Date().toISOString() };
    }
    return task;
  });
  if (changed) TaskStore.persist();
}

function isValidTask(item) {
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.study === "string" &&
    typeof item.site === "string" &&
    typeof item.task === "string" &&
    typeof item.dueDate === "string" &&
    typeof item.status === "string"
  );
}

function normalizeTask(item) {
  const normalized = {
    id: item.id,
    study: item.study,
    site: item.site,
    task: item.task,
    dueDate: item.dueDate,
    status: migrateTaskStatus(item.status),
    priority: PRIORITIES.includes(item.priority) ? item.priority : "Medium",
    createdAt: item.createdAt || new Date().toISOString(),
    ...(item.updatedAt ? { updatedAt: item.updatedAt } : {}),
  };

  if (item.sourceVisit && typeof item.sourceVisit === "object") {
    normalized.sourceVisit = {
      type: item.sourceVisit.type || "",
      date: item.sourceVisit.date || "",
      study: item.sourceVisit.study || item.study,
      site: item.sourceVisit.site || item.site,
    };
  }

  if (item.parentTaskId) {
    normalized.parentTaskId = item.parentTaskId;
  }

  if (item.autoGenerated || item.parentTaskId) {
    normalized.autoGenerated = true;
  } else if (item.autoGenerated === false) {
    normalized.autoGenerated = false;
  }

  if (item.visitGroupId) {
    normalized.visitGroupId = item.visitGroupId;
  }

  if (item.dueDateManuallyEdited) {
    normalized.dueDateManuallyEdited = true;
  }

  const calendarSync = normalizeCalendarSync(item.calendarSync, item);
  if (calendarSync) {
    normalized.calendarSync = calendarSync;
  }

  return normalized;
}

function normalizeCalendarSync(calendarSync, item = {}) {
  const legacyEventId =
    item.googleCalendarEventId ||
    item.googleCalendar?.eventId ||
    (typeof calendarSync === "string" ? calendarSync : null);

  const source =
    calendarSync && typeof calendarSync === "object" ? calendarSync : legacyEventId ? { eventId: legacyEventId } : null;

  if (!source?.eventId) return null;

  const normalized = {
    eventId: String(source.eventId),
    provider: source.provider || "google",
  };

  if (source.calendarId) normalized.calendarId = String(source.calendarId);
  if (source.htmlLink) normalized.htmlLink = String(source.htmlLink);
  if (source.etag) normalized.etag = String(source.etag);
  if (source.linkedAt) normalized.linkedAt = source.linkedAt;
  if (source.lastSyncedAt) normalized.lastSyncedAt = source.lastSyncedAt;

  return normalized;
}

function linkGoogleCalendarEvent(taskId, eventId, options = {}) {
  if (!taskId || !eventId) return false;

  const now = new Date().toISOString();
  return TaskStore.update(taskId, {
    calendarSync: {
      provider: options.provider || "google",
      eventId: String(eventId),
      calendarId: options.calendarId || "primary",
      linkedAt: options.linkedAt || now,
      lastSyncedAt: options.lastSyncedAt || now,
    },
  });
}

function buildGoogleCalendarEventTitle(task) {
  return `[${task.study}] ${task.task} - ${getStandardSiteName(task.site)}`;
}

function buildGoogleCalendarEventDescription(task) {
  return [
    `Study: ${task.study}`,
    `Site: ${getStandardSiteName(task.site)}`,
    `Task: ${task.task}`,
    `Priority: ${task.priority}`,
    `Task ID: ${task.id}`,
  ].join("\n");
}

function buildGoogleCalendarAllDayDates(dueDateStr) {
  const start = dueDateStr.replace(/-/g, "");
  const end = addDaysToDate(dueDateStr, 1).replace(/-/g, "");
  return `${start}/${end}`;
}

function buildGoogleCalendarCreateUrl(task) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: buildGoogleCalendarEventTitle(task),
    dates: buildGoogleCalendarAllDayDates(task.dueDate),
    details: buildGoogleCalendarEventDescription(task),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function openGoogleCalendarForTask(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  if (!task.dueDate) {
    alert("Due Date가 없는 업무는 Google Calendar에 추가할 수 없습니다.");
    return;
  }

  if (
    window.CalendarSyncManager &&
    CalendarSyncManager.isConfigured() &&
    CalendarSyncManager.isConnected()
  ) {
    CalendarSyncManager.syncTask(taskId)
      .then(() => CalendarSyncManager.openTaskInCalendar(taskId))
      .catch(() => {
        window.open(buildGoogleCalendarCreateUrl(task), "_blank", "noopener,noreferrer");
      });
    return;
  }

  window.open(buildGoogleCalendarCreateUrl(task), "_blank", "noopener,noreferrer");
}

window.buildGoogleCalendarCreateUrl = buildGoogleCalendarCreateUrl;
function handleStorageSync(e) {
  if (e.key !== STORAGE_KEY || e.newValue === null) return;

  try {
    const parsed = JSON.parse(e.newValue);
    if (!Array.isArray(parsed)) return;

    tasks = parsed.filter(isValidTask).map(normalizeTask);
    renderAll();
  } catch (err) {
    console.warn("다른 탭의 데이터 동기화에 실패했습니다:", err);
  }
}

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysUntilDue(dueDateStr) {
  const today = getToday();
  const due = parseDate(dueDateStr);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

function isActive(task) {
  return task.status !== "Completed" && task.status !== "Cancelled";
}

const UI_SCALE_PRESETS = {
  xsmall: 0.8,
  small: 0.9,
  normal: 1,
  large: 1.1,
  xlarge: 1.25,
};

const UiSettingsStore = {
  load() {
    try {
      const raw = localStorage.getItem(UI_SETTINGS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const size = UI_SCALE_PRESETS[parsed.size] ? parsed.size : "normal";
      return {
        size,
        taskSiteInfoExpanded: Boolean(parsed.taskSiteInfoExpanded),
      };
    } catch {
      return { size: "normal", taskSiteInfoExpanded: false };
    }
  },

  save(partial) {
    const next = { ...this.load(), ...partial };
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(next));
  },

  getSize() {
    return this.load().size;
  },

  setSize(size) {
    const nextSize = UI_SCALE_PRESETS[size] ? size : "normal";
    this.save({ size: nextSize });
    return nextSize;
  },

  getTaskSiteInfoExpanded() {
    return this.load().taskSiteInfoExpanded;
  },

  setTaskSiteInfoExpanded(expanded) {
    this.save({ taskSiteInfoExpanded: Boolean(expanded) });
  },

  getScaleValue(size = this.getSize()) {
    return UI_SCALE_PRESETS[size] ?? 1;
  },
};

function applyUiScale(scale = UiSettingsStore.getScaleValue()) {
  document.documentElement.style.setProperty("--ui-scale", String(scale));
}

const ReminderSettingsStore = {
  load() {
    try {
      const raw = localStorage.getItem(REMINDER_SETTINGS_KEY);
      if (!raw) {
        return { enabled: true, permissionRequested: false, sentNotifications: {} };
      }

      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled !== false,
        permissionRequested: Boolean(parsed.permissionRequested),
        sentNotifications: parsed.sentNotifications && typeof parsed.sentNotifications === "object" ? parsed.sentNotifications : {},
      };
    } catch {
      return { enabled: true, permissionRequested: false, sentNotifications: {} };
    }
  },

  save(settings) {
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  },

  isEnabled() {
    return this.load().enabled;
  },

  setEnabled(enabled) {
    const settings = this.load();
    settings.enabled = enabled;
    this.save(settings);
  },

  markPermissionRequested() {
    const settings = this.load();
    settings.permissionRequested = true;
    this.save(settings);
  },

  wasSentToday(taskId, reminderType) {
    const settings = this.load();
    return settings.sentNotifications[`${taskId}|${reminderType}`] === toDateString(getToday());
  },

  markSentToday(taskId, reminderType) {
    const settings = this.load();
    const today = toDateString(getToday());
    settings.sentNotifications[`${taskId}|${reminderType}`] = today;

    Object.keys(settings.sentNotifications).forEach((key) => {
      if (settings.sentNotifications[key] !== today) {
        delete settings.sentNotifications[key];
      }
    });

    this.save(settings);
  },
};

function getTaskReminderType(task) {
  if (!isActive(task) || !task.dueDate) return null;

  const diff = daysUntilDue(task.dueDate);
  if (diff < 0) return "overdue";
  if (diff === 0) return "d-0";
  if (diff === 1) return "d-1";
  if (diff === 3) return "d-3";
  return null;
}

function getReminderTasks() {
  return tasks.filter((task) => getTaskReminderType(task) !== null);
}

function compareReminderTasks(a, b) {
  const criticalA = a.task.priority === "Critical" ? 0 : 1;
  const criticalB = b.task.priority === "Critical" ? 0 : 1;
  if (criticalA !== criticalB) return criticalA - criticalB;

  const order = { overdue: 0, "d-0": 1, "d-1": 2, "d-3": 3 };
  return (order[a.reminderType] ?? 99) - (order[b.reminderType] ?? 99);
}

function buildTaskReminderNotificationBody(task) {
  return [
    `${task.study} / ${getStandardSiteName(task.site)}`,
    task.task,
    `Due: ${formatDueLabel(task.dueDate)}`,
  ].join("\n");
}

function buildTaskReminderNotificationTitle(task) {
  if (task.priority === "Critical") {
    return "🔴 CRITICAL CRA Task Reminder";
  }
  return "🔔 CRA Task Reminder";
}

function showTaskReminderNotification(task, reminderType) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  try {
    new Notification(buildTaskReminderNotificationTitle(task), {
      body: buildTaskReminderNotificationBody(task),
      tag: `cra-task-${task.id}-${reminderType}`,
      requireInteraction: task.priority === "Critical",
    });
  } catch (err) {
    console.warn("데스크탑 알림 표시에 실패했습니다:", err);
  }
}

function showDesktopReminders() {
  if (!ReminderSettingsStore.isEnabled()) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const reminderItems = getReminderTasks()
    .map((task) => ({ task, reminderType: getTaskReminderType(task) }))
    .sort(compareReminderTasks);

  let delay = 0;
  reminderItems.forEach(({ task, reminderType }) => {
    if (ReminderSettingsStore.wasSentToday(task.id, reminderType)) return;

    setTimeout(() => {
      showTaskReminderNotification(task, reminderType);
      ReminderSettingsStore.markSentToday(task.id, reminderType);
    }, delay);

    delay += task.priority === "Critical" ? 200 : 350;
  });
}

async function requestReminderPermission() {
  if (!("Notification" in window)) return "unsupported";

  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  const result = await Notification.requestPermission();
  return result;
}

async function initDesktopReminders() {
  if (!ReminderSettingsStore.isEnabled()) {
    updateReminderStatusBadge();
    return;
  }

  if (!("Notification" in window)) {
    updateReminderStatusBadge();
    return;
  }

  const settings = ReminderSettingsStore.load();
  if (!settings.permissionRequested) {
    ReminderSettingsStore.markPermissionRequested();
    await requestReminderPermission();
  }

  updateReminderStatusBadge();
  showDesktopReminders();
}

function getReminderPermissionLabel() {
  if (!("Notification" in window)) {
    return "이 브라우저는 Desktop Notification을 지원하지 않습니다.";
  }

  if (Notification.permission === "granted") {
    return "브라우저 알림 권한: 허용됨";
  }
  if (Notification.permission === "denied") {
    return "브라우저 알림 권한: 차단됨. 브라우저 설정에서 알림을 허용해 주세요.";
  }
  return "브라우저 알림 권한: 아직 요청하지 않음";
}

function updateReminderStatusBadge() {
  if (!els.reminderStatusBadge) return;

  const enabled = ReminderSettingsStore.isEnabled();
  const permissionGranted = "Notification" in window && Notification.permission === "granted";

  els.reminderStatusBadge.className = "attention-panel__reminder-badge";
  if (!enabled) {
    els.reminderStatusBadge.textContent = "Reminder OFF";
    els.reminderStatusBadge.classList.add("attention-panel__reminder-badge--off");
    return;
  }

  els.reminderStatusBadge.textContent = permissionGranted ? "Reminder ON" : "Reminder ON · 권한 필요";
  if (!permissionGranted) {
    els.reminderStatusBadge.classList.add("attention-panel__reminder-badge--warn");
  }
}

function updateGoogleConnectUi() {
  if (!window.CalendarSyncManager || !els.googleConnectBtn) return;

  const configured = CalendarSyncManager.isConfigured();
  const onFileProtocol = window.location.protocol === "file:";
  const connected = CalendarSyncManager.isConnected();

  els.googleConnectBtn.disabled = !configured || onFileProtocol || connected;
  els.googleDisconnectBtn.disabled = !connected;

  if (els.googleAccountStatus) {
    els.googleAccountStatus.textContent = connected ? "🟢 Google 계정 연동됨" : "⚪ Google 계정 미연동";
    els.googleAccountStatus.className = connected
      ? "google-account-status google-account-status--connected"
      : "google-account-status google-account-status--disconnected";
  }

  if (els.googleSetupHint) {
    if (onFileProtocol) {
      els.googleSetupHint.hidden = false;
      els.googleSetupHint.textContent =
        "현재 file:// 로 열려 있어 Google OAuth가 동작하지 않습니다. Live Server 등으로 http://localhost 에서 실행해 주세요.";
    } else if (!configured) {
      els.googleSetupHint.hidden = false;
      els.googleSetupHint.innerHTML =
        'Google Cloud Console에서 OAuth Client ID를 발급받아 <code>calendar-config.js</code>의 <code>google.clientId</code>에 입력한 뒤 페이지를 새로고침하세요.';
    } else {
      els.googleSetupHint.hidden = true;
      els.googleSetupHint.textContent = "";
    }
  }
}

function openSettingsModal() {
  els.reminderEnabledToggle.checked = ReminderSettingsStore.isEnabled();
  if (els.uiScaleSelect) {
    els.uiScaleSelect.value = UiSettingsStore.getSize();
  }

  if (window.CalendarSyncManager) {
    CalendarSyncManager.reconcileAuthWithSettings();
    updateGoogleConnectUi();
  }

  els.reminderPermissionStatus.textContent = getReminderPermissionLabel();
  els.settingsModal.hidden = false;
}

function closeSettingsModal() {
  els.settingsModal.hidden = true;
}

async function handleSaveSettings() {
  const enabled = els.reminderEnabledToggle.checked;
  ReminderSettingsStore.setEnabled(enabled);

  if (els.uiScaleSelect) {
    UiSettingsStore.setSize(els.uiScaleSelect.value);
    applyUiScale();
  }

  if (enabled) {
    await requestReminderPermission();
  }

  updateReminderStatusBadge();
  els.reminderPermissionStatus.textContent = getReminderPermissionLabel();
  closeSettingsModal();

  if (enabled) {
    showDesktopReminders();
  }
}

async function handleGoogleConnect() {
  if (!window.CalendarSyncManager) {
    alert("Calendar 연동 모듈을 불러오지 못했습니다.\n페이지를 새로고침해 주세요.");
    return;
  }

  updateGoogleConnectUi();

  if (!CalendarSyncManager.isConfigured()) {
    alert(
      "Google OAuth Client ID가 설정되지 않았습니다.\n\ncalendar-config.js 파일을 열어 google.clientId에 Client ID를 입력한 뒤 페이지를 새로고침해 주세요."
    );
    return;
  }

  if (window.location.protocol === "file:") {
    alert(
      "Google OAuth는 파일을 직접 열(file://)면 동작하지 않습니다.\n\nVS Code Live Server 등으로 http://localhost 환경에서 실행해 주세요."
    );
    return;
  }

  const originalLabel = els.googleConnectBtn.textContent;
  els.googleConnectBtn.disabled = true;
  els.googleConnectBtn.textContent = "연동 중...";

  try {
    await CalendarSyncManager.connect(true);
    updateGoogleConnectUi();
    alert("Google 계정이 연동되었습니다.");
  } catch (err) {
    updateGoogleConnectUi();
    alert(`Google 계정 연동에 실패했습니다.\n\n${err.message || err}`);
  } finally {
    els.googleConnectBtn.textContent = originalLabel;
    updateGoogleConnectUi();
  }
}

function handleGoogleDisconnect() {
  if (!window.CalendarSyncManager) return;
  CalendarSyncManager.disconnect();
  updateGoogleConnectUi();
}

function getDueUrgency(dueDateStr, status) {
  if (status === "Completed" || status === "Cancelled") return "completed";
  const diff = daysUntilDue(dueDateStr);
  if (diff < 0) return "overdue";
  if (diff <= URGENT_DAYS) return "urgent";
  return "normal";
}

function formatDueDaySuffix(dueDateStr) {
  const diff = daysUntilDue(dueDateStr);
  if (diff < 0) return `D+${Math.abs(diff)}`;
  if (diff === 0) return "D-0";
  return `D-${diff}`;
}

function formatDueLabel(dueDateStr) {
  return `${dueDateStr} (${formatDueDaySuffix(dueDateStr)})`;
}

function getDueDateDisplayClass(dueDateStr, status) {
  if (status === "Completed" || status === "Cancelled") return "due-date--normal";
  const diff = daysUntilDue(dueDateStr);
  if (diff < 0) return "due-date--overdue";
  if (diff <= URGENT_DAYS) return "due-date--urgent";
  return "due-date--normal";
}

function addDaysToDate(dateStr, days) {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

function addBusinessDaysToDate(dateStr, days) {
  const date = parseDate(dateStr);
  let remaining = Math.max(0, Math.round(days));

  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remaining -= 1;
    }
  }

  return toDateString(date);
}

function calculateDueDateFromRule(baseDate, dueOffset, dueUnit = "calendar") {
  if (dueUnit === "business") {
    return addBusinessDaysToDate(baseDate, dueOffset);
  }
  return addDaysToDate(baseDate, dueOffset);
}

function formatTaskRuleDueSummary(rule) {
  const unitLabel = rule.dueUnit === "business" ? "Business Days" : "Calendar Days";
  const sign = rule.dueOffset >= 0 ? "+" : "";
  return `${sign}${rule.dueOffset} ${unitLabel}`;
}

function getDefaultTaskRulesForBaseEvent(baseEventKey) {
  const visitRule = WORKFLOW_VISIT_RULES.find((rule) => rule.key === baseEventKey);
  if (!visitRule) return [];

  return visitRule.templates.map((template, index) =>
    normalizeStudyTaskRuleRecord({
      id: `default-${baseEventKey}-${index}`,
      taskName: template.task,
      autoGenerate: true,
      dueOffset: template.daysOffset,
      dueUnit: "calendar",
      baseEvent: baseEventKey,
      priority: getDefaultPriorityForTaskName(template.task),
      defaultStatus: DEFAULT_STATUS,
    })
  );
}

const TaskRuleResolver = {
  // Future: resolve SponsorTaskRuleTemplateStore by study.sponsor / study.ruleTemplateId
  // before falling back to study.taskRules and WORKFLOW_VISIT_RULES defaults.
  getStudyTaskRules(protocolNumber) {
    const study = StudyMasterStore.getByProtocol(protocolNumber);
    return study?.taskRules || [];
  },

  hasStudyTaskRules(protocolNumber) {
    return this.getStudyTaskRules(protocolNumber).length > 0;
  },

  getRulesForVisitCompletion(protocolNumber, visitKey) {
    const studyRules = this.getStudyTaskRules(protocolNumber).filter(
      (rule) => rule.baseEvent === visitKey && rule.autoGenerate && rule.taskName
    );
    if (studyRules.length > 0) return studyRules;
    return getDefaultTaskRulesForBaseEvent(visitKey).filter((rule) => rule.autoGenerate);
  },

  findRuleForSubtask(protocolNumber, subtaskTaskName, visitKey) {
    const studyRules = this.getStudyTaskRules(protocolNumber);
    const studyMatch = studyRules.find(
      (rule) => rule.taskName === subtaskTaskName && rule.baseEvent === visitKey
    );
    if (studyMatch) return studyMatch;

    const defaultRules = getDefaultTaskRulesForBaseEvent(visitKey);
    return defaultRules.find((rule) => rule.taskName === subtaskTaskName) || null;
  },
};

function detectVisitWorkflowRule(taskName) {
  const name = taskName.toLowerCase();
  for (const rule of WORKFLOW_VISIT_RULES) {
    const matched = rule.keywords.some((keyword) => name.includes(keyword.toLowerCase()));
    if (matched) return rule;
  }
  return null;
}

function hasExistingFollowUp(parentTaskId, followUpTaskName) {
  return tasks.some(
    (t) => t.parentTaskId === parentTaskId && t.task === followUpTaskName
  );
}

function generateWorkflowFollowUps(parentTask, rule, completedDate) {
  const completionDate = completedDate || toDateString(getToday());
  const taskRules = TaskRuleResolver.getRulesForVisitCompletion(parentTask.study, rule.key);

  return taskRules
    .filter((taskRule) => !hasExistingFollowUp(parentTask.id, taskRule.taskName))
    .map((taskRule) => ({
      id: generateId(),
      study: parentTask.study,
      site: parentTask.site,
      task: taskRule.taskName,
      dueDate: calculateDueDateFromRule(completionDate, taskRule.dueOffset, taskRule.dueUnit),
      status: taskRule.defaultStatus || DEFAULT_STATUS,
      priority: taskRule.priority || parentTask.priority || "Medium",
      parentTaskId: parentTask.id,
      autoGenerated: true,
      sourceVisit: {
        type: rule.label,
        date: completionDate,
        baseEvent: rule.key,
        study: parentTask.study,
        site: parentTask.site,
      },
      createdAt: new Date().toISOString(),
    }));
}

function runWorkflowAutomation(task) {
  if (!task || task.status !== "Completed") return [];
  if (task.parentTaskId || task.autoGenerated) return [];

  const rule = detectVisitWorkflowRule(task.task);
  if (!rule) return [];

  const followUps = generateWorkflowFollowUps(task, rule, toDateString(getToday()));
  if (followUps.length === 0) return [];

  TaskStore.addMany(followUps);
  return followUps;
}

function isAutoGeneratedTask(task) {
  return Boolean(task.autoGenerated || task.parentTaskId);
}

function getSubtasks(parentTaskId) {
  return tasks.filter((t) => t.parentTaskId === parentTaskId);
}

function findWorkflowTemplateDaysOffset(subtaskTaskName, parentTaskName, protocolNumber = "") {
  const primaryRule = detectVisitWorkflowRule(parentTaskName);
  const visitKey = primaryRule?.key;
  if (visitKey) {
    const resolvedRule = TaskRuleResolver.findRuleForSubtask(
      protocolNumber,
      subtaskTaskName,
      visitKey
    );
    if (resolvedRule) {
      return {
        dueOffset: resolvedRule.dueOffset,
        dueUnit: resolvedRule.dueUnit,
      };
    }
  }

  const rulesToSearch = primaryRule
    ? [primaryRule, ...WORKFLOW_VISIT_RULES.filter((rule) => rule.key !== primaryRule.key)]
    : WORKFLOW_VISIT_RULES;

  for (const rule of rulesToSearch) {
    const template = rule.templates.find((item) => item.task === subtaskTaskName);
    if (template) {
      return {
        dueOffset: template.daysOffset,
        dueUnit: "calendar",
      };
    }
  }

  return null;
}

function cancelAutoSubtasks(parentId) {
  let updatedCount = 0;
  getSubtasks(parentId).forEach((subtask) => {
    if (!isAutoGeneratedTask(subtask) || subtask.status === "Cancelled") return;
    TaskStore.update(subtask.id, { status: "Cancelled" });
    if (window.CalendarSyncManager) {
      CalendarSyncManager.onTaskUpdated(subtask.id);
    }
    updatedCount += 1;
  });
  return updatedCount;
}

function recalculateAutoSubtaskDueDates(parentId, newBaseDate, parentTaskName = "") {
  const parentTask = tasks.find((task) => task.id === parentId);
  const resolvedParentTaskName = parentTaskName || parentTask?.task || "";
  const visitRule = detectVisitWorkflowRule(resolvedParentTaskName);
  let updatedCount = 0;

  getSubtasks(parentId).forEach((subtask) => {
    if (subtask.dueDateManuallyEdited || !isAutoGeneratedTask(subtask)) return;

    const visitKey = subtask.sourceVisit?.baseEvent || visitRule?.key;
    if (!visitKey) return;

    const ruleConfig = findWorkflowTemplateDaysOffset(
      subtask.task,
      resolvedParentTaskName,
      parentTask?.study || subtask.study
    );
    if (!ruleConfig) return;

    const baseDate = newBaseDate;
    const updates = {
      dueDate: calculateDueDateFromRule(baseDate, ruleConfig.dueOffset, ruleConfig.dueUnit),
    };

    if (subtask.sourceVisit) {
      updates.sourceVisit = {
        ...subtask.sourceVisit,
        date: newBaseDate,
        baseEvent: visitKey,
      };
    }

    TaskStore.update(subtask.id, updates);
    if (window.CalendarSyncManager) {
      CalendarSyncManager.scheduleSyncTask(subtask.id);
    }
    updatedCount += 1;
  });

  return updatedCount;
}

function hasAutoGeneratedSubtasks(parentTaskId) {
  return getSubtasks(parentTaskId).some((subtask) => isAutoGeneratedTask(subtask));
}

function isWorkflowComplete(task) {
  if (task.parentTaskId) return false;
  const subtasks = getSubtasks(task.id);
  if (subtasks.length === 0) return false;
  return subtasks.every((t) => t.status === "Completed");
}

function renderAutoGeneratedBadge() {
  return '<span class="auto-generated-badge">Auto Generated</span>';
}

function renderWorkflowCompleteBadge() {
  return '<span class="workflow-complete-badge">Workflow Complete</span>';
}

function renderTaskBadges(task) {
  const badges = [];
  if (isAutoGeneratedTask(task)) badges.push(renderAutoGeneratedBadge());
  if (isWorkflowComplete(task)) badges.push(renderWorkflowCompleteBadge());
  if (badges.length === 0) return "";
  return `<div class="task-cell__badges">${badges.join("")}</div>`;
}

function expandFilteredWithHierarchy(filtered) {
  const includedIds = new Set(filtered.map((t) => t.id));

  filtered.forEach((task) => {
    if (task.parentTaskId && !includedIds.has(task.parentTaskId)) {
      const parent = tasks.find((t) => t.id === task.parentTaskId);
      if (parent) includedIds.add(parent.id);
    }
  });

  filtered.forEach((task) => {
    tasks
      .filter((t) => t.parentTaskId === task.id)
      .forEach((child) => includedIds.add(child.id));
  });

  return tasks.filter((t) => includedIds.has(t.id));
}

function buildHierarchicalRows(taskList) {
  const listIds = new Set(taskList.map((t) => t.id));
  const roots = taskList.filter((t) => !t.parentTaskId || !listIds.has(t.parentTaskId));
  const childrenByParent = new Map();

  taskList
    .filter((t) => t.parentTaskId && listIds.has(t.parentTaskId))
    .forEach((child) => {
      if (!childrenByParent.has(child.parentTaskId)) {
        childrenByParent.set(child.parentTaskId, []);
      }
      childrenByParent.get(child.parentTaskId).push(child);
    });

  childrenByParent.forEach((children) => children.sort(compareTasks));

  const rows = [];
  [...roots].sort(compareTasks).forEach((root) => {
    rows.push({ task: root, isSubtask: false, isLastSubtask: false });
    const children = childrenByParent.get(root.id) || [];
    children.forEach((child, index) => {
      rows.push({
        task: child,
        isSubtask: true,
        isLastSubtask: index === children.length - 1,
      });
    });
  });

  return rows;
}

function formatSourceVisit(task) {
  if (!task.sourceVisit) return "";
  const { type, date, study, site } = task.sourceVisit;
  return `${type} · ${study} · ${site} · ${date}`;
}

function renderSourceVisitHtml(task) {
  if (!task.sourceVisit) return "";
  return `<div class="visit-source">${escapeHtml(formatSourceVisit(task))}</div>`;
}

function updateTodayLabel() {
  const today = getToday();
  const options = { year: "numeric", month: "long", day: "numeric", weekday: "long" };
  els.todayLabel.textContent = today.toLocaleDateString("ko-KR", options);
}

function showFileProtocolBannerIfNeeded() {
  const banner = document.getElementById("fileProtocolBanner");
  if (!banner) return;
  banner.hidden = window.location.protocol !== "file:";
}

const MOBILE_HOST_IP_KEY = "cra-mobile-host-ip";
const DEV_MOBILE_LINK_FLAG = "cra-dev-show-mobile-link";

function isLocalDevHost(hostname = window.location.hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function isDevMobileLinkEnabled() {
  if (!isLocalDevHost()) return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get("devMobile") === "1") {
    localStorage.setItem(DEV_MOBILE_LINK_FLAG, "1");
    return true;
  }
  if (params.get("devMobile") === "0") {
    localStorage.removeItem(DEV_MOBILE_LINK_FLAG);
    return false;
  }

  return localStorage.getItem(DEV_MOBILE_LINK_FLAG) === "1";
}

function isLikelyMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function buildMobileAccessUrl(hostIp) {
  const port = window.location.port || "5500";
  const path = window.location.pathname.endsWith("/")
    ? window.location.pathname
    : `${window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1)}`;
  const normalizedPath = path || "/";
  return `http://${hostIp.trim()}:${port}${normalizedPath}`;
}

async function fetchMobileHostFromServer() {
  if (window.location.protocol !== "http:" && window.location.protocol !== "https:") return "";
  try {
    const response = await fetch("./mobile-host.txt", { cache: "no-store" });
    if (!response.ok) return "";
    const text = (await response.text()).trim();
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(text) ? text : "";
  } catch {
    return "";
  }
}

function renderMobileAccessBanner(url) {
  const banner = document.getElementById("mobileAccessBanner");
  const link = document.getElementById("mobileAccessLink");
  const qr = document.getElementById("mobileAccessQr");
  const setup = document.getElementById("mobileAccessSetup");
  if (!banner || !link) return;

  link.href = url;
  link.textContent = url;
  banner.hidden = false;
  banner.setAttribute("aria-hidden", "false");
  if (setup) setup.hidden = true;

  if (qr) {
    qr.hidden = false;
    qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(url)}`;
  }
}

async function initMobileAccessBanner() {
  const banner = document.getElementById("mobileAccessBanner");
  if (!banner) return;
  if (!isDevMobileLinkEnabled() || isLikelyMobileDevice()) return;
  if (window.location.protocol !== "http:" && window.location.protocol !== "https:") return;

  const copyBtn = document.getElementById("copyMobileAccessLinkBtn");
  const saveBtn = document.getElementById("saveMobileHostIpBtn");
  const ipInput = document.getElementById("mobileHostIpInput");

  copyBtn?.addEventListener("click", async () => {
    const url = document.getElementById("mobileAccessLink")?.href;
    if (!url || url === "#") return;
    try {
      await navigator.clipboard.writeText(url);
      showToast("휴대폰 접속 링크가 복사되었습니다.");
    } catch {
      prompt("아래 링크를 복사해 휴대폰에서 열어주세요.", url);
    }
  });

  saveBtn?.addEventListener("click", () => {
    const ip = ipInput?.value.trim() || "";
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
      alert("올바른 IP 주소를 입력해 주세요. (예: 192.168.0.10)");
      return;
    }
    localStorage.setItem(MOBILE_HOST_IP_KEY, ip);
    renderMobileAccessBanner(buildMobileAccessUrl(ip));
  });

  const hostFromFile = await fetchMobileHostFromServer();
  const hostFromStorage = localStorage.getItem(MOBILE_HOST_IP_KEY) || "";
  const hostIp = hostFromFile || hostFromStorage;

  if (hostIp) {
    if (hostFromFile) localStorage.setItem(MOBILE_HOST_IP_KEY, hostFromFile);
    renderMobileAccessBanner(buildMobileAccessUrl(hostIp));
    return;
  }

  banner.hidden = false;
  banner.setAttribute("aria-hidden", "false");
  const setup = document.getElementById("mobileAccessSetup");
  if (setup) setup.hidden = false;
  if (ipInput && hostFromStorage) ipInput.value = hostFromStorage;
}

function handleAddTask(e) {
  e.preventDefault();
  const form = new FormData(els.taskForm);
  const study = form.get("study")?.trim();
  const site = form.get("site")?.trim();
  if (!validateStudySiteSelection(study, site)) return;

  const standardSite = getStandardSiteName(site);
  const taskName = form.get("task").trim();
  const dueDate = form.get("dueDate");
  const status = form.get("status") || DEFAULT_STATUS;
  const priority = form.get("priority");

  const newTask = {
    id: generateId(),
    study,
    site: standardSite,
    task: taskName,
    dueDate,
    status,
    priority,
    createdAt: new Date().toISOString(),
  };

  TaskStore.add(newTask);

  if (window.CalendarSyncManager) {
    CalendarSyncManager.onTaskCreated(newTask.id);
  }

  let workflowCount = 0;
  if (status === "Completed") {
    workflowCount = runWorkflowAutomation(tasks.find((t) => t.id === newTask.id) || newTask).length;
  }

  if (workflowCount > 0 && window.CalendarSyncManager) {
    getSubtasks(newTask.id).forEach((subtask) => CalendarSyncManager.onTaskCreated(subtask.id));
  }

  els.taskForm.reset();
  refreshTaskStudySiteSelects();
  updateSiteInfoDisplays();
  renderAll();

  if (workflowCount > 0) {
    alert(`${workflowCount}개의 후속 업무가 자동 생성되었습니다.`);
  }
}

function handleEditTask(e) {
  e.preventDefault();
  const id = document.getElementById("editId").value;
  const existing = tasks.find((t) => t.id === id);
  if (!existing) return;

  const newStatus = document.getElementById("editStatus").value;
  const wasCompleted = existing.status === "Completed";
  const wasCancelled = existing.status === "Cancelled";
  const newDueDate = document.getElementById("editDueDate").value;
  const newTaskName = document.getElementById("editTask").value.trim();
  const dueDateChanged = existing.dueDate !== newDueDate;
  const isVisitParent = !existing.parentTaskId && detectVisitWorkflowRule(newTaskName || existing.task);

  const editStudy = document.getElementById("editStudy").value.trim();
  const editSite = document.getElementById("editSite").value.trim();
  if (!validateStudySiteSelection(editStudy, editSite, existing)) return;

  const updatePayload = {
    study: editStudy,
    site: getStandardSiteName(editSite),
    task: newTaskName,
    dueDate: newDueDate,
    status: newStatus,
    priority: document.getElementById("editPriority").value,
  };

  if (existing.parentTaskId && dueDateChanged) {
    updatePayload.dueDateManuallyEdited = true;
  }

  let recalcSubtasks = false;
  if (isVisitParent && dueDateChanged && hasAutoGeneratedSubtasks(id)) {
    recalcSubtasks = confirm("연결된 자동 생성 업무 일정도 함께 변경하시겠습니까?");
  }

  let cancelSubtasks = false;
  if (isVisitParent && newStatus === "Cancelled" && !wasCancelled && hasAutoGeneratedSubtasks(id)) {
    cancelSubtasks = confirm("연결된 자동 생성 업무도 모두 Cancelled 처리하시겠습니까?");
  }

  if (!TaskStore.update(id, updatePayload)) return;

  if (recalcSubtasks) {
    recalculateAutoSubtaskDueDates(id, newDueDate, newTaskName);
  }

  if (cancelSubtasks) {
    cancelAutoSubtasks(id);
  }

  let workflowCount = 0;
  if (!wasCompleted && newStatus === "Completed") {
    const completedTask = tasks.find((t) => t.id === id);
    workflowCount = runWorkflowAutomation(completedTask).length;
  }

  closeModal();
  renderAll();

  if (window.CalendarSyncManager) {
    CalendarSyncManager.onTaskUpdated(id);
    if (recalcSubtasks || cancelSubtasks) {
      getSubtasks(id).forEach((subtask) => CalendarSyncManager.onTaskUpdated(subtask.id));
    }
    if (workflowCount > 0) {
      getSubtasks(id).forEach((subtask) => CalendarSyncManager.onTaskCreated(subtask.id));
    }
  }

  if (workflowCount > 0) {
    alert(`${workflowCount}개의 후속 업무가 자동 생성되었습니다.`);
  }
}

async function deleteTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const subtasks = getSubtasks(id);
  const autoSubtasks = subtasks.filter(isAutoGeneratedTask);
  const isVisitParent = !task.parentTaskId && detectVisitWorkflowRule(task.task);

  if (isVisitParent && autoSubtasks.length > 0) {
    if (!confirm("이 업무와 연결된 모든 자동 생성 업무가 함께 삭제됩니다. 계속하시겠습니까?")) return;
    const idsToRemove = [id, ...autoSubtasks.map((subtask) => subtask.id)];
    if (window.CalendarSyncManager) {
      await CalendarSyncManager.onTasksDeleted(idsToRemove);
    }
    TaskStore.removeMany(idsToRemove);
    renderAll();
    return;
  }

  if (!confirm("이 업무를 삭제하시겠습니까?")) return;
  if (subtasks.length > 0) {
    TaskStore.detachSubtasks(id);
  }
  if (window.CalendarSyncManager) {
    await CalendarSyncManager.onTasksDeleted([id]);
  }
  TaskStore.remove(id);
  renderAll();
}

function openEditModal(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  document.getElementById("editId").value = task.id;
  populateStudySelect(document.getElementById("editStudy"), task.study);
  populateSiteSelect(document.getElementById("editSite"), task.study, task.site);
  updateSiteSelectHint(task.study, els.editSiteMasterHint);
  setEditSiteInfoExpanded(false);
  updateEditSiteInfoDisplay();
  document.getElementById("editTask").value = task.task;
  document.getElementById("editDueDate").value = task.dueDate;
  document.getElementById("editStatus").value = task.status;
  document.getElementById("editPriority").value = task.priority;

  const sourceEl = document.getElementById("editSourceVisit");
  const editMeta = [];
  if (isWorkflowComplete(task)) editMeta.push(renderWorkflowCompleteBadge());
  if (task.sourceVisit) {
    editMeta.push(`<span class="visit-source">${escapeHtml(formatSourceVisit(task))}</span>`);
  }

  if (editMeta.length > 0) {
    sourceEl.hidden = false;
    sourceEl.innerHTML = editMeta.join("");
  } else {
    sourceEl.hidden = true;
    sourceEl.innerHTML = "";
  }

  els.editModal.hidden = false;
}

function closeModal() {
  els.editModal.hidden = true;
  els.editForm.reset();
  setEditSiteInfoExpanded(false);
  els.editSiteInfoToggleBtn.hidden = true;
  els.editSiteMasterHint.hidden = true;
}

function statusClass(status) {
  const map = {
    Open: "open",
    "On Hold": "on-hold",
    Completed: "completed",
    Cancelled: "cancelled",
  };
  return map[status] || "open";
}

function priorityClass(priority) {
  const map = {
    Critical: "critical",
    High: "high",
    Medium: "medium",
    Low: "low",
  };
  return map[priority] || "medium";
}

function compareTasks(a, b) {
  const aCritical = a.priority === "Critical" ? 0 : 1;
  const bCritical = b.priority === "Critical" ? 0 : 1;
  if (aCritical !== bCritical) return aCritical - bCritical;
  return parseDate(a.dueDate) - parseDate(b.dueDate);
}
function getWeekRange() {
  const today = getToday();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function isDueThisWeek(dueDateStr) {
  const due = parseDate(dueDateStr);
  const { start, end } = getWeekRange();
  return due >= start && due <= end;
}

function isCompleted(task) {
  return task.status === "Completed";
}

function getDashboardStats() {
  const total = tasks.length;
  const completed = tasks.filter(isCompleted).length;
  const overdue = tasks.filter((t) => isActive(t) && daysUntilDue(t.dueDate) < 0).length;
  const weekDue = tasks.filter((t) => isActive(t) && isDueThisWeek(t.dueDate)).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, overdue, weekDue, completionRate };
}

function matchesDashboardCardFilter(task) {
  if (!dashboardCardFilter || dashboardCardFilter === "all") return true;

  if (dashboardCardFilter === "completed") {
    return task.status === "Completed";
  }

  if (dashboardCardFilter === "overdue") {
    return isActive(task) && daysUntilDue(task.dueDate) < 0;
  }

  if (dashboardCardFilter === "week") {
    return isActive(task) && isDueThisWeek(task.dueDate);
  }

  return true;
}

function updateDashboardCardFilterUi() {
  els.dashboardFilterCards.forEach((card) => {
    const isActive = dashboardCardFilter === card.dataset.dashboardFilter;
    card.classList.toggle("stat-card--active", isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });

  if (els.dashboardFilterChip) {
    els.dashboardFilterChip.className = `dashboard-filter-bar__chip dashboard-filter-bar__chip--${dashboardCardFilter || "none"}`;
  }
}

function updateDashboardFilterBar(filteredCount) {
  if (!els.dashboardFilterBar) return;

  if (!dashboardCardFilter) {
    els.dashboardFilterBar.hidden = true;
    return;
  }

  els.dashboardFilterBar.hidden = false;
  if (els.dashboardFilterLabel) {
    els.dashboardFilterLabel.textContent = DASHBOARD_FILTER_LABELS[dashboardCardFilter] || dashboardCardFilter;
  }
  if (els.dashboardFilterCount) {
    els.dashboardFilterCount.textContent = `${filteredCount}건 표시`;
  }
}

function clearDashboardCardFilter() {
  if (!dashboardCardFilter) return;
  dashboardCardFilter = null;
  updateDashboardCardFilterUi();
  renderTable();
}

function showToast(message) {
  if (!els.toastContainer) return;

  els.toastContainer.textContent = message;
  els.toastContainer.hidden = false;
  els.toastContainer.classList.add("toast-container--visible");

  if (toastHideTimer) clearTimeout(toastHideTimer);
  if (toastRemoveTimer) clearTimeout(toastRemoveTimer);
  toastHideTimer = setTimeout(() => {
    els.toastContainer.classList.remove("toast-container--visible");
    toastRemoveTimer = setTimeout(() => {
      els.toastContainer.hidden = true;
    }, 300);
  }, 2800);
}

function handleDashboardCardFilterClick(filter) {
  if (!filter) return;

  const wasActive = dashboardCardFilter === filter;
  dashboardCardFilter = wasActive ? null : filter;
  updateDashboardCardFilterUi();
  renderTable();
  scrollToTaskList();

  if (dashboardCardFilter) {
    const count = getFilteredTasks().length;
    showToast(`${DASHBOARD_FILTER_LABELS[dashboardCardFilter]} 필터 적용 (${count}건)`);
  } else if (wasActive) {
    showToast("필터가 해제되었습니다.");
  }
}

function getFilteredTasks() {
  const studyFilter = els.filterStudy.value;
  const statusFilter = els.filterStatus.value;
  const search = els.searchInput.value.trim().toLowerCase();

  let filtered = [...tasks];

  if (studyFilter !== "all") {
    filtered = filtered.filter((t) => t.study === studyFilter);
  }

  if (statusFilter !== "all") {
    filtered = filtered.filter((t) => t.status === statusFilter);
  }

  if (search) {
    filtered = filtered.filter((t) => {
      const sourceText = t.sourceVisit ? formatSourceVisit(t) : "";
      const siteEntry = SiteMasterStore.findByValue(t.site);
      const siteTerms = siteEntry
        ? `${siteEntry.pharmacyContactName} ${siteEntry.pharmacyPhoneNumber} ${siteEntry.labContactName} ${siteEntry.labPhoneNumber} ${siteEntry.ipStorageLocation}`
        : "";
      const haystack = `${t.study} ${getStandardSiteName(t.site)} ${SiteMasterStore.getSearchTermsForSite(t.site).join(" ")} ${siteTerms} ${t.task} ${sourceText}`.toLowerCase();
      return haystack.includes(search);
    });
  }

  if (dashboardCardFilter) {
    filtered = filtered.filter(matchesDashboardCardFilter);
  }

  return filtered;
}

function scrollToTaskList() {
  els.taskListSection?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderDashboard() {
  const todayStr = toDateString(getToday());
  const activeTasks = tasks.filter(isActive);
  const stats = getDashboardStats();

  els.statTotal.textContent = stats.total;
  els.statCompleted.textContent = stats.completed;
  els.statOverdue.textContent = stats.overdue;
  els.statWeekDue.textContent = stats.weekDue;
  els.progressPercent.textContent = `${stats.completionRate}%`;
  els.progressSubtitle.textContent = `${stats.completed} / ${stats.total} 완료`;
  els.progressFill.style.width = `${stats.completionRate}%`;

  const overdueTasks = activeTasks
    .filter((t) => daysUntilDue(t.dueDate) < 0)
    .sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate));

  const todayTasks = activeTasks
    .filter((t) => t.dueDate === todayStr)
    .sort((a, b) => compareAttentionTasks(a, b));

  const d1Tasks = activeTasks
    .filter((t) => daysUntilDue(t.dueDate) === 1)
    .sort((a, b) => compareAttentionTasks(a, b));

  renderAttentionPanel(todayTasks, overdueTasks, d1Tasks);
  updateReminderStatusBadge();
  updateDashboardCardFilterUi();
}

function compareAttentionTasks(a, b) {
  const criticalA = a.priority === "Critical" ? 0 : 1;
  const criticalB = b.priority === "Critical" ? 0 : 1;
  if (criticalA !== criticalB) return criticalA - criticalB;
  return a.study.localeCompare(b.study, "ko");
}

function renderAttentionPanel(todayTasks, overdueTasks, d1Tasks) {
  els.attentionTodayCount.textContent = todayTasks.length;
  els.attentionOverdueCount.textContent = overdueTasks.length;
  els.attentionD1Count.textContent = d1Tasks.length;

  els.attentionTodayList.innerHTML = todayTasks.length
    ? todayTasks.map((t) => renderDashItem(t, "attention-today")).join("")
    : '<p class="empty-msg">오늘 마감 업무가 없습니다.</p>';

  els.attentionOverdueList.innerHTML = overdueTasks.length
    ? overdueTasks.map((t) => renderDashItem(t, "attention-overdue")).join("")
    : '<p class="empty-msg">지연된 업무가 없습니다.</p>';

  els.attentionD1List.innerHTML = d1Tasks.length
    ? d1Tasks.map((t) => renderDashItem(t, "attention-d1")).join("")
    : '<p class="empty-msg">D-1 업무가 없습니다.</p>';
}

function renderDashItem(task, type) {
  const dueClass = getDueDateDisplayClass(task.dueDate, task.status);
  const dueLabel = formatDueLabel(task.dueDate);
  const criticalClass = task.priority === "Critical" ? " dash-item--critical" : "";
  const criticalBadge = task.priority === "Critical" ? '<span class="critical-badge">Critical</span> ' : "";

  return `
    <div class="dash-item dash-item--${type}${criticalClass}">
      <div class="dash-item-title">
        ${criticalBadge}${escapeHtml(task.task)}
        ${isAutoGeneratedTask(task) ? renderAutoGeneratedBadge() : ""}
        ${isWorkflowComplete(task) ? renderWorkflowCompleteBadge() : ""}
      </div>
      ${renderSourceVisitHtml(task)}
      <div class="dash-item-meta">${escapeHtml(task.study)} · ${escapeHtml(getStandardSiteName(task.site))} · ${escapeHtml(task.status)}</div>
      <div class="dash-item-due ${dueClass}">${escapeHtml(dueLabel)}</div>
    </div>
  `;
}

function getUniqueStudies() {
  const fromMaster = StudyMasterStore.getProtocolNumbers();
  const fromTasks = tasks.map((t) => t.study).filter(Boolean);
  return [...new Set([...fromMaster, ...fromTasks])].sort((a, b) => a.localeCompare(b, "ko"));
}

function updateStudyFilterOptions() {
  const selected = els.filterStudy.value;
  const studies = getUniqueStudies();

  els.filterStudy.innerHTML =
    '<option value="all">전체 Study</option>' +
    studies
      .map((study) => `<option value="${escapeAttr(study)}">${escapeHtml(study)}</option>`)
      .join("");

  if (selected !== "all" && studies.includes(selected)) {
    els.filterStudy.value = selected;
  } else {
    els.filterStudy.value = "all";
  }
}

function renderTable() {
  const filtered = getFilteredTasks();
  updateDashboardFilterBar(filtered.length);

  filtered.sort(compareTasks);
  const expanded = expandFilteredWithHierarchy(filtered);
  const hierarchicalRows = buildHierarchicalRows(expanded);

  if (hierarchicalRows.length === 0) {
    els.taskTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">표시할 업무가 없습니다.</td>
      </tr>
    `;
    return;
  }

  els.taskTableBody.innerHTML = hierarchicalRows.map(renderTableRow).join("");
  els.taskTableBody.querySelectorAll("[data-google-calendar]").forEach((btn) => {
    btn.addEventListener("click", () => openGoogleCalendarForTask(btn.dataset.googleCalendar));
  });
  els.taskTableBody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.edit));
  });
  els.taskTableBody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteTask(btn.dataset.delete));
  });
}

function renderTableRow({ task, isSubtask, isLastSubtask }) {
  const urgency = getDueUrgency(task.dueDate, task.status);
  const rowClass = [
    urgency === "overdue" ? "row--overdue" : urgency === "urgent" ? "row--urgent" : "",
    isSubtask ? "row--subtask" : "row--parent",
    isSubtask && isLastSubtask ? "row--subtask-last" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const dueClass = getDueDateDisplayClass(task.dueDate, task.status);
  const dueLabel = formatDueLabel(task.dueDate);
  const treePrefix = isSubtask
    ? `<span class="subtask-tree">${isLastSubtask ? "└─" : "├─"}</span>`
    : "";

  return `
    <tr class="${rowClass}">
      <td>${escapeHtml(task.study)}</td>
      <td>${escapeHtml(getStandardSiteName(task.site))}</td>
      <td>
        <div class="task-cell ${isSubtask ? "task-cell--subtask" : "task-cell--parent"}">
          ${treePrefix}
          <div class="task-cell__content">
            <span class="task-cell__name">${escapeHtml(task.task)}</span>
            ${renderTaskBadges(task)}
            ${renderSourceVisitHtml(task)}
          </div>
        </div>
      </td>
      <td><span class="priority-badge priority-badge--${priorityClass(task.priority)}">${escapeHtml(task.priority)}</span></td>
      <td><span class="${dueClass}">${escapeHtml(dueLabel)}</span></td>
      <td><span class="status-badge status-badge--${statusClass(task.status)}">${escapeHtml(task.status)}</span></td>
      <td class="actions-cell">
        <button type="button" class="btn btn--calendar" data-google-calendar="${task.id}">📅 Google Calendar 추가</button>
        <button type="button" class="btn btn--edit" data-edit="${task.id}">수정</button>
        <button type="button" class="btn btn--danger" data-delete="${task.id}">삭제</button>
      </td>
    </tr>
  `;
}

function renderAll() {
  renderDashboard();
  updateStudyFilterOptions();
  refreshTaskStudySiteSelects();
  renderTable();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const CSV_COLUMNS = [
  "id",
  "study",
  "site",
  "task",
  "dueDate",
  "status",
  "priority",
  "sourceVisitType",
  "sourceVisitDate",
  "sourceVisitStudy",
  "sourceVisitSite",
  "autoGenerated",
  "parentTaskId",
  "dueDateManuallyEdited",
  "googleCalendarEventId",
  "googleCalendarCalendarId",
  "googleCalendarLinkedAt",
  "googleCalendarLastSyncedAt",
  "visitGroupId",
  "createdAt",
  "updatedAt",
];

function escapeCsvField(value) {
  if (value == null || value === "") return "";
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function taskToCsvRow(task) {
  return CSV_COLUMNS.map((column) => {
    switch (column) {
      case "sourceVisitType":
        return escapeCsvField(task.sourceVisit?.type);
      case "sourceVisitDate":
        return escapeCsvField(task.sourceVisit?.date);
      case "sourceVisitStudy":
        return escapeCsvField(task.sourceVisit?.study);
      case "sourceVisitSite":
        return escapeCsvField(task.sourceVisit?.site);
      case "autoGenerated":
        return escapeCsvField(task.autoGenerated ? "true" : "");
      case "parentTaskId":
        return escapeCsvField(task.parentTaskId);
      case "dueDateManuallyEdited":
        return escapeCsvField(task.dueDateManuallyEdited ? "true" : "");
      case "googleCalendarEventId":
        return escapeCsvField(task.calendarSync?.eventId);
      case "googleCalendarCalendarId":
        return escapeCsvField(task.calendarSync?.calendarId);
      case "googleCalendarLinkedAt":
        return escapeCsvField(task.calendarSync?.linkedAt);
      case "googleCalendarLastSyncedAt":
        return escapeCsvField(task.calendarSync?.lastSyncedAt);
      default:
        return escapeCsvField(task[column]);
    }
  }).join(",");
}

function parseCsv(text) {
  const content = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\r" && next === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
    } else if (char === "\n" || char === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

function csvRowToTask(cells, headerMap) {
  const get = (name) => {
    const index = headerMap[name];
    return index == null ? "" : (cells[index] ?? "").trim();
  };

  const task = {
    id: get("id") || generateId(),
    study: get("study"),
    site: get("site"),
    task: get("task"),
    dueDate: get("duedate") || get("dueDate"),
    status: migrateTaskStatus(get("status")),
    priority: get("priority"),
    createdAt: get("createdat") || get("createdAt") || new Date().toISOString(),
  };

  const updatedAt = get("updatedat") || get("updatedAt");
  if (updatedAt) task.updatedAt = updatedAt;

  const visitGroupId = get("visitgroupid") || get("visitGroupId");
  if (visitGroupId) task.visitGroupId = visitGroupId;

  const parentTaskId = get("parenttaskid") || get("parentTaskId");
  if (parentTaskId) task.parentTaskId = parentTaskId;

  if ((get("duedatemanuallyedited") || get("dueDateManuallyEdited")) === "true") {
    task.dueDateManuallyEdited = true;
  }

  const googleCalendarEventId = get("googlecalendareventid") || get("googleCalendarEventId");
  if (googleCalendarEventId) {
    task.calendarSync = {
      eventId: googleCalendarEventId,
      calendarId: get("googlecalendarcalendarid") || get("googleCalendarCalendarId") || "primary",
      linkedAt: get("googlecalendarlinkedat") || get("googleCalendarLinkedAt") || undefined,
      lastSyncedAt: get("googlecalendarlastsyncedat") || get("googleCalendarLastSyncedAt") || undefined,
    };
  }

  const sourceVisitType = get("sourcevisittype") || get("sourceVisitType");
  if (sourceVisitType) {
    task.sourceVisit = {
      type: sourceVisitType,
      date: get("sourcevisitdate") || get("sourceVisitDate"),
      study: get("sourcevisitstudy") || get("sourceVisitStudy") || task.study,
      site: get("sourcevisitsite") || get("sourceVisitSite") || task.site,
    };
    task.autoGenerated = (get("autogenerated") || get("autoGenerated")) === "true";
  }

  return normalizeTask(task);
}

function buildHeaderMap(headerRow) {
  const map = {};
  headerRow.forEach((header, index) => {
    map[header.trim()] = index;
    map[header.trim().toLowerCase()] = index;
  });
  return map;
}

function exportTasksToCsv() {
  if (tasks.length === 0) {
    alert("내보낼 업무가 없습니다.");
    return;
  }

  const csv = `\uFEFF${CSV_COLUMNS.join(",")}\n${tasks.map(taskToCsvRow).join("\n")}`;
  const today = toDateString(getToday());
  const filename = `cra-tasks-${today}.csv`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function handleCsvImport(e) {
  const file = e.target.files?.[0];
  els.importCsvInput.value = "";
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const rows = parseCsv(String(event.target?.result ?? ""));
      if (rows.length < 2) {
        alert("CSV 파일에 데이터가 없습니다.");
        return;
      }

      const headerMap = buildHeaderMap(rows[0]);
      const required = ["study", "site", "task", "duedate", "status"];
      const hasRequired = required.every((key) => headerMap[key] != null);
      if (!hasRequired) {
        alert("CSV 형식이 올바르지 않습니다. study, site, task, dueDate, status 컬럼이 필요합니다.");
        return;
      }

      const imported = rows.slice(1).map((row) => csvRowToTask(row, headerMap)).filter(isValidTask);
      if (imported.length === 0) {
        alert("가져올 수 있는 유효한 업무가 없습니다.");
        return;
      }

      const message =
        tasks.length > 0
          ? `CSV에서 ${imported.length}건의 업무를 가져옵니다.\n기존 ${tasks.length}건의 업무는 모두 교체됩니다. 계속하시겠습니까?`
          : `CSV에서 ${imported.length}건의 업무를 가져옵니다. 계속하시겠습니까?`;

      if (!confirm(message)) return;

      TaskStore.replaceAll(imported);
      StudyMasterStore.migrateFromTasks(tasks);
      reconcileSiteNamesAfterMasterChange();
      renderAll();
      alert(`${imported.length}건의 업무를 가져왔습니다.`);
    } catch (err) {
      console.error("CSV 가져오기 실패:", err);
      alert("CSV 파일을 읽는 중 오류가 발생했습니다.");
    }
  };

  reader.readAsText(file, "UTF-8");
}

function seedSampleDataIfEmpty() {
  if (tasks.length > 0) return;

  const today = getToday();
  const fmt = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return toDateString(d);
  };

  tasks = [
    {
      id: generateId(),
      study: "ABC-301",
      site: "Site 101",
      task: "SDV (Source Data Verification)",
      dueDate: fmt(-2),
      status: "Open",
      priority: "Critical",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      study: "XYZ-102",
      site: "Site 201",
      task: "EDC 쿼리 확인 및 클로징",
      dueDate: fmt(0),
      status: "Open",
      priority: "High",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      study: "ABC-301",
      site: "Site 102",
      task: "SIV (Site Initiation Visit) 준비",
      dueDate: fmt(2),
      status: "Open",
      priority: "Medium",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      study: "DEF-205",
      site: "Site 301",
      task: "ICF 모니터링",
      dueDate: fmt(7),
      status: "On Hold",
      priority: "Low",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      study: "XYZ-102",
      site: "Site 202",
      task: "SAE Follow-up Report 검토",
      dueDate: fmt(-5),
      status: "Open",
      priority: "Critical",
      createdAt: new Date().toISOString(),
    },
  ];

  TaskStore.persist();
  renderAll();
}

init();
