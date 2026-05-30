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
          { key: "fullName", label: "Name" },
          { key: "service", label: "Service" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "city", label: "City" },
          { key: "preferredDate", label: "Preferred Date" },
          { key: "promoCode", label: "Promo" },
        ]}
        statuses={["New", "Reviewed", "Quoted", "Quote Sent", "Quote Approved", "Approved", "Checkout Sent", "Deposit Paid", "Final Balance Sent", "Paid", "Fully Paid", "Additional Payment Sent", "Additional Paid", "Scheduled", "Completed", "Declined", "Needs Info", "Follow-Up Needed", "Canceled"]}
        enablePaymentActions
      />
    </AdminShell>
  );
}



