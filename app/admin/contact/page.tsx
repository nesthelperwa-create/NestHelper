"use client";

import AdminShell from "@/components/admin/AdminShell";
import AdminTable from "@/components/admin/AdminTable";

export default function AdminContactPage() {
  return (
    <AdminShell>
      <AdminTable
        collectionName="contactMessages"
        title="Contact Messages"
        columns={[
          { key: "name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "subject", label: "Subject" },
          { key: "message", label: "Message" },
        ]}
        statuses={["New", "Reviewed", "Replied", "Closed", "Follow-Up Needed"]}
      />
    </AdminShell>
  );
}
