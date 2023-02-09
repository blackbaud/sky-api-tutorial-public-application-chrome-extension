import { randomString } from "./random";

export function getState(length = 40) {
  const possibleChacters = "abcdefghijklmnopqrstuvwxyz0123456789";
  return randomString(possibleChacters, length);
}
