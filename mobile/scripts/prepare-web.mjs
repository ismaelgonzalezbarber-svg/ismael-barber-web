import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const output = resolve(here, "../www");
mkdirSync(output, { recursive: true });

const requiredFiles = ["index.html", "admin.html", "logo-ismael.png"];
for (const file of requiredFiles) {
  const source = resolve(root, file);
  if (!existsSync(source)) throw new Error(`Falta el recurso web necesario: ${file}`);
  cpSync(source, resolve(output, file));
}

// La app nativa no registra el service worker PWA ni muestra el botón de instalación.
const indexPath = resolve(output, "index.html");
let html = readFileSync(indexPath, "utf8");
html = html
  .replace(/\s*<link rel="manifest" href="\.\/manifest\.webmanifest">/i, "")
  .replace(/\s*<meta name="application-name" content="[^"]*">/i, "")
  .replace(/\s*<meta name="apple-mobile-web-app-[^"]*" content="[^"]*">/gi, "")
  .replace(/\s*<link rel="apple-touch-icon"[^>]*>/i, "")
  .replace(/\s*<script src="\.\/pwa-register\.js" defer><\/script>/i, "");
writeFileSync(indexPath, html, "utf8");

const iconsSource = resolve(root, "icons");
if (existsSync(iconsSource)) cpSync(iconsSource, resolve(output, "icons"), { recursive: true });

console.log(`Recursos web preparados para Capacitor en ${output}`);
