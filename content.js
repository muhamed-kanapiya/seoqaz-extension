// Content script for SEOQaz extension
// This script runs in the context of web pages

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSEOData') {
    const seoData = analyzePage();
    sendResponse(seoData);
  }
  return true;
});

function analyzePage() {
  // This function can be expanded for more detailed analysis
  // For now, it's a placeholder as the main analysis is done via executeScript
  return {
    status: 'ready'
  };
}

// Initialize content script
console.log('SEOQaz content script loaded');
