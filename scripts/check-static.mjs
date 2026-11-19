#!/usr/bin/env node
/* Statischer Offline-Check für das HBL-Dashboard; keine Supabase-/Netzwerkzugriffe. */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const checked = [];
const read = name => readFileSync(resolve(root, name), "utf8");
const error = message => problems.push(message);
const parseJs = (name, code) => {
  try {
    new Script(code, { filename: name });
    checked.push(name);
  } catch (cause) {
    error(name + ": JavaScript-Syntaxfehler: " + cause.message);
  }
};
const isLocal = url => url.startsWith("./");
const localPath = url => url.split(/[?#]/, 1)[0].slice(2);
const checkResource = (url, context) => {
  if (!isLocal(url)) return;
  const relative = localPath(url);
  const target = resolve(root, relative);
  if (!(target === root || target.startsWith(root + sep))) {
    error(context + ": unzulässiger lokaler Pfad " + url);
    return;
  }
  if (!existsSync(target)) {
    error(context + ": Ressource fehlt: " + url);
  }
};
const html = read("index.html");
const jsFiles = readdirSync(root).filter(name => name.endsWith(".js") && statSync(resolve(root, name)).isFile());
for (const file of jsFiles) parseJs(file, read(file));

// HTML-Inline-Skripte als klassische Skripte prüfen (keine JS-Build-Pipeline).
let inline = 0;
const scripts = /<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi;
for (const match of html.matchAll(scripts)) {
  if (!match[1].trim()) continue;
  inline += 1;
  parseJs("index.html#inline-" + inline, match[1]);
}
if (!inline) error("index.html: keine Inline-Skripte gefunden; Parser oder Quelltext prüfen");

// Nur echte Script-/Link-Tags prüfen, nicht URL-Literale in JS-Strings.
const htmlReferences = [...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*(["'])(.*?)\1[^>]*>/gi)].map(m => m[2]);
for (const ref of htmlReferences) checkResource(ref, "index.html");
const shellFiles = htmlReferences.filter(ref => isLocal(ref) && /\.(?:js|css)(?:[?#]|$)/i.test(ref));
if (!shellFiles.length) error("index.html: keine lokalen JS/CSS-Referenzen gefunden");

let manifest;
try {
  manifest = JSON.parse(read("manifest.webmanifest"));
  if (!Array.isArray(manifest.icons) || !manifest.icons.length) error("manifest.webmanifest: keine Icons");
  for (const icon of manifest.icons || []) checkResource(icon.src || "", "manifest.webmanifest");
  checked.push("manifest.webmanifest");
} catch (cause) {
  error("manifest.webmanifest: JSON-Fehler: " + cause.message);
}

const sw = read("sw.js");
const assetDeclaration = sw.match(/\bconst\s+ASSETS\s*=\s*\[([\s\S]*?)\];/);
if (!assetDeclaration) {
  error("sw.js: ASSETS-Liste fehlt");
} else {
  const cached = [...assetDeclaration[1].matchAll(/(["'])(\.\/.*?)\1/g)].map(m => m[2]);
  for (const asset of cached) checkResource(asset, "sw.js");
  for (const ref of shellFiles) if (!cached.includes(ref)) {
    error("sw.js: in index.html eingebundene JS-/CSS-Datei fehlt in ASSETS: " + ref);
  }
  if (!cached.includes("./index.html")) error("sw.js: index.html fehlt in App-Shell");
}
if (!/\bconst\s+CACHE\s*=\s*["'][^"']+["']/.test(sw)) error("sw.js: CACHE-Kennung fehlt");

if (problems.length) {
  console.error("HBL-Static-Check FEHLGESCHLAGEN (" + problems.length + "):");
  for (const problem of problems) console.error(" - " + problem);
  process.exitCode = 1;
} else {
  console.log("HBL-Static-Check erfolgreich.");
  console.log("Geprüft: " + checked.length + " JavaScript-/JSON-Einheiten, " +
    shellFiles.length + " lokale JS-/CSS-Referenzen und Service-Worker-App-Shell.");
  console.log("Hinweis: Keine Browser-, RLS-, Auth-, Backend- oder Push-E2E-Tests.");
}
