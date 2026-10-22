const MIN_GRADE = 10.34;
const MAX_GRADE = 50;
const PASS_GRADE = 35;
const STORAGE_KEY = "megacalculator_ejercicios_v1";

const form = document.querySelector("#exerciseForm");
const dateInput = document.querySelector("#date");
const studentInput = document.querySelector("#student");
const gradeInputs = [document.querySelector("#p1"), document.querySelector("#p2"), document.querySelector("#p3")];
const editIdInput = document.querySelector("#editId");
const listBody = document.querySelector("#exerciseList");
const message = document.querySelector("#formMessage");
const moveToggle = document.querySelector("#moveToggle");
const exerciseCard = document.querySelector("#exerciseCard");
let exercises = loadExercises();
let selectedId = null;
let lastCalculated = null;

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}
dateInput.value = localToday();

function loadExercises() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises)); }
function number(value) {
  return Number(value).toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}
function dateDisplay(value) {
  if (!value) return "—";
  const [y,m,d] = value.split("-");
  return `${y}-${m}-${d}`;
}
function getGrades() { return gradeInputs.map(input => Number(input.value)); }
function gradesAreValid() {
  return gradeInputs.every(input => input.value.trim() !== "" &&
    Number.isFinite(Number(input.value)) && Number(input.value) >= MIN_GRADE && Number(input.value) <= MAX_GRADE);
}
function average(grades) { return grades.reduce((sum, grade) => sum + grade, 0) / grades.length; }
function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `form-message ${type}`;
}
function updateResult(grades, avg) {
  document.querySelector("#showP1").textContent = number(grades[0]);
  document.querySelector("#showP2").textContent = number(grades[1]);
  document.querySelector("#showP3").textContent = number(grades[2]);
  const sum = grades.reduce((a,b) => a+b, 0);
  document.querySelector("#sumLine").textContent = `${number(grades[0])} + ${number(grades[1])} + ${number(grades[2])} = ${number(sum)}`;
  document.querySelector("#divisionLine").textContent = `${number(sum)} ÷ 3 = ${number(avg)}`;
  document.querySelector("#average").textContent = number(avg);
  const banner = document.querySelector("#passBanner");
  if (avg >= PASS_GRADE) {
    banner.textContent = "Pasaste = ✓";
    banner.classList.remove("fail");
  } else {
    banner.textContent = "No pasaste = ✕";
    banner.classList.add("fail");
  }
}
function calculate(showMessage = true) {
  if (!gradesAreValid()) {
    setMessage(`Cada nota debe estar entre ${number(MIN_GRADE)} y ${MAX_GRADE}.`, "error");
    return false;
  }
  const grades = getGrades();
  const avg = average(grades);
  lastCalculated = { grades, avg };
  updateResult(grades, avg);
  if (showMessage) setMessage(`Promedio calculado: ${number(avg)}. ${avg >= PASS_GRADE ? "¡Aprobaste!" : "Está por debajo de 35."}`, avg >= PASS_GRADE ? "" : "error");
  return true;
}
document.querySelector("#calculateButton").addEventListener("click", () => calculate(true));
gradeInputs.forEach(input => input.addEventListener("input", () => {
  if (gradeInputs.every(item => item.value.trim() !== "")) calculate(false);
}));

function resetForm(clearNotice = true) {
  form.reset();
  dateInput.value = localToday();
  gradeInputs.forEach(input => input.value = "35");
  editIdInput.value = "";
  selectedId = null;
  lastCalculated = null;
  document.querySelector("#saveButton").textContent = "▣ Guardar";
  renderList();
  calculate(false);
  if (clearNotice) setMessage("");
}
document.querySelector("#cancelButton").addEventListener("click", () => {
  resetForm();
  setMessage("Formulario limpio. Puedes registrar otro ejercicio.");
});

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!studentInput.value.trim()) {
    setMessage("Escribe el nombre del estudiante.", "error");
    studentInput.focus();
    return;
  }
  if (!dateInput.value) {
    setMessage("Selecciona una fecha.", "error");
    return;
  }
  if (!calculate(false)) return;

  const grades = getGrades();
  const avg = average(grades);
  const id = editIdInput.value || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
  const record = {
    id,
    name: studentInput.value.trim(),
    date: dateInput.value,
    grades,
    average: Number(avg.toFixed(2)),
    passed: avg >= PASS_GRADE
  };
  const existing = exercises.some(item => item.id === id);
  exercises = existing ? exercises.map(item => item.id === id ? record : item) : [record, ...exercises];
  selectedId = id;
  persist();
  renderList();
  setMessage(existing ? "Cambios guardados correctamente." : "Ejercicio guardado en la lista.", "");
  editIdInput.value = "";
  document.querySelector("#saveButton").textContent = "▣ Guardar";
});

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  })[char]);
}
function renderList() {
  if (!exercises.length) {
    listBody.innerHTML = '<tr class="empty"><td colspan="4">Aún no hay ejercicios guardados.</td></tr>';
    return;
  }
  listBody.innerHTML = exercises.map(item => `
    <tr class="select-row ${item.passed ? "row-pass" : "row-fail"} ${selectedId === item.id ? "selected" : ""}" data-id="${escapeHTML(item.id)}" tabindex="0" aria-label="Seleccionar ${escapeHTML(item.name)}">
      <td>${escapeHTML(item.name)}</td>
      <td>${number(item.average)}</td>
      <td>${dateDisplay(item.date)}</td>
      <td>${item.passed ? "✓" : "✕"}</td>
    </tr>`).join("");
}
function selectRecord(id) {
  const item = exercises.find(record => record.id === id);
  if (!item) return;
  selectedId = id;
  studentInput.value = item.name;
  dateInput.value = item.date;
  gradeInputs.forEach((input, index) => input.value = item.grades[index]);
  editIdInput.value = item.id;
  document.querySelector("#saveButton").textContent = "▣ Actualizar";
  updateResult(item.grades, item.average);
  renderList();
  setMessage(`Seleccionaste a ${item.name}. Puedes editarlo o borrarlo.`);
}
listBody.addEventListener("click", event => {
  const row = event.target.closest("tr[data-id]");
  if (row) selectRecord(row.dataset.id);
});
listBody.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("tr[data-id]")) {
    event.preventDefault();
    selectRecord(event.target.dataset.id);
  }
});
document.querySelector("#editButton").addEventListener("click", () => {
  if (!selectedId && !editIdInput.value) {
    setMessage("Primero selecciona un estudiante de la lista para editar.", "error");
    return;
  }
  if (!studentInput.value.trim() || !gradesAreValid()) {
    setMessage("Completa el nombre y las tres notas válidas antes de editar.", "error");
    return;
  }
  editIdInput.value = editIdInput.value || selectedId;
  document.querySelector("#saveButton").textContent = "▣ Actualizar";
  setMessage("Modo edición activado. Pulsa Guardar para aplicar los cambios.");
  studentInput.focus();
});
document.querySelector("#deleteButton").addEventListener("click", () => {
  const id = editIdInput.value || selectedId;
  if (!id) {
    setMessage("Selecciona un ejercicio de la lista para borrarlo.", "error");
    return;
  }
  const item = exercises.find(record => record.id === id);
  if (!item) {
    setMessage("No se encontró ese registro.", "error");
    return;
  }
  if (!confirm(`¿Deseas borrar el ejercicio de ${item.name}?`)) return;
  exercises = exercises.filter(record => record.id !== id);
  persist();
  resetForm(false);
  setMessage("Ejercicio borrado correctamente.");
});

moveToggle.addEventListener("click", () => {
  const enabled = exerciseCard.classList.toggle("drag-enabled");
  exerciseCard.draggable = enabled;
  moveToggle.textContent = enabled ? "✓ arrastrar" : "↕ movible";
  setMessage(enabled ? "Puedes arrastrar esta tarjeta para cambiar su posición." : "Movimiento de tarjeta desactivado.");
});
exerciseCard.addEventListener("dragstart", event => {
  if (!exerciseCard.draggable) { event.preventDefault(); return; }
  event.dataTransfer.setData("text/plain", "exercise-card");
});
document.querySelectorAll(".dashboard > .card, .right-column").forEach(target => {
  target.addEventListener("dragover", event => {
    if (exerciseCard.draggable && target !== exerciseCard) event.preventDefault();
  });
  target.addEventListener("drop", event => {
    if (!exerciseCard.draggable || target === exerciseCard) return;
    event.preventDefault();
    const dashboard = document.querySelector(".dashboard");
    if (target.classList.contains("right-column")) {
      dashboard.insertBefore(exerciseCard, target);
    } else {
      dashboard.insertBefore(exerciseCard, target);
    }
    exerciseCard.classList.remove("drag-enabled");
    exerciseCard.draggable = false;
    moveToggle.textContent = "↕ movible";
    setMessage("Tarjeta movida.");
  });
});

renderList();
calculate(false);
