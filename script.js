(() => {
  "use strict";
  const MIN = 10.34, MAX = 50, PASS = 35;
  const KEY = "megacalculator_registros_v3";
  const $ = id => document.getElementById(id);
  const dateEl = $("date"), nameEl = $("student");
  const gradeEls = [$("p1"), $("p2"), $("p3")];
  const messageEl = $("message"), recordsEl = $("records");
  let records = loadRecords(), selectedId = null, editingId = null;

  function localDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function loadRecords() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data.filter(x => x && typeof x.id === "string" && typeof x.name === "string" && Array.isArray(x.grades) && x.grades.length === 3) : [];
    } catch (e) { return []; }
  }
  function saveStorage() {
    try { localStorage.setItem(KEY, JSON.stringify(records)); return true; }
    catch (e) { message("No se pudo guardar: el navegador bloqueó el almacenamiento. Prueba abrir index.html en Chrome.", true); return false; }
  }
  function message(text, error=false) {
    messageEl.textContent = text;
    messageEl.classList.toggle("error", error);
  }
  function numberText(n) {
    return Number(n).toLocaleString("es-CO", {minimumFractionDigits:1, maximumFractionDigits:2});
  }
  function gradesNow() { return gradeEls.map(el => Number(String(el.value).replace(",", "."))); }
  function validGrades(show=true) {
    let ok = true;
    gradeEls.forEach(el => {
      const raw = el.value.trim().replace(",", ".");
      const n = Number(raw);
      const good = raw !== "" && Number.isFinite(n) && n >= MIN && n <= MAX;
      el.setCustomValidity(good ? "" : "La nota debe estar entre 10,34 y 50.");
      if (!good) ok = false;
    });
    if (!ok && show) message("Cada nota debe estar entre 10,34 y 50. Revisa los tres periodos.", true);
    return ok;
  }
  function showResult(grades) {
    const sum = grades.reduce((total, n) => total + n, 0);
    const avg = sum / 3;
    $("showP1").textContent = numberText(grades[0]);
    $("showP2").textContent = numberText(grades[1]);
    $("showP3").textContent = numberText(grades[2]);
    $("sumLine").textContent = `${numberText(grades[0])} + ${numberText(grades[1])} + ${numberText(grades[2])} = ${numberText(sum)}`;
    $("divisionLine").textContent = `${numberText(sum)} ÷ 3 = ${numberText(avg)}`;
    $("average").textContent = numberText(avg);
    const status = $("status");
    status.classList.toggle("failed", avg < PASS);
    status.classList.toggle("passed", avg >= PASS);
    status.textContent = avg >= PASS ? "Pasaste = ✓" : "No pasaste = ✕";
    return avg;
  }
  function calculate() {
    if (!validGrades()) return null;
    const avg = showResult(gradesNow());
    message(avg >= PASS ? `Promedio ${numberText(avg)}: aprobaste.` : `Promedio ${numberText(avg)}: no alcanzaste la nota mínima de 35.`, avg < PASS);
    return avg;
  }
  function esc(value) {
    return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function render() {
    if (!records.length) {
      recordsEl.innerHTML = '<tr><td class="empty" colspan="4">Aún no hay ejercicios guardados.</td></tr>';
      return;
    }
    recordsEl.innerHTML = records.map(r => {
      const avg = r.grades.reduce((a,b)=>a+b,0)/3, passed = avg >= PASS;
      return `<tr class="record-row ${passed ? "row-pass" : "row-fail"} ${r.id===selectedId ? "selected" : ""}" data-id="${esc(r.id)}" tabindex="0" aria-label="Seleccionar ${esc(r.name)}">
        <td>${esc(r.name)}</td><td>${numberText(avg)}</td><td>${esc(r.date)}</td><td>${passed ? "✓" : "✕"}</td></tr>`;
    }).join("");
  }
  function reset() {
    nameEl.value = ""; dateEl.value = localDate();
    gradeEls.forEach(el => { el.value = "35"; el.setCustomValidity(""); });
    selectedId = null; editingId = null;
    $("saveButton").textContent = "▣ Guardar";
    showResult([35,35,35]); render(); message("Formulario limpio. Puedes ingresar un nuevo ejercicio.");
  }
  function selectRecord(id) {
    const r = records.find(item => item.id === id);
    if (!r) return;
    selectedId = id; editingId = id;
    nameEl.value = r.name; dateEl.value = r.date;
    gradeEls.forEach((el,i) => el.value = String(r.grades[i]));
    $("saveButton").textContent = "▣ Actualizar";
    showResult(r.grades); render();
    message(`Registro de ${r.name} seleccionado. Puedes editarlo o borrarlo.`);
  }
  function saveRecord() {
    const name = nameEl.value.trim();
    if (!name) { message("Escribe el nombre del estudiante.", true); nameEl.focus(); return; }
    if (!dateEl.value) { message("Selecciona una fecha.", true); dateEl.focus(); return; }
    if (!validGrades()) return;
    const grades = gradesNow(), avg = showResult(grades);
    const id = editingId || `r-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
    const record = {id, name, date:dateEl.value, grades};
    const index = records.findIndex(r => r.id === id);
    if (index >= 0) records[index] = record;
    else records.unshift(record);
    if (!saveStorage()) {
      if (index >= 0) records[index] = records[index]; else records = records.filter(r => r.id !== id);
      render(); return;
    }
    selectedId = id; editingId = id; render();
    $("saveButton").textContent = "▣ Actualizar";
    message(`${index >= 0 ? "Registro actualizado" : "Registro guardado"} correctamente. Promedio: ${numberText(avg)}.`);
  }

  $("calculateButton").addEventListener("click", calculate);
  $("saveButton").addEventListener("click", saveRecord);
  $("cancelButton").addEventListener("click", reset);
  $("editButton").addEventListener("click", () => {
    const id = selectedId || editingId;
    if (!id || !records.some(r => r.id === id)) {
      message("Selecciona una fila de la lista y pulsa Editar.", true); return;
    }
    editingId = id;
    $("saveButton").textContent = "▣ Actualizar";
    message("Modo edición activado. Cambia los datos y pulsa Actualizar.");
    nameEl.focus();
  });
  $("deleteButton").addEventListener("click", () => {
    const id = selectedId || editingId;
    if (!id || !records.some(r => r.id === id)) {
      message("Selecciona primero un registro de la lista para borrarlo.", true); return;
    }
    const record = records.find(r => r.id === id);
    if (!confirm(`¿Deseas borrar el registro de ${record.name}?`)) return;
    const old = records;
    records = records.filter(r => r.id !== id);
    if (!saveStorage()) { records = old; render(); return; }
    reset();
    message("Registro eliminado correctamente.");
  });
  recordsEl.addEventListener("click", e => {
    const row = e.target.closest("tr[data-id]");
    if (row) selectRecord(row.dataset.id);
  });
  recordsEl.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("tr[data-id]")) {
      e.preventDefault(); selectRecord(e.target.dataset.id);
    }
  });
  $("clearButton").addEventListener("click", () => {
    if (!records.length) { message("La lista ya está vacía."); return; }
    if (!confirm("¿Seguro que deseas borrar todos los ejercicios?")) return;
    const old = records; records = [];
    if (!saveStorage()) { records = old; render(); return; }
    reset(); message("Todos los registros fueron eliminados.");
  });
  $("exportButton").addEventListener("click", () => {
    if (!records.length) { message("No hay notas para exportar.", true); return; }
    const rows = [["Nombre","Fecha","Periodo 1","Periodo 2","Periodo 3","Promedio","Estado"]];
    records.forEach(r => {
      const avg = r.grades.reduce((a,b)=>a+b,0)/3;
      rows.push([r.name,r.date,...r.grades,avg.toFixed(2),avg>=PASS?"Aprobado":"No aprobado"]);
    });
    const csv = "\\uFEFF" + rows.map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(";")).join("\\r\\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = "megacalculator_notas.csv"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message("Lista exportada a CSV correctamente.");
  });

  // Recalcular al cambiar cualquier nota, sin tener que pulsar el botón.
  gradeEls.forEach(el => el.addEventListener("input", () => {
    if (validGrades(false)) showResult(gradesNow());
  }));

  // Arrastre opcional de la tarjeta de registro a otra columna.
  const formPanel = $("formPanel"), moveButton = $("moveButton");
  let moveMode = false;
  moveButton.addEventListener("click", () => {
    moveMode = !moveMode;
    formPanel.draggable = moveMode;
    formPanel.classList.toggle("drag-mode", moveMode);
    moveButton.textContent = moveMode ? "✓ arrastrar" : "↕ movible";
    message(moveMode ? "Ahora puedes arrastrar esta tarjeta y soltarla sobre otra sección." : "Movimiento desactivado.");
  });
  formPanel.addEventListener("dragstart", e => {
    if (!moveMode) { e.preventDefault(); return; }
    e.dataTransfer.setData("text/plain", "form-panel");
  });
  document.querySelectorAll(".layout > .panel, .side").forEach(target => {
    target.addEventListener("dragover", e => { if (moveMode && target !== formPanel) e.preventDefault(); });
    target.addEventListener("drop", e => {
      if (!moveMode || target === formPanel) return;
      e.preventDefault();
      $("layout").insertBefore(formPanel, target);
      moveMode = false; formPanel.draggable = false; formPanel.classList.remove("drag-mode");
      moveButton.textContent = "↕ movible";
      message("Tarjeta movida. Al recargar, volverá a su posición original.");
    });
  });

  dateEl.value = localDate();
  showResult([35,35,35]);
  render();
})();