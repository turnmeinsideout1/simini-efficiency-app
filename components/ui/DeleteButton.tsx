"use client";

import { useRouter } from "next/navigation";

interface Props {
  action: () => Promise<void>;
  confirm: string;
  className?: string;
  label?: string;
}

export default function DeleteButton({ action, confirm: confirmMsg, className, label = "Delete" }: Props) {
  const router = useRouter();

  async function handleClick() {
    if (!window.confirm(confirmMsg)) return;
    await action();
    router.refresh();
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {label}
    </button>
  );
}
