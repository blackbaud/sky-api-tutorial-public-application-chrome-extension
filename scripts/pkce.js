import { SHA256, enc } from "crypto-js";
import { randomString } from "./random";

export function getPkce() {
  const possibleChacters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const verifier = randomString(possibleChacters, 128);

  const challenge = SHA256(verifier).toString(enc.Base64url);

  return {
    method: "S256",
    challenge: challenge,
    verifier: verifier,
  };
}
