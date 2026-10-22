(() => {
  "use strict";
  const MIN_GRADE = 10.34;
  const MAX_GRADE = 50;
  const PASS_GRADE = 35;
  const STORAGE_KEY = "megacalculator_ejercicios_v2";
  const $ = selector => document.querySelector(selector);
  const form = $("#exerciseForm");
  const dateInput = $("#date");
  const studentInput = $("#student");
  const gradeInputs = [$("#p1"), $("#p2"), $("#p3")];
  const recordIdInput = $("#recordId");
  const listBody = $("#exerciseList");
  const message = $("#formMessage");
  let records = readRecords();
  let selectedId = null;

  function todayLocal() {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth()+1).padStart(2,"0"), String(now.getDate()).padStart(2,"0")].join("-");
  }
  function readRecords() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved.filter(r => r && r.id && r.name && Array.isArray(r.grades) && r.grades.length === 3) : [];
    } catch (error) { return []; }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); return true; }
    catch (error) { say("No se pudo guardar en el navegador. Revisa el almacenamiento disponible.", true); return false; }
  }
  function fmt(value) {
    return Number(value).toLocaleString("es-CO", {minimumFractionDigits:1, maximumFractionDigits:2});
  }
  function say(text, isError=false) {
    message.textContent = text;
    message.classList.toggle("error", isError);
  }
  function getGrades() { return gradeInputs.map(input => Number(input.value)); }
  function validateGrades(showError=true) {
    const valid = gradeInputs.every(input => input.value.trim() !== "" && Number.isFinite(Number(input.value)) &&
      Number(input.value) >= MIN_GRADE && Number(input.value) <= MAX_GRADE);
    if (!valid && showError) say("Cada nota debe estar entre 10,34 y 50. Corrige los campos marcados.", true);
    gradeInputs.forEach(input => {
      const bad = input.value.trim() === "" || !Number.isFinite(Number(input.value)) || Number(input.value) < MIN_GRADE || Number(input.value) > MAX_GRADE;
      input.setCustomValidity(bad ? "Ingresa una nota entre 10,34 y 50." : "");
    });
    return valid;
  }
  function updateResult(grades) {
    const total = grades.reduce((sum, n) => sum+n, 0);
    const avg = total / 3;
    $("#showP1").textContent = fmt(grades[0]);
    $("#showP2").textContent = fmt(grades[1]);
    $("#showP3").textContent = fmt(grades[2]);
    $("#sumLine").textContent = `${fmt(grades[0])} + ${fmt(grades[1])} + ${fmt(grades[2])} = ${fmt(total)}`;
    $("#divisionLine").textContent = `${fmt(total)} ÷ 3 = ${fmt(avg)}`;
    $("#average").textContent = fmt(avg);
    const banner = $("#passBanner");
    banner.classList.toggle("fail", avg < PASS_GRADE);
    banner.textContent = avg >= PASS_GRADE ? "Pasaste = ✓" : "No pasaste = ✕";
    return avg;
  }
  function calculate(showMessage=true) {
    if (!validateGrades(showMessage)) return null;
    const avg = updateResult(getGrades());
    if (showMessage) say(avg >= PASS_GRADE ? `Promedio: ${fmt(avg)}. ¡Aprobaste!` : `Promedio: ${fmt(avg)}. No alcanzaste la nota mínima de 35.`, avg < PASS_GRADE);
    return avg;
  }
  function resetForm(clearMessage=true) {
    form.reset();
    dateInput.value = todayLocal();
    gradeInputs.forEach(input => input.value = "35");
    gradeInputs.forEach(input => input.setCustomValidity(""));
    recordIdInput.value = "";
    selectedId = null;
    $("#saveButton").textContent = "▣ Guardar";
    renderList();
    updateResult([35,35,35]);
    if (clearMessage) say("");
  }
  function renderList() {
    if (!records.length) {
      listBody.innerHTML = '<tr class="empty"><td colspan="4">Aún no hay ejercicios guardados.</td></tr>';
      return;
    }
    listBody.innerHTML = records.map(record => {
      const avg = record.grades.reduce((a,b)=>a+b,0)/3;
      const passed = avg >= PASS_GRADE;
      const date = record.date || "";
      return `<tr class="select-row ${passed ? "row-pass" : "row-fail"} ${selectedId === record.id ? "selected" : ""}" data-id="${escapeHtml(record.id)}" tabindex="0">
        <td title="${escapeHtml(record.name)}">${escapeHtml(record.name)}</td><td>${fmt(avg)}</td><td>${escapeHtml(date)}</td><td>${passed ? "✓" : "✕"}</td></tr>`;
    }).join("");
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  }
  function selectRecord(id) {
    const record = records.find(item => item.id === id);
    if (!record) return;
    selectedId = id;
    recordIdInput.value = id;
    studentInput.value = record.name;
    dateInput.value = record.date || todayLocal();
    gradeInputs.forEach((input, i) => input.value = record.grades[i]);
    $("#saveButton").textContent = "▣ Actualizar";
    updateResult(record.grades);
    renderList();
    say(`Registro de ${record.name} seleccionado. Pulsa Editar para modificarlo o Borrar para eliminarlo.`);
  }
  $("#calculateButton").addEventListener("click", () => calculate(true));
  gradeInputs.forEach(input => input.addEventListener("input", () => {
    if (gradeInputs.every(field => field.value.trim() !== "")) calculate(false);
  }));
  form.addEventListener("submit", event => {
    event.preventDefault();
    const name = studentInput.value.trim();
    if (!name) { say("Escribe el nombre del estudiante.", true); studentInput.focus(); return; }
    if (!dateInput.value) { say("Selecciona la fecha del ejercicio.", true); dateInput.focus(); return; }
    const avg = calculate(false);
    if (avg === null) return;
    const id = recordIdInput.value || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `record-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const entry = {id, name, date:dateInput.value, grades:getGrades(), average:Number(avg.toFixed(2))};
    const index = records.findIndex(item => item.id === id);
    if (index >= 0) records[index] = entry; else records.unshift(entry);
    if (!persist()) return;
    selectedId = id;
    renderList();
    recordIdInput.value = id;
    $("#saveButton").textContent = "▣ Actualizar";
    say(index >= 0 ? "¡Registro actualizado correctamente!" : "¡Ejercicio guardado correctamente!");
  });
  $("#cancelButton").addEventListener("click", () => {
    resetForm(false);
    say("Formulario limpio. Puedes registrar un nuevo ejercicio.");
  });
  listBody.addEventListener("click", event => {
    const row = event.target.closest("tr[data-id]");
    if (row) selectRecord(row.dataset.id);
  });
  listBody.addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("tr[data-id]")) {
      event.preventDefault(); selectRecord(event.target.dataset.id);
    }
  });
  $("#editButton").addEventListener("click", () => {
    const id = recordIdInput.value || selectedId;
    if (!id || !records.some(item => item.id === id)) {
      say("Selecciona primero una fila de la lista para editar un registro.", true); return;
    }
    if (!studentInput.value.trim() || !validateGrades()) return;
    recordIdInput.value = id;
    $("#saveButton").textContent = "▣ Actualizar";
    say("Modo edición listo. Modifica los campos y pulsa Guardar para confirmar.");
    studentInput.focus();
  });
  $("#deleteButton").addEventListener("click", () => {
    const id = recordIdInput.value || selectedId;
    if (!id || !records.some(item => item.id === id)) {
      say("Selecciona primero un registro de la lista para borrarlo.", true); return;
    }
    const record = records.find(item => item.id === id);
    if (!window.confirm(`¿Seguro que deseas borrar el registro de ${record.name}?`)) return;
    const previous = records;
    records = records.filter(item => item.id !== id);
    if (!persist()) { records = previous; renderList(); return; }
    resetForm(false);
    say("Registro eliminado correctamente.");
  });
  $("#clearAllButton").addEventListener("click", () => {
    if (!records.length) { say("La lista ya está vacía."); return; }
    if (!window.confirm("¿Seguro que deseas borrar TODOS los registros guardados? Esta acción no se puede deshacer.")) return;
    const previous = records;
    records = [];
    if (!persist()) { records = previous; renderList(); return; }
    resetForm(false);
    say("Se eliminaron todos los registros.");
  });
  $("#exportButton").addEventListener("click", () => {
    if (!records.length) { say("No hay registros para exportar.", true); return; }
    const rows = [["Nombre","Fecha","Periodo 1","Periodo 2","Periodo 3","Promedio","Estado"]];
    records.forEach(r => {
      const avg = r.grades.reduce((a,b)=>a+b,0)/3;
      rows.push([r.name,r.date,...r.grades,avg.toFixed(2),avg>=PASS_GRADE?"Aprobado":"No aprobado"]);
    });
    const csv = "\uFEFF" + rows.map(row => row.map(value => `"${String(value).replace(/"/g,'""')}"`).join(";")).join("\r\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "megacalculator_notas.csv";
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    say("Archivo CSV descargado correctamente.");
  });

  // Activar y desactivar el arrastre de la tarjeta de registro.
  const exerciseCard = $("#exerciseCard");
  const moveToggle = $("#moveToggle");
  let moving = false;
  moveToggle.addEventListener("click", () => {
    moving = !moving;
    exerciseCard.draggable = moving;
    moveToggle.textContent = moving ? "✓ arrastrar" : "↕ movible";
    exerciseCard.classList.toggle("dragging", moving);
    say(moving ? "Arrastra la tarjeta de registro y suéltala sobre otra sección." : "Movimiento desactivado.");
  });
  exerciseCard.addEventListener("dragstart", event => {
    if (!moving) { event.preventDefault(); return; }
    event.dataTransfer.setData("text/plain", "exerciseCard");
    event.dataTransfer.effectAllowed = "move";
  });
  document.querySelectorAll(".dashboard > .card, .right-column").forEach(target => {
    target.addEventListener("dragover", event => { if (moving && target !== exerciseCard) event.preventDefault(); });
    target.addEventListener("drop", event => {
      if (!moving || target === exerciseCard) return;
      event.preventDefault();
      const dashboard = $("#dashboard");
      dashboard.insertBefore(exerciseCard, target);
      moving = false; exerciseCard.draggable = false; exerciseCard.classList.remove("dragging");
      moveToggle.textContent = "↕ movible";
      say("Tarjeta movida. El orden se restablece al recargar la página.");
    });
  });

  dateInput.value = todayLocal();
  updateResult([35,35,35]);
  renderList();
})();
