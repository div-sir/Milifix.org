/* ============================================================
   MERIDIEL — on-demand 3D runtime
   Keep the 1 MB globe engine off the welcome screen. Both vendor
   scripts are independent, so they can download in parallel.
   ============================================================ */
let runtimePromise = null;

function loadScript(path, isReady) {
  if (isReady()) return Promise.resolve();

  const src = new URL(path, document.baseURI).href;
  const existing = document.querySelector(`script[data-meridiel-runtime="${src}"]`);

  return new Promise((resolve, reject) => {
    const script = existing || document.createElement("script");
    const onLoad = () => isReady()
      ? resolve()
      : fail(new Error(`${path} loaded without exposing its runtime`));
    const onError = () => fail(new Error(`${path} failed to load`));
    const fail = (error) => {
      script.remove();
      reject(error);
    };

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.src = src;
      script.async = true;
      script.dataset.meridielRuntime = src;
      document.head.appendChild(script);
    }
  });
}

export function loadGlobeRuntime() {
  if (window.Globe && window.gsap) return Promise.resolve();
  if (runtimePromise) return runtimePromise;

  runtimePromise = Promise.all([
    loadScript("vendor/globe.gl.min.js?v=20260715g", () => !!window.Globe),
    loadScript("vendor/gsap.min.js?v=20260715g", () => !!window.gsap),
  ]).then(() => undefined).catch((error) => {
    runtimePromise = null;
    throw error;
  });
  return runtimePromise;
}
