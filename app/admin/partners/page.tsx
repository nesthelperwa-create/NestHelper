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
          { key: "email", label: "Email" },
          { key: "serviceType", label: "Services" },
          { key: "serviceArea", label: "Service Area" },
          { key: "insuranceInfo", label: "Insurance" },
        ]}
        statuses={["New", "Reviewing", "Need Documents", "Approved Partner", "Rejected", "On Hold"]}
      />
    </AdminShell>
  );
}



