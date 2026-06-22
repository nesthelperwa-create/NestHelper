import AdminShell from "@/components/admin/AdminShell";
import SmartLabelPrintSheet from "./PrintSheetClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SmartLabelPrintPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;

  return (
    <AdminShell>
      <SmartLabelPrintSheet batchId={batchId} />
    </AdminShell>
  );
}
