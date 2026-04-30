"use client";

import { useFormStatus } from "react-dom";

interface Props {
  label: string;
  pendingLabel?: string;
  className?: string;
  pending?: boolean;
}

export default function SubmitButton({ label, pendingLabel = "Working…", className = "btn-primary flex-1", pending: pendingProp }: Props) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingProp ?? formPending;

  return (
    <button type="submit" disabled={pending} className={`${className} inline-flex items-center justify-center gap-1.5`}>
      {pending && (
        <svg className="animate-spin h-3.5 w-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {pending ? pendingLabel : label}
    </button>
  );
}
