import { exportScorm12 } from "@respongo/learning-core/authoring";
import { proofRequest, readBounded } from "@/lib/proof-gate";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!proofRequest(request))
    return Response.json({ error: "NOT_AVAILABLE" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "JSON_REQUIRED" }, { status: 415 });
  try {
    const course = JSON.parse(
      (await readBounded(request, 128 * 1024)).toString("utf8"),
    );
    const zip = exportScorm12(course);
    return new Response(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="oguz-law-demo-scorm12.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Paket oluşturulamadı";
    return Response.json(
      { error: message },
      { status: message === "BODY_LIMIT" ? 413 : 422 },
    );
  }
}
