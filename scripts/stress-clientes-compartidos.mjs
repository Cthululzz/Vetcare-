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
    diagnostics.push({
      kind: "console." + m.params.type,
      text: m.params.args.map((a) => a.value ?? a.description ?? "").join(" "),
    });
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
  for (let i = 0; i < 80; i++) {
    await sleep(100);
    try { if (await evaluate("document.readyState") === "complete") break; } catch {}
  }
  await sleep(900);
}
await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");

// ---------- utilidades de interacción ----------
const setField = (selector, value) => evaluate(`(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return false;
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype
    : el.tagName === 'SELECT' ? HTMLSelectElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  return true;
})()`);

const setPlaceholder = (placeholder, value) => evaluate(`(() => {
  const el = [...document.querySelectorAll('input,textarea')].find(i => i.placeholder === ${JSON.stringify(placeholder)});
  if (!el) return false;
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`);

const clickText = (text, exact = false) => evaluate(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => {
    const t = (x.textContent || '').trim();
    return ${exact ? "t === " : "t.includes("}${JSON.stringify(text)}${exact ? "" : ")"};
  });
  if (!b) return false;
  b.click();
  return true;
})()`);

const clickInCard = (cardText, buttonText) => evaluate(`(() => {
  const candidates = [...document.querySelectorAll('div,article,li,section')].filter(el =>
    (el.textContent || '').includes(${JSON.stringify(cardText)}) &&
    [...el.querySelectorAll('button')].some(b => (b.textContent || '').includes(${JSON.stringify(buttonText)}))
  ).sort((a, b) => a.textContent.length - b.textContent.length);
  const card = candidates[0];
  if (!card) return false;
  const button = [...card.querySelectorAll('button')].find(b => (b.textContent || '').includes(${JSON.stringify(buttonText)}));
  if (!button) return false;
  button.click();
  return true;
})()`);

const bodyHas = (text) => evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`);

const setBranch = (branch) => evaluate(`localStorage.setItem('vet_active_branch', ${JSON.stringify(JSON.stringify(branch))})`);
const setAdmin = () => evaluate(`localStorage.setItem('vet_auth_state', JSON.stringify({ user:{ id:'user-001', email:'admin@vetcare.com', name:'Dr. Silva', role:'ADMIN', sucursalId:'centro' }, isAuthenticated:true }))`);

const leer = () => evaluate(`(() => ({
  owners: JSON.parse(localStorage.getItem('vet_owners') || '[]'),
  patients: JSON.parse(localStorage.getItem('vet_patients') || '[]'),
  appointments: JSON.parse(localStorage.getItem('vet_appointments') || '[]'),
}))()`);

const vinculo = (owner, sucursal, motivo, citaId) =>
  owner?.sucursalesAcceso?.find(
    (v) => v.sucursalId === sucursal && v.motivo === motivo && (!citaId || v.citaId === citaId),
  );

// ---------- semilla controlada ----------
await setAdmin();
await setBranch("all");
await go("/agenda");
// Descarta errores de una carga anterior al connect (por ejemplo, un branch
// escrito sin JSON por una corrida vieja).
diagnostics.length = 0;

// Limpia restos de una corrida anterior para que la semilla sea determinista.
await evaluate(`(() => {
  const owners = JSON.parse(localStorage.getItem('vet_owners') || '[]').filter(o => !o.id.startsWith('CS-'));
  const patients = JSON.parse(localStorage.getItem('vet_patients') || '[]').filter(p =>
    !p.id.startsWith('CS-') && !p.ownerId.startsWith('CS-'));
  const appointments = JSON.parse(localStorage.getItem('vet_appointments') || '[]').filter(c =>
    !c.ownerId.startsWith('CS-') && !c.patientId.startsWith('CS-'));
  localStorage.setItem('vet_owners', JSON.stringify(owners));
  localStorage.setItem('vet_patients', JSON.stringify(patients));
  localStorage.setItem('vet_appointments', JSON.stringify(appointments));
  return true;
})()`);

const preSeed = await leer();
const estadoInicial = {
  owners: preSeed.owners.length,
  patients: preSeed.patients.length,
  appointments: preSeed.appointments.length,
};

await evaluate(`(() => {
  const owners = JSON.parse(localStorage.getItem('vet_owners') || '[]');
  const patients = JSON.parse(localStorage.getItem('vet_patients') || '[]');
  const now = new Date().toISOString();
  const org = 'vet-piloto';
  const owner = (id, name, phone, email, sucursalId) => ({
    id, name, phone, email, organizationId: org, sucursalId, createdAt: now,
  });
  const pet = (id, name, species, breed, ownerId, sucursalId, history = []) => ({
    id, name, species, breed, gender: 'macho', ownerId, sucursalId,
    vaccineStatus: 'pendiente', history, isActive: true, createdAt: now, updatedAt: now,
  });

  const seedOwners = [
    owner('CS-OWNER-A', 'Dueño Compartido Stress A', '+56 9 9000 0001', 'stress.a@correo.cl', 'centro'),
    owner('CS-OWNER-C1', 'Candidato Stress C1', '+56 9 9000 0003', undefined, 'norte'),
    owner('CS-OWNER-C2', 'Candidato Stress C2', '+56 9 9000 0003', undefined, 'sur'),
  ];
  const seedPets = [
    pet('CS-PET-A', 'Mascota Compartida Stress A', 'perro', 'Labrador', 'CS-OWNER-A', 'centro'),
  ];
  seedOwners.forEach((o) => { if (!owners.some((x) => x.id === o.id)) owners.push(o); });
  seedPets.forEach((p) => { if (!patients.some((x) => x.id === p.id)) patients.push(p); });
  localStorage.setItem('vet_owners', JSON.stringify(owners));
  localStorage.setItem('vet_patients', JSON.stringify(patients));
  return true;
})()`);

const inicio = await leer();
const baseline = {
  owners: inicio.owners.length,
  patients: inicio.patients.length,
  appointments: inicio.appointments.length,
};

async function agendarCita({ sucursal, ownerName, ownerPhone, petName, species, motivo, destinoNombre, hora = "10:30" }) {
  await setBranch("all");
  await go("/agenda");
  const abrio = await clickText("Agendar cita para hoy");
  await sleep(400);
  const lleno = {
    sucursal: await setField("#cita-sucursal", sucursal),
    ownerName: await setPlaceholder("Ej. Carlos Mendoza", ownerName),
    ownerPhone: await setPlaceholder("Ej. +56912345678", ownerPhone),
    petName: await setPlaceholder("Ej. Max", petName),
    species: species ? await setField("#paciente-especie", species) : true,
  };
  await sleep(500);
  const aviso = await bodyHas("Este cliente ya está registrado");
  const vinculoClic = await clickText(destinoNombre);
  await sleep(400);
  const horaOk = await setField('input[name="hora"]', hora);
  const motivoOk = await setPlaceholder("Describa brevemente el motivo...", motivo);
  const guardo = await clickText("Guardar Cita", true);
  await sleep(800);
  return { abrio, lleno, aviso, vinculoClic, horaOk, motivoOk, guardo };
}

// ---------- Caso A: dueño + mascota idénticos ----------
const pasoA = await agendarCita({
  sucursal: "norte",
  ownerName: "Dueño Compartido Stress A",
  ownerPhone: "+56 9 9000 0001",
  petName: "Mascota Compartida Stress A",
  motivo: "Control caso A",
  destinoNombre: "Agregar Sucursal Norte",
});
const trasA = await leer();
const citaA = trasA.appointments.find(
  (c) => c.ownerId === "CS-OWNER-A" && c.sucursalId === "norte" && c.motivo === "Control caso A",
);
const ownerA = trasA.owners.find((o) => o.id === "CS-OWNER-A");
const petA = trasA.patients.find((p) => p.id === "CS-PET-A");
const linkAOwner = vinculo(ownerA, "norte", "cita", citaA?.id);
const linkAPet = vinculo(petA, "norte", "cita", citaA?.id);
const casoA = {
  ...pasoA,
  citaId: citaA?.id ?? null,
  ok: Boolean(
    citaA && linkAOwner?.activo && !linkAOwner.confirmadoEn && linkAPet?.activo &&
    trasA.owners.length === baseline.owners && trasA.patients.length === baseline.patients,
  ),
  owners: trasA.owners.length - baseline.owners,
  patients: trasA.patients.length - baseline.patients,
};

// Visibilidad desde la sucursal vinculada, antes de confirmar la atención.
await setBranch("norte");
await go("/pacientes/fichas");
await setPlaceholder("Buscar por nombre, microchip o propietario...", "Mascota Compartida Stress A");
await sleep(500);
const visibilidad = {
  mascotaVisible: await bodyHas("Mascota Compartida Stress A"),
  propietarioVisible: await bodyHas("Dueño Compartido Stress A"),
};

// Confirmación al finalizar la consulta.
await setBranch("all");
await go("/agenda");
const inicioConsulta = await clickInCard("Mascota Compartida Stress A", "Iniciar Consulta");
await sleep(500);
const modalConsulta = await bodyHas("Consulta Médica en Curso");
const clicFinalizar = await clickText("Finalizar Consulta");
await sleep(300);
const clicSinReceta = await clickText("No, finalizar");
await sleep(900);
const trasFinA = await leer();
const ownerAFin = trasFinA.owners.find((o) => o.id === "CS-OWNER-A");
const citaAFin = trasFinA.appointments.find((c) => c.id === citaA?.id);
const confirmacion = {
  inicioConsulta,
  modalConsulta,
  clicFinalizar,
  clicSinReceta,
  citaFinalizada: citaAFin?.status === "finalizada",
  vinculoConfirmado: Boolean(vinculo(ownerAFin, "norte", "cita", citaA?.id)?.confirmadoEn),
  registroEnSucursal: trasFinA.patients
    .find((p) => p.id === "CS-PET-A")
    ?.history.some((h) => h.sucursalId === "norte"),
};

// ---------- Caso B: dueño idéntico, mascota distinta ----------
const pasoB = await agendarCita({
  sucursal: "sur",
  ownerName: "Dueño Compartido Stress A",
  ownerPhone: "+56 9 9000 0001",
  petName: "Mascota Nueva Stress B",
  species: "gato",
  motivo: "Control caso B",
  destinoNombre: "Agregar Sucursal Sur",
  hora: "11:00",
});
const trasB = await leer();
const citaB = trasB.appointments.find(
  (c) => c.ownerId === "CS-OWNER-A" && c.sucursalId === "sur" && c.motivo === "Control caso B",
);
const ownerB = trasB.owners.find((o) => o.id === "CS-OWNER-A");
const nuevaMascotaB = trasB.patients.find((p) => p.name === "Mascota Nueva Stress B");
const linkB = vinculo(ownerB, "sur", "cita", citaB?.id);
const casoB = {
  ...pasoB,
  citaId: citaB?.id ?? null,
  ok: Boolean(
    citaB && linkB?.activo && !linkB.confirmadoEn && nuevaMascotaB &&
    nuevaMascotaB.ownerId === "CS-OWNER-A" &&
    trasB.owners.length === baseline.owners &&
    trasB.patients.length === baseline.patients + 1,
  ),
  owners: trasB.owners.length - baseline.owners,
  patients: trasB.patients.length - baseline.patients,
};

// ---------- Caso C: coincidencia dudosa con candidatos ----------
// El popup permite elegir entre dos fichas con el mismo teléfono.
await setBranch("all");
await go("/agenda");
const popupC = await (async () => {
  const abrio = await clickText("Agendar cita para hoy");
  await setPlaceholder("Ej. Carlos Mendoza", "Cliente Dudoso Stress C");
  await setPlaceholder("Ej. +56912345678", "+56 9 9000 0003");
  await setPlaceholder("Ej. Max", "Mascota Dudosa Stress C");
  await setField("#cita-sucursal", "centro");
  await sleep(500);
  return {
    abrio,
    candidato1: await bodyHas("Candidato Stress C1"),
    candidato2: await bodyHas("Candidato Stress C2"),
    elegirC2: await clickText("Candidato Stress C2"),
  };
})();
await clickText("Agregar Sucursal Central");
await sleep(400);
const horaC = await setField('input[name="hora"]', "11:30");
const motivoC = await setPlaceholder("Describa brevemente el motivo...", "Control caso C");
const guardoC = await clickText("Guardar Cita", true);
await sleep(800);
const trasC = await leer();
const citaC = trasC.appointments.find((c) => c.motivo === "Control caso C");
const ownerC2 = trasC.owners.find((o) => o.id === "CS-OWNER-C2");
const linkC = vinculo(ownerC2, "centro", "cita", citaC?.id);
const casoC = {
  ...popupC,
  horaC,
  motivoC,
  guardoC,
  citaId: citaC?.id ?? null,
  ok: Boolean(
    popupC.abrio && popupC.candidato1 && popupC.candidato2 && popupC.elegirC2 &&
    citaC && citaC.ownerId === "CS-OWNER-C2" && linkC?.activo &&
    trasC.owners.length === baseline.owners,
  ),
  owners: trasC.owners.length - baseline.owners,
  patients: trasC.patients.length - baseline.patients,
};

// Limpieza: al eliminar la cita sin atención, el vínculo se desactiva.
await go("/agenda");
const clicEliminar = await clickInCard("Mascota Dudosa Stress C", "Eliminar");
await sleep(300);
const modalEliminar = await bodyHas("¿Eliminar esta cita?");
const confirmaEliminar = await clickText("Eliminar cita");
await sleep(700);
const trasDelete = await leer();
const ownerC2Delete = trasDelete.owners.find((o) => o.id === "CS-OWNER-C2");
const linkCDelete = vinculo(ownerC2Delete, "centro", "cita", citaC?.id);
const limpieza = {
  clicEliminar,
  modalEliminar,
  confirmaEliminar,
  citaEliminada: !trasDelete.appointments.some((c) => c.id === citaC?.id),
  vinculoDesactivado: Boolean(linkCDelete && !linkCDelete.activo),
};

// ---------- Alta directa: vínculo manual confirmado ----------
await setBranch("sur");
await go("/pacientes/fichas");
await clickText("Nuevo Registro");
await sleep(400);
await clickText("Nuevo propietario", true);
await setPlaceholder("Nombre y apellido", "Candidato Stress C1");
await setPlaceholder("+56 9 1234 5678", "+56 9 9000 0003");
await setPlaceholder("Nombre de la mascota", "Mascota Manual Stress D");
await sleep(500);
const popupD = await bodyHas("Este cliente ya está registrado");
await clickText("Agregar Sucursal Sur");
await sleep(400);
await clickText("Crear ficha", true);
await sleep(800);
const trasD = await leer();
const ownerC1 = trasD.owners.find((o) => o.id === "CS-OWNER-C1");
const linkD = vinculo(ownerC1, "sur", "manual");
const mascotaD = trasD.patients.find((p) => p.name === "Mascota Manual Stress D");
const altaManual = {
  popupD,
  vinculo: linkD ?? null,
  ok: Boolean(linkD?.activo && linkD?.confirmadoEn && mascotaD && mascotaD.ownerId === "CS-OWNER-C1"),
  owners: trasD.owners.length - baseline.owners,
  patients: trasD.patients.length - baseline.patients,
};

const incrementos = {
  owners: trasD.owners.length - baseline.owners,
  patients: trasD.patients.length - baseline.patients,
  appointments: trasD.appointments.length - baseline.appointments,
};

// La semilla usa teléfonos repetidos a propósito para el caso C; se retira al
// terminar para no ensuciar el perfil de stress con duplicados artificiales.
await evaluate(`(() => {
  const owners = JSON.parse(localStorage.getItem('vet_owners') || '[]').filter(o => !o.id.startsWith('CS-'));
  const patients = JSON.parse(localStorage.getItem('vet_patients') || '[]').filter(p =>
    !p.id.startsWith('CS-') && !p.ownerId.startsWith('CS-'));
  const appointments = JSON.parse(localStorage.getItem('vet_appointments') || '[]').filter(c =>
    !c.ownerId.startsWith('CS-') && !c.patientId.startsWith('CS-'));
  localStorage.setItem('vet_owners', JSON.stringify(owners));
  localStorage.setItem('vet_patients', JSON.stringify(patients));
  localStorage.setItem('vet_appointments', JSON.stringify(appointments));
  return true;
})()`);

const fin = await leer();
const phoneCounts = {};
const norm = (p) => (p || "").replace(/\D/g, "");
fin.owners.forEach((o) => { const k = norm(o.phone); phoneCounts[k] = (phoneCounts[k] || 0) + 1; });
const integridad = {
  owners: fin.owners.length,
  patients: fin.patients.length,
  appointments: fin.appointments.length,
  incrementos,
  restauradoAlInicio:
    fin.owners.length === estadoInicial.owners &&
    fin.patients.length === estadoInicial.patients &&
    fin.appointments.length === estadoInicial.appointments,
  idsOwnersUnicos: new Set(fin.owners.map((o) => o.id)).size === fin.owners.length,
  idsPatientsUnicos: new Set(fin.patients.map((p) => p.id)).size === fin.patients.length,
  telefonosDuplicados: Object.values(phoneCounts).filter((n) => n > 1).length,
  pacientesSinDueño: fin.patients.filter((p) => !fin.owners.some((o) => o.id === p.ownerId)).length,
};

console.log(JSON.stringify({
  estadoInicial,
  baseline,
  casos: { A: casoA, B: casoB, C: casoC },
  visibilidadDesdeNorte: visibilidad,
  confirmacionAlFinalizar: confirmacion,
  limpiezaAlEliminar: limpieza,
  altaManual: altaManual,
  integridad,
  diagnosticos: diagnostics,
  totalDiagnosticos: diagnostics.length,
}, null, 2));
ws.close();
