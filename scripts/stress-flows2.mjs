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
    diagnostics.push({ kind: "dialog.nativo", text: m.params.message?.slice(0, 180) || "" });
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
async function closeReminder() {
  return evaluate(`(() => {
    const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Recuérdame más tarde'));
    if (!btn) return false;
    btn.click();
    return true;
  })()`);
}
await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");

const results = {};

// Cerrar recordatorio global si aparece
await go("/agenda");
results.reminderCerrado = await closeReminder();
await sleep(500);

// Sembrar citas para hoy para poder iniciar consulta
results.citasHoy = await evaluate(`(() => {
  const key = 'vet_appointments';
  const apps = JSON.parse(localStorage.getItem(key));
  const patients = JSON.parse(localStorage.getItem('vet_patients'));
  const d = new Date();
  const today = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  const nuevos = [0,1,2].map(i => ({
    id: 'stress-today-' + i,
    patientId: patients[i*10].id,
    ownerId: patients[i*10].ownerId,
    doctorId: 'silva',
    sucursalId: 'centro',
    fecha: today,
    hora: String(9+i).padStart(2,'0') + ':00',
    motivo: 'Control stress test',
    tipo: 'control',
    status: 'programada',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  const value = JSON.stringify([...apps, ...nuevos]);
  localStorage.setItem(key, value);
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }));
  return nuevos.length;
})()`);
await sleep(900);
results.reminderCerrado2 = await closeReminder();

// Consulta: iniciar → llenar alergias → finalizar → No (sin receta)
results.consulta = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Iniciar Consulta'));
  const apps = JSON.parse(localStorage.getItem('vet_appointments'));
  const d = new Date();
  const today = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  if (!btn) return { ok:false, motivo:'sin botón Iniciar Consulta', hoy:apps.filter(a=>a.fecha===today).length };
  btn.click();
  return { ok:true };
})()`);
await sleep(1100);
results.consulta.form = await evaluate(`(() => {
  const ta = document.querySelector('textarea[name="condicionesPrevias"]');
  if (!ta) return { ok:false, motivo:'sin campo condicionesPrevias' };
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;
  setter.call(ta, 'Alergia ATOMIC: amoxicilina.');
  ta.dispatchEvent(new Event('input',{bubbles:true}));
  return { ok:true };
})()`);
await sleep(300);
results.consulta.finalizar = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Finalizar Consulta') && !(b.textContent||'').includes('hospitalizar'));
  if (!btn) return { ok:false, motivo:'sin botón Finalizar Consulta' };
  btn.click();
  return { ok:true };
})()`);
await sleep(900);
// Atomicidad: antes de responder la confirmación NO debe haber cambios guardados
results.consulta.estadoIntermedio = await evaluate(`(() => {
  const apps = JSON.parse(localStorage.getItem('vet_appointments'));
  const patients = JSON.parse(localStorage.getItem('vet_patients'));
  const cita = apps.find(a=>a.id==='stress-today-0');
  const p = patients.find(p=>p.id==='pat-0');
  return {
    cita: cita?.status,
    alergiaGuardada: (p?.conditions||'').includes('ATOMIC'),
    confirmacionVisible: document.body.innerText.includes('¿Realizar una receta?'),
  };
})()`);
let noClickeado = false;
for (let i = 0; i < 20 && !noClickeado; i++) {
  noClickeado = await evaluate(`(() => {
    const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='No');
    if (!btn) return false;
    btn.click();
    return true;
  })()`);
  if (!noClickeado) await sleep(150);
}
results.consulta.no = { ok: noClickeado };
await sleep(1200);
results.consulta.after = await evaluate(`(() => {
  const apps = JSON.parse(localStorage.getItem('vet_appointments'));
  const patients = JSON.parse(localStorage.getItem('vet_patients'));
  const cita = apps.find(a=>a.id==='stress-today-0');
  const paciente = patients.find(p=>p.id==='pat-0');
  return {
    estadoCita: cita?.status,
    diagnostico: cita?.diagnostico,
    condicionesPaciente: paciente?.conditions,
    registroHistorial: paciente?.history?.some(h=>(h.notes||'').includes('Control stress test')),
  };
})()`);

// Crear paciente en /pacientes/fichas
await go("/pacientes/fichas");
results.reminderCerrado3 = await closeReminder();
results.nuevo = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Nuevo Registro'));
  const before = JSON.parse(localStorage.getItem('vet_patients')).length;
  if (!btn) return { ok:false, motivo:'sin botón Nuevo Registro', before };
  btn.click();
  return { ok:true, before };
})()`);
await sleep(900);
results.nuevo.form = await evaluate(`(() => {
  const set = (el, v) => {
    const proto = el.tagName==='TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(el,v);
    el.dispatchEvent(new Event('input',{bubbles:true}));
  };
  const byPlaceholder = (p) => [...document.querySelectorAll('input,textarea')].find(el=>(el.placeholder||'').includes(p));
  const owner = byPlaceholder('Nombre y apellido');
  const phone = byPlaceholder('+56 9');
  const pet = byPlaceholder('Nombre de la mascota');
  if (!owner || !phone || !pet) return { ok:false, motivo:'faltan campos' };
  set(owner,'Dueño Stress Test');
  set(phone,'+56 9 9999 8888');
  set(pet,'Mascota Stress Test');
  return { ok:true };
})()`);
await sleep(300);
results.nuevo.submit = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Crear ficha'));
  if (!btn) return { ok:false, motivo:'sin botón Crear ficha' };
  btn.click();
  return { ok:true };
})()`);
await sleep(1200);
results.nuevo.after = await evaluate(`(() => {
  const patients = JSON.parse(localStorage.getItem('vet_patients'));
  const owners = JSON.parse(localStorage.getItem('vet_owners'));
  return {
    total: patients.length,
    creado: patients.some(p=>p.name==='Mascota Stress Test'),
    ownerCreado: owners.some(o=>o.name==='Dueño Stress Test'),
  };
})()`);

const uniq = [...new Map(diagnostics.map(d=>[d.kind+':'+d.text,d])).values()];
console.log(JSON.stringify({ resultados: results, diagnosticos: uniq }, null, 2));
ws.close();
