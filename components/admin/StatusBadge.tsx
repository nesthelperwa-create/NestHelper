export default function StatusBadge({ status = "New" }: { status?: string }) {
  const styles: Record<string, string> = {
    New: "bg-amber-100 text-amber-800 border-amber-200",
    Reviewed: "bg-sky-100 text-sky-800 border-sky-200",
    Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Checkout Sent": "bg-indigo-100 text-indigo-800 border-indigo-200",
    Paid: "bg-green-100 text-green-800 border-green-200",
    Scheduled: "bg-teal-100 text-teal-800 border-teal-200",
    Completed: "bg-slate-100 text-slate-800 border-slate-200",
    Declined: "bg-rose-100 text-rose-800 border-rose-200",
  };

  return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${styles[status] || styles.New}`}>{status}</span>;
}
