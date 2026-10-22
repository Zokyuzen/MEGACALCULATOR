const PASSING_GRADE = 35;
const MAX_GRADE = 50;
const MIN_GRADE = 10.34;
const STORAGE_KEY = "misNotasEstudiantes_v1";

const form = document.querySelector("#gradeForm");
const nameInput = document.querySelector("#studentName");
const dateInput = document.querySelector("#recordDate");
const periodInputs = [document.querySelector("#period1"), document.querySelector("#period2"), document.querySelector("#period3")];
const recordIdInput = document.querySelector("#recordId");
const saveButton = document.querySelector("#saveButton");
const clearButton = document.querySelector("#clearButton");
const message = document.querySelector("#formMessage");
const averageValue = document.querySelector("#averageValue");
const progressFill = document.querySelector("#progressFill");
const resultStatus = document.querySelector("#resultStatus");
const resultDetail = document.querySelector("#resultDetail");
const formulaValues = document.querySelector("#formulaValues");
const recordsBody = document.querySelector("#recordsBody");
const recordCount = document.querySelector("#recordCount");
const deleteAllButton = document.querySelector("#deleteAllButton");

let records = loadRecords();

function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
dateInput.value = todayLocal();

function loadRecords() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}
function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}
function numberFormat(value) {
  return Number(value).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function calculateAverage(grades) {
  return grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
}
function getGrades() {
  return periodInputs.map(input => Number(input.value));
}
function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`;
}
function validGrades(grades) {
  return grades.every((grade, index) =>
    periodInputs[index].value.trim() !== "" &&
    Number.isFinite(grade) && grade >= MIN_GRADE && grade <= MAX_GRADE
  );
}
function updatePreview() {
  const grades = getGrades();
  const complete = periodInputs.every(input => input.value.trim() !== "");
  if (!complete || !validGrades(grades)) {
    averageValue.innerHTML = `—<small>/ 50</small>`;
    progressFill.style.width = "0%";
    resultStatus.textContent = "Ingresa tres notas válidas.";
    resultDetail.textContent = `Cada nota debe estar entre ${numberFormat(MIN_GRADE)} y ${MAX_GRADE}.`;
    formulaValues.textContent = "Periodo 1 + Periodo 2 + Periodo 3";
    return;
  }
  const average = calculateAverage(grades);
  const passed = average >= PASSING_GRADE;
  averageValue.innerHTML = `${numberFormat(average)}<small>/ 50</small>`;
  progressFill.style.width = `${Math.min(100, Math.max(0, average / MAX_GRADE * 100))}%`;
  resultStatus.textContent = passed ? "✓ ¡Aprobaste!" : "Aún no apruebas";
  resultDetail.textContent = passed
    ? `¡Buen trabajo! Superaste la nota mínima de ${PASSING_GRADE}.`
    : `Te faltan ${numberFormat(PASSING_GRADE - average)} puntos de promedio para llegar a ${PASSING_GRADE}.`;
  formulaValues.textContent = `${numberFormat(grades[0])} + ${numberFormat(grades[1])} + ${numberFormat(grades[2])} = ${numberFormat(grades.reduce((a, b) => a + b, 0))}`;
}
periodInputs.forEach(input => input.addEventListener("input", updatePreview));

form.addEventListener("submit", event => {
  event.preventDefault();
  const studentName = nameInput.value.trim();
  const recordDate = dateInput.value;
  const grades = getGrades();

  if (!studentName || !recordDate) {
    setMessage("Completa el nombre y la fecha.", "error");
    return;
  }
  if (!validGrades(grades)) {
    setMessage(`Cada nota debe estar entre ${numberFormat(MIN_GRADE)} y ${MAX_GRADE}.`, "error");
    return;
  }

  const average = Number(calculateAverage(grades).toFixed(2));
  const existingId = recordIdInput.value;
  const record = {
    id: existingId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    studentName, recordDate, grades, average,
    passed: average >= PASSING_GRADE,
    updatedAt: new Date().toISOString()
  };

  if (existingId) {
    records = records.map(item => item.id === existingId ? record : item);
    setMessage("Registro actualizado correctamente.", "success");
  } else {
    records.unshift(record);
    setMessage(record.passed ? "¡Registro guardado! El promedio es aprobatorio." : "Registro guardado. El promedio está por debajo de 35.", record.passed ? "success" : "error");
  }

  saveRecords();
  renderRecords();
  resetForm(false);
  updatePreview();
});

function resetForm(clearMessage = true) {
  form.reset();
  recordIdInput.value = "";
  dateInput.value = todayLocal();
  saveButton.textContent = "➕ Calcular y guardar";
  if (clearMessage) setMessage("");
  updatePreview();
}
clearButton.addEventListener("click", () => resetForm(true));

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}
function displayDate(date) {
  if (!date) return "—";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
function renderRecords() {
  if (!records.length) {
    recordsBody.innerHTML = '<tr class="empty-row"><td colspan="8">Todavía no hay registros. ¡Guarda el primero!</td></tr>';
    recordCount.textContent = "0 registros";
    return;
  }
  recordsBody.innerHTML = records.map(record => `
    <tr>
      <td><strong>${escapeHtml(record.studentName)}</strong></td>
      <td>${displayDate(record.recordDate)}</td>
      ${record.grades.map(grade => `<td>${numberFormat(grade)}</td>`).join("")}
      <td><strong>${numberFormat(record.average)}</strong></td>
      <td><span class="pill ${record.passed ? "pass" : "fail"}">${record.passed ? "Aprobó" : "No aprobó"}</span></td>
      <td>
        <button class="action-btn" type="button" data-action="edit" data-id="${escapeHtml(record.id)}" aria-label="Editar ${escapeHtml(record.studentName)}">✏️ Editar</button>
        <button class="action-btn delete" type="button" data-action="delete" data-id="${escapeHtml(record.id)}" aria-label="Eliminar ${escapeHtml(record.studentName)}">🗑</button>
      </td>
    </tr>`).join("");
  recordCount.textContent = `${records.length} ${records.length === 1 ? "registro" : "registros"}`;
}

recordsBody.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const record = records.find(item => item.id === button.dataset.id);
  if (!record) return;

  if (button.dataset.action === "edit") {
    recordIdInput.value = record.id;
    nameInput.value = record.studentName;
    dateInput.value = record.recordDate;
    periodInputs.forEach((input, index) => input.value = record.grades[index]);
    saveButton.textContent = "💾 Guardar cambios";
    setMessage(`Editando el registro de ${record.studentName}.`, "success");
    updatePreview();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    nameInput.focus({ preventScroll: true });
  } else if (button.dataset.action === "delete") {
    if (!confirm(`¿Quieres eliminar el registro de ${record.studentName}?`)) return;
    records = records.filter(item => item.id !== record.id);
    saveRecords();
    renderRecords();
    if (recordIdInput.value === record.id) resetForm();
    setMessage("Registro eliminado.", "success");
  }
});

deleteAllButton.addEventListener("click", () => {
  if (!records.length) {
    setMessage("No hay registros para borrar.");
    return;
  }
  if (!confirm("¿Seguro que quieres borrar todos los registros guardados en este navegador?")) return;
  records = [];
  saveRecords();
  renderRecords();
  resetForm();
  setMessage("Se eliminaron todos los registros.", "success");
});

renderRecords();
updatePreview();
