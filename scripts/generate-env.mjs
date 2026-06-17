#!/usr/bin/env node
/**
 * generate-env.mjs
 *
 * Genera src/app/core/environments/environment.prod.ts a partir de
 * variables de entorno del sistema o de un archivo .env.local.
 *
 * Uso:
 *   node scripts/generate-env.mjs
 *
 * Variables de entorno requeridas:
 *   FIREBASE_API_KEY
 *   FIREBASE_AUTH_DOMAIN
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_STORAGE_BUCKET
 *   FIREBASE_MESSAGING_SENDER_ID
 *   FIREBASE_APP_ID
 *
 * En desarrollo local, podés cargar un archivo .env.local así:
 *   node --env-file=.env.local scripts/generate-env.mjs   (Node >= 20.6)
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, 'utf-8')
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return acc;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');

      if (key) {
        acc[key] = value;
      }

      return acc;
    }, {});
}

const envValues = {
  ...process.env,
  ...loadEnvFile(resolve(ROOT, '.env.local'))
};

// ── Validar que todas las variables estén presentes ──────────────────────────
const REQUIRED_VARS = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
];

const missing = REQUIRED_VARS.filter((v) => !envValues[v]);
if (missing.length > 0) {
  console.error('\n❌ Faltan variables de entorno para generar environment.prod.ts:\n');
  missing.forEach((v) => console.error(`   - ${v}`));
  console.error('\nDefinílas en tu CI/CD o en un archivo .env.local (no comitear).\n');
  process.exit(1);
}

// ── Generar el archivo ────────────────────────────────────────────────────────
const content = `// ⚠️  ARCHIVO GENERADO AUTOMÁTICAMENTE — NO EDITAR NI COMITEAR
// Generado por: scripts/generate-env.mjs
// Fuente: variables de entorno del sistema / CI-CD

export const environment = {
  production: true,
  firebase: {
    apiKey: "${envValues.FIREBASE_API_KEY}",
    authDomain: "${envValues.FIREBASE_AUTH_DOMAIN}",
    projectId: "${envValues.FIREBASE_PROJECT_ID}",
    storageBucket: "${envValues.FIREBASE_STORAGE_BUCKET}",
    messagingSenderId: "${envValues.FIREBASE_MESSAGING_SENDER_ID}",
    appId: "${envValues.FIREBASE_APP_ID}"
  },
  useEmulators: false
};
`;

const outputPath = resolve(ROOT, 'src/app/core/environments/environment.prod.ts');
writeFileSync(outputPath, content, 'utf-8');
console.log(`✅ environment.prod.ts generado en:\n   ${outputPath}\n`);
