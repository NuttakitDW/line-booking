"use client";

import liff from "@line/liff";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID!;

let liffInitialized = false;

export async function initLiff() {
  if (liffInitialized) return;

  await liff.init({ liffId: LIFF_ID });
  liffInitialized = true;

  if (!liff.isLoggedIn()) {
    liff.login();
  }
}

export async function getLiffProfile() {
  if (!liffInitialized) await initLiff();
  return liff.getProfile();
}

export function isInLineApp(): boolean {
  return liff.isInClient();
}

export function getLiffLineDeepLink(): string {
  return `https://liff.line.me/${LIFF_ID}`;
}

export { liff };
