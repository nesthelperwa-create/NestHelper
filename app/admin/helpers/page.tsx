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
          { key: "status", label: "Roster Status" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "city", label: "City" },
          { key: "availability", label: "Availability" },
          { key: "transportation", label: "Transport" },
          { key: "services", label: "Services" },
        ]}
        statuses={[
          "New",
          "Reviewing",
          "Phone Screen",
          "Needs Documents",
          "Background Check Needed",
          "Trial Job Approved",
          "Approved Helper",
          "Backup List",
          "Inactive",
          "Rejected",
          "Archived",
        ]}
      />
    </AdminShell>
  );
}
