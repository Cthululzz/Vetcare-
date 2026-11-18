const CDP = "http://localhost:9344";
const targets = await (await fetch(`${CDP}/json/list`)).json();
const page = targets.find((t) => t.type === "page" && t.url.includes("localhost:5191"));
if (!page) throw new Error("No page target");

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
const diagnostics = [];

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === "Page.javascriptDialogOpening") {
    diagnostics.push({ kind: "dialog.nativo", text: msg.params.message?.slice(0, 200) || "" });
    send("Page.handleJavaScriptDialog", { accept: true });
  }
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
    return;
  }
  if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails;
    diagnostics.push({ kind: "exception", text: d.text, description: d.exception?.description || "" });
  }
  if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
    diagnostics.push({ kind: `console.${msg.params.type}`, text: msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ") });
  }
  if (msg.method === "Log.entryAdded" && ["error", "warning"].includes(msg.params.entry.level)) {
    diagnostics.push({ kind: `log.${msg.params.entry.level}`, text: msg.params.entry.text });
  }
};

function send(method, params = {}) {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((resolve, reject) => pending.set(msgId, { resolve, reject }));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
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

// ---------- 1. Evolución clínica ----------
await go("/pacientes/hospitalizados");
results.evolucion = await evaluate(`(() => {
  const hs = JSON.parse(localStorage.getItem('vet_hospitalizations'));
  const before = hs.reduce((a,h)=>a+(h.evolutions||[]).length,0);
  const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Evolución'));
  if (!btn) return { ok:false, motivo:'sin botón Evolución', before };
  btn.click();
  return { ok:true, before, cliqueado:true };
})()`);
await sleep(900);
results.evolucion.form = await evaluate(`(() => {
  const ta = document.querySelector('textarea[name="notes"]');
  if (!ta) return { ok:false, motivo:'sin textarea' };
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;
  setter.call(ta, 'Stress test: evolución registrada automáticamente sin incidentes.');
  ta.dispatchEvent(new Event('input',{bubbles:true}));
  return { ok:true };
})()`);
await sleep(300);
results.evolucion.submit = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Guardar Evolución'));
  if (!btn) return { ok:false, motivo:'sin botón Guardar Evolución' };
  btn.click();
  return { ok:true };
})()`);
await sleep(1000);
results.evolucion.after = await evaluate(`(() => {
  const hs = JSON.parse(localStorage.getItem('vet_hospitalizations'));
  return { total: hs.reduce((a,h)=>a+(h.evolutions||[]).length,0), nueva: hs.some(h=>(h.evolutions||[]).some(e=>(e.notes||'').includes('Stress test'))) };
})()`);

// ---------- 2. Plan de remedios + administrar dosis ----------
await go("/pacientes/hospitalizados");
results.dosis = await evaluate(`(() => {
  const hs = JSON.parse(localStorage.getItem('vet_hospitalizations'));
  const before = hs.reduce((a,h)=>a+(h.medications||[]).length,0);
  const planBtn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Plan de remedios'));
  if (!planBtn) return { ok:false, motivo:'sin botón Plan de remedios', before };
  planBtn.click();
  return { ok:true, before, cliqueado:true };
})()`);
await sleep(900);
results.dosis.administrar = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Administrar'));
  if (!btn) return { ok:false, motivo:'sin botón Administrar' };
  btn.click();
  return { ok:true };
})()`);
await sleep(700);
results.dosis.confirmModal = await evaluate(`(() => {
  const text = document.body.innerText;
  return {
    visible: text.includes('Confirmar administración'),
    alergiasEnConfirmacion: text.includes('Alergias del paciente'),
    botonSi: [...document.querySelectorAll('button')].some(b=>(b.textContent||'').includes('Sí, administrar')),
    botonNo: [...document.querySelectorAll('button')].some(b=>(b.textContent||'').includes('No, volver')),
  };
})()`);
// Cancelar primero: no debe registrar dosis
results.dosis.cancelar = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('No, volver'));
  if (!btn) return { ok:false };
  btn.click();
  return { ok:true };
})()`);
await sleep(500);
results.dosis.despuesCancelar = await evaluate(`(() => {
  const hs = JSON.parse(localStorage.getItem('vet_hospitalizations'));
  return { total: hs.reduce((a,h)=>a+(h.medications||[]).length,0) };
})()`);
// Confirmar: sí debe registrar dosis
await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Administrar'));
  btn?.click();
  return true;
})()`);
await sleep(500);
results.dosis.confirmar = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Sí, administrar'));
  if (!btn) return { ok:false, motivo:'sin botón Sí, administrar' };
  btn.click();
  return { ok:true };
})()`);
await sleep(1000);
results.dosis.after = await evaluate(`(() => {
  const hs = JSON.parse(localStorage.getItem('vet_hospitalizations'));
  const products = JSON.parse(localStorage.getItem('vet_inventory'));
  return {
    total: hs.reduce((a,h)=>a+(h.medications||[]).length,0),
    stockNegativo: products.filter(p=>p.currentStock < 0).length,
    sinProducto: products.filter(p=>!p.id || !p.name).length,
  };
})()`);

// ---------- 3. Consulta desde agenda ----------
await go("/agenda");
results.consulta = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Iniciar Consulta'));
  const hs = JSON.parse(localStorage.getItem('vet_appointments'));
  if (!btn) return { ok:false, motivo:'sin botón Iniciar Consulta', totalCitas:hs.length };
  btn.click();
  return { ok:true, totalCitas:hs.length };
})()`);
await sleep(1000);
results.consulta.form = await evaluate(`(() => {
  const ta = document.querySelector('textarea[name="condicionesPrevias"]');
  if (!ta) return { ok:false, motivo:'sin campo condicionesPrevias' };
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;
  setter.call(ta, 'Alergia registrada en stress test: penicilina.');
  ta.dispatchEvent(new Event('input',{bubbles:true}));
  return { ok:true };
})()`);
await sleep(300);
results.consulta.finish = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Finalizar consulta'));
  if (!btn) return { ok:false, motivo:'sin botón Finalizar consulta', bots:[...document.querySelectorAll('button')].map(b=>(b.textContent||'').trim()).slice(-15) };
  btn.click();
  return { ok:true };
})()`);
await sleep(900);
results.consulta.confirm = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b=>/Sí|Confirmar|Finalizar/.test((b.textContent||'').trim()));
  if (!btn) return { ok:false, motivo:'sin confirmación' };
  btn.click();
  return { ok:true, texto:(btn.textContent||'').trim() };
})()`);
await sleep(1000);
results.consulta.after = await evaluate(`(() => {
  const apps = JSON.parse(localStorage.getItem('vet_appointments'));
  const patients = JSON.parse(localStorage.getItem('vet_patients'));
  return {
    finalizadas: apps.filter(a=>a.status==='finalizada').length,
    conAlergiaDeTest: patients.filter(p=>(p.conditions||'').includes('stress test')).length,
  };
})()`);

// ---------- 4. Crear paciente desde fichas ----------
await go("/pacientes/fichas");
results.nuevoPaciente = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Nuevo Registro'));
  const before = JSON.parse(localStorage.getItem('vet_patients')).length;
  if (!btn) return { ok:false, motivo:'sin botón Nuevo Registro', before };
  btn.click();
  return { ok:true, before };
})()`);
await sleep(900);
results.nuevoPaciente.form = await evaluate(`(() => {
  const set = (el, v) => {
    const proto = el.tagName==='TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(el,v);
    el.dispatchEvent(new Event('input',{bubbles:true}));
  };
  const byPlaceholder = (p) => [...document.querySelectorAll('input,textarea')].find(el=>(el.placeholder||'').includes(p));
  const propietario = byPlaceholder('Nombre y apellido');
  const telefono = byPlaceholder('+56 9');
  const mascota = byPlaceholder('Nombre de la mascota');
  if (!propietario || !telefono || !mascota) return { ok:false, motivo:'faltan campos' };
  set(propietario,'Dueño Stress Test');
  set(telefono,'+56 9 9999 8888');
  set(mascota,'Mascota Stress Test');
  return { ok:true };
})()`);
await sleep(300);
results.nuevoPaciente.submit = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Crear ficha'));
  if (!btn) return { ok:false, motivo:'sin botón Crear ficha' };
  btn.click();
  return { ok:true };
})()`);
await sleep(1000);
results.nuevoPaciente.after = await evaluate(`(() => {
  const patients = JSON.parse(localStorage.getItem('vet_patients'));
  const owners = JSON.parse(localStorage.getItem('vet_owners'));
  return {
    total: patients.length,
    creado: patients.some(p=>p.name==='Mascota Stress Test'),
    ownerCreado: owners.some(o=>o.name==='Dueño Stress Test'),
    owners: owners.length,
  };
})()`);

const unique = [...new Map(diagnostics.map(d=>[d.kind+':'+d.text,d])).values()];
console.log(JSON.stringify({ resultados: results, diagnosticos: unique, totalDiagnosticos: unique.length }, null, 2));
ws.close();
