import { describe, it, expect } from "vitest";
import { zipSync, strToU8, unzipSync, strFromU8 } from "fflate";
import {
  createScormFiles,
  exportScorm12,
  sampleCourse,
  validateAuthorCourse,
} from "../packages/learning-core/src/authoring";
import {
  inspectScormZip,
  inspectManifest,
} from "../packages/learning-core/src/archive";
import {
  createScorm12,
  validateRuntimeMessage,
  writableSnapshot,
  type Snapshot,
} from "../packages/learning-core/src/scorm";
const pack = (files: Record<string, string>) =>
  Buffer.from(
    zipSync(
      Object.fromEntries(
        Object.entries(files).map(([k, v]) => [k, strToU8(v)]),
      ),
    ),
  );
describe("bounded authoring and package proof", () => {
  it("rejects a corrupted CRC instead of accepting damaged package content", async () => {
    const bytes = Buffer.from(exportScorm12(sampleCourse));
    for (let i = 0; i < bytes.length - 20; i++)
      if (bytes.readUInt32LE(i) === 0x02014b50) {
        bytes.writeUInt32LE((bytes.readUInt32LE(i + 16) ^ 1) >>> 0, i + 16);
        break;
      }
    await expect(inspectScormZip(bytes)).rejects.toThrow(/CRC/);
  });
  it("exports a self-contained package that passes structural inspection", async () => {
    const bytes = Buffer.from(exportScorm12(sampleCourse)),
      result = await inspectScormZip(bytes);
    expect(result.profile).toBe("scorm12_single_v1");
    expect(result.title).toBe(sampleCourse.title);
    expect(result.launchPath).toBe("index.html");
    expect(result.files.size).toBe(4);
    expect(result.scanStatus).toBe("not_scanned");
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it("keeps author strings inert in HTML, XML and JavaScript", async () => {
    const title = 'Vaka <script>alert("x")</script> & hukuk';
    const course = { ...sampleCourse, title };
    const files = createScormFiles(course);
    expect(files["index.html"]).not.toContain("<script>alert");
    expect(files["course.js"]).not.toContain("</script>");
    expect(
      (await inspectScormZip(Buffer.from(exportScorm12(course)))).title,
    ).toBe(title);
    expect(() => new Function(files["course.js"])).not.toThrow();
  });
  it("rejects incomplete sections and invalid answers", () => {
    expect(() =>
      validateAuthorCourse({ ...sampleCourse, answer: 99 }),
    ).toThrow();
    expect(() =>
      validateAuthorCourse({ ...sampleCourse, sections: [] }),
    ).toThrow();
    expect(() =>
      validateAuthorCourse({ ...sampleCourse, choices: ["same", "same"] }),
    ).toThrow();
  });
  it("rejects traversal, case collisions and unsupported file types from actual ZIP bytes", async () => {
    const files = createScormFiles(sampleCourse);
    for (const name of ["../escape.js", "INDEX.HTML", "payload.exe"])
      await expect(
        inspectScormZip(pack({ ...files, [name]: "x" })),
      ).rejects.toThrow();
  });
  it("rejects symlink entries using UNIX file attributes", async () => {
    const bytes = Buffer.from(
      zipSync({ "link.js": [strToU8("target"), { os: 3, attrs: 0xa1ff0000 }] }),
    );
    await expect(inspectScormZip(bytes)).rejects.toThrow();
  });
  it("rejects encrypted flags and malformed ZIP bodies", async () => {
    const bytes = Buffer.from(exportScorm12(sampleCourse));
    for (let i = 0; i < bytes.length - 10; i++)
      if (bytes.readUInt32LE(i) === 0x02014b50) {
        bytes.writeUInt16LE(bytes.readUInt16LE(i + 8) | 1, i + 8);
        break;
      }
    await expect(inspectScormZip(bytes)).rejects.toThrow();
    await expect(
      inspectScormZip(Buffer.from("invalid ZIP content more than 22 bytes")),
    ).rejects.toThrow();
  });
  it("rejects DTD, remote launch URLs, missing files, multi-SCO and wrong versions", async () => {
    const files = createScormFiles(sampleCourse),
      manifest = files["imsmanifest.xml"];
    const variants = [
      manifest.replace(
        "<manifest",
        '<!DOCTYPE manifest [<!ENTITY x SYSTEM "file:///etc/passwd">]><manifest',
      ),
      manifest.replace(
        'href="index.html"',
        'href="https://attacker.example/index.html"',
      ),
      manifest.replace('href="index.html"', 'href="missing.html"'),
      manifest.replace("<schemaversion>1.2", "<schemaversion>2004"),
      manifest.replace(
        "</resources>",
        '<resource identifier="sco2" type="webcontent" adlcp:scormtype="sco" href="index.html"/></resources>',
      ),
    ];
    for (const altered of variants)
      await expect(
        inspectScormZip(pack({ ...files, "imsmanifest.xml": altered })),
      ).rejects.toThrow();
  });
  it("accepts directory entries but rejects suspicious expanded size and zip bombs", async () => {
    const files = createScormFiles(sampleCourse);
    expect(
      (await inspectScormZip(pack({ ...files, "assets/": "" }))).files.size,
    ).toBe(4);
    await expect(
      inspectScormZip(pack({ ...files, "bomb.txt": "a".repeat(1024 * 1024) })),
    ).rejects.toThrow();
  });
  it("records quiz interaction values through the same validated bridge as the player", () => {
    let saved: Snapshot = {};
    const api = createScorm12({}, (s) => (saved = s));
    api.LMSInitialize("");
    expect(api.LMSSetValue("cmi.interactions.1.id", "q2")).toBe("false");
    for (const [k, v] of Object.entries({
      "cmi.interactions.0.id": "q1",
      "cmi.interactions.0.type": "choice",
      "cmi.interactions.0.student_response": "b",
      "cmi.interactions.0.result": "correct",
      "cmi.core.score.raw": "100",
    }))
      expect(api.LMSSetValue(k, v)).toBe("true");
    expect(api.LMSGetValue("cmi.interactions._count")).toBe("1");
    expect(api.LMSGetValue("cmi.interactions.0.student_response")).toBe("");
    expect(api.LMSGetLastError()).toBe("404");
    api.LMSCommit("");
    const source = {},
      origin = "http://localhost:3101",
      message = {
        type: "respongo.scorm.snapshot",
        nonce: "test",
        sequence: 1,
        values: writableSnapshot(saved),
      };
    expect(
      validateRuntimeMessage(
        { source, origin, data: message },
        { source, origin, nonce: "test", lastSequence: 0 },
      )?.values["cmi.interactions.0.result"],
    ).toBe("correct");
  });
});
