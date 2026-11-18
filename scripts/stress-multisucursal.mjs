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
  if (m.method === "Log.entryAdded" && ["error", "warning"].includes(m.params.entry.level)) {
    diagnostics.push({ kind: "log." + m.params.entry.level, text: m.params.entry.text });
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
  await send("Page.navigate", { url: "http://localhost:5191" + path });
  for (let i = 0; i < 60; i++) {
    await sleep(100);
    try { if (await evaluate("document.readyState") === "complete") break; } catch {}
  }
  await sleep(1100);
}
async function closeReminder() {
  return evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').includes('Recuérdame más tarde')); if(!b) return false; b.click(); return true; })()`);
}
await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");

// ============================================================
// SEMILLA: 3 SUCURSALES REPARTIDAS
// ============================================================
const seedExpression = `(() => {
  let s = 13572468;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const int = (a,b) => a + Math.floor(rnd() * (b - a + 1));
  const iso = t => new Date(t).toISOString();
  const day = o => { const d = new Date(Date.now() + o * 86400000); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
  const now = Date.now();

  const sucursales = ['centro','norte','sur'];
  const prefijo = { centro:'C', norte:'N', sur:'S' };
  const nombres = ['Ana','Carlos','María','Luis','Fernanda','Pedro','Camila','Diego','Valentina','Juan','Antonia','Rodrigo','Paula','Miguel','Catalina','Andrés','Javiera','Cristóbal','Francisca','Sebastián'];
  const apellidos = ['García','Martínez','López','González','Rivera','Torres','Morales','Fuentes','Carrasco','Díaz','Soto','Pérez','Valdés','Castillo','Muñoz','Rojas','Vargas','Romero'];
  const mascotas = ['Luna','Max','Bella','Rocky','Milo','Coco','Lola','Simba','Nala','Thor','Kira','Zeus','Bruno','Maya','Toby','Oreo','Daisy','Rex','Pancho','Lila'];
  const motivos = ['Control general','Vacunación','Urgencia','Dolor abdominal','Revisión postoperatoria','Chequeo geriátrico'];
  const diagnosticos = ['Dermatitis alérgica','Gastroenteritis aguda','Infección respiratoria','Postoperatorio estable','Otitis externa','Sin hallazgos clínicos'];
  const productos = ['Amoxicilina 500mg','Meloxicam 1.5mg/ml','Suero fisiológico 500ml','Metronidazol 250mg','Prednisona 5mg','Clorhexidina 4%','Enrofloxacino 50mg','Dipirona 500mg/ml'];
  const unidades = ['ml','mg','comprimido'];
  const doctores = ['silva','gomez','morales'];
  const estados = ['programada','programada','programada','en_consulta','finalizada','cancelada'];
  const tipos = ['control','vacuna','desparasitacion','urgencia'];
  const today = day(0);

  // 90 propietarios (30 por sucursal)
  const owners = [];
  for (let b = 0; b < 3; b++) {
    for (let j = 0; j < 30; j++) {
      const i = b * 30 + j;
      const nombre = nombres[i % nombres.length] + ' ' + apellidos[(i * 5) % apellidos.length];
      owners.push({
        id: 'own-' + i,
        name: nombre,
        phone: '+56 9 ' + String(10000000 + i * 131).slice(0,8),
        email: nombre.toLowerCase().replace(/[^a-z]+/g,'.') + i + '@correo.cl',
        sucursalId: sucursales[b],
        createdAt: iso(now - int(1,300) * 86400000),
      });
    }
  }

  // 180 mascotas (60 por sucursal), la primera con alergia conocida
  const patients = [];
  for (let b = 0; b < 3; b++) {
    for (let j = 0; j < 60; j++) {
      const i = b * 60 + j;
      const owner = owners[b * 30 + (j % 30)];
      const history = [];
      for (let k = 0; k < int(0,5); k++) {
        history.push({
          id: 'rec-' + i + '-' + k,
          date: iso(now - int(1,250) * 86400000),
          notes: 'Control en ' + sucursales[b] + '. ' + pick(diagnosticos) + '.',
          type: pick(['consulta','vacunacion','examen','nota']),
          diagnosis: pick(diagnosticos),
          temperature: 'normal', heartRate: 'normal', respiratoryRate: 'normal',
        });
      }
      patients.push({
        id: 'pat-' + i,
        name: mascotas[i % mascotas.length],
        species: pick(['perro','gato','exoticos']),
        breed: pick(['Labrador','Mestizo','Siamés']),
        age: int(1,14) + ' años',
        gender: pick(['macho','hembra']),
        ownerId: owner.id,
        sucursalId: sucursales[b],
        conditions: i === 60 ? 'Alergia MS: penicilina.' : (i % 11 === 0 ? 'Alergia a AINEs.' : undefined),
        vaccineStatus: pick(['al_dia','pendiente']),
        history,
        isActive: i % 29 !== 0,
        createdAt: iso(now - int(1,300) * 86400000),
        updatedAt: iso(now),
      });
    }
  }
  patients[60].isActive = true;

  // 450 citas (150 por sucursal) + 3 de hoy por sucursal
  const appointments = [];
  for (let b = 0; b < 3; b++) {
    for (let j = 0; j < 150; j++) {
      const i = b * 150 + j;
      const patient = patients[b * 60 + (j % 60)];
      appointments.push({
        id: 'app-' + i,
        patientId: patient.id, ownerId: patient.ownerId,
        doctorId: pick(doctores),
        sucursalId: sucursales[b],
        fecha: day(int(-45,25)),
        hora: String(int(8,19)).padStart(2,'0') + ':' + pick(['00','15','30','45']),
        motivo: pick(motivos), tipo: pick(tipos), status: pick(estados),
        alergiasNotas: patient.conditions,
        condicionesPrevias: patient.conditions,
        diagnostico: pick(diagnosticos),
        temperature: 'normal', heartRate: 'normal', respiratoryRate: 'normal',
        createdAt: iso(now - int(0,60) * 86400000),
        updatedAt: iso(now - int(0,5) * 86400000),
      });
    }
    for (let k = 0; k < 3; k++) {
      const patient = patients[b * 60 + k];
      appointments.push({
        id: 'app-hoy-' + b + '-' + k,
        patientId: patient.id, ownerId: patient.ownerId,
        doctorId: pick(doctores),
        sucursalId: sucursales[b],
        fecha: today,
        hora: String(9 + k).padStart(2,'0') + ':00',
        motivo: 'Control multi-sucursal', tipo: 'control', status: 'programada',
        createdAt: iso(now), updatedAt: iso(now),
      });
    }
  }

  // 60 internaciones (20 por sucursal, 12 activas) + colisión deliberada entre centro y norte
  const hospitals = [];
  for (let b = 0; b < 3; b++) {
    for (let j = 0; j < 20; j++) {
      const i = b * 20 + j;
      const patient = patients[b * 60 + (j % 60)];
      const active = j < 12;
      const bed = 'Cama ' + prefijo[sucursales[b]] + '-' + String(j + 1).padStart(2,'0');
      const plans = [];
      for (let p = 0; p < int(1,3); p++) {
        plans.push({
          id: 'plan-' + i + '-' + p,
          productId: 'inv-' + int(0,59),
          productName: pick(productos),
          dose: int(1,5), unit: pick(unidades),
          frequencyHours: pick([4,6,8,12]),
          startedAt: iso(now - int(100,2000) * 60000),
          nextDoseAt: iso(now + pick([-60,5,120]) * 60000),
          durationDays: 7, notes: 'Administrar con alimentos.',
          isActive: true, createdAt: iso(now), createdBy: 'Dr. Silva',
        });
      }
      hospitals.push({
        id: 'hosp-' + i,
        patientId: patient.id,
        admittedAt: iso(now - int(100,30000) * 60000),
        reason: pick(motivos),
        status: active ? 'activa' : 'alta',
        bed,
        sucursalId: sucursales[b],
        diagnosis: pick(diagnosticos),
        nextReviewAt: iso(now + pick([-120,10,300]) * 60000),
        notes: 'Internación en ' + sucursales[b] + '.',
        evolutions: [],
        medications: [],
        medicationPlans: plans,
      });
    }
  }
  // Colisión real: dos internaciones ACTIVAS con pacientes ACTIVOS en sucursales distintas.
  // patients[1] (centro) y patients[60] (norte) no son multiplos de 29 => activos.
  hospitals[1].bed = 'Cama COLISION-01';   // centro, pat-1 (activo)
  hospitals[20].bed = 'Cama COLISION-01';  // norte, pat-60 (activo) -> misma cama

  const beds = [];
  for (const b of sucursales) for (let j = 1; j <= 20; j++) beds.push('Cama ' + prefijo[b] + '-' + String(j).padStart(2,'0'));
  beds.push('Cama COLISION-01');

  const inventory = [];
  for (let b = 0; b < 3; b++) {
    for (let j = 0; j < 20; j++) {
      const i = b * 20 + j;
      inventory.push({
        id: 'inv-' + i,
        name: productos[j % productos.length] + ' (' + sucursales[b] + ')',
        description: 'Producto de ' + sucursales[b],
        category: pick(['Medicamentos','Insumos','Vacunas']),
        tags: [sucursales[b]],
        currentStock: int(0,60), minStock: int(5,20), unit: pick(unidades),
        location: 'Bodega ' + sucursales[b] + ' / Estante ' + int(1,8),
        batch: 'LOTE-' + i,
        expirationDate: day(int(-30,400)),
        createdAt: iso(now - int(1,400) * 86400000),
        updatedAt: iso(now),
        isActive: true,
      });
    }
  }

  const movements = [];
  for (let b = 0; b < 3; b++) {
    for (let j = 0; j < 30; j++) {
      const i = b * 30 + j;
      movements.push({
        id: 'mov-' + i,
        productId: 'inv-' + (b * 20 + (j % 20)),
        type: pick(['ingreso','retiro','ajuste']),
        quantity: int(1,20),
        date: iso(now - int(10,20000) * 60000),
        reason: 'Movimiento ' + sucursales[b],
        unit: 'ml',
        userName: pick(['María Pérez','Dr. Silva','Enfermería']),
        userRole: pick(['RECEPTIONIST','VET','INVENTORY']),
        isComplete: j % 2 === 0,
        pendingSince: j % 2 === 1 ? iso(now - int(100,5000) * 60000) : undefined,
        createdAt: iso(now - int(10,20000) * 60000),
      });
    }
  }

  const reminders = [];
  for (let b = 0; b < 3; b++) {
    for (let j = 0; j < 10; j++) {
      reminders.push({
        id: 'rem-' + b + '-' + j,
        appointmentId: 'app-' + (b * 150 + j),
        kind: pick(['24h','1h']),
        sentAt: iso(now - int(10,3000) * 60000),
      });
    }
  }

  const inventoryReminders = [];
  for (let i = 0; i < 15; i++) {
    inventoryReminders.push({
      id: 'ir-' + i,
      movementId: 'mov-' + i,
      userId: 'user-001',
      createdAt: iso(now - int(100,3000) * 60000),
      lastNotifiedAt: i % 2 ? iso(now - int(10,300) * 60000) : undefined,
    });
  }

  const prescriptions = [];
  for (let b = 0; b < 3; b++) {
    for (let j = 0; j < 10; j++) {
      const i = b * 10 + j;
      prescriptions.push({
        id: 'pre-' + i,
        patientId: 'pat-' + (b * 60 + j),
        appointmentId: 'app-' + (b * 150 + j),
        medications: [{ id: 'pm-' + i, name: pick(productos), instructions: 'Tomar 1 cada 8 h.' }],
        createdAt: iso(now - int(10,3000) * 60000),
      });
    }
  }

  const data = {
    vet_owners: owners,
    vet_patients: patients,
    vet_appointments: appointments,
    vet_hospitalizations: hospitals,
    vet_hospital_beds: beds,
    vet_inventory: inventory,
    vet_inventory_movements: movements,
    vet_inventory_tags: ['centro','norte','sur'].map((n,i)=>({ id:'tag-'+i, name:n, isSystem:true, createdAt:iso(now) })),
    vet_inventory_reminders: inventoryReminders,
    vet_appointment_reminders: reminders,
    vet_prescriptions: prescriptions,
    vet_seen_tasks: [],
  };
  for (const [k,v] of Object.entries(data)) localStorage.setItem(k, JSON.stringify(v));
  return {
    sucursales: sucursales.length,
    owners: owners.length,
    patients: patients.length,
    appointments: appointments.length,
    hospitalizations: hospitals.length,
    activas: hospitals.filter(h=>h.status==='activa').length,
    beds: beds.length,
    planes: hospitals.reduce((a,h)=>a+h.medicationPlans.length,0),
    inventory: inventory.length,
    movimientos: movements.length,
    recordatorios: reminders.length,
    recetas: prescriptions.length,
    porSucursal: Object.fromEntries(sucursales.map(s=>[s, appointments.filter(a=>a.sucursalId===s).length])),
  };
})()`;

const results = {};
results.semilla = await evaluate(seedExpression);

// Integridad de datos por sucursal
results.integridad = await evaluate(`(() => {
  const hs = JSON.parse(localStorage.getItem('vet_hospitalizations'));
  const ps = JSON.parse(localStorage.getItem('vet_patients'));
  const by = Object.fromEntries(ps.map(p=>[p.id,p]));
  const sucursales = ['centro','norte','sur'];
  const activas = hs.filter(h=>h.status==='activa' && by[h.patientId]?.isActive);
  const beds = activas.map(h=>h.bed);
  return {
    internacionesPorSucursal: Object.fromEntries(sucursales.map(s=>[s, hs.filter(h=>h.sucursalId===s).length])),
    activasPorSucursal: Object.fromEntries(sucursales.map(s=>[s, activas.filter(h=>h.sucursalId===s).length])),
    camasDuplicadasGlobales: beds.filter((b,i)=>beds.indexOf(b)!==i).length,
    colisionCentroNorte: activas.filter(h=>h.bed==='Cama COLISION-01').map(h=>({ id:h.id, sucursal:h.sucursalId, paciente:h.patientId })),
    alcanceEnModelo: 'Owner, Patient, Appointment y Hospitalization declaran organizationId y sucursalId; la migración completa los datos sembrados',
  };
})()`);

// Recorrido de rutas
const routes = ['/', '/agenda', '/pacientes', '/pacientes/fichas', '/pacientes/hospitalizados', '/tareas', '/inventario', '/configuracion'];
results.rutas = [];
for (const path of routes) {
  const t = Date.now();
  await go(path);
  await closeReminder();
  results.rutas.push({
    ruta: path,
    ms: Date.now() - t,
    overlayVite: await evaluate(`Boolean(document.querySelector('vite-error-overlay'))`),
    texto: await evaluate(`document.body.innerText.length`),
    nombresSucursales: await evaluate(`(() => { const t=document.body.innerText; return ['Central (Providencia)','Norte (Las Condes)','Sur (Ñuñoa)'].filter(n=>t.includes(n)).length; })()`),
  });
}

// Migración: todo dato sembrado sin alcance debe quedar con organización y sucursal
results.migracion = await evaluate(`(() => {
  const keys = ['vet_owners','vet_patients','vet_appointments','vet_hospitalizations','vet_inventory','vet_inventory_movements','vet_inventory_tags','vet_inventory_reminders','vet_appointment_reminders','vet_prescriptions'];
  const res = {};
  for (const k of keys) {
    const arr = JSON.parse(localStorage.getItem(k) || '[]');
    res[k] = {
      total: arr.length,
      sinAlcance: arr.filter(x => typeof x.organizationId !== 'string' || !['centro','norte','sur'].includes(x.sucursalId)).length,
    };
  }
  const patients = JSON.parse(localStorage.getItem('vet_patients') || '[]');
  res.historialSinAlcance = patients.reduce((a,p)=>a+(p.history||[]).filter(r=>!r.organizationId||!r.sucursalId).length,0);
  res.versionEsquema = localStorage.getItem('vet_schema_version');
  return res;
})()`);

// Agenda: las 9 citas de hoy deben mostrar las 3 sucursales
await go('/agenda');
await closeReminder();
results.agendaHoy = await evaluate(`(() => {
  const t = document.body.innerText;
  return {
    citasHoy: (t.match(/Control multi-sucursal/g)||[]).length,
    sucursalesVisibles: ['Central (Providencia)','Norte (Las Condes)','Sur (Ñuñoa)'].filter(n=>t.includes(n)),
  };
})()`);

// Detalle de internación: debe mostrar la sucursal
await go('/pacientes/hospitalizados');
await closeReminder();
results.detalleInternacion = await evaluate(`(() => {
  const b = [...document.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='Ficha');
  if (!b) return { ok:false };
  b.click();
  return { ok:true };
})()`);
await sleep(800);
results.detalleInternacion.texto = await evaluate(`(() => {
  const t = document.body.innerText;
  return {
    tieneSucursal: /Sucursal (Central|Norte|Sur)/.test(t),
    fragmento: (t.match(/Sucursal[^\\n]{0,60}/)||[])[0] || null,
  };
})()`);

// Colisión de camas entre sucursales: evidencia antes/después de una escritura real
await go('/pacientes/hospitalizados');
await closeReminder();
results.colisionCamas = {};
results.colisionCamas.antes = await evaluate(`(() => {
  const hs = JSON.parse(localStorage.getItem('vet_hospitalizations'));
  const ps = JSON.parse(localStorage.getItem('vet_patients'));
  const by = Object.fromEntries(ps.map(p=>[p.id,p]));
  const col = hs.filter(h=>h.bed==='Cama COLISION-01' && h.status==='activa' && by[h.patientId]?.isActive);
  return {
    ocupantes: col.map(h=>({ id:h.id, sucursal:h.sucursalId, paciente:h.patientId, admittedAt:h.admittedAt })),
    total: col.length,
  };
})()`);
results.colisionCamas.enMemoria = await evaluate(`(() => {
  const spans = [...document.querySelectorAll('span')].filter(s=>(s.textContent||'').includes('COLISION-01'));
  const sinCama = [...document.querySelectorAll('span')].filter(s=>(s.textContent||'').trim()==='Sin cama');
  return { camaColisionVisible: spans.length, sinCamaVisible: sinCama.length };
})()`);

// Disparar una escritura real: dar de alta a un paciente NO involucrado en la colisión
results.colisionCamas.escritura = await evaluate(`(() => {
  const botones = [...document.querySelectorAll('button')].filter(x=>(x.textContent||'').trim()==='Alta');
  const rowOf = (b) => {
    let el = b;
    while (el && el.parentElement) {
      el = el.parentElement;
      if (el.textContent?.includes('Ingreso:') && el.querySelectorAll('button').length <= 6) return el;
    }
    return null;
  };
  const target = botones.find(b => {
    const row = rowOf(b);
    return row && !row.textContent.includes('Cama COLISION-01');
  });
  if (!target) return { ok:false, motivo:'sin botón Alta fuera de la colisión', botones: botones.length };
  const row = rowOf(target);
  target.click();
  return { ok:true, paciente: (row.querySelector('h3')?.textContent||'').trim(), cama: (row.textContent.match(/Cama [^\\s]+/)||[])[0] || null };
})()`);
await sleep(600);
results.colisionCamas.formulario = await evaluate(`(() => {
  const setVal = (el, value) => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const d = document.querySelector('input[name="diagnosis"]');
  const i = document.querySelector('textarea[name="indications"]');
  if (!d || !i) return { ok:false };
  setVal(d, 'Alta de prueba multi-sucursal');
  setVal(i, 'Indicaciones de prueba.');
  return { ok:true };
})()`);
await sleep(200);
results.colisionCamas.confirmacion = await evaluate(`(() => {
  const b = [...document.querySelectorAll('button')].find(x=>(x.textContent||'').includes('Confirmar Alta'));
  if (!b) return { ok:false };
  b.click();
  return { ok:true };
})()`);
await sleep(1000);
results.colisionCamas.despues = await evaluate(`(() => {
  const hs = JSON.parse(localStorage.getItem('vet_hospitalizations'));
  const ps = JSON.parse(localStorage.getItem('vet_patients'));
  const by = Object.fromEntries(ps.map(p=>[p.id,p]));
  const col = hs.filter(h=>h.bed==='Cama COLISION-01');
  const activosCol = col.filter(h=>h.status==='activa' && by[h.patientId]?.isActive);
  const h1 = hs.find(h=>h.id==='hosp-1');
  const h20 = hs.find(h=>h.id==='hosp-20');
  return {
    ocupantesActivos: activosCol.length,
    detalle: activosCol.map(h=>({ id:h.id, sucursal:h.sucursalId, paciente:h.patientId })),
    hosp1: { bed: h1?.bed ?? null, status: h1?.status },
    hosp20: { bed: h20?.bed ?? null, status: h20?.status },
  };
})()`);

// Formulario de ingreso: selector de 3 sucursales (recarga limpia, sin modal abierto)
await go('/pacientes/hospitalizados');
await closeReminder();
results.formularioIngreso = await evaluate(`(() => {
  const b = [...document.querySelectorAll('button')].find(x=>(x.textContent||'').includes('Ingresar Paciente'));
  if (!b) return { ok:false, motivo:'sin botón de ingreso' };
  b.click();
  return { ok:true };
})()`);
await sleep(700);
results.formularioIngreso.opciones = await evaluate(`(() => {
  const sels = [...document.querySelectorAll('select')];
  const sel = sels.find(s=>[...s.options].some(o=>o.value==='centro'));
  return sel ? { opciones: [...sel.options].map(o=>({ value:o.value, texto:o.textContent.trim() })), seleccionPorDefecto: sel.value } : { opciones:[], seleccionPorDefecto:null };
})()`);

// Consulta de una cita de "norte": debe conservar su sucursalId y no mezclar datos
await go('/agenda');
await closeReminder();
results.consultaSucursal = {};
results.consultaSucursal.cita = await evaluate(`(() => {
  const apps = JSON.parse(localStorage.getItem('vet_appointments'));
  const c = apps.find(a=>a.sucursalId==='norte' && a.motivo==='Control multi-sucursal' && a.status==='programada');
  if (!c) return null;
  localStorage.setItem('__test_app_id', c.id);
  localStorage.setItem('__test_patient_id', c.patientId);
  const p = JSON.parse(localStorage.getItem('vet_patients')).find(x=>x.id===c.patientId);
  return { id:c.id, sucursalId:c.sucursalId, patientId:c.patientId, status:c.status, historiaAntes:p.history.length };
})()`);
results.consultaSucursal.apertura = await evaluate(`(() => {
  const btns = [...document.querySelectorAll('button')].filter(x=>['Iniciar Consulta','Continuar Consulta'].includes((x.textContent||'').trim()));
  const cardOf = (b) => {
    let el = b;
    while (el && el.parentElement) {
      el = el.parentElement;
      if (el.textContent?.includes('Norte (Las Condes)') && el.textContent?.includes('Control multi-sucursal') && el.querySelectorAll('button').length <= 8) return el;
    }
    return null;
  };
  const target = btns.find(b => { const c = cardOf(b); return c && c.textContent.includes('Control multi-sucursal'); });
  if (!target) return { ok:false, botones:btns.length };
  target.click();
  return { ok:true };
})()`);
await sleep(800);
results.consultaSucursal.finalizar = await evaluate(`(() => {
  const b = [...document.querySelectorAll('button')].find(x=>(x.textContent||'').includes('Finalizar Consulta') && !(x.textContent||'').includes('hospitalizar'));
  if (!b) return { ok:false };
  b.click();
  return { ok:true };
})()`);
await sleep(500);
results.consultaSucursal.confirmar = await evaluate(`(() => {
  const btns = [...document.querySelectorAll('button')].filter(x=>(x.textContent||'').trim()==='No');
  if (!btns.length) return { ok:false };
  btns[btns.length-1].click();
  return { ok:true };
})()`);
await sleep(1000);
results.consultaSucursal.despues = await evaluate(`(() => {
  const id = localStorage.getItem('__test_app_id');
  const pid = localStorage.getItem('__test_patient_id');
  const c = JSON.parse(localStorage.getItem('vet_appointments')).find(a=>a.id===id);
  const p = JSON.parse(localStorage.getItem('vet_patients')).find(x=>x.id===pid);
  const nuevo = p.history[0];
  return {
    cita: c ? { id:c.id, sucursalId:c.sucursalId, status:c.status, patientId:c.patientId } : null,
    historiaDespues: p.history.length,
    registroNuevo: nuevo ? { type:nuevo.type, diagnosis:nuevo.diagnosis||null, date:nuevo.date } : null,
  };
})()`);

const uniq = [...new Map(diagnostics.map(d=>[d.kind+':'+d.text,d])).values()];
console.log(JSON.stringify({ resultados: results, diagnosticos: uniq, totalDiagnosticos: uniq.length }, null, 2));
ws.close();
