"use client";

import AdminShell from "@/components/admin/AdminShell";
import AdminTable from "@/components/admin/AdminTable";

export default function AdminGivingBackPage() {
  return (
    <AdminShell>
      <AdminTable
        collectionName="contactMessages"
        title="Giving Back Messages"
        initialFilter="Giving Back"
        columns={[
          { key: "topic", label: "Topic" },
          { key: "name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "subject", label: "Subject" },
          { key: "message", label: "Message" },
        ]}
        statuses={["New", "Giving Back Lead", "Item Offered", "Organization Lead", "Pickup Needed", "Dropoff Needed", "Passed Along", "Reviewed", "Replied", "Closed", "Follow-Up Needed"]}
      />
    </AdminShell>
  );
}
