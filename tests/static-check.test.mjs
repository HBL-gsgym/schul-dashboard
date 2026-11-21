import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
for (const [name, extra, expected] of [
  ['vorhandene Ressourcen', '', null],
  ['fehlende Ressource', '<link href="./missing.css">', 'Ressource fehlt'],
  ['Pfadausbruch', '<link href="./../outside.css">', 'unzulässiger lokaler Pfad'],
  ['ähnlicher Verzeichnisname', '<link href="./../fixture-other/outside.css">', 'unzulässiger lokaler Pfad'],
]) {
  test(name, () => {
    const dir = mkdtempSync(join(tmpdir(), 'hbl-check-'));
    try {
      for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (entry.isFile()) copyFileSync(join(root, entry.name), join(dir, entry.name));
      }
      mkdirSync(join(dir, 'scripts'));
      const policyDir='supabase/functions/hbl-push-dispatch';
      mkdirSync(join(dir,policyDir),{recursive:true});
      copyFileSync(join(root,policyDir,'push-policy.mjs'),join(dir,policyDir,'push-policy.mjs'));
      copyFileSync(join(root, 'scripts/check-static.mjs'), join(dir, 'scripts/check-static.mjs'));
      const html = join(dir, 'index.html');
      writeFileSync(html, readFileSync(html, 'utf8') + extra);
      const result = spawnSync(process.execPath, [join(dir, 'scripts/check-static.mjs')], { encoding: 'utf8' });
      assert.equal(result.status, expected ? 1 : 0, result.stderr);
      if (expected) assert.ok(result.stderr.includes(expected), result.stderr);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}
