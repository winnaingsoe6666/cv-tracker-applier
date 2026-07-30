/**
 * CareerForge Extension — background.js (Service Worker)
 *
 * Minimal service worker required by Manifest V3.
 * Currently just handles extension install event.
 */

"use strict";

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Open the app on first install so the user can set up their token
    chrome.storage.sync.get("appUrl", (data) => {
      const url = data.appUrl || "http://localhost:3000";
      chrome.tabs.create({ url: `${url}/settings` });
    });
  }
});
