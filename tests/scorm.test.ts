import { describe, it, expect } from "vitest";
import {
  createScorm12,
  validateRuntimeMessage,
  validateArchiveEntries,
} from "../packages/learning-core/src/scorm";
describe("SCORM 1.2 limited proof", () => {
  it("requires initialize, preserves resume and commits a copy before finish", () => {
    const writes: Record<string, string>[] = [];
    const api = createScorm12({ "cmi.suspend_data": "bookmark" }, (s) =>
      writes.push(s),
    );
    expect(api.LMSSetValue("cmi.core.lesson_status", "completed")).toBe(
      "false",
    );
    expect(api.LMSGetLastError()).toBe("301");
    expect(api.LMSInitialize("")).toBe("true");
    expect(api.LMSGetValue("cmi.suspend_data")).toBe("bookmark");
    expect(api.LMSSetValue("cmi.core.score.raw", "80")).toBe("true");
    expect(api.LMSCommit("")).toBe("true");
    api.LMSSetValue("cmi.core.score.raw", "90");
    expect(writes[0]["cmi.core.score.raw"]).toBe("80");
    expect(api.LMSFinish("")).toBe("true");
    expect(api.LMSSetValue("cmi.core.lesson_status", "passed")).toBe("false");
  });
  it("does not claim a commit when queueing fails", () => {
    const api = createScorm12({}, () => {
      throw new Error("full");
    });
    api.LMSInitialize("");
    expect(api.LMSFinish("")).toBe("false");
    expect(api.LMSGetLastError()).toBe("101");
    expect(api.LMSSetValue("cmi.core.lesson_location", "retry")).toBe("true");
  });
  it("rejects unsupported, readonly and malformed CMI", () => {
    const api = createScorm12();
    api.LMSInitialize("");
    for (const [k, v] of [
      ["cmi.core.student_id", "attacker"],
      ["cmi.core.score.raw", "Infinity"],
      ["cmi.core.session_time", "99:99:99"],
      ["cmi.suspend_data", "a".repeat(4097)],
      ["cmi.core.lesson_status", "certified"],
      ["cmi.objectives.0.id", "q1"],
    ])
      expect(api.LMSSetValue(k, v)).toBe("false");
  });
});
describe("package boundary", () => {
  it("does not accept prototype fields as CMI properties", () => {
    const api = createScorm12();
    api.LMSInitialize("");
    expect(api.LMSSetValue("__proto__", "x")).toBe("false");
    expect(api.LMSSetValue("constructor", "x")).toBe("false");
    expect(api.LMSGetValue("toString")).toBe("");
  });
  const source = {},
    binding = {
      source,
      origin: "https://package-1.content.example",
      nonce: "nonce-1",
      lastSequence: 4,
    };
  const data = {
    type: "respongo.scorm.snapshot",
    nonce: "nonce-1",
    sequence: 5,
    values: { "cmi.core.lesson_status": "completed" },
  };
  it("accepts only the bound frame origin and next sequence", () => {
    expect(
      validateRuntimeMessage({ source, origin: binding.origin, data }, binding),
    ).toEqual(data);
    for (const event of [
      { source: {}, origin: binding.origin, data },
      { source, origin: "https://attacker.example", data },
      { source, origin: binding.origin, data: { ...data, nonce: "bad" } },
      { source, origin: binding.origin, data: { ...data, sequence: 4 } },
      {
        source,
        origin: binding.origin,
        data: { ...data, values: { tenant_id: "other" } },
      },
    ])
      expect(validateRuntimeMessage(event, binding)).toBeNull();
  });
  it("rejects traversal, absolute paths, case collisions, symlinks and zip bombs", () => {
    const entry = { path: "index.html", size: 1000, compressedSize: 500 };
    expect(validateArchiveEntries([entry])).toBe(true);
    for (const path of [
      "../secret",
      "/etc/passwd",
      "C:\\x",
      "a/../../x",
      "a\u0000b",
      "a:stream",
    ])
      expect(() => validateArchiveEntries([{ ...entry, path }])).toThrow();
    expect(() =>
      validateArchiveEntries([entry, { ...entry, path: "INDEX.HTML" }]),
    ).toThrow();
    expect(() =>
      validateArchiveEntries([{ ...entry, symlink: true }]),
    ).toThrow();
    expect(() =>
      validateArchiveEntries([{ ...entry, size: 1000000, compressedSize: 1 }]),
    ).toThrow();
  });
});
