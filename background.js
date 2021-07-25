chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
  if (changeInfo.url && changeInfo.url.includes('https://playentry.org/community/entrystory/list')) {
    chrome.tabs.sendMessage(tabId, 'url');
  }
});

chrome.runtime.onMessage.addListener((args, _, onSuccess) => {
  if (args === undefined) return;

  fetch(args)
    .then((response) => response.text())
    .then((responseText) => {
      console.log(responseText);
      onSuccess(responseText);
    });

  return true;
});
