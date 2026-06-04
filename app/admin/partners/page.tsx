"use client";

import AdminShell from "@/components/admin/AdminShell";
import AdminTable from "@/components/admin/AdminTable";

export default function AdminPartnersPage() {
  return (
    <AdminShell>
      <AdminTable
        collectionName="partnerApplications"
        title="Partner / Contractor Applications"
        columns={[
          { key: "businessName", label: "Business" },
          { key: "ownerName", label: "Contact" },
          { key: "phone", label: "Phone" },
          { key: "serviceType", label: "Services" },
          { key: "insuranceStatus", label: "Insurance" },
          { key: "applicationDocumentCount", label: "Docs" },
        ]}
        statuses={["New", "Reviewing", "Needs Documents", "Phone Screen", "References", "Background Check", "Approved", "Approved Partner", "Backup List", "Rejected", "Archived", "On Hold"]}
      />
    </AdminShell>
  );
}
