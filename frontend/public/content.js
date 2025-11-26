// Content script to interact with the page
console.log("Perspective Bridge content script running.");

// Example: Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPageInfo") {
        sendResponse({
            title: document.title,
            url: window.location.href,
            content: document.body.innerText // Simplified content extraction
        });
    }
});
