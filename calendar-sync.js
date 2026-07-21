/**
 * Calendar Sync — Provider 기반 양방향 동기화 구조
 * 현재: Google Calendar API (OAuth2 + REST)
 * 향후: OutlookCalendarProvider 추가 가능
 */

const CALENDAR_SETTINGS_KEY = "cra-calendar-settings";
const GOOGLE_TOKEN_KEY = "cra-google-token";

const CalendarSyncSettingsStore = {
  load() {
    try {
      const raw = localStorage.getItem(CALENDAR_SETTINGS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        activeProvider: parsed.activeProvider || "google",
        googleEmail: parsed.googleEmail || "",
        calendarSyncEnabled: Boolean(parsed.calendarSyncEnabled),
        lastSyncAt: parsed.lastSyncAt || "",
      };
    } catch {
      return {
        activeProvider: "google",
        googleEmail: "",
        calendarSyncEnabled: false,
        lastSyncAt: "",
      };
    }
  },

  save(settings) {
    localStorage.setItem(CALENDAR_SETTINGS_KEY, JSON.stringify(settings));
  },

  update(patch) {
    const next = { ...this.load(), ...patch };
    this.save(next);
    return next;
  },
};

function waitForGoogleIdentity(maxAttempts = 80) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tick = () => {
      if (window.google?.accounts?.oauth2) {
        resolve(window.google);
        return;
      }
      if (attempts >= maxAttempts) {
        reject(new Error("Google Identity Services를 불러오지 못했습니다."));
        return;
      }
      attempts += 1;
      setTimeout(tick, 100);
    };
    tick();
  });
}

class GoogleCalendarProvider {
  constructor(config) {
    this.config = config;
    this.tokenClient = null;
    this.pendingAuth = null;
    this.accessToken = null;
    this.tokenExpiresAt = 0;
  }

  isConfigured() {
    const clientId = this.config?.clientId?.trim();
    return Boolean(clientId && !clientId.includes("YOUR_CLIENT_ID"));
  }

  loadStoredToken() {
    try {
      const raw = localStorage.getItem(GOOGLE_TOKEN_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.accessToken && parsed.expiresAt > Date.now() + 60000) {
        this.accessToken = parsed.accessToken;
        this.tokenExpiresAt = parsed.expiresAt;
      }
    } catch {
      /* ignore */
    }
  }

  persistToken(expiresInSeconds = 3600) {
    if (!this.accessToken) return;
    this.tokenExpiresAt = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(
      GOOGLE_TOKEN_KEY,
      JSON.stringify({
        accessToken: this.accessToken,
        expiresAt: this.tokenExpiresAt,
      })
    );
  }

  clearToken() {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    localStorage.removeItem(GOOGLE_TOKEN_KEY);
  }

  connect(interactive = true) {
    if (!this.isConfigured()) {
      return Promise.reject(
        new Error("Google OAuth Client ID가 calendar-config.js에 설정되지 않았습니다.")
      );
    }

    return this.ensureTokenClient().then(() => {
      if (!this.tokenClient) {
        return Promise.reject(new Error("Google OAuth 클라이언트를 초기화하지 못했습니다."));
      }
      if (this.isConnected()) {
        return Promise.resolve(this.accessToken);
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!this.pendingAuth) return;
          this.pendingAuth.reject(
            new Error("Google 로그인 창이 열리지 않았습니다. 팝업 차단을 해제하거나 localhost에서 실행해 주세요.")
          );
          this.pendingAuth = null;
        }, 120000);

        this.pendingAuth = {
          resolve: (value) => {
            clearTimeout(timeout);
            resolve(value);
          },
          reject: (err) => {
            clearTimeout(timeout);
            reject(err);
          },
        };

        try {
          this.tokenClient.requestAccessToken({
            prompt: interactive ? "consent" : "",
          });
        } catch (err) {
          clearTimeout(timeout);
          this.pendingAuth = null;
          reject(err);
        }
      });
    });
  }

  async ensureTokenClient() {
    if (this.tokenClient) return true;
    if (!this.isConfigured()) return false;

    await waitForGoogleIdentity();
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this.config.clientId.trim(),
      scope: this.config.scope,
      callback: (response) => {
        if (response.error) {
          const message =
            response.error === "popup_closed_by_user"
              ? "Google 로그인 창이 닫혔습니다."
              : response.error_description || response.error;
          this.pendingAuth?.reject(new Error(message));
          this.pendingAuth = null;
          return;
        }
        this.accessToken = response.access_token;
        this.persistToken(Number(response.expires_in) || 3600);
        this.pendingAuth?.resolve(this.accessToken);
        this.pendingAuth = null;
      },
    });
    return Boolean(this.tokenClient);
  }

  async init() {
    this.loadStoredToken();
    if (!this.isConfigured()) return false;
    return this.ensureTokenClient();
  }

  isConnected() {
    return Boolean(this.accessToken && this.tokenExpiresAt > Date.now() + 30000);
  }

  disconnect() {
    if (this.accessToken && window.google?.accounts?.oauth2?.revoke) {
      google.accounts.oauth2.revoke(this.accessToken, () => {});
    }
    this.clearToken();
    CalendarSyncSettingsStore.update({ googleEmail: "" });
  }

  requireAuth() {
    if (!this.isConnected()) {
      throw new Error("Calendar Sync가 연결되어 있지 않습니다. Settings에서 Calendar Sync를 켜 주세요.");
    }
    return this.accessToken;
  }

  async apiRequest(method, path, body) {
    this.requireAuth();
    const url = `${this.config.apiBase}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error("Google 인증이 만료되었습니다. Settings에서 Reconnect를 눌러 주세요.");
    }

    if (response.status === 204) return null;

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error?.message || `Google Calendar API 오류 (${response.status})`;
      throw new Error(message);
    }
    return data;
  }

  buildReminders() {
    return {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 24 * 60 * 3 },
        { method: "popup", minutes: 24 * 60 },
      ],
    };
  }

  buildEventPayload(task, settings, helpers = {}) {
    const siteLabel =
      typeof helpers.getTaskSiteLabel === "function"
        ? helpers.getTaskSiteLabel(task)
        : typeof helpers.getStandardSiteName === "function"
          ? helpers.getStandardSiteName(task.site)
          : task.site;
    const siteNumber =
      typeof helpers.getTaskStudySiteNumber === "function" ? helpers.getTaskStudySiteNumber(task) : "";
    const [year, month, day] = task.dueDate.split("-").map(Number);
    const end = new Date(year, month - 1, day);
    end.setDate(end.getDate() + 1);
    const endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

    return {
      summary: siteLabel ? `[${task.study}] ${task.task} - ${siteLabel}` : `[${task.study}] ${task.task}`,
      description: [
        `Study: ${task.study}`,
        siteNumber ? `Site No: ${siteNumber}` : null,
        siteLabel ? `Site: ${siteLabel}` : null,
        `Task: ${task.task}`,
        `Priority: ${task.priority}`,
        `Status: ${task.status}`,
        `Task ID: ${task.id}`,
      ]
        .filter(Boolean)
        .join("\n"),
      start: { date: task.dueDate },
      end: { date: endDate },
      extendedProperties: {
        private: {
          craTaskId: task.id,
          craApp: "cra-task-manager",
        },
      },
      reminders: this.buildReminders(),
    };
  }

  async createEvent(task, settings, helpers) {
    const calendarId = encodeURIComponent(this.config.defaultCalendarId || "primary");
    const payload = this.buildEventPayload(task, settings, helpers);
    const data = await this.apiRequest("POST", `/calendars/${calendarId}/events`, payload);
    return {
      provider: "google",
      eventId: data.id,
      calendarId: this.config.defaultCalendarId || "primary",
      htmlLink: data.htmlLink || "",
      etag: data.etag || "",
      linkedAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
    };
  }

  async updateEvent(task, settings, helpers) {
    const sync = task.calendarSync;
    if (!sync?.eventId) {
      return this.createEvent(task, settings, helpers);
    }

    const calendarId = encodeURIComponent(sync.calendarId || this.config.defaultCalendarId || "primary");
    const eventId = encodeURIComponent(sync.eventId);
    const payload = this.buildEventPayload(task, settings, helpers);
    const data = await this.apiRequest("PATCH", `/calendars/${calendarId}/events/${eventId}`, payload);

    return {
      ...sync,
      provider: "google",
      htmlLink: data.htmlLink || sync.htmlLink || "",
      etag: data.etag || sync.etag || "",
      lastSyncedAt: new Date().toISOString(),
    };
  }

  async deleteEvent(calendarSync) {
    if (!calendarSync?.eventId) return;
    const calendarId = encodeURIComponent(calendarSync.calendarId || this.config.defaultCalendarId || "primary");
    const eventId = encodeURIComponent(calendarSync.eventId);
    try {
      await this.apiRequest("DELETE", `/calendars/${calendarId}/events/${eventId}`);
    } catch (err) {
      if (!String(err.message).includes("404") && !String(err.message).includes("410")) {
        throw err;
      }
    }
  }

  /** 향후 Google → Task 역동기화용 스텁 */
  async pullChangesSince(_sinceIso) {
    return [];
  }
}

class OutlookCalendarProvider {
  isConfigured() {
    return Boolean(window.CALENDAR_CONFIG?.outlook?.clientId);
  }

  async init() {
    return false;
  }

  isConnected() {
    return false;
  }

  async connect() {
    throw new Error("Outlook Calendar 연동은 아직 지원되지 않습니다.");
  }

  async createEvent() {
    throw new Error("Outlook Calendar 연동은 아직 지원되지 않습니다.");
  }

  async updateEvent() {
    throw new Error("Outlook Calendar 연동은 아직 지원되지 않습니다.");
  }

  async deleteEvent() {
    throw new Error("Outlook Calendar 연동은 아직 지원되지 않습니다.");
  }
}

const CalendarSyncManager = {
  providers: {},
  activeProvider: null,
  helpers: {
    getStandardSiteName: (value) => value,
    getTaskById: () => null,
    updateTaskCalendarSync: () => false,
    clearTaskCalendarSync: () => false,
  },

  registerHelpers(helpers) {
    this.helpers = { ...this.helpers, ...helpers };
  },

  async init() {
    const config = window.CALENDAR_CONFIG || {};
    this.providers.google = new GoogleCalendarProvider(config.google || {});
    this.providers.outlook = new OutlookCalendarProvider();

    const settings = CalendarSyncSettingsStore.load();
    this.activeProvider = this.providers[settings.activeProvider] || this.providers.google;

    if (this.providers.google.isConfigured()) {
      await this.providers.google.init();
    }
    return true;
  },

  getSettings() {
    return CalendarSyncSettingsStore.load();
  },

  saveSettings(patch) {
    return CalendarSyncSettingsStore.update(patch);
  },

  isConfigured() {
    return this.activeProvider?.isConfigured?.() || false;
  },

  isConnected() {
    return this.activeProvider?.isConnected?.() || false;
  },

  isCalendarSyncActive() {
    if (window.location.protocol === "file:") return false;
    if (!this.isConfigured()) return false;
    if (!this.getSettings().calendarSyncEnabled) return false;
    return this.isConnected();
  },

  isCalendarSyncEnabled() {
    return Boolean(this.getSettings().calendarSyncEnabled);
  },

  setCalendarSyncEnabled(enabled) {
    return this.saveSettings({ calendarSyncEnabled: Boolean(enabled) });
  },

  markLastSync(isoString = new Date().toISOString()) {
    return this.saveSettings({ lastSyncAt: isoString });
  },

  getStatusLabel() {
    if (window.location.protocol === "file:") {
      return "Google OAuth는 file://에서 동작하지 않습니다. Live Server(localhost)로 실행해 주세요.";
    }
    if (!this.isConfigured()) {
      return "Google Client ID가 설정되지 않았습니다. calendar-config.js의 google.clientId를 입력하세요.";
    }
    if (this.isConnected()) {
      return "Connected";
    }
    return "Not Connected";
  },

  async connect(interactive = true) {
    if (window.location.protocol === "file:") {
      throw new Error(
        "Google OAuth는 index.html을 직접 열(file://)면 동작하지 않습니다.\n\nVS Code Live Server 등으로 http://localhost 환경에서 실행해 주세요."
      );
    }
    if (!this.isConfigured()) {
      throw new Error(
        "Google OAuth Client ID가 설정되지 않았습니다.\n\ncalendar-config.js 파일의 google.clientId에 Google Cloud Console에서 발급받은 Client ID를 입력해 주세요."
      );
    }

    const provider = this.providers.google;
    if (!provider.tokenClient) {
      await provider.ensureTokenClient();
    }
    if (!provider.tokenClient) {
      throw new Error("Google Identity Services를 불러오지 못했습니다. 인터넷 연결 후 페이지를 새로고침해 주세요.");
    }

    await provider.connect(interactive);
    return true;
  },

  disconnect() {
    this.activeProvider?.disconnect?.();
  },

  reconcileAuthWithSettings() {
    return this.isConnected();
  },

  shouldSyncTask(task) {
    if (!task?.dueDate) return false;
    if (!this.isCalendarSyncActive()) return false;
    if (task.status === "Cancelled") return false;
    return true;
  },

  shouldDeleteCalendarEvent(task) {
    return Boolean(task?.calendarSync?.eventId);
  },

  async syncTask(taskId) {
    const task = this.helpers.getTaskById(taskId);
    if (!task) return;

    if (!this.shouldSyncTask(task)) {
      if (this.shouldDeleteCalendarEvent(task)) {
        await this.deleteTaskCalendarEvent(taskId);
      }
      return;
    }

    if (!this.isConnected()) return;

    const settings = this.getSettings();
    let calendarSync;

    if (task.calendarSync?.eventId) {
      calendarSync = await this.activeProvider.updateEvent(task, settings, this.helpers);
    } else {
      calendarSync = await this.activeProvider.createEvent(task, settings, this.helpers);
    }

    this.helpers.updateTaskCalendarSync(taskId, calendarSync);
    this.markLastSync(calendarSync?.lastSyncedAt || new Date().toISOString());
  },

  async deleteTaskCalendarEvent(taskId) {
    const task = this.helpers.getTaskById(taskId);
    if (!task?.calendarSync?.eventId) return;

    try {
      if (!this.isConnected()) return;
      await this.activeProvider.deleteEvent(task.calendarSync);
    } catch (err) {
      console.warn("Google Calendar 일정 삭제 실패:", err);
    } finally {
      this.helpers.clearTaskCalendarSync(taskId);
    }
  },

  scheduleSyncTask(taskId) {
    this.syncTask(taskId).catch((err) => {
      console.warn(`Calendar sync failed for task ${taskId}:`, err);
    });
  },

  scheduleSyncTasks(taskIds) {
    taskIds.forEach((taskId) => this.scheduleSyncTask(taskId));
  },

  async onTaskCreated(taskId) {
    this.scheduleSyncTask(taskId);
  },

  async onTaskUpdated(taskId) {
    const task = this.helpers.getTaskById(taskId);
    if (task?.status === "Cancelled") {
      await this.deleteTaskCalendarEvent(taskId);
      return;
    }
    this.scheduleSyncTask(taskId);
  },

  async onTasksDeleted(taskIds) {
    const deletions = taskIds.map((taskId) => this.deleteTaskCalendarEvent(taskId));
    await Promise.allSettled(deletions);
  },

  openTaskInCalendar(taskId) {
    const task = this.helpers.getTaskById(taskId);
    if (!task) return;

    if (task.calendarSync?.htmlLink) {
      window.open(task.calendarSync.htmlLink, "_blank", "noopener,noreferrer");
      return;
    }

    if (typeof window.openGoogleCalendarCreateUrl === "function" && task.dueDate) {
      window.open(window.buildGoogleCalendarCreateUrl(task), "_blank", "noopener,noreferrer");
      return;
    }

    if (task.dueDate) {
      const params = new URLSearchParams({
        action: "TEMPLATE",
        text: `[${task.study}] ${task.task}`,
        dates: `${task.dueDate.replace(/-/g, "")}/${task.dueDate.replace(/-/g, "")}`,
      });
      window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank", "noopener,noreferrer");
    }
  },
};

window.CalendarSyncSettingsStore = CalendarSyncSettingsStore;
window.CalendarSyncManager = CalendarSyncManager;
