// This script listens for tab updates to fetch credentials and send them to the content script if they match.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "CHECK_CREDENTIALS") {
    chrome.storage.local.get(["credentials", "token"], (data) => {
      if (data.token && data.credentials) {
        // Simple check: does the current URL contain the saved credential's URL?
        const currentUrl = request.url.toLowerCase();
        const matches = data.credentials.filter(cred => {
           try {
              // Extract main domain or hostname
              const savedDomain = cred.url.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
              return currentUrl.includes(savedDomain);
           } catch(e) {
              return currentUrl.includes(cred.url.toLowerCase());
           }
        });
        
        if(matches.length > 0) {
            sendResponse({ matchFound: true, credential: matches[0] });
        } else {
            sendResponse({ matchFound: false });
        }
      } else {
         sendResponse({ matchFound: false });
      }
    });
    return true; // Keep the message channel open for async response
  }
});
