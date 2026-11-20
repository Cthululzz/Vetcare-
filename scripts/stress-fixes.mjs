const CDP = "http://localhost:9344";
const targets = await (await fetch(`${CDP}/json/list`)).json();
const page = targets.find((t) => t.type === "page" && t.url.includes("localhost:5191"));
if (!page) throw new Error("No page target");

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0;
const pending = new Map();
const diagnostics = [];

ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === "Page.javascriptDialogOpening") {
    diagnostics.push({ kind: "dialog.nativo", text: m.params.message?.slice(0, 160) || "" });
    send("Page.handleJavaScriptDialog", { accept: true });
  }
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
};
function send(method, params = {}) {
  const n = ++id;
  ws.send(JSON.stringify({ id: n, method, params }));
  return new Promise((r) => pending.set(n, r));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function go(path) {
  await send("Page.navigate", { url: `http://localhost:5191${path}` });
  for (let i = 0; i < 60; i++) {
    await sleep(100);
    try { if (await evaluate("document.readyState") === "complete") break; } catch {}
  }
  await sleep(1200);
}
await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");

const results = {};

// ---------- 1. Recordatorio global limitado ----------
await go("/");
results.recordatorio = await evaluate(`(() => {
  const text = document.body.innerText;
  const titulo = text.includes('Recordatorio de Inventario');
  const botonesRetiro = [...document.querySelectorAll('button')].filter(b =>
    (b.textContent||'').includes('Pendiente') && (b.textContent||'').includes('Cantidad:')
  ).length;
  return {
    visible: titulo,
    retirosMostrados: botonesRetiro,
    limiteRespetado: botonesRetiro <= 5,
    textoLimitado: text.includes('Mostrando 5 de'),
    verTodos: [...document.querySelectorAll('button')].some(b=>(b.textContent||'').includes('Ver todos en Inventario')),
  };
})()`);
if (results.recordatorio.verTodos) {
  await evaluate(`(() => {
    const b = [...document.querySelectorAll('button')].find(x=>(x.textContent||'').includes('Ver todos en Inventario'));
    b?.click();
    return true;
  })()`);
  await sleep(1000);
  results.recordatorio.rutaTrasVerTodos = await evaluate(`location.pathname`);
}

// ---------- 2. Camas duplicadas: se derrumban al escribir ----------
await evaluate(`(() => {
  const hs = JSON.parse(localStorage.getItem('vet_hospitalizations'));
  const activas = hs.filter(h=>h.status==='activa').slice(0,3);
  // El duplicado debe ser real dentro de una misma sucursal; el mismo nombre
  // en sedes distintas es válido y ya no se cura.
  for (const h of activas) {
    h.bed = 'Cama TEST-DUP';
    h.organizationId = 'vet-piloto';
    h.sucursalId = 'centro';
  }
  const value = JSON.stringify(hs);
  localStorage.setItem('vet_hospitalizations', value);
  window.dispatchEvent(new StorageEvent('storage', { key:'vet_hospitalizations', newValue:value }));
  return activas.length;
})()`);
await go("/pacientes/hospitalizados");
results.camasDuplicadasAntes = await evaluate(`(() => {
  const hs = JSON.parse(localStorage.getItem('vet_hospitalizations'));
  const beds = hs.filter(h=>h.status==='activa' && h.bed==='Cama TEST-DUP');
  return beds.length;
})()`);
// Escritura real: registrar una evolución
const evoBtn = await evaluate(`(() => {
  const b = [...document.querySelectorAll('button')].find(x=>(x.textContent||'').includes('Evolución'));
  if (!b) return false;
  b.click();
  return true;
})()`);
await sleep(800);
results.evolucionAbrio = evoBtn;
await evaluate(`(() => {
  const ta = document.querySelector('textarea[name="notes"]');
  if (!ta) return false;
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(ta,'Evolución dedupe test');
  ta.dispatchEvent(new Event('input',{bubbles:true}));
  return true;
})()`);
await sleep(300);
await evaluate(`(() => {
  const b = [...document.querySelectorAll('button')].find(x=>(x.textContent||'').includes('Guardar Evolución'));
  if (!b) return false;
  b.click();
  return true;
})()`);
await sleep(1000);
results.camasDespues = await evaluate(`(() => {
  const hs = JSON.parse(localStorage.getItem('vet_hospitalizations'));
  const ps = JSON.parse(localStorage.getItem('vet_patients'));
  const by = Object.fromEntries(ps.map(p=>[p.id,p]));
  const activas = hs.filter(h=>h.status==='activa' && h.bed && by[h.patientId]?.isActive);
  const beds = activas.map(h=>h.bed);
  const claves = activas.map(h=>[h.organizationId,h.sucursalId,h.bed].join('|'));
  const dupes = claves.filter((b,i)=>claves.indexOf(b)!==i);
  return {
    totalActivasConCama: activas.length,
    camasUnicas: new Set(beds).size,
    duplicados: dupes.length,
    camaTestDup: beds.filter(b=>b==='Cama TEST-DUP').length,
    fantasmasIgnorados: hs.filter(h=>h.status==='activa'&&h.bed==='Cama TEST-DUP'&&!by[h.patientId]?.isActive).length,
    evolucionGuardada: hs.some(h=>(h.evolutions||[]).some(e=>(e.notes||'').includes('Evolución dedupe test'))),
  };
})()`);

const uniq = [...new Map(diagnostics.map(d=>[d.kind+':'+d.text,d])).values()];
console.log(JSON.stringify({ resultados: results, diagnosticos: uniq, totalDiagnosticos: uniq.length }, null, 2));
ws.close();
