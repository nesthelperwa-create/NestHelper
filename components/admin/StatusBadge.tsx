const STATUS_STYLES: Record<string, string> = {
  New: "bg-amber-100 text-amber-800 border-amber-200",
  Reviewed: "bg-sky-100 text-sky-800 border-sky-200",
  Reviewing: "bg-sky-100 text-sky-800 border-sky-200",
  Quoted: "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Quote Sent": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Quote Approved": "bg-emerald-100 text-emerald-800 border-emerald-200",
  Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Approved Partner": "bg-emerald-100 text-emerald-800 border-emerald-200",
  Replied: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Checkout Sent": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Deposit Checkout Sent": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Deposit Paid": "bg-teal-100 text-teal-800 border-teal-200",
  "Deposit Paid - Final Pending": "bg-teal-100 text-teal-800 border-teal-200",
  "Final Balance Sent": "bg-purple-100 text-purple-800 border-purple-200",
  "Final Invoice Created": "bg-purple-100 text-purple-800 border-purple-200",
  "Final Invoice Sent": "bg-purple-100 text-purple-800 border-purple-200",
  "Final Auto-Charge Processing": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Final Auto-Charge Failed": "bg-red-100 text-red-800 border-red-200",
  "Final Balance Paid": "bg-green-100 text-green-800 border-green-200",
  "Additional Payment Sent": "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  "Additional Paid": "bg-green-100 text-green-800 border-green-200",
  Paid: "bg-green-100 text-green-800 border-green-200",
  "Fully Paid": "bg-green-100 text-green-800 border-green-200",
  Scheduled: "bg-teal-100 text-teal-800 border-teal-200",
  Interview: "bg-violet-100 text-violet-800 border-violet-200",
  "Background Check Needed": "bg-purple-100 text-purple-800 border-purple-200",
  "Need Documents": "bg-orange-100 text-orange-800 border-orange-200",
  "Needs Info": "bg-orange-100 text-orange-800 border-orange-200",
  "Follow-Up Needed": "bg-orange-100 text-orange-800 border-orange-200",
  "On Hold": "bg-yellow-100 text-yellow-800 border-yellow-200",
  Completed: "bg-slate-100 text-slate-800 border-slate-200",
  Closed: "bg-slate-100 text-slate-800 border-slate-200",
  Declined: "bg-rose-100 text-rose-800 border-rose-200",
  Rejected: "bg-rose-100 text-rose-800 border-rose-200",
  Canceled: "bg-rose-100 text-rose-800 border-rose-200",
  Cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

function getStatusStyle(status: string) {
  const cleanStatus = status.trim() || "New";
  const directMatch = STATUS_STYLES[cleanStatus];
  if (directMatch) return directMatch;

  const lowerStatus = cleanStatus.toLowerCase();
  const matchedKey = Object.keys(STATUS_STYLES).find((key) => key.toLowerCase() === lowerStatus);
  return matchedKey ? STATUS_STYLES[matchedKey] : STATUS_STYLES.New;
}

export default function StatusBadge({ status = "New" }: { status?: string }) {
  const cleanStatus = status?.trim() || "New";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(cleanStatus)}`}>
      {cleanStatus}
    </span>
  );
}
