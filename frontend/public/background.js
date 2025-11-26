// Background service worker
console.log("Perspective Bridge extension loaded.");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Perspective Bridge installed.");
});
