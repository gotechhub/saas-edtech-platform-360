import { inspectScormZip } from "@respongo/learning-core/archive";
import { proofRequest, readBounded } from "@/lib/proof-gate";
export const runtime = "nodejs";
// CPU/memory guard for the local proof. A real import is a quarantined worker job, never this route.
let busy = false;
export async function POST(request: Request) {
  if (!proofRequest(request))
    return Response.json({ error: "NOT_AVAILABLE" }, { status: 403 });
  if (request.headers.get("content-type") !== "application/zip")
    return Response.json({ error: "ZIP_REQUIRED" }, { status: 415 });
  if (busy)
    return Response.json(
      { error: "Bir paket zaten inceleniyor. Yeniden deneyin." },
      { status: 429, headers: { "Retry-After": "3" } },
    );
  busy = true;
  try {
    const report = await inspectScormZip(
      await readBounded(request, 20 * 1024 * 1024),
    );
    return Response.json(
      {
        title: report.title,
        profile: report.profile,
        launchPath: report.launchPath,
        sha256: report.sha256,
        fileCount: report.files.size,
        scanStatus: report.scanStatus,
        published: false,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Paket doğrulanamadı";
    return Response.json(
      { error: message },
      { status: message === "BODY_LIMIT" ? 413 : 422 },
    );
  } finally {
    busy = false;
  }
}
