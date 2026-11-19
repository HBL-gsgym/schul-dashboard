import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, deferred } from './cloud-harness.mjs';

const session = { user: { id: 'demo' } };
async function ready(h) { await h.api.initializeAuth(); await h.api.startSession(session); }

test('Änderung während Cloud-Lesen bleibt erhalten, auch nach erfolgreichem Speichern', async () => {
  const response = deferred();
  let delay = false;
  const h = harness({ read: () => delay ? response.promise : Promise.resolve({ data: { content: {}, revision: 0 } }) });
  await ready(h);
  delay = true;
  const loading = h.api.loadRemote();
  await new Promise(r => setImmediate(r));
  h.ctx.prepDone = { demo: 'neu' };
  await h.ctx.window.savePrepFile();
  response.resolve({ data: { content: { demo: 'alt' }, revision: 0 } });
  await loading;
  assert.equal(h.ctx.prepDone.demo, 'neu');
});

test('Fehlgeschlagene Speicherung behält Sicherung bei verspäteter Cloud-Antwort', async () => {
  const response = deferred();
  let delay = false;
  const h = harness({ read: () => delay ? response.promise : Promise.resolve({ data: { content: {}, revision: 0 } }),
    write: () => ({ error: { message: 'VERSION_CONFLICT' } }) });
  await ready(h); delay = true;
  const loading = h.api.loadRemote();
  await new Promise(r => setImmediate(r));
  h.ctx.prepDone = { demo: 'lokal' };
  await assert.rejects(h.ctx.window.savePrepFile());
  response.resolve({ data: { content: {}, revision: 2 } });
  await loading;
  assert.equal(h.ctx.prepDone.demo, 'lokal');
  assert.equal(h.pending().content.demo, 'lokal');
});

test('Neustart stellt Pending-Daten für Export wieder her; Konflikt überschreibt nichts', async () => {
  const h = harness({ pending: { content: { demo: 'Sicherung' }, expectedRevision: 3 },
    read: () => Promise.resolve({ data: { revision: 4 } }) });
  await ready(h);
  assert.equal(JSON.parse(JSON.stringify(h.ctx.prepDone)).demo, 'Sicherung');
  await h.element('hblCloudRetry').onclick();
  assert.equal(h.calls.length, 0);
  assert.equal(h.pending().content.demo, 'Sicherung');
});

test('Erneutes Speichern schreibt die wiederhergestellte Sicherung', async () => {
  const h = harness({ pending: { content: { demo: 'Sicherung' }, expectedRevision: 3 },
    read: () => Promise.resolve({ data: { revision: 3 } }), write: () => ({ data: 4 }) });
  await ready(h);
  await h.element('hblCloudRetry').onclick();
  assert.equal(h.calls[0].p_content.demo, 'Sicherung');
  assert.equal(h.calls[0].p_expected_revision, 3);
  assert.equal(h.pending(), null);
});

test('Abgebrochener erzwungener Abgleich erhält lokale Sicherung', async () => {
  const h = harness({ pending: { content: { demo: 'Sicherung' }, expectedRevision: 3 }, confirm: () => false });
  await ready(h);
  await h.api.loadRemote({ force: true });
  assert.equal(h.ctx.prepDone.demo, 'Sicherung');
  assert.equal(h.pending().content.demo, 'Sicherung');
});

test('Antwort aus alter Sitzung wird nach Abmeldung ignoriert', async () => {
  const response = deferred(); let delay = false;
  const h = harness({ read: () => delay ? response.promise : Promise.resolve({ data: { content: {}, revision: 0 } }) });
  await ready(h); delay = true;
  const loading = h.api.loadRemote();
  await new Promise(r => setImmediate(r));
  await h.sb.auth.signOut();
  response.resolve({ data: { content: { demo: 'fremd' }, revision: 1 } });
  await loading;
  assert.equal(h.ctx.prepDone.demo, undefined);
});
