export function audioBlobFileName(blob) {
  const type = String(blob?.type ?? "").toLowerCase();
  if (type.includes("mp4") || type.includes("aac") || type.includes("m4a")) return "speech.m4a";
  if (type.includes("ogg")) return "speech.ogg";
  if (type.includes("wav")) return "speech.wav";
  if (type.includes("mpeg") || type.includes("mp3")) return "speech.mp3";
  return "speech.webm";
}
