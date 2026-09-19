import React from "react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const s = (status || "").toUpperCase();

  let styles = "bg-slate-100 text-slate-700 border-slate-200";

  // Clinical Safety & Severity
  if (s.includes("CRITICAL") || s.includes("SERIOUS") || s.includes("HIGH") || s.includes("REJECTED")) {
    styles = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (s.includes("MEDIUM") || s.includes("CAUTION") || s.includes("CONSTRAINED") || s.includes("UNDER_REVIEW")) {
    styles = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (s.includes("NORMAL") || s.includes("APPROVED") || s.includes("CLOSED") || s.includes("COMPLETED") || s.includes("ACTIVE")) {
    styles = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (s.includes("PENDING") || s.includes("WAITING") || s.includes("OPEN")) {
    styles = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (s.includes("DATA_INTEGRITY") || s.includes("UNTRUSTED") || s.includes("DEVIATION")) {
    styles = "bg-purple-50 text-purple-700 border-purple-200";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border uppercase tracking-wider ${styles} ${className}`}
    >
      {status}
    </span>
  );
};
