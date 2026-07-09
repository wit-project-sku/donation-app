/**
 * Bridge to the host kiosk when this app runs inside the kiosk's <webview>.
 *
 * Transport is preload-independent so it works regardless of Electron webview
 * preload quirks:
 *   guest → host : console.log(KIOSK_TAG + json)  → kiosk listens on 'console-message'
 *   host  → guest: kiosk calls window.__kioskDeliver(msg) via executeJavaScript
 *
 * Embedding is detected by the `?kiosk=1` marker the kiosk appends to the URL
 * (and, if a preload bridge happens to be injected, that too). When not embedded
 * (standalone browser / dev) every method is inert and callers fall back to
 * normal in-app navigation.
 */
const KIOSK_TAG = "[[KIOSKBRIDGE]]";

export interface KioskBridge {
  isKiosk: boolean;
  /** Close the donation webview and return the kiosk to its home screen. */
  goKioskHome(): void;
  /** Run the AI hanbok capture on the kiosk's Monitor 2. */
  takePhoto(params: { mode: "solo" | "together"; clothingKey: string }): void;
  /** Abort an in-progress capture and reset Monitor 2. */
  cancelPhoto(): void;
  /** Play the celebration/attract video on Monitor 2 (wall page). */
  showVideo(): void;
  /**
   * Subscribe to a host → guest message type. Returns an unsubscribe function.
   * Types: 'photoProgress' { phase, countdown }, 'photoResult' { url }, 'photoError' { message }.
   */
  on(type: string, listener: (payload: unknown) => void): () => void;
}

type Listener = (payload: Record<string, unknown>) => void;
const listeners = new Map<string, Set<Listener>>();

interface KioskWindow {
  __kioskDeliver?: (msg: Record<string, unknown>) => void;
  /** A preload-injected bridge, if one exists (optional secondary path). */
  kioskBridge?: { isKiosk?: boolean };
}

/**
 * True when embedded in the kiosk. Detected by (in order):
 *  1. Electron user-agent — the kiosk <webview> runs in Electron, a normal
 *     browser does not. This is the robust default (no URL marker required).
 *  2. an injected preload bridge (window.kioskBridge), if present.
 *  3. a ?kiosk=1 marker in the URL search or hash (opt-in override).
 */
function embedded(): boolean {
  try {
    if (/electron/i.test(navigator.userAgent)) return true;
  } catch {
    /* navigator may be unavailable in SSR/tests */
  }
  const w = window as unknown as KioskWindow;
  if (w.kioskBridge?.isKiosk) return true;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("kiosk") === "1") return true;
    return window.location.hash.includes("kiosk=1");
  } catch {
    return false;
  }
}

/** Send a message to the host kiosk over the console-message channel. */
function postToHost(type: string, extra?: Record<string, unknown>): void {
  try {
    console.log(KIOSK_TAG + JSON.stringify({ type, ...extra }));
  } catch {
    /* ignore */
  }
}

// Register the host → guest delivery entry point once (idempotent across HMR).
(() => {
  const w = window as unknown as KioskWindow;
  if (w.__kioskDeliver) return;
  w.__kioskDeliver = (msg) => {
    const type = typeof msg?.type === "string" ? msg.type : null;
    if (!type) return;
    listeners.get(type)?.forEach((fn) => {
      try {
        fn(msg);
      } catch {
        /* a faulty listener must not break delivery */
      }
    });
  };
})();

const bridge: KioskBridge = {
  isKiosk: true,
  goKioskHome: () => postToHost("goHome"),
  takePhoto: (params) => postToHost("takePhoto", params),
  cancelPhoto: () => postToHost("cancelPhoto"),
  showVideo: () => postToHost("showVideo"),
  on: (type, listener) => {
    let set = listeners.get(type);
    if (!set) {
      set = new Set();
      listeners.set(type, set);
    }
    set.add(listener as Listener);
    return () => set?.delete(listener as Listener);
  },
};

/** The kiosk bridge if embedded, otherwise null. */
export function getKioskBridge(): KioskBridge | null {
  return embedded() ? bridge : null;
}

/** True when running inside the kiosk webview. */
export function isEmbeddedInKiosk(): boolean {
  return embedded();
}
