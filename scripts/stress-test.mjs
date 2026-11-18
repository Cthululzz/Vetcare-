const CDP = "http://localhost:9344";
const targets = await (await fetch(`${CDP}/json/list`)).json();
const page = targets.find((t) => t.type === "page" && t.url.includes("localhost:5191"));
if (!page) throw new Error("No page target en 5191");

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let id = 0;
const pending = new Map();
const diagnostics = [];

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
    return;
  }
  if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails;
    diagnostics.push({
      kind: "exception",
      text: d.text,
      description: d.exception?.description || "",
      url: d.url || "",
      line: d.lineNumber ?? null,
    });
  }
  if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
    diagnostics.push({
      kind: `console.${msg.params.type}`,
      text: msg.params.args
        .map((a) => a.value ?? a.description ?? a.preview?.properties?.map((p) => p.value).join(",") ?? "")
        .join(" "),
    });
  }
  if (msg.method === "Log.entryAdded" && ["error", "warning"].includes(msg.params.entry.level)) {
    diagnostics.push({
      kind: `log.${msg.params.entry.level}`,
      text: msg.params.entry.text,
      url: msg.params.entry.url || "",
    });
  }
};

function send(method, params = {}) {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((resolve, reject) => pending.set(msgId, { resolve, reject }));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  }
  return result.result.value;
}

await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");

// ============================================================
// SEMILLA: volumen alto de datos con的形状 válida
// ============================================================
const seedExpression = `(() => {
  let s = 987654321;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const iso = (t) => new Date(t).toISOString();
  const day = (offset) => { const d = new Date(Date.now() + offset * 86400000); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
  const now = Date.now();

  const nombres = ['Ana','Carlos','María','Luis','Fernanda','Pedro','Camila','Diego','Valentina','Juan','Antonia','Rodrigo','Paula','Miguel','Catalina','Andrés','Javiera','Cristóbal','Francisca','Sebastián','Daniela','Felipe','Ignacia','Mateo','Renata','Nicolás','Elena','Tomás','Sofía','Gabriel','Isidora','Alejandro','Trinidad','Bastián','Maite','Joaquín','Florencia','Marcos','Arantxa','Rafael'];
  const apellidos = ['García','Martínez','López','González','Rivera','Torres',' Silva','Morales','Fuentes','Carrasco','Díaz','Soto','Pérez','Aranda','Valdés','Castillo','Jiménez','Moreno','Muñoz','Sepúlveda','Vargas','Romero','Mendoza','Herrera','Vidal','Rojas','Cordero','Bustos','Navarro','Aguilar'];
  const mascotas = ['Luna','Max','Bella','Rocky','Milo','Coco','Lola','Simba','Nala','Thor','Kira','Zeus','Chiqui','Bruno','Maya','Toby','Sasha','Oreo','Pipo','Daisy','Rex','Michi','Pancho','Vera','Baco','Lila','Ringo','Nina','Capiroto','Fido'];
  const razas = ['Labrador','Golden Retriever','Pastor Alemán','Chihuahua','Poodle','Beagle','Bulldog','Husky','Mestizo','Siamés','Persa','Maine Coon','Conejo','Cavia','Loro'];
  const motivos = ['Control general','Vacunación','Desparasitación','Dolor abdominal','Revisión postoperatoria','Urgencia','Chequeo geriátrico','Corte de uñas','Baño médico','Evaluación dermatológica'];
  const diagnosticos = ['Dermatitis alérgica','Gastroenteritis aguda','Infección respiratoria leve','Postoperatorio estable','Deshidratación leve','Otitis externa','Control sanitario','Sin hallazgos clínicos','Neoplasia en estudio','Anemia leve'];
  const productos = ['Amoxicilina 500mg','Meloxicam 1.5mg/ml','Suero fisiológico 500ml','Metronidazol 250mg','Prednisona 5mg','Clorhexidina 4%','Ivermectina 1%','Enrofloxacino 50mg','Pantoprazol 20mg','Dipirona 500mg/ml','Vitamina B12','Lactulosa 667mg/ml','Cefalexina 300mg','Furosemida 20mg','Tramadol 50mg'];
  const unidades = ['ml','mg','comprimido','g'];
  const sucursales = ['centro','norte','sur'];
  const doctores = ['silva','gomez','morales'];
  const estados = ['programada','programada','programada','en_consulta','finalizada','finalizada','finalizada','cancelada'];
  const tipos = ['control','vacuna','desparasitacion','esterilizacion','urgencia'];
  const vacunas = ['al_dia','al_dia','al_dia','pendiente','atrasada'];

  const owners = [];
  for (let i = 0; i < 80; i++) {
    const nombre = nombres[i % nombres.length] + ' ' + apellidos[(i * 7) % apellidos.length];
    owners.push({
      id: 'own-' + i,
      name: nombre,
      phone: '+56 9 ' + String(10000000 + i * 137).slice(0, 8),
      email: nombre.toLowerCase().replace(/[^a-z]+/g, '.') + i + '@correo.cl',
      createdAt: iso(now - int(1, 400) * 86400000),
    });
  }

  const patients = [];
  for (let i = 0; i < 160; i++) {
    const owner = owners[i % owners.length];
    const history = [];
    const records = int(0, 8);
    for (let j = 0; j < records; j++) {
      history.push({
        id: 'rec-' + i + '-' + j,
        date: iso(now - int(1, 300) * 86400000),
        notes: 'Consulta de control. ' + pick(diagnosticos) + '. Paciente estable, sin complicaciones reportadas por el dueño.',
        weight: j % 3 === 0 ? int(250, 6000) : int(2, 45),
        weightUnit: j % 3 === 0 ? 'gr' : 'kg',
        recommendations: 'Mantener dieta actual y control en 30 días.',
        type: pick(['consulta','vacunacion','examen','nota','procedimiento']),
        diagnosis: pick(diagnosticos),
        temperature: j % 5 === 0 ? '38.7' : 'normal',
        heartRate: j % 5 === 0 ? '120' : 'normal',
        respiratoryRate: j % 5 === 0 ? '35' : 'normal',
        veterinarian: pick(['Dr. Silva','Dra. Gómez','Dr. Morales']),
        nextVisitAt: day(int(5, 60)),
      });
    }
    patients.push({
      id: 'pat-' + i,
      name: pick(mascotas),
      species: pick(['perro','gato','exoticos']),
      breed: pick(razas),
      age: int(1, 15) + ' años',
      gender: pick(['macho','hembra']),
      ownerId: owner.id,
      microchip: 'CH' + String(100000000 + i),
      vaccineStatus: pick(vacunas),
      history,
      isActive: i % 23 !== 0,
      createdAt: iso(now - int(1, 400) * 86400000),
      updatedAt: iso(now - int(0, 60) * 86400000),
      conditions: i % 5 === 0 ? 'Alergia a penicilina. No usar AINEs. Paciente ' + i : undefined,
    });
  }

  // Paciente conocido con alergia para verificar el aviso en el plan de remedios.
  patients[0].conditions = 'Alergia STRS: penicilina.';
  patients[0].isActive = true;

  const appointments = [];
  for (let i = 0; i < 400; i++) {
    const patient = patients[int(0, patients.length - 1)];
    appointments.push({
      id: 'app-' + i,
      patientId: patient.id,
      ownerId: patient.ownerId,
      doctorId: pick(doctores),
      sucursalId: pick(sucursales),
      fecha: day(int(-60, 30)),
      hora: String(int(8, 19)).padStart(2,'0') + ':' + pick(['00','15','30','45']),
      motivo: pick(motivos),
      tipo: pick(tipos),
      status: pick(estados),
      alergiasNotas: patient.conditions,
      condicionesPrevias: patient.conditions,
      recomendaciones: 'Controlar evolución en casa.',
      notas: 'Paciente concurre a control. ' + pick(motivos) + '.',
      diagnostico: pick(diagnosticos),
      pesoActual: i % 4 === 0 ? int(300, 5000) : int(2, 40),
      pesoActualUnit: i % 4 === 0 ? 'gr' : 'kg',
      temperature: i % 3 === 0 ? 'normal' : '38.5',
      heartRate: i % 3 === 0 ? 'normal' : '110',
      respiratoryRate: i % 3 === 0 ? 'normal' : '28',
      createdAt: iso(now - int(0, 60) * 86400000),
      updatedAt: iso(now - int(0, 10) * 86400000),
    });
  }

  const relative = (minutes) => iso(now + minutes * 60000);
  const hospitals = [];
  for (let i = 0; i < 60; i++) {
    const patient = i === 0 ? patients[0] : patients[int(0, patients.length - 1)];
    const active = i < 45;
    const plans = [];
    for (let j = 0; j < int(1, 3); j++) {
      plans.push({
        id: 'plan-' + i + '-' + j,
        productId: 'inv-' + int(0, 39),
        productName: pick(productos),
        dose: int(1, 10),
        unit: pick(unidades),
        frequencyHours: pick([2,4,6,8,12,24]),
        startedAt: relative(-int(60, 2000)),
        nextDoseAt: relative(pick([-180, -10, 3, 4, 30, 240, 1500])),
        durationDays: int(2, 14),
        notes: 'Administrar con alimentos.',
        isActive: true,
        createdAt: iso(now - int(1, 10) * 86400000),
        createdBy: 'Dr. Silva',
      });
    }
    const evolutions = [];
    for (let j = 0; j < int(1, 6); j++) {
      evolutions.push({
        id: 'evo-' + i + '-' + j,
        date: relative(-int(30, 4000)),
        notes: 'Evolución ' + j + '. ' + pick(diagnosticos) + '. Sin cambios relevantes.',
        temperature: j % 2 ? '38.2' : 'normal',
        heartRate: j % 2 ? '100' : 'normal',
        respiratoryRate: j % 2 ? '24' : 'normal',
        treatmentChanges: j % 3 === 0 ? 'Ajuste de dosis.' : undefined,
        nursingObservations: 'Come y bebe normalmente.',
        nextReviewAt: relative(pick([-120, 3, 4, 60, 600])),
        createdBy: 'Dra. Gómez',
      });
    }
    const medications = [];
    for (let j = 0; j < int(2, 10); j++) {
      medications.push({
        id: 'med-' + i + '-' + j,
        date: relative(-int(10, 3000)),
        productId: 'inv-' + int(0, 39),
        productName: pick(productos),
        quantity: int(1, 5),
        unit: pick(unidades),
        notes: 'Dosis administrada sin incidencias.',
        createdBy: 'Enfermería',
        planId: plans.length ? plans[0].id : undefined,
        scheduledAt: relative(-int(10, 3000)),
      });
    }
    hospitals.push({
      id: 'hosp-' + i,
      patientId: patient.id,
      admittedAt: relative(-int(60, 40000)),
      reason: pick(motivos),
      status: active ? 'activa' : 'alta',
      dischargedAt: active ? undefined : relative(-int(10, 500)),
      notes: 'Internación por ' + pick(diagnosticos) + '.',
      bed: 'Cama ' + String(i + 1).padStart(2,'0'),
      diagnosis: pick(diagnosticos),
      weightAtAdmission: int(2, 40),
      weightAtAdmissionUnit: 'kg',
      monitoringFrequency: pick([2,4,6,8]),
      nextReviewAt: relative(pick([-200, -10, 3, 4, 30, 120, 2000])),
      sucursalId: pick(sucursales),
      createdBy: 'Dr. Silva',
      evolutions,
      medications,
      medicationPlans: plans,
      dischargeSummary: active ? undefined : {
        dischargedAt: relative(-int(10, 500)),
        diagnosis: pick(diagnosticos),
        treatment: 'Tratamiento completado.',
        indications: 'Control ambulatorio en 15 días.',
        nextControlAt: day(int(10, 30)),
        dischargedBy: 'Dra. Gómez',
      },
    });
  }

  const inventory = [];
  for (let i = 0; i < 40; i++) {
    inventory.push({
      id: 'inv-' + i,
      name: productos[i % productos.length] + ' ' + (i > 15 ? '(lote ' + i + ')' : ''),
      description: 'Producto veterinario de uso clínico.',
      category: pick(['Medicamentos','Insumos','Vacunas','Alimentos','Cuidado']),
      tags: [pick(['control','urgente','normal']), pick(['antibiótico','analgésico','soporte'])],
      currentStock: int(0, 120),
      minStock: int(5, 30),
      unit: pick(unidades),
      packageType: pick(['caja','frasco','sachet','saco']),
      contentPerPackage: int(1, 20),
      contentUnit: pick(['comprimido','ml','g']),
      batch: 'LOTE-' + i,
      expirationDate: day(int(-60, 500)),
      location: 'Bodega ' + pick(sucursales) + ' / Estante ' + int(1, 9),
      createdAt: iso(now - int(1, 500) * 86400000),
      updatedAt: iso(now - int(0, 30) * 86400000),
      isActive: i % 17 !== 0,
    });
  }

  const movements = [];
  for (let i = 0; i < 120; i++) {
    movements.push({
      id: 'mov-' + i,
      productId: 'inv-' + int(0, 39),
      type: pick(['ingreso','retiro','ajuste','vencimiento','devolucion','merma']),
      quantity: int(1, 30),
      date: relative(-int(10, 20000)),
      reason: 'Movimiento de prueba ' + i,
      unit: pick(unidades),
      userName: pick(['María Pérez','Dr. Silva','Dra. Gómez','Enfermería']),
      userRole: pick(['RECEPTIONIST','VET','INVENTORY']),
      patientName: pick(mascotas),
      isComplete: i % 4 !== 0,
      pendingSince: i % 4 === 0 ? relative(-int(100, 5000)) : undefined,
      createdAt: relative(-int(10, 20000)),
    });
  }

  const reminders = [];
  for (let i = 0; i < 20; i++) {
    reminders.push({
      id: 'rem-' + i,
      appointmentId: 'app-' + int(0, 399),
      kind: pick(['24h','1h']),
      sentAt: relative(-int(10, 5000)),
    });
  }

  const prescriptions = [];
  for (let i = 0; i < 25; i++) {
    prescriptions.push({
      id: 'pre-' + i,
      patientId: 'pat-' + int(0, 159),
      appointmentId: 'app-' + int(0, 399),
      medications: [
        { id: 'pm-' + i + '-0', name: pick(productos), instructions: 'Tomar 1 cada 8 h por 5 días.' },
        { id: 'pm-' + i + '-1', name: pick(productos), instructions: 'Tomar 1 cada 12 h por 3 días.' },
      ],
      createdAt: relative(-int(10, 5000)),
      notes: 'Receta emitida en consulta.',
    });
  }

  const data = {
    vet_owners: owners,
    vet_patients: patients,
    vet_appointments: appointments,
    vet_hospitalizations: hospitals,
    vet_inventory: inventory,
    vet_inventory_movements: movements,
    vet_inventory_tags: [
      { id:'tag-0', name:'control', isSystem:true, createdAt: iso(now) },
      { id:'tag-1', name:'urgente', isSystem:true, createdAt: iso(now) },
      { id:'tag-2', name:'normal', isSystem:true, createdAt: iso(now) },
    ],
    vet_inventory_reminders: Array.from({ length: 15 }, (_, i) => ({
      id: 'ir-' + i,
      movementId: 'mov-' + i,
      userId: 'user-001',
      createdAt: relative(-int(100, 5000)),
      lastNotifiedAt: i % 2 ? relative(-int(10, 500)) : undefined,
    })),
    vet_hospital_beds: Array.from({ length: 60 }, (_, i) => 'Cama ' + String(i + 1).padStart(2,'0')),
    vet_appointment_reminders: reminders,
    vet_seen_tasks: Array.from({ length: 30 }, (_, i) => 'tarea:review-hosp-' + i),
    vet_prescriptions: prescriptions,
  };
  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  return {
    owners: owners.length,
    patients: patients.length,
    appointments: appointments.length,
    hospitalizations: hospitals.length,
    activeHospitalizations: hospitals.filter(h => h.status === 'activa').length,
    medicationPlans: hospitals.reduce((a, h) => a + h.medicationPlans.length, 0),
    evolutions: hospitals.reduce((a, h) => a + h.evolutions.length, 0),
    medications: hospitals.reduce((a, h) => a + h.medications.length, 0),
    medicalRecords: patients.reduce((a, p) => a + p.history.length, 0),
    inventory: inventory.length,
    movements: movements.length,
    reminders: reminders.length,
    prescriptions: prescriptions.length,
  };
})()`;

const seedSummary = await evaluate(seedExpression);

// ============================================================
// RECORRIDO DE RUTAS
// ============================================================
const routes = [
  { path: "/", name: "Dashboard", check: `({ tareas: document.body.innerText.includes('Próximas tareas'), texto: document.body.innerText.length })` },
  { path: "/agenda", name: "Agenda", check: `({ citas: (document.body.innerText.match(/programada|Programada/g)||[]).length, texto: document.body.innerText.length })` },
  { path: "/pacientes", name: "Pacientes", check: `({ filas: document.querySelectorAll('tr').length, texto: document.body.innerText.length })` },
  { path: "/pacientes/fichas", name: "Fichas", check: `({ fichas: document.body.innerText.includes('Ficha'), texto: document.body.innerText.length })` },
  { path: "/pacientes/hospitalizados", name: "Hospitalizados", check: `({ camas: (document.body.innerText.match(/Cama \\d+/g)||[]).length, texto: document.body.innerText.length })` },
  { path: "/tareas", name: "Tareas", check: `({ tareas: (document.body.innerText.match(/Próximas tareas/g)||[]).length, texto: document.body.innerText.length })` },
  { path: "/inventario", name: "Inventario", check: `({ filas: document.querySelectorAll('tr').length, texto: document.body.innerText.length })` },
  { path: "/configuracion", name: "Configuración", check: `({ texto: document.body.innerText.length })` },
];

const routeResults = [];
for (const route of routes) {
  const started = Date.now();
  await send("Page.navigate", { url: `http://localhost:5191${route.path}` });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    await sleep(100);
    try {
      const state = await evaluate("document.readyState");
      if (state === "complete") { ready = true; break; }
    } catch { /* navegación en curso */ }
  }
  await sleep(900);
  let check = null;
  let checkError = null;
  try { check = await evaluate(route.check); } catch (e) { checkError = String(e).slice(0, 300); }
  const overlay = await evaluate(`Boolean(document.querySelector('vite-error-overlay'))`).catch(() => false);
  routeResults.push({
    ruta: route.path,
    nombre: route.name,
    listo: ready,
    ms: Date.now() - started,
    overlayVite: overlay,
    check,
    checkError,
  });
}

// Interacción: abrir Plan de remedios en el primer hospitalizado
await send("Page.navigate", { url: "http://localhost:5191/pacientes/hospitalizados" });
await sleep(1600);
const planInteraction = await evaluate(`(() => {
  const btn = [...document.querySelectorAll('button')].find(b => (b.textContent||'').includes('Plan de remedios'));
  if (!btn) return { abierto:false, motivo:'sin botón' };
  btn.click();
  const titulo = [...document.querySelectorAll('h2,h3,p')].some(el => (el.textContent||'').includes('Plan de remedios'));
  const alergias = [...document.querySelectorAll('p')].some(el => (el.textContent||'').includes('Alergias / condiciones críticas'));
  return { abierto:titulo, bannerAlergias:alergias, texto: document.body.innerText.length };
})()`).catch((e) => ({ error: String(e).slice(0, 300) }));

// Interacción: abrir historial clínico desde fichas
await send("Page.navigate", { url: "http://localhost:5191/pacientes/fichas" });
await sleep(1600);
const historyInteraction = await evaluate(`(() => {
  const links = [...document.querySelectorAll('a')].filter(a => (a.getAttribute('href')||'').includes('/historial'));
  if (!links.length) return { abierto:false, motivo:'sin links de historial', total:0 };
  links[0].click();
  return { abierto:true, total: links.length };
})()`).catch((e) => ({ error: String(e).slice(0, 300) }));
await sleep(1200);
const historyResult = await evaluate(`({ ruta: location.pathname, texto: document.body.innerText.length, historial: document.body.innerText.includes('Historial') })`).catch((e) => ({ error: String(e).slice(0, 300) }));

const uniqueDiagnostics = [...new Map(diagnostics.map((d) => [d.kind + ':' + d.text, d])).values()];

console.log(JSON.stringify({
  semilla: seedSummary,
  rutas: routeResults,
  interacciones: { planDeRemedios: planInteraction, historial: { ...historyInteraction, ...historyResult } },
  diagnosticos: uniqueDiagnostics,
  totalDiagnosticos: uniqueDiagnostics.length,
}, null, 2));

ws.close();
