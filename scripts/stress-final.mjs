const CDP = "http://localhost:9344";
const targets = await (await fetch(`${CDP}/json/list`)).json();
const page = targets.find((t) => t.type === "page" && t.url.includes("localhost:5191"));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0;
const pending = new Map();
const diagnostics = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === "Page.javascriptDialogOpening") {
    diagnostics.push({ kind: "dialog.nativo", text: m.params.message?.slice(0, 150) || "" });
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
  await sleep(1000);
}
async function closeReminder() {
  return evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').includes('Recuérdame más tarde')); if(!b) return false; b.click(); return true; })()`);
}
await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");

const results = {};

// Agenda: vistas semana/mes y mostrar finalizadas
await go("/agenda");
await closeReminder();
results.agenda = {};
for (const label of ["semana", "mes"]) {
  const t = Date.now();
  const clicked = await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').trim().toLowerCase()==='${label}'); if(!b) return false; b.click(); return true; })()`);
  await sleep(900);
  results.agenda[label] = {
    clickeado: clicked,
    ms: Date.now() - t,
    texto: await evaluate(`document.body.innerText.length`),
    citasVisibles: await evaluate(`(document.body.innerText.match(/Dr\\.|Dra\\./g)||[]).length`),
  };
}
const tFin = Date.now();
const finClicked = await evaluate(`(() => { const el=[...document.querySelectorAll('button,label,input')].find(x=>(x.textContent||'').includes('Mostrar citas finalizadas')||(x.getAttribute('aria-label')||'').includes('finalizadas')); if(!el) return false; el.click(); return true; })()`);
await sleep(1000);
results.agenda.finalizadas = { clickeado: finClicked, ms: Date.now() - tFin, texto: await evaluate(`document.body.innerText.length`) };

// Historial clínico directo de paciente con muchos registros
await go("/pacientes/pat-0/historial");
await closeReminder();
results.historial = await evaluate(`({
  ruta: location.pathname,
  texto: document.body.innerText.length,
  tieneHistorial: document.body.innerText.toLowerCase().includes('historial'),
  registros: (document.body.innerText.match(/Consulta de control/g)||[]).length,
})`);

// Inventario con stock bajo y vencidos
await go("/inventario");
await closeReminder();
results.inventario = await evaluate(`({
  texto: document.body.innerText.length,
  vencidos: (document.body.innerText.match(/Vencido|vencido/g)||[]).length,
  stockBajo: (document.body.innerText.match(/Stock bajo|stock bajo|Crítico/g)||[]).length,
})`);

// Tareas con 87 pendientes y 19 alertas
await go("/tareas");
await closeReminder();
results.tareas = await evaluate(`({
  texto: document.body.innerText.length,
  filas: [...document.querySelectorAll('div')].filter(d=>typeof d.className==='string'&&d.className.includes('rounded-xl border p-4')).length,
  urgentes: [...document.querySelectorAll('.vetcare-task-urgent')].length,
})`);

const uniq = [...new Map(diagnostics.map(d=>[d.kind+':'+d.text,d])).values()];
console.log(JSON.stringify({ resultados: results, diagnosticos: uniq }, null, 2));
ws.close();
