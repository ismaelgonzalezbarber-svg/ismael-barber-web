(() => {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" })
      .catch((error) => console.warn("No se pudo activar el modo app:", error));
  });

  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (isStandalone) return;

  let installPrompt = null;
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Instalar app";
  button.setAttribute("aria-label", "Instalar Peluquería Barbería Ismael");
  button.style.cssText = [
    "position:fixed", "right:16px", "bottom:16px", "z-index:1000",
    "padding:12px 16px", "border:1px solid #f5d21a", "border-radius:999px",
    "background:#f5d21a", "color:#111", "font:800 14px Arial,sans-serif",
    "box-shadow:0 5px 22px rgba(0,0,0,.35)", "cursor:pointer"
  ].join(";");

  const note = document.createElement("div");
  note.hidden = true;
  note.setAttribute("role", "dialog");
  note.setAttribute("aria-live", "polite");
  note.style.cssText = [
    "position:fixed", "left:16px", "right:16px", "bottom:72px",
    "z-index:1001", "max-width:420px", "margin:0 auto",
    "padding:18px", "border:1px solid #f5d21a", "border-radius:12px",
    "background:#111", "color:#fff", "font:14px/1.5 Arial,sans-serif",
    "box-shadow:0 8px 28px rgba(0,0,0,.5)"
  ].join(";");
  note.innerHTML = '<strong style="color:#f5d21a">Instalar Peluquería Barbería Ismael</strong>' +
    '<p style="margin:8px 0">En Safari, toca <strong>Compartir</strong> y después <strong>Añadir a pantalla de inicio</strong>.</p>' +
    '<button type="button" style="padding:8px 12px;border:0;border-radius:7px;background:#f5d21a;color:#111;font-weight:700">Entendido</button>';
  note.querySelector("button").addEventListener("click", () => { note.hidden = true; });

  button.addEventListener("click", async () => {
    if (isIOS) {
      note.hidden = !note.hidden;
      return;
    }
    if (!installPrompt) {
      note.innerHTML = '<strong style="color:#f5d21a">Instalación disponible desde el navegador</strong>' +
        '<p style="margin:8px 0">Abre el menú del navegador y elige «Instalar aplicación» o «Añadir a pantalla de inicio».</p>' +
        '<button type="button" style="padding:8px 12px;border:0;border-radius:7px;background:#f5d21a;color:#111;font-weight:700">Entendido</button>';
      note.querySelector("button").addEventListener("click", () => { note.hidden = true; });
      note.hidden = false;
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    button.remove();
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    document.body.append(button, note);
  });

  if (isIOS) document.addEventListener("DOMContentLoaded", () => document.body.append(button, note));
  window.addEventListener("appinstalled", () => button.remove());
})();
