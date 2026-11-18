export function baseName(path) {
  return String(path || "")
    .replaceAll("\\", "/")
    .split("/")
    .at(-1);
}
export function validateAssemblyManifest(data, expectedFile) {
  if (data.schema !== "printchill.assembly.v1")
    throw Error("Unsupported assembly manifest schema.");
  if (baseName(data.source?.file).toLowerCase() !== expectedFile.toLowerCase())
    throw Error(
      "Manifest source filename does not match the selected assembly.",
    );
  if (!Array.isArray(data.components) || data.components.length > 10000)
    throw Error("Invalid component list (limit 10,000 records).");
  const fields = ["name", "path", "configuration", "state"];
  const components = data.components.map((c) => {
    if (
      !c ||
      fields.some((k) => typeof c[k] !== "string") ||
      !Number.isInteger(c.depth) ||
      c.depth < 0 ||
      c.depth > 30
    )
      throw Error("Invalid component record.");
    return Object.fromEntries([
      ...fields.map((k) => [k, c[k]]),
      ["depth", c.depth],
    ]);
  });
  return {
    configuration: String(data.configuration || ""),
    components,
    evidence:
      "User-supplied SolidWorks manifest; source filename matches, source bytes not independently verified",
    scope: String(data.scope || "Unknown"),
    warnings: Array.isArray(data.warnings) ? data.warnings.map(String) : [],
  };
}
