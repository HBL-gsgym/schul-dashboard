import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}
export function harness({ pending, read, write, confirm = () => true } = {}) {
  const storage = new Map();
  if (pending) storage.set('hbl-cloud-pending-demo', JSON.stringify(pending));
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { style: {}, focus() {}, value: '', hidden: false });
    return elements.get(id);
  };
  const calls = [];
  let authListener;
  const sb = {
    from(table) {
      const query = {
        select() { return query; }, eq() { return query; },
        maybeSingle() { return table === 'hbl_dashboard_members'
          ? Promise.resolve({ data: { enabled: true } })
          : (read?.() || Promise.resolve({ data: { content: {}, revision: 0 } })); },
      };
      return query;
    },
    rpc: async (name, args) => { calls.push(args); return write?.(args) || { data: 1 }; },
    auth: {
      onAuthStateChange(fn) { authListener = fn; },
      getSession: async () => ({ data: { session: null } }),
      signOut: async () => { authListener?.('SIGNED_OUT'); return {}; },
    },
  };
  const ctx = {
    window: { savePrepFile: async () => {}, dispatchEvent() {}, addEventListener() {}, supabase: { createClient: () => sb } },
    document: { readyState: 'loading', addEventListener() {}, getElementById: element,
      createElement: () => ({}), body: { prepend() {}, appendChild() {} } },
    localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    prepDone: {}, applyPrepData: data => { ctx.prepDone = data; },
    confirm, Event: class {}, setTimeout, setInterval() {},
    location: { reload() { ctx.reloaded = true; } }, console,
  };
  // Expose lexical entry points only inside the test VM; production code is unchanged.
  const source = readFileSync(new URL('../cloud.js', import.meta.url), 'utf8')
    .replace(/\}\)\(\);\s*$/, 'window.test={loadRemote,startSession,initializeAuth};})();');
  vm.createContext(ctx);
  vm.runInContext(source, ctx);
  return { ctx, sb, calls, element, storage, api: ctx.window.test,
    pending: () => JSON.parse(storage.get('hbl-cloud-pending-demo') || 'null') };
}
