/**
 * CareerForge Extension — popup.js
 *
 * Responsibilities:
 *  - Load saved settings (appUrl, apiToken) from chrome.storage.sync
 *  - Ask the active tab's content script for scraped job data
 *  - Render detection result in the popup UI
 *  - On push: POST to /api/extension/push-job with Bearer token
 *  - On success: show workbench link, optionally open the tab
 */

"use strict";

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const detectCard   = document.getElementById("detectCard");
const detectLabel  = document.getElementById("detectLabel");
const jobTitle     = document.getElementById("jobTitle");
const jobCompany   = document.getElementById("jobCompany");
const descPreview  = document.getElementById("descPreview");
const marketSel    = document.getElementById("market");
const pushBtn      = document.getElementById("pushBtn");
const pushLabel    = document.getElementById("pushLabel");
const pushSpinner  = document.getElementById("pushSpinner");
const toast        = document.getElementById("toast");

// Settings panel
const toggleSettingsBtn = document.getElementById("toggleSettings");
const mainPanel    = document.getElementById("mainPanel");
const tokenPanel   = document.getElementById("tokenPanel");
const appUrlInput  = document.getElementById("appUrl");
const apiTokenInput= document.getElementById("apiToken");
const saveSettingsBtn = document.getElementById("saveSettings");
const settingsToast= document.getElementById("settingsToast");
const openAppBtn   = document.getElementById("openApp");

// ─── State ────────────────────────────────────────────────────────────────────
let jobData  = null;  // { title, company, description, url, location }
let settings = { appUrl: "http://localhost:3000", apiToken: "" };
let showingSettings = false;

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  // 1. Load saved settings
  const stored = await chrome.storage.sync.get(["appUrl", "apiToken", "lastMarket"]);
  settings.appUrl   = stored.appUrl   || "http://localhost:3000";
  settings.apiToken = stored.apiToken || "";
  if (stored.lastMarket) marketSel.value = stored.lastMarket;

  appUrlInput.value   = settings.appUrl;
  apiTokenInput.value = settings.apiToken;

  // 2. If no token, auto-open settings panel
  if (!settings.apiToken) {
    showSettings(true);
    return;
  }

  // 3. Ask active tab for job data
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setNotDetected("Could not access current tab.");
    return;
  }

  try {
    // Inject content script on demand if not already injected (for non-matching pages)
    const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_JOB_DATA" });
    if (response && response.title) {
      setDetected(response, tab.url);
    } else {
      setNotDetected("No job posting detected on this page.");
    }
  } catch {
    // Content script not injected — try injecting manually then retry
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
      const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_JOB_DATA" });
      if (response && response.title) {
        setDetected(response, tab.url);
      } else {
        setNotDetected("No job posting detected on this page.");
      }
    } catch {
      setNotDetected("Navigate to a job posting page to push it.");
    }
  }
}

// ─── Detection state ──────────────────────────────────────────────────────────
function setDetected(data, tabUrl) {
  jobData = { ...data, url: tabUrl };

  detectCard.className = "detect-card detected";
  detectLabel.className = "detect-label ok";
  detectLabel.textContent = "✓ Job detected";

  jobTitle.style.color = "";
  jobTitle.textContent = data.title;
  jobCompany.textContent = data.company || "";

  if (data.description) {
    descPreview.textContent = data.description.slice(0, 200);
    descPreview.style.display = "block";
  }

  // Auto-detect market from location
  if (data.location) {
    const loc = data.location.toLowerCase();
    if (loc.includes("thailand") || loc.includes("bangkok") || loc.includes("th")) {
      marketSel.value = "TH";
    } else if (loc.includes("malaysia") || loc.includes("kuala lumpur") || loc.includes("kl")) {
      marketSel.value = "MY";
    } else if (loc.includes("singapore") || loc.includes("sg")) {
      marketSel.value = "SG";
    } else if (loc.includes("remote")) {
      marketSel.value = "REMOTE";
    }
  }

  pushBtn.disabled = false;
}

function setNotDetected(msg) {
  detectCard.className = "detect-card not-detected";
  detectLabel.className = "detect-label fail";
  detectLabel.textContent = "No job detected";
  jobTitle.style.color = "var(--muted)";
  jobTitle.textContent = msg;
  jobCompany.textContent = "";
  pushBtn.disabled = true;
}

// ─── Push ─────────────────────────────────────────────────────────────────────
pushBtn.addEventListener("click", async () => {
  if (!jobData) return;
  if (!settings.apiToken) {
    showToast(toast, "No API token — open ⚙ Settings and paste your token.", "error");
    return;
  }

  const market = marketSel.value;
  // Save last used market
  await chrome.storage.sync.set({ lastMarket: market });

  // Loading state
  pushBtn.disabled = true;
  pushSpinner.style.display = "block";
  pushLabel.textContent = "Pushing…";
  toast.className = "toast";

  try {
    const res = await fetch(`${settings.appUrl}/api/extension/push-job`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.apiToken}`,
      },
      body: JSON.stringify({
        title: jobData.title,
        company: jobData.company,
        description: jobData.description,
        url: jobData.url,
        location: jobData.location || null,
        market,
        source: "extension",
      }),
    });

    const data = await res.json();

    if (res.ok) {
      const workbenchUrl = `${settings.appUrl}${data.workbenchUrl}`;
      const score = data.worthiness != null ? ` (worthiness: ${data.worthiness})` : "";
      showToast(
        toast,
        `✓ Job pushed${score}! <a href="${workbenchUrl}" id="openWorkbench" target="_blank">Open workbench →</a>`,
        "success"
      );
      pushLabel.textContent = "Pushed ✓";
    } else {
      const errMsg = data.error || `Error ${res.status}`;
      showToast(toast, `✗ ${errMsg}`, "error");
      pushBtn.disabled = false;
      pushLabel.textContent = "Push to CareerForge";
    }
  } catch {
    showToast(toast, `✗ Network error — is CareerForge running at ${settings.appUrl}?`, "error");
    pushBtn.disabled = false;
    pushLabel.textContent = "Push to CareerForge";
  } finally {
    pushSpinner.style.display = "none";
  }
});

// ─── Settings panel ───────────────────────────────────────────────────────────
toggleSettingsBtn.addEventListener("click", () => showSettings(!showingSettings));

function showSettings(show) {
  showingSettings = show;
  mainPanel.className  = show ? "main-panel hidden" : "main-panel";
  tokenPanel.className = show ? "token-panel active" : "token-panel";
  toggleSettingsBtn.textContent = show ? "✕" : "⚙";
  toggleSettingsBtn.title = show ? "Back" : "Settings";
}

saveSettingsBtn.addEventListener("click", async () => {
  const url   = appUrlInput.value.trim().replace(/\/$/, "");
  const token = apiTokenInput.value.trim();

  if (!url) {
    showToast(settingsToast, "App URL is required", "error");
    return;
  }
  if (!token.startsWith("cf_")) {
    showToast(settingsToast, "Token should start with cf_", "error");
    return;
  }

  await chrome.storage.sync.set({ appUrl: url, apiToken: token });
  settings = { appUrl: url, apiToken: token };
  showToast(settingsToast, "✓ Settings saved", "success");

  setTimeout(() => {
    showSettings(false);
    init(); // re-run detection with new settings
  }, 800);
});

// ─── Footer ───────────────────────────────────────────────────────────────────
openAppBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: settings.appUrl });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function showToast(el, html, type) {
  el.innerHTML = html;
  el.className = `toast ${type}`;
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
