"use client";

import AdminShell from "@/components/admin/AdminShell";
import AdminTable from "@/components/admin/AdminTable";

export default function AdminRequestsPage() {
  return (
    <AdminShell>
      <AdminTable
        collectionName="serviceRequests"
        title="Service Requests"
        columns={[
          { key: "name", label: "Name" },
          { key: "service", label: "Service" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "city", label: "City" },
          { key: "preferredDate", label: "Preferred Date" },
          { key: "promoCode", label: "Promo" },
        ]}
        statuses={["New", "Reviewed", "Approved", "Checkout Sent", "Paid", "Scheduled", "Completed", "Declined", "Follow-Up Needed"]}
      />
    </AdminShell>
  );
}



