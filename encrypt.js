/** @param {String message} */
const encode = (message) => {
  const byteArray = Array.from(new TextEncoder().encode(message));
  const bitArray = byteArray.flatMap((b) => b.toString(2).padStart(8, 0).split(''));
  console.log(bitArray);
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
