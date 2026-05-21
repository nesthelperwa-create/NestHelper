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
          { key: "transportation", label: "Transport" },
          { key: "experience", label: "Experience" },
        ]}
        statuses={["New", "Reviewing", "Interview", "Background Check Needed", "Approved", "Rejected", "On Hold"]}
      />
    </AdminShell>
  );
}



