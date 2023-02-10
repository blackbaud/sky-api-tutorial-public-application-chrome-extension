export function randomString(possible, length) {
  let text = "";
  const possibleLength = possible.length;
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possibleLength));
  }
  return text;
}
