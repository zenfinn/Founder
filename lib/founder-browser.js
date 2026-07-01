export function isSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isAppleWebKit = /AppleWebKit/i.test(ua);
  const isChromeIos = /CriOS/i.test(ua);
  const isFirefoxIos = /FxiOS/i.test(ua);
  const isDesktopChrome = /Chrome/i.test(ua) && !/Edg/i.test(ua);
  return isAppleWebKit && !isDesktopChrome && !isChromeIos && !isFirefoxIos;
}

export function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isMacDesktop() {
  if (typeof navigator === "undefined") return false;
  return /Macintosh|Mac OS X/i.test(navigator.userAgent) && !isIos();
}
