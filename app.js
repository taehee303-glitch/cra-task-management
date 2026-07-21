const STORAGE_KEY = "cra-tasks";
const WORKSPACE_WORKFLOWS_KEY = "cra-workspace-workflows";
const GLOBAL_WORKFLOWS_KEY = "cra-global-workflows";
const WORKFLOW_INSTANCES_KEY = "cra-workflow-instances";
const ROUTINE_MASTER_KEY = "cra-routines";
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
const INLINE_STATUS_OPTIONS = ["Open", "In Progress", "On Hold", "Completed"];
const TASK_CARD_STATUS_OPTIONS = ["Open", "In Progress"];
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
let selectedStudyMasterTab = "general";

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

const WORKFLOW_CATEGORIES = ["Visit", "Training", "IRB", "Admin", "General"];
const WORKFLOW_TRIGGERS = ["TASK_CREATED", "TASK_COMPLETED", "STUDY_CREATED", "ROUTINE"];
const WORKFLOW_SCOPES = ["study", "workspace", "global"];
const WORKFLOW_INSTANCE_STATUSES = ["active", "completed", "superseded"];
const WORKFLOW_SCOPE_LABELS = {
  study: "Study",
  workspace: "Workspace",
  global: "General",
  general: "General",
};

let pendingTaskDraft = null;
let pendingWorkflowMatches = [];
let pendingWorkflowApplyIndex = 0;
let workflowLearnContext = null;
let lastCompletedTaskContext = null;

const ROUTINE_SCHEDULE_TYPES = [
  { key: "anchor", label: "마감일 기준 (D-14/D-7/D-3/Due)" },
  { key: "weekly", label: "매주" },
  { key: "monthly", label: "매월" },
];

const ROUTINE_WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const ROUTINE_PRESETS = {
  training: {
    name: "GCP Training",
    taskName: "GCP Training",
    priority: "Medium",
    schedule: { type: "anchor", offsets: [14, 7, 3, 0] },
    category: "Training",
  },
  queryCheck: {
    name: "Weekly Query Check",
    taskName: "Query Check",
    priority: "High",
    schedule: { type: "weekly", weekday: 5 },
    category: "General",
  },
  tmfCheck: {
    name: "Weekly TMF Check",
    taskName: "TMF Check",
    priority: "Medium",
    schedule: { type: "weekly", weekday: 1 },
    category: "General",
  },
};

let tasks = [];
let taskQuickFilter = "today";
let taskViewMode = "card";
let calendarMonthOffset = 0;
let toastHideTimer = null;
let toastRemoveTimer = null;

const TASK_QUICK_FILTER_LABELS = {
  overdue: "Overdue",
  today: "Today",
  week: "This Week",
  workflow: "Workflow",
  routine: "Routine",
  d1: "Tomorrow",
  open: "Open",
  "in-progress": "In Progress",
  completed: "Completed",
  "next-week": "다음 주 예정",
  all: "전체 업무",
};

const INLINE_PRIORITY_OPTIONS = ["Critical", "High", "Medium", "Low"];

const VISIT_TASK_PRESETS = {
  mv: { task: "Monitoring Visit", priority: "High", title: "MV 방문" },
  siv: { task: "Site Initiation Visit", priority: "High", title: "SIV" },
  cov: { task: "Close-out Visit", priority: "High", title: "COV" },
};

const VIEW_TITLES = {
  tasks: "My Tasks",
  inbox: "Inbox",
  calendar: "Calendar",
  dashboard: "Dashboard",
  reference: "Reference",
  "study-master": "Study",
  "site-master": "Site",
  "system-master": "System",
  "workflow-master": "Workflow",
  "routine-master": "Routine",
};

const DAILY_PRIMARY_VIEWS = ["dashboard", "tasks", "inbox", "calendar", "reference"];
const FAB_VIEWS = ["dashboard", "tasks", "inbox", "calendar"];
const MASTER_VIEWS = ["study-master", "workflow-master", "routine-master"];
const HIDDEN_MASTER_VIEWS = ["site-master", "system-master"];
const MOBILE_BREAKPOINT = window.matchMedia("(max-width: 768px)");

const MOBILE_FILTER_LABELS = TASK_QUICK_FILTER_LABELS;

const PRIORITY_SORT_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

let currentViewName = "dashboard";
let followUpPromptContext = null;
let pendingFollowUpParentTask = null;
let workflowDetailEditRef = null;
let workflowDetailDraft = null;
let dashboardWorkflowTaskId = null;
let dashboardExpandedSections = new Set();
let selectedWorkflowMasterTab = "general";
let selectedWorkflowStudyId = null;
let activeStatusPicker = null;

let addTaskPresetPriority = "Medium";
const els = {
  todayLabel: document.getElementById("todayLabel"),
  statTotal: document.getElementById("statTotal"),
  statCompleted: document.getElementById("statCompleted"),
  statOverdue: document.getElementById("statOverdue"),
  statWeekDue: document.getElementById("statWeekDue"),
  statTodayDue: document.getElementById("statTodayDue"),
  statNextWeekDue: document.getElementById("statNextWeekDue"),
  todayProgressHero: document.getElementById("todayProgressHero"),
  todayProgressPercent: document.getElementById("todayProgressPercent"),
  todayProgressCount: document.getElementById("todayProgressCount"),
  todayProgressFill: document.getElementById("todayProgressFill"),
  todayProgressRemaining: document.getElementById("todayProgressRemaining"),
  overallProgressPercent: document.getElementById("overallProgressPercent"),
  overallProgressSubtitle: document.getElementById("overallProgressSubtitle"),
  overallProgressFill: document.getElementById("overallProgressFill"),
  taskForm: document.getElementById("taskForm"),
  study: document.getElementById("study"),
  site: document.getElementById("site"),
  resetFormBtn: document.getElementById("resetFormBtn"),
  viewTasks: document.getElementById("viewTasks"),
  viewInbox: document.getElementById("viewInbox"),
  viewCalendar: document.getElementById("viewCalendar"),
  viewDashboard: document.getElementById("viewDashboard"),
  dashboardWorkflowPanel: document.getElementById("dashboardWorkflowPanel"),
  dashboardWorkflowBody: document.getElementById("dashboardWorkflowBody"),
  dashboardWorkflowTitle: document.getElementById("dashboardWorkflowTitle"),
  dashboardWorkflowEditBtn: document.getElementById("dashboardWorkflowEditBtn"),
  closeDashboardWorkflowBtn: document.getElementById("closeDashboardWorkflowBtn"),
  viewReference: document.getElementById("viewReference"),
  viewStudyMaster: document.getElementById("viewStudyMaster"),
  viewSystemMaster: document.getElementById("viewSystemMaster"),
  viewSiteMaster: document.getElementById("viewSiteMaster"),
  viewWorkflowMaster: document.getElementById("viewWorkflowMaster"),
  viewRoutineMaster: document.getElementById("viewRoutineMaster"),
  routineMasterList: document.getElementById("routineMasterList"),
  workflowDetailSaveBtn: document.getElementById("workflowDetailSaveBtn"),
  workflowMasterPanel: document.getElementById("workflowMasterPanel"),
  newWorkflowMasterBtn: document.getElementById("newWorkflowMasterBtn"),
  navButtons: document.querySelectorAll("[data-view]"),
  taskCardList: document.getElementById("taskCardList"),
  taskQuickFilterBtns: document.querySelectorAll("[data-quick-filter]"),
  tasksHomeSubtitle: document.getElementById("tasksHomeSubtitle"),
  tasksHomeCount: document.getElementById("tasksHomeCount"),
  addTaskModal: document.getElementById("addTaskModal"),
  closeAddTaskModalBtn: document.getElementById("closeAddTaskModalBtn"),
  addTaskModalTitle: document.getElementById("addTaskModalTitle"),
  addTaskFollowUpContext: document.getElementById("addTaskFollowUpContext"),
  addTaskWorkflowHintDefault: document.getElementById("addTaskWorkflowHintDefault"),
  sidebar: document.getElementById("sidebar"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),
  sidebarToggleBtn: document.getElementById("sidebarToggleBtn"),
  topbarTitle: document.getElementById("topbarTitle"),
  quickAddInput: document.getElementById("quickAddInput"),
  quickAddBtn: document.getElementById("quickAddBtn"),
  dashboardQuickAddInput: document.getElementById("dashboardQuickAddInput"),
  dashboardQuickAddBtn: document.getElementById("dashboardQuickAddBtn"),
  taskReadModal: document.getElementById("taskReadModal"),
  taskReadBody: document.getElementById("taskReadBody"),
  taskReadTitle: document.getElementById("taskReadTitle"),
  taskReadPriority: document.getElementById("taskReadPriority"),
  closeTaskReadModalBtn: document.getElementById("closeTaskReadModalBtn"),
  taskReadCloseBtn: document.getElementById("taskReadCloseBtn"),
  taskReadEditBtn: document.getElementById("taskReadEditBtn"),
  inboxNavBadge: document.getElementById("inboxNavBadge"),
  inboxTaskList: document.getElementById("inboxTaskList"),
  inboxCount: document.getElementById("inboxCount"),
  taskTableWrap: document.getElementById("taskTableWrap"),
  taskViewCardBtn: document.getElementById("taskViewCardBtn"),
  taskViewListBtn: document.getElementById("taskViewListBtn"),
  calendarMonthGrid: document.getElementById("calendarMonthGrid"),
  calendarMonthLabel: document.getElementById("calendarMonthLabel"),
  calendarPrevMonthBtn: document.getElementById("calendarPrevMonthBtn"),
  calendarNextMonthBtn: document.getElementById("calendarNextMonthBtn"),
  calendarTodayBtn: document.getElementById("calendarTodayBtn"),
  fabToggleBtn: document.getElementById("fabToggleBtn"),
  fabRoot: document.getElementById("fabRoot"),
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
  studyWorkflowLibrary: document.getElementById("studyWorkflowLibrary"),
  workflowSuggestModal: document.getElementById("workflowSuggestModal"),
  workflowSuggestBody: document.getElementById("workflowSuggestBody"),
  followUpPromptModal: document.getElementById("followUpPromptModal"),
  followUpPromptSummary: document.getElementById("followUpPromptSummary"),
  workflowLearnModal: document.getElementById("workflowLearnModal"),
  workflowLearnBody: document.getElementById("workflowLearnBody"),
  workflowDetailModal: document.getElementById("workflowDetailModal"),
  workflowDetailBody: document.getElementById("workflowDetailBody"),
  studyRoutinesList: document.getElementById("studyRoutinesList"),
  routineModal: document.getElementById("routineModal"),
  routineForm: document.getElementById("routineForm"),
  taskDetailWorkflowLink: document.getElementById("taskDetailWorkflowLink"),
  taskDetailRoutineLink: document.getElementById("taskDetailRoutineLink"),
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
  editModal: document.getElementById("taskDetailPanel"),
  taskDetailPanel: document.getElementById("taskDetailPanel"),
  taskDetailBackBtn: document.getElementById("taskDetailBackBtn"),
  taskDetailTitle: document.getElementById("taskDetailTitle"),
  editForm: document.getElementById("editForm"),
  closeModalBtn: document.getElementById("closeTaskDetailBtn"),
  closeTaskDetailBtn: document.getElementById("closeTaskDetailBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  deleteTaskDetailBtn: document.getElementById("deleteTaskDetailBtn"),
  taskDetailChecklist: document.getElementById("taskDetailChecklist"),
  taskChecklistNewInput: document.getElementById("taskChecklistNewInput"),
  taskChecklistAddBtn: document.getElementById("taskChecklistAddBtn"),
  taskDetailHistory: document.getElementById("taskDetailHistory"),
  attentionTodayCount: document.getElementById("attentionTodayCount"),
  attentionOverdueCount: document.getElementById("attentionOverdueCount"),
  attentionTodayList: document.getElementById("attentionTodayList"),
  attentionTomorrowCount: document.getElementById("attentionTomorrowCount"),
  attentionTomorrowList: document.getElementById("attentionTomorrowList"),
  attentionOverdueList: document.getElementById("attentionOverdueList"),
  reminderStatusBadge: document.getElementById("reminderStatusBadge"),
  openSettingsBtn: document.getElementById("openSettingsBtn"),
  settingsModal: document.getElementById("settingsModal"),
  closeSettingsModalBtn: document.getElementById("closeSettingsModalBtn"),
  settingsBackBtn: document.getElementById("settingsBackBtn"),
  settingsTitle: document.getElementById("settingsTitle"),
  settingsPanelMain: document.getElementById("settingsPanelMain"),
  settingsPanelCalendar: document.getElementById("settingsPanelCalendar"),
  settingsPanelNotification: document.getElementById("settingsPanelNotification"),
  settingsPanelAppearance: document.getElementById("settingsPanelAppearance"),
  settingsPanelData: document.getElementById("settingsPanelData"),
  settingsPanelAbout: document.getElementById("settingsPanelAbout"),
  settingsAccountCard: document.getElementById("settingsAccountCard"),
  settingsAccountEmail: document.getElementById("settingsAccountEmail"),
  settingsAccountStatus: document.getElementById("settingsAccountStatus"),
  settingsCloudSignOutBtn: document.getElementById("settingsCloudSignOutBtn"),
  calendarSyncToggle: document.getElementById("calendarSyncToggle"),
  calendarSyncStatus: document.getElementById("calendarSyncStatus"),
  calendarLastSync: document.getElementById("calendarLastSync"),
  calendarReconnectBtn: document.getElementById("calendarReconnectBtn"),
  calendarDisconnectBtn: document.getElementById("calendarDisconnectBtn"),
  calendarSetupHint: document.getElementById("calendarSetupHint"),
  reminderDueToggle: document.getElementById("reminderDueToggle"),
  reminderOverdueToggle: document.getElementById("reminderOverdueToggle"),
  reminderPermissionStatus: document.getElementById("reminderPermissionStatus"),
  uiScaleSelect: document.getElementById("uiScaleSelect"),
  settingsImportBtn: document.getElementById("settingsImportBtn"),
  settingsExportBtn: document.getElementById("settingsExportBtn"),
  settingsResetCacheBtn: document.getElementById("settingsResetCacheBtn"),
  settingsFirebaseSyncStatus: document.getElementById("settingsFirebaseSyncStatus"),
  settingsStorageUsage: document.getElementById("settingsStorageUsage"),
  settingsAppVersion: document.getElementById("settingsAppVersion"),
  settingsAppBuild: document.getElementById("settingsAppBuild"),
  taskListSection: document.getElementById("taskListSection"),
  mobileDailyHome: document.getElementById("mobileDailyHome"),
  mobileTaskActionList: document.getElementById("mobileTaskActionList"),
  mobileTaskActionCount: document.getElementById("mobileTaskActionCount"),
  mobileFilteredTitle: document.getElementById("mobileFilteredTitle"),
  mobileWorkflowSection: document.getElementById("mobileWorkflowSection"),
  mobileWorkflowList: document.getElementById("mobileWorkflowList"),
  mobileWorkflowCount: document.getElementById("mobileWorkflowCount"),
  mobileRoutineSection: document.getElementById("mobileRoutineSection"),
  mobileRoutinePreviewList: document.getElementById("mobileRoutinePreviewList"),
  taskWorkflowMatchHint: document.getElementById("taskWorkflowMatchHint"),
  taskDetailWorkflowPreview: document.getElementById("taskDetailWorkflowPreview"),
  taskDetailWorkflowTimeline: document.getElementById("taskDetailWorkflowTimeline"),
  taskDetailWorkflowSteps: document.getElementById("taskDetailWorkflowSteps"),
  taskDetailWorkflowStepsList: document.getElementById("taskDetailWorkflowStepsList"),
  tasksWorkflowStrip: document.getElementById("tasksWorkflowStrip"),
  dashboardWeekPrepList: document.getElementById("dashboardWeekPrepList"),
  dashboardWeekPrepCount: document.getElementById("dashboardWeekPrepCount"),
  dashboardNextWeekList: document.getElementById("dashboardNextWeekList"),
  dashboardNextWeekCount: document.getElementById("dashboardNextWeekCount"),
  dashboardRecentCompletedList: document.getElementById("dashboardRecentCompletedList"),
  dashboardRecentCompletedCount: document.getElementById("dashboardRecentCompletedCount"),
  dashboardGreeting: document.getElementById("dashboardGreeting"),
  dashboardEncouragement: document.getElementById("dashboardEncouragement"),
  dashboardGreetingSub: document.getElementById("dashboardGreetingSub"),
  dashboardHeaderDate: document.getElementById("dashboardHeaderDate"),
  dashboardCalendarBtn: document.getElementById("dashboardCalendarBtn"),
  dashboardAddTaskBtn: document.getElementById("dashboardAddTaskBtn"),
  dashboardStartWorkBtn: document.getElementById("dashboardStartWorkBtn"),
  todayProgressTotal: document.getElementById("todayProgressTotal"),
  todayProgressCompleted: document.getElementById("todayProgressCompleted"),
  dashboardWorkflowProgressPercent: document.getElementById("dashboardWorkflowProgressPercent"),
  dashboardWorkflowProgressFill: document.getElementById("dashboardWorkflowProgressFill"),
  dashboardWorkflowProgressSubtitle: document.getElementById("dashboardWorkflowProgressSubtitle"),
  dashboardOverdueSection: document.getElementById("dashboardOverdueSection"),
  dashboardNextWeekSection: document.getElementById("dashboardNextWeekSection"),
  dashboardActiveWorkflowList: document.getElementById("dashboardActiveWorkflowList"),
  dashboardActiveWorkflowCount: document.getElementById("dashboardActiveWorkflowCount"),
  referenceSearchInput: document.getElementById("referenceSearchInput"),
  referenceSearchResults: document.getElementById("referenceSearchResults"),
  referenceMainContent: document.getElementById("referenceMainContent"),
  referenceStudyList: document.getElementById("referenceStudyList"),
  referenceSiteList: document.getElementById("referenceSiteList"),
  referenceSystemList: document.getElementById("referenceSystemList"),
  referenceCloudSyncBtn: document.getElementById("referenceCloudSyncBtn"),
  referenceCloudSyncLabel: document.getElementById("referenceCloudSyncLabel"),
  addTaskPriority: document.getElementById("addTaskPriority"),
  task: document.getElementById("task"),
  dueDate: document.getElementById("dueDate"),
  bottomNav: document.getElementById("bottomNav"),
  masterSheet: document.getElementById("masterSheet"),
  bottomNavBtns: document.querySelectorAll(".bottom-nav [data-view]"),
  mobileFilterBtns: document.querySelectorAll("[data-mobile-filter]"),
  dashboardFilterCards: document.querySelectorAll("[data-dashboard-filter]"),
  toastContainer: document.getElementById("toastContainer"),
  cloudSyncStatus: document.getElementById("cloudSyncStatus"),
  cloudSignInBtn: document.getElementById("cloudSignInBtn"),
  cloudSignOutBtn: document.getElementById("cloudSignOutBtn"),
  workspace: document.getElementById("workspace"),
  appBootSplash: document.getElementById("appBootSplash"),
  appBootStatus: document.getElementById("appBootStatus"),
  authGate: document.getElementById("authGate"),
  authGateSignInBtn: document.getElementById("authGateSignInBtn"),
  authGateHint: document.getElementById("authGateHint"),
  authGateError: document.getElementById("authGateError"),
  authGateMeta: document.getElementById("authGateMeta"),
  authGateSyncStatus: document.getElementById("authGateSyncStatus"),
  authGateDebug: document.getElementById("authGateDebug"),
  authGateAltHost: document.getElementById("authGateAltHost"),
  authGateCorpWarning: document.getElementById("authGateCorpWarning"),
  authGateCorpHost: document.getElementById("authGateCorpHost"),
  authGateDirectUrl: document.getElementById("authGateDirectUrl"),
  authGateSkipBtn: document.getElementById("authGateSkipBtn"),
  authGateCacheRefreshBtn: document.getElementById("authGateCacheRefreshBtn"),
};

function removeStaleAuthGateSyncStatus() {
  const stale = document.getElementById("authGateSyncStatus");
  if (!stale) return;
  if (/클라우드 데이터/.test(stale.textContent || "")) {
    stale.remove();
    els.authGateSyncStatus = null;
    return;
  }
  stale.classList.remove("auth-gate__sync-status--active");
  stale.hidden = true;
}

function ensureAuthGateSyncStatusElement() {
  removeStaleAuthGateSyncStatus();
  if (els.authGateSyncStatus) return els.authGateSyncStatus;

  const panel = document.querySelector("#authGate .auth-gate__panel");
  if (!panel) return null;

  const el = document.createElement("p");
  el.id = "authGateSyncStatus";
  el.className = "auth-gate__sync-status";
  el.hidden = true;
  el.setAttribute("aria-live", "polite");

  const debug = document.getElementById("authGateDebug");
  if (debug) {
    panel.insertBefore(el, debug);
  } else {
    panel.appendChild(el);
  }

  els.authGateSyncStatus = el;
  return el;
}

function setAuthGateSyncMessage(message, active = false) {
  if (!active) {
    if (els.authGateSyncStatus) {
      els.authGateSyncStatus.classList.remove("auth-gate__sync-status--active");
      els.authGateSyncStatus.hidden = true;
    }
    return;
  }

  const el = ensureAuthGateSyncStatusElement();
  if (!el) return;
  el.textContent = message;
  el.classList.add("auth-gate__sync-status--active");
  el.hidden = false;
}

function resetAuthGateIdleUi() {
  setAuthGateSyncMessage("", false);
  removeStaleAuthGateSyncStatus();
  if (els.authGateSignInBtn && els.authGateSignInBtn.textContent === "로그인 중…") {
    els.authGateSignInBtn.disabled = false;
    els.authGateSignInBtn.textContent = "Google로 로그인";
  }
}

removeStaleAuthGateSyncStatus();

function notifyCloudSync(key) {
  window.CloudSyncManager?.notifyChange?.(key);
}

function loadAllFromLocalStorage() {
  tasks = TaskStore.load();
  StudyMasterStore.load();
  SiteMasterStore.load();
  SystemMasterStore.load();
  WorkspaceWorkflowStore.load();
  GlobalWorkflowStore.load();
  WorkflowInstanceStore.load();
  RoutineStore.load();
}

function refreshAfterCloudSync() {
  if (!window.__appBootstrapFinished) return;
  reconcileSiteNamesAfterMasterChange();
  WorkflowInstanceStore.load();
  RoutineStore.load();
  migrateMasterDataSSOT();
  migrateTasksToWorkflowInstances();
  updateTodayLabel();
  renderAll();
  renderStudyMaster();
  renderSystemMaster();
  renderWorkflowMaster();
  renderRoutineMaster();
  refreshTaskStudySiteSelects();
}

function registerCloudSyncSources() {
  if (!window.CloudSyncManager) return;

  CloudSyncManager.registerSources({
    tasks: {
      kind: "array",
      localStorageKey: STORAGE_KEY,
      getPayload: () => tasks,
      applyPayload: (items) => {
        tasks = (Array.isArray(items) ? items : []).filter(isValidTask).map(normalizeTask);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        migrateTasksToWorkflowInstances();
      },
    },
    studies: {
      kind: "array",
      localStorageKey: STUDY_MASTER_KEY,
      getPayload: () => StudyMasterStore.studies,
      applyPayload: (items) => {
        StudyMasterStore.studies = Array.isArray(items) ? items : [];
        localStorage.setItem(STUDY_MASTER_KEY, JSON.stringify(StudyMasterStore.studies));
      },
    },
    sites: {
      kind: "array",
      localStorageKey: SITE_MASTER_KEY,
      getPayload: () => SiteMasterStore.sites,
      applyPayload: (items) => {
        SiteMasterStore.sites = (Array.isArray(items) ? items : []).map(normalizeSiteMasterRecord);
        localStorage.setItem(SITE_MASTER_KEY, JSON.stringify(SiteMasterStore.sites));
      },
    },
    systems: {
      kind: "array",
      localStorageKey: SYSTEM_MASTER_KEY,
      getPayload: () => SystemMasterStore.systems,
      applyPayload: (items) => {
        SystemMasterStore.systems = Array.isArray(items) ? items : [];
        localStorage.setItem(SYSTEM_MASTER_KEY, JSON.stringify(SystemMasterStore.systems));
      },
    },
    uiSettings: {
      kind: "object",
      localStorageKey: UI_SETTINGS_KEY,
      getPayload: () => UiSettingsStore.load(),
      applyPayload: (data) => {
        const next =
          data && typeof data === "object"
            ? data
            : { size: "normal", taskSiteInfoExpanded: false };
        localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(next));
        applyUiScale(UiSettingsStore.getScaleValue());
      },
    },
    reminderSettings: {
      kind: "object",
      localStorageKey: REMINDER_SETTINGS_KEY,
      getPayload: () => ReminderSettingsStore.load(),
      applyPayload: (data) => {
        localStorage.setItem(
          REMINDER_SETTINGS_KEY,
          JSON.stringify(
            data && typeof data === "object"
              ? data
              : { enabled: true, permissionRequested: false, sentNotifications: {} }
          )
        );
      },
    },
    workspaceWorkflows: {
      kind: "array",
      localStorageKey: WORKSPACE_WORKFLOWS_KEY,
      getPayload: () => WorkspaceWorkflowStore.workflows,
      applyPayload: (items) => {
        WorkspaceWorkflowStore.workflows = Array.isArray(items) ? items.map(normalizeWorkflowRecord) : [];
        localStorage.setItem(WORKSPACE_WORKFLOWS_KEY, JSON.stringify(WorkspaceWorkflowStore.workflows));
      },
    },
    globalWorkflows: {
      kind: "array",
      localStorageKey: GLOBAL_WORKFLOWS_KEY,
      getPayload: () => GlobalWorkflowStore.workflows,
      applyPayload: (items) => {
        GlobalWorkflowStore.workflows = Array.isArray(items) ? items.map((w) => normalizeWorkflowRecord({ ...w, scope: "global" })) : [];
        localStorage.setItem(GLOBAL_WORKFLOWS_KEY, JSON.stringify(GlobalWorkflowStore.workflows));
      },
    },
    routines: {
      kind: "array",
      localStorageKey: ROUTINE_MASTER_KEY,
      getPayload: () => RoutineStore.routines,
      applyPayload: (items) => {
        RoutineStore.routines = Array.isArray(items) ? items.map(normalizeRoutineRecord) : [];
        localStorage.setItem(ROUTINE_MASTER_KEY, JSON.stringify(RoutineStore.routines));
      },
    },
    workflowInstances: {
      kind: "array",
      localStorageKey: WORKFLOW_INSTANCES_KEY,
      getPayload: () => WorkflowInstanceStore.instances,
      applyPayload: (items) => {
        WorkflowInstanceStore.instances = Array.isArray(items) ? items.map(normalizeWorkflowInstance) : [];
        localStorage.setItem(WORKFLOW_INSTANCES_KEY, JSON.stringify(WorkflowInstanceStore.instances));
      },
    },
  });

  CloudSyncManager.setRefreshCallback(refreshAfterCloudSync);
}

function setBootStatus(message) {
  if (els.appBootStatus) els.appBootStatus.textContent = message;
}

const BOOTSTRAP_TIMEOUT_MS = 45000;

function withAppTimeout(promise, timeoutMs, timeoutMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage || "작업 시간이 초과되었습니다."));
      }, timeoutMs);
    }),
  ]);
}

function showPostAuthBootSplash(message) {
  if (els.appBootSplash) {
    els.appBootSplash.hidden = false;
    els.appBootSplash.classList.remove("auth-gate--hidden");
  }
  setBootStatus(message || "Dashboard 준비 중…");
}

function hidePostAuthBootSplash() {
  if (els.appBootSplash) {
    els.appBootSplash.hidden = true;
    els.appBootSplash.classList.add("auth-gate--hidden");
  }
}

let authGateExitWatcherId = null;

function resetAuthGateSignInUi(btn, prevLabel) {
  setAuthGateSyncMessage("", false);
  const button = btn || els.authGateSignInBtn;
  if (button) {
    button.disabled = false;
    button.textContent = prevLabel || "Google로 로그인";
  }
}

function stopAuthGateExitWatcher() {
  if (authGateExitWatcherId) {
    clearInterval(authGateExitWatcherId);
    authGateExitWatcherId = null;
  }
}

async function adoptFirebaseAuthUserIfNeeded() {
  const mgr = window.CloudSyncManager;
  if (!mgr) return false;
  if (mgr.isSignedIn?.()) return true;

  await mgr.adoptAuthUserFromFirebase?.();
  if (mgr.isSignedIn?.()) return true;

  if (typeof firebase !== "undefined" && firebase.auth?.()?.currentUser) {
    await mgr.syncCurrentAuthUser?.();
  }
  return Boolean(mgr.isSignedIn?.());
}

async function tryEnterAuthenticatedAppFromAuthGate() {
  await adoptFirebaseAuthUserIfNeeded();
  if (!window.CloudSyncManager?.isSignedIn?.()) return false;

  stopAuthGateExitWatcher();
  resetAuthGateSignInUi();
  logAuthStepUi("로그인 확인됨 → Dashboard 진입…");
  hideAuthOverlays();
  if (!window.__appBootstrapFinished) {
    await enterAuthenticatedApp();
  } else {
    await completeLoginFlow();
  }
  return true;
}

function startAuthGateExitWatcher({ buttonEl, prevLabel } = {}) {
  stopAuthGateExitWatcher();
  const startedAt = Date.now();
  const btn = buttonEl || els.authGateSignInBtn;
  const label = prevLabel ?? btn?.textContent;

  authGateExitWatcherId = setInterval(() => {
    void (async () => {
      if (!window.CloudSyncManager?.requiresAuth?.()) {
        stopAuthGateExitWatcher();
        return;
      }

      const elapsed = Date.now() - startedAt;

      if (await tryEnterAuthenticatedAppFromAuthGate()) {
        resetAuthGateSignInUi(btn, label);
        return;
      }

      if (elapsed >= 15000 && els.authGateError && !CloudSyncManager.isSignedIn?.()) {
        els.authGateError.hidden = false;
        els.authGateError.textContent =
          "Firebase 연결이 느립니다. Google 계정 선택을 완료했다면 「Dashboard 건너뛰기」를 눌러 보세요.";
      }

      if (elapsed >= 120000) {
        stopAuthGateExitWatcher();
        resetAuthGateSignInUi(btn, label);
        if (els.authGateError) {
          els.authGateError.hidden = false;
          els.authGateError.textContent =
            "로그인 응답이 너무 느립니다. VPN·회사 네트워크가 느리면 「Dashboard 건너뛰기」를 눌러 보세요.";
        }
      }
    })();
  }, 400);
}

async function forceEnterDashboardFromAuthGate() {
  logAuthStepUi("Dashboard 건너뛰기 시도…");
  setAuthGateSyncMessage("Dashboard 준비 중…", true);
  const entered = await tryEnterAuthenticatedAppFromAuthGate();
  if (entered) return;

  window.alert(
    "아직 Google 로그인이 확인되지 않았습니다.\n\n1. Google 계정 선택을 완료했는지 확인\n2. 「최신 버전 새로고침」 클릭\n3. 그래도 안 되면 VPN 끄거나 휴대폰 LTE로 시도"
  );
}

function hardRefreshAuthGateCache() {
  try {
    localStorage.removeItem("cra_app_shell_build");
    sessionStorage.removeItem("cra-firebase-auth-redirect");
  } catch (e) { /* ignore */ }
  const url = new URL(location.href);
  url.searchParams.set("b", APP_BUILD);
  url.searchParams.set("t", String(Date.now()));
  location.replace(url.toString());
}

const APP_DIRECT_URLS = [
  "https://taehee303-glitch.github.io/cra-task-management/",
  "https://cra-task-management.web.app/",
];

const APP_TRUSTED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "taehee303-glitch.github.io",
  "cra-task-management.web.app",
  "cra-task-management.firebaseapp.com",
];

function isCorporateUrlGateway() {
  const host = (window.location.hostname || "").toLowerCase();
  if (!host) return false;
  if (APP_TRUSTED_HOSTS.some((trusted) => host === trusted || host.endsWith(`.${trusted}`))) {
    return false;
  }
  return (
    /mimecastprotect\.com$/i.test(host) ||
    /mimecast\.com$/i.test(host) ||
    /safelinks\.protection\.outlook\.com$/i.test(host) ||
    /urldefense\.proofpoint\.com$/i.test(host) ||
    /avanan\.net$/i.test(host)
  );
}

function getCorporateGatewayLabel() {
  const host = window.location.hostname || "";
  if (/mimecast/i.test(host)) return "Mimecast";
  if (/safelinks/i.test(host)) return "Microsoft Safe Links";
  if (/proofpoint/i.test(host)) return "Proofpoint";
  return "회사 보안 프록시";
}

function applyCorporateGatewayAuthGateUi() {
  const wrapped = isCorporateUrlGateway();
  if (els.authGateCorpWarning) {
    els.authGateCorpWarning.hidden = !wrapped;
  }
  if (els.authGateCorpHost && wrapped) {
    els.authGateCorpHost.textContent = window.location.hostname;
  }
  if (els.authGateSignInBtn) {
    els.authGateSignInBtn.disabled = wrapped;
    els.authGateSignInBtn.title = wrapped
      ? "Mimecast 등 회사 URL 래핑 환경에서는 Google 로그인이 불가능합니다. 주소창에 직접 URL을 입력해 주세요."
      : "";
  }
  if (wrapped && els.authGateError) {
    els.authGateError.hidden = false;
    els.authGateError.textContent = `${getCorporateGatewayLabel()} URL 래핑 감지 — 주소창에 직접 ${APP_DIRECT_URLS[0]} 를 입력해 주세요.`;
  }
  return wrapped;
}

function ensureAuthGateEscapeHatches() {
  const gate = document.getElementById("authGate");
  if (!gate) return;

  let bar = document.getElementById("authGateEscapeBar");
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "auth-gate__escape-bar";
    bar.id = "authGateEscapeBar";
    gate.appendChild(bar);
  }

  if (!document.getElementById("authGateSkipBtn")) {
    const skip = document.createElement("button");
    skip.type = "button";
    skip.id = "authGateSkipBtn";
    skip.className = "auth-gate__skip btn btn--primary btn--sm";
    skip.textContent = "▶ Dashboard 건너뛰기";
    bar.appendChild(skip);
  }

  if (!document.getElementById("authGateCacheRefreshBtn")) {
    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.id = "authGateCacheRefreshBtn";
    refresh.className = "auth-gate__refresh btn btn--ghost btn--sm";
    refresh.textContent = `최신 버전 새로고침 (Build ${APP_BUILD})`;
    bar.appendChild(refresh);
  }

  els.authGateSkipBtn = document.getElementById("authGateSkipBtn");
  els.authGateCacheRefreshBtn = document.getElementById("authGateCacheRefreshBtn");

  if (els.authGateSkipBtn) els.authGateSkipBtn.hidden = false;
  if (els.authGateCacheRefreshBtn) els.authGateCacheRefreshBtn.hidden = false;
  if (bar) bar.hidden = false;
}

function bindAuthGateEscapeHandlers() {
  if (window.__authGateEscapeBound) return;
  window.__authGateEscapeBound = true;

  document.addEventListener("click", (event) => {
    const skipBtn = event.target.closest("#authGateSkipBtn");
    if (skipBtn) {
      event.preventDefault();
      void forceEnterDashboardFromAuthGate();
      return;
    }
    const refreshBtn = event.target.closest("#authGateCacheRefreshBtn");
    if (refreshBtn) {
      event.preventDefault();
      hardRefreshAuthGateCache();
    }
  });
}

function logAuthStepUi(message) {
  const text = String(message || "");
  if (els.authGateDebug) {
    els.authGateDebug.hidden = false;
    els.authGateDebug.textContent = text || "로그인 대기 중…";
  }
  if (els.appBootStatus && els.appBootSplash && !els.appBootSplash.hidden) {
    els.appBootStatus.textContent = text || "시작 중…";
  }
}

function logAuthStep(message) {
  const text = String(message || "");
  logAuthStepUi(text);
  window.CloudSyncManager?.logAuthStep?.(text);
}

function showAuthGate(options = {}) {
  if (els.appBootSplash) els.appBootSplash.hidden = true;
  if (els.authGate) {
    els.authGate.hidden = false;
    els.authGate.classList.remove("auth-gate--hidden");
  }
  if (els.workspace) {
    els.workspace.hidden = true;
  }
  if (els.authGateError) {
    const errorText =
      options.error ||
      window.CloudSyncManager?.peekPersistedAuthError?.() ||
      "";
    els.authGateError.hidden = !errorText;
    els.authGateError.textContent = errorText;
  }
  if (options.syncing && options.syncMessage) {
    setAuthGateSyncMessage(options.syncMessage, true);
  } else {
    resetAuthGateIdleUi();
  }
  if (els.authGateHint) {
    const mobileHint = window.CloudSyncManager?.getMobileLoginHint?.() || "";
    const redirectHint =
      "클릭하면 Google 계정 선택 창이 열립니다. (페이지 이동 없이 로그인)";
    els.authGateHint.textContent = mobileHint || redirectHint;
    els.authGateHint.hidden = false;
  }
  const debugText =
    window.CloudSyncManager?.getAuthStatus?.() || "로그인 대기 중…";
  logAuthStepUi(debugText);
  ensureAuthGateEscapeHatches();
  applyCorporateGatewayAuthGateUi();
  if (els.authGateSkipBtn) els.authGateSkipBtn.hidden = false;
  if (document.getElementById("authGateEscapeBar")) {
    document.getElementById("authGateEscapeBar").hidden = false;
  }
  if (els.authGateMeta) {
    const hostname = window.location.hostname || "unknown";
    const diag = window.CloudSyncManager?.getAuthDiagnostics?.() || {};
    const storageLabel = diag.storageOk === "blocked" ? " · 저장소 차단" : "";
    const authStatus = window.CloudSyncManager?.getAuthStatus?.() || "";
    const statusLabel = authStatus ? ` · ${authStatus}` : "";
    els.authGateMeta.textContent = `Build ${APP_BUILD} · ${hostname}${storageLabel}${statusLabel}`;
  }
  if (els.authGateAltHost) {
    const onGithubPages = /github\.io$/i.test(window.location.hostname || "");
    if (onGithubPages) {
      els.authGateAltHost.hidden = false;
      els.authGateAltHost.innerHTML =
        '회사 PC에서 GitHub Pages 로그인이 안 되면 <a href="https://cra-task-management.web.app/" target="_blank" rel="noopener">cra-task-management.web.app</a> 에서 시도해 보세요.';
    } else {
      els.authGateAltHost.hidden = true;
      els.authGateAltHost.textContent = "";
    }
  }
}

function hideAuthOverlays() {
  if (els.appBootSplash) {
    els.appBootSplash.hidden = true;
    els.appBootSplash.classList.add("auth-gate--hidden");
  }
  if (els.authGate) {
    els.authGate.hidden = true;
    els.authGate.classList.add("auth-gate--hidden");
  }
  if (els.workspace) {
    els.workspace.hidden = false;
    els.workspace.classList.remove("workspace--locked");
  }
}

async function enterAuthenticatedApp() {
  if (!window.CloudSyncManager?.isSignedIn?.()) return;
  if (window.__appBootstrapFinished) return;
  if (window.__enterAppInProgress) {
    if (finishBootstrapPromise) await finishBootstrapPromise;
    return;
  }

  window.__enterAppInProgress = true;
  try {
    loadAllFromLocalStorage();
    hideAuthOverlays();
    setAuthGateSyncMessage("", false);
    showPostAuthBootSplash("Dashboard 준비 중…");
    logAuthStepUi("Dashboard 준비 중…");
    await finishAppBootstrapOnce();
  } catch (err) {
    console.error("Authenticated app entry failed:", err);
    hideAuthOverlays();
    const message =
      err?.message || "앱을 시작하는 중 오류가 발생했습니다. Ctrl+Shift+R로 새로고침해 주세요.";
    showToast(message.replace(/\n+/g, " "));
    if (!window.__appBootstrapFinished) {
      try {
        renderAll();
        window.__appBootstrapFinished = true;
        window.dispatchEvent(new Event("app-ready"));
      } catch (renderErr) {
        console.error("Emergency render failed:", renderErr);
        showAuthGate({ error: message });
      }
    }
  } finally {
    hidePostAuthBootSplash();
    window.__enterAppInProgress = false;
  }
}

async function completeLoginFlow() {
  if (!window.CloudSyncManager?.isSignedIn?.()) return;
  if (window.__appBootstrapInProgress) return;

  try {
    loadAllFromLocalStorage();
    hideAuthOverlays();

    if (!window.__appBootstrapFinished) {
      await finishAppBootstrapOnce();
      return;
    }

    refreshAfterCloudSync();
  } catch (err) {
    console.error("Login bootstrap failed:", err);
    const message =
      CloudSyncManager?.formatAuthError?.(err) ||
      err?.message ||
      "로그인 후 앱을 시작하지 못했습니다.";
    if (CloudSyncManager.isSignedIn()) {
      hideAuthOverlays();
      showToast(message.replace(/\n+/g, " "));
      return;
    }
    showAuthGate({ error: message });
    throw err;
  }
}

function triggerCloudSignIn(buttonEl, options = {}) {
  if (!window.CloudSyncManager) return Promise.resolve();

  if (isCorporateUrlGateway()) {
    const message = `${getCorporateGatewayLabel()} URL 래핑 환경에서는 Google 로그인이 불가능합니다.\n\nEdge 주소창에 직접 입력:\n${APP_DIRECT_URLS.join("\n")}`;
    logAuthStep(message.split("\n")[0]);
    if (els.authGateError) {
      els.authGateError.textContent = message.replace(/\n+/g, " ");
      els.authGateError.hidden = false;
    }
    window.alert(message);
    return Promise.reject({ code: "auth/corporate-gateway", message });
  }

  const btn = buttonEl;
  const prevLabel = btn?.textContent;
  if (btn) {
    btn.disabled = true;
    btn.textContent = "로그인 중…";
  }
  if (els.authGateError) {
    els.authGateError.hidden = true;
    els.authGateError.textContent = "";
  }
  if (els.authGateSyncStatus) {
    setAuthGateSyncMessage("Google 계정 선택 중…", true);
  }

  startAuthGateExitWatcher({ buttonEl: btn, prevLabel });

  return CloudSyncManager.signInWithGoogle(options)
    .then(async () => {
      await tryEnterAuthenticatedAppFromAuthGate();
    })
    .catch((err) => {
      console.error("Google login failed:", err);
      if (err?.code !== "auth/popup-closed-by-user") {
        const message = CloudSyncManager.formatAuthError?.(err) || err?.message || "Google 로그인에 실패했습니다.";
        CloudSyncManager.persistAuthError?.(err);
        logAuthStep(`실패: ${message.replace(/\n+/g, " ").slice(0, 120)}`);
        if (els.authGateError) {
          els.authGateError.textContent = message.replace(/\n+/g, " ");
          els.authGateError.hidden = false;
        }
        if (err?.code !== "auth/timeout") {
          window.alert(message.replace(/\n+/g, "\n"));
        }
      }
      throw err;
    })
    .finally(() => {
      if (!CloudSyncManager?.isSignedIn?.()) {
        resetAuthGateSignInUi(btn, prevLabel);
      }
    });
}

async function ensureCloudAuthBeforeBootstrap() {
  if (!window.CloudSyncManager) {
    if (window.FIREBASE_CONFIG?.requireCloudAuth) {
      throw new Error("Firebase 동기화 모듈을 불러오지 못했습니다. 페이지를 새로고침해 주세요.");
    }
    return;
  }

  if (CloudSyncManager.hasPendingAuthRedirect?.()) {
    setBootStatus("Google 로그인 확인 중…");
  } else {
    setBootStatus("로그인 확인 중…");
  }
  await CloudSyncManager.init();
  await CloudSyncManager.syncCurrentAuthUser?.();

  if (!CloudSyncManager.isSignedIn() && CloudSyncManager.shouldRecoverRedirectAuth?.()) {
    setBootStatus("Google 로그인 확인 중…");
    await CloudSyncManager.recoverRedirectAuth(20000);
  }

  const { signedIn } = await CloudSyncManager.waitForInitialAuth();

  if (!CloudSyncManager.requiresAuth()) {
    if (signedIn) {
      try {
        await CloudSyncManager.waitUntilSignedInAndSynced(5000);
      } catch (err) {
        console.warn("Cloud sync wait skipped:", err);
      }
    }
    return;
  }

  if (!CloudSyncManager.isConfigured()) {
    showAuthGate({
      error: "Firebase 설정이 없습니다. firebase-config.js를 확인해 주세요.",
    });
    throw new Error("Firebase not configured");
  }

  if (signedIn || CloudSyncManager.isSignedIn()) {
    try {
      await CloudSyncManager.waitUntilSignedInAndSynced(5000);
    } catch (err) {
      console.warn("Cloud sync wait skipped after sign-in:", err);
    }
    return;
  }

  const persistedError = CloudSyncManager.consumePersistedAuthError?.() || "";
  showAuthGate({ error: persistedError || undefined });
  setBootStatus("");
  setAuthGateSyncMessage("", false);
  startAuthGateExitWatcher();
  await CloudSyncManager.waitUntilSignedIn();
  if (!CloudSyncManager.isSignedIn()) {
    showAuthGate({
      error: "Google 로그인이 완료되지 않았습니다. 다시 시도해 주세요.",
    });
    throw new Error("Login did not complete");
  }
  if (finishBootstrapPromise) {
    await finishBootstrapPromise;
  }
}

function initCloudSyncUi() {
  if (!window.CloudSyncManager) {
    if (els.cloudSyncPanel) els.cloudSyncPanel.hidden = true;
    if (window.FIREBASE_CONFIG?.requireCloudAuth) {
      showAuthGate({ error: "Firebase 동기화 모듈을 불러오지 못했습니다. 페이지를 새로고침해 주세요." });
    }
    return;
  }

  CloudSyncManager.setSignedInEntryCallback?.(async () => {
    if (!CloudSyncManager.requiresAuth?.()) return;
    await enterAuthenticatedApp();
  });

  CloudSyncManager.setAuthStepCallback?.((text) => {
    logAuthStepUi(text);
  });

  let wasSignedIn = CloudSyncManager.isSignedIn();

  const updateCloudSyncUi = ({ configured, signedIn, syncing, user }) => {
    const statusEl = els.cloudSyncStatus;
    const signInBtn = els.cloudSignInBtn;
    const signOutBtn = els.cloudSignOutBtn;

    if (!configured) {
      statusEl.textContent = "클라우드 미설정";
      statusEl.className = "cloud-sync__status cloud-sync__status--setup";
      statusEl.title = "firebase-config.js에 Firebase 설정을 입력하세요";
      signInBtn.hidden = false;
      signOutBtn.hidden = true;
      return;
    }

    if (signedIn && user) {
      const name = user.displayName || user.email || "Google 계정";
      statusEl.textContent = syncing ? "동기화 중…" : `클라우드 · ${name}`;
      statusEl.className = syncing
        ? "cloud-sync__status cloud-sync__status--syncing"
        : "cloud-sync__status cloud-sync__status--online";
      statusEl.title = "PC와 휴대폰에서 같은 데이터를 사용합니다";
      signInBtn.hidden = true;
      signOutBtn.hidden = false;
    } else {
      statusEl.textContent = CloudSyncManager.requiresAuth?.() ? "로그인 필요" : "로컬 저장";
      statusEl.className = "cloud-sync__status cloud-sync__status--local";
      statusEl.title = CloudSyncManager.requiresAuth?.()
        ? "Google 로그인 후 클라우드에서 데이터를 불러옵니다"
        : "로그인하면 기기 간 데이터가 동기화됩니다";
      signInBtn.hidden = false;
      signOutBtn.hidden = true;
    }

    if (wasSignedIn && !signedIn) {
      if (
        CloudSyncManager.requiresAuth?.() &&
        !CloudSyncManager.isAuthInProgress?.() &&
        window.__appBootstrapFinished
      ) {
        showAuthGate({
          error:
            CloudSyncManager.peekPersistedAuthError?.() ||
            "로그인 세션이 끊어졌습니다. 다시 로그인해 주세요.",
        });
      } else if (!CloudSyncManager.requiresAuth?.()) {
        loadAllFromLocalStorage();
        refreshAfterCloudSync();
      }
    }
    wasSignedIn = signedIn;
    updateReferenceCloudSyncLabel();
    updateAccountSettingsUi();
  };

  CloudSyncManager.setUiCallback(updateCloudSyncUi);

  CloudSyncManager.setAuthErrorCallback((message) => {
    showToast(message.replace(/\n+/g, " "));
    if (els.authGateError && els.authGate && !els.authGate.hidden) {
      els.authGateError.textContent = message.replace(/\n+/g, " ");
      els.authGateError.hidden = false;
    }
  });

  const mobileHint = CloudSyncManager.getMobileLoginHint?.();
  if (mobileHint && els.cloudSyncStatus) {
    els.cloudSyncStatus.title = mobileHint;
  }

  els.cloudSignInBtn?.addEventListener("click", () => {
    triggerCloudSignIn(els.cloudSignInBtn);
  });

  els.authGateSignInBtn?.addEventListener("click", () => {
    triggerCloudSignIn(els.authGateSignInBtn).catch(() => {
      /* inline error */
    });
  });

  bindAuthGateEscapeHandlers();

  els.cloudSignOutBtn?.addEventListener("click", () => {
    void handleCloudSignOut();
  });

  els.settingsCloudSignOutBtn?.addEventListener("click", () => {
    void handleCloudSignOut();
  });

  updateCloudSyncUi({
    configured: CloudSyncManager.isConfigured(),
    signedIn: CloudSyncManager.isSignedIn(),
    syncing: false,
    user: null,
  });
}

function init() {
  removeStaleAuthGateSyncStatus();
  resetAuthGateIdleUi();
  ensureAuthGateEscapeHatches();
  bindAuthGateEscapeHandlers();
  applyUiScale();
  bootstrapApp().catch((err) => {
    if (window.CloudSyncManager?.requiresAuth?.() && !CloudSyncManager.isSignedIn()) {
      console.warn("로그인 대기 중:", err);
      return;
    }
    console.error("앱 초기화 실패:", err);
    alert(
      `앱을 초기화하는 중 오류가 발생했습니다.\n\n${err?.message || err}\n\nCtrl+Shift+R로 강력 새로고침하거나, PWA라면 앱을 재설치해 주세요.`
    );
  });
}

function bindEvent(target, event, handler) {
  target?.addEventListener(event, handler);
}

async function bootstrapApp() {
  if (window.__appBootstrapInProgress) return;
  window.__appBootstrapInProgress = true;

  registerCloudSyncSources();
  initCloudSyncUi();

  try {
    await ensureCloudAuthBeforeBootstrap();
    if (!window.__appBootstrapFinished) {
      await enterAuthenticatedApp();
    } else if (finishBootstrapPromise) {
      await finishBootstrapPromise;
    }
  } catch (err) {
    if (CloudSyncManager?.isSignedIn?.()) {
      hideAuthOverlays();
    }
    throw err;
  } finally {
    window.__appBootstrapInProgress = false;
  }
}

let finishBootstrapPromise = null;

async function finishAppBootstrapOnce() {
  if (window.__appBootstrapFinished) return;
  if (finishBootstrapPromise) return finishBootstrapPromise;

  finishBootstrapPromise = (async () => {
    try {
      await withAppTimeout(
        finishAppBootstrap(),
        BOOTSTRAP_TIMEOUT_MS,
        "앱 시작 시간이 초과되었습니다. 회사 네트워크가 느릴 수 있습니다 — Ctrl+Shift+R 후 다시 시도해 주세요."
      );
    } catch (err) {
      console.error("App bootstrap failed:", err);
      showToast(String(err?.message || err).replace(/\n+/g, " "));
      throw err;
    }
    window.__appBootstrapFinished = true;
    window.dispatchEvent(new Event("app-ready"));
  })().finally(() => {
    finishBootstrapPromise = null;
  });

  return finishBootstrapPromise;
}

async function initDeferredBootstrapServices() {
  if (window.CalendarSyncManager) {
    try {
      await withAppTimeout(
        (async () => {
          await CalendarSyncManager.init();
          CalendarSyncManager.registerHelpers({
            getStandardSiteName,
            getTaskSiteLabel: getTaskSiteLabelForCalendar,
            getTaskStudySiteNumber,
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
        })(),
        10000,
        "Calendar init timeout"
      );
    } catch (err) {
      console.warn("Calendar Sync 초기화를 건너뜁니다:", err);
    }
  }

  try {
    await withAppTimeout(initDesktopReminders(), 8000, "Reminder init timeout");
  } catch (err) {
    console.warn("Reminder 초기화를 건너뜁니다:", err);
  }
}

async function finishAppBootstrap() {
  await seedSiteMasterIfEmpty();
  migrateMasterStructureV2();
  migrateStudySystemsToSystemMaster();
  void migrateIrbPortalPasswords().catch((err) => {
    console.warn("IRB password migration deferred:", err);
  });
  await seedStudyMasterIfEmpty();
  seedSampleDataIfEmpty();
  migrateTaskStatuses();
  migrateMasterDataSSOT();
  migrateTasksToWorkflowInstances();
  StudyMasterStore.migrateFromTasks(tasks);
  reconcileSiteNamesAfterMasterChange();
  runRoutineScheduler();

  updateTodayLabel();
  showFileProtocolBannerIfNeeded();
  initMobileAccessBanner();
  taskViewMode = UiSettingsStore.getTaskViewMode();
  applyTaskViewModeUi();
  renderAll();
  try {
    renderStudyMaster();
    renderSystemMaster();
    renderWorkflowMaster();
    refreshTaskStudySiteSelects();
  } catch (err) {
    console.warn("Master 화면 초기화 중 일부 오류:", err);
  }

  if (!els.taskForm || !els.editForm) {
    throw new Error(
      "필수 UI(taskForm/editForm)를 찾을 수 없습니다. 브라우저 캐시가 오래되었을 수 있습니다."
    );
  }

  bindEvent(els.taskForm, "submit", handleAddTask);
  bindEvent(els.resetFormBtn, "click", () => {
    els.taskForm.reset();
    refreshTaskStudySiteSelects();
    updateSiteInfoDisplays();
  });
  els.study.addEventListener("change", () => {
    populateSiteSelect(els.site, els.study.value);
    updateSiteInfoDisplays();
    updateSiteSelectHint(els.study.value, els.siteMasterHint);
    updateAddTaskWorkflowHint();
  });
  els.task?.addEventListener("input", updateAddTaskWorkflowHint);
  els.site.addEventListener("change", updateSiteInfoDisplays);
  els.siteInfoToggleBtn?.addEventListener("click", toggleTaskSiteInfo);
  document.getElementById("editStudy").addEventListener("change", () => {
    populateSiteSelect(document.getElementById("editSite"), document.getElementById("editStudy").value);
    updateEditSiteInfoDisplay();
    updateSiteSelectHint(document.getElementById("editStudy").value, els.editSiteMasterHint);
  });
  bindEvent(document.getElementById("editSite"), "change", updateEditSiteInfoDisplay);
  bindEvent(els.editSiteInfoToggleBtn, "click", toggleEditSiteInfo);
  els.navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      closeSidebar();
      closeMasterSheet();
      switchView(btn.dataset.view);
    });
  });
  document.querySelectorAll("[data-nav-action]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      handleNavAction(btn.dataset.navAction);
    });
  });
  els.sidebarToggleBtn?.addEventListener("click", toggleSidebar);
  els.sidebarBackdrop?.addEventListener("click", closeSidebar);
  els.quickAddBtn?.addEventListener("click", () => handleQuickAddInput(els.quickAddInput));
  els.quickAddInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleQuickAddInput(els.quickAddInput);
    }
  });
  els.dashboardQuickAddBtn?.addEventListener("click", () => handleQuickAddInput(els.dashboardQuickAddInput));
  els.dashboardQuickAddInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleQuickAddInput(els.dashboardQuickAddInput);
    }
  });
  els.closeTaskReadModalBtn?.addEventListener("click", closeTaskReadView);
  els.taskReadCloseBtn?.addEventListener("click", closeTaskReadView);
  els.taskReadModal?.addEventListener("click", (event) => {
    if (event.target === els.taskReadModal) closeTaskReadView();
  });
  els.taskReadEditBtn?.addEventListener("click", () => {
    const taskId = els.taskReadModal?.dataset.taskId;
    closeTaskReadView();
    if (taskId) {
      switchView("tasks");
      openTaskDetail(taskId);
    }
  });
  els.mobileFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => handleMobileFilterClick(btn.dataset.mobileFilter));
  });
  els.masterSheet?.addEventListener("click", (event) => {
    if (event.target === els.masterSheet) closeMasterSheet();
  });
  document.querySelectorAll("[data-master-back]").forEach((btn) => {
    btn.addEventListener("click", () => closeMasterMobileDetail(btn.dataset.masterBack));
  });
  document.querySelectorAll("[data-master-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openMasterMobileEdit(btn.dataset.masterEdit));
  });
  els.taskViewCardBtn?.addEventListener("click", () => setTaskViewMode("card"));
  els.taskViewListBtn?.addEventListener("click", () => setTaskViewMode("list"));
  els.calendarPrevMonthBtn?.addEventListener("click", () => {
    calendarMonthOffset -= 1;
    renderCalendarView();
  });
  els.calendarNextMonthBtn?.addEventListener("click", () => {
    calendarMonthOffset += 1;
    renderCalendarView();
  });
  els.calendarTodayBtn?.addEventListener("click", () => {
    calendarMonthOffset = 0;
    renderCalendarView();
  });
  els.fabToggleBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    openAddTaskModal();
  });
  els.taskQuickFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => handleQuickFilterClick(btn.dataset.quickFilter));
  });
  els.closeAddTaskModalBtn?.addEventListener("click", closeAddTaskModal);
  els.addTaskModal?.addEventListener("click", (event) => {
    if (event.target === els.addTaskModal) closeAddTaskModal();
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

  bindEvent(document.getElementById("workflowSuggestTaskOnlyBtn"), "click", () => {
    if (!pendingTaskDraft) {
      closeWorkflowSuggestModal();
      return;
    }
    const draft = pendingTaskDraft;
    closeWorkflowSuggestModal();
    persistPendingTaskDraft(draft);
  });
  bindEvent(document.getElementById("workflowSuggestApplyBtn"), "click", () => {
    if (!pendingTaskDraft || !pendingWorkflowMatches.length) return;
    const index = pendingWorkflowApplyIndex || 0;
    const entry = pendingWorkflowMatches[index];
    if (!entry) return;
    const workflow = entry.workflow || entry;
    const ref = entry.ref || getWorkflowRef(workflow);
    closeWorkflowSuggestModal();
    persistTaskDraftWithWorkflow(pendingTaskDraft, workflow, ref);
  });
  bindEvent(document.getElementById("followUpPromptYesBtn"), "click", handleFollowUpPromptYes);
  bindEvent(document.getElementById("followUpPromptNoBtn"), "click", closeFollowUpPromptModal);
  bindEvent(document.getElementById("closeFollowUpPromptBtn"), "click", closeFollowUpPromptModal);
  els.followUpPromptModal?.querySelector(".modal")?.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  bindEvent(els.followUpPromptModal, "click", (e) => {
    if (e.target === els.followUpPromptModal) closeFollowUpPromptModal();
  });
  bindEvent(document.getElementById("workflowDetailSaveBtn"), "click", handleWorkflowDetailSave);
  bindEvent(document.getElementById("closeWorkflowDetailBtn"), "click", closeWorkflowDetailModal);
  bindEvent(document.getElementById("cancelWorkflowDetailBtn"), "click", closeWorkflowDetailModal);
  bindEvent(els.workflowDetailModal, "click", (e) => {
    if (e.target === els.workflowDetailModal) closeWorkflowDetailModal();
  });
  els.workflowDetailModal?.querySelector(".modal")?.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  bindEvent(document.getElementById("closeWorkflowSuggestBtn"), "click", closeWorkflowSuggestModal);
  bindEvent(els.workflowSuggestModal, "click", (e) => {
    if (e.target === els.workflowSuggestModal) closeWorkflowSuggestModal();
  });
  bindEvent(document.getElementById("workflowLearnSaveBtn"), "click", handleWorkflowLearnSave);
  bindEvent(document.getElementById("workflowLearnLaterBtn"), "click", closeWorkflowLearnModal);
  bindEvent(document.getElementById("closeWorkflowLearnBtn"), "click", closeWorkflowLearnModal);
  bindEvent(els.workflowLearnModal, "click", (e) => {
    if (e.target === els.workflowLearnModal) closeWorkflowLearnModal();
  });
  bindEvent(document.getElementById("openSiteMasterFromStudyBtn"), "click", () => switchView("site-master"));
  bindEvent(document.getElementById("openSystemMasterFromStudyBtn"), "click", () => switchView("system-master"));
  bindEvent(document.getElementById("newRoutineMasterBtn"), "click", () => openRoutineModal());
  document.querySelectorAll("[data-routine-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openRoutineModal(null, btn.dataset.routinePreset);
    });
  });
  bindEvent(els.routineForm, "submit", handleRoutineSubmit);
  bindEvent(document.getElementById("closeRoutineModalBtn"), "click", closeRoutineModal);
  bindEvent(document.getElementById("cancelRoutineBtn"), "click", closeRoutineModal);
  els.taskDetailWorkflowLink?.addEventListener("click", () => {
    const protocol = els.taskDetailWorkflowLink.dataset.studyProtocol;
    if (protocol) navigateToStudyWorkflowLibrary(protocol);
  });
  els.taskDetailRoutineLink?.addEventListener("click", () => {
    const protocol = els.taskDetailRoutineLink?.dataset.studyProtocol;
    navigateToStudyRoutineTab(protocol);
  });
  bindEvent(els.routineModal, "click", (e) => {
    if (e.target === els.routineModal) closeRoutineModal();
  });
  bindEvent(document.getElementById("routineScheduleType"), "change", applyRoutineScheduleFieldsVisibility);

  els.newSystemMasterBtn?.addEventListener("click", openNewSystemMasterForm);
  bindEvent(els.newWorkflowMasterBtn, "click", handleNewWorkflowMaster);
  document.querySelectorAll("[data-workflow-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchWorkflowMasterTab(btn.dataset.workflowTab));
  });
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
  els.filterStudy.addEventListener("change", renderTaskList);
  els.filterStatus.addEventListener("change", renderTaskList);
  document.addEventListener("click", (event) => {
    if (
      event.target.closest(
        "[data-status-trigger], #statusPickerPortal, .status-picker-portal, [data-more-trigger], .task-more-menu"
      )
    ) {
      return;
    }
    closeAllStatusDropdowns();
  });
  window.addEventListener("scroll", handleStatusPickerDismiss, true);
  window.addEventListener("resize", handleStatusPickerDismiss);
  els.dashboardFilterCards.forEach((card) => {
    card.addEventListener("click", () => handleDashboardCardFilterClick(card.dataset.dashboardFilter));
  });
  els.todayProgressHero?.addEventListener("click", () => handleDashboardCardFilterClick("today"));
  els.dashboardStartWorkBtn?.addEventListener("click", () => handleDashboardCardFilterClick("today"));
  document.querySelector(".dashboard-hero__metrics")?.addEventListener("click", () => handleDashboardCardFilterClick("today"));
  els.dashboardCalendarBtn?.addEventListener("click", () => switchView("calendar"));
  els.dashboardAddTaskBtn?.addEventListener("click", () => openAddTaskModal());
  els.searchInput.addEventListener("input", renderTaskList);
  els.exportCsvBtn.addEventListener("click", exportTasksToCsv);
  els.importCsvBtn.addEventListener("click", () => els.importCsvInput.click());
  els.importCsvInput.addEventListener("change", handleCsvImport);
  bindEvent(els.editForm, "submit", handleEditTask);
  bindEvent(els.closeTaskDetailBtn, "click", closeTaskDetail);
  bindEvent(els.closeDashboardWorkflowBtn, "click", closeDashboardWorkflowDetail);
  bindEvent(els.dashboardWorkflowEditBtn, "click", () => {
    if (dashboardWorkflowTaskId) navigateToMyTasksEdit(dashboardWorkflowTaskId);
  });
  bindEvent(els.taskDetailBackBtn, "click", closeTaskDetail);
  bindEvent(els.cancelEditBtn, "click", closeTaskDetail);
  bindEvent(els.deleteTaskDetailBtn, "click", () => {
    const id = document.getElementById("editId")?.value;
    if (id) deleteTask(id);
  });
  bindEvent(els.taskChecklistAddBtn, "click", addTaskChecklistItem);
  bindEvent(els.taskChecklistNewInput, "keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTaskChecklistItem();
    }
  });
  bindEvent(els.taskDetailChecklist, "click", handleTaskChecklistClick);
  bindEvent(els.taskDetailChecklist, "change", handleTaskChecklistChange);
  bindEvent(els.openSettingsBtn, "click", () => openSettingsModal());
  bindEvent(els.closeSettingsModalBtn, "click", closeSettingsModal);
  bindEvent(els.settingsBackBtn, "click", () => openSettingsPanel("main"));
  document.querySelectorAll("[data-settings-panel]").forEach((btn) => {
    btn.addEventListener("click", () => openSettingsPanel(btn.dataset.settingsPanel));
  });
  bindEvent(els.calendarSyncToggle, "change", handleCalendarSyncToggleChange);
  bindEvent(els.calendarReconnectBtn, "click", handleCalendarReconnect);
  bindEvent(els.calendarDisconnectBtn, "click", handleCalendarDisconnect);
  bindEvent(els.reminderDueToggle, "change", handleReminderSettingsChange);
  bindEvent(els.reminderOverdueToggle, "change", handleReminderSettingsChange);
  bindEvent(els.uiScaleSelect, "change", handleUiScaleChange);
  bindEvent(els.settingsImportBtn, "click", () => els.importCsvInput?.click());
  bindEvent(els.settingsExportBtn, "click", exportTasksToCsv);
  bindEvent(els.settingsResetCacheBtn, "click", handleResetLocalCache);
  bindEvent(els.settingsModal, "click", (e) => {
    if (e.target === els.settingsModal) closeSettingsModal();
  });
  bindEvent(els.referenceSearchInput, "input", handleReferenceSearchInput);
  bindEvent(els.referenceCloudSyncBtn, "click", handleReferenceCloudSyncClick);
  document.querySelectorAll(".reference-section__more[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  window.addEventListener("storage", handleStorageSync);

  void initDeferredBootstrapServices();

  initAppMode();
  switchView("dashboard");
  MOBILE_BREAKPOINT.addEventListener("change", () => {
    applyAppMode();
    switchView(currentViewName);
    renderAll();
  });
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
    notifyCloudSync("sites");
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

    const legacy = this.sites.find((site) => site.siteNumber === key);
    if (legacy) return legacy;

    for (const study of StudyMasterStore.studies) {
      for (const link of study.siteLinks || []) {
        if (link.siteNumber === key) {
          const site = this.getById(link.siteMasterId);
          if (site) return site;
        }
      }
    }

    return null;
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

    this.create({ standardName: trimmed, aliases: [] });
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

function resolveSiteSelectValue(siteValue, protocolNumber = "") {
  if (!siteValue) return "";
  const entry = resolveSiteMasterEntry(siteValue);
  if (entry) return getSiteOptionValue(entry);

  if (protocolNumber) {
    const sites = getLinkedSitesForProtocol(protocolNumber, siteValue);
    const match = sites.find(
      (site) =>
        site.id === siteValue ||
        site.standardName === siteValue ||
        site.studySiteNumber === siteValue ||
        site.siteNumber === siteValue ||
        SiteMasterStore.resolve(siteValue) === site.standardName
    );
    if (match) return getSiteOptionValue(match);
  }

  return siteValue;
}

function resolveFollowUpTaskSite(task) {
  if (!task) return "";
  if (task.site?.trim()) return task.site.trim();

  const parent =
    task.parentTaskId && tasks.find((item) => item.id === task.parentTaskId);
  if (parent?.site?.trim()) return parent.site.trim();

  const root = getWorkflowRootTask(task);
  if (root?.site?.trim() && root.id !== task.id) return root.site.trim();

  return "";
}

function formatSiteOptionLabel(site) {
  const number = site.studySiteNumber?.trim();
  const name = site.standardName || "Site";
  return number ? `${number} · ${name}` : name;
}

function getStudySiteLinkSiteNumber(study, siteMasterId) {
  if (!study || !siteMasterId) return "";
  const link = (study.siteLinks || []).find((item) => item.siteMasterId === siteMasterId);
  return link?.siteNumber?.trim() || "";
}

function getStudyLinkedSiteCount(study) {
  if (!study) return 0;
  return (study.siteLinks || study.siteIds || []).length;
}

function getTaskStudySiteNumber(task) {
  if (!task?.site?.trim() || !task?.study?.trim()) return "";
  const siteEntry = SiteMasterStore.findByValue(task.site);
  if (!siteEntry) return "";
  const study = StudyMasterStore.getByProtocol(task.study);
  return getStudySiteLinkSiteNumber(study, siteEntry.id);
}

function formatTaskSiteLabel(task) {
  if (!task?.site?.trim()) return "";
  const siteNumber = getTaskStudySiteNumber(task);
  const standardName = getStandardSiteName(task.site);
  if (siteNumber) return `${siteNumber} · ${standardName}`;
  return standardName;
}

function formatCalendarTaskMeta(task) {
  const parts = [];
  if (task.study?.trim()) parts.push(task.study.trim());
  const siteNumber = getTaskStudySiteNumber(task);
  if (siteNumber) {
    parts.push(siteNumber);
  } else if (task.site?.trim()) {
    parts.push(getStandardSiteName(task.site));
  }
  return parts.join(" · ") || "—";
}

function getTaskSiteLabelForCalendar(task) {
  return formatTaskSiteLabel(task) || getStandardSiteName(task.site) || "";
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
  return sites.sort((a, b) => {
    const left = a.studySiteNumber || a.standardName;
    const right = b.studySiteNumber || b.standardName;
    return left.localeCompare(right, "ko");
  });
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
  if (study) {
    if (!StudyMasterStore.getByProtocol(study)) {
      alert("Study Master에 등록된 Study를 선택해 주세요.");
      return false;
    }
  }

  if (!site) return true;

  const siteEntry = resolveSiteMasterEntry(site);
  if (!siteEntry) {
    alert("Site Master에 등록된 Site를 선택해 주세요.");
    return false;
  }

  if (!study) return true;

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
    notifyCloudSync("systems");
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
    notifyCloudSync("studies");
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

  getKnownSponsors() {
    return [...new Set(this.studies.map((study) => study.sponsor?.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "ko")
    );
  },

  getLinkedSiteEntries(studyId) {
    const study = this.getById(studyId);
    if (!study) return [];

    const links = Array.isArray(study.siteLinks) && study.siteLinks.length
      ? study.siteLinks
      : (study.siteIds || []).map((siteMasterId) => ({ siteMasterId, siteNumber: "" }));

    return links
      .map((link) => {
        const site = SiteMasterStore.getById(link.siteMasterId);
        if (!site) return null;
        return { ...site, studySiteNumber: link.siteNumber?.trim() || "" };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const left = a.studySiteNumber || a.standardName;
        const right = b.studySiteNumber || b.standardName;
        return left.localeCompare(right, "ko");
      });
  },

  getSitesForProtocol(protocolNumber) {
    const study = this.getByProtocol(protocolNumber);
    if (!study) return [];
    return this.getLinkedSiteEntries(study.id);
  },

  getLinkedSites(studyId) {
    return this.getLinkedSiteEntries(studyId);
  },

  isSiteLinked(studyOrId, siteMasterId) {
    const study = typeof studyOrId === "string" ? this.getById(studyOrId) : studyOrId;
    if (!study || !siteMasterId) return false;
    if (Array.isArray(study.siteLinks) && study.siteLinks.length) {
      return study.siteLinks.some((link) => link.siteMasterId === siteMasterId);
    }
    return (study.siteIds || []).includes(siteMasterId);
  },

  linkSite(studyId, siteMasterId, siteNumber = "") {
    const study = this.getById(studyId);
    if (!study) return false;

    if (!study.siteLinks) study.siteLinks = [];

    const existing = study.siteLinks.find((link) => link.siteMasterId === siteMasterId);
    if (existing) {
      if (siteNumber.trim()) existing.siteNumber = siteNumber.trim();
      study.updatedAt = new Date().toISOString();
      this.persist();
      return true;
    }

    study.siteLinks.push({
      siteMasterId,
      siteNumber: siteNumber.trim(),
    });
    study.siteIds = [...new Set([...(study.siteIds || []), siteMasterId])];
    study.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  },

  updateSiteLinkNumber(studyId, siteMasterId, siteNumber) {
    const study = this.getById(studyId);
    if (!study) return false;

    const link = (study.siteLinks || []).find((item) => item.siteMasterId === siteMasterId);
    if (!link) return false;

    link.siteNumber = siteNumber.trim();
    study.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  },

  unlinkSite(studyId, siteMasterId) {
    const study = this.getById(studyId);
    if (!study) return false;

    study.siteLinks = (study.siteLinks || []).filter((link) => link.siteMasterId !== siteMasterId);
    study.siteIds = study.siteLinks.map((link) => link.siteMasterId);
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

  getWorkflows(studyId) {
    return this.getAppliedWorkflows(studyId);
  },

  getAppliedWorkflowIds(studyId) {
    const study = this.getById(studyId);
    if (!study) return [];
    return [...(study.appliedWorkflowIds || [])];
  },

  getAppliedWorkflows(studyId) {
    return this.getAppliedWorkflowIds(studyId)
      .map((id) => resolveGeneralWorkflow(id))
      .filter(Boolean)
      .map((workflow) => normalizeWorkflowRecord({ ...workflow, scope: "global" }));
  },

  getWorkflow(studyId, workflowId) {
    const applied = this.getAppliedWorkflowIds(studyId);
    if (!applied.includes(workflowId)) return null;
    return resolveGeneralWorkflow(workflowId);
  },

  applyWorkflow(studyId, workflowId) {
    const study = this.getById(studyId);
    if (!study || !resolveGeneralWorkflow(workflowId)) return false;

    const appliedWorkflowIds = this.getAppliedWorkflowIds(studyId);
    if (appliedWorkflowIds.includes(workflowId)) return true;

    appliedWorkflowIds.push(workflowId);
    this.updateStudy(studyId, { appliedWorkflowIds });
    return true;
  },

  unapplyWorkflow(studyId, workflowId) {
    const study = this.getById(studyId);
    if (!study) return false;

    const appliedWorkflowIds = this.getAppliedWorkflowIds(studyId).filter((id) => id !== workflowId);
    this.updateStudy(studyId, { appliedWorkflowIds });
    return true;
  },

  addWorkflow(studyId, data) {
    const general = upsertGeneralWorkflowFromRecord(data);
    if (!general) return null;
    this.applyWorkflow(studyId, general.id);
    return general;
  },

  updateWorkflow(studyId, workflowId, data) {
    if (!this.getAppliedWorkflowIds(studyId).includes(workflowId)) return null;
    return GlobalWorkflowStore.update(workflowId, data);
  },

  deleteWorkflow(studyId, workflowId) {
    return this.unapplyWorkflow(studyId, workflowId);
  },

  recordWorkflowUsage(studyId, workflowId) {
    if (!this.getAppliedWorkflowIds(studyId).includes(workflowId)) {
      this.applyWorkflow(studyId, workflowId);
    }
    return GlobalWorkflowStore.recordUsage(workflowId);
  },

  getRoutines(studyId) {
    const study = this.getById(studyId);
    if (!study) return [];
    return (study.routines || []).map(normalizeRoutineRecord);
  },

  getRoutine(studyId, routineId) {
    return this.getRoutines(studyId).find((routine) => routine.id === routineId) || null;
  },

  addRoutine(studyId, data) {
    const study = this.getById(studyId);
    if (!study) return null;

    const routine = normalizeRoutineRecord({
      ...data,
      studyId,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    if (!study.routines) study.routines = [];
    study.routines.push(routine);
    study.updatedAt = new Date().toISOString();
    this.persist();
    return routine;
  },

  updateRoutine(studyId, routineId, data) {
    const study = this.getById(studyId);
    if (!study) return null;

    const idx = (study.routines || []).findIndex((routine) => routine.id === routineId);
    if (idx === -1) return null;

    study.routines[idx] = normalizeRoutineRecord({
      ...study.routines[idx],
      ...data,
      id: routineId,
      studyId,
      updatedAt: new Date().toISOString(),
    });
    study.updatedAt = new Date().toISOString();
    this.persist();
    return study.routines[idx];
  },

  deleteRoutine(studyId, routineId) {
    const study = this.getById(studyId);
    if (!study) return false;

    study.routines = (study.routines || []).filter((routine) => routine.id !== routineId);
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
          siteLinks: [],
          systems: [],
        });
        changed = true;
      }

      if (!siteValue) return;

      const siteEntry =
        SiteMasterStore.findByValue(siteValue) ||
        SiteMasterStore.getBySiteNumber(siteValue);

      if (siteEntry) {
        if (!this.isSiteLinked(study, siteEntry.id)) {
          const siteNumber =
            siteValue !== siteEntry.standardName &&
            !siteEntry.aliases.includes(siteValue)
              ? siteValue
              : "";
          this.linkSite(study.id, siteEntry.id, siteNumber);
          changed = true;
        }
        return;
      }

      const standardSiteName = SiteMasterStore.resolve(siteValue);
      const created = SiteMasterStore.create({
        standardName: standardSiteName,
        aliases: [],
      });
      this.linkSite(study.id, created.id, siteValue);
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

function normalizeStudySiteLinkRecord(link) {
  return {
    siteMasterId: String(link?.siteMasterId || link?.id || "").trim(),
    siteNumber: String(link?.siteNumber || "").trim(),
  };
}

function normalizeStudyRecord(study) {
  let siteLinks = Array.isArray(study.siteLinks)
    ? study.siteLinks.map(normalizeStudySiteLinkRecord).filter((link) => link.siteMasterId)
    : [];

  const legacySiteIds = Array.isArray(study.siteIds)
    ? [...new Set(study.siteIds.filter(Boolean))]
    : [];

  if (!siteLinks.length && legacySiteIds.length) {
    siteLinks = legacySiteIds.map((siteMasterId) => ({ siteMasterId, siteNumber: "" }));
  }

  const siteIds = [...new Set(siteLinks.map((link) => link.siteMasterId))];

  const systems = Array.isArray(study.systems)
    ? study.systems.map(normalizeStudySystemLinkRecord)
    : [];

  const taskRules = Array.isArray(study.taskRules)
    ? study.taskRules.map(normalizeStudyTaskRuleRecord)
    : [];

  const workflows = Array.isArray(study.workflows)
    ? study.workflows.map(normalizeWorkflowRecord)
    : [];

  const appliedWorkflowIds = Array.isArray(study.appliedWorkflowIds)
    ? [...new Set(study.appliedWorkflowIds.filter(Boolean))]
    : [];

  const routines = Array.isArray(study.routines)
    ? study.routines.map(normalizeRoutineRecord)
    : [];

  const customTaskNames = Array.isArray(study.customTaskNames)
    ? [...new Set(study.customTaskNames.map((name) => name.trim()).filter(Boolean))]
    : [];

  return {
    id: study.id || generateId(),
    studyName: study.studyName?.trim() || study.protocolNumber?.trim() || "",
    protocolNumber: study.protocolNumber?.trim() || "",
    sponsor: study.sponsor?.trim() || "",
    indication: study.indication?.trim() || study.therapeuticArea?.trim() || "",
    ctmName: study.ctmName?.trim() || study.pmName?.trim() || "",
    notes: study.notes?.trim() || "",
    siteIds,
    siteLinks,
    systems,
    taskRules,
    workflows,
    appliedWorkflowIds,
    routines,
    customTaskNames,
    ...(study.ruleTemplateId ? { ruleTemplateId: study.ruleTemplateId } : {}),
    createdAt: study.createdAt || new Date().toISOString(),
    ...(study.updatedAt ? { updatedAt: study.updatedAt } : {}),
  };
}

function normalizeWorkflowStep(step) {
  const dueOffset = Number.isFinite(Number(step?.dueOffset)) ? Math.max(0, Math.round(Number(step.dueOffset))) : 0;
  return {
    id: step?.id || generateId(),
    taskName: step?.taskName?.trim() || "",
    dueOffset,
    dueUnit: step?.dueUnit === "business" ? "business" : "calendar",
    priority: PRIORITIES.includes(step?.priority) ? step.priority : "Medium",
    defaultStatus: TASK_RULE_DEFAULT_STATUSES.includes(step?.defaultStatus)
      ? step.defaultStatus
      : DEFAULT_STATUS,
  };
}

function computeWorkflowStepCount(workflow) {
  const preCount = Array.isArray(workflow?.preSteps) ? workflow.preSteps.length : 0;
  const postCount = Array.isArray(workflow?.steps) ? workflow.steps.length : 0;
  return 1 + preCount + postCount;
}

function inferWorkflowCategory(name, tags = []) {
  const combined = `${name || ""} ${(tags || []).join(" ")}`.toLowerCase();
  if (/visit|monitoring|\bsiv\b|\bcov\b|\bmv\b|psv|close-out/.test(combined)) return "Visit";
  if (/training|gcp/.test(combined)) return "Training";
  if (/\birb\b|ethics|ec submission/.test(combined)) return "IRB";
  if (/expense|timesheet|admin/.test(combined)) return "Admin";
  return "General";
}

function sortWorkflowStepsByDueOffset(preSteps = [], postSteps = []) {
  return {
    preSteps: [...preSteps].sort((a, b) => (Number(b.dueOffset) || 0) - (Number(a.dueOffset) || 0)),
    steps: [...postSteps].sort((a, b) => (Number(a.dueOffset) || 0) - (Number(b.dueOffset) || 0)),
  };
}

function sortFlowStepsByDueOffset(flowSteps) {
  const rootIndex = flowSteps.findIndex((step) => step.kind === "root");
  if (rootIndex < 0) return flowSteps;
  const pre = flowSteps.slice(0, rootIndex);
  const root = flowSteps[rootIndex];
  const post = flowSteps.slice(rootIndex + 1);
  pre.sort((a, b) => (Number(b.dueOffset) || 0) - (Number(a.dueOffset) || 0));
  post.sort((a, b) => (Number(a.dueOffset) || 0) - (Number(b.dueOffset) || 0));
  return [...pre, root, ...post];
}

function normalizeWorkflowRecord(workflow) {
  const preStepsRaw = Array.isArray(workflow?.preSteps)
    ? workflow.preSteps.map(normalizeWorkflowStep).filter((s) => s.taskName)
    : [];
  const stepsRaw = Array.isArray(workflow?.steps) ? workflow.steps.map(normalizeWorkflowStep).filter((s) => s.taskName) : [];
  const sorted = sortWorkflowStepsByDueOffset(preStepsRaw, stepsRaw);
  const preSteps = sorted.preSteps;
  const steps = sorted.steps;
  const tags = Array.isArray(workflow?.tags)
    ? [...new Set(workflow.tags.map((tag) => String(tag).trim()).filter(Boolean))]
    : [];
  const category = WORKFLOW_CATEGORIES.includes(workflow?.category)
    ? workflow.category
    : inferWorkflowCategory(workflow?.name, tags);
  const trigger = WORKFLOW_TRIGGERS.includes(workflow?.trigger) ? workflow.trigger : "TASK_CREATED";
  const scope = WORKFLOW_SCOPES.includes(workflow?.scope) ? workflow.scope : "study";

  const normalized = {
    id: workflow?.id || generateId(),
    name: workflow?.name?.trim() || "Untitled Workflow",
    scope,
    preSteps,
    steps,
    category,
    tags,
    trigger,
    stepCount: Number.isFinite(Number(workflow?.stepCount))
      ? Math.max(1, Number(workflow.stepCount))
      : computeWorkflowStepCount({ preSteps, steps }),
    rootTaskName: workflow?.rootTaskName?.trim() || "",
    usageCount: Number.isFinite(Number(workflow?.usageCount)) ? Math.max(0, Number(workflow.usageCount)) : 0,
    lastUsedAt: workflow?.lastUsedAt || null,
    source: workflow?.source || "manual",
    createdAt: workflow?.createdAt || new Date().toISOString(),
    ...(workflow?.updatedAt ? { updatedAt: workflow.updatedAt } : {}),
  };

  if (workflow?.studyId) normalized.studyId = workflow.studyId;
  return normalized;
}

function getBuiltInGlobalWorkflowPresets() {
  return WORKFLOW_VISIT_RULES.map((rule) =>
    normalizeWorkflowRecord({
      id: `global-preset-${rule.key}`,
      name: `${rule.label} Follow-up`,
      scope: "global",
      category: "Visit",
      tags: [rule.key, "visit", "preset", ...rule.keywords.map((k) => k.toLowerCase())],
      trigger: "TASK_COMPLETED",
      source: "template",
      steps: rule.templates.map((template) => ({
        taskName: template.task,
        dueOffset: template.daysOffset,
        dueUnit: "calendar",
        priority: getDefaultPriorityForTaskName(template.task),
      })),
    })
  );
}

const GlobalWorkflowStore = {
  workflows: [],

  load() {
    try {
      const raw = localStorage.getItem(GLOBAL_WORKFLOWS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.workflows = Array.isArray(parsed)
          ? parsed.map((w) => normalizeWorkflowRecord({ ...w, scope: "global" }))
          : [];
      } else {
        this.workflows = getBuiltInGlobalWorkflowPresets();
        this.persist();
      }
    } catch {
      this.workflows = getBuiltInGlobalWorkflowPresets();
    }
  },

  persist() {
    localStorage.setItem(GLOBAL_WORKFLOWS_KEY, JSON.stringify(this.workflows));
    notifyCloudSync("globalWorkflows");
  },

  getAll() {
    return [...this.workflows];
  },

  getById(id) {
    return this.workflows.find((workflow) => workflow.id === id) || null;
  },

  add(data) {
    const workflow = normalizeWorkflowRecord({
      ...data,
      scope: "global",
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    this.workflows.push(workflow);
    this.persist();
    return workflow;
  },

  update(id, data) {
    const idx = this.workflows.findIndex((workflow) => workflow.id === id);
    if (idx === -1) return null;
    this.workflows[idx] = normalizeWorkflowRecord({
      ...this.workflows[idx],
      ...data,
      id,
      scope: "global",
      updatedAt: new Date().toISOString(),
    });
    this.persist();
    return this.workflows[idx];
  },

  delete(id) {
    this.workflows = this.workflows.filter((workflow) => workflow.id !== id);
    this.persist();
  },

  recordUsage(id) {
    const workflow = this.getById(id);
    if (!workflow) return null;
    return this.update(id, {
      usageCount: (workflow.usageCount || 0) + 1,
      lastUsedAt: new Date().toISOString(),
    });
  },
};

function getGlobalWorkflowPresets() {
  return GlobalWorkflowStore.getAll();
}

function normalizeWorkflowInstance(instance) {
  return {
    id: instance?.id || generateId(),
    workflowRecordId: instance?.workflowRecordId || "",
    studyId: instance?.studyId || null,
    studyProtocol: instance?.studyProtocol || "",
    rootTaskId: instance?.rootTaskId || "",
    startedAt: instance?.startedAt || new Date().toISOString(),
    completedAt: instance?.completedAt || null,
    status: WORKFLOW_INSTANCE_STATUSES.includes(instance?.status) ? instance.status : "active",
    scope: WORKFLOW_SCOPES.includes(instance?.scope) ? instance.scope : "study",
    version: Number.isFinite(Number(instance?.version)) ? Math.max(1, Number(instance.version)) : 1,
    createdAt: instance?.createdAt || instance?.startedAt || new Date().toISOString(),
    ...(instance?.updatedAt ? { updatedAt: instance.updatedAt } : {}),
  };
}

const WorkflowInstanceStore = {
  instances: [],

  load() {
    try {
      const raw = localStorage.getItem(WORKFLOW_INSTANCES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      this.instances = Array.isArray(parsed) ? parsed.map(normalizeWorkflowInstance) : [];
    } catch {
      this.instances = [];
    }
  },

  persist() {
    localStorage.setItem(WORKFLOW_INSTANCES_KEY, JSON.stringify(this.instances));
    notifyCloudSync("workflowInstances");
  },

  getAll() {
    return [...this.instances];
  },

  getById(id) {
    return this.instances.find((instance) => instance.id === id) || null;
  },

  findByRootAndRecord(rootTaskId, workflowRecordId, status = "active") {
    return (
      this.instances.find(
        (instance) =>
          instance.rootTaskId === rootTaskId &&
          instance.workflowRecordId === workflowRecordId &&
          instance.status === status
      ) || null
    );
  },

  add(data) {
    const instance = normalizeWorkflowInstance({
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    this.instances.push(instance);
    this.persist();
    return instance;
  },

  update(id, data) {
    const idx = this.instances.findIndex((instance) => instance.id === id);
    if (idx === -1) return null;
    this.instances[idx] = normalizeWorkflowInstance({
      ...this.instances[idx],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    });
    this.persist();
    return this.instances[idx];
  },

  markCompleted(id) {
    return this.update(id, {
      status: "completed",
      completedAt: new Date().toISOString(),
    });
  },
};

function findWorkflowRecordById(workflowRecordId, studyProtocol) {
  return findWorkflowByIdAnywhere(workflowRecordId, studyProtocol);
}

function getWorkflowInstanceTasks(instanceId) {
  if (!instanceId) return [];
  return tasks.filter((task) => task.workflowInstanceId === instanceId);
}

function resolveTaskWorkflowInstance(task) {
  if (!task?.workflowInstanceId) return null;
  return WorkflowInstanceStore.getById(task.workflowInstanceId);
}

function getWorkflowRootTaskForInstance(instance) {
  if (!instance?.rootTaskId) return null;
  return tasks.find((task) => task.id === instance.rootTaskId) || null;
}

function createWorkflowInstance(workflowRecord, rootTask, options = {}) {
  const study = rootTask.study ? StudyMasterStore.getByProtocol(rootTask.study) : null;
  return WorkflowInstanceStore.add({
    workflowRecordId: workflowRecord.id,
    studyId: study?.id || options.studyId || null,
    studyProtocol: rootTask.study || "",
    rootTaskId: rootTask.id,
    startedAt: options.startedAt || rootTask.createdAt || new Date().toISOString(),
    completedAt: null,
    status: "active",
    scope: workflowRecord.scope || "study",
    version: workflowRecord.version || 1,
  });
}

function assignTaskToWorkflowInstance(taskId, instance, workflowRecord, stepIndex = null) {
  const task = tasks.find((item) => item.id === taskId);
  const root = getWorkflowRootTaskForInstance(instance);
  const resolvedStep =
    stepIndex ??
    (task && root && workflowRecord ? getWorkflowStepIndexForTask(task, root, workflowRecord) : null);

  TaskStore.update(taskId, {
    workflowInstanceId: instance.id,
    workflowRecordId: workflowRecord.id,
    stepIndex: resolvedStep,
    workflowId: workflowRecord.id,
  });
}

function findTaskForWorkflowStepInInstance(stepName, rootTask, instance) {
  const pool = getWorkflowInstanceTasks(instance.id);
  return findTaskForWorkflowStepName(stepName, rootTask, pool);
}

function getWorkflowRootTaskForRecord(task, workflow) {
  if (!task) return null;
  if (!workflow) return getWorkflowRootTask(task);

  const rootLabel = (workflow.rootTaskName || getWorkflowRootLabel(workflow) || "").trim().toLowerCase();
  if (!rootLabel) return getWorkflowRootTask(task);

  let current = task;
  const visited = new Set();
  while (current) {
    if ((current.task || "").trim().toLowerCase() === rootLabel) return current;
    if (!current.parentTaskId || visited.has(current.parentTaskId)) break;
    visited.add(current.id);
    current = tasks.find((item) => item.id === current.parentTaskId);
  }

  const instance = resolveTaskWorkflowInstance(task);
  if (instance) {
    const root = getWorkflowRootTaskForInstance(instance);
    if (root) return root;
  }

  return getWorkflowRootTask(task);
}

function migrateTasksToWorkflowInstances() {
  repairBrokenWorkflowInstanceLinks();
  migrateTasksWithDirectWorkflowId();
  migrateTasksInheritParentInstance();
  migrateMisassignedLearnedFollowUps();
  migrateInferredWorkflowChains();
}

function repairBrokenWorkflowInstanceLinks() {
  tasks.forEach((task) => {
    if (task.workflowInstanceId && !WorkflowInstanceStore.getById(task.workflowInstanceId)) {
      TaskStore.update(task.id, {
        workflowInstanceId: null,
        workflowRecordId: null,
        stepIndex: null,
      });
    }
  });
}

function migrateTasksWithDirectWorkflowId() {
  const instanceByKey = new Map();

  tasks
    .filter((task) => !task.workflowInstanceId && task.workflowId)
    .forEach((task) => {
      const workflow = findWorkflowByIdAnywhere(task.workflowId, task.study);
      if (!workflow) return;

      const root = getWorkflowRootTaskForRecord(task, workflow);
      if (!root) return;

      const key = `${workflow.id}:${root.id}`;
      let instance = instanceByKey.get(key);
      if (!instance) {
        instance = WorkflowInstanceStore.findByRootAndRecord(root.id, workflow.id);
        if (!instance) {
          instance = createWorkflowInstance(workflow, root, { startedAt: root.createdAt });
        }
        instanceByKey.set(key, instance);
      }

      assignTaskToWorkflowInstance(task.id, instance, workflow);
    });
}

function migrateTasksInheritParentInstance() {
  let changed = true;
  let guard = 0;
  while (changed && guard < tasks.length + 1) {
    changed = false;
    guard += 1;
    tasks.forEach((task) => {
      if (task.workflowInstanceId || !task.parentTaskId) return;

      const parent = tasks.find((item) => item.id === task.parentTaskId);
      if (!parent?.workflowInstanceId) return;

      const instance = WorkflowInstanceStore.getById(parent.workflowInstanceId);
      if (!instance) return;

      const workflow = findWorkflowRecordById(instance.workflowRecordId, task.study || parent.study);
      if (!workflow) return;

      assignTaskToWorkflowInstance(task.id, instance, workflow);
      changed = true;
    });
  }
}

function getAllDescendantTasks(parentId) {
  const descendants = [];
  const queue = getSubtasks(parentId);
  const seen = new Set();

  while (queue.length) {
    const child = queue.shift();
    if (!child || seen.has(child.id)) continue;
    seen.add(child.id);
    descendants.push(child);
    queue.push(...getSubtasks(child.id));
  }

  return descendants;
}

function pickSingleWorkflowMatchForMigration(matches, root, chainTasks) {
  if (!matches.length || !root) return null;

  const childNames = new Set(
    chainTasks.map((task) => (task.task || "").trim().toLowerCase()).filter(Boolean)
  );
  const ranked = matches
    .map((workflow) => {
      const stepNames = [...(workflow.preSteps || []), ...(workflow.steps || [])]
        .map((step) => (step.taskName || "").trim().toLowerCase())
        .filter(Boolean);
      const rootLabel = (workflow.rootTaskName || getWorkflowRootLabel(workflow) || "")
        .trim()
        .toLowerCase();
      let score = 0;
      if (rootLabel && (root.task || "").trim().toLowerCase() === rootLabel) score += 10;
      const overlap = stepNames.filter((name) => childNames.has(name)).length;
      score += overlap * 2;
      return { workflow, score, overlap };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) return null;
  if (ranked.length === 1) return ranked[0].workflow;
  if (ranked[0].score > ranked[1].score) return ranked[0].workflow;
  return null;
}

function findLearnedWorkflowForFollowUp(parentTask, followUpTask) {
  if (!parentTask?.task || !followUpTask?.task) return null;

  const study = StudyMasterStore.getByProtocol(followUpTask.study || parentTask.study);
  if (!study) return null;

  const parentName = parentTask.task.trim().toLowerCase();
  const followUpName = followUpTask.task.trim().toLowerCase();
  const appliedIds = new Set(StudyMasterStore.getAppliedWorkflowIds(study.id));
  const candidates = GlobalWorkflowStore.getAll().filter((workflow) => {
    if (workflow.source !== "learned") return false;
    if (appliedIds.size && !appliedIds.has(workflow.id)) return false;
    const rootLabel = (workflow.rootTaskName || "").trim().toLowerCase();
    if (rootLabel !== parentName) return false;
    return (workflow.steps || []).some(
      (step) => (step.taskName || "").trim().toLowerCase() === followUpName
    );
  });

  return candidates.length === 1 ? candidates[0] : null;
}

function migrateMisassignedLearnedFollowUps() {
  tasks.forEach((task) => {
    if (!task.parentTaskId) return;

    const parent = tasks.find((item) => item.id === task.parentTaskId);
    if (!parent) return;

    const learnedWorkflow = findLearnedWorkflowForFollowUp(parent, task);
    if (!learnedWorkflow) return;

    const instance = task.workflowInstanceId ? WorkflowInstanceStore.getById(task.workflowInstanceId) : null;
    const instanceRoot = instance ? tasks.find((item) => item.id === instance.rootTaskId) : null;
    const parentName = parent.task.trim().toLowerCase();
    const instanceRootName = (instanceRoot?.task || "").trim().toLowerCase();

    if (
      instance &&
      instance.workflowRecordId === learnedWorkflow.id &&
      instance.rootTaskId === parent.id
    ) {
      return;
    }

    if (instance && instanceRootName === parentName && instance.workflowRecordId === learnedWorkflow.id) {
      return;
    }

    let correctInstance = WorkflowInstanceStore.findByRootAndRecord(parent.id, learnedWorkflow.id);
    if (!correctInstance) {
      correctInstance = createWorkflowInstance(learnedWorkflow, parent, { startedAt: parent.createdAt });
    }

    assignTaskToWorkflowInstance(parent.id, correctInstance, learnedWorkflow);
    assignTaskToWorkflowInstance(task.id, correctInstance, learnedWorkflow);
  });
}

function migrateInferredWorkflowChains() {
  const rootIds = new Set();
  tasks.forEach((task) => {
    if (task.workflowInstanceId) return;
    const root = getWorkflowRootTask(task);
    if (root) rootIds.add(root.id);
  });

  rootIds.forEach((rootId) => {
    const root = tasks.find((task) => task.id === rootId);
    if (!root) return;

    const chainTasks = [root, ...getAllDescendantTasks(root.id)];
    if (chainTasks.every((task) => task.workflowInstanceId)) return;

    const matches = findMatchingWorkflows(root.task, root.study);
    const workflow = pickSingleWorkflowMatchForMigration(matches, root, chainTasks);
    if (!workflow) return;

    const instanceRoot = getWorkflowRootTaskForRecord(root, workflow);
    if (!instanceRoot) return;

    let instance = WorkflowInstanceStore.findByRootAndRecord(instanceRoot.id, workflow.id);
    if (!instance) {
      instance = createWorkflowInstance(workflow, instanceRoot, { startedAt: instanceRoot.createdAt });
    }

    chainTasks.forEach((task) => {
      if (!task.workflowInstanceId) {
        assignTaskToWorkflowInstance(task.id, instance, workflow);
      }
    });
  });
}

function resolveWorkflowTaskRef(taskRef) {
  if (!taskRef?.id) return null;
  return tasks.find((task) => task.id === taskRef.id) || null;
}

function legacyTaskRulesToWorkflows(study) {
  const rules = study?.taskRules || [];
  if (!rules.length) return [];

  const byEvent = {};
  rules.forEach((rule) => {
    const key = rule.baseEvent || "mv";
    if (!byEvent[key]) byEvent[key] = [];
    byEvent[key].push(rule);
  });

  return Object.entries(byEvent).map(([baseEvent, eventRules]) => {
    const label = TASK_RULE_BASE_EVENT_LABELS[baseEvent] || baseEvent;
    const steps = eventRules
      .filter((rule) => rule.autoGenerate && rule.taskName)
      .map((rule) => ({
        taskName: rule.taskName,
        dueOffset: rule.dueOffset,
        dueUnit: rule.dueUnit,
        priority: rule.priority,
        defaultStatus: rule.defaultStatus,
      }));
    if (!steps.length) return null;
    return normalizeWorkflowRecord({
      id: `legacy-rules-${study.id}-${baseEvent}`,
      name: `${label} Workflow (Legacy Rules)`,
      scope: "study",
      studyId: study.id,
      category: "Visit",
      tags: [baseEvent, "legacy"],
      trigger: "TASK_COMPLETED",
      source: "legacy-taskRules",
      steps,
    });
  }).filter(Boolean);
}

function normalizeRoutineRecord(routine) {
  const scheduleIn = routine?.schedule && typeof routine.schedule === "object" ? routine.schedule : {};
  const type = ROUTINE_SCHEDULE_TYPES.some((item) => item.key === scheduleIn.type) ? scheduleIn.type : "anchor";
  const offsets = Array.isArray(scheduleIn.offsets)
    ? scheduleIn.offsets.map((n) => Math.max(0, Math.round(Number(n)))).filter((n) => Number.isFinite(n))
    : [14, 7, 3, 0];
  const weekday = Number.isFinite(Number(scheduleIn.weekday)) ? Math.min(6, Math.max(0, Math.round(Number(scheduleIn.weekday)))) : 1;
  const dayOfMonth = Number.isFinite(Number(scheduleIn.dayOfMonth))
    ? Math.min(31, Math.max(1, Math.round(Number(scheduleIn.dayOfMonth))))
    : 1;

  return {
    id: routine?.id || generateId(),
    name: routine?.name?.trim() || "Untitled Routine",
    studyId: routine?.studyId || null,
    taskTemplate: {
      taskName: routine?.taskTemplate?.taskName?.trim() || "",
      priority: PRIORITIES.includes(routine?.taskTemplate?.priority) ? routine.taskTemplate.priority : "Medium",
      memo: typeof routine?.taskTemplate?.memo === "string" ? routine.taskTemplate.memo : "",
    },
    schedule: {
      type,
      anchorDate: scheduleIn.anchorDate || "",
      offsets: offsets.length ? offsets : [14, 7, 3, 0],
      weekday,
      dayOfMonth,
      intervalWeeks: Number.isFinite(Number(scheduleIn.intervalWeeks)) ? Math.max(1, Number(scheduleIn.intervalWeeks)) : 1,
    },
    enabled: routine?.enabled !== false,
    category: routine?.category || "General",
    lastMaterializedAt: routine?.lastMaterializedAt || null,
    createdAt: routine?.createdAt || new Date().toISOString(),
    ...(routine?.updatedAt ? { updatedAt: routine.updatedAt } : {}),
  };
}

const WorkspaceWorkflowStore = {
  workflows: [],

  load() {
    try {
      const raw = localStorage.getItem(WORKSPACE_WORKFLOWS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      this.workflows = Array.isArray(parsed) ? parsed.map(normalizeWorkflowRecord) : [];
    } catch {
      this.workflows = [];
    }
  },

  persist() {
    localStorage.setItem(WORKSPACE_WORKFLOWS_KEY, JSON.stringify(this.workflows));
    notifyCloudSync("workspaceWorkflows");
  },

  getAll() {
    return [...this.workflows];
  },

  getById(id) {
    return this.workflows.find((workflow) => workflow.id === id) || null;
  },

  add(data) {
    const workflow = normalizeWorkflowRecord({
      ...data,
      scope: "workspace",
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    this.workflows.push(workflow);
    this.persist();
    return workflow;
  },

  update(id, data) {
    const idx = this.workflows.findIndex((workflow) => workflow.id === id);
    if (idx === -1) return null;
    this.workflows[idx] = normalizeWorkflowRecord({
      ...this.workflows[idx],
      ...data,
      id,
      scope: "workspace",
      updatedAt: new Date().toISOString(),
    });
    this.persist();
    return this.workflows[idx];
  },

  delete(id) {
    this.workflows = this.workflows.filter((workflow) => workflow.id !== id);
    this.persist();
  },

  recordUsage(id) {
    const workflow = this.getById(id);
    if (!workflow || workflow.scope === "global") return null;
    return this.update(id, {
      usageCount: (workflow.usageCount || 0) + 1,
      lastUsedAt: new Date().toISOString(),
    });
  },
};

const RoutineStore = {
  routines: [],

  load() {
    try {
      const raw = localStorage.getItem(ROUTINE_MASTER_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      this.routines = Array.isArray(parsed) ? parsed.map(normalizeRoutineRecord) : [];
    } catch {
      this.routines = [];
    }
  },

  persist() {
    localStorage.setItem(ROUTINE_MASTER_KEY, JSON.stringify(this.routines));
    notifyCloudSync("routines");
  },

  getAll() {
    return [...this.routines];
  },

  getById(id) {
    return this.routines.find((routine) => routine.id === id) || null;
  },

  add(data) {
    const routine = normalizeRoutineRecord({
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    this.routines.push(routine);
    this.routines.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    this.persist();
    return routine;
  },

  update(id, data) {
    const idx = this.routines.findIndex((routine) => routine.id === id);
    if (idx === -1) return null;
    this.routines[idx] = normalizeRoutineRecord({
      ...this.routines[idx],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    });
    this.routines.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    this.persist();
    return this.routines[idx];
  },

  delete(id) {
    this.routines = this.routines.filter((routine) => routine.id !== id);
    this.persist();
    return true;
  },
};

function workflowContentSignature(workflow) {
  const normalized = normalizeWorkflowRecord(workflow);
  return JSON.stringify({
    name: normalized.name,
    rootTaskName: normalized.rootTaskName,
    preSteps: normalized.preSteps,
    steps: normalized.steps,
  });
}

function upsertGeneralWorkflowFromRecord(source) {
  const signature = workflowContentSignature(source);
  const existing = GlobalWorkflowStore.getAll().find((item) => workflowContentSignature(item) === signature);
  if (existing) return existing;

  const byName = GlobalWorkflowStore.getAll().find(
    (item) => item.name.trim().toLowerCase() === (source.name || "").trim().toLowerCase()
  );
  if (byName && workflowContentSignature(byName) === signature) return byName;

  return GlobalWorkflowStore.add({
    ...source,
    scope: "global",
    id: undefined,
    studyId: undefined,
    source: source.source || "manual",
  });
}

function remapWorkflowRecordId(oldId, newId) {
  if (!oldId || !newId || oldId === newId) return;

  tasks.forEach((task) => {
    if (task.workflowRecordId === oldId || task.workflowId === oldId) {
      TaskStore.update(task.id, {
        workflowRecordId: newId,
        workflowId: newId,
      });
    }
  });

  WorkflowInstanceStore.getAll().forEach((instance) => {
    if (instance.workflowRecordId === oldId) {
      WorkflowInstanceStore.update(instance.id, { workflowRecordId: newId });
    }
  });
}

function migrateMasterDataSSOT() {
  const workflowIdMap = new Map();

  WorkspaceWorkflowStore.getAll().forEach((workflow) => {
    const general = upsertGeneralWorkflowFromRecord(workflow);
    workflowIdMap.set(workflow.id, general.id);
  });

  StudyMasterStore.getAll().forEach((study) => {
    let appliedWorkflowIds = Array.isArray(study.appliedWorkflowIds)
      ? [...new Set(study.appliedWorkflowIds.filter(Boolean))]
      : [];

    (study.workflows || []).forEach((embedded) => {
      const mappedId = workflowIdMap.get(embedded.id);
      let general = mappedId ? GlobalWorkflowStore.getById(mappedId) : GlobalWorkflowStore.getById(embedded.id);
      if (!general) {
        general = upsertGeneralWorkflowFromRecord(embedded);
      }
      workflowIdMap.set(embedded.id, general.id);
      if (!appliedWorkflowIds.includes(general.id)) {
        appliedWorkflowIds.push(general.id);
      }
      remapWorkflowRecordId(embedded.id, general.id);
    });

    appliedWorkflowIds = appliedWorkflowIds.map((id) => workflowIdMap.get(id) || id);
    appliedWorkflowIds = [...new Set(appliedWorkflowIds.filter((id) => GlobalWorkflowStore.getById(id)))];

    StudyMasterStore.updateStudy(study.id, {
      appliedWorkflowIds,
      workflows: [],
    });
  });

  const existingRoutineIds = new Set(RoutineStore.getAll().map((routine) => routine.id));
  StudyMasterStore.getAll().forEach((study) => {
    (study.routines || []).forEach((raw) => {
      const routine = normalizeRoutineRecord({ ...raw, studyId: raw.studyId || study.id });
      if (existingRoutineIds.has(routine.id)) {
        RoutineStore.update(routine.id, routine);
      } else {
        RoutineStore.add(routine);
        existingRoutineIds.add(routine.id);
      }
    });
    if ((study.routines || []).length) {
      StudyMasterStore.updateStudy(study.id, { routines: [] });
    }
  });
}

function getGeneralWorkflowRef(workflowId) {
  return workflowId ? { scope: "global", id: workflowId, studyId: null } : null;
}

function resolveGeneralWorkflow(workflowId) {
  if (!workflowId) return null;
  return GlobalWorkflowStore.getById(workflowId) || null;
}

function upsertSiteMasterFromLegacy(nested) {
  const stdName = getStandardSiteName(nested.standardSiteName || nested.siteNumber || nested.standardName || "");
  let entry =
    (nested.siteMasterId && SiteMasterStore.getById(nested.siteMasterId)) ||
    (nested.siteNumber && SiteMasterStore.getBySiteNumber(nested.siteNumber)) ||
    SiteMasterStore.findExact(stdName);

  const payload = {
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
      if (!study.siteLinks) study.siteLinks = [];
      legacySites.forEach((nested) => {
        const siteMasterId = upsertSiteMasterFromLegacy(nested);
        const siteNumber = nested.siteNumber?.trim() || "";
        if (!study.siteLinks.some((link) => link.siteMasterId === siteMasterId)) {
          study.siteLinks.push({ siteMasterId, siteNumber });
        }
      });
      study.siteIds = study.siteLinks.map((link) => link.siteMasterId);
      delete study.sites;
      studyChanged = true;
    }

    if (!Array.isArray(study.siteLinks)) {
      study.siteLinks = [];
      studyChanged = true;
    }

    if (study.siteLinks.length === 0 && (study.siteIds || []).length > 0) {
      study.siteLinks = (study.siteIds || []).map((siteMasterId) => {
        const site = SiteMasterStore.getById(siteMasterId);
        return {
          siteMasterId,
          siteNumber: site?.siteNumber?.trim() || "",
        };
      });
      studyChanged = true;
    }

    const syncedSiteIds = [...new Set(study.siteLinks.map((link) => link.siteMasterId).filter(Boolean))];
    if (JSON.stringify(syncedSiteIds) !== JSON.stringify(study.siteIds || [])) {
      study.siteIds = syncedSiteIds;
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

    if (!study.workflows) {
      study.workflows = [];
      studyChanged = true;
    } else {
      const normalizedWorkflows = study.workflows.map(normalizeWorkflowRecord);
      if (JSON.stringify(normalizedWorkflows) !== JSON.stringify(study.workflows)) {
        study.workflows = normalizedWorkflows;
        studyChanged = true;
      }
    }

    if (!study.routines) {
      study.routines = [];
      studyChanged = true;
    } else {
      const normalizedRoutines = study.routines.map(normalizeRoutineRecord);
      if (JSON.stringify(normalizedRoutines) !== JSON.stringify(study.routines)) {
        study.routines = normalizedRoutines;
        studyChanged = true;
      }
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
  } else {
    const normalizedStudies = StudyMasterStore.studies.map(normalizeStudyRecord);
    if (JSON.stringify(normalizedStudies) !== JSON.stringify(StudyMasterStore.studies)) {
      StudyMasterStore.studies = normalizedStudies;
      StudyMasterStore.persist();
    }
  }
  if (siteChanged) SiteMasterStore.persist();
}

function isDailyMode() {
  return MOBILE_BREAKPOINT.matches;
}

function getViewTitle(viewName) {
  if (isDailyMode() && viewName === "dashboard") return "Home";
  if (isDailyMode() && viewName === "tasks") return "Today";
  return VIEW_TITLES[viewName] || "CRA Workspace";
}

function initAppMode() {
  applyAppMode();
}

function applyAppMode() {
  const daily = isDailyMode();
  document.body.classList.toggle("app-mode-daily", daily);
  document.body.classList.toggle("app-mode-management", !daily);
  if (els.bottomNav) els.bottomNav.hidden = !daily;
  if (els.sidebarToggleBtn) {
    els.sidebarToggleBtn.hidden = daily;
  }
  if (!daily && currentViewName === "reference") {
    switchView("dashboard");
  }
  if (selectedTaskId) {
    closeTaskDetail();
  }
}

function openMasterSheet() {
  if (els.masterSheet) els.masterSheet.hidden = false;
}

function closeMasterSheet() {
  if (els.masterSheet) els.masterSheet.hidden = true;
}

function getMasterViewPanel(viewName) {
  if (viewName === "study-master") return els.viewStudyMaster;
  if (viewName === "site-master") return els.viewSiteMaster;
  if (viewName === "system-master") return els.viewSystemMaster;
  return null;
}

function setMasterMobileDetail(viewName, isOpen, editMode = false) {
  if (!isDailyMode()) return;
  const panel = getMasterViewPanel(viewName);
  panel?.classList.toggle("master-mobile-detail-open", isOpen);
  panel?.classList.toggle("master-mobile-edit-open", editMode);
  const barId =
    viewName === "study-master"
      ? "studyMasterMobileBar"
      : viewName === "site-master"
        ? "siteMasterMobileBar"
        : "systemMasterMobileBar";
  const bar = document.getElementById(barId);
  if (bar) bar.hidden = !isOpen;
}

function closeMasterMobileDetail(viewName) {
  setMasterMobileDetail(viewName, false, false);
  if (viewName === "study-master") selectedStudyMasterId = null;
  if (viewName === "site-master") selectedSiteMasterId = null;
  if (viewName === "system-master") selectedSystemMasterId = null;
  if (viewName === "study-master") renderStudyMaster();
  if (viewName === "site-master") renderSiteMaster();
  if (viewName === "system-master") renderSystemMaster();
}

function openMasterMobileEdit(viewName) {
  setMasterMobileDetail(viewName, true, true);
}

function syncMasterMobileDetail(viewName) {
  if (!isDailyMode() || currentViewName !== viewName) return;
  const hasSelection =
    (viewName === "study-master" && selectedStudyMasterId) ||
    (viewName === "site-master" && selectedSiteMasterId) ||
    (viewName === "system-master" && selectedSystemMasterId);
  if (hasSelection) setMasterMobileDetail(viewName, true, false);
}

function handleMobileFilterClick(filter) {
  if (!filter) return;
  handleQuickFilterClick(filter);
  updateMobileFilterUi();
  renderMobileTaskActionList();
}

function updateMobileFilterUi() {
  els.mobileFilterBtns.forEach((btn) => {
    const isActive = taskQuickFilter === btn.dataset.mobileFilter;
    btn.classList.toggle("task-filter__btn--active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });
  if (els.mobileFilteredTitle) {
    const label = TASK_QUICK_FILTER_LABELS[taskQuickFilter] || "Task List";
    const dateHint = formatTaskFilterDateHint(taskQuickFilter);
    els.mobileFilteredTitle.textContent = dateHint ? `${dateHint} · ${label}` : label;
  }
}

function renderMobileTaskActionList() {
  if (!els.mobileTaskActionList) return;
  const filtered = getFilteredTasks().sort(compareTasks);
  const expanded = expandFilteredWithHierarchy(filtered);
  const hierarchicalRows = buildHierarchicalRows(expanded);

  if (els.mobileTaskActionCount) {
    els.mobileTaskActionCount.textContent = `${filtered.length}건`;
  }

  if (!hierarchicalRows.length) {
    els.mobileTaskActionList.innerHTML =
      '<p class="task-card-list__empty">표시할 업무가 없습니다. Dashboard Quick Add 또는 + 버튼으로 추가하세요.</p>';
    return;
  }

  els.mobileTaskActionList.innerHTML = hierarchicalRows
    .map((row) => renderTaskCard({ ...row, mobile: true }))
    .join("");
  bindTaskListActions(els.mobileTaskActionList);
}

function isHighPriorityTask(task) {
  return task.priority === "Critical" || task.priority === "High";
}

function compareTasksByPriorityThenDue(a, b) {
  const aPriority = PRIORITY_SORT_ORDER[a.priority] ?? 2;
  const bPriority = PRIORITY_SORT_ORDER[b.priority] ?? 2;
  if (aPriority !== bPriority) return aPriority - bPriority;
  const aDue = a.dueDate ? parseDate(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  const bDue = b.dueDate ? parseDate(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  return aDue - bDue;
}

function getTodayActionTasks() {
  const todayStr = toDateString(getToday());
  return tasks
    .filter((t) => {
      if (isInboxTask(t) || !isActive(t)) return false;
      if (t.dueDate && daysUntilDue(t.dueDate) < 0) return true;
      if (t.dueDate === todayStr) return true;
      if (t.dueDate && daysUntilDue(t.dueDate) === 1) return true;
      if (isHighPriorityTask(t)) return true;
      return false;
    })
    .sort(compareTasksByPriorityThenDue);
}

function isDueNextWeek(dueDateStr) {
  const due = parseDate(dueDateStr);
  const { end } = getWeekRange();
  const nextWeekStart = new Date(end);
  nextWeekStart.setDate(nextWeekStart.getDate() + 1);
  nextWeekStart.setHours(0, 0, 0, 0);
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
  nextWeekEnd.setHours(23, 59, 59, 999);
  return due >= nextWeekStart && due <= nextWeekEnd;
}

function getUpcomingTaskGroups() {
  const groups = {
    tomorrow: [],
    d2: [],
    thisWeek: [],
    nextWeek: [],
  };

  tasks.forEach((t) => {
    if (isInboxTask(t) || !isActive(t) || !t.dueDate) return;
    const diff = daysUntilDue(t.dueDate);
    if (diff <= 0) return;
    if (diff === 1) {
      groups.tomorrow.push(t);
    } else if (diff === 2) {
      groups.d2.push(t);
    } else if (isDueThisWeek(t.dueDate)) {
      groups.thisWeek.push(t);
    } else if (isDueNextWeek(t.dueDate)) {
      groups.nextWeek.push(t);
    }
  });

  Object.keys(groups).forEach((key) => {
    groups[key].sort(compareTasksByPriorityThenDue);
  });
  return groups;
}

function renderMobileDailyHome() {
  if (!isDailyMode()) return;
  updateTaskFilterCounts();
  updateMobileFilterUi();
  renderMobileTaskActionList();
}

function renderReferenceCard(type, id, title, meta, emoji) {
  return `
    <button type="button" class="reference-card" data-ref-type="${escapeAttr(type)}" data-ref-id="${escapeAttr(id)}">
      <span class="reference-card__icon" aria-hidden="true">${emoji}</span>
      <span class="reference-card__body">
        <span class="reference-card__title">${escapeHtml(title)}</span>
        <span class="reference-card__meta">${escapeHtml(meta)}</span>
      </span>
    </button>
  `;
}

function bindReferenceCardClicks(container) {
  container?.querySelectorAll("[data-ref-type]").forEach((btn) => {
    btn.addEventListener("click", () => openReferenceItem(btn.dataset.refType, btn.dataset.refId));
  });
}

function openReferenceItem(type, id) {
  if (type === "study") {
    selectedStudyMasterId = id;
    switchView("study-master");
    selectStudyMaster(id);
    return;
  }
  if (type === "site") {
    selectedSiteMasterId = id;
    switchView("site-master");
    selectSiteMasterEntry(id);
    return;
  }
  if (type === "system") {
    selectedSystemMasterId = id;
    switchView("system-master");
    selectSystemMaster(id);
  }
}

function searchReferenceItems(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results = [];

  StudyMasterStore.getAll().forEach((study) => {
    const haystack = [study.studyName, study.protocolNumber, study.sponsor]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) {
      results.push({
        type: "study",
        id: study.id,
        title: study.studyName || study.protocolNumber,
        meta: study.protocolNumber || "",
        emoji: "📚",
      });
    }
  });

  SiteMasterStore.getAll().forEach((site) => {
    const haystack = [
      site.standardName,
      ...(site.aliases || []),
      site.piName,
      site.crcName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) {
      results.push({
        type: "site",
        id: site.id,
        title: site.standardName || "Site",
        meta: site.piName ? `PI ${site.piName}` : "",
        emoji: "🏥",
      });
    }
  });

  SystemMasterStore.getAll().forEach((system) => {
    const haystack = [system.systemName, system.systemType].filter(Boolean).join(" ").toLowerCase();
    if (haystack.includes(q)) {
      results.push({
        type: "system",
        id: system.id,
        title: system.systemName,
        meta: system.systemType || "",
        emoji: "🖥️",
      });
    }
  });

  return results.slice(0, 24);
}

function handleReferenceSearchInput() {
  const query = els.referenceSearchInput?.value || "";
  const hasQuery = query.trim().length > 0;
  if (els.referenceMainContent) els.referenceMainContent.hidden = hasQuery;
  if (!els.referenceSearchResults) return;

  els.referenceSearchResults.hidden = !hasQuery;
  if (!hasQuery) {
    els.referenceSearchResults.innerHTML = "";
    return;
  }

  const results = searchReferenceItems(query);
  els.referenceSearchResults.innerHTML = results.length
    ? results.map((r) => renderReferenceCard(r.type, r.id, r.title, r.meta, r.emoji)).join("")
    : '<p class="reference-search__empty">검색 결과가 없습니다.</p>';
  bindReferenceCardClicks(els.referenceSearchResults);
}

function updateReferenceCloudSyncLabel() {
  if (!els.referenceCloudSyncLabel) return;
  if (!window.CloudSyncManager) {
    els.referenceCloudSyncLabel.textContent = "Cloud Sync";
    return;
  }
  if (CloudSyncManager.isSignedIn()) {
    const statusText = els.cloudSyncStatus?.textContent || "연동됨";
    const short = statusText.replace(/^클라우드 ·\s*/, "").replace(/동기화 중…/, "동기화").split("@")[0];
    els.referenceCloudSyncLabel.textContent = `Cloud · ${short}`;
  } else {
    els.referenceCloudSyncLabel.textContent = "Cloud Sync";
  }
}

function handleReferenceCloudSyncClick() {
  if (window.CloudSyncManager?.isSignedIn?.()) {
    els.cloudSignOutBtn?.click();
    return;
  }
  els.cloudSignInBtn?.click();
}

function renderReferenceLists() {
  const studies = StudyMasterStore.getAll().slice(0, 5);
  const sites = SiteMasterStore.getAll().slice(0, 5);
  const systems = SystemMasterStore.getAll().slice(0, 5);

  if (els.referenceStudyList) {
    els.referenceStudyList.innerHTML = studies.length
      ? studies
          .map((study) =>
            renderReferenceCard(
              "study",
              study.id,
              study.studyName || study.protocolNumber,
              `${study.protocolNumber || ""} · Site ${getStudyLinkedSiteCount(study)}곳`,
              "📚"
            )
          )
          .join("")
      : '<p class="reference-card-list__empty">등록된 Study가 없습니다.</p>';
    bindReferenceCardClicks(els.referenceStudyList);
  }

  if (els.referenceSiteList) {
    els.referenceSiteList.innerHTML = sites.length
      ? sites
          .map((site) =>
            renderReferenceCard(
              "site",
              site.id,
              site.standardName || "Site",
              site.piName ? `PI ${site.piName}` : "",
              "🏥"
            )
          )
          .join("")
      : '<p class="reference-card-list__empty">등록된 Site가 없습니다.</p>';
    bindReferenceCardClicks(els.referenceSiteList);
  }

  if (els.referenceSystemList) {
    els.referenceSystemList.innerHTML = systems.length
      ? systems
          .map((system) =>
            renderReferenceCard(
              "system",
              system.id,
              system.systemName,
              system.systemType || "",
              "🖥️"
            )
          )
          .join("")
      : '<p class="reference-card-list__empty">등록된 System이 없습니다.</p>';
    bindReferenceCardClicks(els.referenceSystemList);
  }
}

function renderReferenceView() {
  if (!els.viewReference || els.viewReference.hidden) return;
  renderReferenceLists();
  updateReferenceCloudSyncLabel();
  if (els.referenceSearchInput?.value.trim()) {
    handleReferenceSearchInput();
  }
}

function switchView(viewName) {
  if (!isDailyMode() && viewName === "reference") {
    viewName = "dashboard";
  }

  currentViewName = viewName;
  els.viewTasks.hidden = viewName !== "tasks";
  els.viewInbox.hidden = viewName !== "inbox";
  els.viewCalendar.hidden = viewName !== "calendar";
  els.viewDashboard.hidden = viewName !== "dashboard";
  if (els.viewReference) els.viewReference.hidden = viewName !== "reference";
  els.viewStudyMaster.hidden = viewName !== "study-master";
  els.viewSystemMaster.hidden = viewName !== "system-master";
  els.viewSiteMaster.hidden = viewName !== "site-master";
  els.viewWorkflowMaster.hidden = viewName !== "workflow-master";
  if (els.viewRoutineMaster) els.viewRoutineMaster.hidden = viewName !== "routine-master";

  closeSidebar();
  closeMasterSheet();
  if (selectedTaskId) closeTaskDetail();
  if (viewName !== "dashboard") closeDashboardWorkflowDetail();

  if (els.topbarTitle) {
    els.topbarTitle.textContent = getViewTitle(viewName);
  }

  updateNavHighlight(viewName);

  if (viewName === "study-master") {
    renderStudyMaster();
    syncMasterMobileDetail("study-master");
  }
  if (viewName === "system-master") {
    renderSystemMaster();
    syncMasterMobileDetail("system-master");
  }
  if (viewName === "site-master") {
    renderSiteMaster();
    syncMasterMobileDetail("site-master");
  }
  if (viewName === "workflow-master") {
    switchWorkflowMasterTab(selectedWorkflowMasterTab);
  }
  if (viewName === "routine-master") {
    renderRoutineMaster();
  }
  if (viewName === "dashboard") renderDashboard();
  if (viewName === "calendar") renderCalendarView();
  if (viewName === "inbox") renderInboxList();
  if (viewName === "reference") renderReferenceView();
  if (viewName === "tasks") {
    refreshTaskStudySiteSelects();
    if (isDailyMode()) {
      renderMobileDailyHome();
    } else {
      renderTodayWorkspace();
      renderTaskList();
    }
  }
  const showFab = FAB_VIEWS.includes(viewName);
  if (els.fabRoot) els.fabRoot.hidden = !showFab;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateNavHighlight(viewName) {
  document.querySelectorAll(".sidebar__item[data-view]").forEach((btn) => {
    const isActive = btn.dataset.view === viewName;
    btn.classList.toggle("sidebar__item--active", isActive);
    if (isActive) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });

  els.bottomNavBtns?.forEach((btn) => {
    const isActive = btn.dataset.view === viewName;
    btn.classList.toggle("bottom-nav__btn--active", isActive);
    if (isActive) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });

  els.dashboardFilterCards.forEach((card) => {
    const isActive = taskQuickFilter === card.dataset.dashboardFilter;
    card.classList.toggle("stat-card--active", isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });
}

function toggleSidebar() {
  if (!els.sidebar) return;
  if (isDailyMode()) return;
  const isOpen = els.sidebar.classList.toggle("sidebar--open");
  if (els.sidebarBackdrop) els.sidebarBackdrop.hidden = !isOpen;
  els.sidebarToggleBtn?.setAttribute("aria-expanded", String(isOpen));
}

function closeSidebar() {
  if (!els.sidebar) return;
  els.sidebar.classList.remove("sidebar--open");
  if (els.sidebarBackdrop) els.sidebarBackdrop.hidden = true;
  els.sidebarToggleBtn?.setAttribute("aria-expanded", "false");
}

function closeMasterMenuDropdown() {}

function openAddTaskModal(presetOrOptions = null) {
  let preset = null;
  let options = {};

  if (typeof presetOrOptions === "string" && VISIT_TASK_PRESETS[presetOrOptions]) {
    preset = VISIT_TASK_PRESETS[presetOrOptions];
  } else if (presetOrOptions && typeof presetOrOptions === "object") {
    options = presetOrOptions;
  }

  const isFollowUp = Boolean(options.followUp || pendingFollowUpParentTask);
  const defaultTitle = isFollowUp
    ? "후속 Task 추가"
    : isDailyMode() && !preset
      ? "새 업무 등록"
      : preset?.title || "새 업무";
  if (els.addTaskModalTitle) {
    els.addTaskModalTitle.textContent = defaultTitle;
  }
  els.taskForm.reset();
  const priority = preset?.priority || options.priority || "Medium";
  addTaskPresetPriority = priority;
  if (els.addTaskPriority) els.addTaskPriority.value = priority;
  if (preset?.task && els.task) {
    els.task.value = preset.task;
  } else if (options.task && els.task) {
    els.task.value = options.task;
  }
  if (els.dueDate) {
    els.dueDate.value = options.dueDate || toDateString(getToday());
  }
  refreshTaskStudySiteSelects();
  const resolvedSite =
    options.site && options.study
      ? resolveSiteSelectValue(options.site, options.study)
      : options.site || "";
  if (options.study) {
    els.study.value = options.study;
    populateSiteSelect(els.site, options.study, resolvedSite || options.site || "");
  }
  if (resolvedSite) {
    els.site.value = resolvedSite;
  }
  updateSiteInfoDisplays();
  updateSiteSelectHint(els.study.value, els.siteMasterHint);
  updateAddTaskFollowUpContextPanel();
  if (els.addTaskModal) {
    if (isFollowUp) {
      els.addTaskModal.classList.add("modal-overlay--stack");
    } else {
      els.addTaskModal.classList.remove("modal-overlay--stack");
    }
    els.addTaskModal.hidden = false;
    els.addTaskModal.removeAttribute("hidden");
  }
  if (!isFollowUp) {
    updateAddTaskWorkflowHint();
  } else if (els.taskWorkflowMatchHint) {
    els.taskWorkflowMatchHint.hidden = true;
    els.taskWorkflowMatchHint.innerHTML = "";
  }
  requestAnimationFrame(() => els.task?.focus());
}

function closeAddTaskModal() {
  if (!els.addTaskModal) return;
  els.addTaskModal.hidden = true;
  els.addTaskModal.classList.remove("modal-overlay--stack");
  pendingFollowUpParentTask = null;
  if (els.taskWorkflowMatchHint) els.taskWorkflowMatchHint.hidden = true;
  updateAddTaskFollowUpContextPanel();
}

function handleNavAction(action) {
  if (action === "settings") {
    closeSidebar();
    closeMasterSheet();
    openSettingsModal();
    return;
  }
  if (action === "close-master") {
    closeMasterSheet();
  }
}

function handleQuickFilterClick(filter) {
  if (!filter) return;
  taskQuickFilter = filter;
  updateQuickFilterUi();
  updateMobileFilterUi();
  renderTaskList();
  if (isDailyMode()) {
    renderMobileTaskActionList();
  }
  scrollFilteredTasksIntoView();
  showToast(`${TASK_QUICK_FILTER_LABELS[taskQuickFilter]} · ${getFilteredTasks().length}건`);
}

function scrollFilteredTasksIntoView() {
  const anchor = document.querySelector(".tasks-workspace__bar");
  if (!anchor) return;
  requestAnimationFrame(() => {
    anchor.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function handleQuickAddInput(inputEl) {
  if (!inputEl) return;
  const text = inputEl.value.trim();
  if (!text) return;

  const newTask = {
    id: generateId(),
    study: "",
    site: "",
    task: text,
    dueDate: "",
    status: DEFAULT_STATUS,
    priority: "Medium",
    inbox: true,
    createdAt: new Date().toISOString(),
  };

  TaskStore.add(newTask);
  inputEl.value = "";
  renderAll();
  showToast(`Inbox에 캡처 · ${text}`);
  if (currentViewName === "inbox") renderInboxList();
}

function setTaskViewMode(mode, options = {}) {
  taskViewMode = mode === "list" ? "list" : "card";
  if (options.persist !== false) {
    UiSettingsStore.setTaskViewMode(taskViewMode);
  }
  applyTaskViewModeUi();
  renderTaskList();
}

function applyTaskViewModeUi() {
  els.taskViewCardBtn?.classList.toggle("view-toggle__btn--active", taskViewMode === "card");
  els.taskViewListBtn?.classList.toggle("view-toggle__btn--active", taskViewMode === "list");
}

function updateInboxBadge() {
  const count = tasks.filter(isInboxTask).length;
  if (els.inboxNavBadge) {
    els.inboxNavBadge.hidden = count === 0;
    els.inboxNavBadge.textContent = String(count);
  }
  if (els.inboxCount) {
    els.inboxCount.textContent = `${count}건`;
  }
}

function getTaskFilterCounts() {
  const nonInbox = tasks.filter((t) => !isInboxTask(t));
  const todayStr = toDateString(getToday());
  return {
    overdue: nonInbox.filter((t) => isActive(t) && t.dueDate && daysUntilDue(t.dueDate) < 0).length,
    today: nonInbox.filter((t) => isActive(t) && t.dueDate === todayStr).length,
    week: nonInbox.filter((t) => isActive(t) && t.dueDate && isDueThisWeek(t.dueDate)).length,
    workflow: nonInbox.filter((t) => isActive(t) && isWorkflowConnectedTask(t)).length,
    routine: nonInbox.filter((t) => isActive(t) && isRoutineConnectedTask(t)).length,
    d1: nonInbox.filter((t) => isActive(t) && t.dueDate && daysUntilDue(t.dueDate) === 1).length,
    open: nonInbox.filter((t) => t.status === "Open").length,
    "in-progress": nonInbox.filter((t) => t.status === "In Progress").length,
    completed: nonInbox.filter((t) => t.status === "Completed").length,
  };
}

function updateTaskFilterCounts() {
  const counts = getTaskFilterCounts();
  document.querySelectorAll("[data-count-filter]").forEach((el) => {
    const key = el.dataset.countFilter;
    if (counts[key] !== undefined) el.textContent = String(counts[key]);
  });
}

function renderTodayWorkspace() {
  updateTaskFilterCounts();
}

function renderCompactTaskPreview(task) {
  const dueClass = task.dueDate ? getDueDateDisplayClass(task.dueDate, task.status) : "due-date--none";
  const dueText = task.dueDate ? formatDueDisplay(task) : "Due 미정";
  return `
    <button type="button" class="preview-task preview-task--compact" data-edit="${escapeAttr(task.id)}">
      <span class="priority-badge priority-badge--${priorityClass(task.priority)} priority-badge--xs">${escapeHtml(task.priority)}</span>
      <span class="preview-task__title">${escapeHtml(task.task)}</span>
      <span class="preview-task__meta">${escapeHtml(task.study || "—")}</span>
      <span class="preview-task__due ${dueClass}">${escapeHtml(dueText)}</span>
    </button>
  `;
}

function renderScheduleItem(task) {
  return `
    <button type="button" class="schedule-item" data-edit="${escapeAttr(task.id)}">
      <span class="schedule-item__task">${escapeHtml(task.task)}</span>
      <span class="schedule-item__meta">${escapeHtml(task.study || "—")}</span>
    </button>
  `;
}

function bindPreviewTaskClicks(container) {
  container?.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openTaskDetail(btn.dataset.edit));
  });
}

function bindCalendarTaskClicks(container) {
  container?.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      openTaskReadView(btn.dataset.edit);
    });
  });
}

let taskReadViewId = null;

function openTaskReadView(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || !els.taskReadModal) return;

  taskReadViewId = taskId;
  els.taskReadModal.dataset.taskId = taskId;
  if (els.taskReadTitle) els.taskReadTitle.textContent = task.task;
  if (els.taskReadPriority) {
    els.taskReadPriority.textContent = task.priority;
    els.taskReadPriority.className = `task-read-modal__priority task-read-modal__priority--${priorityClass(task.priority)}`;
  }
  if (els.taskReadBody) els.taskReadBody.innerHTML = renderTaskReadContent(task);
  els.taskReadModal.hidden = false;
}

function closeTaskReadView() {
  taskReadViewId = null;
  if (els.taskReadModal) {
    els.taskReadModal.hidden = true;
    delete els.taskReadModal.dataset.taskId;
  }
}

function renderTaskReadContent(task) {
  const siteLabel = task.site?.trim() ? formatTaskSiteLabel(task) || getStandardSiteName(task.site) : "—";
  const dueClass = task.dueDate ? getDueDateDisplayClass(task.dueDate, task.status) : "due-date--none";
  const dueText = task.dueDate ? formatDueDisplay(task) : "Due 미정";
  const workflowLabel = getDashboardWorkflowLabel(task);
  const routineInfo = resolveTaskRoutineDisplay(task);
  const memo = task.memo?.trim() || "";

  const rows = [
    ["Due", `<span class="task-read-field__value task-read-field__value--due ${dueClass}">${escapeHtml(dueText)}</span>`],
    ["Status", escapeHtml(task.status)],
    ["Study", escapeHtml(task.study?.trim() || "—")],
    ["Site", escapeHtml(siteLabel)],
    ["Priority", escapeHtml(task.priority)],
  ];

  if (workflowLabel) {
    rows.push(["Workflow", escapeHtml(workflowLabel)]);
  }
  if (routineInfo?.name) {
    rows.push(["Routine", escapeHtml(routineInfo.name)]);
  }
  if (task.calendarSync?.eventId) {
    rows.push(["Calendar", "Google Calendar 연동됨 📅"]);
  }

  return `
    <dl class="task-read-grid">
      ${rows
        .map(
          ([label, value]) => `
        <div class="task-read-field">
          <dt class="task-read-field__label">${escapeHtml(label)}</dt>
          <dd class="task-read-field__value">${value}</dd>
        </div>
      `
        )
        .join("")}
    </dl>
    ${memo ? `<section class="task-read-memo"><h4 class="task-read-memo__title">Memo</h4><p class="task-read-memo__body">${escapeHtml(memo)}</p></section>` : ""}
  `;
}

function buildInboxStudySelectOptions(selected = "") {
  const studies = StudyMasterStore.getAll().sort((a, b) => a.protocolNumber.localeCompare(b.protocolNumber, "ko"));
  if (!studies.length) return '<option value="">Study 없음</option>';
  return (
    '<option value="">Study 선택</option>' +
    studies
      .map((study) => {
        const value = study.protocolNumber;
        const label =
          study.studyName && study.studyName !== study.protocolNumber
            ? `${study.protocolNumber} · ${study.studyName}`
            : study.protocolNumber;
        return `<option value="${escapeAttr(value)}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
      })
      .join("")
  );
}

function buildInboxSiteSelectOptions(protocolNumber, selected = "") {
  if (!protocolNumber) return '<option value="">Study 먼저 선택</option>';
  const sites = getLinkedSitesForProtocol(protocolNumber, selected);
  if (!sites.length) return '<option value="">연결된 Site 없음</option>';
  return (
    '<option value="">Site 선택 (선택)</option>' +
    sites
      .map((site) => {
        const value = getSiteOptionValue(site);
        return `<option value="${escapeAttr(value)}"${value === selected || site.standardName === selected ? " selected" : ""}>${escapeHtml(formatSiteOptionLabel(site))}</option>`;
      })
      .join("")
  );
}

function renderInboxConfigureCard(task) {
  const studyValue = task.study?.trim() || "";
  const siteValue = task.site?.trim() || "";
  return `
    <article class="inbox-config-card" data-inbox-task="${escapeAttr(task.id)}">
      <p class="inbox-config-card__task">${escapeHtml(task.task)}</p>
      <div class="inbox-config-card__fields">
        <label class="inbox-config-card__field">
          <span class="inbox-config-card__label">Study</span>
          <select class="inbox-config-card__select" data-inbox-study="${escapeAttr(task.id)}">${buildInboxStudySelectOptions(studyValue)}</select>
        </label>
        <label class="inbox-config-card__field">
          <span class="inbox-config-card__label">Site</span>
          <select class="inbox-config-card__select" data-inbox-site="${escapeAttr(task.id)}">${buildInboxSiteSelectOptions(studyValue, siteValue)}</select>
        </label>
        <label class="inbox-config-card__field">
          <span class="inbox-config-card__label">Due</span>
          <input type="date" class="inbox-config-card__input" data-inbox-due="${escapeAttr(task.id)}" value="${escapeAttr(task.dueDate || "")}" />
        </label>
      </div>
      <div class="inbox-config-card__actions">
        <button type="button" class="btn btn--primary btn--sm" data-inbox-save="${escapeAttr(task.id)}">저장</button>
        <button type="button" class="btn btn--ghost btn--sm" data-inbox-delete="${escapeAttr(task.id)}">삭제</button>
      </div>
    </article>
  `;
}

function shouldRemainInInbox(task) {
  return !(task.study?.trim() && task.dueDate?.trim());
}

function saveInboxTaskConfiguration(taskId) {
  const card = document.querySelector(`[data-inbox-task="${taskId}"]`);
  if (!card) return;

  const study = card.querySelector(`[data-inbox-study="${taskId}"]`)?.value.trim() || "";
  const siteRaw = card.querySelector(`[data-inbox-site="${taskId}"]`)?.value.trim() || "";
  const dueDate = card.querySelector(`[data-inbox-due="${taskId}"]`)?.value.trim() || "";
  const site = siteRaw ? getStandardSiteName(siteRaw) : "";

  const payload = {
    study,
    site,
    dueDate,
    inbox: shouldRemainInInbox({ study, site, dueDate }),
  };

  if (!TaskStore.update(taskId, payload)) return;
  renderAll();
  showToast(payload.inbox ? "Inbox · Study와 Due를 입력해 주세요" : "My Tasks로 이동되었습니다");
}

function bindInboxConfigureList(container) {
  container?.querySelectorAll("[data-inbox-study]").forEach((select) => {
    select.addEventListener("change", () => {
      const taskId = select.dataset.inboxStudy;
      const siteSelect = container.querySelector(`[data-inbox-site="${taskId}"]`);
      if (siteSelect) {
        siteSelect.innerHTML = buildInboxSiteSelectOptions(select.value.trim());
      }
    });
  });
  container?.querySelectorAll("[data-inbox-save]").forEach((btn) => {
    btn.addEventListener("click", () => saveInboxTaskConfiguration(btn.dataset.inboxSave));
  });
  container?.querySelectorAll("[data-inbox-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (confirm("이 Inbox 항목을 삭제하시겠습니까?")) deleteTask(btn.dataset.inboxDelete);
    });
  });
}

function getInboxTasks() {
  return tasks.filter(isInboxTask).sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

function renderInboxList() {
  if (!els.inboxTaskList) return;
  updateInboxBadge();
  const inboxTasks = getInboxTasks();

  if (!inboxTasks.length) {
    els.inboxTaskList.innerHTML =
      '<p class="task-card-list__empty">Inbox가 비어 있습니다. Dashboard에서 Quick Add로 업무를 캡처하세요.</p>';
    return;
  }

  els.inboxTaskList.innerHTML = inboxTasks.map((task) => renderInboxConfigureCard(task)).join("");
  bindInboxConfigureList(els.inboxTaskList);
}

function getWeekRangeWithOffset(offset = 0) {
  const { start, end } = getWeekRange();
  if (offset) {
    start.setDate(start.getDate() + offset * 7);
    end.setDate(end.getDate() + offset * 7);
  }
  return { start, end };
}

function getMonthAnchorWithOffset(offset = 0) {
  const today = getToday();
  return new Date(today.getFullYear(), today.getMonth() + offset, 1);
}

function getTasksForDate(dateStr) {
  return tasks.filter((t) => !isInboxTask(t) && t.dueDate === dateStr).sort(compareTasks);
}

function formatStudyListMeta(study) {
  const studyNo = study.protocolNumber?.trim() || "—";
  return `Study No.: ${studyNo}  Site total: ${getStudyLinkedSiteCount(study)}`;
}

function getCalendarMonthVisibleTaskLimit() {
  return window.matchMedia("(min-width: 900px)").matches ? 6 : 4;
}

function renderCalendarMonthTaskChip(task) {
  const synced = task.calendarSync?.eventId ? " calendar-month-task--synced" : "";
  const urgency = task.dueDate ? getDueUrgency(task.dueDate, task.status) : "normal";
  const urgencyClass =
    urgency === "overdue" ? " calendar-month-task--overdue" : urgency === "urgent" ? " calendar-month-task--urgent" : "";
  const meta = formatCalendarTaskMeta(task);
  return `
    <button type="button" class="calendar-month-task${synced}${urgencyClass}" data-edit="${escapeAttr(task.id)}" title="${escapeAttr(`${task.task} · ${meta}`)}">
      ${task.calendarSync?.eventId ? '<span class="calendar-month-task__sync" aria-hidden="true">📅</span>' : ""}
      <span class="calendar-month-task__name">${escapeHtml(task.task)}</span>
      ${task.study ? `<span class="calendar-month-task__study">${escapeHtml(task.study)}</span>` : ""}
      ${getTaskStudySiteNumber(task) ? `<span class="calendar-month-task__site">${escapeHtml(getTaskStudySiteNumber(task))}</span>` : ""}
    </button>
  `;
}

function renderCalendarMonthView() {
  if (!els.calendarMonthGrid) return;

  const monthAnchor = getMonthAnchorWithOffset(calendarMonthOffset);
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth();
  const todayStr = toDateString(getToday());
  const visibleLimit = getCalendarMonthVisibleTaskLimit();

  if (els.calendarMonthLabel) {
    els.calendarMonthLabel.textContent = `${year}년 ${month + 1}월`;
  }

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;
  const gridStart = new Date(year, month, 1 - startOffset);

  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    const dateStr = toDateString(day);
    const inMonth = day.getMonth() === month;
    const dayTasks = getTasksForDate(dateStr);
    const isToday = dateStr === todayStr;
    const visibleTasks = dayTasks.slice(0, visibleLimit);
    const hiddenCount = Math.max(0, dayTasks.length - visibleTasks.length);

    cells.push(`
      <div class="calendar-month-day${inMonth ? "" : " calendar-month-day--outside"}${isToday ? " calendar-month-day--today" : ""}">
        <div class="calendar-month-day__header">
          <span class="calendar-month-day__date">${day.getDate()}</span>
          ${dayTasks.length ? `<span class="calendar-month-day__count">${dayTasks.length}</span>` : ""}
        </div>
        <div class="calendar-month-day__tasks">
          ${visibleTasks.map(renderCalendarMonthTaskChip).join("")}
          ${hiddenCount ? `<button type="button" class="calendar-month-day__more" data-edit="${escapeAttr(visibleTasks[0]?.id || dayTasks[0]?.id || "")}">+${hiddenCount} more</button>` : ""}
        </div>
      </div>
    `);
  }

  els.calendarMonthGrid.innerHTML = cells.join("");
  bindCalendarTaskClicks(els.calendarMonthGrid);
}

function renderCalendarView() {
  renderCalendarMonthView();
}

function bindTaskListActions(container) {
  container?.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      openTaskDetail(btn.dataset.edit);
    });
  });
  container?.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      closeAllTaskMoreMenus();
      deleteTask(btn.dataset.delete);
    });
  });
  container?.querySelectorAll("[data-complete]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      applyTaskStatusChange(btn.dataset.complete, "Completed");
    });
  });
  container?.querySelectorAll("[data-google-calendar]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      closeAllTaskMoreMenus();
      openGoogleCalendarForTask(btn.dataset.googleCalendar);
    });
  });
  bindStatusDropdowns(container);
  bindTaskMoreMenus(container);
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
    `<option value="">${sites.length ? "Site 선택 (선택)" : "연결된 Site 없음"}</option>` +
    sites
      .map((site) => {
        const value = getSiteOptionValue(site);
        const selectedEntry = resolveSiteMasterEntry(selectedValue);
        const isSelected =
          value === selectedValue ||
          (selectedEntry && selectedEntry.id === site.id) ||
          SiteMasterStore.resolve(selectedValue) === site.standardName ||
          site.studySiteNumber === selectedValue ||
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

function renderSiteInfoContent(container, site, { studySiteNumber = "" } = {}) {
  if (!container) return;
  if (!site) {
    container.innerHTML = "";
    return;
  }

  const fields = [];
  if (studySiteNumber) {
    fields.push(renderSiteInfoField("Site Number", "text", studySiteNumber));
  }
  fields.push(
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
    renderSiteInfoField("Site Notes", "text", site.notes)
  );

  container.innerHTML = fields.join("");

  bindSiteInfoPasswordToggles(container);
}

function updateSiteInfoDisplays() {
  const siteEntry = resolveSiteMasterEntry(els.site.value);
  const study = StudyMasterStore.getByProtocol(els.study.value);
  const studySiteNumber = siteEntry && study ? getStudySiteLinkSiteNumber(study, siteEntry.id) : "";

  if (siteEntry) {
    els.siteInfoToggleBtn.hidden = false;
    renderSiteInfoContent(els.siteInfoContent, siteEntry, { studySiteNumber });
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
  if (selectedStudyMasterId === "new" && tabName !== "general") return;
  selectedStudyMasterTab = tabName;
  applyStudyMasterTabUi();
}

function formatRelativeTime(isoString) {
  if (!isoString) return "사용 기록 없음";
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return "사용 기록 없음";
  const diffMs = Date.now() - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}일 전`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}개월 전`;
  return `${Math.floor(diffMonths / 12)}년 전`;
}

function getWorkflowTaskCount(workflow) {
  if (workflow?.stepCount) return workflow.stepCount;
  return computeWorkflowStepCount(workflow);
}

function formatWorkflowMeta(workflow) {
  return {
    taskCount: getWorkflowTaskCount(workflow),
    usageCount: workflow?.usageCount || 0,
    lastUsedLabel: workflow?.lastUsedAt ? formatRelativeTime(workflow.lastUsedAt) : "사용 기록 없음",
    scopeLabel: WORKFLOW_SCOPE_LABELS[workflow?.scope] || workflow?.scope || "Study",
  };
}

function formatWorkflowStepOffset(step, side = "post") {
  if (!step?.dueOffset) return "";
  const unit = step.dueUnit === "business" ? " business days" : "일";
  const prefix = side === "pre" ? "-" : "+";
  return `(${prefix}${step.dueOffset}${step.dueUnit === "business" ? unit : "일"})`;
}

function getWorkflowRootLabel(workflow) {
  if (workflow?.rootTaskName?.trim()) return workflow.rootTaskName.trim();
  if (workflow.source === "legacy-taskRules") {
    const baseEvent = (workflow.tags || []).find((tag) => ["mv", "siv", "cov"].includes(tag));
    const visitRule = WORKFLOW_VISIT_RULES.find((rule) => rule.key === baseEvent);
    if (visitRule) return visitRule.label;
  }
  if (workflow.scope === "global" || String(workflow.id).startsWith("global-preset-")) {
    const key = String(workflow.id).replace("global-preset-", "");
    const visitRule = WORKFLOW_VISIT_RULES.find((rule) => rule.key === key);
    if (visitRule) return visitRule.label;
  }
  return (workflow.name || "Task")
    .replace(/ Follow-up.*$/i, "")
    .replace(/ Workflow \(Legacy.*$/i, "")
    .trim();
}

function renderWorkflowFlowPreview(workflow, options = {}) {
  const rootLabel = options.rootLabel || getWorkflowRootLabel(workflow);
  const preSteps = Array.isArray(workflow?.preSteps) ? workflow.preSteps : [];
  const steps = Array.isArray(workflow?.steps) ? workflow.steps : [];
  const showOffsets = options.showOffsets !== false;
  const compact = Boolean(options.compact);
  const allSteps = [...preSteps.map((step) => ({ step, side: "pre" })), ...steps.map((step) => ({ step, side: "post" }))];
  const maxSteps = options.maxSteps ?? (compact ? 4 : allSteps.length);
  const visiblePre = compact ? preSteps.slice(0, Math.max(0, maxSteps - Math.min(steps.length, maxSteps))) : preSteps;
  const remainingSlots = compact ? Math.max(0, maxSteps - visiblePre.length) : steps.length;
  const visiblePost = compact ? steps.slice(0, remainingSlots) : steps;
  const hiddenCount = compact ? Math.max(0, allSteps.length - visiblePre.length - visiblePost.length) : 0;

  const renderStep = (step, side) => {
    const offset = showOffsets ? formatWorkflowStepOffset(step, side) : "";
    return `
      <div class="workflow-flow-preview__arrow" aria-hidden="true">↓</div>
      <div class="workflow-flow-preview__step${side === "pre" ? " workflow-flow-preview__step--pre" : ""}">
        <span class="workflow-flow-preview__name">${escapeHtml(step.taskName)}</span>
        ${offset ? `<span class="workflow-flow-preview__meta">${escapeHtml(offset)}</span>` : ""}
      </div>
    `;
  };

  const preHtml = visiblePre.map((step) => renderStep(step, "pre")).join("");
  const postHtml = visiblePost.map((step) => renderStep(step, "post")).join("");
  const moreHtml =
    hiddenCount > 0
      ? `<div class="workflow-flow-preview__more">… +${hiddenCount} more</div>`
      : "";

  return `
    <div class="workflow-flow-preview${compact ? " workflow-flow-preview--compact" : ""}">
      ${preHtml}
      ${preHtml ? `<div class="workflow-flow-preview__arrow" aria-hidden="true">↓</div>` : ""}
      <div class="workflow-flow-preview__step workflow-flow-preview__step--root">
        <span class="workflow-flow-preview__name">${escapeHtml(rootLabel)}</span>
      </div>
      ${postHtml}
      ${moreHtml}
    </div>
  `;
}

function renderWorkflowMetaRow(workflow) {
  const meta = formatWorkflowMeta(workflow);
  return `
    <div class="workflow-meta-row">
      <span class="workflow-meta-row__item">📋 ${meta.taskCount} Tasks</span>
      <span class="workflow-meta-row__sep" aria-hidden="true">·</span>
      <span class="workflow-meta-row__item">🔁 ${meta.usageCount}회 적용</span>
      <span class="workflow-meta-row__sep" aria-hidden="true">·</span>
      <span class="workflow-meta-row__item">🕐 ${escapeHtml(meta.lastUsedLabel)}</span>
    </div>
  `;
}

function getWorkflowRef(workflow) {
  if (workflow.scope === "global" || workflow.scope === "general" || String(workflow.id).startsWith("global-preset-")) {
    return { scope: "global", id: workflow.id, studyId: null };
  }
  if (workflow.scope === "workspace") {
    return { scope: "global", id: workflow.id, studyId: null };
  }
  return getGeneralWorkflowRef(workflow.id);
}

function resolveWorkflowRecord(ref) {
  if (!ref) return null;
  if (ref.scope === "global" || ref.scope === "general" || ref.scope === "workspace") {
    return resolveGeneralWorkflow(ref.id);
  }
  if (ref.scope === "study" && ref.studyId) {
    return StudyMasterStore.getWorkflow(ref.studyId, ref.id);
  }
  return resolveGeneralWorkflow(ref.id);
}

function workflowMatchesTaskName(workflow, taskName) {
  const nameLower = (taskName || "").trim().toLowerCase();
  if (!nameLower) return false;

  const rootLabel = getWorkflowRootLabel(workflow).toLowerCase();
  if (rootLabel && (rootLabel.includes(nameLower) || nameLower.includes(rootLabel))) {
    return true;
  }

  const workflowName = (workflow.name || "").toLowerCase();
  if (workflowName.includes(nameLower) || nameLower.includes(workflowName.replace(/ follow-up.*$/i, ""))) {
    return true;
  }

  if ((workflow.tags || []).some((tag) => nameLower.includes(String(tag).toLowerCase()))) {
    return true;
  }

  return WORKFLOW_VISIT_RULES.some((rule) => {
    const keywordHit = rule.keywords.some((keyword) => nameLower.includes(keyword.toLowerCase()));
    if (!keywordHit) return false;
    return (
      workflowName.includes(rule.key) ||
      workflowName.includes(rule.label.toLowerCase()) ||
      (workflow.tags || []).includes(rule.key)
    );
  });
}

function findAppliedWorkflowMatchForTask(taskName, studyProtocol) {
  const study = studyProtocol ? StudyMasterStore.getByProtocol(studyProtocol) : null;
  if (!study) return null;

  const matches = StudyMasterStore.getAppliedWorkflows(study.id).filter((workflow) =>
    workflowMatchesTaskName(workflow, taskName)
  );
  if (!matches.length) return null;

  const workflow = matches.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0];
  return { workflow, ref: buildWorkflowRefForStudy(workflow, studyProtocol) };
}

function findUnappliedWorkflowSuggestions(taskName, studyProtocol) {
  const seen = new Set();
  const suggestions = [];
  const study = studyProtocol ? StudyMasterStore.getByProtocol(studyProtocol) : null;
  const appliedIds = study ? new Set(StudyMasterStore.getAppliedWorkflowIds(study.id)) : new Set();

  const pushSuggest = (workflow) => {
    if (!workflow?.id || seen.has(workflow.id)) return;
    if (!workflowMatchesTaskName(workflow, taskName)) return;
    if (
      !(workflow.steps || []).length &&
      !(workflow.preSteps || []).length &&
      workflow.source !== "legacy-taskRules"
    ) {
      return;
    }
    if (study && appliedIds.has(workflow.id)) return;
    seen.add(workflow.id);
    suggestions.push({ workflow, ref: getWorkflowRef(workflow) });
  };

  if (study) {
    legacyTaskRulesToWorkflows(study).forEach(pushSuggest);
  }
  GlobalWorkflowStore.getAll().forEach(pushSuggest);

  return suggestions.sort((a, b) => (b.workflow.usageCount || 0) - (a.workflow.usageCount || 0));
}

function buildWorkflowRefForStudy(workflow, studyProtocol) {
  const ref = getWorkflowRef(workflow);
  const study = studyProtocol ? StudyMasterStore.getByProtocol(studyProtocol) : null;
  if (!study) return ref;
  return { ...ref, studyId: study.id };
}

function ensureWorkflowAppliedToStudy(studyProtocol, workflowId) {
  const study = studyProtocol ? StudyMasterStore.getByProtocol(studyProtocol) : null;
  if (!study || !workflowId) return null;
  StudyMasterStore.applyWorkflow(study.id, workflowId);
  return study;
}

function renderWorkflowSuggestTaskPreview(workflow, rootTaskName) {
  const rootLabel = (rootTaskName || getWorkflowRootLabel(workflow)).trim();
  const followUpSteps = (workflow.steps || []).filter((step) => (step.taskName || "").trim());
  const rows = [
    `<li class="workflow-suggest-task-list__item workflow-suggest-task-list__item--root">
      <span class="workflow-suggest-task-list__icon" aria-hidden="true">✓</span>
      <span class="workflow-suggest-task-list__name">${escapeHtml(rootLabel)}</span>
    </li>`,
    ...followUpSteps.map(
      (step) => `
      <li class="workflow-suggest-task-list__item">
        <span class="workflow-suggest-task-list__icon" aria-hidden="true">○</span>
        <span class="workflow-suggest-task-list__name">${escapeHtml(step.taskName.trim())}</span>
        <span class="workflow-suggest-task-list__due">D+${step.dueOffset ?? 0}</span>
      </li>`
    ),
  ];
  const total = 1 + followUpSteps.length;

  return `
    <div class="workflow-suggest-task-list">
      <p class="workflow-suggest-task-list__heading">생성될 업무</p>
      <ul class="workflow-suggest-task-list__items">${rows.join("")}</ul>
      <p class="workflow-suggest-task-list__total">총 ${total}개 Task 생성</p>
    </div>
  `;
}

function persistTaskDraftWithWorkflow(draft, workflow, ref, options = {}) {
  if (draft?.study && workflow?.id) {
    ensureWorkflowAppliedToStudy(draft.study, workflow.id);
  }
  const workflowRef = buildWorkflowRefForStudy(workflow, draft?.study) || ref;
  persistPendingTaskDraft(draft, {
    applyWorkflow: true,
    workflow,
    workflowRef,
    checkLearnContext: options.checkLearnContext,
  });
  if (options.toastMessage) {
    showToast(options.toastMessage);
  }
}

function findMatchingWorkflows(taskName, studyProtocol) {
  const seen = new Set();
  const matches = [];
  const study = studyProtocol ? StudyMasterStore.getByProtocol(studyProtocol) : null;

  const pushMatch = (workflow) => {
    const key = `${workflow.scope}:${workflow.id}`;
    if (seen.has(key)) return;
    if (!workflowMatchesTaskName(workflow, taskName)) return;
    if (!(workflow.steps || []).length && !(workflow.preSteps || []).length && workflow.source !== "legacy-taskRules") return;
    seen.add(key);
    matches.push(workflow);
  };

  if (study) {
    StudyMasterStore.getAppliedWorkflows(study.id).forEach(pushMatch);
    legacyTaskRulesToWorkflows(study).forEach(pushMatch);
  }

  GlobalWorkflowStore.getAll().forEach(pushMatch);

  return matches.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
}

function recordWorkflowUsageByRef(ref) {
  if (!ref?.id) return;
  if (ref.studyId) {
    StudyMasterStore.recordWorkflowUsage(ref.studyId, ref.id);
    return;
  }
  GlobalWorkflowStore.recordUsage(ref.id);
}

function applyWorkflowToRootTask(rootTask, workflow, ref, options = {}) {
  const instance = createWorkflowInstance(workflow, rootTask);
  assignTaskToWorkflowInstance(rootTask.id, instance, workflow);

  let followUps = [];
  if (options.createAllSteps) {
    const baseDate = rootTask.dueDate || toDateString(getToday());
    const stepDefs = buildWorkflowTimelineStepDefs(workflow, rootTask);
    followUps = (workflow.steps || [])
      .filter((step) => step.taskName && !hasExistingFollowUp(rootTask.id, step.taskName))
      .map((step) => {
        const stepIndex = stepDefs.findIndex(
          (def) => (def.taskName || "").trim().toLowerCase() === (step.taskName || "").trim().toLowerCase()
        );
        return {
          id: generateId(),
          study: rootTask.study,
          site: rootTask.site,
          task: step.taskName,
          dueDate: calculateDueDateFromRule(baseDate, step.dueOffset, step.dueUnit),
          status: step.defaultStatus || DEFAULT_STATUS,
          priority: step.priority || rootTask.priority || "Medium",
          parentTaskId: rootTask.id,
          autoGenerated: true,
          workflowInstanceId: instance.id,
          workflowRecordId: workflow.id,
          stepIndex: stepIndex >= 0 ? stepIndex + 1 : null,
          workflowId: workflow.id,
          createdAt: new Date().toISOString(),
        };
      });

    if (followUps.length) {
      TaskStore.addMany(followUps);
    }

    getWorkflowInstanceTasks(instance.id).forEach((child) => {
      if (child.id !== rootTask.id && !child.stepIndex) {
        assignTaskToWorkflowInstance(child.id, instance, workflow);
      }
    });
  }

  if (ref?.studyId) {
    StudyMasterStore.recordWorkflowUsage(ref.studyId, workflow.id);
  } else if (ref?.id) {
    GlobalWorkflowStore.recordUsage(ref.id);
  }

  return followUps;
}

function persistPendingTaskDraft(draft, options = {}) {
  TaskStore.add(draft);
  if (window.CalendarSyncManager && draft.dueDate) {
    CalendarSyncManager.onTaskCreated(draft.id);
  }

  let followUps = [];
  if (options.applyWorkflow) {
    const workflow = options.workflow;
    const ref = options.workflowRef;
    if (workflow) {
      followUps = applyWorkflowToRootTask(draft, workflow, ref);
      followUps.forEach((task) => {
        if (window.CalendarSyncManager && task.dueDate) {
          CalendarSyncManager.onTaskCreated(task.id);
        }
      });
    }
  }

  els.taskForm.reset();
  addTaskPresetPriority = "Medium";
  if (els.addTaskPriority) els.addTaskPriority.value = "Medium";
  refreshTaskStudySiteSelects();
  updateSiteInfoDisplays();
  closeAddTaskModal();
  renderAll();

  if (options.applyWorkflow && followUps.length) {
    showToast(`${followUps.length}개의 후속 Task가 생성되었습니다.`);
  }

  if (options.checkLearnContext !== false && !options.applyWorkflow && shouldOfferWorkflowLearn(draft)) {
    const savedFollowUp = tasks.find((task) => task.id === draft.id) || draft;
    const savedRoot = lastCompletedTaskContext?.id
      ? tasks.find((task) => task.id === lastCompletedTaskContext.id) || lastCompletedTaskContext
      : lastCompletedTaskContext;
    openWorkflowLearnModal({
      rootTask: savedRoot,
      followUpTask: savedFollowUp,
    });
  }

  pendingTaskDraft = null;
  pendingWorkflowMatches = [];
}

function getStudiesUsingWorkflow(workflowId) {
  if (!workflowId) return [];
  return StudyMasterStore.getAll().filter((study) =>
    StudyMasterStore.getAppliedWorkflowIds(study.id).includes(workflowId)
  );
}

function resolveWorkflowEditScope(workflowId, hintStudyId = null) {
  const appliedStudies = getStudiesUsingWorkflow(workflowId);
  if (!appliedStudies.length) {
    return { scopeMode: "general", studyIds: [], appliedStudies: [] };
  }
  let studyIds = appliedStudies.map((s) => s.id);
  if (hintStudyId && studyIds.includes(hintStudyId)) {
    studyIds = [hintStudyId, ...studyIds.filter((id) => id !== hintStudyId)];
  }
  return { scopeMode: "study", studyIds, appliedStudies };
}

function isGeneralLibraryWorkflow(workflow) {
  if (!workflow) return false;
  if (String(workflow.id).startsWith("global-preset-")) return true;
  if (workflow.source === "template") return true;
  return getStudiesUsingWorkflow(workflow.id).length === 0;
}

function buildWorkflowCardRef(workflow, options = {}) {
  const ref = getGeneralWorkflowRef(workflow.id);
  if (!ref) return null;
  if (options.contextStudyId) ref.studyId = options.contextStudyId;
  return ref;
}

function applyWorkflowScopeFromDraft(workflowId, scopeMode, studyIds) {
  const appliedStudies = getStudiesUsingWorkflow(workflowId);
  const targetIds = scopeMode === "study" ? new Set((studyIds || []).filter(Boolean)) : new Set();

  if (scopeMode === "study" && targetIds.size === 0) {
    showToast("Study를 하나 이상 선택해 주세요.");
    return false;
  }

  appliedStudies.forEach((study) => {
    if (!targetIds.has(study.id)) StudyMasterStore.unapplyWorkflow(study.id, workflowId);
  });

  if (scopeMode === "study") {
    studyIds.forEach((studyId) => StudyMasterStore.applyWorkflow(studyId, workflowId));
  }

  return true;
}

function renderWorkflowDetailScopeField(draft) {
  const studies = StudyMasterStore.getAll();
  const scopeMode = draft.scopeMode || "general";
  const selectedStudyIds = new Set(draft.studyIds || []);

  const studyChecks =
    studies.length === 0
      ? '<p class="form-hint">등록된 Study가 없습니다.</p>'
      : studies
          .map((s) => {
            const checked = selectedStudyIds.has(s.id) ? " checked" : "";
            return `
              <label class="workflow-detail-scope__check">
                <input type="checkbox" name="workflowDetailStudy" value="${escapeAttr(s.id)}"${checked} />
                <span>${escapeHtml(s.protocolNumber)} — ${escapeHtml(s.studyName || s.protocolNumber)}</span>
              </label>
            `;
          })
          .join("");

  return `
    <fieldset class="workflow-detail-scope">
      <legend class="workflow-detail-scope__legend">적용 범위</legend>
      <div class="workflow-detail-scope__options">
        <label class="workflow-detail-scope__radio">
          <input type="radio" name="workflowDetailScope" value="general"${scopeMode === "general" ? " checked" : ""} />
          General (Study 미적용)
        </label>
        <label class="workflow-detail-scope__radio">
          <input type="radio" name="workflowDetailScope" value="study"${scopeMode === "study" ? " checked" : ""}${studies.length ? "" : " disabled"} />
          Study에 적용
        </label>
      </div>
      <div class="workflow-detail-scope__studies${scopeMode === "study" ? "" : " workflow-detail-scope__studies--hidden"}" id="workflowDetailStudyWrap">
        <span class="workflow-detail-scope__studies-label">적용할 Study (복수 선택 가능)</span>
        <div class="workflow-detail-scope__checks">${studyChecks}</div>
      </div>
      <p class="form-hint">Study에 적용하면 General 목록에서 사라지고 Workflow → Study에서 관리됩니다.</p>
    </fieldset>
  `;
}

function renderWorkflowLibraryCard(workflow, options = {}) {
  const meta = formatWorkflowMeta(workflow);
  const ref = buildWorkflowCardRef(workflow, options) || getWorkflowRef(workflow);
  const refJson = escapeAttr(JSON.stringify(ref));
  const isGlobal = workflow.scope === "global";
  const isLegacy = workflow.source === "legacy-taskRules";
  const libraryMode = Boolean(options.libraryMode);

  let actions;
  if (libraryMode) {
    actions = `<button type="button" class="btn btn--primary btn--sm" data-apply-workflow="${refJson}">적용</button>`;
  } else {
    actions = `
      <button type="button" class="btn btn--ghost btn--sm" data-edit-workflow="${refJson}">편집</button>
      <button type="button" class="btn btn--ghost btn--sm" data-delete-workflow="${refJson}">삭제</button>
    `;
    if (options.showApply) {
      actions = `<button type="button" class="btn btn--primary btn--sm" data-apply-workflow="${refJson}">적용</button>${actions}`;
    }
  }

  const studyBadge =
    options.studyLabel && !libraryMode
      ? `<span class="workflow-library-card__study">${escapeHtml(options.studyLabel)}</span>`
      : "";
  const scopeLabel = options.contextStudyId ? "Study 적용" : meta.scopeLabel;

  return `
    <article class="workflow-library-card">
      <header class="workflow-library-card__head">
        <h4 class="workflow-library-card__title">${escapeHtml(workflow.name)}</h4>
        <span class="workflow-library-card__scope">${escapeHtml(scopeLabel)}</span>
      </header>
      ${studyBadge}
      ${renderWorkflowFlowPreview(workflow, { compact: true, rootLabel: getWorkflowRootLabel(workflow) })}
      ${renderWorkflowMetaRow(workflow)}
      <footer class="workflow-library-card__actions">${actions}</footer>
    </article>
  `;
}

function renderStudyAppliedWorkflows(study) {
  const container = document.getElementById("studyAppliedWorkflows");
  if (!container) return;

  const applied = StudyMasterStore.getAppliedWorkflows(study.id);
  if (!applied.length) {
    container.innerHTML =
      '<p class="workflow-library-empty">적용된 Workflow가 없습니다. Workflow → Study에서 적용하세요.</p>';
    return;
  }

  container.innerHTML = `
    <p class="form-hint workflow-library-hint">Applied Workflow는 조회 전용입니다. 수정·삭제는 Workflow → Study 또는 General에서 진행하세요.</p>
    <div class="applied-workflow-list">
      ${applied
        .map((workflow) => {
          const stepCount = computeWorkflowStepCount(workflow);
          const updatedLabel = workflow.updatedAt
            ? formatRelativeDateLabel(workflow.updatedAt)
            : workflow.createdAt
              ? formatRelativeDateLabel(workflow.createdAt)
              : "—";
          return `
            <button type="button" class="applied-workflow-item" data-view-applied-workflow="${escapeAttr(workflow.id)}">
              <span class="applied-workflow-item__check" aria-hidden="true">✓</span>
              <span class="applied-workflow-item__body">
                <span class="applied-workflow-item__name">${escapeHtml(workflow.name)}</span>
                <span class="applied-workflow-item__meta">${stepCount} steps · ${escapeHtml(updatedLabel)}</span>
              </span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;

  container.querySelectorAll("[data-view-applied-workflow]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openWorkflowDetailModalReadOnly(getGeneralWorkflowRef(btn.dataset.viewAppliedWorkflow));
    });
  });
}

function formatRelativeDateLabel(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ko-KR");
  } catch {
    return "—";
  }
}

function openWorkflowDetailModalReadOnly(ref) {
  const workflow = resolveWorkflowRecord(ref);
  if (!workflow || !els.workflowDetailBody) {
    showToast("Workflow를 찾을 수 없습니다.");
    return;
  }

  workflowDetailEditRef = null;
  workflowDetailDraft = null;

  const preview = renderWorkflowFlowPreview(workflow, { compact: false, rootLabel: getWorkflowRootLabel(workflow) });
  els.workflowDetailBody.innerHTML = `
    <div class="workflow-detail-readonly">
      <h4 class="workflow-detail-readonly__title">${escapeHtml(workflow.name)}</h4>
      <p class="form-hint">이 화면은 조회 전용입니다. Workflow 수정·삭제는 <strong>Workflow → Study</strong> 또는 <strong>General</strong>에서 진행하세요.</p>
      ${preview}
      <div class="form-actions">
        <button type="button" class="btn btn--primary" id="workflowReadonlyGoGeneralBtn">Workflow → General 이동</button>
        <button type="button" class="btn btn--ghost" id="workflowReadonlyCloseBtn">닫기</button>
      </div>
    </div>
  `;

  document.getElementById("workflowReadonlyGoGeneralBtn")?.addEventListener("click", () => {
    closeWorkflowDetailModal();
    switchView("workflow-master");
    switchWorkflowMasterTab("general");
  });
  document.getElementById("workflowReadonlyCloseBtn")?.addEventListener("click", closeWorkflowDetailModal);

  if (els.workflowDetailSaveBtn) els.workflowDetailSaveBtn.hidden = true;
  if (els.workflowDetailModal) {
    els.workflowDetailModal.hidden = false;
    els.workflowDetailModal.removeAttribute("hidden");
  }
}

function bindWorkflowLibraryCardActions(container, study = null) {
  container?.querySelectorAll("[data-apply-workflow]").forEach((btn) => {
    btn.addEventListener("click", () => {
      try {
        const ref = JSON.parse(btn.dataset.applyWorkflow);
        handleApplyWorkflowFromLibrary(ref, study);
      } catch {
        showToast("Workflow를 적용할 수 없습니다.");
      }
    });
  });

  container?.querySelectorAll("[data-edit-workflow]").forEach((btn) => {
    btn.addEventListener("click", () => {
      try {
        openWorkflowDetailModal(JSON.parse(btn.dataset.editWorkflow));
      } catch {
        showToast("Workflow를 편집할 수 없습니다.");
      }
    });
  });

  container?.querySelectorAll("[data-delete-workflow]").forEach((btn) => {
    btn.addEventListener("click", () => {
      try {
        handleDeleteWorkflowRef(JSON.parse(btn.dataset.deleteWorkflow));
      } catch {
        showToast("Workflow를 삭제할 수 없습니다.");
      }
    });
  });

  container?.querySelectorAll("[data-copy-workflow]").forEach((btn) => {
    btn.addEventListener("click", () => {
      try {
        const ref = JSON.parse(btn.dataset.copyWorkflow);
        const preset = resolveWorkflowRecord(ref);
        if (!preset || !study?.id) return;
        StudyMasterStore.applyWorkflow(study.id, preset.id);
        renderStudyAppliedWorkflows(study);
        showToast("Study에 Workflow를 적용했습니다.");
      } catch {
        showToast("Workflow를 적용할 수 없습니다.");
      }
    });
  });
}

function handleDeleteWorkflowRef(ref) {
  if (!ref?.id || !confirm("이 Workflow를 삭제할까요? 모든 Study 적용이 해제됩니다.")) return;

  GlobalWorkflowStore.delete(ref.id);
  StudyMasterStore.getAll().forEach((study) => {
    if (StudyMasterStore.getAppliedWorkflowIds(study.id).includes(ref.id)) {
      StudyMasterStore.unapplyWorkflow(study.id, ref.id);
    }
  });
  renderWorkflowMaster();
  StudyMasterStore.getAll().forEach((study) => {
    if (selectedStudyMasterId === study.id) renderStudyAppliedWorkflows(study);
  });
  showToast("Workflow가 삭제되었습니다.");
}

function switchWorkflowMasterTab(tab) {
  selectedWorkflowMasterTab = tab === "study" ? "study" : "general";
  document.querySelectorAll("[data-workflow-tab]").forEach((btn) => {
    btn.classList.toggle("workflow-master-tabs__btn--active", btn.dataset.workflowTab === selectedWorkflowMasterTab);
  });
  if (els.newWorkflowMasterBtn) {
    els.newWorkflowMasterBtn.hidden = selectedWorkflowMasterTab === "study";
  }
  renderWorkflowMaster();
}

function renderWorkflowMasterStudyAssignment() {
  const studies = StudyMasterStore.getAll();
  if (!studies.length) {
    return '<p class="workflow-library-empty">Study를 먼저 등록하세요.</p>';
  }

  if (!selectedWorkflowStudyId || !StudyMasterStore.getById(selectedWorkflowStudyId)) {
    selectedWorkflowStudyId = studies[0].id;
  }

  const study = StudyMasterStore.getById(selectedWorkflowStudyId);
  const appliedIds = new Set(StudyMasterStore.getAppliedWorkflowIds(study.id));
  const applied = StudyMasterStore.getAppliedWorkflows(study.id);
  const available = sortWorkflowsForDisplay(GlobalWorkflowStore.getAll()).filter((workflow) => !appliedIds.has(workflow.id));

  return `
    <div class="workflow-study-assign">
      <div class="workflow-study-assign__header">
        <label class="workflow-study-assign__label" for="workflowStudySelect">Study</label>
        <select id="workflowStudySelect" class="workflow-study-assign__select">
          ${studies
            .map(
              (item) =>
                `<option value="${escapeAttr(item.id)}"${item.id === study.id ? " selected" : ""}>${escapeHtml(item.protocolNumber)} — ${escapeHtml(item.studyName || item.protocolNumber)}</option>`
            )
            .join("")}
        </select>
        <button type="button" class="btn btn--primary btn--sm" id="workflowApplyPickerBtn">+ Workflow 적용</button>
      </div>
      <section class="workflow-study-assign__section">
        <h4 class="workflow-library-section__title">Applied Workflow — ${escapeHtml(study.protocolNumber)}</h4>
        ${
          applied.length
            ? `<div class="workflow-library-grid workflow-library-grid--study">${applied
                .map((workflow) =>
                  renderWorkflowLibraryCard(workflow, { libraryMode: false, contextStudyId: study.id })
                )
                .join("")}</div>`
            : '<p class="workflow-library-empty">적용된 Workflow가 없습니다. 아래에서 General Workflow를 적용하세요.</p>'
        }
      </section>
      <div id="workflowApplyPicker" class="workflow-apply-picker" hidden>
        <h4 class="workflow-library-section__title">General Workflow 선택</h4>
        ${
          available.length
            ? `<div class="workflow-apply-picker__list">${available
                .map(
                  (workflow) =>
                    `<button type="button" class="btn btn--ghost btn--sm" data-apply-workflow-id="${escapeAttr(workflow.id)}">${escapeHtml(workflow.name)}</button>`
                )
                .join("")}</div>`
            : '<p class="form-hint">적용 가능한 General Workflow가 없습니다. General 탭에서 Workflow를 추가하세요.</p>'
        }
      </div>
    </div>
  `;
}

function bindWorkflowMasterStudyAssignment() {
  document.getElementById("workflowStudySelect")?.addEventListener("change", (event) => {
    selectedWorkflowStudyId = event.target.value;
    renderWorkflowMaster();
  });

  document.getElementById("workflowApplyPickerBtn")?.addEventListener("click", () => {
    const picker = document.getElementById("workflowApplyPicker");
    if (picker) picker.hidden = !picker.hidden;
  });

  document.querySelectorAll("[data-apply-workflow-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!selectedWorkflowStudyId) return;
      StudyMasterStore.applyWorkflow(selectedWorkflowStudyId, btn.dataset.applyWorkflowId);
      renderWorkflowMaster();
      const study = StudyMasterStore.getById(selectedWorkflowStudyId);
      if (study && selectedStudyMasterId === study.id) renderStudyAppliedWorkflows(study);
      showToast("Workflow를 Study에 적용했습니다.");
    });
  });

  bindWorkflowLibraryCardActions(document.querySelector(".workflow-library-grid--study"));
}

function renderWorkflowMaster() {
  if (!els.workflowMasterPanel) return;

  if (selectedWorkflowMasterTab === "study") {
    els.workflowMasterPanel.innerHTML = renderWorkflowMasterStudyAssignment();
    bindWorkflowMasterStudyAssignment();
    return;
  }

  const items = sortWorkflowsForDisplay(GlobalWorkflowStore.getAll())
    .filter(isGeneralLibraryWorkflow)
    .map((workflow) => ({
    workflow,
    studyLabel: null,
  }));

  if (!items.length) {
    els.workflowMasterPanel.innerHTML =
      '<p class="workflow-library-empty">General Workflow가 없습니다. + Workflow로 추가하세요.</p>';
    return;
  }

  els.workflowMasterPanel.innerHTML = `<div class="workflow-library-grid">${items
    .map(({ workflow, studyLabel }) => renderWorkflowLibraryCard(workflow, { libraryMode: false, studyLabel }))
    .join("")}</div>`;

  bindWorkflowLibraryCardActions(els.workflowMasterPanel);
}

function handleNewWorkflowMaster() {
  if (selectedWorkflowMasterTab !== "general") return;
  const workflow = GlobalWorkflowStore.add({
    name: "New Workflow",
    rootTaskName: "Root Task",
    preSteps: [],
    steps: [],
    source: "manual",
  });
  openWorkflowDetailModal({ scope: "global", id: workflow.id, studyId: null });
}

function canEditWorkflowRef(ref) {
  if (!ref) return false;
  const workflow = resolveWorkflowRecord(ref);
  return Boolean(workflow && workflow.source !== "legacy-taskRules");
}

function renderWorkflowDetailPriorityOptions(selected = "Medium") {
  return PRIORITIES.map(
    (priority) =>
      `<option value="${priority}"${priority === selected ? " selected" : ""}>${priority}</option>`
  ).join("");
}

function workflowRecordToFlowSteps(workflow) {
  const flowSteps = (workflow.preSteps || []).map((step) => ({
    kind: "pre",
    ...normalizeWorkflowStep(step),
  }));
  flowSteps.push({
    kind: "root",
    taskName: workflow.rootTaskName || getWorkflowRootLabel(workflow),
    dueOffset: 0,
    dueUnit: "calendar",
    priority: "Medium",
  });
  (workflow.steps || []).forEach((step) => {
    flowSteps.push({ kind: "post", ...normalizeWorkflowStep(step) });
  });
  return sortFlowStepsByDueOffset(flowSteps);
}

function normalizeFlowStepKinds(flowSteps) {
  const rootIndex = flowSteps.findIndex((step) => step.kind === "root");
  if (rootIndex < 0) return flowSteps;
  return flowSteps.map((step, index) => {
    if (index === rootIndex) return { ...step, kind: "root" };
    return { ...step, kind: index < rootIndex ? "pre" : "post" };
  });
}

function inferStepKindForInsert(flowSteps, afterIndex) {
  const rootIndex = flowSteps.findIndex((step) => step.kind === "root");
  if (rootIndex < 0) return "post";
  return afterIndex < rootIndex ? "pre" : "post";
}

function flowStepsToWorkflowPayload(flowSteps) {
  const preSteps = [];
  const steps = [];
  let rootTaskName = "";

  flowSteps.forEach((step) => {
    const normalized = normalizeWorkflowStep(step);
    if (step.kind === "root") {
      rootTaskName = (step.taskName || "").trim();
      return;
    }
    if (step.kind === "pre") preSteps.push(normalized);
    else steps.push(normalized);
  });

  const sorted = sortWorkflowStepsByDueOffset(preSteps, steps);
  return { preSteps: sorted.preSteps, steps: sorted.steps, rootTaskName };
}

function renderWorkflowDetailStepRow(step, index, total) {
  const isRoot = step.kind === "root";
  const offsetLabel = step.kind === "pre" ? "일 전" : "일 후";
  return `
    <div class="workflow-detail-step${isRoot ? " workflow-detail-step--root" : ""}" data-step-index="${index}">
      <div class="workflow-detail-step__reorder">
        <button type="button" class="workflow-detail-step__move" data-move-up aria-label="위로"${index === 0 ? " disabled" : ""}>↑</button>
        <button type="button" class="workflow-detail-step__move" data-move-down aria-label="아래로"${index === total - 1 ? " disabled" : ""}>↓</button>
      </div>
      ${isRoot ? '<span class="workflow-detail-step__badge">Root</span>' : ""}
      <input type="text" class="workflow-detail-step__name" value="${escapeAttr(step.taskName)}" placeholder="Task 이름" data-field="taskName" />
      ${
        isRoot
          ? ""
          : `<div class="workflow-detail-step__offset-wrap">
        <input type="number" class="workflow-detail-step__offset" value="${step.dueOffset}" min="0" step="1" data-field="dueOffset" />
        <span class="workflow-detail-step__offset-label">${offsetLabel}</span>
      </div>
      <select class="workflow-detail-step__priority" data-field="priority">${renderWorkflowDetailPriorityOptions(step.priority)}</select>`
      }
      <button type="button" class="btn btn--ghost btn--sm workflow-detail-step__remove" data-remove-step aria-label="단계 삭제"${isRoot ? " disabled" : ""}>삭제</button>
      <button type="button" class="btn btn--ghost btn--sm workflow-detail-step__insert" data-insert-after aria-label="아래 단계 추가">+ 아래</button>
    </div>
  `;
}

function syncWorkflowDetailDraftFromDom() {
  if (!workflowDetailDraft || !els.workflowDetailBody) return null;

  const nameInput = document.getElementById("workflowDetailName");
  workflowDetailDraft.name = nameInput?.value.trim() || workflowDetailDraft.name;

  const scopeRadio = els.workflowDetailBody.querySelector('input[name="workflowDetailScope"]:checked');
  workflowDetailDraft.scopeMode = scopeRadio?.value === "study" ? "study" : "general";
  workflowDetailDraft.studyIds = [
    ...els.workflowDetailBody.querySelectorAll('input[name="workflowDetailStudy"]:checked'),
  ].map((input) => input.value);

  workflowDetailDraft.flowSteps = [
    ...els.workflowDetailBody.querySelectorAll(".workflow-detail-step[data-step-index]"),
  ].map((row, index) => {
    const existing = workflowDetailDraft.flowSteps[index] || { kind: "post" };
    const kind = existing.kind || "post";
    if (kind === "root") {
      return {
        kind: "root",
        taskName: row.querySelector('[data-field="taskName"]')?.value.trim() || existing.taskName,
        dueOffset: 0,
        dueUnit: "calendar",
        priority: "Medium",
      };
    }
    return normalizeWorkflowStep({
      kind,
      taskName: row.querySelector('[data-field="taskName"]')?.value || "",
      dueOffset: row.querySelector('[data-field="dueOffset"]')?.value,
      dueUnit: "calendar",
      priority: row.querySelector('[data-field="priority"]')?.value,
    });
  });

  return workflowDetailDraft;
}

function bindWorkflowDetailEditorEvents() {
  if (!els.workflowDetailBody) return;

  els.workflowDetailBody.querySelectorAll('input[name="workflowDetailScope"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const studyWrap = document.getElementById("workflowDetailStudyWrap");
      const isStudy = radio.value === "study";
      studyWrap?.classList.toggle("workflow-detail-scope__studies--hidden", !isStudy);
      studyWrap?.querySelectorAll('input[name="workflowDetailStudy"]').forEach((input) => {
        input.disabled = !isStudy;
      });
    });
  });

  els.workflowDetailBody.querySelector("[data-add-step]")?.addEventListener("click", () => {
    syncWorkflowDetailDraftFromDom();
    workflowDetailDraft.flowSteps.push({
      kind: "post",
      ...normalizeWorkflowStep({ taskName: "", dueOffset: 1, dueUnit: "calendar", priority: "Medium" }),
    });
    renderWorkflowDetailEditor();
  });

  els.workflowDetailBody.querySelectorAll("[data-move-up]").forEach((btn) => {
    btn.addEventListener("click", () => {
      syncWorkflowDetailDraftFromDom();
      const index = Number(btn.closest(".workflow-detail-step")?.dataset.stepIndex);
      if (!Number.isFinite(index) || index <= 0) return;
      const steps = workflowDetailDraft.flowSteps;
      [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
      workflowDetailDraft.flowSteps = normalizeFlowStepKinds(steps);
      renderWorkflowDetailEditor();
    });
  });

  els.workflowDetailBody.querySelectorAll("[data-move-down]").forEach((btn) => {
    btn.addEventListener("click", () => {
      syncWorkflowDetailDraftFromDom();
      const index = Number(btn.closest(".workflow-detail-step")?.dataset.stepIndex);
      const steps = workflowDetailDraft.flowSteps;
      if (!Number.isFinite(index) || index >= steps.length - 1) return;
      [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
      workflowDetailDraft.flowSteps = normalizeFlowStepKinds(steps);
      renderWorkflowDetailEditor();
    });
  });

  els.workflowDetailBody.querySelectorAll("[data-insert-after]").forEach((btn) => {
    btn.addEventListener("click", () => {
      syncWorkflowDetailDraftFromDom();
      const index = Number(btn.closest(".workflow-detail-step")?.dataset.stepIndex);
      if (!Number.isFinite(index)) return;
      const kind = inferStepKindForInsert(workflowDetailDraft.flowSteps, index);
      workflowDetailDraft.flowSteps.splice(index + 1, 0, {
        kind,
        ...normalizeWorkflowStep({ taskName: "", dueOffset: 1, dueUnit: "calendar", priority: "Medium" }),
      });
      workflowDetailDraft.flowSteps = normalizeFlowStepKinds(workflowDetailDraft.flowSteps);
      renderWorkflowDetailEditor();
    });
  });

  els.workflowDetailBody.querySelectorAll("[data-remove-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      syncWorkflowDetailDraftFromDom();
      const row = btn.closest(".workflow-detail-step");
      if (!row) return;
      const index = Number(row.dataset.stepIndex);
      if (!Number.isFinite(index) || workflowDetailDraft.flowSteps[index]?.kind === "root") return;
      workflowDetailDraft.flowSteps.splice(index, 1);
      renderWorkflowDetailEditor();
    });
  });
}

function renderWorkflowDetailEditor() {
  if (!els.workflowDetailBody || !workflowDetailDraft) return;

  const draft = workflowDetailDraft;
  const flowSteps = draft.flowSteps || [];
  const rows = flowSteps
    .map((step, index) => {
      const row = renderWorkflowDetailStepRow(step, index, flowSteps.length);
      return index > 0 ? `<div class="workflow-detail-arrow" aria-hidden="true">↓</div>${row}` : row;
    })
    .join("");

  els.workflowDetailBody.innerHTML = `
    <div class="form-group">
      <label for="workflowDetailName">Workflow 이름</label>
      <input type="text" id="workflowDetailName" class="workflow-detail-form__input" value="${escapeAttr(draft.name)}" />
    </div>
    ${renderWorkflowDetailScopeField(draft)}
    <div class="workflow-detail-flow">
      <div class="workflow-detail-flow__toolbar">
        <span class="workflow-detail-flow__label">전체 Flow</span>
        <button type="button" class="btn btn--ghost btn--sm workflow-detail-add" data-add-step>+ 마지막 단계 추가</button>
      </div>
      ${rows ? `<div class="workflow-detail-steps workflow-detail-steps--unified">${rows}</div>` : ""}
    </div>
    <p class="form-hint">Learning Modal은 빠른 후속 Task 등록용입니다. 순서 변경·중간 삽입·전체 편집은 Workflow Library에서 진행하세요.</p>
  `;

  bindWorkflowDetailEditorEvents();
}

function openWorkflowDetailModal(ref) {
  if (!canEditWorkflowRef(ref)) {
    openWorkflowDetailModalReadOnly(ref);
    return;
  }
  const workflow = resolveWorkflowRecord(ref);
  if (!workflow) {
    showToast("Workflow를 찾을 수 없습니다.");
    return;
  }

  workflowDetailEditRef = ref;
  const scopeInfo = resolveWorkflowEditScope(workflow.id, ref.studyId || selectedWorkflowStudyId);
  workflowDetailDraft = {
    name: workflow.name,
    flowSteps: workflowRecordToFlowSteps(workflow),
    scopeMode: scopeInfo.scopeMode,
    studyIds: scopeInfo.studyIds,
    appliedStudies: scopeInfo.appliedStudies,
  };
  if (els.workflowDetailSaveBtn) els.workflowDetailSaveBtn.hidden = false;
  renderWorkflowDetailEditor();
  if (els.workflowDetailModal) {
    els.workflowDetailModal.hidden = false;
    els.workflowDetailModal.removeAttribute("hidden");
  }
}

function closeWorkflowDetailModal() {
  if (els.workflowDetailModal) els.workflowDetailModal.hidden = true;
  workflowDetailEditRef = null;
  workflowDetailDraft = null;
}

function handleWorkflowDetailSave() {
  if (!workflowDetailEditRef || !workflowDetailDraft) return;
  const draft = syncWorkflowDetailDraftFromDom();
  if (!draft) return;

  if (!draft.name.trim()) {
    showToast("Workflow 이름을 입력해 주세요.");
    return;
  }

  const { preSteps, steps, rootTaskName } = flowStepsToWorkflowPayload(draft.flowSteps || []);
  if (!rootTaskName) {
    showToast("기준 Task(Root) 이름을 입력해 주세요.");
    return;
  }

  const payload = {
    name: draft.name.trim(),
    rootTaskName,
    preSteps: preSteps.filter((step) => step.taskName),
    steps: steps.filter((step) => step.taskName),
    source: "manual",
  };

  const ref = workflowDetailEditRef;
  let saved = null;
  if (ref.scope === "global" || ref.scope === "general" || ref.scope === "workspace" || ref.scope === "study") {
    saved = GlobalWorkflowStore.update(ref.id, payload);
  }

  if (!saved) {
    showToast("Workflow를 저장할 수 없습니다.");
    return;
  }

  if (!applyWorkflowScopeFromDraft(ref.id, draft.scopeMode, draft.studyIds)) return;

  renderWorkflowMaster();
  StudyMasterStore.getAll().forEach((study) => {
    if (selectedStudyMasterId === study.id) renderStudyAppliedWorkflows(study);
  });

  showToast("Workflow가 저장되었습니다.");
  closeWorkflowDetailModal();
  renderAll();
}

function handleApplyWorkflowFromLibrary(ref, study) {
  const workflow = resolveWorkflowRecord(ref);
  if (!workflow) {
    showToast("Workflow를 찾을 수 없습니다.");
    return;
  }

  const rootName = getWorkflowRootLabel(workflow);
  openAddTaskModal({ task: rootName, study: study?.protocolNumber || "" });

  pendingTaskDraft = null;
  pendingWorkflowMatches = [{ workflow, ref: ref.scope === "global" ? ref : getWorkflowRef(workflow) }];
  pendingWorkflowApplyIndex = 0;

  setTimeout(() => {
    const taskInput = document.getElementById("task");
    if (taskInput && !taskInput.value) taskInput.value = rootName;
  }, 0);
}

function openWorkflowSuggestModal(matches, draft) {
  if (!els.workflowSuggestModal || !els.workflowSuggestBody) {
    persistPendingTaskDraft(draft);
    return;
  }

  pendingTaskDraft = draft;
  pendingWorkflowMatches = matches;
  pendingWorkflowApplyIndex = 0;

  const cards = matches
    .map((entry, index) => {
      const workflow = entry.workflow || entry;
      return `
        <div class="workflow-suggest-card${index === 0 ? " workflow-suggest-card--active" : ""}" data-suggest-index="${index}">
          <h4 class="workflow-suggest-card__title">${escapeHtml(workflow.name)}</h4>
          ${renderWorkflowSuggestTaskPreview(workflow, draft.task)}
        </div>
      `;
    })
    .join("");

  els.workflowSuggestBody.innerHTML = cards;
  els.workflowSuggestModal.hidden = false;

  els.workflowSuggestBody.querySelectorAll(".workflow-suggest-card").forEach((card) => {
    card.addEventListener("click", () => {
      pendingWorkflowApplyIndex = Number(card.dataset.suggestIndex) || 0;
      els.workflowSuggestBody.querySelectorAll(".workflow-suggest-card").forEach((item) => {
        item.classList.toggle("workflow-suggest-card--active", item === card);
      });
    });
  });
}

function closeWorkflowSuggestModal() {
  if (els.workflowSuggestModal) els.workflowSuggestModal.hidden = true;
}

function shouldOfferWorkflowLearn(draft) {
  if (!lastCompletedTaskContext || !draft) return false;
  if (!draft.study || draft.study !== lastCompletedTaskContext.study) return false;
  if (draft.task === lastCompletedTaskContext.task) return false;
  const completedAt = new Date(lastCompletedTaskContext.completedAt).getTime();
  if (Number.isNaN(completedAt)) return false;
  return Date.now() - completedAt <= 7 * 24 * 60 * 60 * 1000;
}

function buildFollowUpWorkflowContextHtml(completedTask) {
  if (!completedTask) return "";
  const step = getWorkflowStepPosition(completedTask);
  const workflowInfo = resolveTaskWorkflowDisplay(completedTask);
  const workflowName = step?.name || workflowInfo?.name || null;
  const nextStepNum = step && step.total > 1 ? Math.min(step.current + 1, step.total) : null;

  return `
    <p class="add-task-followup-context__eyebrow">Workflow 후속 Task 추가</p>
    <p class="add-task-followup-context__prev">완료: ${escapeHtml(completedTask.task)}</p>
    ${
      workflowName
        ? `<p class="add-task-followup-context__workflow"><span class="add-task-followup-context__dot" aria-hidden="true">🟣</span> ${escapeHtml(workflowName)}</p>`
        : ""
    }
    ${
      step && step.total > 1
        ? `<p class="add-task-followup-context__step">Step ${step.current} 완료${nextStepNum ? ` → 다음 Step ${nextStepNum} / ${step.total}` : ` / ${step.total}`}</p>`
        : ""
    }
  `;
}

function updateAddTaskFollowUpContextPanel() {
  const isFollowUp = Boolean(pendingFollowUpParentTask);
  if (els.addTaskWorkflowHintDefault) {
    els.addTaskWorkflowHintDefault.hidden = isFollowUp;
  }
  if (!els.addTaskFollowUpContext) return;
  if (!pendingFollowUpParentTask) {
    els.addTaskFollowUpContext.hidden = true;
    els.addTaskFollowUpContext.innerHTML = "";
    return;
  }
  els.addTaskFollowUpContext.hidden = false;
  els.addTaskFollowUpContext.innerHTML = buildFollowUpWorkflowContextHtml(pendingFollowUpParentTask);
}

function openAddTaskModalForFollowUp(completedTask) {
  if (!completedTask) return;
  const followUpSite = resolveFollowUpTaskSite(completedTask);
  pendingFollowUpParentTask = {
    id: completedTask.id,
    study: completedTask.study || "",
    site: followUpSite,
    task: completedTask.task || "",
    dueDate: completedTask.dueDate || "",
    priority: completedTask.priority || "Medium",
    workflowId: completedTask.workflowId || null,
    workflowInstanceId: completedTask.workflowInstanceId || null,
    parentTaskId: completedTask.parentTaskId || null,
  };
  openAddTaskModal({
    study: pendingFollowUpParentTask.study,
    site: pendingFollowUpParentTask.site,
    priority: pendingFollowUpParentTask.priority,
    followUp: true,
  });
}

function resolveFollowUpCompletedTask() {
  if (followUpPromptContext) return followUpPromptContext;
  if (!lastCompletedTaskContext?.id) return null;
  return tasks.find((t) => t.id === lastCompletedTaskContext.id) || lastCompletedTaskContext;
}

function openFollowUpPromptModal(completedTask, workflowCount = 0) {
  if (!els.followUpPromptModal || !completedTask) return;
  if (isWorkflowConnectedTask(completedTask)) return;

  followUpPromptContext = completedTask;
  if (els.followUpPromptSummary) {
    const autoNote =
      workflowCount > 0 ? ` ${workflowCount}개의 후속 Task가 자동 생성되었습니다.` : "";
    els.followUpPromptSummary.textContent = `「${completedTask.task}」 완료.${autoNote} 다음에 이어질 업무가 있으면 등록해 주세요.`;
  }
  els.followUpPromptModal.hidden = false;
}

function closeFollowUpPromptModal() {
  followUpPromptContext = null;
  if (els.followUpPromptModal) els.followUpPromptModal.hidden = true;
}

function isWorkflowConnectedTask(task) {
  if (!task) return false;
  if (task.workflowInstanceId) return true;
  const ctx = resolveWorkflowContext(task);
  return Boolean(ctx.workflow && ctx.instance && ctx.root);
}

function isRoutineConnectedTask(task) {
  if (!task) return false;
  if (task.routineId) return true;
  return Boolean(resolveTaskRoutineDisplay(task)?.routine);
}

function renderTaskWorkflowProgressBlock(task) {
  const step = getWorkflowStepPosition(task);
  if (!step?.workflowName && !step?.name) return "";

  const ctx = resolveWorkflowContext(task);
  let completed = step.current || 0;
  let total = step.total || 0;
  if (ctx.workflow && ctx.root && ctx.instance) {
    const stats = getWorkflowProgressStats(ctx.workflow, ctx.root, ctx.instance);
    completed = stats.completed;
    total = stats.total;
  }
  if (total <= 0) total = 1;
  const pct = Math.min(100, Math.round((completed / total) * 100));
  const name = step.workflowName || step.name;

  return `
    <div class="task-wf-progress">
      <span class="task-wf-progress__label">${escapeHtml(name)}</span>
      <div class="task-wf-progress__track" role="progressbar" aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="${total}" aria-label="${escapeAttr(name)} 진행률">
        <span class="task-wf-progress__fill" style="width:${pct}%"></span>
      </div>
      <span class="task-wf-progress__count">${completed} / ${total}</span>
    </div>
  `;
}

function renderTaskRoutineLabel(task) {
  if (getWorkflowStepPosition(task)) return "";
  const info = resolveTaskRoutineDisplay(task);
  if (!info?.name) return "";
  return `<p class="task-card__routine">🔁 ${escapeHtml(info.name)}</p>`;
}

function renderTaskMoreMenu(task) {
  const calendarSynced = task.calendarSync?.eventId;
  return `
    <div class="task-more-menu" data-more-menu="${escapeAttr(task.id)}">
      <button type="button" class="task-card__action task-card__action--more" data-more-trigger="${escapeAttr(task.id)}" aria-label="더보기" aria-haspopup="menu" aria-expanded="false">⋯</button>
      <div class="task-more-menu__panel" role="menu" hidden>
        <button type="button" class="task-more-menu__item${calendarSynced ? " task-more-menu__item--synced" : ""}" data-google-calendar="${escapeAttr(task.id)}" role="menuitem">📅 Calendar</button>
        <button type="button" class="task-more-menu__item task-more-menu__item--danger" data-delete="${escapeAttr(task.id)}" role="menuitem">삭제</button>
      </div>
    </div>
  `;
}

function closeAllTaskMoreMenus() {
  document.querySelectorAll(".task-more-menu__panel").forEach((panel) => {
    panel.hidden = true;
  });
  document.querySelectorAll("[data-more-trigger]").forEach((btn) => {
    btn.setAttribute("aria-expanded", "false");
  });
}

function bindTaskMoreMenus(container) {
  container?.querySelectorAll("[data-more-trigger]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const menu = btn.closest("[data-more-menu]")?.querySelector(".task-more-menu__panel");
      if (!menu) return;
      const isOpen = !menu.hidden;
      closeAllTaskMoreMenus();
      closeAllStatusDropdowns();
      if (!isOpen) {
        menu.hidden = false;
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}

function createWorkflowStepTask({ workflow, root, instance, stepEntry, anchorTask }) {
  const stepDef = stepEntry.def;
  const stepConfig = stepDef.stepDef;
  const stepIndex = stepEntry.index + 1;
  const taskName = (stepDef.taskName || "").trim();
  if (!taskName) return null;

  const completedAt = anchorTask.completedAt || new Date().toISOString();
  const baseDate = toDateString(new Date(completedAt));
  const offset = stepConfig?.dueOffset ?? 0;
  const dueUnit = stepConfig?.dueUnit || "calendar";

  const newTask = {
    id: generateId(),
    study: root.study,
    site: root.site,
    task: taskName,
    dueDate: calculateDueDateFromRule(baseDate, offset, dueUnit),
    status: stepConfig?.defaultStatus || DEFAULT_STATUS,
    priority: stepConfig?.priority || root.priority || "Medium",
    parentTaskId: root.id,
    autoGenerated: true,
    workflowInstanceId: instance.id,
    workflowRecordId: workflow.id,
    workflowId: workflow.id,
    stepIndex,
    createdAt: new Date().toISOString(),
  };

  TaskStore.add(newTask);
  assignTaskToWorkflowInstance(newTask.id, instance, workflow, stepIndex);
  return newTask;
}

function processWorkflowTaskCompletion(completedTask) {
  const { workflow, root, instance } = resolveWorkflowContext(completedTask);
  if (!workflow || !root || !instance) {
    return { handled: false, created: null, isLastStep: false, workflowName: "", nextTaskName: null };
  }

  const workflowName = workflow.name?.trim() || getWorkflowRootLabel(workflow);
  const adjacent = getAdjacentWorkflowStepInfo(completedTask, workflow, root, instance);
  const progress = getWorkflowProgressStats(workflow, root, instance);

  if (!adjacent.next || progress.completed >= progress.total) {
    WorkflowInstanceStore.markCompleted(instance.id);
    return {
      handled: true,
      created: null,
      isLastStep: true,
      workflowName,
      nextTaskName: null,
    };
  }

  const nextTaskName = (adjacent.next.def.taskName || "").trim();
  let existingNext = adjacent.next.matchedTask;
  let created = null;

  if (!existingNext && nextTaskName) {
    created = createWorkflowStepTask({
      workflow,
      root,
      instance,
      stepEntry: adjacent.next,
      anchorTask: completedTask,
    });
    existingNext = created;
  }

  return {
    handled: true,
    created,
    isLastStep: false,
    workflowName,
    nextTaskName,
    nextTask: existingNext,
  };
}

function finalizeWorkflowTaskCompletion(completedTask, result) {
  if (!completedTask) return;

  closeStatusPickerPortal();
  closeAllStatusDropdowns();
  lastCompletedTaskContext = {
    id: completedTask.id,
    study: completedTask.study,
    site: completedTask.site,
    task: completedTask.task,
    dueDate: completedTask.dueDate,
    priority: completedTask.priority,
    completedAt: completedTask.completedAt || new Date().toISOString(),
  };

  if (!result?.handled) return;

  if (result.created) {
    showToast(
      `${result.workflowName} Workflow 진행 중 — 다음 업무 "${result.nextTaskName}"이(가) 생성되었습니다.`
    );
    return;
  }

  if (result.isLastStep) {
    showToast(`${result.workflowName} Workflow가 완료되었습니다.`);
  }
}

function handleTaskCompletedEffects(taskId) {
  const completedTask = tasks.find((task) => task.id === taskId);
  if (!completedTask) return { calendarCreates: [] };

  if (isWorkflowConnectedTask(completedTask)) {
    const wfResult = processWorkflowTaskCompletion(completedTask);
    finalizeWorkflowTaskCompletion(completedTask, wfResult);
    return {
      calendarCreates: wfResult.created?.id ? [wfResult.created.id] : [],
    };
  }

  const legacyFollowUps = runWorkflowAutomation(completedTask);
  finalizeTaskCompletion(completedTask, legacyFollowUps.length);
  return { calendarCreates: legacyFollowUps.map((task) => task.id).filter(Boolean) };
}

function handleFollowUpPromptYes(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const completedTask = resolveFollowUpCompletedTask();
  if (!completedTask) {
    showToast("완료된 Task 정보를 찾을 수 없습니다.");
    closeFollowUpPromptModal();
    return;
  }
  closeFollowUpPromptModal();
  closeStatusPickerPortal();
  openAddTaskModalForFollowUp(completedTask);
}

function finalizeTaskCompletion(completedTask, workflowCount = 0) {
  if (!completedTask) return;
  if (isWorkflowConnectedTask(completedTask)) return;

  closeStatusPickerPortal();
  closeAllStatusDropdowns();
  lastCompletedTaskContext = {
    id: completedTask.id,
    study: completedTask.study,
    site: completedTask.site,
    task: completedTask.task,
    dueDate: completedTask.dueDate,
    priority: completedTask.priority,
    completedAt: completedTask.completedAt || new Date().toISOString(),
  };

  openFollowUpPromptModal(completedTask, workflowCount);
}

function findWorkflowByIdAnywhere(workflowId, studyProtocol) {
  if (!workflowId) return null;

  const general = resolveGeneralWorkflow(workflowId);
  if (general) return general;

  if (studyProtocol) {
    const study = StudyMasterStore.getByProtocol(studyProtocol);
    if (study && StudyMasterStore.getAppliedWorkflowIds(study.id).includes(workflowId)) {
      return resolveGeneralWorkflow(workflowId);
    }
  }

  return null;
}

function getWorkflowRootTask(task) {
  if (!task) return null;

  let current = task;
  const visited = new Set();
  while (current.parentTaskId && !visited.has(current.parentTaskId)) {
    visited.add(current.id);
    const parent = tasks.find((t) => t.id === current.parentTaskId);
    if (!parent) break;
    current = parent;
  }
  return current;
}

function resolveWorkflowContext(task) {
  const instance = resolveTaskWorkflowInstance(task);
  if (!instance) return { instance: null, workflow: null, root: null };

  const workflow = findWorkflowRecordById(instance.workflowRecordId, instance.studyProtocol || task?.study);
  const root = getWorkflowRootTaskForInstance(instance);
  if (!workflow || !root) return { instance: null, workflow: null, root: null };
  return { instance, workflow, root };
}

function resolveTaskWorkflowRecord(task) {
  const instance = resolveTaskWorkflowInstance(task);
  if (!instance) return null;
  return findWorkflowRecordById(instance.workflowRecordId, instance.studyProtocol || task?.study);
}

function resolveTaskWorkflowDisplay(task) {
  if (!task) return null;

  const { workflow, instance } = resolveWorkflowContext(task);
  if (!workflow || !instance) return null;

  return {
    name: workflow.name,
    scopeLabel: WORKFLOW_SCOPE_LABELS[workflow.scope] || workflow.scope,
    workflow,
    instance,
  };
}

function findRoutineByIdAnywhere(routineId, studyProtocol) {
  if (!routineId) return null;
  const direct = RoutineStore.getById(routineId);
  if (direct) return direct;

  for (const study of StudyMasterStore.getAll()) {
    if (studyProtocol && study.protocolNumber !== studyProtocol) continue;
    const match = (study.routines || []).find((routine) => routine.id === routineId);
    if (match) return normalizeRoutineRecord({ ...match, studyId: study.id });
  }
  return null;
}

function resolveTaskRoutineDisplay(task) {
  if (!task?.routineId) return null;
  const routine = findRoutineByIdAnywhere(task.routineId, task.study);
  if (!routine) return { name: "Unknown Routine", routine: null };
  return { name: routine.name, routine };
}

function sortWorkflowsForDisplay(items) {
  return [...items].sort((a, b) => {
    const usageDiff = (b.usageCount || 0) - (a.usageCount || 0);
    if (usageDiff !== 0) return usageDiff;
    const aUsed = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
    const bUsed = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
    return bUsed - aUsed;
  });
}

function getWorkflowStepIndexForTask(task, root, workflow) {
  const stepDefs = buildWorkflowTimelineStepDefs(workflow, root);
  const taskName = (task.task || "").trim().toLowerCase();
  const index = stepDefs.findIndex((def) => {
    if (def.kind === "root" && task.id === root.id) return true;
    return (def.taskName || "").trim().toLowerCase() === taskName;
  });
  return index >= 0 ? index + 1 : null;
}

function getWorkflowStepProgress(task) {
  const root = getWorkflowRootTask(task);
  if (!root) return null;
  const children = getSubtasks(root.id);
  if (!children.length) return null;
  const completed = children.filter((child) => child.status === "Completed").length;
  return { root, completed, total: children.length };
}

function getWorkflowStepPosition(task) {
  const { workflow, root, instance } = resolveWorkflowContext(task);
  if (!root || !workflow || !instance) return null;

  const workflowName = workflow.name?.trim() || getWorkflowRootLabel(workflow);
  if (!workflowName) return null;

  const current = task.stepIndex || getWorkflowStepIndexForTask(task, root, workflow);
  if (!current) return null;

  const total = computeWorkflowStepCount(workflow);

  return {
    workflowName,
    name: workflowName,
    current,
    total,
    workflow,
    instance,
  };
}

function renderTaskContextMeta(task, options = {}) {
  const chips = [];
  const step = getWorkflowStepPosition(task);
  const routineInfo = resolveTaskRoutineDisplay(task);
  const inline = Boolean(options.inline);

  if (step) {
    const label = step.workflowName || step.name;
    const progress = step.total > 1 ? ` (${step.current}/${step.total})` : "";
    chips.push(
      `<span class="task-context-chip task-context-chip--workflow" title="${escapeAttr(label)}">🟣 ${escapeHtml(label)}${progress}</span>`
    );
  }
  if (routineInfo) {
    chips.push(
      `<span class="task-context-chip task-context-chip--routine" title="Routine">🔁 ${escapeHtml(routineInfo.name)}</span>`
    );
  }
  if (!chips.length) return "";
  const className = inline ? "task-context-chips task-context-chips--inline" : "task-context-chips";
  return `<div class="${className}">${chips.join("")}</div>`;
}

const DASHBOARD_SECTION_PREVIEW_LIMIT = 3;
const DASHBOARD_TODAY_PREVIEW_LIMIT = 5;
const DASHBOARD_COMPACT_PREVIEW_LIMIT = 2;
const DASHBOARD_WEEK_PREVIEW_LIMIT = 4;

function buildWorkflowTimelineStepDefs(workflow, rootTask) {
  const steps = [];
  (workflow.preSteps || []).forEach((step) => {
    steps.push({ kind: "pre", taskName: step.taskName, stepDef: step });
  });
  steps.push({
    kind: "root",
    taskName: rootTask?.task?.trim() || getWorkflowRootLabel(workflow),
    stepDef: null,
  });
  (workflow.steps || []).forEach((step) => {
    steps.push({ kind: "post", taskName: step.taskName, stepDef: step });
  });
  return steps;
}

function findTaskForWorkflowStepName(stepName, rootTask, children) {
  const nameLower = (stepName || "").trim().toLowerCase();
  if (!nameLower) return null;
  if (rootTask && (rootTask.task || "").trim().toLowerCase() === nameLower) return rootTask;
  return children.find((child) => (child.task || "").trim().toLowerCase() === nameLower) || null;
}

function formatWorkflowStepDueHint(def, matchedTask) {
  if (matchedTask?.dueDate) {
    return ` (${formatDueLabel(matchedTask.dueDate)})`;
  }
  if (!def?.stepDef || def.kind === "root") return "";
  const offset = def.stepDef.dueOffset;
  if (!Number.isFinite(Number(offset)) || Number(offset) <= 0) return "";
  const prefix = def.kind === "pre" ? "-" : "+";
  const unit = def.stepDef.dueUnit === "business" ? " business days" : "일";
  return ` (${prefix}${offset}${unit})`;
}

function getWorkflowProgressStats(workflow, rootTask, instance) {
  const stepDefs = buildWorkflowTimelineStepDefs(workflow, rootTask);
  let completed = 0;
  stepDefs.forEach((def) => {
    const matched = findTaskForWorkflowStepInInstance(def.taskName, rootTask, instance);
    if (matched?.status === "Completed") completed += 1;
  });
  return { completed, total: stepDefs.length };
}

function getAdjacentWorkflowStepInfo(task, workflow, rootTask, instance) {
  const stepDefs = buildWorkflowTimelineStepDefs(workflow, rootTask);
  const currentIndex = Math.max(
    0,
    (task.stepIndex || getWorkflowStepIndexForTask(task, rootTask, workflow) || 1) - 1
  );

  const buildEntry = (def, index) => {
    if (!def || index < 0 || index >= stepDefs.length) return null;
    return {
      def,
      matchedTask: findTaskForWorkflowStepInInstance(def.taskName, rootTask, instance),
      index,
    };
  };

  return {
    current: buildEntry(stepDefs[currentIndex], currentIndex),
    prev: buildEntry(stepDefs[currentIndex - 1], currentIndex - 1),
    next: buildEntry(stepDefs[currentIndex + 1], currentIndex + 1),
    currentIndex,
    total: stepDefs.length,
  };
}

function renderDashboardWorkflowAdjacentSteps(task, workflow, rootTask, instance) {
  const adjacent = getAdjacentWorkflowStepInfo(task, workflow, rootTask, instance);
  if (!adjacent.current) return "";

  const renderStepRow = (label, entry, variant) => {
    if (!entry) {
      return `
        <div class="dashboard-workflow-adjacent__row dashboard-workflow-adjacent__row--${variant} dashboard-workflow-adjacent__row--empty">
          <span class="dashboard-workflow-adjacent__label">${escapeHtml(label)}</span>
          <span class="dashboard-workflow-adjacent__empty">—</span>
        </div>
      `;
    }

    const meta = entry.matchedTask
      ? formatDueDisplay(entry.matchedTask)
      : formatWorkflowStepDueHint(entry.def, null).replace(/^\s*\(/, "").replace(/\)$/, "") || "";

    return `
      <div class="dashboard-workflow-adjacent__row dashboard-workflow-adjacent__row--${variant}">
        <span class="dashboard-workflow-adjacent__label">${escapeHtml(label)}</span>
        <div class="dashboard-workflow-adjacent__content">
          <span class="dashboard-workflow-adjacent__name">${escapeHtml(entry.def.taskName)}</span>
          ${meta ? `<span class="dashboard-workflow-adjacent__meta">${escapeHtml(meta)}</span>` : ""}
        </div>
      </div>
    `;
  };

  return `
    <section class="dashboard-workflow-adjacent">
      <div class="dashboard-workflow-adjacent__position">
        <span class="dashboard-workflow-adjacent__position-label">현재 위치</span>
        <span class="dashboard-workflow-adjacent__position-value">${adjacent.currentIndex + 1} / ${adjacent.total}</span>
      </div>
      ${renderStepRow("이전", adjacent.prev, "prev")}
      ${renderStepRow("현재", adjacent.current, "current")}
      ${renderStepRow("다음", adjacent.next, "next")}
    </section>
  `;
}

function renderDashboardWorkflowDetailContent(task) {
  const { workflow, root, instance } = resolveWorkflowContext(task);

  if (!workflow || !root || !instance) {
    return `
      <section class="dashboard-workflow-empty">
        <p class="dashboard-workflow-empty__text">연결된 Workflow가 없습니다.</p>
        <p class="dashboard-workflow-empty__hint">My Tasks에서 Task를 관리하거나 Workflow Library에서 Flow를 적용할 수 있습니다.</p>
      </section>
    `;
  }

  const progress = getWorkflowProgressStats(workflow, root, instance);
  const adjacentHtml = renderDashboardWorkflowAdjacentSteps(task, workflow, root, instance);
  const timelineHtml = renderWorkflowTimeline(task, { clickMode: "dashboard" });

  return `
    <section class="dashboard-workflow-progress">
      <span class="dashboard-workflow-progress__label">Workflow 진행률</span>
      <span class="dashboard-workflow-progress__value">${progress.completed} / ${progress.total} 완료</span>
      <div class="dashboard-workflow-progress__bar" role="progressbar" aria-valuenow="${progress.completed}" aria-valuemin="0" aria-valuemax="${progress.total}">
        <span class="dashboard-workflow-progress__fill" style="width:${progress.total ? Math.round((progress.completed / progress.total) * 100) : 0}%"></span>
      </div>
    </section>
    ${adjacentHtml}
    ${timelineHtml}
  `;
}

function renderWorkflowTimeline(task, options = {}) {
  const interactive = options.interactive !== false;
  const clickMode = options.clickMode || "edit";
  const { workflow, root, instance } = resolveWorkflowContext(task);
  if (!workflow || !root || !instance) return "";

  const stepDefs = buildWorkflowTimelineStepDefs(workflow, root);
  const currentIndex = Math.max(
    0,
    (task.stepIndex || getWorkflowStepIndexForTask(task, root, workflow) || 1) - 1
  );
  const workflowName = workflow.name?.trim() || getWorkflowRootLabel(workflow);

  const rows = stepDefs
    .map((def, index) => {
      const matchedTask = findTaskForWorkflowStepInInstance(def.taskName, root, instance);
      const isDone = matchedTask?.status === "Completed";
      const isCurrent = index === currentIndex && !isDone;
      let icon;
      let stateClass;
      if (isDone) {
        icon = "✓";
        stateClass = "workflow-timeline__step--done";
      } else if (isCurrent) {
        icon = "●";
        stateClass = "workflow-timeline__step--current";
      } else {
        icon = "○";
        stateClass = "workflow-timeline__step--pending";
      }

      const dueHint = !isDone ? formatWorkflowStepDueHint(def, matchedTask) : "";
      const nameLabel = isCurrent ? `${def.taskName} (현재)` : `${def.taskName}${dueHint}`;
      let stepInner;
      if (matchedTask && interactive) {
        const clickAttr =
          clickMode === "dashboard"
            ? `data-dashboard-step-task="${escapeAttr(matchedTask.id)}"`
            : `data-edit="${escapeAttr(matchedTask.id)}"`;
        stepInner = `<button type="button" class="workflow-timeline__btn" ${clickAttr}><span class="workflow-timeline__icon" aria-hidden="true">${icon}</span><span class="workflow-timeline__name">${escapeHtml(nameLabel)}</span></button>`;
      } else {
        stepInner = `<div class="workflow-timeline__placeholder"><span class="workflow-timeline__icon" aria-hidden="true">${icon}</span><span class="workflow-timeline__name">${escapeHtml(nameLabel)}</span></div>`;
      }
      const arrow =
        index < stepDefs.length - 1 ? '<div class="workflow-timeline__arrow" aria-hidden="true">↓</div>' : "";

      return `<div class="workflow-timeline__step ${stateClass}">${stepInner}${arrow}</div>`;
    })
    .join("");

  return `
    <div class="workflow-timeline">
      <h4 class="workflow-timeline__title">${escapeHtml(workflowName)}</h4>
      <div class="workflow-timeline__track">${rows}</div>
    </div>
  `;
}

function bindWorkflowTimelineClicks(container, mode = "edit") {
  if (mode === "dashboard") {
    container?.querySelectorAll("[data-dashboard-step-task]").forEach((btn) => {
      btn.addEventListener("click", () => openDashboardWorkflowDetail(btn.dataset.dashboardStepTask));
    });
    return;
  }
  container?.querySelectorAll(".workflow-timeline__btn[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openTaskDetail(btn.dataset.edit));
  });
}

function openDashboardWorkflowDetail(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  dashboardWorkflowTaskId = taskId;
  if (selectedTaskId) closeTaskDetail();

  const workflow = resolveTaskWorkflowRecord(task);
  const workflowName = workflow?.name?.trim() || getWorkflowRootLabel(workflow) || task.task;

  if (els.dashboardWorkflowTitle) els.dashboardWorkflowTitle.textContent = workflowName;
  if (els.dashboardWorkflowBody) {
    els.dashboardWorkflowBody.innerHTML = renderDashboardWorkflowDetailContent(task);
    bindWorkflowTimelineClicks(els.dashboardWorkflowBody, "dashboard");
  }
  if (els.dashboardWorkflowPanel) els.dashboardWorkflowPanel.hidden = false;
  document.body.classList.add("dashboard-workflow-open");
  updateDashboardWorkflowSelection();
  els.dashboardWorkflowBody?.scrollTo(0, 0);
}

function closeDashboardWorkflowDetail() {
  dashboardWorkflowTaskId = null;
  if (els.dashboardWorkflowPanel) els.dashboardWorkflowPanel.hidden = true;
  if (els.dashboardWorkflowBody) els.dashboardWorkflowBody.innerHTML = "";
  document.body.classList.remove("dashboard-workflow-open");
  updateDashboardWorkflowSelection();
}

function navigateToMyTasksEdit(taskId) {
  closeDashboardWorkflowDetail();
  switchView("tasks");
  openTaskDetail(taskId);
}

function updateDashboardWorkflowSelection() {
  updateTaskListSelection();
}

function renderDashboardMoreButton(filter, taskList, limit) {
  if (!filter || taskList.length <= limit) return "";
  const isExpanded = dashboardExpandedSections.has(filter);
  const remaining = taskList.length - limit;
  const label = isExpanded ? "접기" : `+ ${remaining}개 더 보기`;
  return `<button type="button" class="dash-more-btn${isExpanded ? " dash-more-btn--collapse" : ""}" data-dashboard-expand="${escapeAttr(filter)}" aria-expanded="${isExpanded}">${escapeHtml(label)}</button>`;
}

function toggleDashboardSectionExpand(filter) {
  if (!filter) return;
  if (dashboardExpandedSections.has(filter)) {
    dashboardExpandedSections.delete(filter);
  } else {
    dashboardExpandedSections.add(filter);
  }
  renderDashboard();
}

function setDashCardEmptyState(listEl, isEmpty) {
  const card = listEl?.closest(".dash-card");
  if (card) card.classList.toggle("dash-card--empty", isEmpty);
}

function isDueNextWeek(dueDateStr) {
  if (!dueDateStr) return false;
  const { start, end } = getWeekRangeWithOffset(1);
  const due = parseDate(dueDateStr);
  return due >= start && due <= end;
}

function getDashboardWeekPrepTasks() {
  const todayStr = toDateString(getToday());
  return tasks
    .filter((task) => {
      if (!isActive(task) || !task.dueDate || !isDueThisWeek(task.dueDate)) return false;
      return task.dueDate !== todayStr;
    })
    .sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate));
}

function getDashboardNextWeekTasks() {
  return tasks
    .filter((task) => isActive(task) && task.dueDate && isDueNextWeek(task.dueDate))
    .sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate));
}

function getRecentlyCompletedTasks(limit = null) {
  const sorted = tasks
    .filter((task) => task.status === "Completed")
    .sort((a, b) => {
      const aDate = a.completedAt || a.dueDate || a.createdAt || "";
      const bDate = b.completedAt || b.dueDate || b.createdAt || "";
      return bDate.localeCompare(aDate);
    });
  return limit ? sorted.slice(0, limit) : sorted;
}

function navigateToStudyRoutineTab(studyProtocol) {
  closeTaskDetail();
  switchView("routine-master");
  renderRoutineMaster();
}

function navigateToStudyWorkflowLibrary(studyProtocol) {
  const study = studyProtocol ? StudyMasterStore.getByProtocol(studyProtocol) : null;
  if (study) {
    closeTaskDetail();
    closeAddTaskModal();
    selectedStudyMasterId = study.id;
    selectedStudyMasterTab = "applied-workflows";
    switchView("study-master");
    renderStudyMaster();
    return;
  }
  switchView("workflow-master");
  switchWorkflowMasterTab("study");
}

function updateAddTaskWorkflowHint() {
  if (!els.taskWorkflowMatchHint) return;
  const taskName = els.task?.value?.trim() || "";
  const study = els.study?.value || "";
  if (!taskName) {
    els.taskWorkflowMatchHint.hidden = true;
    els.taskWorkflowMatchHint.innerHTML = "";
    return;
  }

  const matches = findMatchingWorkflows(taskName, study);
  if (!matches.length) {
    els.taskWorkflowMatchHint.hidden = true;
    els.taskWorkflowMatchHint.innerHTML = "";
    return;
  }

  const top = matches[0];
  els.taskWorkflowMatchHint.hidden = false;
  els.taskWorkflowMatchHint.innerHTML = `
    <span class="task-workflow-hint__icon" aria-hidden="true">🔗</span>
    <span class="task-workflow-hint__text"><strong>${escapeHtml(top.name)}</strong> Workflow 매칭 · ${getWorkflowTaskCount(top)} Tasks</span>
    <span class="task-workflow-hint__note">저장 시 Flow Preview와 함께 적용 여부를 선택할 수 있습니다.</span>
  `;
}

function renderTaskDetailLinks(task) {
  const workflowInfo = resolveTaskWorkflowDisplay(task);
  const routineInfo = resolveTaskRoutineDisplay(task);
  const timelineHtml = renderWorkflowTimeline(task);

  if (els.taskDetailWorkflowTimeline) {
    if (timelineHtml) {
      els.taskDetailWorkflowTimeline.hidden = false;
      els.taskDetailWorkflowTimeline.innerHTML = timelineHtml;
      bindWorkflowTimelineClicks(els.taskDetailWorkflowTimeline, "edit");
    } else {
      els.taskDetailWorkflowTimeline.hidden = true;
      els.taskDetailWorkflowTimeline.innerHTML = "";
    }
  }

  if (els.taskDetailWorkflowPreview) {
    els.taskDetailWorkflowPreview.hidden = true;
    els.taskDetailWorkflowPreview.innerHTML = "";
  }

  if (els.taskDetailWorkflowLink) {
    if (workflowInfo) {
      els.taskDetailWorkflowLink.hidden = false;
      els.taskDetailWorkflowLink.dataset.studyProtocol = task.study || "";
      els.taskDetailWorkflowLink.innerHTML = `
        <span class="task-detail-link__label">Workflow Library</span>
        <span class="task-detail-link__value">${escapeHtml(workflowInfo.name)}</span>
        <span class="task-detail-link__scope">${escapeHtml(workflowInfo.scopeLabel)}</span>
        <span class="task-detail-link__action">편집 · Library 열기 →</span>
      `;
    } else {
      els.taskDetailWorkflowLink.hidden = true;
      els.taskDetailWorkflowLink.innerHTML = "";
      delete els.taskDetailWorkflowLink.dataset.studyProtocol;
    }
  }

  if (els.taskDetailRoutineLink) {
    if (routineInfo) {
      els.taskDetailRoutineLink.hidden = false;
      els.taskDetailRoutineLink.innerHTML = `
        <span class="task-detail-link__label">Routine</span>
        <span class="task-detail-link__value">${escapeHtml(routineInfo.name)}</span>
        <span class="task-detail-link__action">Routine 관리 →</span>
      `;
      els.taskDetailRoutineLink.dataset.studyProtocol = task.study || "";
    } else {
      els.taskDetailRoutineLink.hidden = true;
      els.taskDetailRoutineLink.innerHTML = "";
      delete els.taskDetailRoutineLink.dataset.studyProtocol;
    }
  }

  if (els.taskDetailWorkflowSteps && els.taskDetailWorkflowStepsList) {
    els.taskDetailWorkflowSteps.hidden = true;
    els.taskDetailWorkflowStepsList.innerHTML = "";
  }
}

function saveWorkflowWithScope(payload, scope, studyProtocol) {
  const saved = GlobalWorkflowStore.add({ ...payload, scope: "global", source: payload.source || "learned" });
  if (!saved) return null;

  if (scope === "study") {
    const study = StudyMasterStore.getByProtocol(studyProtocol);
    if (!study) {
      showToast("Study를 찾을 수 없습니다.");
      return saved;
    }
    StudyMasterStore.applyWorkflow(study.id, saved.id);
    if (selectedStudyMasterId === study.id) renderStudyAppliedWorkflows(study);
  }

  return saved;
}

function buildWorkflowRefFromSaved(saved, scope, studyProtocol) {
  if (!saved?.id) return null;
  if (scope === "study") {
    const study = StudyMasterStore.getByProtocol(studyProtocol);
    if (!study) return getGeneralWorkflowRef(saved.id);
    return { scope: "global", id: saved.id, studyId: study.id };
  }
  return getGeneralWorkflowRef(saved.id);
}

function applyLearnedWorkflowToTaskChain(rootTaskRef, followUpTaskRef, workflow, ref, options = {}) {
  if (!workflow?.id || !rootTaskRef?.id) return;

  const rootTask = resolveWorkflowTaskRef(rootTaskRef);
  if (!rootTask) {
    showToast("Workflow Root Task를 찾을 수 없습니다.");
    return;
  }

  let instance = null;
  if (options.reuseInstance) {
    instance = WorkflowInstanceStore.findByRootAndRecord(rootTask.id, workflow.id);
  }
  if (!instance) {
    instance = createWorkflowInstance(workflow, rootTask);
  }

  assignTaskToWorkflowInstance(rootTask.id, instance, workflow);

  if (followUpTaskRef?.id) {
    const followUpTask = resolveWorkflowTaskRef(followUpTaskRef);
    if (!followUpTask) {
      showToast("Follow-up Task를 찾을 수 없습니다.");
      return;
    }
    assignTaskToWorkflowInstance(followUpTask.id, instance, workflow);
    if (followUpTask.parentTaskId !== rootTask.id) {
      TaskStore.update(followUpTask.id, { parentTaskId: rootTask.id });
    }
  }

  if (ref?.studyId) {
    StudyMasterStore.recordWorkflowUsage(ref.studyId, workflow.id);
  } else {
    GlobalWorkflowStore.recordUsage(workflow.id);
  }
}

function openWorkflowLearnModal(context) {
  if (!els.workflowLearnModal || !els.workflowLearnBody) return;

  workflowLearnContext = context;
  const root = context.rootTask;
  const followUp = context.followUpTask;
  if (!root || !followUp) return;

  const study = root.study ? StudyMasterStore.getByProtocol(root.study) : null;
  const existingWorkflows = study ? StudyMasterStore.getAppliedWorkflows(study.id) : [];
  const dueOffset =
    root.dueDate && followUp.dueDate
      ? Math.max(0, Math.round((parseDate(followUp.dueDate) - parseDate(root.dueDate)) / 86400000))
      : 0;

  const previewWorkflow = normalizeWorkflowRecord({
    name: `${root.task} Follow-up`,
    rootTaskName: root.task,
    steps: [
      {
        taskName: followUp.task,
        dueOffset,
        dueUnit: "calendar",
        priority: followUp.priority,
      },
    ],
  });

  const updateOptions = existingWorkflows
    .map(
      (workflow) =>
        `<option value="${escapeAttr(workflow.id)}">${escapeHtml(workflow.name)} (${getWorkflowTaskCount(workflow)} Tasks)</option>`
    )
    .join("");

  const defaultScope = study ? "study" : "general";

  els.workflowLearnBody.innerHTML = `
    ${renderWorkflowFlowPreview(previewWorkflow, { rootLabel: root.task })}
    ${renderWorkflowMetaRow(previewWorkflow)}
    <form id="workflowLearnForm" class="workflow-learn-form">
      <fieldset class="workflow-learn-form__field">
        <legend class="workflow-learn-form__legend">저장 방식</legend>
        <label class="workflow-learn-form__radio">
          <input type="radio" name="learnMode" value="update" ${existingWorkflows.length ? "" : "disabled"} />
          기존 Workflow 업데이트
        </label>
        ${
          existingWorkflows.length
            ? `<select id="workflowLearnUpdateSelect" class="workflow-learn-form__select">${updateOptions}</select>`
            : '<p class="form-hint">업데이트할 Applied Workflow가 없습니다.</p>'
        }
        <label class="workflow-learn-form__radio">
          <input type="radio" name="learnMode" value="new" checked />
          새 Workflow로 저장
        </label>
        <input type="text" id="workflowLearnNameInput" class="workflow-learn-form__input" value="${escapeAttr(`${root.task} Follow-up`)}" placeholder="Workflow 이름" />
      </fieldset>
      <fieldset class="workflow-learn-form__field">
        <legend class="workflow-learn-form__legend">Study 적용</legend>
        <label class="workflow-learn-form__radio">
          <input type="radio" name="learnScope" value="study" ${defaultScope === "study" ? "checked" : ""} ${study ? "" : "disabled"} />
          General에 저장 + 이 Study에 적용
        </label>
        <label class="workflow-learn-form__radio">
          <input type="radio" name="learnScope" value="general" ${defaultScope === "general" ? "checked" : ""} />
          General에만 저장
        </label>
        <p class="form-hint">Workflow 원본은 Workflow → General에 저장됩니다. Study는 참조만 합니다.</p>
      </fieldset>
    </form>
  `;

  els.workflowLearnModal.hidden = false;
}

function closeWorkflowLearnModal() {
  if (els.workflowLearnModal) els.workflowLearnModal.hidden = true;
  workflowLearnContext = null;
}

function handleWorkflowLearnSave() {
  if (!workflowLearnContext) return;
  const root = resolveWorkflowTaskRef(workflowLearnContext.rootTask);
  const followUp = resolveWorkflowTaskRef(workflowLearnContext.followUpTask);
  const form = document.getElementById("workflowLearnForm");
  if (!form || !root || !followUp) {
    showToast("Workflow Learning 대상 Task를 찾을 수 없습니다.");
    closeWorkflowLearnModal();
    return;
  }

  const mode = form.querySelector('input[name="learnMode"]:checked')?.value || "new";
  const scope = form.querySelector('input[name="learnScope"]:checked')?.value || "general";
  const step = normalizeWorkflowStep({
    taskName: followUp.task,
    dueOffset:
      root.dueDate && followUp.dueDate
        ? Math.max(0, Math.round((parseDate(followUp.dueDate) - parseDate(root.dueDate)) / 86400000))
        : 0,
    dueUnit: "calendar",
    priority: followUp.priority,
  });

  if (mode === "update" && scope === "study") {
    const study = StudyMasterStore.getByProtocol(root.study);
    const workflowId = document.getElementById("workflowLearnUpdateSelect")?.value;
    if (study && workflowId) {
      const existing = resolveGeneralWorkflow(workflowId);
      if (existing) {
        const updated = GlobalWorkflowStore.update(workflowId, {
          steps: [...(existing.steps || []), step],
          source: "learned",
          trigger: "TASK_COMPLETED",
          category: inferWorkflowCategory(existing.name, existing.tags),
        });
        if (updated) {
          StudyMasterStore.applyWorkflow(study.id, workflowId);
          applyLearnedWorkflowToTaskChain(root, followUp, updated, {
            scope: "global",
            id: workflowId,
            studyId: study.id,
          }, { reuseInstance: true });
          renderAll();
          showToast("General Workflow가 업데이트되었습니다.");
          closeWorkflowLearnModal();
          if (selectedStudyMasterId === study.id) renderStudyAppliedWorkflows(study);
          renderWorkflowMaster();
        }
        return;
      }
    }
  }

  const nameInput = document.getElementById("workflowLearnNameInput");
  const name = nameInput?.value.trim() || `${root.task} Follow-up`;
  const payload = {
    name,
    rootTaskName: root.task,
    steps: [step],
    source: "learned",
    trigger: "TASK_COMPLETED",
    category: inferWorkflowCategory(name),
    tags: [root.task.toLowerCase()],
    usageCount: 0,
    lastUsedAt: null,
  };

  const saved = saveWorkflowWithScope(payload, scope, root.study);
  if (saved) {
    const ref = buildWorkflowRefFromSaved(saved, scope, root.study);
    applyLearnedWorkflowToTaskChain(root, followUp, saved, ref, { reuseInstance: false });
    renderAll();
    showToast(scope === "study" ? "General Workflow를 저장하고 Study에 적용했습니다." : "General Workflow로 저장했습니다.");
  }
  closeWorkflowLearnModal();
}

function formatRoutineScheduleSummary(routine) {
  const schedule = routine.schedule || {};
  if (schedule.type === "weekly") {
    return `매주 ${ROUTINE_WEEKDAY_LABELS[schedule.weekday] || "?"}요일`;
  }
  if (schedule.type === "monthly") {
    return `매월 ${schedule.dayOfMonth}일`;
  }
  const offsets = (schedule.offsets || []).slice().sort((a, b) => b - a);
  if (offsets.length) {
    return `D-${offsets.filter((n) => n > 0).join("/D-")}${offsets.includes(0) ? "/Due" : ""}`;
  }
  return "마감일 기준";
}

function renderRoutineMaster() {
  const container = els.routineMasterList;
  if (!container) return;

  const routines = RoutineStore.getAll();
  if (!routines.length) {
    container.innerHTML =
      '<p class="workflow-library-empty">Routine을 등록하면 반복 Task가 자동 생성됩니다. Study 연결은 선택 사항입니다.</p>';
    return;
  }

  container.innerHTML = routines
    .map((routine) => {
      const study = routine.studyId ? StudyMasterStore.getById(routine.studyId) : null;
      const studyLabel = study ? study.protocolNumber : "Study 미연결";
      return `
      <article class="routine-card">
        <header class="routine-card__head">
          <h4 class="routine-card__title">${escapeHtml(routine.name)}</h4>
          <span class="routine-card__badge${routine.enabled ? "" : " routine-card__badge--off"}">${routine.enabled ? "ON" : "OFF"}</span>
        </header>
        <p class="routine-card__task">${escapeHtml(routine.taskTemplate.taskName)} · ${escapeHtml(routine.taskTemplate.priority)}</p>
        <p class="routine-card__schedule">${escapeHtml(formatRoutineScheduleSummary(routine))} · ${escapeHtml(studyLabel)}</p>
        <footer class="routine-card__actions">
          <button type="button" class="btn btn--ghost btn--sm" data-edit-routine="${escapeAttr(routine.id)}">수정</button>
          <button type="button" class="btn btn--ghost btn--sm" data-delete-routine="${escapeAttr(routine.id)}">삭제</button>
        </footer>
      </article>
    `;
    })
    .join("");

  container.querySelectorAll("[data-edit-routine]").forEach((btn) => {
    btn.addEventListener("click", () => openRoutineModal(btn.dataset.editRoutine));
  });
  container.querySelectorAll("[data-delete-routine]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (confirm("이 Routine을 삭제할까요?")) {
        RoutineStore.delete(btn.dataset.deleteRoutine);
        renderRoutineMaster();
      }
    });
  });
}

function openRoutineModal(routineId = null, presetKey = null) {
  if (!els.routineModal || !els.routineForm) return;

  const routine = routineId ? RoutineStore.getById(routineId) : null;
  const preset = presetKey ? ROUTINE_PRESETS[presetKey] : null;

  document.getElementById("routineModalTitle").textContent = routine ? "Routine 수정" : "Routine 등록";
  document.getElementById("routineId").value = routine?.id || "";
  populateRoutineStudySelect(routine?.studyId || "");
  document.getElementById("routineName").value = routine?.name || preset?.name || "";
  document.getElementById("routineTaskName").value = routine?.taskTemplate?.taskName || preset?.taskName || "";
  document.getElementById("routinePriority").value = routine?.taskTemplate?.priority || preset?.priority || "Medium";
  document.getElementById("routineScheduleType").value = routine?.schedule?.type || preset?.schedule?.type || "anchor";
  document.getElementById("routineAnchorDate").value = routine?.schedule?.anchorDate || "";
  document.getElementById("routineOffsets").value = (routine?.schedule?.offsets || preset?.schedule?.offsets || [14, 7, 3, 0]).join(", ");
  document.getElementById("routineWeekday").value = String(routine?.schedule?.weekday ?? preset?.schedule?.weekday ?? 1);
  document.getElementById("routineDayOfMonth").value = String(routine?.schedule?.dayOfMonth ?? 1);
  document.getElementById("routineEnabled").value = String(routine?.enabled !== false);
  applyRoutineScheduleFieldsVisibility();

  els.routineModal.hidden = false;
}

function populateRoutineStudySelect(selectedStudyId = "") {
  const select = document.getElementById("routineStudyId");
  if (!select) return;
  const studies = StudyMasterStore.getAll();
  select.innerHTML =
    '<option value="">Study 미연결</option>' +
    studies
      .map(
        (study) =>
          `<option value="${escapeAttr(study.id)}"${study.id === selectedStudyId ? " selected" : ""}>${escapeHtml(study.protocolNumber)}</option>`
      )
      .join("");
}

function closeRoutineModal() {
  if (els.routineModal) els.routineModal.hidden = true;
  els.routineForm?.reset();
}

function applyRoutineScheduleFieldsVisibility() {
  const type = document.getElementById("routineScheduleType")?.value || "anchor";
  const anchorFields = document.getElementById("routineAnchorFields");
  const weeklyFields = document.getElementById("routineWeeklyFields");
  const monthlyFields = document.getElementById("routineMonthlyFields");
  if (anchorFields) anchorFields.hidden = type !== "anchor";
  if (weeklyFields) weeklyFields.hidden = type !== "weekly";
  if (monthlyFields) monthlyFields.hidden = type !== "monthly";
}

function handleRoutineSubmit(e) {
  e.preventDefault();
  const routineId = document.getElementById("routineId").value;
  const studyId = document.getElementById("routineStudyId")?.value || "";
  const scheduleType = document.getElementById("routineScheduleType").value;
  const offsetsRaw = document.getElementById("routineOffsets").value || "";
  const offsets = offsetsRaw
    .split(/[,，\s]+/)
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isFinite(n));

  const payload = {
    name: document.getElementById("routineName").value.trim(),
    studyId: studyId || null,
    taskTemplate: {
      taskName: document.getElementById("routineTaskName").value.trim(),
      priority: document.getElementById("routinePriority").value,
    },
    schedule: {
      type: scheduleType,
      anchorDate: document.getElementById("routineAnchorDate").value,
      offsets: offsets.length ? offsets : [14, 7, 3, 0],
      weekday: Number(document.getElementById("routineWeekday").value),
      dayOfMonth: Number(document.getElementById("routineDayOfMonth").value),
    },
    enabled: document.getElementById("routineEnabled").value === "true",
    category: inferWorkflowCategory(document.getElementById("routineName").value.trim()),
  };

  if (!payload.name || !payload.taskTemplate.taskName) {
    alert("Routine 이름과 Task 이름을 입력해 주세요.");
    return;
  }

  if (routineId) {
    RoutineStore.update(routineId, payload);
    showToast("Routine이 수정되었습니다.");
  } else {
    RoutineStore.add(payload);
    showToast("Routine이 등록되었습니다.");
  }

  closeRoutineModal();
  renderRoutineMaster();
  runRoutineScheduler();
  renderAll();
}

function taskExistsForRoutine(routineId, dueDate, taskName) {
  return tasks.some(
    (task) => task.routineId === routineId && task.dueDate === dueDate && task.task === taskName && task.status !== "Cancelled"
  );
}

function computeRoutineDueDates(routine, todayStr) {
  const schedule = routine.schedule || {};
  const dates = new Set();

  if (schedule.type === "anchor") {
    const anchor = schedule.anchorDate || todayStr;
    (schedule.offsets || [14, 7, 3, 0]).forEach((offset) => {
      const due = addDaysToDate(anchor, -offset);
      if (due >= todayStr) dates.add(due);
    });
    return [...dates];
  }

  if (schedule.type === "weekly") {
    const today = parseDate(todayStr);
    const targetDow = schedule.weekday ?? 1;
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      if (d.getDay() === targetDow) {
        dates.add(toDateString(d));
      }
    }
    return [...dates];
  }

  if (schedule.type === "monthly") {
    const today = parseDate(todayStr);
    const dom = schedule.dayOfMonth ?? 1;
    for (let m = 0; m < 2; m += 1) {
      const d = new Date(today.getFullYear(), today.getMonth() + m, dom);
      if (toDateString(d) >= todayStr) dates.add(toDateString(d));
    }
    return [...dates];
  }

  return [];
}

function runRoutineScheduler() {
  const todayStr = toDateString(getToday());
  let created = 0;

  RoutineStore.getAll().forEach((routine) => {
    if (!routine.enabled || !routine.taskTemplate.taskName) return;

    const study = routine.studyId ? StudyMasterStore.getById(routine.studyId) : null;
    const dueDates = computeRoutineDueDates(routine, todayStr);
    let routineCreated = 0;

    dueDates.forEach((dueDate) => {
      if (taskExistsForRoutine(routine.id, dueDate, routine.taskTemplate.taskName)) return;

      TaskStore.add({
        id: generateId(),
        study: study?.protocolNumber || "",
        site: "",
        task: routine.taskTemplate.taskName,
        dueDate,
        status: DEFAULT_STATUS,
        priority: routine.taskTemplate.priority,
        routineId: routine.id,
        autoGenerated: true,
        createdAt: new Date().toISOString(),
      });
      routineCreated += 1;
    });

    if (routineCreated > 0) {
      RoutineStore.update(routine.id, { lastMaterializedAt: new Date().toISOString() });
      created += routineCreated;
    }
  });

  return created;
}

function populateSponsorDatalist() {
  const datalist = document.getElementById("sponsorOptions");
  if (!datalist) return;
  datalist.innerHTML = StudyMasterStore.getKnownSponsors()
    .map((sponsor) => `<option value="${escapeAttr(sponsor)}"></option>`)
    .join("");
}

function applyStudyMasterTabUi() {
  document.querySelectorAll("[data-study-tab]").forEach((btn) => {
    const tab = btn.dataset.studyTab;
    btn.classList.toggle("site-master-tabs__btn--active", tab === selectedStudyMasterTab);
    btn.disabled = selectedStudyMasterId === "new" && tab !== "general";
  });

  document.querySelectorAll("[data-study-tab-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.studyTabPanel !== selectedStudyMasterTab;
  });

  const isNewStudy = selectedStudyMasterId === "new";
  const newStudySystemsHint = document.getElementById("studySystemsNewStudyHint");
  const newStudyAppliedWorkflowHint = document.getElementById("studyAppliedWorkflowNewStudyHint");

  if (newStudySystemsHint) newStudySystemsHint.hidden = !isNewStudy || selectedStudyMasterTab !== "systems";
  if (newStudyAppliedWorkflowHint) {
    newStudyAppliedWorkflowHint.hidden = !isNewStudy || selectedStudyMasterTab !== "applied-workflows";
  }
  if (els.newStudySystemBtn) els.newStudySystemBtn.disabled = isNewStudy;
  if (els.linkSiteBtn) els.linkSiteBtn.disabled = isNewStudy;
  if (document.getElementById("openSiteMasterFromStudyBtn")) {
    document.getElementById("openSiteMasterFromStudyBtn").disabled = isNewStudy;
  }
  if (document.getElementById("openSystemMasterFromStudyBtn")) {
    document.getElementById("openSystemMasterFromStudyBtn").disabled = isNewStudy;
  }
}

function renderStudyMaster() {
  populateSponsorDatalist();
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
            <span class="study-master-list__meta">${escapeHtml(formatStudyListMeta(study))}</span>
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
    selectedStudyMasterTab = "general";
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
  document.getElementById("indication").value = study.indication;
  document.getElementById("ctmName").value = study.ctmName;
  document.getElementById("studyNotes").value = study.notes;

  renderLinkedSitesTable(study);
  renderStudySystemsTable(study);
  renderStudyAppliedWorkflows(study);
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
        <td>
          <input
            type="text"
            class="inline-edit-input"
            data-edit-link-site-number="${site.id}"
            value="${escapeAttr(site.studySiteNumber || "")}"
            placeholder="예: Site 101"
            aria-label="Site Number"
          />
        </td>
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

  els.linkedSitesTableBody.querySelectorAll("[data-edit-link-site-number]").forEach((input) => {
    input.addEventListener("change", () => {
      handleUpdateLinkSiteNumber(input.dataset.editLinkSiteNumber, input.value);
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      }
    });
  });

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
  selectedStudyMasterTab = "general";
  els.studyMasterEmpty.hidden = true;
  els.studyMasterForm.hidden = false;
  els.studyMasterForm.reset();
  document.getElementById("studyMasterId").value = "";
  applyStudyMasterTabUi();
}

function selectStudyMaster(studyId) {
  selectedStudyMasterId = studyId;
  renderStudyMaster();
  if (isDailyMode() && studyId) {
    const study = StudyMasterStore.getAll().find((s) => s.id === studyId);
    const titleEl = document.getElementById("studyMasterMobileTitle");
    if (titleEl && study) titleEl.textContent = study.protocolNumber || study.studyName;
    setMasterMobileDetail("study-master", true, false);
  }
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
    indication: document.getElementById("indication").value.trim(),
    ctmName: document.getElementById("ctmName").value.trim(),
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
    const created = StudyMasterStore.createStudy({ ...payload, siteIds: [], siteLinks: [], systems: [], taskRules: [], workflows: [], routines: [], customTaskNames: [] });
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

  const available = SiteMasterStore.getAll().filter((site) => !StudyMasterStore.isSiteLinked(study, site.id));
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
  const siteNumber = document.getElementById("linkSiteNumber")?.value.trim() || "";
  if (!studyId || !siteMasterId) return;

  StudyMasterStore.linkSite(studyId, siteMasterId, siteNumber);
  closeLinkSiteModal();
  renderStudyMaster();
  refreshTaskStudySiteSelects();
  alert("Site가 Study에 연결되었습니다.");
}

function handleUpdateLinkSiteNumber(siteMasterId, siteNumber) {
  if (!selectedStudyMasterId) return;
  StudyMasterStore.updateSiteLinkNumber(selectedStudyMasterId, siteMasterId, siteNumber.trim());
  refreshTaskStudySiteSelects();
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
  if (isDailyMode() && systemMasterId) {
    const system = SystemMasterStore.getById(systemMasterId);
    const titleEl = document.getElementById("systemMasterMobileTitle");
    if (titleEl && system) titleEl.textContent = system.systemName;
    setMasterMobileDetail("system-master", true, false);
  }
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
            <span class="study-master-list__name">${escapeHtml(site.standardName || "Site")}</span>
            <span class="study-master-list__meta">${site.piName ? `PI ${escapeHtml(site.piName)}` : ""}${site.piName && site.crcName ? " · " : ""}${site.crcName ? `CRC ${escapeHtml(site.crcName)}` : ""}</span>
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
  if (isDailyMode() && siteId) {
    const site = SiteMasterStore.getById(siteId);
    const titleEl = document.getElementById("siteMasterMobileTitle");
    if (titleEl && site) titleEl.textContent = site.standardName;
    setMasterMobileDetail("site-master", true, false);
  }
}

async function handleSiteMasterSubmit(e) {
  e.preventDefault();

  const entryId = document.getElementById("siteMasterEntryId").value;
  const payload = await buildSiteMasterPayload(entryId);
  const { standardName, aliases } = payload;

  if (!standardName) {
    alert("Standard Site Name을 입력해 주세요.");
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

  SiteMasterStore.create({
    standardName: "서울대학교병원",
    aliases: [],
    piName: "Dr. Choi",
    piPhoneNumber: "02-2345-6789",
    crcName: "Jung CRC",
  });
  SiteMasterStore.create({
    standardName: "연세대학교세브란스병원",
    aliases: [],
    piName: "Dr. Yoon",
    piPhoneNumber: "02-3456-7890",
    crcName: "Han CRC",
  });
  SiteMasterStore.create({
    standardName: "아주대학교병원",
    aliases: [],
    piName: "Dr. Shin",
    crcName: "Kang CRC",
  });
  SiteMasterStore.create({
    standardName: "분당서울대학교병원",
    aliases: [],
    piName: "Dr. Lim",
    crcName: "Oh CRC",
  });
  SiteMasterStore.create({
    standardName: "고려대학교안암병원",
    aliases: [],
    piName: "Dr. Baek",
    crcName: "Song CRC",
  });
}

async function seedStudyMasterIfEmpty() {
  if (StudyMasterStore.getAll().length > 0) return;

  const site101 = SiteMasterStore.findExact("한림성심대학교병원");
  const site102 = SiteMasterStore.findExact("서울대학교병원");
  const site103 = SiteMasterStore.findExact("연세대학교세브란스병원");
  const site201 = SiteMasterStore.findExact("아주대학교병원");
  const site202 = SiteMasterStore.findExact("분당서울대학교병원");
  const site301 = SiteMasterStore.findExact("고려대학교안암병원");

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
    indication: "Oncology",
    ctmName: "Kim CTM",
    notes: "Phase III study",
    siteLinks: [
      { siteMasterId: site101?.id, siteNumber: "Site 101" },
      { siteMasterId: site102?.id, siteNumber: "Site 102" },
      { siteMasterId: site103?.id, siteNumber: "Site 103" },
    ].filter((link) => link.siteMasterId),
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
    indication: "Cardiology",
    ctmName: "Park CTM",
    siteLinks: [
      { siteMasterId: site201?.id, siteNumber: "Site 201" },
      { siteMasterId: site202?.id, siteNumber: "Site 202" },
    ].filter((link) => link.siteMasterId),
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
    indication: "Immunology",
    siteLinks: [{ siteMasterId: site301?.id, siteNumber: "Site 301" }].filter((link) => link.siteMasterId),
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
      notifyCloudSync("tasks");
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

    const before = tasks[idx];
    const merged = {
      ...before,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status && updates.status !== "Completed") {
      delete merged.completedAt;
    }

    const historyEntries = buildTaskChangeHistory(before, merged);
    if (historyEntries.length) {
      merged.history = [...(before.history || []), ...historyEntries].slice(-100);
    } else if (before.history) {
      merged.history = before.history;
    }

    tasks[idx] = normalizeTask(merged);
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
    typeof item.status === "string" &&
    item.task.trim().length > 0
  );
}

function isInboxTask(task) {
  if (!task) return false;
  if (task.inbox === true) return true;
  return !task.study?.trim() && !task.site?.trim() && !task.dueDate?.trim();
}

function normalizeChecklist(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item.text === "string" && item.text.trim())
    .map((item) => ({
      id: item.id || generateId(),
      text: item.text.trim(),
      done: Boolean(item.done),
    }));
}

function normalizeTaskHistory(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item.at === "string")
    .map((item) => ({
      at: item.at,
      field: item.field || "Updated",
      from: item.from ?? "",
      to: item.to ?? "",
    }))
    .slice(-100);
}

function buildTaskChangeHistory(before, after) {
  const entries = [];
  const now = new Date().toISOString();
  const fields = [
    { key: "study", label: "Study" },
    { key: "site", label: "Site" },
    { key: "task", label: "Task" },
    { key: "dueDate", label: "Due Date" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
    { key: "memo", label: "Memo" },
  ];

  fields.forEach(({ key, label }) => {
    const fromVal = before[key] ?? "";
    const toVal = after[key] ?? "";
    if (fromVal !== toVal) {
      entries.push({ at: now, field: label, from: fromVal, to: toVal });
    }
  });

  const beforeChecklist = JSON.stringify(before.checklist || []);
  const afterChecklist = JSON.stringify(after.checklist || []);
  if (beforeChecklist !== afterChecklist) {
    entries.push({ at: now, field: "Checklist", from: "", to: "updated" });
  }

  return entries;
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
    memo: typeof item.memo === "string" ? item.memo : "",
    checklist: normalizeChecklist(item.checklist),
    history: normalizeTaskHistory(item.history),
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

  if (item.status === "Completed" && item.completedAt) {
    normalized.completedAt = item.completedAt;
  }

  const calendarSync = normalizeCalendarSync(item.calendarSync, item);
  if (calendarSync) {
    normalized.calendarSync = calendarSync;
  }

  if (item.inbox) {
    normalized.inbox = true;
  }

  if (item.workflowId) {
    normalized.workflowId = item.workflowId;
  }

  if (item.workflowInstanceId) {
    normalized.workflowInstanceId = item.workflowInstanceId;
  }

  if (item.workflowRecordId) {
    normalized.workflowRecordId = item.workflowRecordId;
  }

  if (Number.isFinite(Number(item.stepIndex)) && Number(item.stepIndex) > 0) {
    normalized.stepIndex = Number(item.stepIndex);
  }

  if (item.routineId) {
    normalized.routineId = item.routineId;
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
  const siteLabel = getTaskSiteLabelForCalendar(task);
  return siteLabel ? `[${task.study}] ${task.task} - ${siteLabel}` : `[${task.study}] ${task.task}`;
}

function buildGoogleCalendarEventDescription(task) {
  const siteLabel = getTaskSiteLabelForCalendar(task);
  const siteNumber = getTaskStudySiteNumber(task);
  return [
    `Study: ${task.study}`,
    siteNumber ? `Site No: ${siteNumber}` : null,
    siteLabel ? `Site: ${siteLabel}` : null,
    `Task: ${task.task}`,
    `Priority: ${task.priority}`,
    `Task ID: ${task.id}`,
  ]
    .filter(Boolean)
    .join("\n");
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
    migrateTasksToWorkflowInstances();
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
  if (!dueDateStr) return Infinity;
  const today = getToday();
  const due = parseDate(dueDateStr);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

function isActive(task) {
  return task.status !== "Completed" && task.status !== "Cancelled";
}

const APP_VERSION = "1.1.0";
const APP_BUILD = "95";
const FIREBASE_SDK_VERSION = "10.14.1";

const SETTINGS_PANEL_TITLES = {
  main: "Settings",
  calendar: "Google Calendar",
  notification: "Notification",
  appearance: "Appearance",
  data: "Data",
  about: "About",
};

let currentSettingsPanel = "main";
let selectedTaskId = null;
let taskDetailChecklistDraft = [];

const UI_SCALE_PRESETS = {
  xsmall: 0.8,
  small: 0.9,
  normal: 1,
  large: 1.1,
  xlarge: 1.2,
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
        taskViewMode: parsed.taskViewMode === "list" ? "list" : "card",
      };
    } catch {
      return { size: "normal", taskSiteInfoExpanded: false, taskViewMode: "card" };
    }
  },

  save(partial) {
    const next = { ...this.load(), ...partial };
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(next));
    notifyCloudSync("uiSettings");
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

  getTaskViewMode() {
    return this.load().taskViewMode === "list" ? "list" : "card";
  },

  setTaskViewMode(mode) {
    this.save({ taskViewMode: mode === "list" ? "list" : "card" });
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
        return {
          dueReminder: true,
          overdueReminder: true,
          d1Reminder: true,
          permissionRequested: false,
          sentNotifications: {},
        };
      }

      const parsed = JSON.parse(raw);
      const legacyEnabled = parsed.enabled !== false;
      const legacyDueDate =
        parsed.dueDateReminder !== undefined ? Boolean(parsed.dueDateReminder) : legacyEnabled;
      return {
        dueReminder:
          parsed.dueReminder !== undefined ? Boolean(parsed.dueReminder) : legacyDueDate,
        overdueReminder:
          parsed.overdueReminder !== undefined ? Boolean(parsed.overdueReminder) : legacyDueDate,
        d1Reminder: parsed.d1Reminder !== undefined ? Boolean(parsed.d1Reminder) : legacyEnabled,
        permissionRequested: Boolean(parsed.permissionRequested),
        sentNotifications:
          parsed.sentNotifications && typeof parsed.sentNotifications === "object"
            ? parsed.sentNotifications
            : {},
      };
    } catch {
      return {
        dueReminder: true,
        overdueReminder: true,
        d1Reminder: true,
        permissionRequested: false,
        sentNotifications: {},
      };
    }
  },

  save(settings) {
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
    notifyCloudSync("reminderSettings");
  },

  isDueReminderEnabled() {
    return this.load().dueReminder;
  },

  isOverdueReminderEnabled() {
    return this.load().overdueReminder;
  },

  isD1ReminderEnabled() {
    return this.load().d1Reminder;
  },

  isAnyEnabled() {
    const settings = this.load();
    return settings.dueReminder || settings.overdueReminder || settings.d1Reminder;
  },

  setDueReminder(enabled) {
    const settings = this.load();
    settings.dueReminder = enabled;
    this.save(settings);
  },

  setOverdueReminder(enabled) {
    const settings = this.load();
    settings.overdueReminder = enabled;
    this.save(settings);
  },

  setD1Reminder(enabled) {
    const settings = this.load();
    settings.d1Reminder = enabled;
    this.save(settings);
  },

  isReminderTypeEnabled(reminderType) {
    if (reminderType === "d-1") return this.isD1ReminderEnabled();
    if (reminderType === "d-0") return this.isDueReminderEnabled();
    if (reminderType === "overdue") return this.isOverdueReminderEnabled();
    return false;
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
  if (!ReminderSettingsStore.isAnyEnabled()) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const reminderItems = getReminderTasks()
    .map((task) => ({ task, reminderType: getTaskReminderType(task) }))
    .filter(({ reminderType }) => ReminderSettingsStore.isReminderTypeEnabled(reminderType))
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
  if (!ReminderSettingsStore.isAnyEnabled()) {
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

  const enabled = ReminderSettingsStore.isAnyEnabled();
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

function formatSettingsDateTime(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  if (isToday) return `Today ${hh}:${mm}`;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function getSettingsPanelElement(panel) {
  const map = {
    main: els.settingsPanelMain,
    calendar: els.settingsPanelCalendar,
    notification: els.settingsPanelNotification,
    appearance: els.settingsPanelAppearance,
    data: els.settingsPanelData,
    about: els.settingsPanelAbout,
  };
  return map[panel] || null;
}

function openSettingsPanel(panel = "main") {
  currentSettingsPanel = panel;
  const panelKeys = ["main", "calendar", "notification", "appearance", "data", "about"];
  panelKeys.forEach((key) => {
    const el = getSettingsPanelElement(key);
    if (!el) return;
    if (key === panel) {
      el.removeAttribute("hidden");
    } else {
      el.setAttribute("hidden", "");
    }
  });

  if (els.settingsBackBtn) els.settingsBackBtn.hidden = panel === "main";
  if (els.settingsTitle) {
    els.settingsTitle.textContent = SETTINGS_PANEL_TITLES[panel] || SETTINGS_PANEL_TITLES.main;
  }
  if (els.settingsModal?.querySelector(".settings-body")) {
    els.settingsModal.querySelector(".settings-body").scrollTop = 0;
  }

  if (panel === "calendar") updateCalendarSyncUi();
  if (panel === "notification") updateNotificationSettingsUi();
  if (panel === "appearance" && els.uiScaleSelect) {
    els.uiScaleSelect.value = UiSettingsStore.getSize();
  }
  if (panel === "data") updateDataSettingsUi();
  if (panel === "about") updateAboutSettingsUi();
}

function updateCalendarSyncUi() {
  if (!window.CalendarSyncManager) return;

  const configured = CalendarSyncManager.isConfigured();
  const onFileProtocol = window.location.protocol === "file:";
  const connected = CalendarSyncManager.isConnected();
  const syncEnabled = CalendarSyncManager.isCalendarSyncEnabled();
  const settings = CalendarSyncManager.getSettings();

  if (els.calendarSyncToggle) {
    els.calendarSyncToggle.checked = syncEnabled;
    els.calendarSyncToggle.disabled = onFileProtocol || !configured;
  }

  if (els.calendarSyncStatus) {
    els.calendarSyncStatus.textContent = connected ? "Connected" : "Not Connected";
    els.calendarSyncStatus.className = connected
      ? "settings-meta-row__value settings-meta-row__value--ok"
      : "settings-meta-row__value";
  }

  if (els.calendarLastSync) {
    els.calendarLastSync.textContent = formatSettingsDateTime(settings.lastSyncAt);
  }

  if (els.calendarReconnectBtn) {
    els.calendarReconnectBtn.hidden = connected || onFileProtocol || !configured;
  }

  if (els.calendarDisconnectBtn) {
    els.calendarDisconnectBtn.hidden = !connected || onFileProtocol;
  }

  if (els.calendarSetupHint) {
    if (onFileProtocol) {
      els.calendarSetupHint.hidden = false;
      els.calendarSetupHint.textContent =
        "현재 file:// 로 열려 있어 Calendar Sync가 동작하지 않습니다. Live Server 등으로 http://localhost 에서 실행해 주세요.";
    } else if (!configured) {
      els.calendarSetupHint.hidden = false;
      els.calendarSetupHint.innerHTML =
        'Calendar Sync를 사용하려면 <code>calendar-config.js</code>의 <code>google.clientId</code>를 설정한 뒤 페이지를 새로고침하세요.';
    } else {
      els.calendarSetupHint.hidden = true;
      els.calendarSetupHint.textContent = "";
    }
  }
}

function syncAllEligibleTasksToCalendar() {
  if (!window.CalendarSyncManager?.isCalendarSyncActive()) return;
  tasks.forEach((task) => {
    if (task.dueDate && isActive(task)) {
      CalendarSyncManager.scheduleSyncTask(task.id);
    }
  });
}

async function handleCalendarSyncToggleChange() {
  if (!window.CalendarSyncManager || !els.calendarSyncToggle) return;

  const wantEnabled = els.calendarSyncToggle.checked;

  if (!wantEnabled) {
    CalendarSyncManager.setCalendarSyncEnabled(false);
    updateCalendarSyncUi();
    return;
  }

  if (!CalendarSyncManager.isConfigured()) {
    els.calendarSyncToggle.checked = false;
    alert(
      "Calendar Sync를 사용하려면 calendar-config.js에 Google Client ID를 설정해 주세요."
    );
    return;
  }

  if (window.location.protocol === "file:") {
    els.calendarSyncToggle.checked = false;
    alert("Calendar Sync는 http://localhost 환경에서만 사용할 수 있습니다.");
    return;
  }

  els.calendarSyncToggle.disabled = true;
  try {
    if (!CalendarSyncManager.isConnected()) {
      await CalendarSyncManager.connect(true);
    }
    CalendarSyncManager.setCalendarSyncEnabled(true);
    syncAllEligibleTasksToCalendar();
    updateCalendarSyncUi();
  } catch (err) {
    CalendarSyncManager.setCalendarSyncEnabled(false);
    els.calendarSyncToggle.checked = false;
    updateCalendarSyncUi();
    alert(`Calendar Sync 연결에 실패했습니다.\n\n${err.message || err}`);
  } finally {
    if (els.calendarSyncToggle) els.calendarSyncToggle.disabled = false;
    updateCalendarSyncUi();
  }
}

async function handleCalendarReconnect() {
  if (!window.CalendarSyncManager) return;

  if (els.calendarReconnectBtn) {
    els.calendarReconnectBtn.disabled = true;
    els.calendarReconnectBtn.textContent = "연결 중…";
  }

  try {
    await CalendarSyncManager.connect(true);
    if (CalendarSyncManager.isCalendarSyncEnabled()) {
      syncAllEligibleTasksToCalendar();
    }
    updateCalendarSyncUi();
  } catch (err) {
    alert(`Calendar Sync 재연결에 실패했습니다.\n\n${err.message || err}`);
    updateCalendarSyncUi();
  } finally {
    if (els.calendarReconnectBtn) {
      els.calendarReconnectBtn.disabled = false;
      els.calendarReconnectBtn.textContent = "Reconnect";
    }
  }
}

async function handleCalendarDisconnect() {
  if (!window.CalendarSyncManager) return;
  if (!confirm("Google Calendar 연결을 해제할까요?")) return;

  CalendarSyncManager.setCalendarSyncEnabled(false);
  CalendarSyncManager.disconnect();
  updateCalendarSyncUi();
}

function updateNotificationSettingsUi() {
  if (els.reminderDueToggle) {
    els.reminderDueToggle.checked = ReminderSettingsStore.isDueReminderEnabled();
  }
  if (els.reminderOverdueToggle) {
    els.reminderOverdueToggle.checked = ReminderSettingsStore.isOverdueReminderEnabled();
  }
  if (els.reminderPermissionStatus) {
    els.reminderPermissionStatus.textContent = getReminderPermissionLabel();
  }
}

async function handleReminderSettingsChange() {
  ReminderSettingsStore.setDueReminder(Boolean(els.reminderDueToggle?.checked));
  ReminderSettingsStore.setOverdueReminder(Boolean(els.reminderOverdueToggle?.checked));

  if (ReminderSettingsStore.isAnyEnabled()) {
    await requestReminderPermission();
    showDesktopReminders();
  }

  updateReminderStatusBadge();
  if (els.reminderPermissionStatus) {
    els.reminderPermissionStatus.textContent = getReminderPermissionLabel();
  }
}

function estimateLocalStorageUsage() {
  let bytes = 0;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key) || "";
    bytes += (key.length + value.length) * 2;
  }
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function updateAccountSettingsUi() {
  if (!els.settingsAccountCard) return;

  const configured = window.CloudSyncManager?.isConfigured?.();
  const signedIn = window.CloudSyncManager?.isSignedIn?.();
  const user = window.CloudSyncManager?.getCurrentUser?.() || null;

  if (!configured || !signedIn || !user) {
    els.settingsAccountCard.hidden = true;
    return;
  }

  els.settingsAccountCard.hidden = false;
  if (els.settingsAccountEmail) {
    els.settingsAccountEmail.textContent = user.displayName
      ? `${user.displayName} (${user.email || ""})`
      : user.email || "Google 계정";
  }
  if (els.settingsAccountStatus) {
    els.settingsAccountStatus.textContent = CloudSyncManager.requiresAuth?.()
      ? "클라우드에 연결됨 · PC와 휴대폰 데이터 동기화 중"
      : "클라우드에 연결됨";
  }
}

async function handleCloudSignOut() {
  if (!window.CloudSyncManager) return;
  if (
    !confirm(
      "Google 계정에서 로그아웃할까요?\n\n다른 기기와의 클라우드 동기화가 중단되며, 로그인 화면으로 돌아갑니다."
    )
  ) {
    return;
  }

  try {
    await CloudSyncManager.signOut();
    closeSettingsModal();
    if (CloudSyncManager.requiresAuth?.()) {
      showAuthGate();
    }
  } catch (err) {
    console.error("Sign out failed:", err);
    alert("로그아웃에 실패했습니다.");
  }
}

function updateDataSettingsUi() {
  if (els.settingsFirebaseSyncStatus) {
    if (!window.CloudSyncManager || !CloudSyncManager.isConfigured()) {
      els.settingsFirebaseSyncStatus.textContent = "Not configured";
      els.settingsFirebaseSyncStatus.className = "settings-meta-row__value";
    } else if (CloudSyncManager.isSignedIn()) {
      els.settingsFirebaseSyncStatus.textContent = "Connected";
      els.settingsFirebaseSyncStatus.className =
        "settings-meta-row__value settings-meta-row__value--ok";
    } else {
      els.settingsFirebaseSyncStatus.textContent = "Local only";
      els.settingsFirebaseSyncStatus.className = "settings-meta-row__value";
    }
  }

  if (els.settingsStorageUsage) {
    els.settingsStorageUsage.textContent = estimateLocalStorageUsage();
  }
}

function updateAboutSettingsUi() {
  if (els.settingsAppVersion) els.settingsAppVersion.textContent = APP_VERSION;
  if (els.settingsAppBuild) els.settingsAppBuild.textContent = APP_BUILD;
}

async function handleResetLocalCache() {
  if (!confirm("로컬 캐시를 초기화할까요? 앱이 새로고침됩니다.")) return;

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.startsWith("cra-task-manager-")).map((key) => caches.delete(key))
      );
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    location.reload();
  } catch (err) {
    alert(`캐시 초기화에 실패했습니다.\n\n${err.message || err}`);
  }
}

function handleUiScaleChange() {
  if (!els.uiScaleSelect) return;
  UiSettingsStore.setSize(els.uiScaleSelect.value);
  applyUiScale();
}

function openSettingsModal(panel = "main") {
  openSettingsPanel(panel);
  if (window.CalendarSyncManager) {
    CalendarSyncManager.reconcileAuthWithSettings();
    updateCalendarSyncUi();
  }
  updateNotificationSettingsUi();
  updateDataSettingsUi();
  updateAboutSettingsUi();
  updateAccountSettingsUi();
  if (els.uiScaleSelect) {
    els.uiScaleSelect.value = UiSettingsStore.getSize();
  }
  els.settingsModal.hidden = false;
  lockSettingsBodyScroll();
}

function closeSettingsModal() {
  els.settingsModal.hidden = true;
  unlockSettingsBodyScroll();
  openSettingsPanel("main");
}

let settingsBodyOverflowBackup = "";

function lockSettingsBodyScroll() {
  settingsBodyOverflowBackup = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  document.body.classList.add("body--settings-open");
}

function unlockSettingsBodyScroll() {
  document.body.style.overflow = settingsBodyOverflowBackup || "";
  document.body.classList.remove("body--settings-open");
  settingsBodyOverflowBackup = "";
}

function getDueUrgency(dueDateStr, status) {
  if (status === "Completed" || status === "Cancelled") return "completed";
  if (!dueDateStr) return "normal";
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

function formatDueDisplay(task) {
  if (!task?.dueDate) return "Due 미정";
  const suffix = formatDueDaySuffix(task.dueDate);
  return `${task.dueDate} (${suffix})`;
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
  const instanceFields = parentTask.workflowInstanceId
    ? {
        workflowInstanceId: parentTask.workflowInstanceId,
        workflowRecordId: parentTask.workflowRecordId || parentTask.workflowId || null,
        workflowId: parentTask.workflowRecordId || parentTask.workflowId || null,
      }
    : {};

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
      ...instanceFields,
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
  const study = form.get("study")?.trim() || "";
  const site = form.get("site")?.trim() || "";
  const taskName = form.get("task")?.trim();
  const dueDate = form.get("dueDate") || "";

  if (!taskName) {
    alert("Task를 입력해 주세요.");
    return;
  }

  const priority = form.get("priority")?.trim() || addTaskPresetPriority || "Medium";

  if (study || site) {
    if (!validateStudySiteSelection(study, site)) return;
  }

  const newTask = {
    id: generateId(),
    study,
    site: site ? getStandardSiteName(site) : "",
    task: taskName,
    dueDate,
    status: DEFAULT_STATUS,
    priority,
    createdAt: new Date().toISOString(),
  };

  if (!study && !site && !dueDate) {
    newTask.inbox = true;
  }

  const followUpParent = pendingFollowUpParentTask;
  if (followUpParent) {
    newTask.parentTaskId = followUpParent.id;
    pendingFollowUpParentTask = null;
    updateAddTaskFollowUpContextPanel();
    persistPendingTaskDraft(newTask);
    return;
  }

  const appliedMatch = findAppliedWorkflowMatchForTask(taskName, study);
  if (appliedMatch) {
    persistTaskDraftWithWorkflow(newTask, appliedMatch.workflow, appliedMatch.ref, {
      toastMessage: "Workflow에 자동 연결되었습니다.",
    });
    return;
  }

  const suggestions = findUnappliedWorkflowSuggestions(taskName, study);
  if (suggestions.length > 0) {
    openWorkflowSuggestModal(suggestions, newTask);
    return;
  }

  persistPendingTaskDraft(newTask);
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
  if (editStudy || editSite) {
    if (!validateStudySiteSelection(editStudy, editSite, existing)) return;
  }

  const updatePayload = {
    study: editStudy,
    site: editSite ? getStandardSiteName(editSite) : "",
    task: newTaskName,
    dueDate: newDueDate,
    status: newStatus,
    priority: document.getElementById("editPriority").value,
    memo: document.getElementById("editMemo")?.value ?? "",
    checklist: taskDetailChecklistDraft.map((item) => ({ ...item })),
  };

  if (newStatus === "Completed") {
    updatePayload.completedAt = existing.completedAt || new Date().toISOString();
  }

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

  let calendarCreates = [];
  if (!wasCompleted && newStatus === "Completed") {
    const completionEffects = handleTaskCompletedEffects(id);
    calendarCreates = completionEffects.calendarCreates || [];
    if (currentViewName === "dashboard") {
      closeTaskDetail();
    } else {
      const updatedTask = tasks.find((t) => t.id === id);
      if (updatedTask) populateTaskDetailForm(updatedTask);
    }
  } else {
    const updatedTask = tasks.find((t) => t.id === id);
    if (updatedTask) populateTaskDetailForm(updatedTask);
  }
  renderAll();

  if (window.CalendarSyncManager) {
    CalendarSyncManager.onTaskUpdated(id);
    if (recalcSubtasks || cancelSubtasks) {
      getSubtasks(id).forEach((subtask) => CalendarSyncManager.onTaskUpdated(subtask.id));
    }
    if (calendarCreates.length > 0) {
      calendarCreates.forEach((subtaskId) => CalendarSyncManager.onTaskCreated(subtaskId));
    }
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
    if (selectedTaskId && idsToRemove.includes(selectedTaskId)) closeTaskDetail();
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
  if (selectedTaskId === id) closeTaskDetail();
  renderAll();
}

function populateTaskDetailForm(task) {
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
  if (document.getElementById("editMemo")) {
    document.getElementById("editMemo").value = task.memo || "";
  }

  taskDetailChecklistDraft = (task.checklist || []).map((item) => ({ ...item }));
  renderTaskDetailChecklist();
  renderTaskDetailHistory(task);
  renderTaskDetailLinks(task);

  if (els.taskDetailTitle) {
    els.taskDetailTitle.textContent = task.task || "Task";
  }

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
}

function openTaskDetail(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  closeDashboardWorkflowDetail();
  selectedTaskId = id;
  populateTaskDetailForm(task);

  if (els.taskDetailPanel) els.taskDetailPanel.hidden = false;
  document.body.classList.add("task-detail-open");
  if (isDailyMode()) {
    document.body.classList.add("task-detail-mobile-open");
    lockTaskDetailBodyScroll();
  }

  if (els.taskDetailBackBtn) els.taskDetailBackBtn.hidden = !isDailyMode();
  if (els.closeTaskDetailBtn) els.closeTaskDetailBtn.hidden = isDailyMode();
  updateTaskListSelection();
  els.taskDetailPanel?.querySelector(".task-detail-panel__scroll")?.scrollTo(0, 0);
}

function closeTaskDetail() {
  selectedTaskId = null;
  taskDetailChecklistDraft = [];
  if (els.taskDetailPanel) els.taskDetailPanel.hidden = true;
  document.body.classList.remove("task-detail-open", "task-detail-mobile-open");
  unlockTaskDetailBodyScroll();
  els.editForm?.reset();
  setEditSiteInfoExpanded(false);
  if (els.editSiteInfoToggleBtn) els.editSiteInfoToggleBtn.hidden = true;
  if (els.editSiteMasterHint) els.editSiteMasterHint.hidden = true;
  updateTaskListSelection();
}

let taskDetailBodyOverflowBackup = "";

function lockTaskDetailBodyScroll() {
  taskDetailBodyOverflowBackup = document.body.style.overflow;
  document.body.style.overflow = "hidden";
}

function unlockTaskDetailBodyScroll() {
  document.body.style.overflow = taskDetailBodyOverflowBackup || "";
  taskDetailBodyOverflowBackup = "";
}

function updateTaskListSelection() {
  document.querySelectorAll("[data-task-id]").forEach((el) => {
    const isTaskEditSelected = selectedTaskId && el.dataset.taskId === selectedTaskId;
    const isDashboardSelected = dashboardWorkflowTaskId && el.dataset.taskId === dashboardWorkflowTaskId;
    el.classList.toggle("is-selected", isTaskEditSelected);
    if (el.classList.contains("dash-item")) {
      el.classList.toggle("dash-item--selected", Boolean(isDashboardSelected));
    }
  });
  document.querySelectorAll(".mobile-task-card[data-edit]").forEach((el) => {
    el.classList.toggle("is-selected", selectedTaskId && el.dataset.edit === selectedTaskId);
  });
}

function renderTaskDetailChecklist() {
  if (!els.taskDetailChecklist) return;
  if (!taskDetailChecklistDraft.length) {
    els.taskDetailChecklist.innerHTML = '<li class="task-checklist__empty">항목 없음</li>';
    return;
  }

  els.taskDetailChecklist.innerHTML = taskDetailChecklistDraft
    .map(
      (item) => `
    <li class="task-checklist__item">
      <label class="task-checklist__label">
        <input type="checkbox" data-checklist-id="${escapeAttr(item.id)}" ${item.done ? "checked" : ""} />
        <span class="task-checklist__text${item.done ? " task-checklist__text--done" : ""}">${escapeHtml(item.text)}</span>
      </label>
      <button type="button" class="task-checklist__remove" data-remove-checklist="${escapeAttr(item.id)}" aria-label="삭제">&times;</button>
    </li>
  `
    )
    .join("");
}

function renderTaskDetailHistory(task) {
  if (!els.taskDetailHistory) return;
  const history = task?.history || [];
  if (!history.length) {
    els.taskDetailHistory.innerHTML = '<li class="task-history__empty">변경 이력 없음</li>';
    return;
  }

  els.taskDetailHistory.innerHTML = [...history]
    .reverse()
    .map((entry) => {
      const when = formatSettingsDateTime(entry.at);
      if (entry.field === "Checklist") {
        return `<li class="task-history__item"><span class="task-history__when">${escapeHtml(when)}</span> Checklist updated</li>`;
      }
      return `<li class="task-history__item"><span class="task-history__when">${escapeHtml(when)}</span> ${escapeHtml(entry.field)}: ${escapeHtml(entry.from || "—")} → ${escapeHtml(entry.to || "—")}</li>`;
    })
    .join("");
}

function addTaskChecklistItem() {
  const text = els.taskChecklistNewInput?.value.trim();
  if (!text) return;
  taskDetailChecklistDraft.push({ id: generateId(), text, done: false });
  if (els.taskChecklistNewInput) els.taskChecklistNewInput.value = "";
  renderTaskDetailChecklist();
}

function handleTaskChecklistClick(event) {
  const removeBtn = event.target.closest("[data-remove-checklist]");
  if (!removeBtn) return;
  const itemId = removeBtn.dataset.removeChecklist;
  taskDetailChecklistDraft = taskDetailChecklistDraft.filter((item) => item.id !== itemId);
  renderTaskDetailChecklist();
}

function handleTaskChecklistChange(event) {
  const checkbox = event.target.closest('input[type="checkbox"][data-checklist-id]');
  if (!checkbox) return;
  const item = taskDetailChecklistDraft.find((entry) => entry.id === checkbox.dataset.checklistId);
  if (item) item.done = checkbox.checked;
  renderTaskDetailChecklist();
}

function openEditModal(id) {
  openTaskDetail(id);
}

function closeModal() {
  closeTaskDetail();
}

function statusClass(status) {
  const map = {
    Open: "open",
    "In Progress": "in-progress",
    "On Hold": "on-hold",
    Completed: "completed",
    Cancelled: "cancelled",
  };
  return map[status] || "open";
}

function renderInlinePriorityDropdown(task) {
  const currentClass = priorityClass(task.priority);
  const options = INLINE_PRIORITY_OPTIONS.map(
    (priority) => `
      <button type="button" class="priority-dropdown__option${priority === task.priority ? " priority-dropdown__option--active" : ""}" data-priority-option data-task-id="${escapeAttr(task.id)}" data-priority="${escapeAttr(priority)}" role="option">
        ${escapeHtml(priority)}
      </button>
    `
  ).join("");

  return `
    <div class="priority-dropdown" data-priority-dropdown="${escapeAttr(task.id)}">
      <button type="button" class="priority-badge priority-badge--${currentClass} priority-dropdown__trigger" data-priority-trigger="${escapeAttr(task.id)}" aria-haspopup="listbox" aria-expanded="false">
        ${escapeHtml(task.priority)} <span class="status-dropdown__caret" aria-hidden="true">▼</span>
      </button>
      <div class="priority-dropdown__menu" role="listbox" hidden>
        ${options}
      </div>
    </div>
  `;
}

function closeAllPriorityDropdowns() {
  document.querySelectorAll(".priority-dropdown__menu").forEach((menu) => {
    menu.hidden = true;
  });
  document.querySelectorAll("[data-priority-trigger]").forEach((btn) => {
    btn.setAttribute("aria-expanded", "false");
  });
}

function bindPriorityDropdowns(container = els.taskCardList) {
  if (!container) return;

  container.querySelectorAll("[data-priority-trigger]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const menu = btn.closest(".priority-dropdown")?.querySelector(".priority-dropdown__menu");
      if (!menu) return;
      const willOpen = menu.hidden;
      closeAllPriorityDropdowns();
      closeAllStatusDropdowns();
      if (willOpen) {
        menu.hidden = false;
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  container.querySelectorAll("[data-priority-option]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      applyTaskPriorityChange(btn.dataset.taskId, btn.dataset.priority);
      closeAllPriorityDropdowns();
    });
  });
}

function applyTaskPriorityChange(taskId, newPriority) {
  if (!PRIORITIES.includes(newPriority)) return;
  const existing = tasks.find((t) => t.id === taskId);
  if (!existing || existing.priority === newPriority) return;
  if (!TaskStore.update(taskId, { priority: newPriority })) return;
  renderAll();
}

function formatTaskFilterDateHint(filter) {
  const today = getToday();
  if (filter === "today") return formatShortDisplayDate(today);
  if (filter === "d1") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatShortDisplayDate(tomorrow);
  }
  if (filter === "week") {
    const { start, end } = getWeekRange();
    return `${formatShortDisplayDate(start)}–${formatShortDisplayDate(end)}`;
  }
  return "";
}

function formatShortDisplayDate(date) {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d || Number.isNaN(d.getTime())) return "";
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}

function getStatusOptionsFromElement(dropdownEl) {
  const raw = dropdownEl?.dataset.statusOptions;
  if (!raw) return INLINE_STATUS_OPTIONS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : INLINE_STATUS_OPTIONS;
  } catch {
    return INLINE_STATUS_OPTIONS;
  }
}

function renderInlineStatusDropdown(task, options = {}) {
  const compact = Boolean(options.compact);
  const statusOptions = options.statuses || INLINE_STATUS_OPTIONS;
  const currentClass = statusClass(task.status);
  const optionsHtml = statusOptions.map(
    (status) => `
      <button type="button" class="status-dropdown__option${status === task.status ? " status-dropdown__option--active" : ""}" data-status-option data-task-id="${escapeAttr(task.id)}" data-status="${escapeAttr(status)}" role="option" aria-selected="${status === task.status}">
        ${escapeHtml(status)}
      </button>
    `
  ).join("");

  const triggerClass = compact
    ? `status-chip status-chip--${currentClass} status-dropdown__trigger status-dropdown__trigger--compact`
    : `status-badge status-badge--${currentClass} status-dropdown__trigger`;
  const caret = compact
    ? '<span class="status-dropdown__caret status-dropdown__caret--compact" aria-hidden="true">▾</span>'
    : '<span class="status-dropdown__caret" aria-hidden="true">▼</span>';

  return `
    <div class="status-dropdown${compact ? " status-dropdown--compact" : ""}" data-status-dropdown="${escapeAttr(task.id)}" data-status-options="${escapeAttr(JSON.stringify(statusOptions))}">
      <button type="button" class="${triggerClass}" data-status-trigger="${escapeAttr(task.id)}" aria-haspopup="listbox" aria-expanded="false">
        ${escapeHtml(task.status)} ${caret}
      </button>
      <div class="status-dropdown__menu" role="listbox" hidden>
        ${optionsHtml}
      </div>
    </div>
  `;
}

function closeAllStatusDropdowns() {
  document.querySelectorAll(".status-dropdown__menu").forEach((menu) => {
    menu.hidden = true;
  });
  document.querySelectorAll("[data-status-trigger]").forEach((btn) => {
    btn.setAttribute("aria-expanded", "false");
  });
  closeStatusPickerPortal();
  closeAllPriorityDropdowns();
  closeAllTaskMoreMenus();
}

function handleStatusPickerDismiss() {
  if (activeStatusPicker) closeAllStatusDropdowns();
}

function closeStatusPickerPortal() {
  const portal = document.getElementById("statusPickerPortal");
  if (portal) {
    portal.hidden = true;
    portal.innerHTML = "";
  }
  if (activeStatusPicker?.trigger) {
    activeStatusPicker.trigger.setAttribute("aria-expanded", "false");
  }
  activeStatusPicker = null;
}

function shouldUseStatusPickerPortal(triggerBtn) {
  return Boolean(
    triggerBtn?.closest(
      "#viewDashboard, .dash-list, .mobile-daily, .mobile-task-feed, .task-card-list, #dashboardWorkflowPanel"
    )
  );
}

function positionStatusPickerPortal(triggerBtn, portal) {
  portal.style.visibility = "hidden";
  portal.hidden = false;

  const rect = triggerBtn.getBoundingClientRect();
  const menuHeight = portal.offsetHeight || 200;
  const viewportH = window.innerHeight;
  const openUpward = rect.bottom + menuHeight + 8 > viewportH && rect.top > menuHeight + 8;

  portal.style.position = "fixed";
  portal.style.zIndex = "1200";
  portal.style.minWidth = `${Math.max(rect.width, 148)}px`;

  if (openUpward) {
    portal.style.top = "auto";
    portal.style.bottom = `${viewportH - rect.top + 4}px`;
  } else {
    portal.style.top = `${rect.bottom + 4}px`;
    portal.style.bottom = "auto";
  }

  const maxLeft = window.innerWidth - portal.offsetWidth - 8;
  portal.style.left = `${Math.max(8, Math.min(rect.left, maxLeft))}px`;
  portal.style.visibility = "visible";
}

function openStatusPickerPortal(taskId, triggerBtn) {
  closeStatusPickerPortal();
  const task = tasks.find((t) => t.id === taskId);
  if (!task || !triggerBtn) return;

  let portal = document.getElementById("statusPickerPortal");
  if (!portal) {
    portal = document.createElement("div");
    portal.id = "statusPickerPortal";
    portal.className = "status-picker-portal";
    portal.setAttribute("role", "listbox");
    document.body.appendChild(portal);
  }

  portal.innerHTML = getStatusOptionsFromElement(triggerBtn.closest(".status-dropdown")).map(
    (status) => `
      <button type="button" class="status-picker-portal__option${status === task.status ? " status-picker-portal__option--active" : ""}" data-status-option data-task-id="${escapeAttr(taskId)}" data-status="${escapeAttr(status)}" role="option">
        ${escapeHtml(status)}
      </button>
    `
  ).join("");

  triggerBtn.setAttribute("aria-expanded", "true");
  activeStatusPicker = { taskId, trigger: triggerBtn };
  positionStatusPickerPortal(triggerBtn, portal);

  portal.querySelectorAll("[data-status-option]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      applyTaskStatusChange(btn.dataset.taskId, btn.dataset.status);
      closeAllStatusDropdowns();
    });
  });
}

function bindStatusDropdowns(container = els.taskCardList) {
  if (!container) return;

  container.querySelectorAll("[data-status-trigger]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const taskId = btn.dataset.statusTrigger;
      const usePortal = shouldUseStatusPickerPortal(btn);

      if (usePortal) {
        const portal = document.getElementById("statusPickerPortal");
        const isOpen = activeStatusPicker?.trigger === btn && portal && !portal.hidden;
        closeAllStatusDropdowns();
        if (!isOpen) openStatusPickerPortal(taskId, btn);
        return;
      }

      const menu = btn.closest(".status-dropdown")?.querySelector(".status-dropdown__menu");
      if (!menu) return;

      const willOpen = menu.hidden;
      closeAllStatusDropdowns();
      if (willOpen) {
        menu.hidden = false;
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  container.querySelectorAll("[data-status-option]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      applyTaskStatusChange(btn.dataset.taskId, btn.dataset.status);
      closeAllStatusDropdowns();
    });
  });
}

function applyTaskStatusChange(taskId, newStatus) {
  const existing = tasks.find((task) => task.id === taskId);
  if (!existing || existing.status === newStatus) return;

  const wasCompleted = existing.status === "Completed";
  const updatePayload = { status: newStatus };

  if (newStatus === "Completed") {
    updatePayload.completedAt = existing.completedAt || new Date().toISOString();
  }

  if (!TaskStore.update(taskId, updatePayload)) return;

  let calendarCreates = [];
  if (!wasCompleted && newStatus === "Completed") {
    const completionEffects = handleTaskCompletedEffects(taskId);
    calendarCreates = completionEffects.calendarCreates || [];
    if (currentViewName === "dashboard" && selectedTaskId === taskId) {
      closeTaskDetail();
    }
  }

  renderAll();

  if (window.CalendarSyncManager) {
    CalendarSyncManager.onTaskUpdated(taskId);
    if (calendarCreates.length > 0) {
      calendarCreates.forEach((subtaskId) => CalendarSyncManager.onTaskCreated(subtaskId));
    }
  }
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
  const aDue = a.dueDate ? parseDate(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  const bDue = b.dueDate ? parseDate(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  return aDue - bDue;
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

function getTodayProgressStats() {
  const todayStr = toDateString(getToday());
  const todayDueTasks = tasks.filter((t) => !isInboxTask(t) && t.dueDate === todayStr);
  const total = todayDueTasks.length;
  const completed = todayDueTasks.filter(isCompleted).length;
  const remaining = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, remaining, rate };
}

function getDashboardStats() {
  const todayStr = toDateString(getToday());
  const workTasks = tasks.filter((t) => !isInboxTask(t));
  const activeTasks = workTasks.filter(isActive);
  const total = workTasks.length;
  const completed = workTasks.filter(isCompleted).length;
  const overdue = activeTasks.filter((t) => daysUntilDue(t.dueDate) < 0).length;
  const weekDue = activeTasks.filter((t) => isDueThisWeek(t.dueDate)).length;
  const weekPrep = getDashboardWeekPrepTasks().length;
  const todayDue = activeTasks.filter((t) => t.dueDate === todayStr).length;
  const nextWeekDue = getDashboardNextWeekTasks().length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, overdue, weekDue, weekPrep, todayDue, nextWeekDue, completionRate };
}

function matchesTaskQuickFilter(task) {
  if (!taskQuickFilter) {
    return isActive(task);
  }

  if (taskQuickFilter === "all") return true;

  if (taskQuickFilter === "today") {
    return isActive(task) && task.dueDate === toDateString(getToday());
  }

  if (taskQuickFilter === "d1") {
    return isActive(task) && daysUntilDue(task.dueDate) === 1;
  }

  if (taskQuickFilter === "completed") {
    return task.status === "Completed";
  }

  if (taskQuickFilter === "overdue") {
    return isActive(task) && task.dueDate && daysUntilDue(task.dueDate) < 0;
  }

  if (taskQuickFilter === "open") {
    return task.status === "Open";
  }

  if (taskQuickFilter === "in-progress") {
    return task.status === "In Progress";
  }

  if (taskQuickFilter === "week") {
    return isActive(task) && task.dueDate && isDueThisWeek(task.dueDate);
  }

  if (taskQuickFilter === "workflow") {
    return isActive(task) && isWorkflowConnectedTask(task);
  }

  if (taskQuickFilter === "routine") {
    return isActive(task) && isRoutineConnectedTask(task);
  }

  if (taskQuickFilter === "next-week") {
    return isActive(task) && isDueNextWeek(task.dueDate);
  }

  return true;
}

function updateQuickFilterUi() {
  els.taskQuickFilterBtns.forEach((btn) => {
    const isActive = taskQuickFilter === btn.dataset.quickFilter;
    btn.classList.toggle("task-filter__btn--active", btn.classList.contains("task-filter__btn") && isActive);
    btn.classList.toggle("quick-filter__btn--active", btn.classList.contains("quick-filter__btn") && isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  if (els.tasksHomeSubtitle) {
    const label = taskQuickFilter
      ? TASK_QUICK_FILTER_LABELS[taskQuickFilter] || "Task List"
      : "진행 중인 업무";
    const dateHint = formatTaskFilterDateHint(taskQuickFilter);
    els.tasksHomeSubtitle.textContent = dateHint ? `${dateHint} · ${label}` : label;
  }
}

function updateTasksHomeHeader(count) {
  if (!els.tasksHomeCount) return;
  els.tasksHomeCount.textContent = `${count}건`;
}

function updateDashboardCardFilterUi() {
  els.dashboardFilterCards.forEach((card) => {
    const isActive = taskQuickFilter === card.dataset.dashboardFilter;
    card.classList.toggle("stat-card--active", isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });
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

  taskQuickFilter = filter;
  updateQuickFilterUi();
  updateDashboardCardFilterUi();
  switchView("tasks");
  renderTaskList();
  scrollFilteredTasksIntoView();
  showToast(`${TASK_QUICK_FILTER_LABELS[taskQuickFilter] || filter} · ${getFilteredTasks().length}건`);
}

function getFilteredTasks() {
  const studyFilter = els.filterStudy.value;
  const statusFilter = els.filterStatus.value;
  const search = els.searchInput.value.trim().toLowerCase();

  let filtered = tasks.filter((t) => !isInboxTask(t));

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
      const haystack = `${t.study} ${getTaskStudySiteNumber(t)} ${getStandardSiteName(t.site)} ${SiteMasterStore.getSearchTermsForSite(t.site).join(" ")} ${siteTerms} ${t.task} ${sourceText}`.toLowerCase();
      return haystack.includes(search);
    });
  }

  if (taskQuickFilter) {
    filtered = filtered.filter(matchesTaskQuickFilter);
  } else {
    filtered = filtered.filter(isActive);
  }

  return filtered;
}

function scrollToTaskList() {
  scrollFilteredTasksIntoView();
}

function getDashboardEncouragementMessage(remaining, total) {
  if (total === 0) return "오늘 마감 Task가 없습니다. 여유로운 하루 되세요.";
  if (remaining === 0) return "오늘 마감 Task를 모두 완료했습니다! 수고하셨습니다.";
  if (remaining === 1) return "1건의 Task만이 남았습니다. 조금만 힘내십시오.";
  if (remaining <= 3) return `${remaining}건의 Task가 남았습니다. 거의 다 왔습니다!`;
  return `${remaining}건의 Task가 남았습니다. 하나씩 차근차근 진행해 보세요.`;
}

function renderDashboardTaskWorkflowStep(task) {
  const ctx = resolveWorkflowContext(task);
  if (!ctx.workflow || !ctx.root || !ctx.instance) return "";

  const progress = getWorkflowProgressStats(ctx.workflow, ctx.root, ctx.instance);
  const stepLabels = getWorkflowStepLabels(ctx.workflow, ctx.root, ctx.instance);
  const workflowName = ctx.workflow.name?.trim() || getWorkflowRootLabel(ctx.workflow);
  const currentLabel = stepLabels.currentStepName || task.task;
  const stepNo = Math.min(progress.completed + 1, progress.total || 1);
  const total = progress.total || 1;

  return `
    <span class="dash-task-row__wf">
      <span class="dash-task-row__wf-badge">WF</span>
      <span class="dash-task-row__wf-name">${escapeHtml(workflowName)}</span>
      <span class="dash-task-row__wf-step">${stepNo}/${total} · ${escapeHtml(currentLabel)}</span>
    </span>
  `;
}

function renderDashboardGreeting() {
  const now = new Date();
  const hour = now.getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  if (els.dashboardGreeting) els.dashboardGreeting.textContent = `${greeting} 👋`;
  if (els.dashboardGreetingSub) els.dashboardGreetingSub.textContent = "";
  if (els.dashboardHeaderDate) {
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    els.dashboardHeaderDate.textContent = `${y}.${m}.${d} (${dayNames[now.getDay()]})`;
  }
}

function getDashboardUrgentCounts() {
  const todayStr = toDateString(getToday());
  const activeTasks = tasks.filter((t) => !isInboxTask(t) && isActive(t) && t.dueDate);
  return {
    today: activeTasks.filter((t) => t.dueDate === todayStr).length,
    d1: activeTasks.filter((t) => daysUntilDue(t.dueDate) === 1).length,
    d2: activeTasks.filter((t) => daysUntilDue(t.dueDate) === 2).length,
    d3: activeTasks.filter((t) => daysUntilDue(t.dueDate) === 3).length,
  };
}

function getDashboardAggregateWorkflowProgress() {
  const entries = getDashboardActiveWorkflowEntries();
  if (!entries.length) {
    return { completed: 0, total: 0, rate: 0, count: 0 };
  }
  const completed = entries.reduce((sum, entry) => sum + entry.progress.completed, 0);
  const total = entries.reduce((sum, entry) => sum + entry.progress.total, 0);
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, rate, count: entries.length };
}

function getWorkflowStepLabels(workflow, root, instance) {
  const stepDefs = buildWorkflowTimelineStepDefs(workflow, root);
  let currentStepName = null;
  let nextStepName = null;

  for (let index = 0; index < stepDefs.length; index += 1) {
    const def = stepDefs[index];
    const matched = findTaskForWorkflowStepInInstance(def.taskName, root, instance);
    const isDone = matched?.status === "Completed";
    if (!isDone) {
      currentStepName = def.taskName;
      nextStepName = stepDefs[index + 1]?.taskName || null;
      break;
    }
  }

  if (!currentStepName && stepDefs.length) {
    currentStepName = stepDefs[stepDefs.length - 1].taskName;
  }

  return { currentStepName, nextStepName };
}

function getDashboardActiveWorkflowEntries() {
  const seen = new Set();
  const entries = [];

  tasks.filter(isActive).forEach((task) => {
    const ctx = resolveWorkflowContext(task);
    if (!ctx.workflow || !ctx.root || !ctx.instance) return;
    const key = ctx.instance.id;
    if (seen.has(key)) return;
    seen.add(key);

    const progress = getWorkflowProgressStats(ctx.workflow, ctx.root, ctx.instance);
    if (progress.total > 0 && progress.completed >= progress.total) return;

    const stepLabels = getWorkflowStepLabels(ctx.workflow, ctx.root, ctx.instance);
    const repTask =
      getWorkflowInstanceTasks(ctx.instance.id).find((item) => item.status !== "Completed") ||
      ctx.root;

    entries.push({
      workflow: ctx.workflow,
      root: ctx.root,
      instance: ctx.instance,
      progress,
      study: ctx.root.study || "Study 미정",
      taskId: repTask.id,
      currentStepName: stepLabels.currentStepName,
      nextStepName: stepLabels.nextStepName,
    });
  });

  return entries.sort((a, b) => {
    const studyCmp = a.study.localeCompare(b.study, "ko");
    if (studyCmp !== 0) return studyCmp;
    const rateA = a.progress.total ? a.progress.completed / a.progress.total : 0;
    const rateB = b.progress.total ? b.progress.completed / b.progress.total : 0;
    return rateB - rateA;
  });
}

function groupDashboardWorkflowEntriesByStudy(entries) {
  const map = new Map();
  entries.forEach((entry) => {
    const study = entry.study || "Study 미정";
    if (!map.has(study)) map.set(study, []);
    map.get(study).push(entry);
  });
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "ko"));
}

function renderDashboardActiveWorkflows() {
  const entries = getDashboardActiveWorkflowEntries();
  if (els.dashboardActiveWorkflowCount) {
    els.dashboardActiveWorkflowCount.textContent = String(entries.length);
    els.dashboardActiveWorkflowCount.hidden = entries.length === 0;
  }
  if (!els.dashboardActiveWorkflowList) return;

  if (!entries.length) {
    els.dashboardActiveWorkflowList.innerHTML =
      '<p class="empty-msg empty-msg--compact">진행 중인 Workflow가 없습니다.</p>';
    setDashCardEmptyState(els.dashboardActiveWorkflowList, true);
    return;
  }

  const grouped = groupDashboardWorkflowEntriesByStudy(entries);
  els.dashboardActiveWorkflowList.innerHTML = grouped
    .map(
      ([study, studyEntries]) => `
      <section class="dash-wf-study-group">
        <h4 class="dash-wf-study-group__title">${escapeHtml(study)}</h4>
        <div class="dash-wf-study-group__list">
          ${studyEntries.map((entry) => renderDashboardWorkflowCard(entry)).join("")}
        </div>
      </section>
    `
    )
    .join("");
  setDashCardEmptyState(els.dashboardActiveWorkflowList, false);
}

function renderDashboardWorkflowCard(entry) {
  const name = entry.workflow.name?.trim() || getWorkflowRootLabel(entry.workflow);
  const percent = entry.progress.total
    ? Math.round((entry.progress.completed / entry.progress.total) * 100)
    : 0;
  const currentLabel = entry.currentStepName || "—";
  const nextLabel = entry.nextStepName || "—";

  return `
    <button type="button" class="dash-wf-card dash-wf-card--compact" data-dashboard-workflow="${escapeAttr(entry.taskId)}">
      <div class="dash-wf-card__head">
        <span class="dash-wf-card__title">${escapeHtml(name)}</span>
        <span class="dash-wf-card__fraction">${entry.progress.completed}/${entry.progress.total}</span>
      </div>
      <div class="dash-wf-card__bar" role="progressbar" aria-valuenow="${entry.progress.completed}" aria-valuemin="0" aria-valuemax="${entry.progress.total}">
        <span class="dash-wf-card__bar-fill" style="width:${percent}%"></span>
      </div>
      <p class="dash-wf-card__steps-inline">
        <span class="dash-wf-card__step-inline"><em>현재</em> ${escapeHtml(currentLabel)}</span>
        <span class="dash-wf-card__step-inline dash-wf-card__step-inline--next"><em>다음</em> ${escapeHtml(nextLabel)}</span>
      </p>
    </button>
  `;
}

function getDashboardDueBadge(task) {
  if (task.status === "Completed") {
    return { label: "Completed", className: "dash-v2-badge--done" };
  }
  if (!task.dueDate) {
    return { label: "—", className: "dash-v2-badge--neutral" };
  }
  const diff = daysUntilDue(task.dueDate);
  if (diff < 0) return { label: "Overdue", className: "dash-v2-badge--overdue" };
  if (diff === 0) return { label: "D-0", className: "dash-v2-badge--today" };
  return { label: `D-${diff}`, className: diff === 1 ? "dash-v2-badge--d1" : "dash-v2-badge--neutral" };
}

function getDashboardWorkflowLabel(task) {
  const step = getWorkflowStepPosition(task);
  if (step?.workflowName) return step.workflowName;
  const routineInfo = resolveTaskRoutineDisplay(task);
  if (routineInfo?.name) return routineInfo.name;
  return "";
}

function renderDashboardUpdateItem(task) {
  const when = formatRelativeTime(task.completedAt || task.dueDate || task.createdAt);
  const studyLabel = task.study || "—";
  const workflowLabel = getDashboardWorkflowLabel(task);
  const wfTag = workflowLabel ? `<span class="dash-update-item__workflow">WF</span>` : "";

  return `
    <article class="dash-update-item dash-update-item--compact" data-task-id="${escapeAttr(task.id)}">
      <span class="dash-update-item__icon" aria-hidden="true">✓</span>
      <div class="dash-update-item__copy">
        <p class="dash-update-item__title">${escapeHtml(task.task)}</p>
        <p class="dash-update-item__meta">${escapeHtml(studyLabel)} · ${escapeHtml(when)} ${wfTag}</p>
      </div>
    </article>
  `;
}

function formatDashboardTimelineDayLabel(dateStr) {
  const d = parseDate(dateStr);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${dayNames[d.getDay()]} ${d.getDate()}`;
}

function renderDashboardTimelineTasks(taskList) {
  if (!taskList.length) return "";

  const groups = [];
  let currentGroup = null;
  taskList.forEach((task) => {
    const key = task.dueDate || "__none__";
    if (!currentGroup || currentGroup.date !== key) {
      currentGroup = { date: key, tasks: [] };
      groups.push(currentGroup);
    }
    currentGroup.tasks.push(task);
  });

  const html = groups
    .map((group) => {
      const label = group.date === "__none__" ? "일정 미정" : formatDashboardTimelineDayLabel(group.date);
      const items = group.tasks
        .map((task) => {
          const ctx = resolveWorkflowContext(task);
          let wfHint = "";
          if (ctx.workflow && ctx.root && ctx.instance) {
            const progress = getWorkflowProgressStats(ctx.workflow, ctx.root, ctx.instance);
            const stepLabels = getWorkflowStepLabels(ctx.workflow, ctx.root, ctx.instance);
            const stepNo = Math.min(progress.completed + 1, progress.total || 1);
            const total = progress.total || 1;
            const currentLabel = stepLabels.currentStepName || task.task;
            wfHint = `<span class="dash-timeline__wf">${stepNo}/${total} · ${escapeHtml(currentLabel)}</span>`;
          }
          return `<button type="button" class="dash-timeline__item" data-edit="${escapeAttr(task.id)}" aria-label="${escapeAttr(task.task)}"><span class="dash-timeline__task">${escapeHtml(task.task)}</span>${wfHint}</button>`;
        })
        .join("");
      return `<div class="dash-timeline__day"><span class="dash-timeline__day-label">${escapeHtml(label)}</span><div class="dash-timeline__day-items">${items}</div></div>`;
    })
    .join("");

  return html;
}

function renderDashboardSectionTasks(taskList, type, filter, limit, options = {}) {
  const layout = options.layout || "compact";
  const isExpanded = dashboardExpandedSections.has(filter);
  const visibleCount = isExpanded ? taskList.length : Math.min(taskList.length, limit);
  const visible = taskList.slice(0, visibleCount);
  let itemsHtml = "";

  if (layout === "updates") {
    itemsHtml = visible.map((task) => renderDashboardUpdateItem(task)).join("");
  } else if (layout === "schedule") {
    itemsHtml = renderDashboardTimelineTasks(visible);
  } else {
    itemsHtml = visible.map((task) => renderDashItem(task, type, { compact: true, layout: "v2" })).join("");
  }

  return `${itemsHtml}${renderDashboardMoreButton(filter, taskList, limit)}`;
}

function renderDashboardHero() {
  const progress = getTodayProgressStats();

  if (els.todayProgressTotal) els.todayProgressTotal.textContent = String(progress.total);
  if (els.todayProgressCompleted) els.todayProgressCompleted.textContent = String(progress.completed);
  if (els.todayProgressRemaining) {
    els.todayProgressRemaining.textContent =
      progress.total === 0 ? "0" : progress.remaining === 0 ? "0" : String(progress.remaining);
  }
  if (els.todayProgressCount) {
    els.todayProgressCount.textContent = `${progress.completed} / ${progress.total}`;
  }
  if (els.todayProgressPercent) els.todayProgressPercent.textContent = `${progress.rate}%`;
  if (els.todayProgressFill) els.todayProgressFill.style.width = `${progress.rate}%`;
  if (els.dashboardEncouragement) {
    els.dashboardEncouragement.textContent = getDashboardEncouragementMessage(progress.remaining, progress.total);
  }

  if (els.overallProgressPercent) els.overallProgressPercent.textContent = `${progress.rate}%`;
  if (els.overallProgressSubtitle) {
    els.overallProgressSubtitle.textContent = `${progress.completed} / ${progress.total}`;
  }
  if (els.overallProgressFill) els.overallProgressFill.style.width = `${progress.rate}%`;

  if (els.todayProgressHero) {
    els.todayProgressHero.classList.remove(
      "today-progress-hero--done",
      "today-progress-hero--empty",
      "today-progress-hero--active"
    );
    if (progress.total === 0) {
      els.todayProgressHero.classList.add("today-progress-hero--empty");
    } else if (progress.remaining === 0) {
      els.todayProgressHero.classList.add("today-progress-hero--done");
    } else {
      els.todayProgressHero.classList.add("today-progress-hero--active");
    }
  }
}

function renderTodayProgressHero() {
  renderDashboardHero();
}

function renderOverallProgress(stats) {
  if (els.overallProgressPercent) els.overallProgressPercent.textContent = `${stats.completionRate}%`;
  if (els.overallProgressSubtitle) {
    els.overallProgressSubtitle.textContent = `${stats.completed} / ${stats.total}`;
  }
  if (els.overallProgressFill) els.overallProgressFill.style.width = `${stats.completionRate}%`;
}

function renderDashboard() {
  const todayStr = toDateString(getToday());
  const activeTasks = tasks.filter(isActive);
  const stats = getDashboardStats();

  renderDashboardGreeting();
  els.statTotal.textContent = stats.total;
  els.statCompleted.textContent = stats.completed;
  els.statOverdue.textContent = stats.overdue;
  if (els.statWeekDue) els.statWeekDue.textContent = stats.weekPrep;
  if (els.statTodayDue) els.statTodayDue.textContent = stats.todayDue;
  if (els.statNextWeekDue) els.statNextWeekDue.textContent = stats.nextWeekDue;
  renderDashboardHero();

  const overdueTasks = activeTasks
    .filter((t) => daysUntilDue(t.dueDate) < 0)
    .sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate));

  const todayTasks = activeTasks
    .filter((t) => t.dueDate === todayStr)
    .sort((a, b) => compareAttentionTasks(a, b));

  const tomorrowTasks = activeTasks
    .filter((t) => daysUntilDue(t.dueDate) === 1)
    .sort((a, b) => compareAttentionTasks(a, b));

  renderDashboardTaskSections(todayTasks, tomorrowTasks, overdueTasks);
  updateReminderStatusBadge();
  updateDashboardCardFilterUi();
}

function renderDashboardTaskSections(todayTasks, tomorrowTasks, overdueTasks) {
  const weekPrepTasks = getDashboardWeekPrepTasks();
  const nextWeekTasks = getDashboardNextWeekTasks();
  const recentCompleted = getRecentlyCompletedTasks();

  if (els.attentionTodayCount) {
    els.attentionTodayCount.textContent = String(todayTasks.length);
    els.attentionTodayCount.hidden = todayTasks.length === 0;
  }
  if (els.attentionTodayList) {
    els.attentionTodayList.innerHTML = todayTasks.length
      ? renderDashboardSectionTasks(todayTasks, "time-today", "today", DASHBOARD_TODAY_PREVIEW_LIMIT, {
          layout: "v2",
        })
      : renderDashboardEmptyMsg("오늘 마감 업무가 없습니다.");
    setDashCardEmptyState(els.attentionTodayList, todayTasks.length === 0);
  }

  if (els.attentionTomorrowCount) {
    els.attentionTomorrowCount.textContent = String(tomorrowTasks.length);
    els.attentionTomorrowCount.hidden = tomorrowTasks.length === 0;
  }
  if (els.attentionTomorrowList) {
    els.attentionTomorrowList.innerHTML = tomorrowTasks.length
      ? renderDashboardSectionTasks(tomorrowTasks, "time-tomorrow", "d1", DASHBOARD_TODAY_PREVIEW_LIMIT, {
          layout: "v2",
        })
      : renderDashboardEmptyMsg("내일 마감 업무가 없습니다.");
    setDashCardEmptyState(els.attentionTomorrowList, tomorrowTasks.length === 0);
  }

  if (els.dashboardWeekPrepCount) {
    els.dashboardWeekPrepCount.textContent = String(weekPrepTasks.length);
    els.dashboardWeekPrepCount.hidden = weekPrepTasks.length === 0;
  }
  if (els.dashboardWeekPrepList) {
    els.dashboardWeekPrepList.innerHTML = weekPrepTasks.length
      ? renderDashboardSectionTasks(weekPrepTasks, "time-week", "week", DASHBOARD_WEEK_PREVIEW_LIMIT, {
          layout: "schedule",
        })
      : renderDashboardEmptyMsg("이번 주 일정 없음");
    setDashCardEmptyState(els.dashboardWeekPrepList, weekPrepTasks.length === 0);
  }

  if (els.dashboardNextWeekCount) {
    els.dashboardNextWeekCount.textContent = String(nextWeekTasks.length);
    els.dashboardNextWeekCount.hidden = nextWeekTasks.length === 0;
  }
  if (els.dashboardNextWeekList) {
    els.dashboardNextWeekList.innerHTML = nextWeekTasks.length
      ? renderDashboardSectionTasks(nextWeekTasks, "time-next-week", "next-week", DASHBOARD_SECTION_PREVIEW_LIMIT, {
          layout: "v2",
        })
      : renderDashboardEmptyMsg("다음 주 예정 업무가 없습니다.");
    setDashCardEmptyState(els.dashboardNextWeekList, nextWeekTasks.length === 0);
  }
  if (els.dashboardNextWeekSection) {
    els.dashboardNextWeekSection.hidden = false;
  }

  if (els.dashboardRecentCompletedCount) {
    els.dashboardRecentCompletedCount.textContent = String(recentCompleted.length);
    els.dashboardRecentCompletedCount.hidden = recentCompleted.length === 0;
  }
  if (els.dashboardRecentCompletedList) {
    els.dashboardRecentCompletedList.innerHTML = recentCompleted.length
      ? renderDashboardSectionTasks(recentCompleted, "time-recent", "completed", DASHBOARD_COMPACT_PREVIEW_LIMIT, {
          layout: "updates",
        })
      : renderDashboardEmptyMsg("없음");
    setDashCardEmptyState(els.dashboardRecentCompletedList, recentCompleted.length === 0);
  }

  if (els.attentionOverdueCount) {
    els.attentionOverdueCount.textContent = String(overdueTasks.length);
    els.attentionOverdueCount.hidden = overdueTasks.length === 0;
  }
  if (els.attentionOverdueList) {
    els.attentionOverdueList.innerHTML = overdueTasks.length
      ? renderDashboardSectionTasks(overdueTasks, "time-overdue", "overdue", DASHBOARD_COMPACT_PREVIEW_LIMIT, {
          layout: "v2",
        })
      : renderDashboardEmptyMsg("지연된 업무가 없습니다.");
    setDashCardEmptyState(els.attentionOverdueList, overdueTasks.length === 0);
  }
  if (els.dashboardOverdueSection) {
    els.dashboardOverdueSection.hidden = overdueTasks.length === 0;
  }

  bindDashboardTaskActions();
}

function renderDashboardEmptyMsg(text) {
  return `<p class="empty-msg empty-msg--compact">✓ ${escapeHtml(text)}</p>`;
}

function bindDashboardTaskActions() {
  if (!els.viewDashboard) return;
  els.viewDashboard.querySelectorAll(".dash-task-row__main[data-edit], .dash-timeline__item[data-edit]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      openTaskDetail(btn.dataset.edit);
    });
  });
  els.viewDashboard.querySelectorAll("[data-complete]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      applyTaskStatusChange(btn.dataset.complete, "Completed");
    });
  });
  bindStatusDropdowns(els.viewDashboard);
  els.viewDashboard.querySelectorAll("[data-dashboard-expand]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleDashboardSectionExpand(btn.dataset.dashboardExpand);
    });
  });
}

function compareAttentionTasks(a, b) {
  const criticalA = a.priority === "Critical" ? 0 : 1;
  const criticalB = b.priority === "Critical" ? 0 : 1;
  if (criticalA !== criticalB) return criticalA - criticalB;
  return a.study.localeCompare(b.study, "ko");
}

function renderDashItem(task, type, options = {}) {
  const compact = Boolean(options.compact);
  const layoutV2 = options.layout === "v2";
  const dueClass = getDueDateDisplayClass(task.dueDate, task.status);
  const dueLabel = formatDueLabel(task.dueDate);
  const criticalClass = task.priority === "Critical" ? " dash-item--critical" : "";
  const isDone = task.status === "Completed";
  const selectedClass = selectedTaskId === task.id ? " dash-item--selected" : "";
  const studyLabel = task.study || "Study 미정";
  const siteLabel = task.site?.trim() ? formatTaskSiteLabel(task) || getStandardSiteName(task.site) : "Site 미정";
  const contextMeta = renderTaskContextMeta(task, { inline: compact });
  const criticalBadge =
    task.priority === "Critical" ? '<span class="critical-badge dash-item__critical">Critical</span>' : "";

  if (layoutV2) {
    const badge = getDashboardDueBadge(task);
    const sitePart = siteLabel !== "Site 미정" ? ` · ${siteLabel}` : "";
    const wfStepBlock = renderDashboardTaskWorkflowStep(task);

    return `
    <article class="dash-task-row dash-item--interactive dash-item--${type}${criticalClass}${selectedClass}${isDone ? " dash-item--completed" : ""}" data-task-id="${escapeAttr(task.id)}">
      <button type="button" class="dash-task-row__main" data-edit="${escapeAttr(task.id)}" aria-label="${escapeAttr(task.task)}">
        <span class="dash-task-row__title-line">
          ${criticalBadge}
          <span class="dash-task-row__title">${escapeHtml(task.task)}</span>
        </span>
        <span class="dash-task-row__meta">${escapeHtml(studyLabel + sitePart)}</span>
        ${wfStepBlock}
      </button>
      <span class="dash-v2-badge ${badge.className}">${escapeHtml(badge.label)}</span>
      <span class="dash-task-row__status">${renderInlineStatusDropdown(task, { compact: true, statuses: TASK_CARD_STATUS_OPTIONS })}</span>
      <button type="button" class="dash-task-row__complete${isDone ? " dash-task-row__complete--done" : ""}" data-complete="${escapeAttr(task.id)}" title="완료" aria-label="완료"${isDone ? " disabled" : ""}>
        <span aria-hidden="true">${isDone ? "✓" : ""}</span>
      </button>
    </article>
  `;
  }

  if (compact) {
    return `
    <article class="dash-item dash-item--interactive dash-item--compact dash-item--horz dash-item--${type}${criticalClass}${selectedClass}${isDone ? " dash-item--completed" : ""}" data-task-id="${escapeAttr(task.id)}">
      <button type="button" class="dash-item__main" data-dashboard-workflow="${escapeAttr(task.id)}" aria-label="${escapeAttr(task.task)} Workflow 보기">
        <div class="dash-item__row">
          <div class="dash-item__title-wrap">
            ${criticalBadge}
            <span class="dash-item-title">${escapeHtml(task.task)}</span>
          </div>
          <span class="dash-item-meta"><span class="dash-item-meta__study">${escapeHtml(studyLabel)}</span><span class="dash-item-meta__sep" aria-hidden="true">·</span><span class="dash-item-meta__site">${escapeHtml(siteLabel)}</span></span>
          ${contextMeta}
          <span class="dash-item__due-chip ${dueClass}">${escapeHtml(dueLabel)}</span>
        </div>
        <span class="dash-item__chevron" aria-hidden="true">›</span>
      </button>
      <div class="dash-item__actions dash-item__actions--compact">
        ${renderInlineStatusDropdown(task, { compact: true })}
        <button type="button" class="dash-item__complete dash-item__complete--icon" data-complete="${escapeAttr(task.id)}" title="완료" aria-label="완료"${isDone ? " disabled" : ""}>
          <span class="dash-item__complete-icon" aria-hidden="true">✓</span>
        </button>
      </div>
    </article>
  `;
  }

  return `
    <article class="dash-item dash-item--interactive dash-item--${type}${criticalClass}${selectedClass}${isDone ? " dash-item--completed" : ""}" data-task-id="${escapeAttr(task.id)}">
      <button type="button" class="dash-item__main" data-edit="${escapeAttr(task.id)}" aria-label="${escapeAttr(task.task)} 상세 보기">
        <div class="dash-item__head">
          <div class="dash-item__title-wrap">
            ${criticalBadge}
            <span class="dash-item-title">${escapeHtml(task.task)}</span>
          </div>
          <span class="dash-item__due-chip ${dueClass}">${escapeHtml(dueLabel)}</span>
        </div>
        <div class="dash-item-meta"><span class="dash-item-meta__study">${escapeHtml(studyLabel)}</span><span class="dash-item-meta__sep" aria-hidden="true">·</span><span class="dash-item-meta__site">${escapeHtml(siteLabel)}</span></div>
        ${contextMeta}
        <span class="dash-item__chevron" aria-hidden="true">›</span>
      </button>
      <div class="dash-item__actions">
        ${renderInlineStatusDropdown(task)}
        <button type="button" class="dash-item__complete" data-complete="${escapeAttr(task.id)}" title="완료" aria-label="완료"${isDone ? " disabled" : ""}>
          <span class="dash-item__complete-icon" aria-hidden="true">✓</span>
          <span class="dash-item__complete-label">완료</span>
        </button>
      </div>
    </article>
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

function renderTaskList() {
  const filtered = getFilteredTasks();
  updateTasksHomeHeader(filtered.length);
  updateQuickFilterUi();
  updateInboxBadge();

  filtered.sort(compareTasks);
  const expanded = expandFilteredWithHierarchy(filtered);
  const hierarchicalRows = buildHierarchicalRows(expanded);

  if (!els.taskCardList) return;

  if (hierarchicalRows.length === 0) {
    const emptyHtml =
      '<p class="task-card-list__empty">표시할 업무가 없습니다. Dashboard Quick Add 또는 + 버튼으로 추가하세요.</p>';
    els.taskCardList.innerHTML = emptyHtml;
    if (els.taskTableBody) els.taskTableBody.innerHTML = "";
    return;
  }

  if (taskViewMode === "list" && els.taskTableWrap && els.taskTableBody) {
    els.taskCardList.hidden = true;
    els.taskTableWrap.hidden = false;
    els.taskTableBody.innerHTML = hierarchicalRows.map(renderTableRow).join("");
    bindTaskListActions(els.taskTableWrap);
    return;
  }

  if (els.taskTableWrap) els.taskTableWrap.hidden = true;
  els.taskCardList.hidden = false;
  els.taskCardList.innerHTML = hierarchicalRows.map(renderTaskCard).join("");
  bindTaskListActions(els.taskCardList);
}

function renderTaskStudySiteMeta(task) {
  const studyNo = task.study?.trim() || "";
  const siteNumber = getTaskStudySiteNumber(task);
  const siteName = task.site?.trim() ? getStandardSiteName(task.site) : "";
  const parts = [];
  if (studyNo) parts.push(studyNo);
  if (siteNumber) parts.push(siteNumber);
  if (siteName) parts.push(siteName);
  const label = parts.length ? parts.join(" · ") : "Study · Site 미정";
  return `<span class="task-card__study-site task-card__study-site--muted">${escapeHtml(label)}</span>`;
}

function renderTaskPriorityProminent(task) {
  const priorityClassName = priorityClass(task.priority);
  if (task.priority === "Critical") {
    return `<span class="task-card__priority-text task-card__priority-text--critical">Critical</span>`;
  }
  return `<span class="task-card__priority-text task-card__priority-text--${priorityClassName}">${escapeHtml(task.priority)}</span>`;
}

function renderTaskDueProminent(task) {
  if (task.status === "Completed") {
    return `<span class="task-card__due-text task-card__due-text--done">Done</span>`;
  }
  if (!task.dueDate) {
    return `<span class="task-card__due-text task-card__due-text--none">—</span>`;
  }

  const badge = getDashboardDueBadge(task);
  const urgency = getDueUrgency(task.dueDate, task.status);
  const urgencyClass =
    urgency === "overdue"
      ? "overdue"
      : urgency === "urgent"
        ? "urgent"
        : badge.className.includes("today")
          ? "today"
          : "upcoming";

  return `<span class="task-card__due-text task-card__due-text--${urgencyClass}">${escapeHtml(badge.label)}</span>`;
}

function renderTaskQuickActions(task) {
  const calendarSynced = task.calendarSync?.eventId;
  const isDone = task.status === "Completed";

  return `
    <div class="task-card__quick-actions">
      <div class="task-card__quick-action">${renderInlineStatusDropdown(task, { compact: true, statuses: TASK_CARD_STATUS_OPTIONS })}</div>
      <button type="button" class="task-card__icon-btn${calendarSynced ? " task-card__icon-btn--synced" : ""}" data-google-calendar="${escapeAttr(task.id)}" title="Google Calendar" aria-label="Google Calendar">📅</button>
      <button type="button" class="task-card__icon-btn task-card__icon-btn--complete${isDone ? " task-card__icon-btn--done" : ""}" data-complete="${escapeAttr(task.id)}" title="완료" aria-label="완료"${isDone ? " disabled" : ""}>✓</button>
    </div>
  `;
}

function renderTaskCard({ task, isSubtask, mobile = false }) {
  const urgency = task.dueDate ? getDueUrgency(task.dueDate, task.status) : "";
  const urgencyClass =
    urgency === "overdue" ? "task-card--overdue" : urgency === "urgent" ? "task-card--urgent" : "";
  const studyLabel = task.study?.trim() || "Study 미정";
  const siteLabel = task.site?.trim() ? formatTaskSiteLabel(task) || getStandardSiteName(task.site) : "";
  const studySite =
    siteLabel && siteLabel !== "Site 미정" ? `${studyLabel} · ${siteLabel}` : studyLabel;
  const badge = getDashboardDueBadge(task);
  const workflowBlock = renderTaskWorkflowProgressBlock(task);
  const routineBlock = renderTaskRoutineLabel(task);
  const isDone = task.status === "Completed";
  const priorityClassName = priorityClass(task.priority);
  const criticalBadge =
    task.priority === "Critical"
      ? '<span class="critical-badge task-card__critical">Critical</span>'
      : "";
  const priorityBadge =
    task.priority !== "Critical"
      ? `<span class="task-card__priority task-card__priority--${priorityClassName}">${escapeHtml(task.priority)}</span>`
      : "";

  if (mobile) {
    return `
    <article class="task-card task-card--action task-card--mobile ${isSubtask ? "task-card--subtask" : ""} ${urgencyClass}${isDone ? " task-card--completed" : ""}${selectedTaskId === task.id ? " task-card--selected" : ""}" data-task-id="${escapeAttr(task.id)}">
      <button type="button" class="task-card__check${isDone ? " task-card__check--done" : ""}" data-complete="${escapeAttr(task.id)}" title="완료" aria-label="완료"${isDone ? " disabled" : ""}>
        <span aria-hidden="true">${isDone ? "✓" : ""}</span>
      </button>
      <div class="task-card__content">
        <button type="button" class="task-card__detail" data-edit="${escapeAttr(task.id)}" aria-label="${escapeAttr(task.task)} 상세 보기">
          <span class="task-card__title-line">
            ${criticalBadge}
            <span class="task-card__title">${escapeHtml(task.task)}</span>
          </span>
          <span class="task-card__study-site">${escapeHtml(studySite)}</span>
          ${workflowBlock}
          ${routineBlock}
        </button>
        <div class="task-card__meta-row">
          <span class="task-card__due-badge dash-v2-badge ${badge.className}">${escapeHtml(badge.label)}</span>
          ${priorityBadge}
        </div>
      </div>
      <div class="task-card__actions task-card__actions--action">
        <span class="task-card__status">${renderInlineStatusDropdown(task, { compact: true, statuses: TASK_CARD_STATUS_OPTIONS })}</span>
        <button type="button" class="task-card__action task-card__action--detail" data-edit="${escapeAttr(task.id)}" title="상세 보기" aria-label="상세 보기">›</button>
        ${renderTaskMoreMenu(task)}
      </div>
    </article>
  `;
  }

  return `
    <article class="task-card task-card--action task-card--row ${isSubtask ? "task-card--subtask" : ""} ${urgencyClass}${isDone ? " task-card--completed" : ""}${selectedTaskId === task.id ? " task-card--selected" : ""}" data-task-id="${escapeAttr(task.id)}">
      ${renderTaskDueProminent(task)}
      ${renderTaskPriorityProminent(task)}
      <div class="task-card__content">
        <button type="button" class="task-card__detail" data-edit="${escapeAttr(task.id)}" aria-label="${escapeAttr(task.task)} 상세 보기">
          <span class="task-card__title-line">
            ${criticalBadge}
            <span class="task-card__title">${escapeHtml(task.task)}</span>
          </span>
          ${renderTaskStudySiteMeta(task)}
          ${workflowBlock}
          ${routineBlock}
        </button>
      </div>
      ${renderTaskQuickActions(task)}
    </article>
  `;
}

function renderTable() {
  renderTaskList();
}

function renderTableRow({ task, isSubtask, isLastSubtask }) {
  const urgency = task.dueDate ? getDueUrgency(task.dueDate, task.status) : "normal";
  const rowClass = [
    urgency === "overdue" ? "row--overdue" : urgency === "urgent" ? "row--urgent" : "",
    isSubtask ? "row--subtask" : "row--parent",
    isSubtask && isLastSubtask ? "row--subtask-last" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const badge = getDashboardDueBadge(task);
  const studyLabel = task.study?.trim() || "—";
  const siteLabel = task.site?.trim() ? formatTaskSiteLabel(task) || getStandardSiteName(task.site) : "—";
  const workflowLabel = getDashboardWorkflowLabel(task);

  return `
    <tr class="${rowClass}${selectedTaskId === task.id ? " is-selected" : ""}" data-task-id="${escapeAttr(task.id)}">
      <td>
        <button type="button" class="task-list-name" data-edit="${escapeAttr(task.id)}">${escapeHtml(task.task)}</button>
        <span class="task-card__study-site task-card__study-site--muted">${escapeHtml([studyLabel !== "—" ? studyLabel : "", siteLabel !== "—" ? siteLabel : ""].filter(Boolean).join(" · ") || "Study · Site 미정")}</span>
        ${workflowLabel ? `<span class="task-list-wf">${escapeHtml(workflowLabel)}</span>` : ""}
      </td>
      <td>${escapeHtml(studyLabel)}</td>
      <td>${escapeHtml(siteLabel)}</td>
      <td><span class="task-list-due dash-v2-badge ${badge.className}">${escapeHtml(badge.label)}</span></td>
      <td class="actions-cell actions-cell--quick">
        ${renderTaskQuickActions(task)}
      </td>
    </tr>
  `;
}

function renderAll() {
  renderDashboard();
  if (dashboardWorkflowTaskId && currentViewName === "dashboard" && els.dashboardWorkflowPanel && !els.dashboardWorkflowPanel.hidden) {
    const task = tasks.find((t) => t.id === dashboardWorkflowTaskId);
    if (task) {
      const workflow = resolveTaskWorkflowRecord(task);
      if (els.dashboardWorkflowTitle) {
        els.dashboardWorkflowTitle.textContent =
          workflow?.name?.trim() || getWorkflowRootLabel(workflow) || task.task;
      }
      if (els.dashboardWorkflowBody) {
        els.dashboardWorkflowBody.innerHTML = renderDashboardWorkflowDetailContent(task);
        bindWorkflowTimelineClicks(els.dashboardWorkflowBody, "dashboard");
      }
    } else {
      closeDashboardWorkflowDetail();
    }
  }
  if (isDailyMode()) {
    renderMobileDailyHome();
  } else {
    renderTodayWorkspace();
    renderTaskList();
  }
  updateStudyFilterOptions();
  refreshTaskStudySiteSelects();
  updateInboxBadge();
  if (els.viewInbox && !els.viewInbox.hidden) renderInboxList();
  if (els.viewCalendar && !els.viewCalendar.hidden) renderCalendarView();
  if (els.viewReference && !els.viewReference.hidden) renderReferenceView();
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
