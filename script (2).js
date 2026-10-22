// Base de datos local (memoria)
let ejercicios = [
  { id: 1, estudiante: "Ejemplo Demo", fecha: "2026-03-30", p1: 50, p2: 50, p3: 50, promedio: 50.0, paso: true },
  { id: 2, estudiante: "Aprobado Justo", fecha: "2026-03-30", p1: 35, p2: 35, p3: 35, promedio: 35.0, paso: true },
  { id: 3, estudiante: "Reprobado", fecha: "2026-03-30", p1: 30, p2: 30, p3: 20, promedio: 26.7, paso: false }
];

let idSeleccionado = null;

// Elementos DOM
const inputFecha = document.getElementById('fecha');
const inputEstudiante = document.getElementById('estudiante');
const inputP1 = document.getElementById('p1');
const inputP2 = document.getElementById('p2');
const inputP3 = document.getElementById('p3');

const resP1 = document.getElementById('resP1');
const resP2 = document.getElementById('resP2');
const resP3 = document.getElementById('resP3');
const resSuma = document.getElementById('resSuma');
const resDivision = document.getElementById('resDivision');
const promedioNum = document.getElementById('promedioNum');
const badgeResultado = document.getElementById('badgeResultado');
const tablaEjercicios = document.getElementById('tablaEjercicios');

// Asignar fecha de hoy por defecto
inputFecha.value = new Date().toISOString().split('T')[0];

// --- LÓGICA PRINCIPAL DE CÁLCULO ---
function calcularNotas() {
  const v1 = parseFloat(inputP1.value) || 0;
  const v2 = parseFloat(inputP2.value) || 0;
  const v3 = parseFloat(inputP3.value) || 0;

  const suma = v1 + v2 + v3;
  const prom = suma / 3;

  // REGLA SOLICITADA: En escala de [35 a 50], con 35.0 o más SÍ pasa.
  const pasaste = prom >= 35;

  // Actualizar vista de resultados
  resP1.textContent = v1;
  resP2.textContent = v2;
  resP3.textContent = v3;
  resSuma.textContent = `${v1} + ${v2} + ${v3} = ${suma}`;
  resDivision.textContent = `${suma} ÷ 3 = ${prom.toFixed(1)}`;
  promedioNum.textContent = prom.toFixed(1);

  if (pasaste) {
    badgeResultado.className = "py-2 px-4 rounded-xl border-2 font-bold text-sm bg-emerald-100 border-emerald-500 text-emerald-800";
    badgeResultado.textContent = "Pasaste = ✓";
  } else {
    badgeResultado.className = "py-2 px-4 rounded-xl border-2 font-bold text-sm bg-rose-100 border-rose-500 text-rose-800";
    badgeResultado.textContent = "No Pasaste = ✗";
  }

  return { v1, v2, v3, suma, prom, pasaste };
}

// --- RENDERIZAR TABLA DE HISTORIAL ---
function renderizarTabla() {
  tablaEjercicios.innerHTML = '';
  
  if (ejercicios.length === 0) {
    tablaEjercicios.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-gray-400">Sin ejercicios grabados</td></tr>`;
    return;
  }

  ejercicios.forEach((item) => {
    const tr = document.createElement('tr');
    tr.className = `hover:bg-purple-50 cursor-pointer transition-colors ${idSeleccionado === item.id ? 'bg-purple-100 font-bold' : ''}`;
    tr.onclick = () => seleccionarFila(item.id);

    tr.innerHTML = `
      <td class="p-2 border-b border-purple-100">${item.estudiante || 'Sin nombre'}</td>
      <td class="p-2 text-center border-b border-purple-100 font-bold text-purple-900">${item.promedio.toFixed(1)}</td>
      <td class="p-2 text-center border-b border-purple-100 text-[10px] text-gray-500">${item.fecha}</td>
      <td class="p-2 text-center border-b border-purple-100 font-bold ${item.paso ? 'text-emerald-600' : 'text-rose-600'}">
        ${item.paso ? '✓' : '✗'}
      </td>
    `;
    tablaEjercicios.appendChild(tr);
  });
}

// --- SELECCIONAR ITEM DE LA TABLA ---
function seleccionarFila(id) {
  idSeleccionado = id;
  const item = ejercicios.find(e => e.id === id);
  if (!item) return;

  inputEstudiante.value = item.estudiante;
  inputFecha.value = item.fecha;
  inputP1.value = item.p1;
  inputP2.value = item.p2;
  inputP3.value = item.p3;

  calcularNotas();
  renderizarTabla();
}

// --- BOTONES Y ACCIONES ---
document.getElementById('btnCalcular').addEventListener('click', () => {
  calcularNotas();
});

document.getElementById('btnGuardar').addEventListener('click', () => {
  const datos = calcularNotas();
  
  if (!inputEstudiante.value.trim()) {
    alert("Por favor ingresa el nombre del estudiante.");
    return;
  }

  if (idSeleccionado !== null) {
    // Editar existente
    ejercicios = ejercicios.map(e => e.id === idSeleccionado ? {
      id: idSeleccionado,
      estudiante: inputEstudiante.value,
      fecha: inputFecha.value,
      p1: datos.v1,
      p2: datos.v2,
      p3: datos.v3,
      promedio: datos.prom,
      paso: datos.pasaste
    } : e);
  } else {
    // Crear nuevo
    const nuevo = {
      id: Date.now(),
      estudiante: inputEstudiante.value,
      fecha: inputFecha.value,
      p1: datos.v1,
      p2: datos.v2,
      p3: datos.v3,
      promedio: datos.prom,
      paso: datos.pasaste
    };
    ejercicios.push(nuevo);
  }

  limpiarFormulario();
  renderizarTabla();
});

document.getElementById('btnCancelar').addEventListener('click', () => {
  limpiarFormulario();
});

document.getElementById('btnBorrar').addEventListener('click', () => {
  if (idSeleccionado !== null) {
    ejercicios = ejercicios.filter(e => e.id !== idSeleccionado);
    limpiarFormulario();
    renderizarTabla();
  } else {
    alert("Selecciona un registro de la lista para borrar.");
  }
});

document.getElementById('btnEditar').addEventListener('click', () => {
  if (idSeleccionado === null) {
    alert("Selecciona primero un registro de la tabla para editarlo.");
  } else {
    inputEstudiante.focus();
  }
});

function limpiarFormulario() {
  idSeleccionado = null;
  inputEstudiante.value = '';
  inputP1.value = '';
  inputP2.value = '';
  inputP3.value = '';
  inputFecha.value = new Date().toISOString().split('T')[0];
  calcularNotas();
  renderizarTabla();
}

// Escuchadores dinámicos al presionar teclas o cambiar inputs
[inputP1, inputP2, inputP3].forEach(input => {
  input.addEventListener('input', calcularNotas);
});

// Inicialización inicial
renderizarTabla();
calcularNotas();