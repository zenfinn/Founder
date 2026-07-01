const LISTEN_MS = 12000;

export function transcribeOnceWithBrowser({ lang = "de-DE", timeoutMs = LISTEN_MS } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Spracherkennung nicht verfügbar."));
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      reject(new Error("Spracherkennung nicht verfügbar."));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let settled = false;

    const finish = (fn) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      fn();
    };

    const timer = window.setTimeout(() => {
      finish(() => reject(new Error("Keine Sprache erkannt — bitte nochmal sprechen.")));
    }, timeoutMs);

    recognition.onresult = (event) => {
      const text = String(event.results?.[0]?.[0]?.transcript ?? "").trim();
      if (text) finish(() => resolve(text));
    };

    recognition.onerror = (event) => {
      const code = event.error ?? "unknown";
      if (code === "no-speech" || code === "aborted") {
        finish(() => reject(new Error("Keine Sprache erkannt — bitte nochmal sprechen.")));
        return;
      }
      if (code === "not-allowed" || code === "service-not-allowed") {
        finish(() => reject(new Error("Mikrofon-Zugriff verweigert.")));
        return;
      }
      finish(() => reject(new Error(`Spracherkennung: ${code}`)));
    };

    recognition.onend = () => {
      if (!settled) {
        finish(() => reject(new Error("Keine Sprache erkannt — bitte nochmal sprechen.")));
      }
    };

    try {
      recognition.start();
    } catch (error) {
      finish(() => reject(error));
    }
  });
}
