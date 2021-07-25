let useCustomUpload = false;
let imageData = undefined;

/** @param {String message} */
const encode = (message) => {
  const byteArray = Array.from(new TextEncoder().encode(message));
  const bitArray = byteArray.flatMap((b) => b.toString(2).padStart(8, 0).split(''));
  const result = bitArray.map((b) => (b === '1' ? '\u200c' : '\u200b')).join('');

  return result;
};

/** @param {String encodedMessage} */
const decode = (encodedMessage) => {
  const bitArray = encodedMessage.split('').map((s) => (s === '\u200c' ? 1 : 0));
  const byteArray = (() => {
    const chunk = [];
    for (let i = 0; i < bitArray.length; i += 8) chunk.push(bitArray.slice(i, 8 + i).join(''));
    return chunk;
  })().map((b) => parseInt(b, 2));
  const result = new TextDecoder().decode(Uint8Array.from(byteArray));

  return result;
};

const toBase64 = async (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const oldUpload = async (url) => {
  const formData = new FormData();

  const blob = await (await fetch(url)).blob();

  formData.append('file', blob);
  formData.append('type', 'notcompress');

  const data = await (
    await fetch('https://playentry.org/rest/picture', {
      method: 'POST',
      body: formData,
    })
  ).json();
  return JSON.stringify({
    name: data.filename,
    type:
      data.imageType === 'png'
        ? 1
        : data.imageType === 'jpg'
        ? 2
        : data.imageType === 'jpeg'
        ? 3
        : data.imageType === 'gif'
        ? 4
        : data.imageType === 'webp'
        ? 5
        : data.imageType,
  });
};

const upload = async (url) => {
  const formData = new FormData();

  const blob = await (await fetch(url)).blob();

  formData.append('file', blob);
  formData.append('type', 'notcompress');

  const data = await (
    await fetch('https://playentry.org/rest/picture', {
      method: 'POST',
      body: formData,
    })
  ).json();
  const id = await new Promise((res) =>
    chrome.runtime.sendMessage(
      {
        url: `http://entryimage.dothome.co.kr/add.php?id=${data.filename}|${
          data.imageType === 'png'
            ? 1
            : data.imageType === 'jpg'
            ? 2
            : data.imageType === 'jpeg'
            ? 3
            : data.imageType === 'gif'
            ? 4
            : data.imageType === 'webp'
            ? 5
            : data.imageType
        }`,
      },
      (data) => res(data)
    )
  );

  return id;
};

const imageFromData = (data) => {
  const img = document.createElement('img');
  img.src = `https://playentry.org/uploads/${data.name.slice(0, 2)}/${data.name.slice(2, 4)}/${data.name}.${
    data.type === 1
      ? 'png'
      : data.type === 2
      ? 'jpg'
      : data.type === 3
      ? 'jpeg'
      : data.type === 4
      ? 'gif'
      : data.type === 5
      ? 'webp'
      : data.type
  }`;
  img.classList.add('etrImg');
  return img.outerHTML;
};

const clickToShow = (data) => {
  const div = document.createElement('div');
  div.innerHTML = '<div class="e-warning">이미지가 포함된 게시글입니다. 이미지를 표시하시겠습니까?<a class="e-show">표시</a></div>';

  const interval = setInterval(() => {
    const tmp = div.querySelector('a.e-show');
    if (tmp === null) return;
    tmp.onclick = () => (div.innerHTML = imageFromData(data));
    clearInterval(interval);
  }, 10);

  return div;
};

const render = () => {
  const postList = Array.from(document.querySelectorAll('.css-1i5jedo.e18x7bg05 li.eelonj20')).map((el) =>
    el.querySelector('.css-1wpssus.e1i41bku0')
  );

  postList.forEach(async (el) => {
    try {
      if (el.innerHTML.includes(' ') || el.innerHTML.includes('\u200a')) {
        const tmp = el.innerHTML.split(el.innerHTML.includes('\u200a') ? '\u200a' : ' ');
        const text = tmp.shift();
        const data = decode(tmp.join(''));
        const json = await (async () => {
          if (data.trim().startsWith('{')) return JSON.parse(decode(tmp.join('')).split('}')[0] + '}');
          else {
            const array = data.split(',');
            const tmp = (
              await new Promise((res) =>
                chrome.runtime.sendMessage({ url: `http://entryimage.dothome.co.kr/get.php?index=${array[0]}` }, (data) => res(data))
              )
            )
              .split('|')
              .flatMap((t) => t.split(','));

            if (tmp === undefined) throw new Error();

            const [name, type] = tmp;

            return { name, type: Number(type) };
          }
        })();
        el.innerHTML = text.replace(/( |\u200c|\u200b|‍)/, ' ');
        el.appendChild(clickToShow(json));
      }
    } catch (_) {
      console.log(_);
    }
  });
};

const register = async () => {
  await new Promise((res) =>
    setTimeout(() => {
      render();
      res();
    }, 100)
  );

  let prevPostListLength = Array.from(document.querySelectorAll('.css-1i5jedo.e18x7bg05 li.eelonj20')).map((el) =>
    el.querySelector('.css-1wpssus.e1i41bku0')
  ).length;

  document.querySelector('button.css-1cmqu6s.e18x7bg06').onclick = () => {
    const tmp = setInterval(() => {
      const postListLength = Array.from(document.querySelectorAll('.css-1i5jedo.e18x7bg05 li.eelonj20')).map((el) =>
        el.querySelector('.css-1wpssus.e1i41bku0')
      ).length;
      if (prevPostListLength + 10 !== postListLength) return;
      prevPostListLength = postListLength;
      clearInterval(tmp);
      render();
    }, 10);
  };

  const buttonContainer = document.querySelector('.css-5aeyry.e1h77j9v3');

  if (document.querySelector('.imgUpload') !== null) document.querySelector('.imgUpload').remove();

  const button = document.createElement('div');
  button.classList.add('css-16523bz');
  button.classList.add('e1h77j9v5');
  button.classList.add('imgUpload');
  button.innerHTML = '<a role="button" class="css-nqms5q e1h77j9v7"><span class="blind">스티커</span></a>';
  button.onclick = () => {
    const dialog = document.getElementById('entry_global_dialog');
    dialog.innerHTML =
      '<div class="entry-dialog-content"><div class="dialog-main-outer"><div class="dialog-main"><div class="dialog-main-inner"><label class="upload"><input type="file">사진을 선택하세요.</label><div class="dialog-button-outer"><a role="button" class="dialog-button" onclick="document.getElementById(\'entry_global_dialog\').innerHTML=\'\'">취소</a></div></div></div></div><div class="dialog-dim"></div></div>';

    /** @param {InputEvent e} */
    dialog.querySelector('label.upload input[type=file]').onchange = async (e) => {
      /** @type {HTMLInputElement} */
      const target = e.target;

      imageData = await toBase64(target.files[0]);
      document.querySelector('.css-1lpaq59.e1h77j9v12 a').textContent = `이미지 ${target.files[0].name}이 첨부되었습니다!`;
      dialog.innerHTML = '';

      if (!useCustomUpload) {
        useCustomUpload = true;
        const uploadButton = document.querySelector('a.css-1npv1w5.e13821ld0');

        uploadButton.onclick = async (e) => {
          e.stopImmediatePropagation();
          e.preventDefault();

          const { 'use-legacy': useLegacy } = await new Promise((res) => chrome.runtime.sendMessage({ key: 'use-legacy', method: 'get' }, res));

          const data = await (
            await fetch('https://playentry.org/graphql', {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                query: `mutation CREATE_ENTRYSTORY(
                $content: String
                $text: String
                $image: String
                $sticker: String
                $cursor: String
              ) {
                createEntryStory(
                  content: $content
                  text: $text
                  image: $image
                  sticker: $sticker
                  cursor: $cursor
                ) {
                  warning
                }
              }`,
                operationName: 'CREATE_ENTRYSTORY',
                variables: {
                  content:
                    document.getElementById('Write').value +
                    (imageData === undefined
                      ? ''
                      : (useLegacy ? '‍ ' : '\u200a') + encode(useLegacy ? await oldUpload(imageData) : await upload(imageData))),
                },
              }),
            })
          ).json();
          if (
            Object.keys(data).includes('errors') &&
            data.errors !== undefined &&
            data.errors.length > 0 &&
            data.errors[0] !== undefined &&
            Object.keys(data.errors[0]).includes('statusCode') &&
            data.errors[0].statusCode === 429
          ) {
            const dialog = document.getElementById('entry_global_dialog');

            dialog.innerHTML = `
              <div class="entry-dialog-content">
                <div class="css-6cuh5o ev8ee030">
                  <div class="css-r79o32 erhe2jp0">
                    <div class="css-tf849f ev8ee031">
                      도배 방지를 위해 게시물 작성이 제한되었습니다.
                      10분 후에 다시 시도해주세요.
                      <div class="css-euiv0v ev8ee034"><a role="button" class="css-4fn5vd e1hn7usz0">확인</a></div>
                    </div>
                  </div>
                </div>
               <div class="css-5eoeto ev8ee033"></div>
              </div>
            `;

            setTimeout(() => {
              Array.from(dialog.querySelectorAll('a[role=button]')).forEach((el) => (el.onclick = () => (dialog.innerHTML = '')));
            }, 10);
            return;
          } else return location.reload();
        };
      }
    };
  };

  buttonContainer.appendChild(button);
};

const interval = setInterval(() => {
  if (document.querySelector('.css-5aeyry.e1h77j9v3') !== null) {
    clearInterval(interval);
    register();
    return;
  }
}, 10);

chrome.runtime.onMessage.addListener((req) => {
  if (req === 'url') {
    const interval = setInterval(() => {
      if (document.querySelector('.css-5aeyry.e1h77j9v3') !== null) {
        clearInterval(interval);
        register();
        return;
      }
    }, 10);
  }
});
