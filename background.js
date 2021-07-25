chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
  if (changeInfo.url && changeInfo.url.includes('https://playentry.org/community/entrystory/list')) {
    chrome.tabs.sendMessage(tabId, 'url');
  }
});

chrome.runtime.onMessage.addListener((args, _, onSuccess) => {
  if (args === undefined || typeof args !== 'object') return;

  if (args.url) {
    fetch(args.url)
      .then((response) => response.text())
      .then((responseText) => {
        console.log(responseText);
        onSuccess(responseText);
      });
  } else if (args.key && args.method) {
    if (args.method === 'set') chrome.storage.local.set({ [args.key]: args.value }, onSuccess);
    else chrome.storage.local.get([args.key], onSuccess);
  }

  return true;
});
