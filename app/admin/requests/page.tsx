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
          { key: "incomingReferralCode", label: "Referral" },
        ]}
        statuses={["New", "Reviewed", "Quote Drafted", "Quote Sent", "Quote Approved", "Approved", "Checkout Sent", "Deposit Checkout Sent", "Deposit Paid", "Deposit Paid - Final Pending", "Final Invoice Created", "Final Invoice Sent", "Final Auto-Charge Processing", "Final Auto-Charge Failed", "Final Balance Paid", "Paid", "Fully Paid", "Additional Payment Sent", "Additional Paid", "Scheduled", "Completed", "Declined", "Needs Info", "Follow-Up Needed", "Canceled"]}
        enablePaymentActions
      />
    </AdminShell>
  );
}



