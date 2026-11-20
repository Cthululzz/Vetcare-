const CDP = "http://localhost:9344";
const targets = await (await fetch(`${CDP}/json/list`)).json();
const page = targets.find((t) => t.type === "page" && t.url.includes("localhost:5191"));
if (!page) throw new Error("No page target en 5191");

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
  if (m.method === "Runtime.exceptionThrown") {
    const d = m.params.exceptionDetails;
    diagnostics.push({ kind: "exception", text: d.text, description: d.exception?.description || "" });
  }
  if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) {
    diagnostics.push({ kind: "console." + m.params.type, text: m.params.args.map(a => a.value ?? a.description ?? "").join(" ") });
  }
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
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
  await send("Page.navigate", { url: "http://localhost:5191" + path });
  for (let i = 0; i < 60; i++) {
    await sleep(100);
    try { if (await evaluate("document.readyState") === "complete") break; } catch {}
  }
  await sleep(1000);
}
const normPhone = (p) => (p || "").replace(/\D/g, "").replace(/^56/, "");
const setInput = (placeholder, value) => evaluate(`(() => {
  const el = [...document.querySelectorAll('input')].find(i => i.placeholder === ${JSON.stringify(placeholder)});
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`);
await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");

// Administrador con permisos completos y vista inicial de todas las sucursales.
await evaluate(`localStorage.setItem('vet_auth_state', JSON.stringify({ user:{ id:'user-001', email:'admin@vetcare.com', name:'Dr. Silva', role:'ADMIN', sucursalId:'centro' }, isAuthenticated:true })); localStorage.setItem('vet_active_branch', JSON.stringify('all'));`);
await go("/pacientes/fichas");

const leer = () => evaluate(`(() => ({
  owners: JSON.parse(localStorage.getItem('vet_owners') || '[]'),
  patients: JSON.parse(localStorage.getItem('vet_patients') || '[]'),
}))()`);
const resumen = (owners, patients) => ({
  owners: owners.length,
  patients: patients.length,
  ownerIdsUnicos: new Set(owners.map(o => o.id)).size,
  patientIdsUnicos: new Set(patients.map(p => p.id)).size,
  ownersPorSucursal: ["centro", "norte", "sur"].reduce((a, s) => { a[s] = owners.filter(o => o.sucursalId === s).length; return a; }, {}),
  pacientesPorSucursal: ["centro", "norte", "sur"].reduce((a, s) => { a[s] = patients.filter(p => p.sucursalId === s).length; return a; }, {}),
  pacientesSinDueño: patients.filter(p => !owners.some(o => o.id === p.ownerId)).length,
});

const inicio = await leer();
const baseline = resumen(inicio.owners, inicio.patients);

async function abrirDirectorio(branch) {
  await evaluate(`localStorage.setItem('vet_active_branch', JSON.stringify(${JSON.stringify(branch)}));`);
  await go("/pacientes/fichas");
  await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').includes('Propietarios')); if(b) b.click(); return Boolean(b); })()`);
  await sleep(500);
}

async function editarOwner(owner, branch, n) {
  await abrirDirectorio(branch);
  const encontrado = await setInput("Buscar por nombre, correo o teléfono...", owner.phone);
  await sleep(500);
  const botones = await evaluate(`[...document.querySelectorAll('button')].filter(b=>(b.textContent||'').trim()==='Editar').length`);
  if (!encontrado || botones !== 1) return { ok: false, motivo: "no se aisló al propietario", botones, encontrado };

  await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='Editar'); b.click(); return true; })()`);
  await sleep(400);

  const nombre = `Editado ${branch} ${n}`;
  const telefono = `+56 9 7${String(1000000 + n).padStart(7, "0")}`;
  const correo = `edicion.${branch}.${n}@correo.cl`;
  const lleno = {
    nombre: await setInput("Nombre y apellido", nombre),
    telefono: await setInput("+56 9 1234 5678", telefono),
    correo: await setInput("correo@ejemplo.cl", correo),
  };
  await sleep(200);
  await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').includes('Guardar cambios')); if(!b) return false; b.click(); return true; })()`);
  await sleep(600);

  const actual = (await leer()).owners.find(o => o.id === owner.id);
  return {
    ok: Boolean(actual) && actual.name === nombre && normPhone(actual.phone) === normPhone(telefono) && actual.email === correo && actual.sucursalId === owner.sucursalId,
    branch, id: owner.id, nombre, telefono, correo, lleno,
    actual: actual ? { name: actual.name, phone: actual.phone, email: actual.email, sucursalId: actual.sucursalId, organizationId: actual.organizationId } : null,
  };
}

const objetivos = [
  { branch: "centro", id: "own-0" },
  { branch: "norte", id: "own-30" },
  { branch: "sur", id: "own-60" },
  { branch: "all", id: "own-45" },
];
const ediciones = [];
for (let i = 0; i < objetivos.length; i++) {
  const obj = objetivos[i];
  const owner = inicio.owners.find(o => o.id === obj.id);
  if (!owner) { ediciones.push({ ok: false, motivo: "id no existe en semilla", id: obj.id }); continue; }
  ediciones.push(await editarOwner(owner, obj.branch, i + 21));
}

// Comprobación de alcance: desde centro no debe verse un propietario de norte.
await abrirDirectorio("centro");
await setInput("Buscar por nombre, correo o teléfono...", inicio.owners.find(o => o.id === "own-30").phone);
await sleep(500);
const alcance = await evaluate(`(() => ({
  propietariosVisibles: [...document.querySelectorAll('h4')].filter(h=>(h.textContent||'').trim()).length,
  botonesEditar: [...document.querySelectorAll('button')].filter(b=>(b.textContent||'').trim()==='Editar').length,
}))()`);

const fin = await leer();
const norm = p => (p || "").replace(/\D/g, "");
const phoneCounts = {};
fin.owners.forEach(o => { const k = norm(o.phone); phoneCounts[k] = (phoneCounts[k] || 0) + 1; });
const final = resumen(fin.owners, fin.patients);
const idsInicioOwners = new Set(inicio.owners.map(o => o.id));
const idsInicioPatients = new Set(inicio.patients.map(p => p.id));
const integridad = {
  ...final,
  mismosIdsOwner: final.owners === baseline.owners && fin.owners.every(o => idsInicioOwners.has(o.id)),
  mismosIdsPatient: final.patients === baseline.patients && fin.patients.every(p => idsInicioPatients.has(p.id)),
  ownersPerdidos: inicio.owners.filter(o => !fin.owners.some(x => x.id === o.id)).map(o => o.id),
  patientsPerdidos: inicio.patients.filter(p => !fin.patients.some(x => x.id === p.id)).map(p => p.id),
  telefonosDuplicados: Object.values(phoneCounts).filter(n => n > 1).length,
  pacientesConDueñoInexistente: fin.patients.filter(p => !fin.owners.some(o => o.id === p.ownerId)).length,
  sucursalInalteradaEnEditados: ediciones.every(e => !e.actual || e.actual.sucursalId === inicio.owners.find(o => o.id === e.id)?.sucursalId),
};

console.log(JSON.stringify({
  baseline,
  ediciones,
  alcanceDesdeCentro: alcance,
  integridad,
  diagnosticos: diagnostics,
  totalDiagnosticos: diagnostics.length,
}, null, 2));
ws.close();
