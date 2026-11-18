import "./style.css";
import { baseName, validateAssemblyManifest } from "./manifest.js";
import { catalog, initialParts, assetUrl } from "./catalog.js";
import {
  latest,
  registerChange,
  firstSentence,
  compareVersions,
  checkLifecycle,
  lifecycleMap,
} from "./model.js";
import { detailValues } from "./part-details.js";
import { readWorkspace, writeWorkspace, clearWorkspace } from "./storage.js";
import { installTooltips } from "./tooltips.js";
import { thumbnail, loadGeometry, mountViewer, geometryKey } from "./viewer.js";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const I = (n) => `<i class="ph ph-${n}" aria-hidden="true"></i>`;
const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "Europe/Amsterdam",
});
const date = (d) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const app = document.querySelector("#app"),
  modal = document.querySelector("#modal");
let state = {
  schema: 4,
  parts: initialParts(),
  reports: [],
  attachments: [],
  saved: [],
  drafts: {},
  activity: [],
  preferences: {
    view: "grid",
    columns: ["cad", "stl", "project", "material", "time", "state"],
  },
};
let page = "library",
  activeId = state.parts[0].id,
  tab = "details",
  selectedVersions = {},
  query = "",
  materialFilter = "",
  collection = "",
  sortKey = "name",
  sortDir = 1,
  selected = new Set(),
  pageIndex = 0,
  compact = true,
  expandedLog = null,
  componentQuery = "",
  plate = "1",
  storageStatus = "Opening local workspace…",
  storageError = null,
  saveChain = Promise.resolve(),
  disposeViewer = () => {},
  renderEpoch = 0,
  modalDraftKey = null;
let saveGeneration = 0;
const thumbs = new Map(),
  byId = (id) => state.parts.find((p) => p.id === id),
  active = () => byId(activeId) || state.parts[0];
const current = (p) =>
  p.versions.find((v) => v.number === selectedVersions[p.id]) || latest(p);
const kind = (v, k) => v.files.find((f) => f.kind === k),
  currentStl = (p) => kind(current(p), "STL");
function button(text, action, icon, cls = "") {
  return `<button class="${cls}" data-action="${action}">${icon ? I(icon) : ""}${text}</button>`;
}
function icon(label, action, name, description = label) {
  return `<button class="icon ghost" data-action="${action}" aria-label="${esc(label)}" data-tip="${esc(description)}">${I(name)}</button>`;
}
function toast(message, error = false) {
  const t = document.querySelector("#toast");
  t.textContent = message;
  t.classList.toggle("error-toast", error);
  t.style.display = "block";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.style.display = "none"), 6000);
}
function storageLabel() {
  document.querySelectorAll("[data-storage-status]").forEach((e) => {
    e.textContent = storageStatus;
    e.classList.toggle("storage-error", !!storageError);
  });
}
async function persist() {
  const generation = ++saveGeneration;
  storageStatus = "Saving locally…";
  storageLabel();
  const snapshot = structuredClone(state);
  const task = saveChain.catch(() => {}).then(() => writeWorkspace(snapshot));
  saveChain = task;
  try {
    await task;
    if (generation === saveGeneration) {
      storageError = null;
      storageStatus = "Saved on this browser";
      storageLabel();
    }
    return true;
  } catch (e) {
    storageError = e;
    storageStatus = "Not saved — export a backup";
    storageLabel();
    toast(
      "Local storage failed. Data is still in memory; export a workspace backup.",
      true,
    );
    return false;
  }
}
function profile(v) {
  return v.details
    ? detailValues(v.details)
    : { material: "Unknown", weight: "Unknown", time: "Unknown" };
}
function versionSelect(p, attr = "") {
  return `<select ${attr} aria-label="Part version for ${esc(p.id)}">${p.versions
    .toReversed()
    .map(
      (v) =>
        `<option value="${v.number}" ${v === current(p) ? "selected" : ""}>${v.number}${v === latest(p) ? " · Latest" : ""}</option>`,
    )
    .join("")}</select>`;
}
function go(id, version, section = "details", push = true) {
  activeId = id;
  page = "detail";
  tab = section;
  componentQuery = "";
  if (version) selectedVersions[id] = version;
  render();
  const hash = new URLSearchParams({
    part: id,
    version: current(active()).number,
    tab: section,
  });
  if (push) history.pushState(null, "", "#" + hash.toString());
}
function libraryGo() {
  page = "library";
  history.pushState(null, "", location.pathname + location.search);
  render();
}
function pageGo(next) {
  if (next === "library") return libraryGo();
  page = next;
  history.pushState(null, "", "#" + new URLSearchParams({ page: next }));
  render();
}
function sidebar() {
  return `<aside class="sidebar"><div class="brand">${I("cube-transparent")}<div>PRC<small>Printchill</small></div></div><nav class="nav" aria-label="Main navigation">${[
    ["library", "Library", "squares-four", state.parts.length],
    ["reports", "Print Reports", "clipboard-text", state.reports.length],
    ["import", "Import", "tray-arrow-down", ""],
  ]
    .map(
      ([id, t, i, n]) =>
        `<button data-page="${id}" class="${page === id || (page === "detail" && id === "library") ? "active" : ""}">${I(i)}${t}<span class="nav-count">${n}</span></button>`,
    )
    .join(
      "",
    )}</nav><div class="side-title">Collections</div>${["All parts", ...new Set(state.parts.map((p) => p.collection))].map((name, i) => `<button class="side-link ${collection === (i ? name : "") ? "active" : ""}" data-collection="${esc(i ? name : "")}">${I(i ? "folder-simple" : "circles-four")}${esc(name)}</button>`).join("")}<div class="side-title">Saved searches</div>${state.saved.length ? state.saved.map((q, i) => `<button class="side-link" data-saved="${i}">${I("bookmark-simple")}${esc(q.name)}</button>`).join("") : '<p class="saved-empty">Save a query for your next visit.</p>'}<div class="sidebar-footer"><div class="avatar">M</div><div>Local workspace<br><small>Prototype v4</small></div>${icon("Settings", "settings", "gear-six", "Workspace settings, backup and local storage")}</div></aside>`;
}
function render() {
  disposeViewer();
  disposeViewer = () => {};
  const epoch = ++renderEpoch;
  app.innerHTML = `<div class="layout">${sidebar()}<main class="main"><header class="topbar"><div class="row">${icon("Open navigation", "menu", "list")}<button class="crumb-link" data-page="library">My workshop</button><span>/</span><strong>${page === "detail" ? esc(activeId) : page === "library" ? "Library" : page === "reports" ? "Print Reports" : "Import"}</strong></div><div class="row"><span data-storage-status class="storage-state">${storageStatus}</span>${icon("Export backup", "backup", "download-simple", "Export a backup of this local workspace")}</div></header><div class="content">${page === "library" ? library() : page === "detail" ? detail() : page === "reports" ? reportsPage() : importPage()}</div></main></div>`;
  bind();
  if (page === "library") updateLibrary();
  if (page === "detail") startPreview(epoch);
}
function library() {
  return `<div class="pagehead"><div><div class="eyebrow">Engineering library · ${catalog.fileCount} supplied files</div><h1>Your parts, clearly connected.</h1><p class="sub">Browse real samples. Keep revisions, relationships and print feedback together.</p></div>${button("Add part", "import", "plus", "primary")}</div><div class="toolbar"><div class="search">${I("magnifying-glass")}<input id="search" aria-label="Search parts" placeholder="Name, part number or #tag" value="${esc(query)}"></div>${button("Filters", "filters", "sliders-horizontal")}${button("Save search", "save-search", "bookmark-simple")}<div class="view-switch">${icon("Grid view", "grid", "squares-four", "Recognise parts by their model previews")}${icon("Table view", "table", "table", "Compare parts in sortable columns")}</div>${icon("Columns", "columns", "columns", "Choose table columns")}</div><p class="helper search-help">Combine criteria with <code>+</code>, for example <code>#sample + PLA</code>. Press <kbd>/</kbd> to search.</p><div id="filters" class="filters" ${materialFilter ? "" : "hidden"}><label>Material<select id="material-filter"><option value="">All materials</option>${[
    ...new Set(state.parts.map((p) => profile(current(p)).material)),
  ]
    .filter((x) => x !== "Unknown")
    .sort()
    .map(
      (x) =>
        `<option ${materialFilter === x ? "selected" : ""}>${esc(x)}</option>`,
    )
    .join(
      "",
    )}</select></label>${button("Clear filters", "clear-filters", "x")}</div><div id="selection"></div><div class="meta-line"><span id="result-count"></span><label>Sort by <select id="sort"><option value="name" ${sortKey === "name" ? "selected" : ""}>Name</option><option value="id" ${sortKey === "id" ? "selected" : ""}>Part number</option><option value="version" ${sortKey === "version" ? "selected" : ""}>Part version</option></select></label></div><div id="cards"></div><div id="pagination" class="pagination"></div>`;
}
function filtered() {
  return state.parts
    .filter((p) => {
      const v = current(p),
        value = profile(v);
      return (
        (!collection || p.collection === collection) &&
        (!materialFilter || value.material === materialFilter) &&
        query
          .toLowerCase()
          .split("+")
          .map((t) => t.trim())
          .filter(Boolean)
          .every((term) =>
            term.startsWith("#")
              ? p.tags.some((t) => t.toLowerCase() === term.slice(1))
              : ["pla", "petg", "abs", "tpu"].includes(term)
                ? value.material.toLowerCase().includes(term)
                : `${p.id} ${p.name} ${p.type}`.toLowerCase().includes(term),
          )
      );
    })
    .sort((a, b) => {
      const read = (p) =>
        sortKey === "version"
          ? current(p).number
          : sortKey === "material"
            ? profile(current(p)).material
            : sortKey === "state"
              ? p.designState
              : sortKey === "time"
                ? (current(p).details?.printTimeSeconds ?? null)
                : sortKey === "cad"
                  ? (kind(current(p), "CAD") || kind(current(p), "Assembly"))
                      ?.rev || null
                  : sortKey === "stl"
                    ? kind(current(p), "STL")?.rev || null
                    : sortKey === "project"
                      ? kind(current(p), "3MF")?.rev || null
                      : p[sortKey] || "";
      const av = read(a),
        bv = read(b);
      if (av === null) return bv === null ? 0 : 1;
      if (bv === null) return -1;
      return (
        String(av).localeCompare(String(bv), undefined, { numeric: true }) *
        sortDir
      );
    });
}
function previewSource(p, v = current(p)) {
  const stl = kind(v, "STL");
  if (stl) {
    const key = geometryKey(stl);
    return thumbs.get(key) || null;
  }
  const project = kind(v, "3MF");
  return project?.platePreviews?.[0]
    ? assetUrl(project.platePreviews[0].asset)
    : null;
}
function badges(v) {
  return v.files
    .map(
      (f) =>
        `<span class="file-pill">${esc(f.kind)} <b>${esc(f.rev)}</b></span>`,
    )
    .join("");
}
function card(p) {
  const v = current(p),
    src = previewSource(p, v),
    values = profile(v);
  return `<article class="part-card"><input class="select-part" type="checkbox" data-select="${p.id}" aria-label="Select ${esc(p.name)}" ${selected.has(p.id) ? "checked" : ""}><button class="thumb" data-open="${p.id}" aria-label="View ${esc(p.name)}"><span class="thumb-label">${esc(p.type)}</span>${src ? `<img src="${src}" alt="${esc(p.name)} · ${kind(v, "STL") ? "supplied STL" : "3MF plate preview"}">` : `<span class="preview-empty">${I(p.type === "Assembly" ? "tree-structure" : "cube")}<small>${kind(v, "STL") ? "Loading preview…" : "No supplied geometry"}</small></span>`}</button><div class="cardbody"><div class="part-identity"><span>${p.numberBasis.startsWith("Local") ? "Local sample ID" : "Part number"}</span><strong>${esc(p.id)}</strong></div><button class="cardtitle" data-open="${p.id}">${esc(p.name)}</button><div class="card-version"><label>Part version ${versionSelect(p, `data-card-version="${p.id}"`)}</label></div><div class="file-pills">${badges(v)}</div>${kind(v, "STL")?.geometryEvidence?.startsWith("Sample geometry") ? '<p class="helper">Sample preview — no source supplied for this simulated revision.</p>' : ""}<div class="tags">${p.tags.map((t) => `<button class="tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join("")}</div><div class="card-details"><span>${esc(values.material)} · ${esc(values.weight)}</span><span>${I("clock")} ${esc(values.time)}</span></div><div class="card-actions">${button("Where used", "where:" + p.id, "git-branch", "ghost")}${button("Inspect", "open:" + p.id, "arrow-up-right")}</div></div></article>`;
}
const columnLabels = {
  cad: "CAD",
  stl: "STL",
  project: "3MF",
  material: "Material",
  time: "Time indication",
  state: "Design state",
};
function table(items) {
  const cols = state.preferences.columns;
  return `<div class="engineering-table"><table><thead><tr><th scope="col">Select</th>${[
    ["id", "Part number / sample ID"],
    ["name", "Name"],
    ["version", "Part version"],
  ]
    .map(
      ([key, label]) =>
        `<th scope="col" aria-sort="${sortKey === key ? (sortDir === 1 ? "ascending" : "descending") : "none"}"><button data-sort="${key}">${label} ${sortKey === key ? I(sortDir === 1 ? "arrow-up" : "arrow-down") : ""}</button></th>`,
    )
    .join(
      "",
    )}${cols.map((c) => `<th scope="col" aria-sort="${sortKey === c ? (sortDir === 1 ? "ascending" : "descending") : "none"}"><button data-sort="${c}">${columnLabels[c]} ${sortKey === c ? I(sortDir === 1 ? "arrow-up" : "arrow-down") : ""}</button></th>`).join("")}</tr></thead><tbody>${items
    .map((p) => {
      const v = current(p),
        values = profile(v);
      return `<tr><td><input type="checkbox" data-select="${p.id}" aria-label="Select ${esc(p.name)}" ${selected.has(p.id) ? "checked" : ""}></td><td><button class="table-id" data-open="${p.id}">${esc(p.id)}</button></td><td><button class="table-name" data-open="${p.id}">${esc(p.name)}</button><small>${esc(p.type)}</small></td><td>${versionSelect(p, `data-card-version="${p.id}"`)}</td>${cols.map((c) => `<td>${esc(c === "cad" ? (kind(v, "CAD") || kind(v, "Assembly"))?.rev || "—" : c === "stl" ? kind(v, "STL")?.rev || "—" : c === "project" ? kind(v, "3MF")?.rev || "—" : c === "state" ? p.designState : values[c] || "Unknown")}</td>`).join("")}</tr>`;
    })
    .join("")}</tbody></table></div>`;
}
function updateLibrary() {
  const found = filtered(),
    start = pageIndex * 12;
  if (start >= found.length && pageIndex) pageIndex = 0;
  const slice = found.slice(pageIndex * 12, pageIndex * 12 + 12);
  document.querySelector("#cards").innerHTML = found.length
    ? state.preferences.view === "table"
      ? table(slice)
      : `<div class="gallery">${slice.map(card).join("")}</div>`
    : '<div class="empty"><h3>No matching parts</h3>Change your query or clear the filters.</div>';
  document.querySelector("#result-count").textContent =
    `${found.length} parts · ${selected.size} selected`;
  document.querySelector("#selection").innerHTML = selected.size
    ? `<div class="selection"><strong>${selected.size} selected</strong><div class="row">${button("Add tag", "bulk-tag", "tag")}${button("Clear", "deselect", "x")}</div></div>`
    : "";
  document.querySelector("#pagination").innerHTML =
    found.length > 12
      ? `${button("Previous", "previous", "caret-left")}<span>Page ${pageIndex + 1} of ${Math.ceil(found.length / 12)}</span>${button("Next", "next", "caret-right")}`
      : "";
  bindCards();
  loadThumbnails(slice);
}
async function loadThumbnails(items) {
  for (const p of items) {
    const file = currentStl(p);
    if (!file || thumbs.has(geometryKey(file))) continue;
    try {
      thumbs.set(geometryKey(file), await thumbnail(file));
      const el = document.querySelector(`.thumb[data-open="${p.id}"]`);
      if (el && page === "library" && currentStl(p) === file) {
        const old = el.querySelector(".preview-empty");
        if (old) {
          old.outerHTML = `<img src="${thumbs.get(geometryKey(file))}" alt="Supplied STL preview for ${esc(p.name)}">`;
        }
      }
    } catch (e) {
      const el = document.querySelector(
        `.thumb[data-open="${p.id}"] .preview-empty small`,
      );
      if (el) el.textContent = "Preview unavailable";
    }
  }
}
function detail() {
  const p = active(),
    v = current(p),
    stl = kind(v, "STL"),
    assembly = kind(v, "Assembly"),
    project = kind(v, "3MF");
  return `<div class="pagehead detail-heading"><div><div class="part-identity large"><span>${p.numberBasis.startsWith("Local") ? "Local sample ID" : "Part number"}</span><strong>${esc(p.id)}</strong></div><h1>${esc(p.name)}</h1><p class="helper">${esc(p.numberBasis)}</p></div><div class="heading-actions">${button("Compare", "compare", "git-diff")}${button("Lifecycle", "lifecycle", "circle-half")}${button("Register file changes", "change", "git-commit", "primary")}</div></div><div class="version-strip"><label>Part version ${versionSelect(p, 'id="part-version"')}</label><strong>${v === latest(p) ? "Latest" : "Historical · read only"}</strong><span class="lifecycle-badge">${esc(p.designState)} · ${esc(p.maturity)}</span><span class="helper">Lifecycle assigned locally, not extracted from CAD</span>${icon("Copy version link", "copy-link", "link", "Copy a link to this exact Part version")}</div><div class="tabs" role="tablist" aria-label="Part information">${[
    ["details", "Part Details"],
    ["where", "Where used"],
    ["logbook", "Logbook"],
    ["components", assembly ? "Assembly components" : "Project components"],
    ["reports", "Print Reports"],
    ["attachments", "Attachments"],
    ["sources", "Sources"],
  ]
    .filter(
      ([id]) =>
        id !== "components" || assembly || project || kind(v, "FreeCAD"),
    )
    .map(
      ([id, label]) =>
        `<button id="tab-${id}" role="tab" tabindex="${tab === id ? 0 : -1}" aria-controls="tab-content" aria-selected="${tab === id}" class="${tab === id ? "active" : ""}" data-tab="${id}">${label}</button>`,
    )
    .join(
      "",
    )}</div><div class="inspector-layout ${compact ? "compact" : ""}"><section id="tab-content" role="tabpanel" aria-labelledby="tab-${tab}" tabindex="0">${tabContent()}</section><aside class="version-inspector"><div class="panel-heading"><h2>Files in ${v.number}</h2>${icon(compact ? "Expand preview" : "Compact preview", "preview-size", compact ? "arrows-out" : "arrows-in", "Change the size of the model preview")}</div><div class="viewport" id="viewer">${
    stl
      ? `<span class="viewer-version">STL ${stl.rev} · ${esc(stl.name)}</span><div class="viewer-controls">${[
          [
            "reset-view",
            "Reset",
            "arrows-clockwise",
            "Reset the model orientation",
          ],
          [
            "bounds",
            "Dimensions",
            "bounding-box",
            "Show the bounding box and dimensions",
          ],
          [
            "zoom-in",
            "Zoom in",
            "magnifying-glass-plus",
            "Zoom in on this model",
          ],
          [
            "zoom-out",
            "Zoom out",
            "magnifying-glass-minus",
            "Zoom out from this model",
          ],
        ]
          .map(
            ([a, label, i, tip]) =>
              `<button data-view-action="${a}" data-tip="${tip}" aria-label="${label}">${I(i)}<span>${label}</span></button>`,
          )
          .join("")}</div><div data-dimensions class="dimensions" hidden></div>`
      : project?.platePreviews?.length
        ? `<img class="plate-preview" src="${assetUrl((project.platePreviews.find((x) => x.plate === plate) || project.platePreviews[0]).asset)}" alt="Saved 3MF plate preview"><span class="viewer-version">Saved 3MF plate preview · not native CAD geometry</span>`
        : `<div class="preview-empty">${I(assembly ? "tree-structure" : "cube")}<p>No supplied mesh preview</p></div>`
  }</div><p class="geometry-evidence">${esc(stl?.geometryEvidence || "No native CAD/assembly geometry is decoded in this prototype.")}</p>${project?.platePreviews?.length > 1 ? `<label class="plate-choice">Preview plate<select id="preview-plate" aria-label="Preview plate">${project.platePreviews.map((x) => `<option ${x.plate === plate ? "selected" : ""}>${x.plate}</option>`).join("")}</select></label>` : ""}<div class="chain">${v.files.map((f) => `<button class="chain-row" data-file="${f.id}"><span class="file-icon">${esc(f.kind)}</span><strong>${esc(f.name)}</strong><span class="version">${f.rev}</span></button>`).join("")}</div></aside></div>`;
}
async function startPreview(epoch) {
  const f = currentStl(active()),
    el = document.querySelector("#viewer");
  if (!f || !el) return;
  try {
    const dispose = await mountViewer(el, f);
    if (epoch !== renderEpoch) dispose();
    else disposeViewer = dispose;
  } catch (e) {
    if (el.isConnected)
      el.insertAdjacentHTML(
        "afterbegin",
        `<div class="preview-empty"><p>${esc(e.message)}</p></div>`,
      );
  }
}
function tabContent() {
  const p = active(),
    v = current(p);
  if (tab === "details") return partDetails(v);
  if (tab === "where") return whereUsed(p, v);
  if (tab === "logbook") return logbook(p);
  if (tab === "components") return components(p, v);
  if (tab === "sources") return sources(v);
  if (tab === "attachments") return attachmentsView(p, v);
  return `<div class="panel-heading"><div><h2>Print attempts</h2><p class="sub">${esc(p.id)} · Part version ${v.number}</p></div>${button("Add Print Report", "report", "plus", "primary")}</div>${reportRows(state.reports.filter((r) => r.part === p.id && r.version === v.number))}`;
}
function partDetails(v) {
  const d = v.details,
    values = detailValues(d),
    metric = (label, value, note) =>
      `<div class="detail-metric"><dt>${label}</dt><dd>${esc(value)}</dd><small>${note}</small></div>`;
  return `<div class="panel-heading"><div><h2>Print setup</h2><p class="sub">${d ? "Saved 3MF project settings · all plates" : "No registered 3MF metadata for this version"}</p></div></div>${d?.associationNote ? `<p class="notice">${esc(d.associationNote)}</p>` : ""}<dl class="detail-metrics">${metric("Material", values.material, "Selected project filaments")}${metric("Total weight", values.weight, "Saved estimate · all plates")}${metric("Print time · indication", values.time, "Complete sliced plates required")}${metric("Layer height", values.height, "Project default; overrides may differ")}${metric("Infill", values.density, "Project default")}${metric("Infill type", values.pattern, "Project default")}${metric("Plates in 3MF", values.plates, "Full project")}</dl>${d ? `<section class="filament-panel"><h3>Selected filament colours & types</h3><p class="helper">${values.filaments.length} selected of ${d.filaments.length} configured · ${d.selectionBasis === "saved_slicing_usage" ? "saved slicing usage" : "model assignments"}, not a live AMS inventory.</p><div class="filament-grid">${values.filaments.map((f) => `<div class="filament-card"><div class="filament-color" ${/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(f.color || "") ? `style="background-color:${f.color}"` : ""}></div><div><small>Filament ${f.slot}</small><strong>${esc(f.type || "Unknown type")}</strong><span>${esc(f.profile || "Unknown profile")}</span><span>${esc(f.color || "Unknown colour")}</span></div></div>`).join("")}</div>${!d.selectionComplete ? '<p class="notice">Selection may be incomplete: painted colours or special assignments require further slicing analysis.</p>' : ""}</section><div class="details-note">${I("info")}<div>Source: ${esc(d.sourceFile)}<br>${esc(d.statisticsNote)}<br>These are project defaults, not resolved per-object settings.</div></div>${d.printTimeSeconds == null ? button("How to get a time indication", "time-help", "clock", "ghost") : ""}` : '<div class="empty">Unknown values are not replaced by settings from another version.</div>'}`;
}
function sources(v) {
  return `<div class="panel-heading"><div><h2>Source evidence</h2><p class="sub">${esc(v.evidence || "Source history not independently recovered.")}</p></div></div><div class="source-list">${v.files.map((f) => `<article><h3>${esc(f.name)} <span class="version">${f.rev}</span></h3><p>${esc(f.revisionBasis || "Revision label assigned in this prototype")}</p><p class="helper">SHA-256: <code>${esc(f.sha256 || "No supplied source for this simulated revision")}</code></p>${f.note ? `<p class="notice">${esc(f.note)}</p>` : ""}</article>`).join("")}</div>`;
}
function logbook(p) {
  return `<div class="panel-heading"><div><h2>Part history</h2><p class="sub">File changes only · sample ordering is based on filename revisions.</p></div>${button("Compare versions", "compare", "git-diff")}</div><div class="commit-graph">${p.versions
    .toReversed()
    .map((v) => {
      const open = expandedLog === v.number;
      return `<article class="commit-entry ${v === current(p) ? "current" : ""}"><button class="commit-dot" data-log="${v.number}" aria-label="${open ? "Collapse" : "Expand"} version ${v.number}" aria-expanded="${open}" aria-controls="log-${v.number}"></button><div class="commit-body"><button class="commit-summary" data-log="${v.number}" aria-expanded="${open}"><span class="part-version-badge">${v.number}</span><strong>${esc(firstSentence(v))}</strong>${I(open ? "caret-up" : "caret-down")}</button><div class="commit-meta">${date(v.date)} · ${esc(v.author)} · ${v.changes.length} files registered${v === latest(p) ? " · Latest" : ""}</div><div class="commit-balloon" id="log-${v.number}" ${open ? "" : "hidden"}><button data-history="${v.number}">View this version</button>${v.files
        .map((f) => {
          const change = v.changes.find((c) => c.id === f.id);
          return `<div class="log-file"><span class="file-icon">${esc(f.kind)}</span><div><strong>${esc(f.name)} · ${f.rev}</strong><p>${esc(change?.comment || "Unchanged from the previous version.")}</p></div></div>`;
        })
        .join("")}</div></div></article>`;
    })
    .join("")}</div>`;
}
function parentRelations(p, stl) {
  const result = new Map();
  for (const other of state.parts)
    for (const version of other.versions)
      for (const f of version.files) {
        if (
          f.kind === "3MF" &&
          f.components?.some((c) => c.localFile === stl.name)
        ) {
          result.set(f.sha256 || f.name + f.rev, {
            part: other,
            version,
            file: f,
            evidence: "3MF declared source filename; not content-verified",
          });
        }
        if (
          f.kind === "Assembly" &&
          f.assemblyManifest?.components?.some(
            (c) =>
              baseName(c.path) === stl.name ||
              baseName(c.path) === kind(current(p), "CAD")?.name,
          )
        ) {
          result.set(f.name + f.rev, {
            part: other,
            version,
            file: f,
            evidence:
              "Imported assembly manifest; CAD-to-STL link not verified",
          });
        }
      }
  return [...result.values()];
}
function whereUsed(p, v) {
  const stl = kind(v, "STL");
  if (!stl)
    return '<div class="empty"><h2>No selected STL</h2>Use Components to inspect this project or assembly.</div>';
  const parents = parentRelations(p, stl),
    cad = kind(v, "CAD")?.sha256 ? kind(v, "CAD") : null,
    width = Math.max(640, parents.length * 230),
    center = width / 2;
  const node = (
    title,
    kindLabel,
    rev,
    x,
    y,
    action,
    selectedNode = false,
    targetVersion = null,
  ) =>
    `<foreignObject x="${x - 100}" y="${y}" width="200" height="100"><div xmlns="http://www.w3.org/1999/xhtml" class="graph-node ${selectedNode ? "selected" : ""}"><button ${action ? `data-open="${esc(action)}" ${targetVersion ? `data-open-version="${targetVersion}"` : ""}` : ""}><span class="node-kind">${kindLabel} · ${rev}</span><strong>${esc(title)}</strong><small>${selectedNode ? "Selected supplied STL" : "Filename-declared association"}</small></button></div></foreignObject>`;
  return `<div class="panel-heading"><div><h2>Where used</h2><p class="sub">${esc(stl.name)} · ${stl.rev} · Part version ${v.number}</p></div></div><p class="notice">Links below are filename-declared associations, not independently proven CAD export/assembly relations.</p><div class="relation-scroll"><svg class="relation-diagram" style="min-width:${width}px" viewBox="0 0 ${width} 450" role="group" aria-label="Users above the selected STL, candidate CAD source below">${parents.map((r, i) => `<path class="graph-line" d="M ${center} 205 V 160 H ${(width * (i + 0.5)) / parents.length} V 120"/>${node(r.file.name, "3MF / assembly", r.file.rev, (width * (i + 0.5)) / parents.length, 30, r.part.id, false, r.version.number)}`).join("")}${!parents.length ? `<text x="${center}" y="80" text-anchor="middle" class="graph-label">No known users of this source filename</text>` : ""}${node(stl.name, "STL", stl.rev, center, 205, null, true)}${cad ? `<path class="graph-line" d="M ${center} 290 V 330"/>${node(cad.name, "CAD candidate", cad.rev, center, 330, p.id, false, v.number)}` : `<text x="${center}" y="365" text-anchor="middle" class="graph-label">CAD source unknown</text>`}</svg></div>`;
}
function components(p, v) {
  const assembly = kind(v, "Assembly"),
    project = kind(v, "3MF"),
    freecad = kind(v, "FreeCAD");
  if (assembly) {
    const manifest = assembly.assemblyManifest;
    return `<div class="panel-heading"><div><h2>Native assembly components</h2><p class="sub">${esc(assembly.name)} · ${assembly.rev}</p></div>${button("Import assembly manifest", "assembly-import", "upload")}</div>${manifest ? `<p class="notice">${esc(manifest.evidence)} · Configuration ${esc(manifest.configuration || "Unknown")}<br>${esc(manifest.scope)}<br>${manifest.components.length} records · completeness not independently verified.</p><p class="helper">${manifest.warnings.map(esc).join(" ")}</p><div class="component-list">${manifest.components.map((c) => `<div class="assembly-child" style="padding-left:${Math.min(c.depth || 0, 12) * 18 + 12}px"><strong>${esc(c.name)}</strong><span>${esc(baseName(c.path) || "Virtual / unresolved")}</span><small>Configuration ${esc(c.configuration || "Unknown")} · ${esc(c.state || "Unknown")}</small></div>`).join("")}</div>` : '<div class="empty"><h3>Structure unavailable in this environment</h3>The native SLDASM did not expose a reliable child list. Export a read-only manifest with the supplied SolidWorks macro and import it here. No children have been guessed from nearby filenames.</div>'}`;
  }
  if (freecad && !project)
    return `<h2>Saved FreeCAD groups</h2><p class="notice">These are saved Group links, not a SolidWorks assembly tree. ${Object.values(freecad.objectTypes).some((t) => t.startsWith("Assembly::")) ? "This saved assembly contains a Joints container but no linked physical child parts." : "These are CAD feature/group objects, not an assembly child-component list."}</p>${freecad.groups.map((g) => `<div class="source-list"><article><strong>${esc(g.name)}</strong><p>${g.members.map(esc).join(", ") || "No saved members"}</p></article></div>`).join("")}`;
  if (!project || !project.details || !Array.isArray(project.components))
    return '<div class="empty">No component metadata supplied for this revision. Simulated revisions do not inherit evidence from an older 3MF.</div>';
  const rows = (project.components || []).filter((c) =>
    `${c.name} ${c.sourceFile || ""}`
      .toLowerCase()
      .includes(componentQuery.toLowerCase()),
  );
  return `<div class="panel-heading"><div><h2>3MF project components</h2><p class="sub">${project.components.length} object/volume records · ${project.details.plateCount} plates</p></div></div><p class="notice">This is 3MF composition, not a native SolidWorks assembly hierarchy. Repeated names are separate saved object instances.</p><label class="component-search">Find component<input id="component-search" value="${esc(componentQuery)}" placeholder="Component or source filename"></label><div class="engineering-table"><table><thead><tr><th>Object</th><th>Plates</th><th>Filament</th><th>Declared source</th><th>Local source</th></tr></thead><tbody>${rows
    .map((c) => {
      const match = state.parts.find((p) =>
        p.versions.some((v) => v.files.some((f) => f.name === c.localFile)),
      );
      return `<tr><td><strong>${esc(c.name)}</strong><small>Object ${esc(c.objectId)}</small></td><td>${c.plates.map(esc).join(", ") || "Unknown"}</td><td>${esc(c.filamentSlot || "Unknown")}</td><td>${esc(c.sourceFile || "Unknown")}</td><td>${match ? `<button data-open="${match.id}">${esc(match.id)}</button><small>Name match, not content proof</small>` : "Not supplied"}</td></tr>`;
    })
    .join("")}</tbody></table></div>`;
}
function reportRows(rows) {
  return rows.length
    ? rows
        .map(
          (r) =>
            `<article class="snap-row">${I("clipboard-text")}<div class="snap-copy"><h3>${esc(r.id)} · ${esc(byId(r.part)?.name)}</h3><p class="sub">Part ${esc(r.part)} · Version ${r.version} · ${esc(r.printer)} · ${esc(r.material)}</p></div><span class="result ${r.result !== "Successful" ? "failed" : ""}">${esc(r.result)}</span><button data-report="${r.id}">Read report</button></article>`,
        )
        .join("")
    : '<div class="empty">No print attempts recorded for this version.</div>';
}
function reportsPage() {
  return `<div class="pagehead"><div><h1>Print Reports</h1><p class="sub">Every print attempt keeps the exact Part version context.</p></div>${button("Add report", "report", "plus", "primary")}</div>${reportRows(state.reports)}`;
}
function attachmentsView(p, v) {
  const rows = state.attachments.filter(
    (a) => a.part === p.id && a.version === v.number,
  );
  return `<div class="panel-heading"><div><h2>Supporting files & software</h2><p class="sub">Attachments belong to version ${v.number}; adding them does not increase its number.</p></div><div class="row">${button("Link Git version", "git-link", "git-branch")}${button("Upload file", "attach", "paperclip", "primary")}</div></div>${rows.length ? rows.map((a) => `<article class="attachment-row">${I(a.kind === "git" ? "git-branch" : "file-text")}<div><h3>${esc(a.name)}</h3><p>${esc(a.kind === "git" ? a.url : `${(a.size / 1024).toFixed(1)} KB`)}</p>${a.kind === "git" ? `<p class="helper">${a.exact ? "Commit SHA" : "Mutable ref"}: ${esc(a.ref)}</p>` : ""}</div><a class="download-link" href="${esc(a.url)}" ${a.kind === "git" ? 'target="_blank" rel="noopener noreferrer"' : `download="${esc(a.name)}"`}>${a.kind === "git" ? "Open repository" : "Download"}</a></article>`).join("") : '<div class="empty">Add an assembly guide, wiring diagram or a fixed software commit.</div>'}<p class="helper">Saved locally in this browser; export a backup for portability. Attachments are not inherited by new Part versions.</p>`;
}
function importPage() {
  return `<div class="pagehead"><div><h1>Import samples & evidence</h1><p class="sub">Local browser processing. Source CAD documents are never edited.</p></div></div><div class="import-sections"><section><h2>STL model</h2><p>Import a supplied STL as a new local Part, version 001.</p><label>STL file<input id="stl-upload" type="file" accept=".stl"></label><p class="helper">Up to 25 MB. Units assumed as mm.</p></section><section><h2>SolidWorks assembly manifest</h2><p>Run ExportAssemblyStructure in SolidWorks 2026, then import its JSON.</p><label>Target assembly<select id="assembly-target">${state.parts
    .filter((p) => latest(p).files.some((f) => f.kind === "Assembly"))
    .map((p) => `<option value="${p.id}">${esc(p.name)}</option>`)
    .join(
      "",
    )}</select></label><label>Manifest JSON<input id="assembly-json" type="file" accept=".json"></label><p class="helper">Native assembly structure cannot be inferred from matching file names.</p></section><section><h2>Workspace backup</h2><p>Restore an exported v4 workspace. Existing local data is replaced only after confirmation.</p><label>Workspace JSON<input id="workspace-json" type="file" accept=".json"></label>${button("Export current workspace", "backup", "download-simple")}</section></div>`;
}
let draftTimer;
function captureDraft() {
  if (!modalDraftKey) return;
  const d = state.drafts[modalDraftKey] || {};
  modal.querySelectorAll("[name]").forEach((el) => {
    if (el.type !== "file")
      d[el.name] = el.type === "checkbox" ? el.checked : el.value;
  });
  state.drafts[modalDraftKey] = d;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => persist(), 180);
}
function openModal(title, body, footer = "", draftKey = null) {
  if (modal.open) modal.close();
  modalDraftKey = draftKey;
  modal.innerHTML = `<div class="modal-head"><h2 id="modal-title">${esc(title)}</h2><button class="icon ghost" id="close-modal" aria-label="Close dialog">${I("x")}</button></div><div class="modal-body">${body}<div id="form-error" role="alert" class="error"></div></div>${footer ? `<div class="modal-foot">${footer}</div>` : ""}`;
  modal.setAttribute("aria-labelledby", "modal-title");
  modal.querySelector("#close-modal").onclick = () => {
    captureDraft();
    modal.close();
  };
  if (draftKey) {
    const d = state.drafts[draftKey] || {};
    modal.querySelectorAll("[name]").forEach((el) => {
      if (d[el.name] !== undefined && el.type !== "file") {
        if (el.type === "checkbox") el.checked = d[el.name];
        else el.value = d[el.name];
      }
    });
    modal.querySelector(".modal-body").addEventListener("input", captureDraft);
    modal.querySelector(".modal-body").addEventListener("change", captureDraft);
  }
  modal.showModal();
}
function error(message) {
  document.querySelector("#form-error").textContent = message;
}
function closeSaved() {
  if (modalDraftKey) delete state.drafts[modalDraftKey];
  modalDraftKey = null;
  modal.close();
}
function changeModal() {
  const p = active(),
    v = current(p),
    base = latest(p);
  if (p.designState === "Obsolete" || p.maturity === "End of life") {
    openModal(
      "This Part is read only",
      "<p>Copy this Part to a new Part number to continue development.</p>",
      button("Copy to new Part number", "copy-part", "copy", "primary"),
    );
    bindActions();
    return;
  }
  const draftKey = "change:" + p.id + ":" + base.number,
    next = String(Number(base.number) + 1).padStart(3, "0");
  openModal(
    "Register file changes",
    `<div class="editing-context"><strong>Viewing ${v.number}</strong><span>Editing latest ${base.number} → ${next}</span></div>${v !== base ? '<p class="notice">You are viewing history. This action always starts from the latest registered version, not the historical selection.</p>' : ""}<p class="helper">Prototype simulation: no real CAD/STL/3MF file is modified. A new source file is required for genuine new geometry.</p>${base.files.map((f) => `<div class="change-file"><label><input name="change-${f.id}" type="checkbox" data-change-file="${f.id}"> ${esc(f.name)} · ${f.rev} → ${String.fromCharCode(f.rev.charCodeAt(0) + 1)}</label><textarea name="comment-${f.id}" data-file-comment="${f.id}" aria-label="Comment for ${esc(f.name)}" placeholder="What changed in this selected file?" disabled></textarea></div>`).join("")}${p.designState === "Released" ? '<label class="confirm-release"><input name="released-confirmed" type="checkbox" id="released-confirmed"> I understand that this Part is Released and confirm this change.</label>' : ""}<p class="helper">Dependent files only advance when explicitly selected. Your draft is saved locally.</p>`,
    button("Cancel", "cancel") +
      button(
        "Create Part version " + next,
        "confirm-change",
        "git-commit",
        "primary",
      ),
    draftKey,
  );
  const update = () =>
    modal
      .querySelectorAll("[data-change-file]")
      .forEach(
        (c) =>
          (modal.querySelector(
            `[data-file-comment="${c.dataset.changeFile}"]`,
          ).disabled = !c.checked),
      );
  update();
  modal
    .querySelectorAll("[data-change-file]")
    .forEach((c) => c.addEventListener("change", update));
  modal.querySelector('[data-action="cancel"]').onclick = () => {
    captureDraft();
    modal.close();
  };
  modal.querySelector('[data-action="confirm-change"]').onclick = async () => {
    try {
      const changes = [
        ...modal.querySelectorAll("[data-change-file]:checked"),
      ].map((c) => ({
        id: c.dataset.changeFile,
        comment: modal.querySelector(
          `[data-file-comment="${c.dataset.changeFile}"]`,
        ).value,
      }));
      const nextVersion = registerChange(p, changes, {
        date: today,
        releasedConfirmed: !!modal.querySelector("#released-confirmed")
          ?.checked,
      });
      selectedVersions[p.id] = nextVersion.number;
      expandedLog = nextVersion.number;
      closeSaved();
      go(p.id, nextVersion.number, "logbook");
      if (await persist())
        toast(
          "Part version " +
            nextVersion.number +
            " saved locally. Earlier versions are unchanged.",
        );
    } catch (e) {
      error(e.message);
    }
  };
}
function comparison() {
  const p = active();
  if (p.versions.length < 2) {
    openModal(
      "Compare versions",
      "<p>This Part has one supplied version. Import another revision or register a simulated change to compare.</p>",
    );
    return;
  }
  const options = (n) =>
    p.versions
      .map(
        (v) =>
          `<option ${v.number === n ? "selected" : ""}>${v.number}</option>`,
      )
      .join("");
  openModal(
    "Compare Part versions",
    `<div class="form-grid"><label>Before<select id="compare-a">${options(p.versions.at(-2).number)}</select></label><label>After<select id="compare-b">${options(current(p).number)}</select></label></div><div id="comparison-result"></div>`,
  );
  const update = async () => {
    const a = p.versions.find(
        (v) => v.number === modal.querySelector("#compare-a").value,
      ),
      b = p.versions.find(
        (v) => v.number === modal.querySelector("#compare-b").value,
      );
    const rows = compareVersions(a, b);
    const av = detailValues(a.details),
      bv = detailValues(b.details);
    modal.querySelector("#comparison-result").innerHTML =
      `<table><thead><tr><th>File</th><th>${a.number}</th><th>${b.number}</th><th>Change</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${r.before || "—"}</td><td>${r.after || "—"}</td><td>${r.status}</td></tr>`).join("")}</tbody></table><h3>3MF settings</h3><table><thead><tr><th>Property</th><th>${a.number}</th><th>${b.number}</th></tr></thead><tbody>${[
        ["Material", "material"],
        ["Layer height", "height"],
        ["Infill", "density"],
        ["Pattern", "pattern"],
        ["Time indication", "time"],
      ]
        .map(
          ([label, k]) =>
            `<tr><td>${label}</td><td>${esc(av[k])}</td><td>${esc(bv[k])}</td></tr>`,
        )
        .join(
          "",
        )}</tbody></table><div class="compare-previews">${[a, b].map((v) => `<figure><div data-compare-preview="${v.number}"></div><figcaption>Version ${v.number} · ${esc(kind(v, "STL")?.geometryEvidence || "No supplied STL")}</figcaption></figure>`).join("")}</div><p class="helper">Side-by-side previews use the supplied files. No geometric deviation/tolerance calculation is performed.</p>`;
    for (const v of [a, b]) {
      const f = kind(v, "STL");
      if (!f) continue;
      try {
        const src = await thumbnail(f);
        const el = modal.querySelector(`[data-compare-preview="${v.number}"]`);
        if (el)
          el.innerHTML = `<img src="${src}" alt="Supplied STL preview for version ${v.number}">`;
      } catch {}
    }
  };
  modal.querySelector("#compare-a").onchange = update;
  modal.querySelector("#compare-b").onchange = update;
  update();
}
function lifecycle() {
  const p = active();
  openModal(
    "Part lifecycle",
    `<p class="sub">Part-level metadata, assigned locally. Changing lifecycle does not create a file revision or Part version.</p><label for="design-state">Design state</label><select id="design-state">${Object.keys(
      lifecycleMap,
    )
      .map(
        (x) => `<option ${p.designState === x ? "selected" : ""}>${x}</option>`,
      )
      .join(
        "",
      )}</select><label for="maturity">Maturity</label><select id="maturity">${["Proof of concept", "Prototype", "Mature", "End of life"].map((x) => `<option ${p.maturity === x ? "selected" : ""}>${x}</option>`).join("")}</select><p class="helper">States cannot move backwards. Released changes require confirmation. Obsolete and End of life prevent further file changes.</p>`,
    button("Apply lifecycle", "save-lifecycle", "check", "primary"),
  );
  modal.querySelector('[data-action="save-lifecycle"]').onclick = async () => {
    try {
      const next = modal.querySelector("#design-state").value,
        maturity = modal.querySelector("#maturity").value;
      checkLifecycle(p, next, maturity);
      state.activity.push({
        part: p.id,
        date: today,
        type: "lifecycle",
        from: p.designState,
        to: next,
        maturity,
      });
      p.designState = next;
      p.maturity = maturity;
      modal.close();
      render();
      if (await persist()) toast("Lifecycle saved. Part version unchanged.");
    } catch (e) {
      error(e.message);
    }
  };
}
function copyPart() {
  const p = active();
  openModal(
    "Copy to a new Part number",
    `<label for="new-number">New Part number</label><input id="new-number" placeholder="For example: 12345678"><label for="new-name">Name</label><input id="new-name" value="${esc(p.name)} copy"><p class="helper">Copies the selected fixed file references into version 001. Original source hashes/revisions stay unchanged. Reports and attachments are not copied.</p>`,
    button("Create copy", "confirm-copy", "copy", "primary"),
  );
  modal.querySelector('[data-action="confirm-copy"]').onclick = async () => {
    const id = modal.querySelector("#new-number").value.trim(),
      name = modal.querySelector("#new-name").value.trim();
    if (!/^[A-Za-z0-9-]{3,40}$/.test(id) || byId(id) || !name)
      return error(
        "Enter a unique Part number (letters, numbers or hyphens) and a name.",
      );
    const copy = structuredClone(p);
    copy.id = id;
    copy.name = name;
    copy.designState = "Draft";
    copy.maturity = "Proof of concept";
    copy.numberBasis = "Locally assigned Part number";
    copy.derivedFrom = p.id;
    copy.versions = [
      {
        ...structuredClone(current(p)),
        number: "001",
        date: today,
        author: "Local copy",
        changes: current(p).files.map((f) => ({
          id: f.id,
          comment: "Copied fixed source reference from " + p.id + ".",
        })),
      },
    ];
    state.parts.push(copy);
    modal.close();
    go(id);
    await persist();
  };
}
function reportModal() {
  const choices =
    page === "reports"
      ? state.parts.flatMap((p) => p.versions.map((v) => ({ p, v })))
      : [{ p: active(), v: current(active()) }];
  const first = choices[0],
    key = "report:" + first.p.id + ":" + first.v.number;
  let photos = structuredClone(state.drafts[key]?._photos || []),
    readingPhotos = false;
  openModal(
    "Record a print attempt",
    `<p class="sub">Your draft is kept locally when closing this dialog. Saving a report does not create a Part version.</p><label for="report-version">Printed Part version</label><select name="version" id="report-version">${choices.map(({ p, v }) => `<option value="${p.id}:${v.number}">${esc(p.id)} · ${esc(p.name)} · ${v.number}</option>`).join("")}</select><div class="form-grid"><label>Printer<input name="printer" id="printer" value="Unknown"></label><label>Actual material<input name="material" id="report-material" value="${esc(profile(first.v).material)}"></label></div><label for="outcome">Result</label><select name="outcome" id="outcome"><option>Successful</option><option>Failed</option><option>Aborted</option></select><label for="notes">Observations & measurements</label><textarea name="notes" id="notes" placeholder="Include units and what you compared against."></textarea><label for="photo-upload">Photos / screenshots</label><input id="photo-upload" type="file" accept="image/png,image/jpeg,image/webp" multiple><div id="photo-preview" class="photos"></div><p class="helper">Paste screenshots with Ctrl+V. Up to five images, 5 MB each.</p>`,
    button("Discard draft", "discard-draft", "trash") +
      button("Save Print Report", "save-report", "check", "primary"),
    key,
  );
  const previews = () => {
    const el = modal.querySelector("#photo-preview");
    if (el)
      el.innerHTML = photos
        .map((src) => `<img src="${src}" alt="Print attempt photograph">`)
        .join("");
  };
  previews();
  const addPhotos = async (files) => {
    readingPhotos = true;
    try {
      for (const f of files) {
        if (photos.length >= 5) return error("Maximum five images.");
        if (
          !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
          f.size > 5 * 1024 * 1024
        ) {
          error("Choose PNG/JPEG/WebP up to 5 MB.");
          continue;
        }
        photos.push(await dataUrl(f));
      }
      state.drafts[key] ??= {};
      state.drafts[key]._photos = photos;
      captureDraft();
      await persist();
      previews();
    } finally {
      readingPhotos = false;
    }
  };
  modal.querySelector("#photo-upload").onchange = (e) =>
    addPhotos(e.target.files);
  modal.onpaste = (e) => {
    const files = [...e.clipboardData.items]
      .filter((x) => x.kind === "file")
      .map((x) => x.getAsFile());
    if (files.length) {
      e.preventDefault();
      addPhotos(files);
    }
  };
  modal.querySelector('[data-action="discard-draft"]').onclick = async () => {
    delete state.drafts[key];
    modalDraftKey = null;
    modal.close();
    await persist();
    toast("Draft discarded.");
  };
  modal.querySelector('[data-action="save-report"]').onclick = async () => {
    if (readingPhotos) return error("Wait for photographs to finish loading.");
    const printer = modal.querySelector("#printer").value.trim();
    if (!printer) return error("Enter a printer or Unknown.");
    const [part, version] = modal
      .querySelector("#report-version")
      .value.split(":");
    state.reports.unshift({
      id: "PR-" + String(state.reports.length + 1).padStart(3, "0"),
      part,
      version,
      printer,
      material: modal.querySelector("#report-material").value,
      result: modal.querySelector("#outcome").value,
      notes: modal.querySelector("#notes").value,
      date: today,
      photos,
    });
    closeSaved();
    render();
    if (await persist())
      toast("Print Report saved locally. Part version unchanged.");
  };
}
function showReport(id) {
  const r = state.reports.find((r) => r.id === id);
  openModal(
    r.id + " · Print Report",
    `<p class="sub">Part ${esc(r.part)} · Part version ${r.version} · ${esc(r.printer)}</p><span class="result ${r.result !== "Successful" ? "failed" : ""}">${esc(r.result)}</span><p>Actual material: ${esc(r.material)}</p><p class="sub report-notes">${esc(r.notes)}</p><div class="photos">${r.photos.map((src) => `<img src="${src}" alt="Print attempt photograph">`).join("")}</div>`,
  );
}
function dataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(Error("File could not be read."));
    r.readAsDataURL(file);
  });
}
function attachModal() {
  const p = active(),
    v = current(p);
  openModal(
    "Upload attachment",
    `<p>Part ${esc(p.id)} · Version ${v.number}. This will not increase the Part version.</p><label for="attachment-file">Supporting file</label><input id="attachment-file" type="file"><p class="helper">Up to 10 MB. File is stored locally, never executed.</p>`,
    button("Save attachment", "save-attachment", "paperclip", "primary"),
  );
  modal.querySelector('[data-action="save-attachment"]').onclick = async () => {
    const f = modal.querySelector("#attachment-file").files[0];
    if (!f || f.size > 10 * 1024 * 1024)
      return error("Choose a file up to 10 MB.");
    try {
      const url = await dataUrl(f);
      state.attachments.push({
        id: crypto.randomUUID(),
        part: p.id,
        version: v.number,
        name: f.name,
        size: f.size,
        kind: "file",
        url,
        date: today,
      });
      modal.close();
      render();
      if (await persist())
        toast("Attachment saved locally. Part version unchanged.");
    } catch (e) {
      error(e.message);
    }
  };
}
function gitModal() {
  const p = active(),
    v = current(p),
    key = "git:" + p.id + ":" + v.number;
  openModal(
    "Link a software version",
    `<p class="sub">Part ${esc(p.id)} · Version ${v.number}. Full commit SHA recommended for a fixed software version.</p><label>Label<input name="label" id="git-name"></label><label>Repository URL<input name="url" id="git-url" placeholder="https://github.com/owner/repository"></label><label>Commit SHA or ref<input name="ref" id="git-ref"></label><p class="helper">Branches/tags are mutable. Repository and commit are not verified online.</p>`,
    button("Add Git link", "save-git", "git-branch", "primary"),
    key,
  );
  modal.querySelector('[data-action="save-git"]').onclick = async () => {
    try {
      const url = new URL(modal.querySelector("#git-url").value.trim()),
        ref = modal.querySelector("#git-ref").value.trim();
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw Error("Use an HTTP(S) repository URL without credentials.");
      if (!ref) throw Error("Enter a commit SHA or ref.");
      state.attachments.push({
        id: crypto.randomUUID(),
        part: p.id,
        version: v.number,
        kind: "git",
        url: url.href,
        ref,
        name:
          modal.querySelector("#git-name").value.trim() ||
          "Software repository",
        exact: /^(?:[a-f\d]{40}|[a-f\d]{64})$/i.test(ref),
        date: today,
      });
      closeSaved();
      render();
      if (await persist()) toast("Git link saved. Part version unchanged.");
    } catch (e) {
      error(e.message);
    }
  };
}
function tagModal(bulk = false) {
  const ids = bulk ? [...selected] : [active().id];
  openModal(
    "Add tag",
    `<p>${ids.length} Parts selected. Case-insensitive; no spaces.</p><label>Tag<input id="tag-input" placeholder="#workshop"></label>`,
    button("Add tag", "save-tag", "tag", "primary"),
  );
  modal.querySelector('[data-action="save-tag"]').onclick = async () => {
    const value = modal
      .querySelector("#tag-input")
      .value.replace(/^#/, "")
      .trim();
    if (!/^[-_\p{L}\p{N}]+$/u.test(value))
      return error("Use letters, numbers, - or _. No spaces or extra #.");
    const existing =
      state.parts
        .flatMap((p) => p.tags)
        .find((t) => t.toLowerCase() === value.toLowerCase()) || value;
    ids.forEach((id) => {
      const p = byId(id);
      if (!p.tags.some((t) => t.toLowerCase() === value.toLowerCase()))
        p.tags.push(existing);
    });
    modal.close();
    render();
    await persist();
  };
}
function saveSearch() {
  openModal(
    "Save search",
    `<label>Name<input id="query-name"></label><p class="helper">${esc(query || "All parts")} · ${esc(materialFilter || "All materials")}</p>`,
    button("Save search", "confirm-search", "bookmark-simple", "primary"),
  );
  modal.querySelector('[data-action="confirm-search"]').onclick = async () => {
    const name = modal.querySelector("#query-name").value.trim();
    if (!name) return error("Enter a name.");
    state.saved.push({ name, query, material: materialFilter, collection });
    modal.close();
    render();
    await persist();
  };
}
function columns() {
  openModal(
    "Table columns",
    `<p>Part number, name and Part version are always shown.</p>${Object.entries(
      columnLabels,
    )
      .map(
        ([key, label]) =>
          `<label><input type="checkbox" data-column="${key}" ${state.preferences.columns.includes(key) ? "checked" : ""}> ${label}</label>`,
      )
      .join("")}`,
    button("Apply columns", "save-columns", "check", "primary"),
  );
  modal.querySelector('[data-action="save-columns"]').onclick = async () => {
    state.preferences.columns = [
      ...modal.querySelectorAll("[data-column]:checked"),
    ].map((x) => x.dataset.column);
    state.preferences.view = "table";
    modal.close();
    render();
    await persist();
  };
}
function settings() {
  openModal(
    "Local workspace",
    `<p class="sub">${state.parts.length} Parts, ${state.reports.length} reports, ${state.attachments.length} attachments. Data is saved with IndexedDB in this browser profile. It is not server storage and may be removed by clearing browser data or private browsing.</p><p class="notice">Export a backup for moving to another computer or keeping a durable copy. Native CAD extraction/slicing and cloud sync are not connected.</p><div class="settings-actions">${button("Export workspace backup", "backup", "download-simple")}${button("Reset local demo", "reset", "arrow-counter-clockwise")}</div><p class="helper">Shortcuts: / search, ? help; arrow keys switch tabs; in the model use arrows to rotate, + / − to zoom.</p>`,
  );
  bindActions();
}
function exportBackup() {
  captureDraft();
  const json = JSON.stringify(
    state,
    (key, value) => {
      if (value instanceof ArrayBuffer) {
        let binary = "";
        for (let i = 0; i < value.byteLength; i += 8192)
          binary += String.fromCharCode(
            ...new Uint8Array(value, i, Math.min(8192, value.byteLength - i)),
          );
        return { __prcBuffer: btoa(binary) };
      }
      return value;
    },
    2,
  );
  downloadBlob(
    new Blob([json], { type: "application/json" }),
    "Printchill-workspace-" + today + ".json",
  );
}
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function resetModal() {
  openModal(
    "Reset local workspace",
    `<p>This removes locally saved Parts, reports, attachments and drafts from this browser and restores the supplied samples. Export a backup first.</p><label><input id="reset-confirm" type="checkbox"> I have a backup or accept losing the local changes.</label>`,
    button("Cancel", "cancel") +
      button("Reset workspace", "confirm-reset", "trash"),
  );
  modal.querySelector('[data-action="cancel"]').onclick = () => modal.close();
  modal.querySelector('[data-action="confirm-reset"]').onclick = async () => {
    if (!modal.querySelector("#reset-confirm").checked)
      return error("Confirm the reset.");
    try {
      clearTimeout(draftTimer);
      await saveChain.catch(() => {});
      await clearWorkspace();
      location.href = location.pathname;
      location.reload();
    } catch (e) {
      error(e.message);
    }
  };
}
async function importStl(file) {
  if (!file) return;
  if (!/\.stl$/i.test(file.name) || file.size > 25 * 1024 * 1024)
    return toast("Choose an STL up to 25 MB.", true);
  try {
    const buffer = await file.arrayBuffer(),
      id = "LOCAL-" + crypto.randomUUID().slice(0, 8),
      f = {
        id: "stl",
        kind: "STL",
        name: file.name,
        rev: "A",
        revisionBasis: "Assigned on import; original revision unknown",
        geometryEvidence: "Supplied imported STL",
        importId: crypto.randomUUID(),
        importedStl: buffer,
        sha256: Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
        )
          .map((x) => x.toString(16).padStart(2, "0"))
          .join(""),
      };
    await loadGeometry(f);
    state.parts.push({
      id,
      name: file.name.replace(/\.stl$/i, ""),
      stem: file.name,
      type: "Part",
      tags: ["import"],
      collection: "Imports",
      numberBasis: "Local sample ID; no source part number verified",
      designState: "Draft",
      maturity: "Proof of concept",
      versions: [
        {
          number: "001",
          date: today,
          author: "Local import",
          files: [f],
          changes: [
            {
              id: "stl",
              comment: "Imported supplied STL. CAD source unknown.",
            },
          ],
        },
      ],
    });
    go(id);
    if (await persist()) toast("STL saved locally as Part version 001.");
  } catch (e) {
    toast("STL import failed: " + e.message, true);
  }
}
async function importAssembly(file, targetId) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024)
    return toast("Manifest JSON must be at most 5 MB.", true);
  try {
    const p = byId(targetId),
      v = current(p),
      f = kind(v, "Assembly"),
      manifest = validateAssemblyManifest(
        JSON.parse(await file.text()),
        f.name,
      );
    openModal(
      "Confirm assembly evidence",
      `<p>${manifest.components.length} component records for ${esc(f.name)}.</p><p class="notice">${esc(manifest.evidence)}</p><p class="helper">${esc(manifest.scope)} ${manifest.warnings.map(esc).join(" ")}</p>`,
      button(
        "Attach manifest to version " + v.number,
        "confirm-manifest",
        "check",
        "primary",
      ),
    );
    modal.querySelector('[data-action="confirm-manifest"]').onclick =
      async () => {
        f.assemblyManifest = manifest;
        modal.close();
        go(p.id, v.number, "components");
        if (await persist())
          toast("Assembly manifest saved. Part version unchanged.");
      };
  } catch (e) {
    toast("Manifest rejected: " + e.message, true);
  }
}
function validateWorkspace(data) {
  if (
    data?.schema !== 4 ||
    !Array.isArray(data.parts) ||
    data.parts.length > 1000 ||
    !data.parts.length
  )
    throw Error("Not a supported v4 workspace.");
  const ids = new Set();
  for (const p of data.parts) {
    if (
      !/^[\w-]{3,40}$/.test(p.id) ||
      ["__proto__", "constructor", "prototype"].includes(p.id) ||
      ids.has(p.id) ||
      typeof p.name !== "string" ||
      typeof p.numberBasis !== "string" ||
      !Array.isArray(p.tags) ||
      p.tags.some((t) => typeof t !== "string") ||
      !Array.isArray(p.versions) ||
      !p.versions.length ||
      p.versions.length > 999 ||
      !lifecycleMap[p.designState]?.includes(p.maturity)
    )
      throw Error("Invalid Part data.");
    ids.add(p.id);
    for (const v of p.versions) {
      if (
        !/^\d{3}$/.test(v.number) ||
        !Array.isArray(v.files) ||
        !Array.isArray(v.changes) ||
        v.changes.some(
          (c) => typeof c.id !== "string" || typeof c.comment !== "string",
        )
      )
        throw Error("Invalid version data.");
      for (const f of v.files) {
        if (
          !/^[a-z\d-]+$/.test(f.id) ||
          !/^[A-Z]$/.test(f.rev) ||
          typeof f.name !== "string" ||
          !["CAD", "STL", "Assembly", "3MF", "FreeCAD"].includes(f.kind)
        )
          throw Error("Invalid file record.");
        if (
          f.importedStl &&
          (!(f.importedStl instanceof ArrayBuffer) ||
            f.importedStl.byteLength > 25 * 1024 * 1024)
        )
          throw Error("Invalid imported STL.");
        if (
          f.components &&
          (!Array.isArray(f.components) ||
            f.components.some(
              (c) =>
                !c || typeof c.name !== "string" || !Array.isArray(c.plates),
            ))
        )
          throw Error("Invalid project components.");
        if (
          f.platePreviews &&
          (!Array.isArray(f.platePreviews) ||
            f.platePreviews.some(
              (x) => typeof x.asset !== "string" || typeof x.plate !== "string",
            ))
        )
          throw Error("Invalid plate previews.");
        if (
          f.kind === "3MF" &&
          ((f.details &&
            (!Number.isInteger(f.details.plateCount) ||
              f.details.plateCount < 0)) ||
            (!f.details && f.sha256))
        )
          throw Error("Invalid project metadata.");
      }
      if (
        v.details &&
        (!Array.isArray(v.details.filaments) ||
          v.details.filaments.some(
            (f) => !Number.isInteger(f.slot) || f.slot < 1 || f.slot > 256,
          ))
      )
        throw Error("Invalid filament records.");
    }
  }
  if (
    !Array.isArray(data.reports) ||
    !Array.isArray(data.attachments) ||
    !Array.isArray(data.saved) ||
    !data.preferences ||
    !Array.isArray(data.preferences.columns) ||
    data.preferences.columns.some((c) => !columnLabels[c])
  )
    throw Error("Invalid workspace collections.");
  for (const a of data.attachments) {
    if (a.kind === "git") {
      const u = new URL(a.url);
      if (!["http:", "https:"].includes(u.protocol) || u.username || u.password)
        throw Error("Invalid repository link.");
    } else if (!/^data:[^,]*;base64,[A-Za-z\d+/=]*$/.test(a.url))
      throw Error("Invalid attachment data.");
  }
  for (const r of data.reports)
    if (
      !/^PR-\d+$/.test(r.id) ||
      !ids.has(r.part) ||
      !/^\d{3}$/.test(r.version) ||
      !Array.isArray(r.photos) ||
      r.photos.some(
        (url) =>
          !/^data:image\/(png|jpeg|webp);base64,[A-Za-z\d+/=]*$/.test(url),
      )
    )
      throw Error("Invalid report photographs.");
  if (
    data.saved.some(
      (q) => typeof q.name !== "string" || typeof q.query !== "string",
    )
  )
    throw Error("Invalid saved query.");
  return data;
}
async function importWorkspace(file) {
  if (!file) return;
  if (file.size > 100 * 1024 * 1024)
    return toast("Backup exceeds 100 MB.", true);
  try {
    const data = validateWorkspace(
      JSON.parse(await file.text(), (key, value) => {
        if (
          value &&
          typeof value === "object" &&
          Object.keys(value).length === 1 &&
          typeof value.__prcBuffer === "string"
        ) {
          const s = atob(value.__prcBuffer);
          if (s.length > 25 * 1024 * 1024)
            throw Error("Binary file exceeds limit.");
          return Uint8Array.from(s, (c) => c.charCodeAt(0)).buffer;
        }
        return value;
      }),
    );
    openModal(
      "Restore workspace backup",
      `<p>Replace this local workspace with ${data.parts.length} Parts, ${data.reports.length} reports and ${data.attachments.length} attachments?</p><label><input type="checkbox" id="restore-confirm"> I have exported the current workspace or accept replacing it.</label>`,
      button("Restore workspace", "confirm-restore", "upload", "primary"),
    );
    modal.querySelector('[data-action="confirm-restore"]').onclick =
      async () => {
        if (!modal.querySelector("#restore-confirm").checked)
          return error("Confirm replacing the workspace.");
        state = data;
        state.drafts ??= {};
        state.activity ??= [];
        modal.close();
      query = "";
      materialFilter = "";
      collection = "";
      pageIndex = 0;
      selected.clear();
      selectedVersions = {};
      activeId = state.parts[0].id;
      libraryGo();
        await persist();
      };
  } catch (e) {
    toast("Backup rejected: " + e.message, true);
  }
}
function fileInfo(id) {
  const p = active(),
    v = current(p),
    f = v.files.find((f) => f.id === id);
  if (!f) return;
  if (f.kind === "STL") {
    tab = "where";
    render();
    return;
  }
  if (["Assembly", "3MF", "FreeCAD"].includes(f.kind)) {
    tab = "components";
    render();
    return;
  }
  openModal(
    "Source document",
    `<h3>${esc(f.name)} · ${f.rev}</h3><p>${esc(f.revisionBasis)}</p><p class="helper">SHA-256: ${esc(f.sha256 || "No new source file supplied")}</p><p class="notice">No native CAD viewer or desktop connector is connected.</p>`,
  );
}
function refreshTab() {
  const panel = document.querySelector("#tab-content");
  if (!panel) return;
  panel.innerHTML = tabContent();
  panel.setAttribute("aria-labelledby", "tab-" + tab);
  bindDetail();
}
function selectTab(id, focus = false) {
  tab = id;
  document.querySelectorAll("[data-tab]").forEach((b) => {
    const selected = b.dataset.tab === id;
    b.setAttribute("aria-selected", String(selected));
    b.tabIndex = selected ? 0 : -1;
    b.classList.toggle("active", selected);
  });
  refreshTab();
  history.replaceState(
    null,
    "",
    "#" +
      new URLSearchParams({
        part: activeId,
        version: current(active()).number,
        tab,
      }),
  );
  if (focus) document.querySelector(`[data-tab="${id}"]`)?.focus();
}
function bindCards() {
  document
    .querySelectorAll("[data-open]")
    .forEach(
      (b) =>
        (b.onclick = () => go(b.dataset.open, b.dataset.openVersion || null)),
    );
  document.querySelectorAll("[data-select]").forEach(
    (c) =>
      (c.onchange = () => {
        c.checked
          ? selected.add(c.dataset.select)
          : selected.delete(c.dataset.select);
        updateLibrary();
      }),
  );
  document.querySelectorAll("[data-card-version]").forEach(
    (c) =>
      (c.onchange = () => {
        selectedVersions[c.dataset.cardVersion] = c.value;
        updateLibrary();
      }),
  );
  document.querySelectorAll("[data-tag]").forEach(
    (b) =>
      (b.onclick = () => {
        query = "#" + b.dataset.tag;
        libraryGo();
      }),
  );
  document.querySelectorAll("[data-sort]").forEach(
    (b) =>
      (b.onclick = () => {
        sortDir = sortKey === b.dataset.sort ? -sortDir : 1;
        sortKey = b.dataset.sort;
        updateLibrary();
      }),
  );
  bindActions();
}
function bindDetail() {
  document.querySelectorAll("[data-tab]").forEach((b) => {
    b.onclick = () => selectTab(b.dataset.tab);
    b.onkeydown = (e) => {
      const tabs = [...document.querySelectorAll("[data-tab]")],
        index = tabs.indexOf(b);
      if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const next =
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? tabs.length - 1
              : (index + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                tabs.length;
        selectTab(tabs[next].dataset.tab, true);
      }
    };
  });
  document
    .querySelectorAll("[data-file]")
    .forEach((b) => (b.onclick = () => fileInfo(b.dataset.file)));
  document.querySelectorAll("[data-log]").forEach(
    (b) =>
      (b.onclick = () => {
        expandedLog = expandedLog === b.dataset.log ? null : b.dataset.log;
        refreshTab();
        document
          .querySelector(`.commit-dot[data-log="${b.dataset.log}"]`)
          ?.focus();
      }),
  );
  document
    .querySelectorAll("[data-history]")
    .forEach(
      (b) => (b.onclick = () => go(activeId, b.dataset.history, "logbook")),
    );
  document
    .querySelectorAll("[data-report]")
    .forEach((b) => (b.onclick = () => showReport(b.dataset.report)));
  document
    .querySelectorAll("[data-open]")
    .forEach(
      (b) =>
        (b.onclick = () => go(b.dataset.open, b.dataset.openVersion || null)),
    );
  const q = document.querySelector("#component-search");
  if (q)
    q.oninput = (e) => {
      componentQuery = e.target.value;
      const cursor = e.target.selectionStart;
      refreshTab();
      const input = document.querySelector("#component-search");
      input.focus();
      input.setSelectionRange(cursor, cursor);
    };
  bindActions();
}
function bind() {
  document.querySelectorAll("[data-page]").forEach(
    (b) =>
      (b.onclick = () => {
        if (b.dataset.page === "library") libraryGo();
        else {
          pageGo(b.dataset.page);
        }
      }),
  );
  document.querySelectorAll("[data-collection]").forEach(
    (b) =>
      (b.onclick = () => {
        collection = b.dataset.collection;
        pageIndex = 0;
        libraryGo();
      }),
  );
  document.querySelectorAll("[data-saved]").forEach(
    (b) =>
      (b.onclick = () => {
        const q = state.saved[Number(b.dataset.saved)];
        query = q.query;
        materialFilter = q.material;
        collection = q.collection;
        libraryGo();
      }),
  );
  if (page === "library") {
    document.querySelector("#search").oninput = (e) => {
      query = e.target.value;
      pageIndex = 0;
      updateLibrary();
    };
    document.querySelector("#material-filter").onchange = (e) => {
      materialFilter = e.target.value;
      pageIndex = 0;
      updateLibrary();
    };
    document.querySelector("#sort").onchange = (e) => {
      sortKey = e.target.value;
      sortDir = 1;
      updateLibrary();
    };
  }
  if (page === "detail") {
    document.querySelector("#part-version").onchange = (e) =>
      go(activeId, e.target.value, tab);
    const plates = document.querySelector("#preview-plate");
    if (plates)
      plates.onchange = (e) => {
        plate = e.target.value;
        render();
      };
  }
  if (page === "import") {
    document.querySelector("#stl-upload").onchange = (e) =>
      importStl(e.target.files[0]);
    document.querySelector("#assembly-json").onchange = (e) =>
      importAssembly(
        e.target.files[0],
        document.querySelector("#assembly-target").value,
      );
    document.querySelector("#workspace-json").onchange = (e) =>
      importWorkspace(e.target.files[0]);
  }
  bindCards();
  bindDetail();
}
function bindActions() {
  document
    .querySelectorAll("[data-action]")
    .forEach((b) => (b.onclick = () => action(b.dataset.action)));
}
function action(a) {
  if (a.startsWith("open:")) return go(a.slice(5));
  if (a.startsWith("where:")) return go(a.slice(6), null, "where");
  switch (a) {
    case "menu":
      return document.querySelector(".sidebar").classList.toggle("open");
    case "import":
      return pageGo("import");
    case "grid":
    case "table":
      state.preferences.view = a;
      render();
      return persist();
    case "filters": {
      const el = document.querySelector("#filters");
      el.hidden = !el.hidden;
      return;
    }
    case "clear-filters":
      materialFilter = "";
      return render();
    case "columns":
      return columns();
    case "save-search":
      return saveSearch();
    case "deselect":
      selected.clear();
      return updateLibrary();
    case "bulk-tag":
      return tagModal(true);
    case "previous":
      pageIndex = Math.max(0, pageIndex - 1);
      return updateLibrary();
    case "next":
      pageIndex = Math.min(
        Math.ceil(filtered().length / 12) - 1,
        pageIndex + 1,
      );
      return updateLibrary();
    case "preview-size":
      compact = !compact;
      return render();
    case "compare":
      return comparison();
    case "change":
      return changeModal();
    case "lifecycle":
      return lifecycle();
    case "copy-part":
      return copyPart();
    case "report":
      return reportModal();
    case "attach":
      return attachModal();
    case "git-link":
      return gitModal();
    case "assembly-import":
      pageGo("import");
      document.querySelector("#assembly-target").value = activeId;
      return;
    case "settings":
      return settings();
    case "backup":
      return exportBackup();
    case "reset":
      return resetModal();
    case "copy-link": {
      const url = location.href;
      navigator.clipboard
        ?.writeText(url)
        .then(() => toast("Part version link copied."))
        .catch(() =>
          openModal(
            "Part version link",
            `<label>Copy this link<input value="${esc(url)}" readonly></label>`,
          ),
        );
      return;
    }
    case "time-help":
      return openModal(
        "Print time indication",
        '<p>Slice all plates using the intended printer profile, then save/export a 3MF that includes slicing results. A complete saved estimate is shown as an indication rounded to five minutes.</p><p class="helper">The supplied samples contain no complete time prediction. This prototype does not run a background slicer.</p>',
      );
  }
}
function route() {
  const params = new URLSearchParams(location.hash.slice(1)),
    id = params.get("part");
  if (["reports", "import"].includes(params.get("page"))) {
    page = params.get("page");
    render();
  } else if (id && byId(id)) {
    const v = params.get("version");
    page = "detail";
    activeId = id;
    if (byId(id).versions.some((x) => x.number === v)) selectedVersions[id] = v;
    tab = [
      "details",
      "where",
      "logbook",
      "components",
      "reports",
      "attachments",
      "sources",
    ].includes(params.get("tab"))
      ? params.get("tab")
      : "details";
    render();
  } else {
    page = "library";
    render();
  }
}
modal.addEventListener("cancel", () => captureDraft());
modal.addEventListener("close", () => {
  modal.onpaste = null;
  modalDraftKey = null;
});
window.addEventListener("popstate", route);
window.addEventListener("hashchange", route);
document.addEventListener("keydown", (e) => {
  if (
    modal.open ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey ||
    e.target.matches("input,textarea,select")
  )
    return;
  if (e.key === "/") {
    e.preventDefault();
    if (page !== "library") libraryGo();
    document.querySelector("#search").focus();
  }
  if (e.key === "?") {
    e.preventDefault();
    settings();
  }
});
window.addEventListener("beforeunload", (e) => {
  if (storageStatus === "Saving locally…" || storageError) {
    e.preventDefault();
    e.returnValue = "Local changes may not yet be saved.";
  }
});
async function boot() {
  installTooltips();
  try {
    const restored = await readWorkspace();
    if (restored) {
      state = validateWorkspace(restored);
      state.drafts ??= {};
      state.activity ??= [];
    }
    storageStatus = "Saved on this browser";
  } catch (e) {
    storageError = e;
    storageStatus = "Local storage unavailable — export a backup";
  }
  route();
}
boot();
