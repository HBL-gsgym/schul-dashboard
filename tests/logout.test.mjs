import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { harness, deferred } from './cloud-harness.mjs';

async function ready(h) {
  await h.api.initializeAuth();
  await h.api.startSession({ user: { id: 'demo' } });
}
function mountProfile(h) {
  const absent = new Set(['hblProfileButton', 'hblProfileOverlay']);
  h.ctx.document.getElementById = id => absent.has(id) ? null : h.element(id);
  h.ctx.document.querySelector = () => ({ insertBefore: node => absent.delete(node.id) });
  h.ctx.document.createElement = () => ({ setAttribute() {}, addEventListener() {} });
  h.ctx.document.body.appendChild = node => absent.delete(node.id);
  const source = readFileSync(new URL('../hbl-v58.js', import.meta.url), 'utf8')
    .replace(/\}\)\(\);\s*$/, 'window.profileTest={mount};})();');
  vm.runInContext(source, h.ctx);
  h.ctx.window.profileTest.mount();
}

for (const entry of ['hblCloudLogout', 'hblProfileLogout']) {
  test(`${entry}: Push wird vor Auth-Abmeldung bereinigt`, async () => {
    const h = harness(); await ready(h); if (entry.includes('Profile')) mountProfile(h);
    const calls = [];
    h.ctx.window.hblPushOnLogout = async () => calls.push('push');
    h.sb.auth.signOut = async () => { calls.push('auth'); return {}; };
    await h.element(entry).onclick();
    assert.deepEqual(calls, ['push', 'auth']);
    assert.equal(h.ctx.reloaded, true);
  });
  test(`${entry}: Abbruch bei ungesicherten Änderungen erhält Sicherung`, async () => {
    const h = harness({ pending: { content: { demo: 'lokal' }, expectedRevision: 0 }, confirm: () => false });
    await ready(h); if (entry.includes('Profile')) mountProfile(h);
    let called = false;
    h.ctx.window.hblPushOnLogout = async () => { called = true; };
    await h.element(entry).onclick();
    assert.equal(called, false);
    assert.equal(h.ctx.reloaded, undefined);
    assert.equal(h.pending().content.demo, 'lokal');
  });
}
test('Push-Fehler verhindert Abmeldung nicht und wird angezeigt', async () => {
  const h = harness(); await ready(h);
  h.ctx.window.hblPushOnLogout = async () => { throw Error('offline'); };
  assert.equal(await h.ctx.window.hblLogout(), true);
  assert.equal(h.ctx.reloaded, true);
  assert.match(h.ctx.alerts[0], /Mitteilungen/);
});
test('Auth-Fehler zeigt Fehlermeldung ohne Neuladen', async () => {
  const h = harness(); await ready(h);
  h.sb.auth.signOut = async () => ({ error: { message: 'offline' } });
  assert.equal(await h.ctx.window.hblLogout(), false);
  assert.equal(h.ctx.reloaded, undefined);
  assert.match(h.ctx.alerts[0], /Abmeldung fehlgeschlagen/);
});
test('Abmeldung wartet auf laufende Speicherung und verhindert Doppelklick', async () => {
  const response = deferred();
  const h = harness({ write: () => response.promise }); await ready(h);
  h.ctx.prepDone = { demo: 'neu' };
  const saving = h.ctx.window.savePrepFile();
  const leaving = h.ctx.window.hblLogout();
  assert.equal(await h.ctx.window.hblLogout(), false);
  assert.equal(h.ctx.reloaded, undefined);
  response.resolve({ data: 1 });
  await saving; await leaving;
  assert.equal(h.ctx.reloaded, true);
});

test('Push-Abmeldung versucht Geräte-Abmeldung auch bei Datenbankfehler', async () => {
  let unsubscribed = false;
  const ctx = {
    window: { addEventListener() {}, PushManager: {}, hblCloudUser: () => ({ id: 'demo' }),
      hblCloudClient: { from: () => ({ delete: () => ({ eq: async () => ({ error: { message: 'offline' } }) }) }) } },
    navigator: { serviceWorker: { getRegistration: async () => ({ pushManager: { getSubscription: async () => ({
      endpoint: 'https://example.invalid/synthetic', unsubscribe: async () => { unsubscribed = true; return true; },
    }) } }) } },
    document: { readyState: 'loading', addEventListener() {} },
  };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('../hbl-v55.js', import.meta.url), 'utf8'), ctx);
  await assert.rejects(ctx.window.hblPushOnLogout(), /nicht vollständig/);
  assert.equal(unsubscribed, true);
  delete ctx.navigator.serviceWorker;
  await ctx.window.hblPushOnLogout();
});
