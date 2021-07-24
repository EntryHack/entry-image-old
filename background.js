chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
  if (changeInfo.url && changeInfo.url.includes('https://playentry.org/community/entrystory/list')) {
    chrome.tabs.sendMessage(tabId, 'url');
  }
});
