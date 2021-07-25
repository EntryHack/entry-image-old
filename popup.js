window.addEventListener('load', () => {
  const alwaysShow = document.getElementById('always-show');
  const useLegacy = document.getElementById('use-legacy');

  [alwaysShow, useLegacy].forEach((el) =>
    chrome.runtime.sendMessage({ key: el.id, method: 'get' }, (value) => {
      el.checked = value[el.id];
      el.parentNode.querySelector('.text').textContent = value[el.id] ? '활성화' : '비활성화';
    })
  );

  [alwaysShow, useLegacy].forEach((el) =>
    el.addEventListener('click', () => {
      chrome.runtime.sendMessage({ key: el.id, value: el.checked, method: 'set' }, () => {
        el.parentNode.querySelector('.text').textContent = el.checked ? '활성화' : '비활성화';
      });
    })
  );
});
