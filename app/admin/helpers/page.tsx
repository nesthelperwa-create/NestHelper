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
          { key: "services", label: "Services" },
          { key: "availability", label: "Availability" },
          { key: "applicationDocumentCount", label: "Docs" },
        ]}
        statuses={["New", "Reviewing", "Needs Documents", "Phone Screen", "References", "Background Check", "Approved", "Backup List", "Rejected", "Archived", "On Hold"]}
      />
    </AdminShell>
  );
}
