"use client";

import AdminShell from "@/components/admin/AdminShell";
import AdminTable from "@/components/admin/AdminTable";

export default function AdminHelpersPage() {
  return (
    <AdminShell>
      <AdminTable
        collectionName="helperApplications"
        title="Helper Applications"
        columns={[
          { key: "fullName", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "city", label: "City" },
          { key: "availability", label: "Availability" },
          { key: "services", label: "Services" },
          { key: "transportation", label: "Transport" },
          { key: "applicationDocumentCount", label: "Docs" },
        ]}
        statuses={["New", "Reviewing", "Needs Documents", "Phone Screen", "References", "Background Check", "Approved", "Backup List", "Rejected", "Archived", "On Hold"]}
      />
    </AdminShell>
  );
}
