(() => {
const { ALLOWED_TARGETS, DEFAULT_MAPPING, STORAGE_KEYS } = window.DeworderDefaults;
const { clean, decodeHtmlBytes, detectClasses, mergeConfig } = window.Deworder;

const state = {
  filename: "input.html",
  raw: "",
  cleaned: "",
  rows: [],
  inputMode: "file",
  droppedFile: null,
  headingIndex: -1,
  beforeHeadingClasses: [],
};

function $(selector) {
  return document.querySelector(selector);
}

function setStep(step) {
  document.querySelectorAll("[data-step]").forEach((section) => {
    section.hidden = section.dataset.step !== String(step);
  });
  document.querySelectorAll("[data-step-indicator]").forEach((item) => {
    const n = Number(item.dataset.stepIndicator);
    item.classList.toggle("active", n === step);
    item.classList.toggle("done", n < step);
  });
  const previewVisible = step === 3;
  $("[data-preview-section]").hidden = !previewVisible;
  $("[data-source-section]").hidden = !previewVisible;
}

function loadStoredConfig() {
  let mapping = {};
  try {
    mapping = JSON.parse(localStorage.getItem(STORAGE_KEYS.mapping) || "{}");
  } catch {
    mapping = {};
  }
  return mergeConfig({
    mapping,
    strip_all_classes: localStorage.getItem(STORAGE_KEYS.stripAllClasses) !== "false",
  });
}

function saveStoredConfig(config) {
  localStorage.setItem(STORAGE_KEYS.mapping, JSON.stringify(config.mapping || {}));
  localStorage.setItem(STORAGE_KEYS.stripAllClasses, String(config.strip_all_classes !== false));
}

function resetStoredConfig() {
  localStorage.removeItem(STORAGE_KEYS.mapping);
  localStorage.removeItem(STORAGE_KEYS.stripAllClasses);
}

function resetInputState() {
  state.filename = "input.html";
  state.raw = "";
  state.cleaned = "";
  state.rows = [];
  state.droppedFile = null;
  state.headingIndex = -1;
  state.beforeHeadingClasses = [];
  $("#prev-heading-btn").disabled = true;
  $("#next-heading-btn").disabled = true;
  $("#file-input").value = "";
  $("#paste-input").value = "";
  $("#drop-label").innerHTML = `
    <span class="drop-icon">&#8679;</span>
    <span>dra &amp; släpp eller <span class="drop-browse">klicka för att bläddra</span></span>
  `;
  $("#mapping-meta").textContent = "";
  $("#preview-meta").textContent = "";
  $("#mapping-table-root").textContent = "";
  $("#iframe-before").removeAttribute("srcdoc");
  $("#iframe-after").removeAttribute("srcdoc");
  $("#source-pre").textContent = "";
  updateContinueState();
}

function renderMappingTable() {
  const root = $("#mapping-table-root");
  const config = loadStoredConfig();
  const rows = state.rows;

  if (!rows.length) {
    root.innerHTML = "<p>Inga klasser hittades.</p>";
    return;
  }

  const table = document.createElement("table");
  table.className = "mapping";
  table.innerHTML = `
    <thead>
      <tr><th>klass</th><th>original-tagg</th><th class="num">antal</th><th class="ctr">mål<span class="info-icon" tabindex="0" aria-label="hjälp om mål"><span class="info-glyph" aria-hidden="true"></span><span class="info-tooltip" role="tooltip">Välj en måltagg för varje klass. <strong>strip</strong> tar bort elementet helt, <strong>keep</strong> lämnar det oförändrat.</span></span></th></tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    const selected = config.mapping[row.class_name] || DEFAULT_MAPPING[row.class_name] || "keep";
    tr.innerHTML = `
      <td class="cls"><code>.${escapeHtml(row.class_name)}</code></td>
      <td><code>&lt;${escapeHtml(row.tag_name)}&gt;</code></td>
      <td class="num">${row.count}</td>
      <td class="ctr"></td>
    `;
    const select = document.createElement("select");
    select.name = `map__${row.class_name}`;
    for (const target of ALLOWED_TARGETS) {
      const option = document.createElement("option");
      option.value = target;
      option.textContent = target;
      option.selected = target === selected;
      select.append(option);
    }
    tr.querySelector(".ctr").append(select);
    tbody.append(tr);
  }

  root.replaceChildren(table);
  $("#strip-all-classes").checked = config.strip_all_classes;
}

function collectMappingConfig() {
  const mapping = {};
  document.querySelectorAll("#mapping-table-root select").forEach((select) => {
    const className = select.name.replace(/^map__/, "");
    mapping[className] = select.value;
  });
  return {
    mapping,
    strip_all_classes: $("#strip-all-classes").checked,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function highlightHtmlSource(source) {
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<![a-zA-Z][^>]*>|<\/?[a-zA-Z][^>]*>/g;
  let out = "";
  let last = 0;
  let m;
  while ((m = re.exec(source)) !== null) {
    if (m.index > last) out += highlightText(source.slice(last, m.index));
    out += highlightTag(m[0]);
    last = m.index + m[0].length;
  }
  if (last < source.length) out += highlightText(source.slice(last));
  return out;
}

function highlightText(text) {
  return escapeHtml(text).replace(
    /&amp;(#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g,
    '<span class="tok-ent">&amp;$1;</span>',
  );
}

function highlightTag(tag) {
  if (tag.startsWith("<!--")) {
    return `<span class="tok-com">${escapeHtml(tag)}</span>`;
  }
  if (tag.startsWith("<!")) {
    return `<span class="tok-doc">${escapeHtml(tag)}</span>`;
  }
  const m = tag.match(/^<(\/?)([a-zA-Z][\w:-]*)([\s\S]*?)(\/?)>$/);
  if (!m) return escapeHtml(tag);
  const [, slash, name, rest, selfClose] = m;
  return (
    `<span class="tok-punc">&lt;${slash}</span>` +
    `<span class="tok-tag">${escapeHtml(name)}</span>` +
    highlightAttrs(rest) +
    `<span class="tok-punc">${selfClose}&gt;</span>`
  );
}

function highlightAttrs(s) {
  const re = /(\s+)|([a-zA-Z_:][\w:.-]*)(\s*=\s*)?("[^"]*"|'[^']*'|[^\s"'=<>`]+)?/g;
  let out = "";
  let last = 0;
  let m;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out += escapeHtml(s.slice(last, m.index));
    if (m[1] !== undefined) {
      out += escapeHtml(m[1]);
    } else if (m[2] !== undefined) {
      out += `<span class="tok-attr">${escapeHtml(m[2])}</span>`;
      if (m[3] !== undefined) out += `<span class="tok-punc">${escapeHtml(m[3])}</span>`;
      if (m[4] !== undefined) out += `<span class="tok-val">${escapeHtml(m[4])}</span>`;
    }
    last = re.lastIndex;
    if (m[0].length === 0) re.lastIndex++;
  }
  if (last < s.length) out += escapeHtml(s.slice(last));
  return out;
}

function showError(error) {
  console.warn(error);
  alert("Något gick fel vid rensningen. Kontrollera filen och försök igen.");
}

function flashButtonLabel(button, label) {
  const original = button.textContent;
  button.textContent = label;
  window.setTimeout(() => {
    button.textContent = original;
  }, 1600);
}

function bindInputMode() {
  document.querySelectorAll("[data-input-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.inputMode = button.dataset.inputMode;
      document.querySelectorAll("[data-input-mode]").forEach((b) => b.classList.toggle("active", b === button));
      document.querySelectorAll("[data-input-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.inputPanel !== state.inputMode;
      });
      updateContinueState();
    });
  });
}

function updateContinueState() {
  const hasFile = Boolean(state.droppedFile || $("#file-input").files.length);
  const hasPaste = $("#paste-input").value.trim().length > 0;
  $("#continue-btn").disabled = state.inputMode === "file" ? !hasFile : !hasPaste;
  $("#drop-zone").classList.toggle("has-file", hasFile);
}

function bindUploadUi() {
  const zone = $("#drop-zone");
  const input = $("#file-input");
  const label = $("#drop-label");

  input.addEventListener("change", () => {
    state.droppedFile = null;
    if (input.files.length) {
      label.innerHTML = `<span class="drop-icon">&#10003;</span><span>${escapeHtml(input.files[0].name)}</span>`;
    }
    updateContinueState();
  });

  $("#paste-input").addEventListener("input", updateContinueState);

  zone.addEventListener("dragenter", (event) => {
    event.preventDefault();
    zone.classList.add("drag-over");
  }, true);
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    zone.classList.add("drag-over");
  }, true);
  zone.addEventListener("dragleave", (event) => {
    if (!zone.contains(event.relatedTarget)) {
      zone.classList.remove("drag-over");
    }
  }, true);
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    zone.classList.remove("drag-over");
    const file = Array.from(event.dataTransfer.files).find(isHtmlFile) || event.dataTransfer.files[0];
    if (file) {
      state.droppedFile = file;
      input.value = "";
      label.innerHTML = `<span class="drop-icon">&#10003;</span><span>${escapeHtml(file.name)}</span>`;
      updateContinueState();
    }
  }, true);
}

function navigateToStep(target) {
  if (target === 1) {
    setStep(1);
  } else if (target === 2) {
    if (state.rows.length > 0) setStep(2);
    else continueToMapping();
  } else if (target === 3) {
    if (state.cleaned) setStep(3);
    else if (state.rows.length > 0) previewCleaned();
  }
}

async function continueToMapping() {
  try {
    if (state.inputMode === "file") {
      const file = state.droppedFile || $("#file-input").files[0];
      if (!file) {
        throw new Error("No file selected");
      }
      state.filename = file.name || "input.html";
      state.raw = decodeHtmlBytes(await file.arrayBuffer());
    } else {
      state.filename = "pasted.html";
      state.raw = $("#paste-input").value;
    }
    state.rows = detectClasses(state.raw);
    $("#mapping-meta").innerHTML = `<span>fil: <code>${escapeHtml(state.filename)}</code></span><span>${state.rows.length} klasser hittade</span>`;
    renderMappingTable();
    setStep(2);
  } catch (error) {
    showError(error);
  }
}

function isHtmlFile(file) {
  return file.type === "text/html" || /\.html?$/i.test(file.name || "");
}

function previewCleaned() {
  try {
    const config = collectMappingConfig();
    saveStoredConfig(config);
    state.cleaned = clean(state.raw, config);
    state.beforeHeadingClasses = Object.entries(config.mapping || {})
      .filter(([, target]) => /^h[1-6]$/.test(target))
      .map(([name]) => name);
    state.headingIndex = -1;
    $("#preview-meta").innerHTML = `<span>fil: <code>${escapeHtml(state.filename)}</code></span><span>${state.raw.length} &rarr; ${state.cleaned.length} tecken</span>`;
    const after = $("#iframe-after");
    after.addEventListener("load", updateHeadingNavState, { once: true });
    const before = $("#iframe-before");
    before.addEventListener("load", () => tintIframe(before), { once: true });
    after.addEventListener("load", () => tintIframe(after), { once: true });
    before.srcdoc = state.raw;
    after.srcdoc = state.cleaned;
    $("#source-pre").innerHTML = highlightHtmlSource(state.cleaned);
    setStep(3);
  } catch (error) {
    showError(error);
  }
}

function tintIframe(iframe) {
  const doc = iframe.contentDocument;
  if (!doc) return;
  const style = doc.createElement("style");
  style.textContent = "html,body{background:#f7f7f4;scrollbar-width:thin;scrollbar-color:#b6bac1 #f7f7f4;}";
  (doc.head || doc.documentElement).append(style);
}

function headingsIn(iframe, extraClassNames) {
  const doc = iframe.contentDocument;
  if (!doc) return [];
  const selectors = ["h1", "h2", "h3", "h4", "h5", "h6"];
  for (const cls of extraClassNames || []) {
    if (/^[A-Za-z][\w-]*$/.test(cls)) selectors.push(`.${cls}`);
  }
  return Array.from(doc.querySelectorAll(selectors.join(",")));
}

function scrollIframeToHeading(iframe, headings, index) {
  if (!headings.length) return;
  const clamped = Math.max(0, Math.min(index, headings.length - 1));
  const el = headings[clamped];
  const doc = iframe.contentDocument;
  const scroller = doc.scrollingElement || doc.documentElement;
  const top = el.getBoundingClientRect().top + scroller.scrollTop;
  scroller.scrollTo({ top, behavior: "smooth" });
}

function updateHeadingNavState() {
  const after = headingsIn($("#iframe-after"), []);
  const hasAny = after.length > 0;
  $("#prev-heading-btn").disabled = !hasAny;
  $("#next-heading-btn").disabled = !hasAny;
}

function stepHeading(delta) {
  const beforeIframe = $("#iframe-before");
  const afterIframe = $("#iframe-after");
  const after = headingsIn(afterIframe, []);
  if (!after.length) return;
  const next = state.headingIndex < 0
    ? (delta > 0 ? 0 : after.length - 1)
    : ((state.headingIndex + delta) % after.length + after.length) % after.length;
  state.headingIndex = next;
  scrollIframeToHeading(afterIframe, after, next);
  const before = headingsIn(beforeIframe, state.beforeHeadingClasses);
  scrollIframeToHeading(beforeIframe, before, next);
}

function bindActions() {
  $("#continue-btn").addEventListener("click", continueToMapping);
  $("#preview-btn").addEventListener("click", previewCleaned);
  $("#reset-btn").addEventListener("click", () => {
    resetStoredConfig();
    renderMappingTable();
  });
  $("#new-file-btn").addEventListener("click", () => {
    resetInputState();
    setStep(1);
  });
  $("#another-file-btn").addEventListener("click", () => {
    resetInputState();
    setStep(1);
  });
  $("#adjust-btn").addEventListener("click", () => setStep(2));
  document.querySelectorAll("[data-step-indicator]").forEach((item) => {
    item.addEventListener("click", () => {
      navigateToStep(Number(item.dataset.stepIndicator));
    });
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigateToStep(Number(item.dataset.stepIndicator));
      }
    });
  });
  $("#prev-heading-btn").addEventListener("click", () => stepHeading(-1));
  $("#next-heading-btn").addEventListener("click", () => stepHeading(1));
  $("#copy-btn").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("#source-pre").textContent);
    flashButtonLabel($("#copy-btn"), "kopierat");
  });
  $("#download-btn").addEventListener("click", () => {
    const blob = new Blob([state.cleaned], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.filename.replace(/\.[^.]+$/, "")}.cleaned.html`;
    a.click();
    URL.revokeObjectURL(url);
    flashButtonLabel($("#download-btn"), "nedladdad");
  });
}

bindInputMode();
bindUploadUi();
bindActions();
setStep(1);
updateHeadingNavState();
})();
