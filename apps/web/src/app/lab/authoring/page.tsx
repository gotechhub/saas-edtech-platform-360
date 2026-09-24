import { notFound } from "next/navigation";
import { localProofPage } from "@/lib/proof-gate";
import { AuthoringStudio } from "@/components/authoring-studio";
export const dynamic = "force-dynamic";
export default async function AuthoringPage() {
  if (!(await localProofPage())) notFound();
  return <AuthoringStudio />;
}
