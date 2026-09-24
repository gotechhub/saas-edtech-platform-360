/** EP01 limited SCORM 1.2 proof. Not a conformance-certified or production runtime. */
export type Snapshot = Record<string, string>;
const defaults: Snapshot = {
  "cmi.core.student_id": "demo-learner",
  "cmi.core.student_name": "Demo Learner",
  "cmi.core.lesson_status": "not attempted",
  "cmi.core.lesson_location": "",
  "cmi.core.score.raw": "",
  "cmi.core.score.min": "0",
  "cmi.core.score.max": "100",
  "cmi.core.entry": "ab-initio",
  "cmi.core.exit": "",
  "cmi.core.session_time": "0000:00:00.00",
  "cmi.suspend_data": "",
  "cmi.core.total_time": "0000:00:00.00",
  "cmi.core.lesson_mode": "normal",
  "cmi.interactions._count": "0",
};
const readonly = new Set([
  "cmi.core.student_id",
  "cmi.core.student_name",
  "cmi.core.entry",
  "cmi.core.total_time",
  "cmi.core.lesson_mode",
  "cmi.interactions._count",
]);
const errors: Record<string, string> = {
  "0": "No error",
  "101": "General exception",
  "201": "Invalid argument error",
  "301": "Not initialized",
  "401": "Not implemented error",
  "403": "Element is read only",
  "404": "Element is write only",
  "405": "Incorrect data type",
};
export function createScorm12(
  initial: Snapshot = {},
  queueSnapshot: (snapshot: Snapshot) => void = () => {},
) {
  const data: Snapshot = { ...defaults, ...initial };
  let restoredCount = 0;
  while (
    restoredCount < 100 &&
    Object.hasOwn(data, `cmi.interactions.${restoredCount}.id`)
  )
    restoredCount++;
  data["cmi.interactions._count"] = String(restoredCount);
  let initialized = false,
    finished = false,
    error = "0";
  const fail = (code: string) => {
    error = code;
    return "false";
  };
  const ready = () => initialized && !finished;
  const persist = () => {
    try {
      queueSnapshot({ ...data });
      error = "0";
      return "true";
    } catch {
      return fail("101");
    }
  };
  return {
    LMSInitialize(value: string) {
      if (value !== "" || initialized || finished) return fail("101");
      initialized = true;
      error = "0";
      return "true";
    },
    LMSGetValue(key: string) {
      if (!ready()) {
        fail("301");
        return "";
      }
      if (/^cmi\.interactions\.\d+\./.test(key)) {
        fail("404");
        return "";
      }
      if (!Object.hasOwn(data, key)) {
        fail("401");
        return "";
      }
      error = "0";
      return data[key];
    },
    LMSSetValue(key: string, value: string) {
      if (!ready()) return fail("301");
      const interaction = key.match(
        /^cmi\.interactions\.(0|[1-9]\d?)\.(id|type|student_response|result|correct_responses\.0\.pattern)$/,
      );
      if (interaction) {
        const index = Number(interaction[1]),
          field = interaction[2],
          count = Number(data["cmi.interactions._count"]);
        if (typeof value !== "string" || value.length > 255 || !value)
          return fail("405");
        if (index > count || (index === count && field !== "id"))
          return fail("201");
        if (field === "type" && value !== "choice") return fail("405");
        if (
          field === "result" &&
          !["correct", "wrong", "unanticipated", "neutral"].includes(value)
        )
          return fail("405");
        if (
          (field === "student_response" ||
            field === "correct_responses.0.pattern") &&
          !/^[a-z0-9](,[a-z0-9])*$/.test(value)
        )
          return fail("405");
        if (
          field === "id" &&
          Object.entries(data).some(
            ([k, v]) =>
              /^cmi\.interactions\.\d+\.id$/.test(k) &&
              k !== key &&
              v === value,
          )
        )
          return fail("405");
        data[key] = value;
        if (index === count)
          data["cmi.interactions._count"] = String(count + 1);
        error = "0";
        return "true";
      }
      if (!Object.hasOwn(defaults, key)) return fail("401");
      if (readonly.has(key)) return fail("403");
      if (typeof value !== "string") return fail("405");
      if (
        key === "cmi.core.lesson_status" &&
        ![
          "passed",
          "completed",
          "failed",
          "incomplete",
          "browsed",
          "not attempted",
        ].includes(value)
      )
        return fail("405");
      if (
        key.startsWith("cmi.core.score.") &&
        (value.trim() === "" ||
          !Number.isFinite(Number(value)) ||
          Number(value) < 0 ||
          Number(value) > 100)
      )
        return fail("405");
      if (
        key === "cmi.core.exit" &&
        !["", "time-out", "suspend", "logout"].includes(value)
      )
        return fail("405");
      if (
        key === "cmi.core.session_time" &&
        !/^\d{2,4}:[0-5]\d:[0-5]\d(?:\.\d{1,2})?$/.test(value)
      )
        return fail("405");
      if (
        (key === "cmi.suspend_data" && value.length > 4096) ||
        (key === "cmi.core.lesson_location" && value.length > 255)
      )
        return fail("405");
      data[key] = value;
      error = "0";
      return "true";
    },
    // Success acknowledges local queue acceptance, never a remote durable save.
    LMSCommit(value: string) {
      if (!ready()) return fail("301");
      if (value !== "") return fail("201");
      return persist();
    },
    LMSFinish(value: string) {
      if (!ready()) return fail("301");
      if (value !== "") return fail("201");
      if (persist() === "false") return "false";
      finished = true;
      return "true";
    },
    LMSGetLastError() {
      return error;
    },
    LMSGetErrorString(code: string) {
      return Object.hasOwn(errors, code) ? errors[code] : "Unknown error";
    },
    LMSGetDiagnostic(code: string) {
      return Object.hasOwn(errors, code || error)
        ? errors[code || error]
        : "Unknown error";
    },
  };
}

export function writableSnapshot(snapshot: Snapshot): Snapshot {
  return Object.fromEntries(
    Object.entries(snapshot).filter(
      ([key, value]) =>
        !readonly.has(key) && !(key === "cmi.core.score.raw" && value === ""),
    ),
  );
}

export type BridgeBinding = {
  origin: string;
  source: unknown;
  nonce: string;
  lastSequence: number;
};
export type RuntimeMessage = {
  type: "respongo.scorm.snapshot";
  nonce: string;
  sequence: number;
  values: Snapshot;
};
/** Source and exact origin are mandatory; caller must also validate/reconcile server session. */
export function validateRuntimeMessage(
  event: { origin: string; source: unknown; data: unknown },
  binding: BridgeBinding,
): RuntimeMessage | null {
  if (
    binding.origin === "*" ||
    binding.origin === "null" ||
    !binding.source ||
    event.origin !== binding.origin ||
    event.source !== binding.source
  )
    return null;
  if (!event.data || typeof event.data !== "object") return null;
  const m = event.data as RuntimeMessage;
  if (
    m.type !== "respongo.scorm.snapshot" ||
    m.nonce !== binding.nonce ||
    !binding.nonce ||
    !Number.isSafeInteger(m.sequence) ||
    m.sequence !== binding.lastSequence + 1
  )
    return null;
  if (!m.values || typeof m.values !== "object" || Array.isArray(m.values))
    return null;
  if (Object.keys(m.values).length > 512) return null;
  if (
    Object.keys(m).some(
      (k) => !["type", "nonce", "sequence", "values"].includes(k),
    )
  )
    return null;
  if (
    Object.entries(m.values).some(
      ([k, v]) =>
        (!Object.hasOwn(defaults, k) &&
          !/^cmi\.interactions\.(0|[1-9]\d?)\.(id|type|student_response|result|correct_responses\.0\.pattern)$/.test(
            k,
          )) ||
        readonly.has(k) ||
        typeof v !== "string" ||
        v.length > 4096,
    )
  )
    return null;
  const api = createScorm12();
  api.LMSInitialize("");
  const ordered = Object.entries(m.values).sort(([a], [b]) =>
    a.localeCompare(b, "en", { numeric: true }),
  );
  // CMI interactions must create each id before its dependent fields.
  for (const [key, value] of ordered.filter(([k]) =>
    /^cmi\.interactions\.\d+\.id$/.test(k),
  ))
    if (api.LMSSetValue(key, value) !== "true") return null;
  for (const [key, value] of ordered.filter(
    ([k]) => !/^cmi\.interactions\.\d+\.id$/.test(k),
  ))
    if (api.LMSSetValue(key, value) !== "true") return null;
  if (JSON.stringify(m).length > 32000) return null;
  return { ...m, values: { ...m.values } };
}

/** Pre-extraction metadata checks; does not replace streaming limits or malware scanning. */
export function validateArchiveEntries(
  entries: {
    path: string;
    size: number;
    compressedSize: number;
    symlink?: boolean;
  }[],
) {
  if (!entries.length || entries.length > 5000)
    throw new Error("Paket dosya sayısı sınırı");
  let total = 0;
  const paths = new Set<string>();
  for (const entry of entries) {
    const p = entry.path.replace(/\\/g, "/");
    if (
      !p ||
      p.startsWith("/") ||
      /^[a-z]:/i.test(p) ||
      p.split("/").some((x) => x === ".." || x === "." || !x) ||
      /[\x00-\x1f:]/.test(p) ||
      entry.symlink
    )
      throw new Error("Güvensiz paket yolu");
    const canonical = p.normalize("NFC").toLocaleLowerCase("en-US");
    if (paths.has(canonical)) throw new Error("Çakışan paket yolu");
    paths.add(canonical);
    if (
      !Number.isSafeInteger(entry.size) ||
      entry.size < 0 ||
      !Number.isSafeInteger(entry.compressedSize) ||
      entry.compressedSize < 0 ||
      entry.size > 100 * 1024 * 1024 ||
      entry.size / Math.max(1, entry.compressedSize) > 100
    )
      throw new Error("Paket boyut sınırı");
    total += entry.size;
    if (total > 500 * 1024 * 1024) throw new Error("Toplam paket boyut sınırı");
  }
  return true;
}
