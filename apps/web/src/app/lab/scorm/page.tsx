import { notFound } from "next/navigation";
import { localProofPage } from "@/lib/proof-gate";
import { ScormProof } from "@/components/scorm-proof";
export const dynamic = "force-dynamic";
export default async function ScormPage() {
  if (!(await localProofPage())) notFound();
  return <ScormProof />;
}
