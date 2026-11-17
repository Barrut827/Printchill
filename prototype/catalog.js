import catalog from "./assets/sample-catalog.json";
import { detailValues } from "./part-details.js";
const assetUrls = import.meta.glob("./assets/samples/*", {
  eager: true,
  query: "?url",
  import: "default",
});
export const assetUrl = (name) => assetUrls["./assets/samples/" + name];
export { catalog };
export function initialParts() {
  return catalog.groups.map((g, index) => {
    const number = g.label.match(/^(\d{8}|\d{4}-\d{4})/)?.[1];
    const isAssembly = g.files.some((f) => f.kind === "Assembly"),
      isProject = g.files.every((f) => f.kind === "3MF");
    const p = {
      id: number || "SMP-" + String(index + 1).padStart(3, "0"),
      name: g.label
        .replace(/^(\d{8}|\d{4}-\d{4})[_ -]*/, "")
        .replaceAll("_", " "),
      stem: g.label,
      tags: [isAssembly ? "assembly" : isProject ? "print-project" : "sample"],
      collection: isAssembly
        ? "Assemblies"
        : g.label.toLowerCase().includes("jeep")
          ? "Jeep"
          : "Samples",
      color: 0x208e83,
      type: isAssembly
        ? "Assembly"
        : isProject
          ? "Print project"
          : g.files.some((f) => f.kind === "FreeCAD")
            ? "FreeCAD"
            : "Part",
      numberBasis: number
        ? "Part number from filename; CAD metadata not verified"
        : "Local sample ID; no source part number available",
      designState: "Draft",
      maturity: "Proof of concept",
      versions: [],
      sourceGroup: g.key,
    };
    const revisions = [...new Set(g.files.map((f) => f.revision))].sort();
    const previous = new Map();
    for (const rev of revisions) {
      const additions = g.files.filter((f) => f.revision === rev);
      for (const f of additions)
        previous.set(f.kind, {
          ...structuredClone(f),
          id: f.kind.toLowerCase().replaceAll(" ", "-"),
          rev: f.revision,
          source: null,
          geometryEvidence: f.geometryAsset
            ? "Supplied STL file, exact hash recorded"
            : null,
        });
      const files = [...previous.values()].map((f) => structuredClone(f)),
        project = files.find((f) => f.kind === "3MF");
      const details = project?.details || null,
        values = detailValues(details);
      p.versions.push({
        number: String(p.versions.length + 1).padStart(3, "0"),
        date: "2026-11-17",
        author: "Sample import",
        files,
        details,
        profile: {
          material: values.material,
          weight: values.weight,
          time: values.time,
        },
        changes: additions.map((f) => ({
          id: f.kind.toLowerCase().replaceAll(" ", "-"),
          comment: `Imported ${f.name}. ${f.revisionBasis}.`,
        })),
        evidence:
          "Revision order inferred from filename labels; not recovered CAD save history.",
      });
    }
    return p;
  });
}
export const knownFiles = catalog.files;
