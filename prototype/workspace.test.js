import test from "node:test";
import assert from "node:assert/strict";
import {
  makePart,
  registerChange,
  checkLifecycle,
  compareVersions,
} from "./model.js";
import { validateAssemblyManifest } from "./manifest.js";
test("released and archived states protect file changes without partial updates", () => {
  const p = makePart({ id: "TEST", name: "Test", stem: "test" });
  p.designState = "Released";
  p.maturity = "Mature";
  const before = JSON.stringify(p);
  assert.throws(() => registerChange(p, [{ id: "stl", comment: "" }]));
  assert.equal(JSON.stringify(p), before);
  const v = registerChange(p, [{ id: "stl", comment: "Confirmed" }], {
    releasedConfirmed: true,
  });
  assert.equal(v.number, "002");
  assert.equal(v.files.find((f) => f.id === "stl").sha256, null);
  p.designState = "Obsolete";
  assert.throws(() =>
    registerChange(p, [{ id: "stl", comment: "" }], {
      releasedConfirmed: true,
    }),
  );
  assert.equal(p.versions.length, 2);
});
test("lifecycle follows documented state and maturity mapping", () => {
  const p = { designState: "Draft", maturity: "Proof of concept" };
  assert.doesNotThrow(() => checkLifecycle(p, "Draft", "Prototype"));
  assert.throws(() => checkLifecycle(p, "Released", "Prototype"));
  assert.doesNotThrow(() => checkLifecycle(p, "Released", "Mature"));
  assert.throws(() =>
    checkLifecycle(
      { designState: "Released", maturity: "Mature" },
      "Draft",
      "Prototype",
    ),
  );
  assert.throws(() =>
    checkLifecycle(
      { designState: "Released", maturity: "End of life" },
      "Released",
      "Mature",
    ),
  );
});
test("comparison uses source hashes, detects changed and newly added files", () => {
  const a = { files: [{ id: "stl", name: "A.stl", rev: "A", sha256: "old" }] },
    b = {
      files: [
        { id: "stl", name: "B.stl", rev: "B", sha256: "new" },
        { id: "cad", name: "B.sldprt", rev: "B" },
      ],
    };
  assert.deepEqual(
    compareVersions(a, b).map((x) => x.status),
    ["Changed", "Added"],
  );
  assert.equal(a.files[0].sha256, "old");
});
test("manifest rejects wrong source and malformed records; preserves unresolved scope", () => {
  const data = {
    schema: "printchill.assembly.v1",
    source: { file: "C:\\cad\\buitenlamp.SLDASM" },
    configuration: "Default",
    components: [
      {
        name: "light-panel-1",
        path: "C:\\cad\\92223061_light_panel_rev_B.SLDPRT",
        configuration: "Default",
        state: "Lightweight",
        depth: 0,
      },
    ],
    scope: "Active configuration, partial",
  };
  const result = validateAssemblyManifest(data, "buitenlamp.SLDASM");
  assert.equal(result.components.length, 1);
  assert.match(result.evidence, /not independently verified/);
  assert.match(result.scope, /partial/);
  assert.throws(() =>
    validateAssemblyManifest(data, "WCD_cover_zolder.SLDASM"),
  );
  assert.throws(() =>
    validateAssemblyManifest(
      { ...data, components: [{ depth: 200 }] },
      "buitenlamp.SLDASM",
    ),
  );
});

test("simulated 3MF/assembly changes invalidate file-scoped metadata and preserve the old source", () => {
  const p = makePart({ id: "test", name: "test", stem: "test" });
  const file = p.versions[0].files.find((f) => f.kind === "3MF");
  file.details = { plateCount: 2 };
  file.components = [{ name: "Old component" }];
  file.platePreviews = [{ plate: "1", asset: "old.png" }];
  const next = registerChange(p, [
    { id: "project", comment: "Simulate without supplying a new project." },
  ]);
  const changed = next.files.find((f) => f.kind === "3MF");
  assert.equal(changed.details, null);
  assert.equal(changed.components, null);
  assert.deepEqual(changed.platePreviews, []);
  assert.equal(
    p.versions[0].files.find((f) => f.kind === "3MF").components.length,
    1,
  );
});
