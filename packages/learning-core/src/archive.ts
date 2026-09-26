import { fromBuffer, type Entry, type ZipFile } from "yauzl";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { createHash } from "node:crypto";
import { crc32 } from "node:zlib";
import { validateArchiveEntries } from "./scorm.ts";

const limits = {
  compressed: 20 * 1024 * 1024,
  total: 50 * 1024 * 1024,
  file: 10 * 1024 * 1024,
  count: 1000,
  manifest: 256 * 1024,
};
export type InspectedPackage = {
  profile: "scorm12_single_v1" | "scorm2004_single_v1";
  title: string;
  launchPath: string;
  sha256: string;
  files: Map<string, Buffer>;
  scanStatus: "not_scanned";
};
function localPath(value: unknown): string {
  if (typeof value !== "string" || !value || /[?#%\\:]/.test(value))
    throw new Error("Paket içi yerel dosya yolu gerekli.");
  validateArchiveEntries([{ path: value, size: 0, compressedSize: 0 }]);
  return value;
}
const array = (value: any): any[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];
export function inspectManifest(
  xml: string,
  files: Set<string>,
): { title: string; launchPath: string; profile: InspectedPackage["profile"] } {
  if (
    Buffer.byteLength(xml) > limits.manifest ||
    /<!DOCTYPE|<!ENTITY/i.test(xml)
  )
    throw new Error(
      "Manifest boyutu veya DTD/ENTITY bildirimi desteklenmiyor.",
    );
  if (XMLValidator.validate(xml) !== true)
    throw new Error("Manifest XML geçersiz.");
  const doc = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@",
    removeNSPrefix: true,
    processEntities: true,
    parseTagValue: false,
  }).parse(xml);
  const m = doc.manifest;
  if (!m || m.manifest) throw new Error("Tek bir kök manifest gerekli.");
  const schema =
    typeof m.metadata?.schema === "string" ? m.metadata.schema.trim() : "";
  const schemaVersion =
    typeof m.metadata?.schemaversion === "string"
      ? m.metadata.schemaversion.trim()
      : "";
  const profile: InspectedPackage["profile"] =
    schema === "ADL SCORM" && schemaVersion === "1.2"
      ? "scorm12_single_v1"
      : schema === "ADL SCORM" &&
          /^(?:2004(?:\s+(?:2nd|3rd|4th)\s+Edition)?|CAM\s+1\.3)$/i.test(
            schemaVersion,
          )
        ? "scorm2004_single_v1"
        : (() => {
            throw new Error(
              "Yalnızca SCORM 1.2 veya SCORM 2004 tek-SCO paketi destekleniyor.",
            );
          })();
  const organizations = array(m.organizations?.organization);
  if (organizations.length !== 1) throw new Error("Tek organizasyon gerekli.");
  const org = organizations[0],
    items = array(org.item);
  if (items.length !== 1 || items[0].item)
    throw new Error("Tek öğrenme nesnesi gerekli.");
  const resources = array(m.resources?.resource);
  if (
    resources.length !== 1 ||
    (resources[0]["@scormtype"] ?? resources[0]["@scormType"]) !== "sco" ||
    resources[0]["@type"] !== "webcontent" ||
    resources[0].dependency
  )
    throw new Error(
      "Bu önizleme yalnızca tek SCO ve bağımlılıksız paket kabul eder.",
    );
  const resource = resources[0];
  if (
    items[0]["@identifierref"] !== resource["@identifier"] ||
    m.organizations?.["@default"] !== org["@identifier"]
  )
    throw new Error("Manifest kaynak bağlantısı geçersiz.");
  const launchPath = localPath(resource["@href"]);
  if (!/\.html?$/i.test(launchPath) || !files.has(launchPath))
    throw new Error("Başlatma HTML dosyası bulunamadı.");
  if (
    resource["@base"] ||
    org["@base"] ||
    m["@base"] ||
    items[0]["@parameters"]
  )
    throw new Error(
      "Harici taban veya launch parametresi bu profilde desteklenmiyor.",
    );
  for (const file of array(resource.file)) {
    if (!files.has(localPath(file["@href"])))
      throw new Error("Manifestteki dosya bulunamadı.");
  }
  const title = typeof org.title === "string" ? org.title : "SCORM eğitimi";
  if (title.length > 500) throw new Error("Manifest başlığı çok uzun.");
  return { title, launchPath, profile };
}

/** Bounded in-memory quarantine inspection. Never writes package paths to disk or publishes a package. */
export async function inspectScormZip(
  bytes: Buffer,
): Promise<InspectedPackage> {
  if (bytes.length > limits.compressed || bytes.length < 22)
    throw new Error("ZIP dosyası boyut sınırını aşıyor veya geçersiz.");
  const zip = await new Promise<ZipFile>((resolve, reject) =>
    fromBuffer(
      bytes,
      { lazyEntries: true, validateEntrySizes: true, strictFileNames: true },
      (err, file) => (err ? reject(err) : resolve(file!)),
    ),
  );
  const files = new Map<string, Buffer>();
  let total = 0,
    count = 0;
  const seen = new Set<string>();
  try {
    await new Promise<void>((resolve, reject) => {
      let done = false;
      const fail = (err: unknown) => {
        if (!done) {
          done = true;
          zip.close();
          reject(err);
        }
      };
      zip.on("error", fail);
      zip.on("end", () => {
        if (!done) {
          done = true;
          resolve();
        }
      });
      zip.on("entry", (entry: Entry) => {
        void (async () => {
          if (++count > limits.count)
            throw new Error("ZIP dosya sayısı sınırı aşıldı.");
          const mode = (entry.externalFileAttributes >>> 16) & 0xf000;
          if (entry.generalPurposeBitFlag & 1 || mode === 0xa000)
            throw new Error(
              "Şifreli dosya veya sembolik bağlantı desteklenmiyor.",
            );
          const directory = entry.fileName.endsWith("/"),
            name = directory ? entry.fileName.slice(0, -1) : entry.fileName;
          localPath(name);
          const canonical = name.normalize("NFC").toLowerCase();
          if (seen.has(canonical)) throw new Error("Çakışan ZIP dosya yolu.");
          seen.add(canonical);
          if (directory) {
            if (entry.uncompressedSize !== 0)
              throw new Error("Geçersiz klasör kaydı.");
            zip.readEntry();
            return;
          }
          validateArchiveEntries([
            {
              path: name,
              size: entry.uncompressedSize,
              compressedSize: entry.compressedSize,
            },
          ]);
          if (
            entry.uncompressedSize > limits.file ||
            total + entry.uncompressedSize > limits.total
          )
            throw new Error("Açılmış paket boyut sınırı aşıldı.");
          // No nested archives, executables or SVG. Standard SCORM schemas, fonts and MP4 assets are data-only.
          if (
            !/\.(html?|css|js|json|xml|xsd|dtd|txt|png|jpe?g|webp|gif|woff2?|mp4)$/i.test(
              name,
            )
          )
            throw new Error("Bu paket profilinde dosya türü desteklenmiyor.");
          if (
            name === "imsmanifest.xml" &&
            entry.uncompressedSize > limits.manifest
          )
            throw new Error("Manifest boyut sınırı aşıldı.");
          const stream = await new Promise<import("node:stream").Readable>(
            (resolve, reject) =>
              zip.openReadStream(entry, (err, s) =>
                err ? reject(err) : resolve(s!),
              ),
          );
          let size = 0;
          const chunks: Buffer[] = [];
          for await (const chunk of stream) {
            const data = Buffer.from(chunk);
            size += data.length;
            total += data.length;
            if (
              size > limits.file ||
              size > entry.uncompressedSize ||
              total > limits.total
            ) {
              stream.destroy();
              throw new Error("Gerçek açılmış dosya boyutu sınırı aşıldı.");
            }
            chunks.push(data);
          }
          if (size !== entry.uncompressedSize)
            throw new Error("ZIP dosya boyutu uyuşmuyor.");
          const data = Buffer.concat(chunks, size);
          if (crc32(data) !== entry.crc32)
            throw new Error("ZIP CRC doğrulaması başarısız.");
          files.set(name, data);
          zip.readEntry();
        })().catch(fail);
      });
      zip.readEntry();
    });
    const manifest = files.get("imsmanifest.xml");
    if (!manifest) throw new Error("Kök dizinde imsmanifest.xml bulunamadı.");
    const projection = inspectManifest(
      manifest.toString("utf8"),
      new Set(files.keys()),
    );
    return {
      ...projection,
      profile: projection.profile,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      files,
      scanStatus: "not_scanned",
    };
  } finally {
    zip.close();
  }
}
