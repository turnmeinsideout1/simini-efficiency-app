"use client";

import { useFormStatus } from "react-dom";

interface Props {
  label: string;
  pendingLabel?: string;
  className?: string;
  pending?: boolean;
}

export default function SubmitButton({ label, pendingLabel = "Saving…", className = "btn-primary flex-1", pending: pendingProp }: Props) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingProp ?? formPending;

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}
